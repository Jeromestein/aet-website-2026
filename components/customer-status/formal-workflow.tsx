'use client';
import {useState} from 'react';
import {CreditCard,FileDown,MessageSquare,RefreshCw} from 'lucide-react';
import type {Locale} from '@/i18n/routing';
import type {CustomerStatus} from '@/lib/customer-status/model';
import s from './status.module.css';

const copy={
 en:{payment:'Payment',total:'Current total',pay:'Continue to secure payment',pending:'Your office will confirm the final fee before payment.',paid:'Payment received',checking:'Refresh payment status',checked:'Payment status updated.',error:'This action could not be completed. Refresh your application and try again.',request:'Information Requested',report:'Your Evaluation Report',download:'Download PDF report',waiting:'Your report will appear here after our team completes and publishes it.',test:'Test payment only. No live charge will be made.',closed:'Payment is not available for this application.'},
 zh:{payment:'付款',total:'当前总金额',pay:'前往安全付款',pending:'办公室确认最终费用后即可付款。',paid:'付款已收到',checking:'刷新付款状态',checked:'付款状态已更新。',error:'暂时无法完成此操作，请刷新申请后重试。',request:'需要补充的信息',report:'您的评估报告',download:'下载 PDF 报告',waiting:'工作人员完成并发布后，您可以在这里下载报告。',test:'仅用于测试付款，不会产生真实扣款。',closed:'此申请目前无法付款。'},
 es:{payment:'Pago',total:'Total actual',pay:'Continuar al pago seguro',pending:'Su oficina confirmará la tarifa final antes del pago.',paid:'Pago recibido',checking:'Actualizar el estado del pago',checked:'Estado del pago actualizado.',error:'No se pudo completar la acción. Actualice la solicitud e inténtelo de nuevo.',request:'Información solicitada',report:'Su informe de evaluación',download:'Descargar informe PDF',waiting:'Su informe aparecerá aquí cuando nuestro equipo lo complete y publique.',test:'Solo pago de prueba. No se realizará un cargo real.',closed:'El pago no está disponible para esta solicitud.'},
};
type WorkflowProps = {record:CustomerStatus; locale:Locale} & (
 {part:'payment'; onRefreshPayment:()=>Promise<void>} |
 {part:'message'|'report'; onRefreshPayment?:never}
);

export function FormalWorkflow({record,locale,part,onRefreshPayment}:WorkflowProps) {
 const t=copy[locale],w=record.workflow;
 const [busy,setBusy]=useState<'checkout'|'reconcile'|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 if(!w)return null;
 async function action(endpoint:'checkout'|'reconcile'){
  setBusy(endpoint);setError('');setNotice('');
  try {
   const response=await fetch(`/api/evaluation/applications/${record.id}/${endpoint}`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:'{}',
   });
   if(!response.ok)throw new Error();
   if(endpoint==='reconcile' && onRefreshPayment){
    await onRefreshPayment();
    setNotice(t.checked);
   } else {
    const data=await response.json();
    if(!data.url)throw new Error();
    location.assign(data.url);
   }
  } catch {
   setError(t.error);
  } finally {
   setBusy(null);
  }
 }
 if(part==='message')return record.status==='needs_information'&&w.message?<section className={s.card}><div className={s.sectionHeading}><MessageSquare size={24}/><h2>{t.request}</h2></div><p style={{whiteSpace:'pre-wrap'}}>{w.message}</p></section>:null;
 if(part==='report')return <section className={s.card}><div className={s.sectionHeading}><FileDown size={24}/><h2>{t.report}</h2></div>{w.report?<><p>{w.report.name}</p><a className={s.portal} href={`/api/evaluation/applications/${record.id}/files/${w.report.id}`}>{t.download}</a></>:<p>{t.waiting}</p>}</section>;
 const paid=record.payment==='paid';
 const canPay=!paid&&w.canPay;
 const canRefresh=record.payment==='pending';
 return <section className={s.card}><div className={s.sectionHeading}><CreditCard size={24}/><h2>{t.payment}</h2></div>
  {record.amount!==null&&<div className={s.amountRow}><span>{t.total}</span><strong>{new Intl.NumberFormat(locale,{style:'currency',currency:'USD'}).format(record.amount/100)}</strong></div>}
  {w.confirmedQuote&&<p style={{whiteSpace:'pre-wrap'}}>{w.confirmedQuote.explanation}</p>}
  {paid&&<p className={s.paid}>{t.paid}</p>}
  {canPay&&!w.production&&<p>{t.test}</p>}
  {!paid&&!canPay&&<p>{record.amount===null?t.pending:t.closed}</p>}
  {(canPay||canRefresh)&&
   <div className={s.paymentActions}>
    {canPay&&<button type="button" className={s.portal} disabled={busy!==null} onClick={()=>void action('checkout')}>{t.pay}</button>}
    {canRefresh&&<button type="button" className={s.refreshPayment} title={t.checking} aria-label={t.checking} aria-busy={busy==='reconcile'} disabled={busy!==null} onClick={()=>void action('reconcile')}><RefreshCw size={18} aria-hidden="true"/></button>}
   </div>}
  {error&&<p role="alert" className={s.error}>{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
