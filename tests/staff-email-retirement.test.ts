import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ query: vi.fn(), staff: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "a".repeat(43) }) }) }));
vi.mock("../lib/staff/session", () => ({ staffSession: m.staff, requireStaffApplication: vi.fn() }));
vi.mock("../lib/preeval/config", () => ({ configuration: () => ({ origin: "http://localhost:3022" }) }));
vi.mock("../lib/preeval/db", () => {
  const sql = Object.assign((parts: TemplateStringsArray, ...values: unknown[]) => m.query(parts.join("?"), values), {
    begin: async (fn: (query: unknown) => unknown) => fn(sql),
  });
  return { db: () => sql, table: (name: string) => name };
});
import { consumeLink, makeLink, makeSession, session } from "../lib/preeval/auth";

beforeEach(() => { vi.resetAllMocks(); m.staff.mockResolvedValue(null); m.query.mockResolvedValue([]); });
describe("password-only staff access", () => {
  it("preserves the verified staff session and its office permissions", async () => {
    const staff = { role: "admin", offices: ["Miami"], include_unassigned: false };
    m.staff.mockResolvedValue(staff);
    expect(await session()).toBe(staff);
    expect(m.query).not.toHaveBeenCalled();
  });
  it("rejects a legacy administrator cookie", async () => {
    m.query.mockResolvedValue([{ role: "admin" }]);
    expect(await session()).toBeNull();
    expect(m.query.mock.calls[0][0]).toContain("role='customer'");
  });
  it("preserves a customer session", async () => {
    m.query.mockResolvedValue([{ role: "customer", application_id: "application-1" }]);
    expect(await session()).toMatchObject({ role: "customer", application_id: "application-1" });
  });
  it("rejects issuing staff tokens and legacy sessions before a write", async () => {
    await expect(makeLink(null, "admin" as never, "staff@example.invalid", "en")).rejects.toMatchObject({ status: 403 });
    await expect(makeSession(null, "admin" as never, "staff@example.invalid")).rejects.toMatchObject({ status: 403 });
    expect(m.query).not.toHaveBeenCalled();
  });
  it("rejects an old administrator link before creating a session", async () => {
    m.query.mockResolvedValue([{ role: "admin" }]);
    await expect(consumeLink("a".repeat(43))).rejects.toMatchObject({ code: "invalid_link" });
    expect(m.query).toHaveBeenCalledTimes(1);
    expect(m.query.mock.calls[0][0]).toContain("role='customer'");
  });
  it("still consumes a valid customer link", async () => {
    m.query.mockResolvedValueOnce([{ role: "customer", application_id: "application-1", email: "customer@example.invalid", locale: "en" }]);
    expect((await consumeLink("a".repeat(43))).row.role).toBe("customer");
    expect(m.query).toHaveBeenCalledTimes(2);
  });
});
