import { applicationUnavailableResponse } from '@/lib/application-release';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** The old four-step pilot is retired; new applications use the unified intake. */
export async function POST() {
  const unavailable = applicationUnavailableResponse();
  if (unavailable) return unavailable;
  return NextResponse.json({ error: 'legacy_customer_access_retired' }, { status: 410, headers: {
    'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer',
  } });
}
