'use client';

import { useEffect, useState } from 'react';
import { date, label, money, type CaseReference, type WorkspaceRow } from '@/lib/crm/contracts';
import { serviceBadgeLabel } from '@/lib/crm/service-badge';
import { CaseDetailHeader } from './case-detail-header';
import { CaseDocuments } from './documents';
import { EducationHistory, SelectedServices } from './record-details';
import { WorkspaceDialog, errorMessage, request } from './ui';
import s from './crm.module.css';

type LegacyDetail = {
  summary: WorkspaceRow;
  row: {phone?:string; street_address?:string; street_address2?:string; city?:string; region?:string; zip_code?:string; country?:string; purpose_other?:string; notes?:string; payment_id?:string; paid_at?:string};
  educations: {id:string; school_name?:string; ai_output?:unknown}[];
  audit: {action:string; actor:string; created_at:string}[];
};

export default function LiveCaseDrawer({ target, initial, initialTab = 'overview', onClose }: {
  target: CaseReference; initial?: WorkspaceRow; initialTab?: string; onClose: () => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [detail, setDetail] = useState<LegacyDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    // Unified list rows already contain the entire authorized history projection.
    if (initial) return;
    const controller = new AbortController();
    request<LegacyDetail>(`/api/staff-records/${target.kind}/${encodeURIComponent(target.id)}`, undefined, controller.signal)
      .then(setDetail).catch(e => { if (e.name !== 'AbortError') setError(errorMessage(e)); });
    return () => controller.abort();
  }, [initial, target.id, target.kind]);

  const row = initial ?? detail?.summary;
  const tabs = target.kind === 'payment' ? ['overview','payment','activity'] : ['overview','education','service','payment'];
  if (detail && target.kind !== 'payment') tabs.push('documents','activity');
  const recordedAmount = row?.amount == null ? 'Not recorded' : money(row.amount);
  return <WorkspaceDialog open onClose={onClose} title={(row?.name || 'Application') + ' application details'} drawer>
    {error && <p role="alert" className={s.formError}>{error}</p>}
    {row ? <>
      <CaseDetailHeader id={row.id} name={row.name} office={row.office} service={serviceBadgeLabel(row.kind === 'preeval' ? 'Pre-Evaluation' : row.service)}
        status={row.status} paymentStatus={row.payment_status} caption="Legacy record · Read only"
        statusHref={row.kind === 'formal' ? 'https://app.americantranslationservice.com/status?applicationId=' + encodeURIComponent(row.id) : undefined}
        tabs={tabs} tab={tab} onTab={setTab}/>
      <div className={s.detailContent}>
        {tab === 'overview' && <section><h3>Client information</h3><dl className={s.detailGrid}>
          <div><dt>Evaluee name</dt><dd>{row.name}</dd></div>
          <div><dt>Email</dt><dd>{row.email || 'Not recorded'}</dd></div>
          <div><dt>Office</dt><dd>{row.office || 'Unassigned'}</dd></div>
          <div><dt>Created at</dt><dd>{date(row.created_at)}</dd></div>
          <div><dt>Updated at</dt><dd>{date(row.updated_at)}</dd></div>
          {detail?.row.phone && <div><dt>Phone</dt><dd>{detail.row.phone}</dd></div>}
          {detail?.row.street_address && <div><dt>Address</dt><dd>{[detail.row.street_address,detail.row.street_address2,detail.row.city,detail.row.region,detail.row.zip_code,detail.row.country].filter(Boolean).join(', ')}</dd></div>}
          {(detail?.row.purpose_other || detail?.row.notes) && <div><dt>Notes</dt><dd>{detail.row.purpose_other || detail.row.notes}</dd></div>}
        </dl></section>}
        {tab === 'education' && <section><h3>Education history</h3>{detail ? <EducationHistory educations={detail.educations}/> :
          row.educations.length ? row.educations.map((e,i) => <article key={i} className={s.educationHistoryCard}><strong>{e.degree}</strong><p>{[e.school,e.country].filter(Boolean).join(' · ')}</p><p>{[e.start,e.end].filter(Boolean).join(' – ')}</p></article>) : <p>No education records found.</p>}</section>}
        {tab === 'service' && <section>{detail && row.kind === 'formal' ? <SelectedServices application={detail.row}/> :
          <><h3>Requested service</h3><p>{row.service}</p><p>{label(row.purpose)}</p></>}
          {row.kind === 'preeval' && detail?.educations.map(e => e.ai_output ? <div key={e.id}><h3>{e.school_name}</h3><p>{typeof e.ai_output === 'string' ? e.ai_output : JSON.stringify(e.ai_output)}</p></div> : null)}
        </section>}
        {tab === 'payment' && <section><h3>Recorded payment</h3><p>{recordedAmount} · {label(row.payment_status)}</p>
          {detail?.row.payment_id && <p>{detail.row.payment_id} · {date(detail.row.paid_at || '')}</p>}
          {row.payments.map(p => <div className={s.detailPayment} key={p.id}><span>{label(p.status)} · {date(p.created_at)}</span><strong>{money(p.amount_cents)}</strong></div>)}
        </section>}
        {tab === 'documents' && detail && <CaseDocuments kind={target.kind} id={target.id}/>}
        {tab === 'activity' && detail && <section><h3>Activity</h3>{detail.audit.map((a,i)=><p key={i}>{label(a.action)} · {a.actor} · {date(a.created_at)}</p>)}{!detail.audit.length && <p>No changes recorded here yet.</p>}</section>}
      </div>
    </> : !error && <p>Loading application…</p>}
  </WorkspaceDialog>;
}
