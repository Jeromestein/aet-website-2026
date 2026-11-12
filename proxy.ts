import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const localizedMiddleware = createMiddleware(routing);
// The public calendar stays English-only without changing the website locale.
const calendarMiddleware = createMiddleware({
  ...routing,
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "never",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});
const englishLegalMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (/^\/(?:(?:en|zh|es)\/)?admin\/calendar\/?$/.test(pathname)) {
    if (pathname !== "/admin/calendar") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/calendar";
      return NextResponse.redirect(url, 308);
    }
    const response = calendarMiddleware(request);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  // Legal documents are English-only, without changing the saved site language.
  return /^\/(?:en\/)?(?:privacy|terms)\/?$/.test(request.nextUrl.pathname)
    ? englishLegalMiddleware(request)
    : localizedMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
