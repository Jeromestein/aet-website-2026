import {describe,it,expect} from 'vitest';
import {educationDetails,serviceDetails} from '../lib/crm/detail-presentation';

describe('legacy record details',()=>{
  it('uses country names and month/year without guessing missing education',()=>{
    expect(educationDetails({school_name:'Example School',country_of_study:'HT',degree_obtained:'Diploma',study_start_date:{month:'1',year:'1991'},study_end_date:{month:'06',year:'1992'}})).toEqual({school:'Example School',country:'Haiti',degree:'Diploma',period:'01/1991 – 06/1992'});
    expect(educationDetails({}).period).toBe('Not recorded – Not recorded');
  });
  it('matches historical evaluation, additional-degree, delivery and copy charges',()=>{
    const details=serviceDetails({service_type:{foreignCredentialEvaluation:{firstDegree:{speed:'3day'},secondDegrees:2}},delivery_method:'usps_first_class_domestic',additional_services:['extra_copy','pdf_with_hard_copy'],additional_services_quantity:{extra_copy:3}});
    expect(details.totalValue).toBe('$320.00');
    expect(details.sections).toContainEqual({title:'Educational Foreign Credential Evaluation',lines:['First Degree: 3 Business Days - $150','Second Degree: 2 × $40 = $80']});
  });
  it('does not treat translation or customized service as a complete fixed estimate',()=>{
    for(const kind of ['translation','customizedService'])expect(serviceDetails({service_type:{[kind]:{required:true}}}).totalValue).toBe('Due amount is not set yet');
  });
  it('preserves explicit zero and recorded due amounts over estimates',()=>{
    for(const amount of [0,'0','122.50']){
      const details=serviceDetails({due_amount:amount,service_type:{translation:{required:true}}});
      expect(details.totalLabel).toBe('Due Amount');expect(details.totalValue).toBe(`$${Number(amount).toFixed(2)}`);
    }
  });
  it('reads immutable quote cents and turnaround without duplicating delivery/report fees',()=>{
    const details=serviceDetails({service_type:{professionalExperience:{speed:'14day'},websiteQuote:{version:1,currency:'USD',needsQuote:false,min:70200,max:70200,lines:[{id:'expert',quantity:1,min:70000,max:70000,turnaround:{kind:'businessDays',value:14}},{id:'reportPdf',quantity:1,min:200,max:200}]}},additional_services:['pdf_only'],delivery_method:'usps_first_class_domestic'});
    expect(details.totalValue).toBe('$702.00');
    expect(details.sections).toContainEqual({title:'Expert Opinion Letter',lines:['$700.00 · 14 Business Days']});
    expect(details.sections.some(s=>s.title==='Additional Services'||s.title==='Type of Delivery')).toBe(false);
  });
  it('does not replace invalid quote snapshots or unknown legacy prices with a misleading estimate',()=>{
    expect(serviceDetails({service_type:{foreignCredentialEvaluation:{firstDegree:{speed:'7day'}},websiteQuote:{version:99}}}).totalValue).toBe('Not recorded');
    expect(serviceDetails({service_type:{professionalExperience:{speed:'14day'}}}).totalValue).toBe('Not recorded');
    expect(serviceDetails({service_type:{foreignCredentialEvaluation:{firstDegree:{speed:'7day'}}},delivery_method:'unrecognized'}).totalValue).toBe('Not recorded');
  });
  it('displays ranges from a saved quote without implying a confirmed amount',()=>{
    const details=serviceDetails({service_type:{websiteQuote:{version:1,currency:'USD',needsQuote:true,min:10000,max:15000,lines:[{id:'document',quantity:1,min:10000,max:15000}]}}});
    expect(details.sections).toContainEqual({title:'Educational Foreign Credential Evaluation',lines:['$100.00–$150.00']});
    expect(details.totalValue).toBe('Due amount is not set yet');
  });
});
