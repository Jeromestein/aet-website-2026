import { contextFromRequest, listFiles } from '@/lib/dropbox/server';
import { handle, json } from '@/lib/dropbox/http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  return handle(async () => {
    const context = contextFromRequest(request);
    return json({ success: true, ...await listFiles(context.data, new URL(request.url).searchParams.get('cursor')) });
  });
}
