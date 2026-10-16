import { describe, expect, it } from "vitest";
import { pbkdf2Sync } from "node:crypto";
import {
  normalizeEmail,
  verifyLegacyPassword,
  safeStaffRedirect,
} from "../lib/staff/password";
const salt = "a1".repeat(32),
  password = "  Original 密码  ";
const hash = pbkdf2Sync(password, salt, 25000, 512, "sha256").toString("hex");
describe("legacy password compatibility", () => {
  it("preserves whitespace and Unicode", async () =>
    expect(await verifyLegacyPassword(password, salt, hash)).toBe(true));
  it("rejects an altered password", async () =>
    expect(await verifyLegacyPassword(password.trim(), salt, hash)).toBe(
      false,
    ));
  it.each([
    ["bad", hash],
    [salt, "bad"],
  ])("rejects malformed stored credentials", async (s, h) =>
    expect(await verifyLegacyPassword(password, s, h)).toBe(false),
  );
  it("normalizes only the email", () =>
    expect(normalizeEmail(" Tech@Example.com ")).toBe("tech@example.com"));
});
describe("staff return URLs", () => {
  it.each([
    "https://other.example/",
    "//other.example/",
    "/admin/CRM/../../api/anything",
    "/admin/login",
    "/admin/CRM\\bad",
    "/admin/CRM\nheader",
  ])("rejects unsafe return path %s", (value) =>
    expect(safeStaffRedirect(value)).toBe("/admin/CRM"),
  );
  it.each(["/admin/CRM?tab=applications", "/admin/evaluations/123"])(
    "retains approved path %s",
    (value) => expect(safeStaffRedirect(value)).toBe(value),
  );
});
