'use client';

import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import { label, money } from '@/lib/crm/contracts';
import type { ApplicationRecord } from '@/lib/evaluation-application/workflow';
import { Badge, errorMessage, request } from './ui';
import s from './crm.module.css';

export function FormalPaymentSummary({ record, onSaved }: {
  record: ApplicationRecord;
  onSaved: () => Promise<void>;
}) {
  const [editVersion, setEditVersion] = useState<number | null>(null);
  const editing = editVersion !== null;
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const total = Math.round(Number(amount) * 100);
  const valid = /^\d+(\.\d{1,2})?$/.test(amount) && total >= 50 && total <= 999999 && total !== record.total;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || busy) return;
    const explanation = String(new FormData(event.currentTarget).get('explanation') ?? '').trim();
    if (explanation.length < 3) {
      setError('Enter a short explanation for the applicant.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await request('/api/evaluation/applications/' + record.id + '/staff', {
        action: 'adjust_amount', version: editVersion, total, explanation,
      });
      setEditVersion(null);
      setSaved(true);
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return <div className={s.paymentSummary}>
    <span>Application quote</span>
    <div className={s.quoteAmountRow}>
      <strong>{money(record.total)}</strong>
      {record.canEditAmount && !editing && <button type="button" className={s.smallButton}
        onClick={() => { setAmount(record.total === null ? '' : (record.total / 100).toFixed(2)); setError(''); setSaved(false); setEditVersion(record.version); }}>
        <Pencil size={14} aria-hidden="true" /> Edit amount
      </button>}
    </div>
    <Badge tone={record.payment_status === 'paid' ? 'green' : 'amber'}>{label(record.payment_status)}</Badge>
    {editing && record.canEditAmount && <form className={s.form} onSubmit={save}>
      <label>New amount due (USD)<input autoFocus required type="number" inputMode="decimal" min="0.50" max="9999.99" step="0.01"
        value={amount} onChange={e => setAmount(e.target.value)} /></label>
      <label>Explanation for the applicant<textarea name="explanation" required minLength={3} maxLength={2000} rows={2} /></label>
      {valid && <p className={s.helperText} aria-live="polite">
        {record.total === null ? 'New amount due: ' : 'Change from ' + money(record.total) + ' to '}{money(total)}. The applicant will receive a fee update by email.
      </p>}
      <div className={s.quoteActions}>
        <button type="submit" className={s.primaryButton} disabled={busy || !valid}>{busy ? 'Saving…' : 'Confirm amount'}</button>
        <button type="button" className={s.secondaryButton} disabled={busy} onClick={() => { setEditVersion(null); setError(''); }}>Cancel</button>
      </div>
    </form>}
    {saved && <p role="status" className={s.helperText}>Amount saved. Fee update queued for delivery.</p>}
    {error && <p role="alert" className={s.formError}>{error}</p>}
  </div>;
}
