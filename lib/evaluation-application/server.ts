import 'server-only';
import { formalCore, submitFormal } from '../application-core/formal-store';
import { z } from 'zod';
import { applicationSchema, quote } from './domain';
import { hash } from '../preeval/auth';
import { AppError } from '../preeval/domain';
export const submissionSchema = z.object({ requestId: z.uuid(), locale: z.enum(['en', 'zh', 'es']), data: applicationSchema }).strict();
export async function saveApplication(raw: unknown) {
  if (!formalCore()) throw new AppError('legacy_customer_access_retired', 410);
  const input = submissionSchema.parse(raw);
  return submitFormal(input.data, quote(input.data), input.requestId, hash(JSON.stringify(input)), input.locale);
}
