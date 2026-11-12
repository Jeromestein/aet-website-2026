import { applicationUnavailableResponse } from '@/lib/application-release';
import { applicationStatus } from '@/lib/dropbox/application';
import { handle, json, jsonBody, requireSameOrigin } from '@/lib/dropbox/http';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const unavailable = applicationUnavailableResponse(); if (unavailable) return unavailable;

  return handle(async () => {
    requireSameOrigin(request);
    const body = await jsonBody(request, 1024);
    return json(await applicationStatus(body.applicationId));
  });
}
