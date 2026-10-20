import {describe,it,expect} from 'vitest';
import {initialDraft} from '../lib/application/model';
import {selectEvaluationService} from '../lib/application/evaluation';
import {intakeQuote,type IntakeReceipt} from '../lib/application/intake';
import {intakeDetails} from '../lib/crm/intake-details';
import {serviceDetails,educationDetails} from '../lib/crm/detail-presentation';

function fixture():IntakeReceipt {
 const data={...initialDraft('evaluation'),contactName:'Different Contact',office:'miami',pronouns:'mx',firstName:'Test',middleName:'Middle',lastName:'Applicant',purpose:'other',educations:[{school:'Fictional School',degree:'Test Bachelor',country:'GB',start:'2010-09',end:'2014-06'}]};
 data.evaluationRequest=selectEvaluationService(data.evaluationRequest,'document',1);
 return {id:'11111111-1111-4111-8111-111111111111',locale:'en',status:'submitted',createdAt:'2026-10-20T12:00:00Z',data,quote:intakeQuote(data),email:{state:'sent',attempts:1,recipient:'test@example.invalid'},statusPath:'/status?source=preview&applicationId=test'};
}
describe('test intake presentation',()=>{
 it('shows evaluee identity and original education in the live card format',()=>{
  const detail=intakeDetails(fixture());
  expect(detail.name).toBe('Mx. Test Middle Applicant');
  expect(detail.office).toBe('Miami');
  expect(educationDetails(detail.educations[0])).toMatchObject({school:'Fictional School',degree:'Test Bachelor',period:'09/2010 – 06/2014'});
  expect(detail.educationLinks).toEqual([{service:'Document by Document',degrees:['Test Bachelor']}]);
 });
 it('preserves stored prices and descriptive PDF labels without repricing or mutating input',()=>{
  const record=fixture();
  record.quote.lines[0].min=record.quote.lines[0].max=12345;
  record.quote.min=record.quote.max=13345;
  const before=structuredClone(record);
  const details=serviceDetails(intakeDetails(record).services);
  expect(details.totalValue).toBe('$133.45');
  expect(details.sections).toContainEqual({title:'PDF Report Only (No Hard Copy)',lines:['$10.00']});
  expect(record).toEqual(before);
 });
 it('does not turn a quote-required translation into a fixed total',()=>{
  const record=fixture();record.data.evaluationRequest.translation=true;record.quote.needsQuote=true;
  expect(serviceDetails(intakeDetails(record).services).totalValue).toBe('Due amount is not set yet');
 });
});
