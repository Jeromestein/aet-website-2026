import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sameOrigin, limit } from '@/lib/preeval/auth';
import { configuration } from '@/lib/preeval/config';
import { AppError } from '@/lib/preeval/domain';
import { cookieName, keySchema, saveApplication, submissionSchema } from '@/lib/evaluation-application/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const response = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' } });
export async function POST(request: Request) {
  try {
    if (process.env.PREEVAL_ENV !== 'local') return response({ error: 'unavailable' }, 503);
    configuration(); sameOrigin(request);
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AppError('invalid_request');
    const key = keySchema.parse(request.headers.get('x-application-key'));
    const reader = request.body?.getReader();
    if (!reader) throw new AppError('invalid_request');
    let length = 0; const chunks: Uint8Array[] = [];
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > 64000) { await reader.cancel(); throw new AppError('request_too_large', 413); } chunks.push(value); }
    let raw: unknown;
    try { raw = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new AppError('invalid_request'); }
    const input = submissionSchema.parse(raw);
    await limit('evaluation:' + input.data.client.email.toLowerCase(), 20, 600);
    const result = await saveApplication(input, key);
    const res = response({ id: result.id }, result.created ? 201 : 200);
    res.cookies.set({ name: cookieName(result.id), value: key, httpOnly: true, sameSite: 'strict', secure: configuration().origin.startsWith('https:'), path: `/api/evaluation/applications/${result.id}`, maxAge: 86400 });
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) return response({ error: 'invalid_request', fields: error.issues.map(i => ({ path: i.path.join('.'), code: i.message })) }, 400);
    if (error instanceof AppError) return response({ error: error.code }, error.status);
    console.error('Evaluation application submission failed. Check local database configuration and migration.');
    return response({ error: 'unavailable' }, 503);
  }
}
