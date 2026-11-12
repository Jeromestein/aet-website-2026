import { describe, expect, it } from 'vitest';
import { initialDraft, restoreDraft, validateStep } from '../lib/application/model';
import { preEvaluationInput } from '../lib/application/preevaluation';
import { restoreSubmissionAttempt, submissionKey } from '../lib/application/submission';
import { applicationSchema } from '../lib/preeval/domain';

const requestId = '10000000-0000-4000-8000-000000000001';
const data = () => ({...initialDraft('pre-evaluation'), contactName:'Example Organization', email:'TEST@example.invalid',
  phone:'+1 202 555 0148', office:'la', pronouns:'ms', firstName:'Test', middleName:'', lastName:'Applicant',
  residenceCountry:'US', dateOfBirth:'1990-01-10', preevaluationTerms:true, notes:'Applicant supplied note',
  educations:[{school:'Example University',country:'CN',degree:'Bachelor of Science',start:'2015-09',end:'2019-06'}]});

describe('unified pre-evaluation intake', () => {
  it('maps the active qualification and keeps contact, evaluee and residence separate', () => {
    const mapped = preEvaluationInput({requestId,locale:'zh',data:{...data(),educations:[...data().educations,{school:'',country:'',degree:'',start:'',end:''}]}});
    expect(mapped).toMatchObject({requestId,locale:'zh',email:'test@example.invalid',firstName:'Test',country:'US',countryOfStudy:'CN',
      schoolName:'Example University',terms:true,uploadsPending:true,unified:{contactName:'Example Organization',office:'la',phone:'+1 202 555 0148',pronouns:'ms',notes:'Applicant supplied note'}});
    expect(mapped).not.toHaveProperty('evaluationRequest');
  });
  it.each([{office:'boston'},{preevaluationTerms:false},{residenceCountry:''},{phone:'invalid'},{pronouns:''},
    {firstName:''},{dateOfBirth:'2001-02-29'},{service:'translation'}])('rejects invalid submissions before persistence: %j', patch => {
    expect(() => preEvaluationInput({requestId,locale:'en',data:{...data(),...patch}})).toThrow('invalid_application');
  });
  it('does not impose pre-evaluation residence or consent on formal intake', () => {
    expect(validateStep(initialDraft('evaluation'),1)).not.toHaveProperty('residenceCountry');
    expect(validateStep(initialDraft('evaluation'),2)).toEqual({});
  });
  it('restores an older draft but returns to missing residence information', () => {
    const {residenceCountry:_,preevaluationTerms:__,...old} = data();
    expect(restoreDraft(JSON.stringify({version:1,updatedAt:Date.now(),step:2,data:old}))).toMatchObject({step:1,data:{residenceCountry:'',preevaluationTerms:false,firstName:'Test'}});
  });
  it('preserves the legacy input shape and refuses unified intake that starts AI immediately', () => {
    const {unified, ...legacy} = preEvaluationInput({requestId,locale:'en',data:data()});
    expect(applicationSchema.parse(legacy)).not.toHaveProperty('unified');
    expect(applicationSchema.safeParse({...legacy,unified,uploadsPending:false}).success).toBe(false);
  });
  it('keeps retry keys service-specific and rebuilds saved destinations from IDs', () => {
    const payload = JSON.stringify({locale:'zh',data:data()});
    const raw = JSON.stringify({requestId,payload,result:{id:requestId,statusPath:'https://untrusted.invalid'}});
    expect(submissionKey('evaluation')).not.toBe(submissionKey('pre-evaluation'));
    expect(restoreSubmissionAttempt(raw,'evaluation')).toBeNull();
    expect(restoreSubmissionAttempt(raw,'pre-evaluation')).toEqual({requestId,payload,result:{id:requestId,service:'pre-evaluation'}});
    expect(restoreSubmissionAttempt('{broken','pre-evaluation')).toBeNull();
  });
});
