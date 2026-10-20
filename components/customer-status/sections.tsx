"use client";
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {FileManager} from '@/components/documents/file-manager';
import {Upload,FileText,CreditCard,Landmark,UserRound,GraduationCap,ArrowRight,Info,CheckCircle2} from 'lucide-react';
import type {Locale} from '@/i18n/routing';
import type {CustomerStatus} from '@/lib/customer-status/model';
import {sectionsCopy} from '@/lib/customer-status/sections-copy';
import s from './status.module.css';
import { SavedServiceDetails, ConfirmationEmail } from './saved-details';
import countries from '@/lib/legacy-application/countries.json';
export function StatusSections({record,locale,onBusyChange}:{record:CustomerStatus;locale:Locale;onBusyChange?:(busy:boolean)=>void}) {
 const t=sectionsCopy[locale];
 const documents=useTranslations('documents');
 const [method,setMethod]=useState('zelle'),[showZelle,setShowZelle]=useState(false);
 const portal=record.portalUrl;
 const money=record.amount===null?t.unknown:new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(record.amount/100);
 const openPortal=(label: string=t.portal)=>portal?<a className={s.portal} href={portal} target="_blank" rel="noreferrer">{label}<ArrowRight size={17}/></a>:null;
 const displayFields=(labels:readonly string[],values:string[])=><dl className={s.facts}>{labels.map((label,i)=><div key={label}><dt>{label}</dt><dd style={{whiteSpace:'pre-wrap'}}>{values[i]||missing}</dd></div>)}</dl>;
 const missing={en:'Not provided',zh:'未提供',es:'No proporcionado'}[locale];
 const emptyEducation={en:'No education information provided.',zh:'未提供教育信息。',es:'No se proporcionó información académica.'}[locale];
 const country=(code:string)=>countries.find(item=>item.code===code.toUpperCase())?.labels[locale]||code;
 const purpose=({en:{other:'Other','evaluation-education':'Evaluation - Education','evaluation-employment':'Evaluation - Employment','evaluation-uscis':'Evaluation - USCIS'},zh:{other:'其他','evaluation-education':'学历评估 — 升学','evaluation-employment':'学历评估 — 就业','evaluation-uscis':'学历评估 — USCIS'},es:{other:'Otro','evaluation-education':'Evaluación - Educación','evaluation-employment':'Evaluación - Empleo','evaluation-uscis':'Evaluación - USCIS'}}[locale] as Record<string,string>)[record.client.purpose]||record.client.purpose;
 const pronouns=({mr:'Mr. (he/him)',ms:'Ms. (she/her)',mx:'Mx. (they/them)'} as Record<string,string>)[record.evaluee.pronouns]||record.evaluee.pronouns;
 const birth=record.evaluee.birth;
 return <>
  <section className={s.card} aria-labelledby="documents-heading">
   <div className={s.sectionHeading}><Upload size={24}/><h2 id="documents-heading">{t.upload}{record.office&&<> · {record.office}</>}</h2></div>
   <p>{t.intro}</p><div className={s.requirements}><strong>{t.requirements}</strong><ul><li>{t.degrees}</li><li>{t.translations}</li></ul></div>
   <details className={s.licensure}><summary>{t.licensure}</summary><p>{t.licensureNote}</p></details>
   {record.documents?.state==='ready'
    ? <FileManager embedded key={record.documents.token} token={record.documents.token} canUpload={record.documents.canUpload} onBusyChange={onBusyChange}/>
    : <p className={s.sectionNotice} role="status">{documents('errors.unavailable')}</p>}

  </section>
  <section className={s.card} aria-labelledby="services-heading"><div className={s.sectionHeading}><FileText size={24}/><h2 id="services-heading">{t.services}</h2></div>
   {!record.details&&<p className={s.sectionNotice}><Info size={17}/>{t.detailNotice}</p>}
   <div className={s.serviceSummary}>{record.services}</div>
   {displayFields([t.purpose,t.notes],[purpose,record.client.notes])}
   {record.details?<SavedServiceDetails record={record} locale={locale}/>:displayFields([t.delivery,t.additional],[t.notConnected,t.notConnected])}
   {!record.details&&<div className={s.amountRow}><span>{t.total}</span><strong>{money}</strong></div>}<p>{t.quote}</p>
  </section>
  <section className={s.card} aria-labelledby="payment-heading"><div className={s.sectionHeading}><CreditCard size={24}/><h2 id="payment-heading">{t.payment}</h2>{record.payment!=='paid'&&<span className={s.previewBadge}>{t.soon}</span>}</div>
   {record.payment==='paid'?<div className={s.paidState}><CheckCircle2 size={26}/><div><strong>{t.paid}</strong><p>{t.paidNote}</p></div></div>:<>
    <p className={s.sectionNotice}><Info size={17}/>{portal?t.paymentNotice:({en:'Payment is not connected for this application. No payment is requested here.',zh:'此申请尚未接通付款，此处无需支付。',es:'El pago no está conectado para esta solicitud. No se solicita ningún pago aquí.'}[locale])}</p>
    {showZelle?<div className={s.zellePanel}><h3>{t.zelleDetails}</h3><p>{t.zelleHelp}</p>{openPortal()}<button className={s.backButton} type="button" onClick={()=>setShowZelle(false)}>{t.back}</button></div>:<>
     <fieldset className={s.paymentMethods} disabled={!portal}><legend>{t.paymentIntro}</legend>{(['zelle','online'] as const).map(value=><label key={value} data-selected={method===value}><input type="radio" name="status-payment-method" value={value} checked={method===value} onChange={()=>setMethod(value)}/>{value==='zelle'?<Landmark size={22}/>:<CreditCard size={22}/>}<span><strong>{value==='zelle'?t.zelle:t.online}</strong><small>{value==='zelle'?t.zelleNote:t.onlineNote}</small></span></label>)}</fieldset>
     <div className={s.amountRow}><span>{t.total}</span><strong>{money}</strong></div>
     {record.amount===null&&<p>{t.pendingQuote}</p>}
     {!portal?<button type="button" className={s.unavailable} disabled>{t.soon}</button>:method==='zelle'?<button type="button" className={s.portal} onClick={()=>setShowZelle(true)}>{t.continueZelle}<ArrowRight size={17}/></button>:openPortal(t.continueOnline)}
    </>}
   </>}
  </section>
  {record.email&&<ConfirmationEmail key={record.id+record.email.state} id={record.id} email={record.email} locale={locale}/>}
  <section className={s.card} aria-labelledby="client-heading"><div className={s.sectionHeading}><UserRound size={24}/><h2 id="client-heading">{t.client}</h2></div>{displayFields(t.clientFields,[record.client.name,country(record.client.country),record.client.street,record.client.city,record.client.phone,record.client.fax,record.client.email,purpose,record.client.notes])}</section>
  <section className={s.card} aria-labelledby="evaluee-heading"><div className={s.sectionHeading}><GraduationCap size={24}/><h2 id="evaluee-heading">{t.evaluee}</h2></div>{displayFields(t.personFields,[record.evaluee.first,record.evaluee.middle,record.evaluee.last,birth,pronouns])}<h3 className={s.educationTitle}>{t.education}</h3>{record.educations.length?record.educations.map((education,index)=><div className={s.educationCard} key={education.id||index} style={{marginBottom:16}}><h4>{t.degree} {index+1}</h4>{displayFields(t.educationFields,[country(education.country),education.degree,education.school,[education.start||missing,education.end||missing].join(' – ')])}</div>):<p>{emptyEducation}</p>}</section>
 </>;
}
