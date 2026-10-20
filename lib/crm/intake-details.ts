import type {IntakeReceipt} from '../application/intake';
import {officeNames} from '../application/intake';
import {evalueeName,type WorkspaceRow} from './contracts';
import {toLegacyEducation} from '../legacy-application/mapping';

/** Adapt the saved intake for shared CRM cards without repricing or writing it. */
export function intakeDetails(record:IntakeReceipt, summary?:WorkspaceRow) {
 const data=record.data,address=data.evaluationDelivery.address;
 const services=[data.evaluationRequest.services.document.selected?'Document by Document':'',data.evaluationRequest.services.course.selected?'Course by Course':'',data.evaluationRequest.translation?'Translation':''].filter(Boolean).join(', ');
 return {
  name:evalueeName({pronouns:data.pronouns,first:data.firstName,middle:data.middleName,last:data.lastName}),
  office:summary?.office??officeNames[data.office]??null,
  service:services||'Formal evaluation',
  address:[address.street,address.street2,address.city,address.region,address.postal,address.country].filter(Boolean).join(', ')||'Not recorded',
  educations:data.educations.map(toLegacyEducation),
  educationLinks:(['document','course'] as const).filter(key=>data.evaluationRequest.services[key].selected).map(key=>({service:key==='document'?'Document by Document':'Course by Course',degrees:data.evaluationRequest.services[key].educationIndexes.map(index=>data.educations[index]?.degree||'Not recorded')})),
  services:{purpose:data.purpose==='other'?'Other':`evaluation-${data.purpose}`,purpose_other:data.notes,
   // Shared card accepts a saved pricing snapshot; do not use current catalog prices.
   service_type:{websiteQuote:{version:1,...record.quote},translation:{required:data.evaluationRequest.translation}},
   due_amount:summary?.amount==null?null:summary.amount/100},
 };
}
