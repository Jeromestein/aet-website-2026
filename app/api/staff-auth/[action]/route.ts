import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { staffConfiguration } from "@/lib/staff/config";
import { requestMatchesApplicationOrigin } from "@/lib/preview-environment";
import { staffClient } from "@/lib/staff/client";
import { authAttempt, prepareStaffIdentity } from "@/lib/staff/migrate";
import { normalizeEmail, safeStaffRedirect } from "@/lib/staff/password";
import { staffSession } from "@/lib/staff/session";
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
      !requestMatchesApplicationOrigin(request.headers.get("origin"), origin) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return json({ error: "Access denied." }, 403);
    const { action } = await params;
    if (action !== "login" && action !== "logout")
      return json({ error: "Not found." }, 404);
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
