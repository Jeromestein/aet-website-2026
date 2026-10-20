import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  query: vi.fn(),
  createUser: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("../lib/staff/db", () => ({
  staffDb: () => {
    const sql = Object.assign(
      (parts: TemplateStringsArray, ...values: unknown[]) =>
        m.query(parts.join("?"), values),
      { begin: async (fn: (s: unknown) => unknown) => fn(sql) },
    );
    return sql;
  },
}));
vi.mock("../lib/staff/client", () => ({
  staffAdmin: () => ({ auth: { admin: { createUser: m.createUser } } }),
}));
vi.mock("../lib/staff/password", () => ({
  normalizeEmail: (s: string) => s.trim().toLowerCase(),
  verifyLegacyPassword: m.verify,
}));
import { prepareStaffIdentity } from "../lib/staff/migrate";
const base = {
  legacy_user_id: 10,
  migration_id: "marker",
  migration_state: "pending",
  hash: "hash",
  salt: "salt",
  auth_user_id: null,
};
function arrange(
  row: Record<string, unknown> | null = base,
  existing?: Record<string, unknown>,
) {
  m.query.mockImplementation(async (sql: string) =>
    sql.includes("select s.*")
      ? row
        ? [row]
        : []
      : sql.includes("select id,raw_app_meta_data")
        ? existing
          ? [existing]
          : []
        : [],
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STAFF_LEGACY_MIGRATION_ENABLED", "true");
  arrange();
  m.verify.mockResolvedValue(true);
  m.createUser.mockResolvedValue({
    data: { user: { id: "new-id" } },
    error: null,
  });
});
describe("one-way staff migration", () => {
  it("does not migrate while the explicit cutover switch is closed", async () => {
    vi.stubEnv("STAFF_LEGACY_MIGRATION_ENABLED", "false");
    expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
      "paused",
    );
    expect(m.createUser).not.toHaveBeenCalled();
    expect(m.verify).not.toHaveBeenCalled();
  });
  it("creates a confirmed account using the unchanged password", async () => {
    expect(await prepareStaffIdentity(" STAFF@example.com ", " old ")).toBe(
      "ready",
    );
    expect(m.createUser).toHaveBeenCalledWith({
      email: "staff@example.com",
      password: " old ",
      email_confirm: true,
      app_metadata: { aet_migration_id: "marker" },
    });
    expect(m.query).toHaveBeenCalledWith(
      expect.stringContaining("set hash=null"),
      [10],
    );
  });
  it("never checks or reapplies the legacy password after migration", async () => {
    arrange({ ...base, auth_user_id: "already", migration_state: "complete" });
    expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
      "ready",
    );
    expect(m.verify).not.toHaveBeenCalled();
    expect(m.createUser).not.toHaveBeenCalled();
  });
  it("accepts an explicitly mapped native account while migration stays disabled", async () => {
    vi.stubEnv("STAFF_LEGACY_MIGRATION_ENABLED", "false");
    arrange({ ...base, legacy_user_id: null, hash: null, salt: null, auth_user_id: "native", migration_state: "complete" });
    expect(await prepareStaffIdentity("native@example.com", "password")).toBe("ready");
    expect(m.verify).not.toHaveBeenCalled();
    expect(m.createUser).not.toHaveBeenCalled();
    expect(m.query).not.toHaveBeenCalledWith(expect.stringContaining("update public.users"), expect.anything());
  });
  it("never provisions an unlinked native account through the legacy password path", async () => {
    arrange({ ...base, legacy_user_id: null });
    expect(await prepareStaffIdentity("native@example.com", "password")).toBe("invalid");
    expect(m.verify).not.toHaveBeenCalled();
    expect(m.createUser).not.toHaveBeenCalled();
  });
  it("denies a wrong password", async () => {
    m.verify.mockResolvedValue(false);
    expect(await prepareStaffIdentity("staff@example.com", "wrong")).toBe(
      "invalid",
    );
    expect(m.createUser).not.toHaveBeenCalled();
  });
  it("honors old lockout state", async () => {
    arrange({ ...base, lock_until: new Date(Date.now() + 60000) });
    expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
      "invalid",
    );
    expect(m.createUser).not.toHaveBeenCalled();
  });
  it.each([null, { ...base, migration_state: "blocked" }])(
    "denies an absent or blocked employee",
    async (row) => {
      arrange(row);
      expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
        "invalid",
      );
    },
  );
  it("does not adopt an unrelated same-email identity", async () => {
    arrange(base, { id: "other", raw_app_meta_data: {} });
    expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
      "invalid",
    );
    expect(m.createUser).not.toHaveBeenCalled();
    expect(m.query).toHaveBeenCalledWith(
      expect.stringContaining("migration_state='blocked'"),
      [10],
    );
  });
  it("reconciles a lost response without writing another password", async () => {
    arrange(base, {
      id: "same",
      raw_app_meta_data: { aet_migration_id: "marker" },
    });
    expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
      "ready",
    );
    expect(m.verify).not.toHaveBeenCalled();
    expect(m.createUser).not.toHaveBeenCalled();
  });
  it("keeps old credentials when the new provider rejects the password", async () => {
    m.createUser.mockResolvedValue({
      data: {},
      error: { code: "weak_password" },
    });
    expect(await prepareStaffIdentity("staff@example.com", "old")).toBe(
      "password_update_required",
    );
    expect(m.query).not.toHaveBeenCalledWith(
      expect.stringContaining("set hash=null"),
      expect.anything(),
    );
  });
  it("requires the old password before accepting a replacement", async () => {
    await prepareStaffIdentity("staff@example.com", "old", "new password");
    expect(m.verify).toHaveBeenCalledWith("old", "salt", "hash");
    expect(m.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: "new password" }),
    );
  });
});
