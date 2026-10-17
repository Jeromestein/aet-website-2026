import { describe,it,expect } from 'vitest';
import { initialDraft } from '../lib/application/model';
import { selectEvaluationService } from '../lib/application/evaluation';
import { intakeSchema,intakeQuote,normalizeIntake,TEST_RECIPIENT,statusPath } from '../lib/application/intake';
import { confirmationEmail } from '../lib/application/intake-template';
const fixture=()=>{
 const data={...initialDraft('evaluation'),contactName:'Synthetic Applicant',email:TEST_RECIPIENT,phone:'+44 20 7946 0000',office:'miami',pronouns:'mx',firstName:'Test',lastName:'Applicant',purpose:'other',educations:[{school:'Test University',country:'GB',degree:'Test Bachelor',start:'2014-09',end:'2018-06'}]};
 data.evaluationRequest=selectEvaluationService(data.evaluationRequest,'document',1);
 return {requestId:'11111111-1111-4111-8111-111111111111',locale:'en',data};
};
describe('credential intake contract',()=>{
 it('accepts optional birthday, international phone and other purpose',()=>expect(intakeSchema.safeParse(fixture()).success).toBe(true));
 it.each(['translation','pre-evaluation'])('rejects unsupported service %s',service=>expect(intakeSchema.safeParse({...fixture(),data:{...fixture().data,service}}).success).toBe(false));
 it('rejects injected client totals and invalid purpose',()=>{expect(intakeSchema.safeParse({...fixture(),quote:{min:1}}).success).toBe(false);expect(intakeSchema.safeParse({...fixture(),data:{...fixture().data,purpose:'unknown'}}).success).toBe(false);});
 it('rejects invalid or duplicate selected education indexes',()=>{const f=fixture();f.data.evaluationRequest.services.document.educationIndexes=[0,0];expect(intakeSchema.safeParse(f).success).toBe(false);f.data.evaluationRequest.services.document.educationIndexes=[1];expect(intakeSchema.safeParse(f).success).toBe(false);});
 it('calculates the server PDF price and clears inactive delivery data',()=>{const data=fixture().data;data.evaluationDelivery.address.street='inactive';data.evaluationDelivery.extraCopies=2;const clean=normalizeIntake(data);expect(clean.evaluationDelivery.address.street).toBe('');expect(intakeQuote(clean)).toMatchObject({min:11000,max:11000,needsQuote:false});});
 it('retains ranges for paper copies and quotes translation separately',()=>{const f=fixture();f.data.evaluationDelivery={report:'paper',extraCopies:2,shipping:'internationalFirst',address:{name:'Synthetic',country:'GB',street:'1 Test Road',street2:'',city:'Test City',region:'',postal:'TEST'}};f.data.evaluationRequest.translation=true;expect(intakeSchema.safeParse(f).success).toBe(true);const q=intakeQuote(f.data);expect(q.max-q.min).toBe(4000);expect(q.needsQuote).toBe(true);expect(q.lines.find(l=>l.id==='extraCopy')?.quantity).toBe(2);});
 it('prices only selected qualifications including same-day course',()=>{const f=fixture();f.data.educations.push({...f.data.educations[0],degree:'Test Master'});f.data.evaluationRequest=selectEvaluationService(f.data.evaluationRequest,'course',2);f.data.evaluationRequest.services.course={selected:true,tier:'sameDay',educationIndexes:[1]};expect(intakeSchema.safeParse(f).success).toBe(true);expect(intakeQuote(f.data).min).toBe(46000);});
 it('escapes email content and includes the same status ID',()=>{const f=fixture();f.data.contactName='<script>alert(1)</script>';const mail=confirmationEmail(f.requestId,'zh',f.data,intakeQuote(f.data),'http://localhost:3022');expect(mail.html).not.toContain('<script>');expect(mail.html).toContain('&lt;script&gt;');expect(mail.html).toContain(statusPath(f.requestId,'zh').replace('&','&amp;'));expect(mail.html).toContain('$110.00');});
});
