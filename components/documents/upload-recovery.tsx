'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { UnfinishedUpload, UploadRecovery as Recovery } from '@/lib/preeval/upload-recovery';
import styles from './documents.module.css';

/** Uses each transport's existing authorization. Recovery is persisted on the
 * server and survives losing the original browser queue or upload capability. */
export function UploadRecovery({ endpoint, completeEndpoint, token, revision, disabled, onChange, onBusyChange, onAbandon, onList }:
  { endpoint: string; completeEndpoint: string; token?: string; revision?: unknown; disabled?: boolean;
    onList?: (state: Recovery) => void; onChange?: () => void; onBusyChange?: (busy: boolean) => void; onAbandon?: (name: string) => void }) {
  const t = useTranslations('documents');
  const [state, setState] = useState<Recovery | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [completed, setCompleted] = useState(false);
  async function request(url: string, body?: unknown) {
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body) });
    if (!response.ok) throw new Error('recovery_failed');
    return response.json();
  }
  async function refresh() { const value = await request(endpoint); setState(value); onList?.(value); }
  useEffect(() => {
    let active = true;
    void request(endpoint).then(value => { if (active) { setState(value); onList?.(value); setError(false); if (value.pending) setCompleted(false); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
    // Refresh after the host's upload or application reload, not callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, token, revision]);
  async function act(upload?: UnfinishedUpload) {
    if (busy || disabled) return;
    setBusy(true); onBusyChange?.(true); setError(false); setCompleted(false);
    try {
      await request(upload ? endpoint : completeEndpoint, upload || { action: 'complete' });
      if (upload) onAbandon?.(upload.name);
      else setCompleted(true);
      await refresh(); onChange?.();
    } catch {
      setError(true);
      await refresh().catch(() => {});
    } finally { setBusy(false); onBusyChange?.(false); }
  }
  if (!error && !completed && !state?.uploads.length && !state?.pending) return null;
  if (completed && !state?.pending && !disabled) return <p className={styles.successBanner} role="status">{t('assessmentQueued')}</p>;
  return <div className={styles.panel} aria-busy={busy}>
    <h3>{t('recoveryTitle')}</h3>
    <p>{t('recoveryHelp')}</p>
    {error && <p role="alert" className={styles.error}>{t('recoveryError')} <button type="button" disabled={busy || disabled}
      onClick={() => void refresh().then(() => setError(false)).catch(() => setError(true))}>{t('refresh')}</button></p>}
    {!!state?.uploads.length && <ul className={styles.queue}>{state.uploads.map(upload => <li key={upload.source + upload.id}>
      <div className={`${styles.headingRow} ${styles.recoveryRow}`}><strong className={styles.fileName}>{upload.name}</strong>
      {state.canModify && <button type="button" disabled={busy || disabled} onClick={() => void act(upload)}
        aria-label={t('abandonNamed', { name: upload.name })}>{t('abandon')}</button>}</div>
      <p className={styles.fileDetails}>{t(`status.${upload.state === 'failed' ? 'failed' : 'uploading'}`)}</p>
    </li>)}</ul>}
    {state?.canModify && state.pending && <button type="button" className={styles.primary}
      disabled={busy || disabled || !!state.uploads.length || !state.hasReady} onClick={() => void act()}>{t('finishBatch')}</button>}
    {completed && <p role="status">{t('assessmentQueued')}</p>}
  </div>;
}
