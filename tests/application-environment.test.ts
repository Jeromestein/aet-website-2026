import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { environmentValue } from "../lib/application-environment.mjs";
import { configuration, required, CLOUD_PROJECT, PREVIEW_ROLE } from "../lib/preeval/config";
import { applicationPilotOrigin } from "../lib/preview-environment";
import { staffConfiguration, staffCookieOptions } from "../lib/staff/config";

const aliases = [
  ["APP_ENV", "PREEVAL_ENV"],
  ["APP_ORIGIN", "PREEVAL_ORIGIN"],
  ["APPLICATION_DATABASE_MODE", "PREEVAL_DATABASE_MODE"],
  ["APPLICATION_DATABASE_URL", "PREEVAL_DATABASE_URL"],
  ["APPLICATION_TEST_EMAIL", "PREEVAL_TEST_EMAIL"],
  ["DROPBOX_LEGACY_PILOT_ROOT", "PREEVAL_DROPBOX_ROOT"],
] as const;

beforeEach(() => {
  for (const pair of aliases) for (const key of pair) vi.stubEnv(key, undefined);
  vi.stubEnv("VERCEL", undefined);
  vi.stubEnv("VERCEL_ENV", undefined);
  vi.stubEnv("STAFF_LEGACY_MIGRATION_ENABLED", "false");
  vi.stubEnv("STAFF_AUTH_CUTOVER_ENABLED", "false");
  vi.stubEnv("SUPABASE_URL", "https://auth.example.invalid");
  vi.stubEnv("SUPABASE_ANON_KEY", "synthetic-anon-key");
  vi.stubEnv("STAFF_AUTH_DATABASE_URL", "postgresql://test:test@localhost/staff");
});
afterEach(() => vi.unstubAllEnvs());

function pilot(names: "new" | "legacy") {
  const values = ["local", "http://localhost:3022", "cloud-preview",
    `postgresql://${PREVIEW_ROLE}.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    "test@example.invalid", "/Team Files/WebsitesDev/AET-PreEvaluation-Test"];
  aliases.forEach((pair, i) => vi.stubEnv(pair[names === "new" ? 0 : 1], values[i]));
}

describe("application environment compatibility", () => {
  it.each(aliases)("resolves %s with fallback %s and explicit-empty precedence", (name, old) => {
    expect(environmentValue(name)).toBeUndefined();
    vi.stubEnv(old, "legacy-value");
    expect(environmentValue(name)).toBe("legacy-value");
    expect(process.env[name]).toBeUndefined();
    vi.stubEnv(name, "new-value");
    expect(environmentValue(name)).toBe("new-value");
    vi.stubEnv(name, "");
    expect(environmentValue(name)).toBe("");
    expect(() => required(name)).toThrow(`Missing configuration: ${name}`);
    vi.stubEnv(name, undefined);
    expect(environmentValue(name)).toBe("legacy-value");
  });

  it.each(["new", "legacy"] as const)("accepts a complete %s configuration through real pilot and staff readers", names => {
    pilot(names);
    expect(configuration()).toMatchObject({ origin: "http://localhost:3022", cloudPreview: true, recipient: "test@example.invalid" });
    expect(configuration()).not.toHaveProperty("admin");
    expect(staffConfiguration().origin).toBe("http://localhost:3022");
    expect(staffCookieOptions().secure).toBe(false);
    expect(required("DROPBOX_LEGACY_PILOT_ROOT")).toContain("AET-PreEvaluation-Test");
  });


  it.each(["new", "legacy"] as const)("accepts approved hosted Preview and rejects Production with %s names", names => {
    pilot(names);
    const host = "aet-website-2026-git-dev-example.vercel.app";
    const origin = `https://${host}`;
    vi.stubEnv(names === "new" ? "APP_ENV" : "PREEVAL_ENV", "preview");
    vi.stubEnv(names === "new" ? "APP_ORIGIN" : "PREEVAL_ORIGIN", origin);
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_GIT_COMMIT_REF", "dev");
    vi.stubEnv("VERCEL_BRANCH_URL", host);
    expect(configuration().origin).toBe(origin);
    expect(staffConfiguration().origin).toBe(origin);
    expect(staffCookieOptions().secure).toBe(true);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => configuration()).toThrow();
    expect(() => staffConfiguration()).toThrow();
  });

  it("supports partially migrated configurations", () => {
    pilot("legacy");
    vi.stubEnv("APPLICATION_TEST_EMAIL", "new@example.invalid");
    expect(configuration().recipient).toBe("new@example.invalid");
    expect(applicationPilotOrigin()).toBe("http://localhost:3022");
  });

  it("does not let a safe old value rescue an invalid new database or origin", () => {
    pilot("legacy");
    vi.stubEnv("APPLICATION_DATABASE_URL", `postgresql://postgres.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
    expect(() => configuration()).toThrow("restricted project role");
    vi.stubEnv("APPLICATION_DATABASE_URL", undefined);
    vi.stubEnv("APP_ORIGIN", "https://unapproved.example.invalid");
    expect(() => configuration()).toThrow();
    expect(staffConfiguration().origin).toBe("https://unapproved.example.invalid");
    expect(staffCookieOptions().secure).toBe(true);
  });

  it("keeps the legacy-only database-role and origin restrictions", () => {
    pilot("legacy");
    vi.stubEnv("PREEVAL_DATABASE_URL", `postgresql://postgres.${CLOUD_PROJECT}:test@aws-0-us-west-1.pooler.supabase.com:6543/postgres`);
    expect(() => configuration()).toThrow("restricted project role");
    vi.stubEnv("PREEVAL_ORIGIN", "https://unapproved.example.invalid");
    expect(() => applicationPilotOrigin()).toThrow();
  });

  it("works in standalone Node without a TypeScript loader or Next startup", () => {
    const moduleUrl = new URL("../lib/application-environment.mjs", import.meta.url).href;
    const script = `import { environmentValue } from ${JSON.stringify(moduleUrl)}; process.stdout.write(environmentValue("APP_ORIGIN") ?? "missing");`;
    for (const env of [{ PREEVAL_ORIGIN: "http://localhost:3022" }, { APP_ORIGIN: "http://localhost:3022", PREEVAL_ORIGIN: "https://old.example.invalid" }]) {
      expect(execFileSync(process.execPath, ["--input-type=module", "-e", script], { env: { ...env, NODE_ENV: "test" }, encoding: "utf8" })).toBe("http://localhost:3022");
    }
  });
});
