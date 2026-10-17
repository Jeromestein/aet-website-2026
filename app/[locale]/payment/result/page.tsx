import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { contactPath } from '@/lib/contact';
import { stripeResult, stripePaymentMode } from '@/lib/stripe';
import styles from './result.module.css';
import { Navigation } from '@/components/navigation';
import { SiteFooter } from '@/components/site-footer';

export const metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string; provider?: string; session_id?: string; office?: string }>;
};

const copy = {
  en: {
    returned: 'You have returned from PayPal',
    cancelled: 'Payment was cancelled',
    note: 'This page does not confirm that a payment was completed. Please check your PayPal receipt or contact the office handling your service.',
    back: 'Back to payment', contact: 'Contact AET',
    stripeLabel: 'Stripe · Test payment',
    stripePaid: 'Test payment successful',
    stripePaidNote: 'Stripe confirmed this test payment. No real money was charged and no service order was placed.',
    stripeCancelled: 'Test checkout closed',
    stripeCancelledNote: 'You returned without completing this test checkout. You can return to the form to try again.',
    stripeUnpaid: 'Test payment is not complete',
    stripeUnpaidNote: 'Stripe has not confirmed a completed payment for this test checkout. You can return to the payment form to try again.',
    stripeUnverified: 'Unable to confirm the test payment',
    stripeUnverifiedNote: 'We could not verify this test checkout. Please check its status in Stripe before trying again. This page is not a payment confirmation.',
    stripeUnavailable: 'Stripe test checkout is unavailable',
    stripeUnavailableNote: 'The test checkout could not be opened. Return to the form and try again later.',
    stripeAmount: 'Check the test amount',
    stripeAmountNote: 'Enter a USD test amount between $0.50 and $999,999.99, with no more than two decimal places.',
  },
  zh: {
    returned: '您已从 PayPal 返回',
    cancelled: '付款已取消',
    note: '返回此页面并不能确认付款成功。请查看 PayPal 收据，或联系负责您服务的办公室。',
    back: '返回付款页面', contact: '联系 AET',
    stripeLabel: 'Stripe · 测试支付',
    stripePaid: '测试付款成功',
    stripePaidNote: 'Stripe 已确认这笔测试付款。没有实际扣款，也没有创建服务订单。',
    stripeCancelled: '已退出测试付款',
    stripeCancelledNote: '您已返回，尚未完成本次测试付款。可以返回表单重新尝试。',
    stripeUnpaid: '测试付款尚未完成',
    stripeUnpaidNote: 'Stripe 尚未确认本次测试付款完成。您可以返回付款表单重新尝试。',
    stripeUnverified: '暂时无法确认测试付款',
    stripeUnverifiedNote: '暂时无法核实本次测试付款。请先在 Stripe 中查看其状态，再决定是否重试。此页面不代表付款成功。',
    stripeUnavailable: 'Stripe 测试付款暂不可用',
    stripeUnavailableNote: '暂时无法打开测试付款页面。请返回表单，稍后重试。',
    stripeAmount: '请检查测试金额',
    stripeAmountNote: '请输入 $0.50 至 $999,999.99 之间的美元测试金额，最多保留两位小数。',
  },
  es: {
    returned: 'Ha regresado de PayPal',
    cancelled: 'Se canceló el pago',
    note: 'Regresar a esta página no confirma que se haya completado el pago. Revise su recibo de PayPal o comuníquese con la oficina que atiende su servicio.',
    back: 'Volver a pagos', contact: 'Contactar a AET',
    stripeLabel: 'Stripe · Pago de prueba',
    stripePaid: 'Pago de prueba completado',
    stripePaidNote: 'Stripe confirmó este pago de prueba. No se cobró dinero real ni se creó un pedido de servicio.',
    stripeCancelled: 'Se cerró el pago de prueba',
    stripeCancelledNote: 'Ha regresado sin completar este pago de prueba. Puede volver al formulario para intentarlo de nuevo.',
    stripeUnpaid: 'El pago de prueba no está completo',
    stripeUnpaidNote: 'Stripe no ha confirmado un pago completado para esta prueba. Puede volver al formulario de pago para intentarlo de nuevo.',
    stripeUnverified: 'No se pudo confirmar el pago de prueba',
    stripeUnverifiedNote: 'No pudimos verificar este pago de prueba. Revise su estado en Stripe antes de reintentarlo. Esta página no confirma el pago.',
    stripeUnavailable: 'El pago de prueba de Stripe no está disponible',
    stripeUnavailableNote: 'No se pudo abrir la página de pago de prueba. Regrese al formulario e inténtelo más tarde.',
    stripeAmount: 'Revise el importe de prueba',
    stripeAmountNote: 'Ingrese un importe de prueba en USD entre $0.50 y $999,999.99, con un máximo de dos decimales.',
  },
};

const liveCopy = {
  en: {
    stripeLabel: 'Stripe · Card payment',
    stripePaid: 'Payment successful',
    stripePaidNote: 'Stripe confirmed your payment. Your AET office will match it to your service request. Keep your Stripe receipt for your records.',
    stripeCancelled: 'Checkout closed',
    stripeCancelledNote: 'You returned from Stripe. If you already submitted a payment, check your receipt or contact your AET office before paying again.',
    stripeUnpaid: 'Payment is not complete',
    stripeUnpaidNote: 'Stripe has not confirmed a completed payment. If you submitted a payment, check with your AET office before trying again.',
    stripeUnverified: 'Unable to confirm payment',
    stripeUnverifiedNote: 'We could not verify the payment. Check your Stripe receipt or contact your AET office before paying again. This page is not a payment confirmation.',
    stripeUnavailable: 'Stripe checkout is unavailable',
    stripeUnavailableNote: 'We could not open Stripe checkout. Return to the payment form and try again, or contact your AET office.',
    stripeAmount: 'Check the payment amount',
    stripeAmountNote: 'Enter the quoted USD amount between $0.50 and $999,999.99, with no more than two decimal places.',
  },
  zh: {
    stripeLabel: 'Stripe · 银行卡付款',
    stripePaid: '付款成功',
    stripePaidNote: 'Stripe 已确认您的付款。AET 办公室将核对款项并关联您的服务申请，请保留 Stripe 付款收据。',
    stripeCancelled: '已退出付款页面',
    stripeCancelledNote: '您已从 Stripe 返回。如果您已经提交付款，请先查看收据或联系 AET 办公室确认，再决定是否重新付款。',
    stripeUnpaid: '付款尚未完成',
    stripeUnpaidNote: 'Stripe 尚未确认付款完成。如果您已提交付款，请先联系 AET 办公室确认，避免重复付款。',
    stripeUnverified: '暂时无法确认付款',
    stripeUnverifiedNote: '暂时无法核实付款状态。请先查看 Stripe 收据或联系 AET 办公室，避免重复付款。此页面不代表付款成功。',
    stripeUnavailable: 'Stripe 付款暂不可用',
    stripeUnavailableNote: '暂时无法打开 Stripe 付款页面。请返回付款表单重试，或联系 AET 办公室。',
    stripeAmount: '请检查付款金额',
    stripeAmountNote: '请填写报价中的美元金额，范围为 $0.50 至 $999,999.99，最多保留两位小数。',
  },
  es: {
    stripeLabel: 'Stripe · Pago con tarjeta',
    stripePaid: 'Pago completado',
    stripePaidNote: 'Stripe confirmó su pago. Su oficina de AET lo verificará y lo asociará a su solicitud de servicio. Conserve el recibo de Stripe.',
    stripeCancelled: 'Se cerró la página de pago',
    stripeCancelledNote: 'Ha regresado de Stripe. Si ya envió un pago, revise su recibo o consulte con su oficina de AET antes de pagar de nuevo.',
    stripeUnpaid: 'El pago no está completo',
    stripeUnpaidNote: 'Stripe no ha confirmado el pago. Si ya lo envió, consulte con su oficina de AET antes de intentarlo de nuevo.',
    stripeUnverified: 'No se pudo confirmar el pago',
    stripeUnverifiedNote: 'No pudimos verificar el pago. Revise su recibo de Stripe o consulte con su oficina de AET antes de pagar de nuevo. Esta página no confirma el pago.',
    stripeUnavailable: 'El pago con Stripe no está disponible',
    stripeUnavailableNote: 'No se pudo abrir Stripe. Regrese al formulario e inténtelo de nuevo o contacte a su oficina de AET.',
    stripeAmount: 'Revise el importe',
    stripeAmountNote: 'Ingrese el importe cotizado en USD entre $0.50 y $999,999.99, con un máximo de dos decimales.',
  },
};

export default async function PaymentResult({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const { state, provider, session_id, office } = await searchParams;
  const content = stripePaymentMode() === 'test' ? copy[locale] : { ...copy[locale], ...liveCopy[locale] };
  const prefix = locale === 'en' ? '' : `/${locale}`;
  let title = state === 'cancelled' ? content.cancelled : content.returned;
  let note = content.note;
  if (provider === 'stripe') {
    if (state === 'cancelled') {
      title = content.stripeCancelled;
      note = content.stripeCancelledNote;
    } else if (state === 'unavailable') {
      title = content.stripeUnavailable;
      note = content.stripeUnavailableNote;
    } else if (state === 'invalid-amount') {
      title = content.stripeAmount;
      note = content.stripeAmountNote;
    } else {
      const result = await stripeResult(
        typeof session_id === 'string' ? session_id : undefined,
        typeof office === 'string' ? office : undefined,
      );
      const states = {
        paid: [content.stripePaid, content.stripePaidNote],
        unpaid: [content.stripeUnpaid, content.stripeUnpaidNote],
        unverified: [content.stripeUnverified, content.stripeUnverifiedNote],
      };
      [title, note] = states[result];
    }
  }
  return <>
    <Navigation />
    <main id="main-content" className={styles.page}>
    <div className={styles.card}>
      {provider === 'stripe' && <p>{content.stripeLabel}</p>}
      <h1>{title}</h1>
      <p>{note}</p>
      <div className={styles.actions}>
        <a className="button primary" href={`${prefix}/payment`}>{content.back}</a>
        <a href={contactPath(locale)}>{content.contact}</a>
      </div>
      </div>
    </main>
    <SiteFooter />
  </>;
}
