import { applicationUnavailableResponse } from '@/lib/application-release';
import { applicationAccess } from '@/lib/dropbox/application';
import { handle, json, jsonBody, requireSameOrigin } from '@/lib/dropbox/http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const unavailable = applicationUnavailableResponse(); if (unavailable) return unavailable;

  return handle(async () => {
    requireSameOrigin(request);
    return json(await applicationAccess(await jsonBody(request, 4096)));
  });
}
