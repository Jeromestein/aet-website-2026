export function staffConfiguration() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  const database = process.env.STAFF_AUTH_DATABASE_URL;
  if (!url || !key || !database)
    throw new Error("Staff authentication is not configured");
  return { url, key, database, origin: process.env.PREEVAL_ORIGIN || "" };
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
