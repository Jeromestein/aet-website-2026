import 'server-only';
import { DocumentError } from './shared';
import { requireEnabled } from './server';

export function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff', ...extraHeaders,
  } });
}
export function requireSameOrigin(request: Request) {
  requireEnabled();
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new DocumentError('access', 403);
}
export async function limitedBody(request: Request, limit: number) {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw new DocumentError('tooLarge', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new DocumentError('invalid');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new DocumentError('tooLarge', 413); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}
export async function jsonBody(request: Request, limit: number) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new DocumentError('invalid', 415);
  const body = await limitedBody(request, limit);
  try {
    const value = JSON.parse(body.toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid');
    return value as Record<string, unknown>;
  } catch { throw new DocumentError('invalid'); }
}
export async function handle(operation: () => Promise<Response>) {
  try { return await operation(); }
  catch (error) {
    if (error instanceof DocumentError) return json({ success: false, error: error.code }, error.status);
    const status = (error as { status?: number })?.status;
    if (status === 429) {
      const headers = (error as { headers?: { get?: (name: string) => string | null } })?.headers;
      const seconds = Math.min(300, Math.max(1, Number(headers?.get?.('retry-after')) || 5));
      return json({ success: false, error: 'upstream' }, 429, { 'Retry-After': String(seconds) });
    }
    // Never serialize SDK errors: they may include OAuth credentials or paths.
    return json({ success: false, error: 'upstream' }, 502);
  }
}
