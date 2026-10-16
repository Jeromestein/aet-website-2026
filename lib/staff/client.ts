import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { staffConfiguration, staffCookieOptions } from "./config";
export function staffAdmin() {
  const { url } = staffConfiguration();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Staff server credential is missing");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  });
}
export async function staffClient() {
  const store = await cookies();
  const { url, key } = staffConfiguration();
  return createServerClient(url, key, {
    cookieOptions: staffCookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* A Server Component cannot write cookies; proxy refreshes them first. */
        }
      },
    },
  });
}
