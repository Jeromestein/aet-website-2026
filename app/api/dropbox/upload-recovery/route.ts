import { contextFromRequest, requireUploadAllowed } from '@/lib/dropbox/server';
import { handle, json, jsonBody, requireSameOrigin } from '@/lib/dropbox/http';
import { DocumentError } from '@/lib/dropbox/shared';
import { abandonUpload, unfinishedUploads } from '@/lib/preeval/upload-recovery';
import { AppError } from '@/lib/preeval/domain';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return handle(async () => {
    const { data: context } = contextFromRequest(request);
    if (context.kind !== 'pre-evaluation') return json({ uploads: [], pending: false, hasReady: false, canModify: false });
    return json(await unfinishedUploads(context.id));
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    const { data: context } = contextFromRequest(request);
    requireUploadAllowed(context);
    if (context.kind !== 'pre-evaluation') throw new DocumentError('invalid');
    try {
      return json(await abandonUpload(context.id, await jsonBody(request, 1024), 'document-customer'));
    } catch (error) {
      if (error instanceof AppError) throw new DocumentError('sequence', error.status);
      throw error;
    }
  });
}
