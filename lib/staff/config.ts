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
    process.env.PREEVAL_ENV !== "preview"
  )) throw new Error("Hosted staff authentication requires the dev Preview environment");
  const origin = process.env.PREEVAL_ENV === "preview"
    ? applicationPilotOrigin() : process.env.PREEVAL_ORIGIN || "";
  return { url, key, database, origin };
}
export const staffCookieName = "aet_staff_auth";
export function staffCookieOptions() {
  return {
    name: staffCookieName,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: (process.env.PREEVAL_ORIGIN || "").startsWith("https:"),
    path: "/",
  };
}
