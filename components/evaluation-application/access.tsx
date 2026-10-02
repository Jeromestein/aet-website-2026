'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { evaluationApi } from './api';
import s from './application.module.css';
export function EvaluationAccess() {
  const t = useTranslations('evaluationWorkflow'); const token = useRef(''); const initialized = useRef(false); const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  useEffect(() => { if (initialized.current) return; initialized.current = true; token.current = new URLSearchParams(location.hash.slice(1)).get('token') || ''; history.replaceState(null, '', location.pathname); setReady(true); }, []);
  return <section className={s.receipt + ' ' + s.panel}><h1>{t('openApplication')}</h1><p className={s.hint}>{t('accessNote')}</p>{error && <p role="alert" className={s.errors}>{t('invalidLink')}</p>}<button className={s.primary} disabled={!ready || busy || !token.current} onClick={async () => { setBusy(true); setError(false); try { const data = await evaluationApi<{ url: string }>('access/consume', { token: token.current }); location.replace(data.url); } catch { setError(true); setBusy(false); } }}>{busy ? t('working') : t('openApplication')}</button>{ready && !token.current && <p className={s.errors}>{t('invalidLink')}</p>}</section>;
}
