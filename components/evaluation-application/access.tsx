'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { pathFor } from '@/lib/preeval/domain';
import s from './application.module.css';
export function EvaluationAccess({ locale, preEvaluation = false }: { locale: string; preEvaluation?: boolean }) {
  const t = useTranslations('evaluationWorkflow');
  useEffect(() => { history.replaceState(null, '', location.pathname); }, []);
  return <section className={s.receipt + ' ' + s.panel}>
    <h1>{t('openApplication')}</h1><p className={s.hint}>{t('accessNote')}</p>
    <a className={s.primary} href={preEvaluation ? pathFor(locale, '/status') : pathFor(locale, '/status') + '?source=preview'}>{t('checkApplication')}</a>
    <p><a href={pathFor(locale, '/contact')}>{t('contact')}</a></p>
  </section>;
}
