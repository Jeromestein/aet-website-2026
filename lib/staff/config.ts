import { environmentValue } from "../application-environment.mjs";

import { applicationPilotOrigin } from "../preview-environment";

function staffProductionOrigin() {
  const origin = new URL(environmentValue("APP_ORIGIN") || "");
  if (process.env.VERCEL_GIT_COMMIT_REF !== "main" || environmentValue("APP_ENV") !== "production" ||
      origin.protocol !== "https:" || origin.port || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash ||
      !["americantranslationservice.com", "www.americantranslationservice.com", "app.americantranslationservice.com"].includes(origin.hostname) ||
      process.env.STAFF_LEGACY_MIGRATION_ENABLED !== "false" || process.env.STAFF_AUTH_CUTOVER_ENABLED !== "false")
    throw new Error("Staff login requires an approved Production origin and unchanged employee cutover");
  return origin.origin;
}
export function staffConfiguration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const database = process.env.STAFF_AUTH_DATABASE_URL;
  if (!url || !key || !database)
    throw new Error("Staff authentication is not configured");
  const production = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
  // Membership and employee-cutover rules remain unchanged.
  if (!production && process.env.VERCEL && (
    process.env.VERCEL_ENV !== "preview" ||
    environmentValue("APP_ENV") !== "preview"
  )) throw new Error("Hosted staff authentication requires the configured Preview environment");
  const origin = production ? staffProductionOrigin() : environmentValue("APP_ENV") === "preview"
    ? applicationPilotOrigin() : environmentValue("APP_ORIGIN") || "";
  return { url, key, database, origin };
}
export const staffCookieName = "aet_staff_auth";
export function staffCookieOptions() {
  return {
    name: staffCookieName,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (environmentValue("APP_ORIGIN") || "").startsWith("https:"),
    path: "/",
  };
}
