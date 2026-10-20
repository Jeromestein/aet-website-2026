import { z } from 'zod';
import { staffDocuments } from '@/lib/crm/documents-server';
import { AppError } from '@/lib/preeval/domain';
import { DocumentError } from '@/lib/dropbox/shared';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reference = z.object({ kind: z.enum(['formal', 'preeval']), id: z.uuid() });
const query = z.object({ source: z.enum(['live', 'preview']).default('live'), cursor: z.string().max(16384).optional() }).strict();
const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const { kind, id } = reference.parse(await params);
    const { source, cursor } = query.parse(Object.fromEntries(new URL(request.url).searchParams));
    return Response.json(await staffDocuments(kind, id, source, cursor), { headers });
  } catch (error) {
    const status = error instanceof AppError || error instanceof DocumentError ? error.status : error instanceof z.ZodError ? 400 : 503;
    // Provider errors can contain credentials and paths. Return only controlled codes.
    return Response.json({ error: status === 401 ? 'sign_in_required' : status === 403 ? 'access_denied' : status === 404 ? 'not_found' : status === 400 ? 'invalid_request' : 'documents_unavailable' }, { status, headers });
  }
}
