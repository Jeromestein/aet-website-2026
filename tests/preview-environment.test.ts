import { corePreviewConfiguration } from '../lib/application-core/connection';
vi.mock('server-only', () => ({}));
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applicationPilotOrigin, cloudBusinessEnvironmentAllowed, requestMatchesApplicationOrigin } from "../lib/preview-environment";
import { configuration, CLOUD_PROJECT, PREVIEW_ROLE } from "../lib/preeval/config";
import { staffConfiguration, staffCookieOptions } from "../lib/staff/config";

const host = "aet-website-2026-git-dev-example.vercel.app";
const origin = `https://${host}`;
const deployment = "https://aet-website-2026-example.vercel.app";
beforeEach(() => {
  for (const [key, value] of Object.entries({
    APP_ENV: "preview", APP_ORIGIN: origin, APPLICATION_DATABASE_MODE: "cloud-preview",
    VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "dev",
    VERCEL_BRANCH_URL: host, VERCEL_URL: deployment.slice(8),
    APPLICATION_PREVIEW_ALIAS: "",
    STAFF_LEGACY_MIGRATION_ENABLED: "false", STAFF_AUTH_CUTOVER_ENABLED: "false",
    APPLICATION_DATABASE_URL: `postgresql://${PREVIEW_ROLE}.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    APPLICATION_TEST_EMAIL: "test@example.invalid",
    SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "test", STAFF_AUTH_DATABASE_URL: "test",
  })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());

describe("configured Preview environment boundaries", () => {
  it("uses a dedicated main Preview alias without trusting its production branch alias", () => {
    const alias = "aet-main-preview-example.vercel.app";
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "main");
    vi.stubEnv("APPLICATION_PREVIEW_ALIAS", alias);
    vi.stubEnv("APP_ORIGIN", `https://${alias}`);
    expect(staffConfiguration().origin).toBe(`https://${alias}`);
    expect(cloudBusinessEnvironmentAllowed()).toBe(true);
    expect(requestMatchesApplicationOrigin(`https://${alias}`, `https://${alias}`)).toBe(true);
    expect(requestMatchesApplicationOrigin(deployment, `https://${alias}`)).toBe(true);
    expect(requestMatchesApplicationOrigin(origin, `https://${alias}`)).toBe(false);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => applicationPilotOrigin()).toThrow();
  });
  it.each(["other.vercel.app", "https://example.vercel.app", "example.com", "example.vercel.app.evil.invalid", "user@example.vercel.app"])("rejects mismatched or invalid configured alias %s", alias => {
    vi.stubEnv("APPLICATION_PREVIEW_ALIAS", alias);
    expect(() => applicationPilotOrigin()).toThrow();
  });
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
    ["VERCEL_ENV", "production"], ["VERCEL", ""],
    ["STAFF_LEGACY_MIGRATION_ENABLED", "true"], ["STAFF_AUTH_CUTOVER_ENABLED", "true"],
    ["APPLICATION_DATABASE_MODE", "local"], ["APP_ENV", "local"],
    ["VERCEL_BRANCH_URL", "other.vercel.app"], ["VERCEL_BRANCH_URL", ""],
  ])("blocks unsafe deployment setting %s=%s", (key, value) => {
    vi.stubEnv(key, value);
    expect(() => configuration()).toThrow();
    expect(() => cloudBusinessEnvironmentAllowed()).toThrow();
    expect(() => staffConfiguration()).toThrow();
  });
  it.each([`${origin}/path`, `${origin}?x=1`, `${origin}#fragment`, `https://user:pass@${host}`, "http://localhost:3022", "https://app.americantranslationservice.com"])("rejects invalid hosted origin %s", value => {
    vi.stubEnv("APP_ORIGIN", value);
    expect(() => applicationPilotOrigin()).toThrow();
  });
  it("does not allow a privileged database role in Preview", () => {
    vi.stubEnv("APPLICATION_DATABASE_URL", `postgresql://postgres.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
    expect(() => configuration()).toThrow();
  });
  it("preserves the local 3022 flow", () => {
    vi.stubEnv("VERCEL", ""); vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("APP_ENV", "local"); vi.stubEnv("APP_ORIGIN", "http://localhost:3022");
    expect(configuration().origin).toBe("http://localhost:3022");
    expect(cloudBusinessEnvironmentAllowed()).toBe(true);
    expect(staffCookieOptions().secure).toBe(false);
    expect(requestMatchesApplicationOrigin(deployment, "http://localhost:3022")).toBe(false);
  });
});

describe('core Preview opt-in', () => {
  it('stays disabled unless explicitly configured', () => {
    vi.stubEnv('APPLICATION_CORE_MODE','');
    expect(corePreviewConfiguration()).toBeNull();
  });
  it('requires both a verified account and hosted dev Preview', () => {
    vi.stubEnv('APPLICATION_CORE_MODE','preview');
    vi.stubEnv('APPLICATION_CORE_PROVIDER_ACCOUNT','acct_synthetic');
    expect(corePreviewConfiguration()).toEqual({providerAccount:'acct_synthetic',sixTables:false});
    vi.stubEnv('VERCEL_ENV','production');
    expect(corePreviewConfiguration).toThrow();
  });
  it.each(['production','unknown'])('rejects mode %s', mode => {
    vi.stubEnv('APPLICATION_CORE_MODE',mode);expect(corePreviewConfiguration).toThrow();
  });
});
