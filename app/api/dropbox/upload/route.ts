import { contextFromRequest, requireUploadAllowed, uploadSmall } from '@/lib/dropbox/server';
import { handle, json, limitedBody, requireSameOrigin } from '@/lib/dropbox/http';
import { CHUNK_SIZE, DocumentError } from '@/lib/dropbox/shared';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    const { data: context } = contextFromRequest(request);
    requireUploadAllowed(context);
    const type = request.headers.get('content-type') ?? '';
    if (!type.startsWith('multipart/form-data;')) throw new DocumentError('invalid', 415);
    const body = await limitedBody(request, CHUNK_SIZE + 64 * 1024);
    let form;
    try { form = await new Response(new Uint8Array(body), { headers: { 'Content-Type': type } }).formData(); }
    catch { throw new DocumentError('invalid'); }
    const file = form.get('file');
    if (!(file instanceof File)) throw new DocumentError('invalid');
    return json(await uploadSmall(context, file));
  });
}
