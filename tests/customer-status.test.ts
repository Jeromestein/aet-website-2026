import { describe, expect, it } from 'vitest';
import {projectStatus,statusLookup} from '@/lib/customer-status/model';
describe('customer formal status',()=>{
 const row={id:'1cb802d3-00ee-4242-a905-bbaad7e73480',status:'submitted',payment_status:'pending',created_at:'2026-10-15T16:29:32Z',paid_at:null,office:'Miami',due_amount:'340',service_type:{translation:{required:true}},email:'private@example.com',staff_notes:'private',report:'unreleased'};
 it('accepts trimmed uppercase UUIDs and rejects incomplete IDs and extra fields',()=>{expect(statusLookup.parse({applicationId:' '+row.id.toUpperCase()+' '}).applicationId).toBe(row.id);expect(statusLookup.safeParse({applicationId:'123'}).success).toBe(false);expect(statusLookup.safeParse({applicationId:row.id,office:'Miami'}).success).toBe(false);});
 it('projects only customer status fields and preserves saved amounts',()=>{const result=projectStatus(row);expect(result.amount).toBe(34000);expect(result.deadline).toBe('2026-10-17T16:29:32.000Z');expect(result).not.toHaveProperty('email');expect(result).not.toHaveProperty('staff_notes');expect(result).not.toHaveProperty('report');});
 it('has no unpaid deadline for settled or cancelled records',()=>{expect(projectStatus({...row,payment_status:'paid'}).deadline).toBeNull();expect(projectStatus({...row,status:'cancelled'}).deadline).toBeNull();});
 it('does not invent amounts, dates or completion timing',()=>{const result=projectStatus({...row,due_amount:null,created_at:null});expect(result.amount).toBeNull();expect(result.deadline).toBeNull();expect(result.completion).toBeNull();});
});

describe('authorized customer details projection',()=>{
 it('maps only the requested client, evaluee and linked education fields',()=>{
  const result=projectStatus({id:'test',name:'Test Client',country:'US',street_address:'1 Test St',street_address2:'Suite 2',city:'Test City',region:'CA',zip_code:'90000',email:'test@example.com',phone:'123',fax:null,purpose:'evaluation-education',purpose_other:'Customer note',first_name:'Test',middle_name:null,last_name:'Person',date_of_birth:new Date('1990-02-03T00:00:00Z'),pronouns:'mx',staff_notes:'secret',service_type:{},status:'submitted'},[{id:'edu',country_of_study:'HT',school_name:'Test School',degree_obtained:'Diploma',study_start_date:{year:'2010',month:'9'},study_end_date:{year:2012,month:6},ai_output:'private',staff_notes:'secret'}]);
  expect(result.client).toEqual({name:'Test Client',country:'US',street:'1 Test St, Suite 2',city:'Test City, CA, 90000',phone:'123',fax:'',email:'test@example.com',purpose:'evaluation-education',notes:'Customer note'});
  expect(result.evaluee).toEqual({first:'Test',middle:'',last:'Person',birth:'1990-02-03',pronouns:'mx'});
  expect(result.educations).toEqual([{id:'edu',country:'HT',degree:'Diploma',school:'Test School',start:'2010-09',end:'2012-06'}]);
  expect(JSON.stringify(result)).not.toContain('secret');expect(JSON.stringify(result)).not.toContain('ai_output');
 });
 it('preserves empty fields, empty education and date-only births without inventing data',()=>{
  const result=projectStatus({date_of_birth:'1990-02-03',service_type:{}});
  expect(result.client.email).toBe('');expect(result.evaluee.birth).toBe('1990-02-03');expect(result.educations).toEqual([]);
 });
});
