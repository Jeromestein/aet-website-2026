import { hasLocale } from 'next-intl';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { cslbBlogPath } from '@/lib/cslb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response(null, { status: 404 });
  const destination = new URL(getPathname({ locale, href: cslbBlogPath }), request.url);
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination, 308);
}
