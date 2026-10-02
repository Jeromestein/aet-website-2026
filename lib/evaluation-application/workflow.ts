import { z } from 'zod';
import type { ApplicationData, Quote } from './domain';
import { AppError } from '../preeval/domain';
export const statuses = ['submitted', 'reviewing', 'needs_information', 'processing', 'completed', 'cancelled'] as const;
export type ConfirmedQuote = { base: number; additional: number; total: number; explanation: string };
export type ApplicationFile = { id: string; kind: 'document' | 'report'; name: string; bytes: number; input_version: number; created_at: string };
export type ApplicationRecord = { id: string; locale: string; created_at: string; updated_at: string; version: number; input_version: number; status: typeof statuses[number]; payment_status: string; data: ApplicationData; quote: Quote; confirmed_quote: ConfirmedQuote | null; customer_message: string; files: ApplicationFile[]; total: number | null; released_file_id: string | null; staff_notes?: string; audit?: { id: number; actor: string; action: string; created_at: string }[] };
const cents = z.number().int().min(0).max(999999);
export const staffSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('notes'), version: z.number().int(), notes: z.string().max(10000) }).strict(),
  z.object({ action: z.literal('status'), version: z.number().int(), status: z.enum(['reviewing', 'needs_information', 'processing']), message: z.string().trim().max(2000) }).strict(),
  z.object({ action: z.literal('quote'), version: z.number().int(), base: cents, additional: cents, explanation: z.string().trim().min(3).max(2000) }).strict(),
  z.object({ action: z.literal('release'), version: z.number().int(), fileId: z.uuid() }).strict(),
]);
export function confirmQuote(quote: Quote, data: ApplicationData, base: number, additional: number, explanation: string): ConfirmedQuote {
  if (![base, additional].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 999999) || base < quote.min || base > quote.max || base + additional <= 0 || base + additional > 999999) throw new AppError('invalid_quote');
  if (!data.services.customized && !data.services.translation && additional !== 0) throw new AppError('invalid_quote');
  if ((data.services.customized || data.services.translation) && additional <= 0) throw new AppError('invalid_quote');
  return { base, additional, total: base + additional, explanation };
}
export function payableTotal(app: { quote: Quote; confirmed_quote: ConfirmedQuote | null }): number | null {
  return app.confirmed_quote?.total ?? (!app.quote.needsQuote && app.quote.min === app.quote.max ? app.quote.min : null);
}
export function canDownloadReport(app: { status: string; payment_status: string; released_file_id: string | null }, fileId: string) {
  return app.status === 'completed' && app.payment_status === 'paid' && app.released_file_id === fileId;
}
export const receiptPath = (locale: string, id: string) => `${locale === 'en' ? '' : '/' + locale}/credential-evaluation-application/success?id=${id}`;
