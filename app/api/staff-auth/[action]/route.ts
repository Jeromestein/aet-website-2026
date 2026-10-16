import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";
import { staffConfiguration } from "@/lib/staff/config";
import { staffClient, staffAdmin } from "@/lib/staff/client";
import { staffDb } from "@/lib/staff/db";
import { authAttempt, prepareStaffIdentity } from "@/lib/staff/migrate";
import { normalizeEmail, safeStaffRedirect } from "@/lib/staff/password";
import { staffSession } from "@/lib/staff/session";
import { issueRecovery, consumeRecovery } from "@/lib/staff/recovery";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
const invalid = () =>
  json({ error: "Unable to sign in. Check your email and password." }, 401);
async function read(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
async function allowed(email: string, action: string, request: Request) {
  const ip = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for") || "unknown"
    : "local";
  return (
    (await authAttempt(action + ":ip:" + ip, 50)) &&
    (await authAttempt(action + ":email:" + email, 10))
  );
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { origin } = staffConfiguration();
    if (
      request.headers.get("origin") !== origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return json({ error: "Access denied." }, 403);
    const { action } = await params;
    if (action === "logout") {
      const { error } = await (
        await staffClient()
      ).auth.signOut({ scope: "local" });
      if (error) throw new Error("Sign out failed");
      return json({ url: "/admin/login" });
    }
    let body;
    try {
      body = await read(request);
    } catch {
      return json({ error: "Invalid request." }, 400);
    }
    if (action === "login") {
      const parsed = z
        .object({
          email: z.email().max(254),
          password: z.string().min(1).max(1024),
          replacement: z.string().max(1024).optional(),
          redirect: z.string().max(2048).optional(),
        })
        .safeParse(body);
      if (!parsed.success) return invalid();
      const { password, replacement, redirect } = parsed.data,
        email = normalizeEmail(parsed.data.email);
      if (!(await allowed(email, action, request)))
        return json(
          { error: "Too many attempts. Please try again in 15 minutes." },
          429,
        );
      const result = await prepareStaffIdentity(email, password, replacement);
      if (result === "paused")
        return json(
          {
            error:
              "Staff sign-in is not available here yet. Please use your current workspace.",
          },
          503,
        );
      if (result === "password_update_required")
        return json(
          {
            error:
              "Your password needs an update. Enter your current password and choose a new one below.",
            passwordUpdateRequired: true,
          },
          400,
        );
      if (result !== "ready") return invalid();
      const client = await staffClient();
      const { error } = await client.auth.signInWithPassword({
        email,
        password: replacement || password,
      });
      if (error || !(await staffSession())) {
        await client.auth.signOut({ scope: "local" });
        return invalid();
      }
      (await cookies()).delete("payload-token");
      return json({ url: safeStaffRedirect(redirect) });
    }
    if (action === "forgot-password") {
      const response = {
        sent: true,
        message:
          "If this email has staff access, a reset link will arrive shortly.",
      };
      const parsed = z.object({ email: z.email().max(254) }).safeParse(body);
      if (!parsed.success) return json(response);
      const email = normalizeEmail(parsed.data.email);
      if (!(await allowed(email, action, request))) return json(response);
      try {
        const token = await issueRecovery(email);
        if (token) {
          const url = new URL("/admin/reset-password", origin);
          url.hash = "token=" + token;
          const result = await new Resend(
            process.env.RESEND_API_KEY,
          ).emails.send({
            from: `${process.env.RESEND_DEFAULT_FROM_NAME} <${process.env.RESEND_DEFAULT_FROM_ADDRESS}>`,
            to: email,
            subject: "Reset your AET staff password",
            html: `<p>You requested a password reset for AET Staff.</p><p><a href="${url.href}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>`,
          });
          // Do not reveal whether a roster entry exists or delivery succeeded.
          if (result.error) return json(response);
        }
      } catch {
        /* Delivery failures must not disclose roster membership. */
      }
      return json(response);
    }
    if (action === "reset-password") {
      const parsed = z
        .object({
          token: z.string().regex(/^[a-f0-9]{64}$/),
          password: z.string().min(8).max(1024),
        })
        .safeParse(body);
      if (!parsed.success)
        return json(
          {
            error:
              "Choose a password with at least 8 characters and use a valid reset link.",
          },
          400,
        );
      const { token, password } = parsed.data;
      if (!(await allowed(token, action, request)))
        return json(
          { error: "Too many attempts. Please try again in 15 minutes." },
          429,
        );
      const email = await consumeRecovery(token);
      if (!email)
        return json(
          { error: "This reset link has expired. Request a new one." },
          400,
        );
      if (
        (await prepareStaffIdentity(email, password, undefined, true)) !==
        "ready"
      )
        return json(
          {
            error:
              "Unable to reset your password. Request a new link or contact your administrator.",
          },
          400,
        );
      const [account] =
        await staffDb()`select auth_user_id from aet_private.staff_accounts where email=${email} and active`;
      if (!account?.auth_user_id) return invalid();
      const { error } = await staffAdmin().auth.admin.updateUserById(
        account.auth_user_id,
        { password },
      );
      if (error)
        return json(
          {
            error:
              "This password could not be saved. Request a new reset link and choose a strong password.",
          },
          400,
        );
      await staffDb()`update aet_private.password_recovery set consumed_at=now() where (staff_id=(select migration_id from aet_private.staff_accounts where email=${email}) or legacy_user_id=(select legacy_user_id from aet_private.staff_accounts where email=${email})) and consumed_at is null`;
      const result = await (
        await staffClient()
      ).auth.signInWithPassword({ email, password });
      if (result.error || !(await staffSession())) return invalid();
      (await cookies()).delete("payload-token");
      return json({ url: "/admin/CRM" });
    }
    return json({ error: "Not found." }, 404);
  } catch {
    // Never log passwords, tokens, Auth request bodies, or database credentials.
    return json(
      {
        error: "Sign-in is temporarily unavailable. Please try again shortly.",
      },
      503,
    );
  }
}
