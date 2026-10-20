import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  attempt: vi.fn(),
  prepare: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  session: vi.fn(),
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
}));
vi.mock("../lib/staff/migrate", () => ({
  authAttempt: m.attempt,
  prepareStaffIdentity: m.prepare,
}));
vi.mock("../lib/staff/session", () => ({ staffSession: m.session }));
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
  it.each(["forgot-password", "reset-password"])(
    "rejects removed %s actions without accessing credentials",
    async (action) => {
      const result = await post(action, {
        email: "staff@example.com",
        token: "a".repeat(64),
        password: "NewPassword!123",
      });
      expect(result.status).toBe(404);
      expect(await result.json()).toEqual({ error: "Not found." });
      expect(m.attempt).not.toHaveBeenCalled();
      expect(m.prepare).not.toHaveBeenCalled();
      expect(m.signIn).not.toHaveBeenCalled();
      expect(m.remove).not.toHaveBeenCalled();
    },
  );
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
