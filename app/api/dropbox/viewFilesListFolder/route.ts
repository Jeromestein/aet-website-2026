import { applicationUnavailableResponse } from '@/lib/application-release';
import { contextFromRequest, listFiles } from '@/lib/dropbox/server';
import { handle, json } from '@/lib/dropbox/http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const unavailable = applicationUnavailableResponse(); if (unavailable) return unavailable;

  return handle(async () => {
    const context = contextFromRequest(request);
    return json({ success: true, ...await listFiles(context.data, new URL(request.url).searchParams.get('cursor')) });
  });
}
