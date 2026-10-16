import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import {
  staffConfiguration,
  staffCookieName,
  staffCookieOptions,
} from "./config";
export async function refreshStaff(request: NextRequest) {
  const pending: { name: string; value: string; options: CookieOptions }[] = [];
  if (
    request.cookies
      .getAll()
      .some(
        (c) =>
          c.name === staffCookieName ||
          c.name.startsWith(staffCookieName + "."),
      )
  ) {
    const { url, key } = staffConfiguration();
    const client = createServerClient(url, key, {
      cookieOptions: staffCookieOptions(),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach((v) => request.cookies.set(v.name, v.value));
          pending.push(...values);
        },
      },
    });
    await client.auth.getUser();
  }
  return (response: NextResponse) => {
    pending.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  };
}
