import { z } from 'zod';
import { dataSchema, validateStep, type ApplicationDraft } from './model';
import { quoteEvaluation } from './evaluation';
import { quoteDelivery, emptyDelivery } from './delivery';
import type { Quote } from '../evaluation-application/domain';

export const TEST_RECIPIENT = 'errplusone@gmail.com';
export const intakeSchema = z.object({requestId:z.uuid(),locale:z.enum(['en','zh','es']),data:dataSchema.strict()}).strict().superRefine(({data},ctx)=>{
  if(data.service!=='evaluation') ctx.addIssue({code:'custom',path:['data','service'],message:'unsupported_service'});
  if(!['uscis','education','employment','other'].includes(data.purpose)) ctx.addIssue({code:'custom',path:['data','purpose'],message:'invalid_purpose'});
  for(const [path,message] of Object.entries({...validateStep(data,0),...validateStep(data,1)})) ctx.addIssue({code:'custom',path:['data',...path.split('.')],message});
});
export function normalizeIntake(raw: ApplicationDraft): ApplicationDraft {
  const data=structuredClone(raw);
  for(const key of ['contactName','email','phone','firstName','middleName','lastName','notes'] as const) data[key]=data[key].trim();
  data.email=data.email.toLowerCase();
  for(const key of ['document','course'] as const) if(!data.evaluationRequest.services[key].selected) data.evaluationRequest.services[key]={selected:false,tier:'',educationIndexes:[]};
  if(data.evaluationDelivery.report==='pdf') data.evaluationDelivery=emptyDelivery();
  return data;
}
export function intakeQuote(data:ApplicationDraft):Quote {
  const service=quoteEvaluation(data.evaluationRequest,data.educations.length),delivery=quoteDelivery(data.evaluationDelivery);
  const lines:Quote['lines']=service.lines.flatMap(line=>[
    {id:line.id,quantity:1,min:line.baseCents!,max:line.baseCents!,tier:line.rate!.id,turnaround:line.rate!.turnaround},
    ...(line.additionalCount?[{id:line.id+'Additional',quantity:line.additionalCount,min:line.additionalCents,max:line.additionalCents}]:[]),
  ]);
  lines.push(...delivery.lines.map(line=>({id:line.rate.id,quantity:line.quantity,min:line.minCents,max:line.maxCents})));
  return {currency:'USD',lines,min:service.subtotalCents+delivery.minCents,max:service.subtotalCents+delivery.maxCents,needsQuote:service.needsQuote||delivery.needsQuote};
}
export const officeNames:Record<string,string>={miami:'Miami',la:'Los Angeles',sf:'San Francisco'};
export const statusPath=(id:string,locale:string)=>`${locale==='en'?'':'/'+locale}/status?source=preview&applicationId=${encodeURIComponent(id)}`;
export type IntakeReceipt={id:string;locale:'en'|'zh'|'es';status:string;createdAt:string;data:ApplicationDraft;quote:Quote;email:{state:'queued'|'sending'|'sent'|'failed';attempts:number;recipient:string};statusPath:string};
