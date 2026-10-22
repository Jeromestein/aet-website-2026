import { z } from 'zod';
import { configuration } from '@/lib/preeval/config';
import { authorize, sameOrigin, limit } from '@/lib/preeval/auth';
import { AppError } from '@/lib/preeval/domain';
import { uploadDocument } from '@/lib/preeval/uploads';
import { json, jsonBody } from '@/lib/dropbox/http';
import { DocumentError, CHUNK_SIZE } from '@/lib/dropbox/shared';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    configuration();
    sameOrigin(request);
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new AppError('not_found', 404);
    const current = await authorize(id);
    // Base64 adds one third; leave a bounded allowance for the sealed session.
    const data = await jsonBody(request, CHUNK_SIZE * 4 / 3 + 32 * 1024);
    if (data.action === 'start') await limit('files:' + id, 15, 600);
    return json(await uploadDocument(id, data, current.email));
  } catch (error) {
    if (error instanceof AppError || error instanceof DocumentError) return json({ error: error.code }, error.status);
    return json({ error: 'service_unavailable' }, 503);
  }
}
