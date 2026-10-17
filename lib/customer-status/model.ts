import { z } from 'zod';
import { officeNames, type IntakeReceipt } from '@/lib/application/intake';
import { completionFor, type Completion } from '@/lib/crm/completion';
import { cents, services, timestamp } from '@/lib/crm/live-domain';
export const statusLookup = z.object({ applicationId: z.string().trim().toLowerCase().pipe(z.uuid()) }).strict();
export type CustomerStatus = {
 source: 'live' | 'preview';
 portalUrl: string | null;
 details?: {request: IntakeReceipt['data']['evaluationRequest']; delivery: IntakeReceipt['data']['evaluationDelivery']; quote: IntakeReceipt['quote']};
 email?: IntakeReceipt['email'];
 id: string; status: string; payment: string; submitted: string; paid: string; office: string | null; services: string; amount: number | null; completion: Completion | null; deadline: string | null;
 client: {name:string;country:string;street:string;city:string;phone:string;fax:string;email:string;purpose:string;notes:string};
 evaluee: {first:string;middle:string;last:string;birth:string;pronouns:string};
 educations: {id:string;country:string;degree:string;school:string;start:string;end:string}[];
};
// Explicit customer fields authorized for the legacy Application ID view; exclude staff notes and reports.
export function projectStatus(row: Record<string, any>, educations: Record<string, any>[] = [], source: CustomerStatus['source'] = 'live'): CustomerStatus {
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
    source,
    portalUrl: source==='preview'?null: 'https://app.americantranslationservice.com/status?applicationId='+encodeURIComponent(row.id),
    client: {name:text(row.name),country:text(row.country),street:[row.street_address,row.street_address2].map(text).filter(Boolean).join(', '),city:[row.city,row.region,row.zip_code].map(text).filter(Boolean).join(', '),phone:text(row.phone),fax:text(row.fax),email:text(row.email),purpose:text(row.purpose),notes:text(row.purpose_other)},
    evaluee: {first:text(row.first_name),middle:text(row.middle_name),last:text(row.last_name),birth,pronouns:text(row.pronouns)},
    educations: educations.map(education => ({id:text(education.id),country:text(education.country_of_study),degree:text(education.degree_obtained),school:text(education.school_name),start:month(education.study_start_date),end:month(education.study_end_date)})),
    id: row.id, status: row.status, payment: row.payment_status || 'pending', submitted,
    paid: timestamp(row.paid_at), office: row.office || null, services: services(row.service_type),
    amount: cents(row.due_amount), completion: completionFor('formal', row),
    deadline: source==='live' && row.payment_status !== 'paid' && row.status === 'submitted' && Number.isFinite(date.getTime())
      ? new Date(date.getTime() + 48 * 3600000).toISOString() : null };
}

// Normalize saved intake data into the same customer contract as legacy records.
// Capabilities describe connected operations; the UI does not select a layout by source.
export function projectIntakeStatus(receipt: IntakeReceipt): CustomerStatus {
 const {data,quote}=receipt;
 const address=data.evaluationDelivery.address;
 return {
  source:'preview',portalUrl:null,id:receipt.id,status:receipt.status,payment:'pending',
  submitted:receipt.createdAt,paid:'',office:officeNames[data.office]||null,
  services:[data.evaluationRequest.services.document.selected?'Document by Document':'',data.evaluationRequest.services.course.selected?'Course by Course':'',data.evaluationRequest.translation?'Translation':''].filter(Boolean).join(', '),
  amount:quote.needsQuote||quote.min!==quote.max?null:quote.min,completion:null,deadline:null,
  client:{name:data.contactName,country:'',street:'',city:'',phone:data.phone,fax:'',email:data.email,purpose:data.purpose==='other'?'other':'evaluation-'+data.purpose,notes:data.notes},
  evaluee:{first:data.firstName,middle:data.middleName,last:data.lastName,birth:data.dateOfBirth,pronouns:data.pronouns},
  educations:data.educations.map((e,index)=>({id:String(index),country:e.country,degree:e.degree,school:e.school,start:e.start,end:e.end})),
  details:{request:data.evaluationRequest,delivery:{...data.evaluationDelivery,address:{...address}},quote},
  email:{state:receipt.email.state,attempts:receipt.email.attempts,recipient:receipt.email.recipient},
 };
}
