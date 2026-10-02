'use client';
import { useTranslations } from 'next-intl';
import type { ApplicationData } from '@/lib/evaluation-application/domain';
import s from './application.module.css';
export function ApplicationDetails({ data }: { data: ApplicationData }) {
  const t = useTranslations('evaluationApplication');
  const destination = data.delivery.sameAddress ? data.client : data.delivery.address;
  return <dl className={s.review}>
    <div><dt>{t('contactHeading')}</dt><dd>{[data.client.name, data.client.email, data.client.phone, data.client.street, data.client.street2, data.client.city, data.client.region, data.client.postal, data.client.country, data.client.office].filter(Boolean).join('\n')}</dd></div>
    <div><dt>{t('fullName')}</dt><dd>{[data.evaluee.first, data.evaluee.middle, data.evaluee.last].filter(Boolean).join(' ')}<br />{data.evaluee.birth}</dd></div>
    {data.educations.map((edu, i) => <div key={i}><dt>{t('educationNumber', { count: i + 1 })}</dt><dd>{edu.degree}<br />{edu.school} · {edu.country}<br />{edu.start} — {edu.end}</dd></div>)}
    <div><dt>{t('purpose')}</dt><dd>{t('purposeOptions.' + data.client.purpose)}</dd></div>
    {(data.services.customized || data.services.translation) && <div><dt>{t('servicesStep')}</dt><dd>{[data.services.customized && t('custom'), data.services.translation && t('translation')].filter(Boolean).join('\n')}</dd></div>}
    {data.delivery.report !== 'pdf' && <div><dt>{t('deliveryHeading')}</dt><dd>{[destination.name, destination.street, destination.street2, destination.city, destination.region, destination.postal, destination.country].filter(Boolean).join('\n')}</dd></div>}
    {data.notes && <div><dt>{t('notes')}</dt><dd>{data.notes}</dd></div>}
  </dl>;
}
