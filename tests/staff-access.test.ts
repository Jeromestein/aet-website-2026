import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ rows: [] as { office: string | null }[] }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [] }),
}));
vi.mock("../lib/staff/client", () => ({ staffClient: vi.fn() }));
vi.mock("../lib/staff/db", () => ({ staffDb: vi.fn() }));
vi.mock("../lib/preeval/db", () => ({ db: () => async () => m.rows, table: (name: string) => name }));
import {
  canAccessOffice,
  requireStaffApplication,
  type StaffSession,
} from "../lib/staff/session";
const west: StaffSession = {
  id: "test",
  email: "fixture@example.invalid",
  role: "admin",
  staffRole: "staff",
  offices: ["Miami", "San Francisco", "Los Angeles"],
  include_unassigned: true,
};
beforeEach(() => {
  m.rows = [];
});
describe("server-side office authorization", () => {
  it("allows the approved western and Miami offices", () => {
    for (const office of west.offices)
      expect(canAccessOffice(west, office)).toBe(true);
  });
  it("denies eastern offices", () => {
    expect(canAccessOffice(west, "Boston")).toBe(false);
    expect(canAccessOffice(west, "New York")).toBe(false);
  });
  it("makes unassigned access explicit", () => {
    expect(canAccessOffice(west, null)).toBe(true);
    expect(canAccessOffice({ ...west, include_unassigned: false }, null)).toBe(
      false,
    );
  });
  it.each(["formal", "preeval"] as const)(
    "denies a cross-office %s detail or mutation",
    async (kind) => {
      m.rows = [{ office: "Boston" }];
      await expect(
        requireStaffApplication(kind, "id", west),
      ).rejects.toMatchObject({ status: 403 });
    },
  );
  it("denies missing applications", async () => {
    await expect(
      requireStaffApplication("formal", "id", west),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("allows an authorized application", async () => {
    m.rows = [{ office: "Miami" }];
    expect(await requireStaffApplication("formal", "id", west)).toBe(west);
  });
});
