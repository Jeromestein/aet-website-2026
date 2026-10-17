import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { db, table } from '../preeval/db';
import { configuration } from '../preeval/config';
import { AppError } from '../preeval/domain';
import { initialData } from '../evaluation-application/domain';
import { toLegacyFormal, toLegacyEducation, type LegacyFormalProjection } from '../legacy-application/mapping';
import { intakeSchema, normalizeIntake, intakeQuote, officeNames, statusPath, TEST_RECIPIENT, type IntakeReceipt } from './intake';
import { confirmationEmail } from './intake-template';
export function requireIntakePreview() {
  if(!configuration().cloudPreview) throw new AppError('preview_unavailable',503);
}
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function saveIntake(raw:unknown) {
  requireIntakePreview();
  const parsed=intakeSchema.parse(raw), data=normalizeIntake(parsed.data), quote=intakeQuote(data);
  const requestHash=hash(JSON.stringify({...parsed,data}));
  // Retain a compatibility projection for CRM lists; intake is the complete, authoritative snapshot.
  const legacy:LegacyFormalProjection=initialData();
  legacy.client={...legacy.client,name:data.contactName,email:data.email,phone:data.phone,office:officeNames[data.office],purpose:data.purpose};
  legacy.evaluee={title:data.pronouns,first:data.firstName,middle:data.middleName,last:data.lastName,birth:data.dateOfBirth};
  legacy.educations=data.educations;legacy.notes=data.notes;
  legacy.delivery={...legacy.delivery,...data.evaluationDelivery,sameAddress:false};
  for(const id of ['document','course'] as const){const choice=data.evaluationRequest.services[id];legacy.services[id]={tier:choice.selected?choice.tier:'',additionalDegrees:choice.selected?Math.max(0,choice.educationIndexes.length-1):0};}
  legacy.services.translation=data.evaluationRequest.translation;
  const stored={...legacy,intake:data,intakeVersion:2};
  return db().begin(async tx=>{
    const [created]=await tx`insert into ${table('evaluation.applications')}(request_id,request_hash,access_hash,locale,data,quote)
      values(${parsed.requestId},${requestHash},${hash(randomUUID())},${parsed.locale},${tx.json(stored)},${tx.json(quote)}) on conflict(request_id) do nothing returning id`;
    if(!created){
      const [existing]=await tx`select id,request_hash from ${table('evaluation.applications')} where request_id=${parsed.requestId}`;
      if(!existing||existing.request_hash!==requestHash) throw new AppError('idempotency_conflict',409);
      return {id:existing.id as string,created:false,statusPath:statusPath(existing.id,parsed.locale)};
    }
    const id=created.id as string;
    const educations=data.educations.map(education=>({id:randomUUID(),application_id:id,...toLegacyEducation(education)}));
    const row=toLegacyFormal(legacy,quote);
    const address=data.evaluationDelivery.address;
    Object.assign(row,{date_of_birth:data.dateOfBirth||null,purpose:data.purpose==='other'?'other':row.purpose,
      country:address.country,street_address:address.street,street_address2:address.street2||null,city:address.city,region:address.region,zip_code:address.postal});
    row.additional_services_quantity.extra_copy=data.evaluationDelivery.extraCopies;
    row.service_type.websiteQuote={version:2,...quote,educationIds:educations.map(e=>e.id),selectedEducationIds:Object.fromEntries(['document','course'].map(key=>[key,data.evaluationRequest.services[key as 'document'|'course'].educationIndexes.map(index=>educations[index].id)]))};
    await tx`insert into ${table('public.fce_applications')} ${tx({...row,id,service_type:tx.json(row.service_type as never),additional_services_quantity:tx.json(row.additional_services_quantity),submitted_at:new Date().toISOString()})}`;
    for(const education of educations) await tx`insert into ${table('public.fce_educations')} ${tx(education)}`;
    const mail=confirmationEmail(id,parsed.locale,data,quote,configuration().origin);
    await tx`insert into ${table('evaluation.intake_emails')}(application_id,recipient,subject,html) values(${id},${TEST_RECIPIENT},${mail.subject},${mail.html})`;
    await tx`insert into ${table('evaluation.audit')}(application_id,actor,action,detail) values(${id},'customer','intake.submitted',${tx.json({version:2,preview:true})})`;
    return {id,created:true,statusPath:statusPath(id,parsed.locale)};
  });
}
export async function readIntake(id:string):Promise<IntakeReceipt> {
  requireIntakePreview();
  const [row]=await db()`select a.id,a.locale,a.status,a.created_at,a.data->'intake' as data,a.quote,e.state,e.attempts,e.recipient
    from ${table('evaluation.applications')} a join ${table('evaluation.intake_emails')} e on e.application_id=a.id where a.id=${id} and a.data->>'intakeVersion'='2'`;
  if(!row) throw new AppError('not_found',404);
  return {id:row.id,locale:row.locale,status:row.status,createdAt:new Date(row.created_at).toISOString(),data:row.data,quote:row.quote,email:{state:row.state,attempts:row.attempts,recipient:row.recipient},statusPath:statusPath(row.id,row.locale)};
}
