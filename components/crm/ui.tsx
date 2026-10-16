'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { officeCodes } from '@/lib/crm/contracts';
import s from './crm.module.css';
export function Badge({ children, tone='neutral' }: { children: ReactNode; tone?: string }) { return <span className={s.badge+' '+(s[tone]||'')}>{children}</span>; }
export function OfficeBadge({ office, large=false }: { office: string|null; large?: boolean }) { const name=office||'Unassigned'; return <span className={s.officeBadge+(large?' '+s.largeOfficeBadge:'')} data-office={officeCodes[name]} role="img" aria-label={name+' office'} title={name}>{officeCodes[name]||'—'}</span>; }
export function WorkspaceDialog({ open,onClose,title,children,drawer=false }: { open:boolean;onClose:()=>void;title:string;children:ReactNode;drawer?:boolean }) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(!open||!dialog)return;const previous=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=previous;};},[open]);
  return <dialog ref={ref} aria-label={title} className={s.dialog+(drawer?' '+s.drawer:'')} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div className={s.dialogInner}><div className={s.dialogHeader}><span>{drawer?'APPLICATION DETAILS':'AET WORKSPACE'}</span><button type="button" className={s.iconButton} aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</div></dialog>;
}
export class WorkspaceError extends Error { constructor(public code:string,public status:number){super(code);} }
export async function request<T=any>(path:string,body?:unknown,signal?:AbortSignal):Promise<T>{
  const response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body instanceof FormData?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body),signal});
  const data=await response.json();if(!response.ok)throw new WorkspaceError(data.error||'service_unavailable',response.status);return data;
}
export function errorMessage(error:unknown){const code=error instanceof Error?error.message:'';return ({access_denied:'You no longer have access to this application. Refresh the workspace or sign in again.',stale_version:'Another change was saved first. Refresh the application before saving again.',invalid_quote:'Check the original estimate and additional service amount.',quote_locked:'This quote is locked by a payment. Reconcile the payment first.',report_not_ready:'Payment, supporting documents and a current report are required before release.',payment_and_documents_required:'Payment and supporting documents are required before processing.',application_locked:'This application is closed.',invalid_result:'Enter an equivalency and an assessment basis.',invalid_request:'Check the required fields and try again.',upload_failed:'The upload did not finish. Please retry.',export_too_large:'Narrow the filters to 5,000 applications or fewer before exporting.',too_many_requests:'Too many attempts. Please try again later.'} as Record<string,string>)[code]||'The service is unavailable. Please refresh and try again.';}
