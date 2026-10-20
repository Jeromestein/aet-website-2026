import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applicationPilotOrigin, cloudBusinessEnvironmentAllowed, requestMatchesApplicationOrigin } from "../lib/preview-environment";
import { configuration, CLOUD_PROJECT, PREVIEW_ROLE } from "../lib/preeval/config";
import { staffConfiguration, staffCookieOptions } from "../lib/staff/config";

const host = "aet-website-2026-git-dev-example.vercel.app";
const origin = `https://${host}`;
const deployment = "https://aet-website-2026-example.vercel.app";
beforeEach(() => {
  for (const [key, value] of Object.entries({
    PREEVAL_ENV: "preview", PREEVAL_ORIGIN: origin, PREEVAL_DATABASE_MODE: "cloud-preview",
    VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "dev",
    VERCEL_BRANCH_URL: host, VERCEL_URL: deployment.slice(8),
    STAFF_LEGACY_MIGRATION_ENABLED: "false", STAFF_AUTH_CUTOVER_ENABLED: "false",
    PREEVAL_DATABASE_URL: `postgresql://${PREVIEW_ROLE}.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    PREEVAL_ADMIN_EMAIL: "admin@example.invalid", PREEVAL_TEST_EMAIL: "test@example.invalid",
    SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "test", STAFF_AUTH_DATABASE_URL: "test",
  })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());

describe("dev Preview environment boundaries", () => {
  it("supports cloud business records and secure staff cookies on dev", () => {
    expect(configuration()).toMatchObject({ origin, cloudPreview: true });
    expect(cloudBusinessEnvironmentAllowed()).toBe(true);
    expect(staffConfiguration().origin).toBe(origin);
    expect(staffCookieOptions().secure).toBe(true);
  });
  it("allows forms on the exact branch and deployment URLs", () => {
    expect(requestMatchesApplicationOrigin(origin, origin)).toBe(true);
    expect(requestMatchesApplicationOrigin(deployment, origin)).toBe(true);
  });
  it.each([null, "https://other.vercel.app", "https://evil.invalid", `${origin}.evil.invalid`, `http://${host}`, "null"])("rejects an untrusted form origin %s", value => {
    expect(requestMatchesApplicationOrigin(value, origin)).toBe(false);
  });
  it.each([
    ["VERCEL_ENV", "production"], ["VERCEL_GIT_COMMIT_REF", "main"], ["VERCEL", ""],
    ["STAFF_LEGACY_MIGRATION_ENABLED", "true"], ["STAFF_AUTH_CUTOVER_ENABLED", "true"],
    ["PREEVAL_DATABASE_MODE", "local"], ["PREEVAL_ENV", "local"],
    ["VERCEL_BRANCH_URL", "other.vercel.app"], ["VERCEL_BRANCH_URL", ""],
  ])("blocks unsafe deployment setting %s=%s", (key, value) => {
    vi.stubEnv(key, value);
    expect(() => configuration()).toThrow();
    expect(() => cloudBusinessEnvironmentAllowed()).toThrow();
    expect(() => staffConfiguration()).toThrow();
  });
  it.each([`${origin}/path`, `${origin}?x=1`, `${origin}#fragment`, `https://user:pass@${host}`, "http://localhost:3022", "https://app.americantranslationservice.com"])("rejects invalid hosted origin %s", value => {
    vi.stubEnv("PREEVAL_ORIGIN", value);
    expect(() => applicationPilotOrigin()).toThrow();
  });
  it("does not allow a privileged database role in Preview", () => {
    vi.stubEnv("PREEVAL_DATABASE_URL", `postgresql://postgres.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
    expect(() => configuration()).toThrow();
  });
  it("preserves the local 3022 flow", () => {
    vi.stubEnv("VERCEL", ""); vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("PREEVAL_ENV", "local"); vi.stubEnv("PREEVAL_ORIGIN", "http://localhost:3022");
    expect(configuration().origin).toBe("http://localhost:3022");
    expect(cloudBusinessEnvironmentAllowed()).toBe(true);
    expect(staffCookieOptions().secure).toBe(false);
    expect(requestMatchesApplicationOrigin(deployment, "http://localhost:3022")).toBe(false);
  });
});
