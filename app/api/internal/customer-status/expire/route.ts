import { timingSafeEqual } from 'node:crypto';
import { runPaymentExpiry } from '@/lib/customer-status/expiry';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || secret.length < 16 || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return json({ error: 'unauthorized' }, 401);
  }
  // One scheduler owns live expiry. Preview/local deployments must never drain it.
  if (process.env.STATUS_EXPIRY_ENABLED !== 'true' || process.env.VERCEL_ENV !== 'production') {
    return json({ skipped: true });
  }
  try {
    const result = await runPaymentExpiry();
    console.info('Formal payment expiry completed', result);
    return json(result);
  }
  catch {
    console.error('Formal payment expiry failed; no success reported.');
    return json({ error: 'expiry_failed' }, 503);
  }
}
