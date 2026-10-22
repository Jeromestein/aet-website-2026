import { environmentValue } from "../application-environment.mjs";
import { applicationPilotOrigin } from "../preview-environment";

export function staffConfiguration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const database = process.env.STAFF_AUTH_DATABASE_URL;
  if (!url || !key || !database)
    throw new Error("Staff authentication is not configured");
  // Hosted authentication is permitted only for the explicitly configured dev Preview.
  if (process.env.VERCEL && (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "dev" ||
    environmentValue("APP_ENV") !== "preview"
  )) throw new Error("Hosted staff authentication requires the dev Preview environment");
  const origin = environmentValue("APP_ENV") === "preview"
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
