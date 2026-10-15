import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse, type NextRequest } from "next/server";

const localizedMiddleware = createMiddleware(routing);
const staffMiddleware = createMiddleware({
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
  const staffPath = pathname.replace(/^\/(en|zh|es)(?=\/admin(?:\/|$))/, "");
  if (/^\/admin(?:\/|$)/.test(staffPath)) {
    // Keep the legacy CRM URL and existing bookmarked links, without locale prefixes.
    const canonicalPath = staffPath.replace(/^\/admin\/crm(?=\/|$)/i, "/admin/CRM");
    if (pathname !== canonicalPath) {
      const url = request.nextUrl.clone();
      url.pathname = canonicalPath;
      return NextResponse.redirect(url, 308);
    }
    return staffMiddleware(request);
  }

  // Legal documents are English-only, without changing the saved site language.
  return /^\/(?:en\/)?(?:privacy|terms)\/?$/.test(request.nextUrl.pathname)
    ? englishLegalMiddleware(request)
    : localizedMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
