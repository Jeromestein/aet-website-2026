"use client";
import {useRef,useState,type ChangeEvent,type DragEvent} from 'react';
import {Upload,FileText,CreditCard,Landmark,UserRound,GraduationCap,ArrowRight,Info,X,CheckCircle2} from 'lucide-react';
import type {Locale} from '@/i18n/routing';
import type {CustomerStatus} from '@/lib/customer-status/model';
import {sectionsCopy} from '@/lib/customer-status/sections-copy';
import s from './status.module.css';
import countries from '@/lib/legacy-application/countries.json';
export function StatusSections({record,locale}:{record:CustomerStatus;locale:Locale}) {
 const t=sectionsCopy[locale];
 const [files,setFiles]=useState<File[]>([]),[fileError,setFileError]=useState(''),[dragging,setDragging]=useState(false);
 const [method,setMethod]=useState('zelle'),[showZelle,setShowZelle]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 const portal='https://app.americantranslationservice.com/status?applicationId='+encodeURIComponent(record.id);
 const locked=['completed','cancelled'].includes(record.status);
 const money=record.amount===null?t.unknown:new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(record.amount/100);
 function addFiles(list:FileList|null) {
  if(!list)return;
  const accepted=Array.from(list).filter(f=>/\.(jpe?g|png|pdf|docx?)$/i.test(f.name)&&f.size>0&&f.size<=50*1024*1024);
  setFileError(accepted.length===list.length?'':t.invalid);
  setFiles(old=>[...old,...accepted.filter(f=>!old.some(o=>o.name===f.name&&o.size===f.size&&o.lastModified===f.lastModified))]);
 }
 function choose(e:ChangeEvent<HTMLInputElement>){addFiles(e.target.files);e.target.value='';}
 function drop(e:DragEvent){e.preventDefault();setDragging(false);if(!locked)addFiles(e.dataTransfer.files);}
 const openPortal=(label: string=t.portal)=><a className={s.portal} href={portal} target="_blank" rel="noreferrer">{label}<ArrowRight size={17}/></a>;
 const fields=(labels:readonly string[])=><dl className={s.facts}>{labels.map(label=><div key={label}><dt>{label}</dt><dd className={s.placeholder}>{t.notConnected}</dd></div>)}</dl>;
 const displayFields=(labels:readonly string[],values:string[])=><dl className={s.facts}>{labels.map((label,i)=><div key={label}><dt>{label}</dt><dd style={{whiteSpace:'pre-wrap'}}>{values[i]||missing}</dd></div>)}</dl>;
 const missing={en:'Not provided',zh:'未提供',es:'No proporcionado'}[locale];
 const emptyEducation={en:'No education information provided.',zh:'未提供教育信息。',es:'No se proporcionó información académica.'}[locale];
 const country=(code:string)=>countries.find(item=>item.code===code.toUpperCase())?.labels[locale]||code;
 const purpose=({en:{'evaluation-education':'Evaluation - Education','evaluation-employment':'Evaluation - Employment','evaluation-uscis':'Evaluation - USCIS'},zh:{'evaluation-education':'学历评估 — 升学','evaluation-employment':'学历评估 — 就业','evaluation-uscis':'学历评估 — USCIS'},es:{'evaluation-education':'Evaluación - Educación','evaluation-employment':'Evaluación - Empleo','evaluation-uscis':'Evaluación - USCIS'}}[locale] as Record<string,string>)[record.client.purpose]||record.client.purpose;
 const pronouns=({mr:'Mr. (he/him)',ms:'Ms. (she/her)',mx:'Mx. (they/them)'} as Record<string,string>)[record.evaluee.pronouns]||record.evaluee.pronouns;
 const birth=record.evaluee.birth;
 return <>
  <section className={s.card} aria-labelledby="documents-heading">
   <div className={s.sectionHeading}><Upload size={24}/><h2 id="documents-heading">{t.upload}{record.office&&<> · {record.office}</>}</h2></div>
   <p>{t.intro}</p><div className={s.requirements}><strong>{t.requirements}</strong><ul><li>{t.degrees}</li><li>{t.translations}</li></ul></div>
   <details className={s.licensure}><summary>{t.licensure}</summary><p>{t.licensureNote}</p></details>
   <div className={s.subheading}><h3>{t.files}</h3><span className={s.previewBadge}>{t.soon}</span></div>
   <div className={s.fileEmpty}><FileText size={27}/><p>{t.filesNotice}</p><a href={portal} target="_blank" rel="noreferrer">{t.refresh}</a></div>
   {!locked&&<><p className={s.sectionNotice}><Info size={17}/>{t.uploadNotice}</p>
    <div className={s.dropzone} data-dragging={dragging} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={drop}>
     <Upload size={30}/><button type="button" className={s.chooseFile} onClick={()=>input.current?.click()}>{t.choose}</button><p>{t.rules}</p>
     <input ref={input} type="file" aria-label={t.choose} multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={choose} className={s.fileInput}/>
    </div>
    {fileError&&<p role="alert" className={s.error}>{fileError}</p>}
    {!!files.length&&<div className={s.fileQueue}><h3>{t.selected} ({files.length})</h3><ul>{files.map((f,i)=><li key={f.name+f.lastModified}><FileText size={18}/><span>{f.name}<small>{(f.size/1024/1024).toFixed(2)} MB</small></span><button type="button" aria-label={t.remove+' '+f.name} onClick={()=>setFiles(old=>old.filter((_,index)=>index!==i))}><X size={17}/></button></li>)}</ul></div>}
    <button type="button" className={s.unavailable} disabled>{t.uploadAction}</button>
   </>}
   {openPortal()}
  </section>
  <section className={s.card} aria-labelledby="services-heading"><div className={s.sectionHeading}><FileText size={24}/><h2 id="services-heading">{t.services}</h2></div>
   <p className={s.sectionNotice}><Info size={17}/>{t.detailNotice}</p>
   <div className={s.serviceSummary}>{record.services}</div>
   {fields([t.purpose,t.notes,t.delivery,t.additional])}
   <div className={s.amountRow}><span>{t.total}</span><strong>{money}</strong></div><p>{t.quote}</p>
  </section>
  <section className={s.card} aria-labelledby="payment-heading"><div className={s.sectionHeading}><CreditCard size={24}/><h2 id="payment-heading">{t.payment}</h2>{record.payment!=='paid'&&<span className={s.previewBadge}>{t.soon}</span>}</div>
   {record.payment==='paid'?<div className={s.paidState}><CheckCircle2 size={26}/><div><strong>{t.paid}</strong><p>{t.paidNote}</p></div></div>:<>
    <p className={s.sectionNotice}><Info size={17}/>{t.paymentNotice}</p>
    {showZelle?<div className={s.zellePanel}><h3>{t.zelleDetails}</h3><p>{t.zelleHelp}</p>{openPortal()}<button className={s.backButton} type="button" onClick={()=>setShowZelle(false)}>{t.back}</button></div>:<>
     <fieldset className={s.paymentMethods}><legend>{t.paymentIntro}</legend>{(['zelle','online'] as const).map(value=><label key={value} data-selected={method===value}><input type="radio" name="status-payment-method" value={value} checked={method===value} onChange={()=>setMethod(value)}/>{value==='zelle'?<Landmark size={22}/>:<CreditCard size={22}/>}<span><strong>{value==='zelle'?t.zelle:t.online}</strong><small>{value==='zelle'?t.zelleNote:t.onlineNote}</small></span></label>)}</fieldset>
     <div className={s.amountRow}><span>{t.total}</span><strong>{money}</strong></div>
     {record.amount===null&&<p>{t.pendingQuote}</p>}
     {method==='zelle'?<button type="button" className={s.portal} onClick={()=>setShowZelle(true)}>{t.continueZelle}<ArrowRight size={17}/></button>:openPortal(t.continueOnline)}
    </>}
   </>}
  </section>
  <section className={s.card} aria-labelledby="client-heading"><div className={s.sectionHeading}><UserRound size={24}/><h2 id="client-heading">{t.client}</h2></div>{displayFields(t.clientFields,[record.client.name,country(record.client.country),record.client.street,record.client.city,record.client.phone,record.client.fax,record.client.email,purpose,record.client.notes])}</section>
  <section className={s.card} aria-labelledby="evaluee-heading"><div className={s.sectionHeading}><GraduationCap size={24}/><h2 id="evaluee-heading">{t.evaluee}</h2></div>{displayFields(t.personFields,[record.evaluee.first,record.evaluee.middle,record.evaluee.last,birth,pronouns])}<h3 className={s.educationTitle}>{t.education}</h3>{record.educations.length?record.educations.map((education,index)=><div className={s.educationCard} key={education.id||index} style={{marginBottom:16}}><h4>{t.degree} {index+1}</h4>{displayFields(t.educationFields,[country(education.country),education.degree,education.school,[education.start||missing,education.end||missing].join(' – ')])}</div>):<p>{emptyEducation}</p>}</section>
 </>;
}
