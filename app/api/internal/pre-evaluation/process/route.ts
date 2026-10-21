import { timingSafeEqual } from 'node:crypto';
import { recoverAIJobs } from '@/lib/preeval/ai-scheduler';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const json = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || secret.length < 16 || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (process.env.PREEVAL_AI_DAILY_RECOVERY_ENABLED !== 'true') return json({ skipped: true });
  try { return json(await recoverAIJobs()); }
  catch {
    console.error('Pre-evaluation daily AI recovery failed; jobs remain persisted.');
    return json({ error: 'recovery_failed' }, 503);
  }
}
