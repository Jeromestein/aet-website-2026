import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { authorize } from '@/lib/preeval/auth';
import { AppError } from '@/lib/preeval/domain';
import { workspaceSnapshot } from '@/lib/crm/workspace-server';
import { workspaceCsv } from '@/lib/crm/contracts';
import { liveEnabled } from '@/lib/crm/live-db';
import { liveSnapshot } from '@/lib/crm/live-server';
import { requireStaff } from '@/lib/staff/session';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow' };
export async function GET(request: Request) {
  try {
    const staff = liveEnabled() ? await requireStaff() : await authorize();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const result = liveEnabled() ? await liveSnapshot(query, staff as Awaited<ReturnType<typeof requireStaff>>) : await workspaceSnapshot(query, staff);
    if (query.export === 'csv') return new Response(workspaceCsv(result.rows), { headers: { ...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aet-applications.csv"','X-Content-Type-Options':'nosniff' } });
    return NextResponse.json(result,{headers});
  } catch(error) {
    const status = error instanceof AppError ? error.status : error instanceof ZodError ? 400 : 503;
    return NextResponse.json({error:error instanceof AppError ? error.code : status===400 ? 'invalid_request' : 'service_unavailable'},{status,headers});
  }
}
