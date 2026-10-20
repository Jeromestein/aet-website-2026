import { contextFromRequest, continueUpload, requireUploadAllowed, startUpload } from '@/lib/dropbox/server';
import { handle, json, jsonBody, requireSameOrigin } from '@/lib/dropbox/http';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    const context = contextFromRequest(request);
    requireUploadAllowed(context.data);
    const data = await jsonBody(request, 4 * 1024 * 1024 + 32 * 1024);
    return json(data.action === 'start'
      ? await startUpload(context.data, data, context.expires)
      : await continueUpload(context.data, data));
  });
}
