import { applicationAccess } from '@/lib/dropbox/application';
import { handle, json, jsonBody, requireSameOrigin } from '@/lib/dropbox/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return handle(async () => {
    requireSameOrigin(request);
    return json(await applicationAccess(await jsonBody(request, 4096)));
  });
}
