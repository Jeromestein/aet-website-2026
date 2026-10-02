import { NextResponse } from 'next/server';
import { access, application } from '@/lib/evaluation-application/service';
import { configuration } from '@/lib/preeval/config';
import { AppError } from '@/lib/preeval/domain';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
  try {
    if (process.env.PREEVAL_ENV !== 'local') return NextResponse.json({ error: 'unavailable' }, { status: 503, headers });
    configuration();
    const { id } = await params;
    const current = await access(id);
    return NextResponse.json(await application(id, current.admin), { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof AppError ? error.code : 'unavailable' }, { status: error instanceof AppError ? error.status : 503, headers });
  }
}
