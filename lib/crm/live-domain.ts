import {z} from 'zod';
export const liveKinds = ['formal','preeval','external','payment'] as const;
export type LiveKind = typeof liveKinds[number];
export const offices = ['Boston','New York','Miami','San Francisco','Los Angeles'] as const;
export const liveReference = z.object({kind:z.enum(liveKinds),id:z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/)});
const base={version:z.string().regex(/^[a-f0-9]{64}$/)};
export const liveChange = z.discriminatedUnion('action',[
 z.object({...base,action:z.literal('status'),status:z.enum(['processing','completed','cancelled'])}).strict(),
 z.object({...base,action:z.literal('office'),office:z.enum(offices).nullable()}).strict(),
 z.object({...base,action:z.literal('amount'),amount:z.number().int().min(0).max(999999).nullable()}).strict(),
 z.object({...base,action:z.literal('notes'),notes:z.string().max(10000)}).strict(),
 z.object({...base,action:z.literal('result'),educationId:z.uuid(),result:z.string().min(1).max(20000)}).strict(),
]);
export function statusAllowed(current:string,payment:string,next:string){
 return next==='processing'?current==='submitted'&&payment==='paid':next==='completed'?current==='processing'&&payment==='paid':next==='cancelled'&&(current==='submitted'||current==='processing'&&payment!=='paid');
}
export function cents(value:unknown):number|null {if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)?Math.round(n*100):null;}
export function services(value:Record<string,any>|null){
 const s=value||{};const labels=[];
 for(const [key,label] of [['foreignCredentialEvaluation','Document by Document'],['coursebyCourse','Course by Course'],['professionalExperience','Expert Opinion Letter'],['positionEvaluation','Position Evaluation']])if(s[key]?.firstDegree?.speed||s[key]?.speed)labels.push(label);
 if(s.translation?.required)labels.push('Translation');if(s.customizedService?.required)labels.push('Customized Evaluation');
 return labels.join(', ')||'Formal evaluation';
}
export function timestamp(value:unknown):string {if(!value)return '';return value instanceof Date?value.toISOString():String(value);}
export function preferredPayment(rows:Record<string,any>[]){
 // A settled attempt takes precedence over abandoned payment links; expose every attempt in details.
 return [...rows].sort((a,b)=>(a.payment_status==='paid'?-1:0)-(b.payment_status==='paid'?-1:0)||timestamp(b.paid_at).localeCompare(timestamp(a.paid_at))||String(a.id).localeCompare(String(b.id)))[0];
}
