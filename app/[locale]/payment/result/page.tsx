import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { contactPath } from '@/lib/contact';
import styles from './result.module.css';

export const metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string }>;
};

const copy = {
  en: {
    returned: 'You have returned from PayPal',
    cancelled: 'Payment was cancelled',
    note: 'This page does not confirm that a payment was completed. Please check your PayPal receipt or contact the office handling your service.',
    back: 'Back to payment', contact: 'Contact AET',
  },
  zh: {
    returned: '您已从 PayPal 返回',
    cancelled: '付款已取消',
    note: '返回此页面并不能确认付款成功。请查看 PayPal 收据，或联系负责您服务的办公室。',
    back: '返回付款页面', contact: '联系 AET',
  },
  es: {
    returned: 'Ha regresado de PayPal',
    cancelled: 'Se canceló el pago',
    note: 'Regresar a esta página no confirma que se haya completado el pago. Revise su recibo de PayPal o comuníquese con la oficina que atiende su servicio.',
    back: 'Volver a pagos', contact: 'Contactar a AET',
  },
};

export default async function PaymentResult({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { state } = await searchParams;
  const content = copy[locale];
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return <main className={styles.page}>
    <div className={styles.card}>
      <a className={styles.brand} href={prefix || '/'}>AET</a>
      <h1>{state === 'cancelled' ? content.cancelled : content.returned}</h1>
      <p>{content.note}</p>
      <div className={styles.actions}>
        <a className="button primary" href={`${prefix}/payment`}>{content.back}</a>
        <a href={contactPath(locale)}>{content.contact}</a>
      </div>
    </div>
  </main>;
}
