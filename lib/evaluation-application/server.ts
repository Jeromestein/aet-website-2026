import 'server-only';
import { saveLegacyFormal } from '../legacy-application/store';
import { z } from 'zod';
import { applicationSchema, quote } from './domain';
import { db } from '../preeval/db';
import { hash } from '../preeval/auth';
import { AppError } from '../preeval/domain';

export const submissionSchema = z.object({ requestId: z.uuid(), locale: z.enum(['en', 'zh', 'es']), data: applicationSchema }).strict();
export const keySchema = z.string().regex(/^[a-f0-9]{64}$/);
export const cookieName = (id: string) => `aet_evaluation_${id}`;
export async function saveApplication(raw: unknown, key: string) {
  const input = submissionSchema.parse(raw);
  keySchema.parse(key);
  const requestHash = hash(JSON.stringify(input));
  return db().begin(async sql => {
    const [created] = await sql`insert into evaluation.applications(request_id,request_hash,access_hash,locale,data,quote)
      values (${input.requestId},${requestHash},${hash(key)},${input.locale},${JSON.stringify(input.data)}::text::jsonb,${JSON.stringify(quote(input.data))}::text::jsonb)
      on conflict(request_id) do nothing returning id`;
    if (created) {
      await saveLegacyFormal(sql, created.id, input.data, quote(input.data));
      return { id: created.id as string, created: true };
    }
    const [existing] = await sql`select id,request_hash,access_hash from evaluation.applications where request_id=${input.requestId}`;
    if (!existing || existing.request_hash !== requestHash || existing.access_hash !== hash(key)) throw new AppError('idempotency_conflict', 409);
    return { id: existing.id as string, created: false };
  });
}
