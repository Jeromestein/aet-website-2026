import { resolveStorage } from '../dropbox/storage';
import { contextFor } from '../dropbox/application';
import { table } from "../preeval/db";
import type { TransactionSql } from 'postgres';
import { randomUUID } from 'node:crypto';
import { toLegacyFormal, toLegacyPreeval, toLegacyEducation } from './mapping';
import type { ApplicationData, Quote } from '../evaluation-application/domain';
import type { ApplicationInput } from '../preeval/domain';

export async function saveLegacyFormal(tx: TransactionSql, id: string, data: ApplicationData, quote: Quote) {
  const educations = data.educations.map(education => ({ id: randomUUID(), application_id: id, ...toLegacyEducation(education) }));
  const row = { id, ...toLegacyFormal(data, quote), submitted_at: new Date().toISOString() };
  row.service_type.websiteQuote = { version: 1, ...quote, educationIds: educations.map(education => education.id) };
  await tx`insert into ${table("public.fce_applications")} ${tx({ ...row, service_type: tx.json(JSON.parse(JSON.stringify(row.service_type))), additional_services_quantity: tx.json(row.additional_services_quantity) })}`;
  await resolveStorage(contextFor(row as never, 'evaluation'), tx);
  for (const education of educations) await tx`insert into ${table("public.fce_educations")} ${tx(education)}`;
}
export async function saveLegacyPreeval(tx: TransactionSql, id: string, educationId: string, input: ApplicationInput) {
  const { application, education } = toLegacyPreeval(input);
  await tx`insert into ${table("public.aet_core_applications")} ${tx({ id, ...application })}`;
  await resolveStorage({ ...contextFor({ id, ...application, created_at: new Date().toISOString() } as never, 'pre-evaluation'), legacyFolderKey: undefined }, tx);
  await tx`insert into ${table("public.aet_core_educations")} ${tx({ id: educationId, application_id: id, ...education })}`;
}
