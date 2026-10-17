import { z } from 'zod';
import { completionFor, type Completion } from '@/lib/crm/completion';
import { cents, services, timestamp } from '@/lib/crm/live-domain';
export const statusLookup = z.object({ applicationId: z.string().trim().toLowerCase().pipe(z.uuid()) }).strict();
export type CustomerStatus = { id: string; status: string; payment: string; submitted: string; paid: string; office: string | null; services: string; amount: number | null; completion: Completion | null; deadline: string | null;
 client: {name:string;country:string;street:string;city:string;phone:string;fax:string;email:string;purpose:string;notes:string};
 evaluee: {first:string;middle:string;last:string;birth:string;pronouns:string};
 educations: {id:string;country:string;degree:string;school:string;start:string;end:string}[];
};
// Explicit customer fields authorized for the legacy Application ID view; exclude staff notes and reports.
export function projectStatus(row: Record<string, any>, educations: Record<string, any>[] = []): CustomerStatus {
  const text = (value: unknown): string => typeof value === 'string' ? value : '';
  const month = (value: unknown): string => {
    if (!value || typeof value !== 'object') return '';
    const {year, month} = value as Record<string, unknown>;
    return [year, month].every(v => typeof v === 'string' || typeof v === 'number')
      ? `${year}-${String(month).padStart(2,'0')}` : '';
  };
  const birth = row.date_of_birth instanceof Date ? row.date_of_birth.toISOString().slice(0,10) : text(row.date_of_birth).slice(0,10);
  const submitted = timestamp(row.created_at);
  const date = new Date(submitted);
  return {
    client: {name:text(row.name),country:text(row.country),street:[row.street_address,row.street_address2].map(text).filter(Boolean).join(', '),city:[row.city,row.region,row.zip_code].map(text).filter(Boolean).join(', '),phone:text(row.phone),fax:text(row.fax),email:text(row.email),purpose:text(row.purpose),notes:text(row.purpose_other)},
    evaluee: {first:text(row.first_name),middle:text(row.middle_name),last:text(row.last_name),birth,pronouns:text(row.pronouns)},
    educations: educations.map(education => ({id:text(education.id),country:text(education.country_of_study),degree:text(education.degree_obtained),school:text(education.school_name),start:month(education.study_start_date),end:month(education.study_end_date)})),
    id: row.id, status: row.status, payment: row.payment_status || 'pending', submitted,
    paid: timestamp(row.paid_at), office: row.office || null, services: services(row.service_type),
    amount: cents(row.due_amount), completion: completionFor('formal', row),
    deadline: row.payment_status !== 'paid' && row.status === 'submitted' && Number.isFinite(date.getTime())
      ? new Date(date.getTime() + 48 * 3600000).toISOString() : null };
}
