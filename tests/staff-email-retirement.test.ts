import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock('server-only',()=>({}));
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
import { makeLink, session, authorize } from "../lib/preeval/auth";

beforeEach(() => { vi.resetAllMocks(); m.staff.mockResolvedValue(null); m.query.mockResolvedValue([]); });
describe("password-only staff access", () => {
  it("preserves the verified staff session and its office permissions", async () => {
    const staff = { role: "admin", offices: ["Miami"], include_unassigned: false };
    m.staff.mockResolvedValue(staff);
    expect(await session()).toBe(staff);
    expect(m.query).not.toHaveBeenCalled();
  });
  it("ignores legacy customer and administrator cookies without querying session tables", async () => {
    m.query.mockResolvedValue([{ role: "customer", application_id: "application-1" }]);
    expect(await session()).toBeNull();
    await expect(authorize()).rejects.toMatchObject({status:401});
    expect(m.query).not.toHaveBeenCalled();
  });
  it("rejects issuing a staff link before any write", async () => {
    await expect(makeLink(null, "admin" as never, "staff@example.invalid", "en")).rejects.toMatchObject({ status: 403 });
    expect(m.query).not.toHaveBeenCalled();
  });
});
