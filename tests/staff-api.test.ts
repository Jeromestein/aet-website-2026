import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  attempt: vi.fn(),
  prepare: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  session: vi.fn(),
  issue: vi.fn(),
  consume: vi.fn(),
  send: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ delete: m.remove }),
}));
vi.mock("../lib/staff/config", () => ({
  staffConfiguration: () => ({ origin: "http://localhost:3022" }),
}));
vi.mock("../lib/staff/client", () => ({
  staffClient: async () => ({
    auth: { signInWithPassword: m.signIn, signOut: m.signOut },
  }),
  staffAdmin: vi.fn(),
}));
vi.mock("../lib/staff/db", () => ({ staffDb: vi.fn() }));
vi.mock("../lib/staff/migrate", () => ({
  authAttempt: m.attempt,
  prepareStaffIdentity: m.prepare,
}));
vi.mock("../lib/staff/session", () => ({ staffSession: m.session }));
vi.mock("../lib/staff/recovery", () => ({
  issueRecovery: m.issue,
  consumeRecovery: m.consume,
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: m.send };
  },
}));
import { POST } from "../app/api/staff-auth/[action]/route";
function post(action: string, body: object, origin = "http://localhost:3022") {
  return POST(
    new Request(`http://localhost:3022/api/staff-auth/${action}`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ action }) },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  m.attempt.mockResolvedValue(true);
  m.prepare.mockResolvedValue("ready");
  m.signIn.mockResolvedValue({ error: null });
  m.signOut.mockResolvedValue({ error: null });
  m.session.mockResolvedValue({ email: "staff@example.com" });
  m.issue.mockResolvedValue(null);
  m.consume.mockResolvedValue(null);
  m.send.mockResolvedValue({ error: null });
});
describe("staff authentication HTTP boundaries", () => {
  it("rejects cross-origin mutation before touching credentials", async () => {
    expect(
      (
        await post(
          "login",
          { email: "staff@example.com", password: "password" },
          "https://outside.invalid",
        )
      ).status,
    ).toBe(403);
    expect(m.prepare).not.toHaveBeenCalled();
  });
  it("honors the migration pause without attempting Supabase sign-in", async () => {
    m.prepare.mockResolvedValue("paused");
    expect(
      (
        await post("login", {
          email: "staff@example.com",
          password: "password",
        })
      ).status,
    ).toBe(503);
    expect(m.signIn).not.toHaveBeenCalled();
  });
  it("denies an Auth user without active staff membership", async () => {
    m.session.mockResolvedValue(null);
    expect(
      (
        await post("login", {
          email: "staff@example.com",
          password: "password",
        })
      ).status,
    ).toBe(401);
    expect(m.signOut).toHaveBeenCalled();
  });
  it("preserves a password exactly and limits redirects", async () => {
    const result = await post("login", {
      email: "STAFF@example.com",
      password: " password 测试 ",
      redirect: "//outside.invalid",
    });
    expect(result.status).toBe(200);
    expect(m.signIn).toHaveBeenCalledWith({
      email: "staff@example.com",
      password: " password 测试 ",
    });
    expect(await result.json()).toEqual({ url: "/admin/CRM" });
    expect(m.remove).toHaveBeenCalledWith("payload-token");
  });
  it("blocks login before credentials are checked when rate limited", async () => {
    m.attempt.mockResolvedValue(false);
    expect(
      (
        await post("login", {
          email: "staff@example.com",
          password: "password",
        })
      ).status,
    ).toBe(429);
    expect(m.prepare).not.toHaveBeenCalled();
  });
  it("offers password replacement only after the migration verifier requests it", async () => {
    m.prepare.mockResolvedValue("password_update_required");
    const result = await post("login", {
      email: "staff@example.com",
      password: "password",
    });
    expect(result.status).toBe(400);
    expect((await result.json()).passwordUpdateRequired).toBe(true);
    expect(m.signIn).not.toHaveBeenCalled();
  });
  it("sends no recovery mail for an unknown or paused account", async () => {
    expect(
      (await post("forgot-password", { email: "unknown@example.com" })).status,
    ).toBe(200);
    expect(m.send).not.toHaveBeenCalled();
  });
  it("keeps mail delivery failures indistinguishable from unknown accounts", async () => {
    m.issue.mockResolvedValue("a".repeat(64));
    m.send.mockRejectedValue(new Error("mail unavailable"));
    const result = await post("forgot-password", {
      email: "staff@example.com",
    });
    expect(result.status).toBe(200);
    expect((await result.json()).sent).toBe(true);
  });
  it("sends recovery only to the requester with a fragment token and no copied recipients", async () => {
    m.issue.mockResolvedValue("a".repeat(64));
    await post("forgot-password", { email: "staff@example.com" });
    const message = m.send.mock.calls[0][0];
    expect(message.to).toBe("staff@example.com");
    expect(message.cc).toBeUndefined();
    expect(message.bcc).toBeUndefined();
    expect(message.html).toContain("/admin/reset-password#token=");
  });
  it("rejects an expired or used recovery token", async () => {
    expect(
      (
        await post("reset-password", {
          token: "a".repeat(64),
          password: "NewPassword!123",
        })
      ).status,
    ).toBe(400);
    expect(m.prepare).not.toHaveBeenCalled();
  });
  it("rejects oversized request bodies", async () => {
    expect(
      (
        await post("login", {
          email: "staff@example.com",
          password: "x".repeat(9000),
        })
      ).status,
    ).toBe(400);
    expect(m.prepare).not.toHaveBeenCalled();
  });
});
