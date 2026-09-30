import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const localizedMiddleware = createMiddleware(routing);
const englishLegalMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

export default function proxy(request: NextRequest) {
  // Legal documents are English-only, without changing the saved site language.
  return /^\/(?:en\/)?(?:privacy|terms)\/?$/.test(request.nextUrl.pathname)
    ? englishLegalMiddleware(request)
    : localizedMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
