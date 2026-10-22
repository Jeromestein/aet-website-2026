import { environmentValue } from "./application-environment.mjs";
/** Trust deployment configuration, never a request Host or forwarded header. */
function parsedOrigin(value: string) {
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash)
    throw new Error("Application origin must contain only a scheme and host");
  return url;
}

export function employeeLoginUnchanged() {
  return process.env.STAFF_LEGACY_MIGRATION_ENABLED === "false" &&
    process.env.STAFF_AUTH_CUTOVER_ENABLED === "false";
}

function vercelDevPreview() {
  return environmentValue("APP_ENV") === "preview" &&
    process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "dev" &&
    environmentValue("APPLICATION_DATABASE_MODE") === "cloud-preview" && employeeLoginUnchanged();
}

function vercelOrigin(host: string | undefined) {
  if (!host || !/^[a-z0-9-]+\.vercel\.app$/.test(host))
    throw new Error("Expected an exact Vercel deployment hostname");
  return `https://${host}`;
}

export function applicationPilotOrigin() {
  const url = parsedOrigin(environmentValue("APP_ORIGIN") || "");
  if (environmentValue("APP_ENV") === "local" && !process.env.VERCEL &&
      !process.env.VERCEL_ENV && ["localhost", "127.0.0.1"].includes(url.hostname) &&
      ["http:", "https:"].includes(url.protocol)) return url.origin;
  if (vercelDevPreview() && url.origin === vercelOrigin(process.env.VERCEL_BRANCH_URL))
    return url.origin;
  throw new Error("Application pilot requires local testing or the configured dev Preview");
}

export function cloudBusinessEnvironmentAllowed() {
  const origin = applicationPilotOrigin();
  return employeeLoginUnchanged() &&
    (origin === "http://localhost:3022" || vercelDevPreview());
}

/** The stable branch URL and this exact deployment URL can both submit forms. */
export function requestMatchesApplicationOrigin(origin: string | null, configured: string) {
  if (!origin) return false;
  if (environmentValue("APP_ENV") !== "preview") return origin === configured;
  const canonical = applicationPilotOrigin();
  if (configured !== canonical) return false;
  if (origin === canonical) return true;
  return Boolean(process.env.VERCEL_URL) && origin === vercelOrigin(process.env.VERCEL_URL);
}
