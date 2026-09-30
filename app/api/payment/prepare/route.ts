import { paymentOffices } from '@/lib/payment';

export const runtime = 'nodejs';

const paypalUrl = 'https://www.paypal.com/cgi-bin/webscr';
const services = new Set(['翻译公证', '学位评估', '美国口译', '其他服务']);
const envByOffice = {
  miami: 'PAYPAL_BUSINESS_MIAMI',
  boston: 'PAYPAL_BUSINESS_BOSTON',
  california: 'PAYPAL_BUSINESS_CALIFORNIA',
  nyc: 'PAYPAL_BUSINESS_NYC',
} as const;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function errorResponse(message: string, status: number) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const type = request.headers.get('content-type') ?? '';
  if (!type.startsWith('application/x-www-form-urlencoded') && !type.startsWith('multipart/form-data')) {
    return errorResponse('Invalid form submission.', 415);
  }

  const form = await request.formData();
  const value = (key: string) => typeof form.get(key) === 'string' ? String(form.get(key)).trim() : '';
  const office = value('office');
  const service = value('service');
  const amount = value('amount');
  const name = value('custname');
  const email = value('email');
  const locale = ['en', 'zh', 'es'].includes(value('locale')) ? value('locale') : 'en';

  if (!paymentOffices.some(entry => entry === office) || !services.has(service) ||
      !/^\d{1,7}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 ||
      name.length < 1 || name.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 || value('terms') !== '1') {
    return errorResponse('Please check the required payment fields and try again.', 400);
  }

  const business = process.env[envByOffice[office as keyof typeof envByOffice]];
  const siteUrl = process.env.PAYMENT_SITE_URL;
  if (!business || !siteUrl || !/^https:\/\//.test(siteUrl) && !/^http:\/\/localhost(?::\d+)?$/.test(siteUrl)) {
    return errorResponse('Online payment is temporarily unavailable. Please contact your AET office.', 503);
  }

  const base = siteUrl.replace(/\/$/, '');
  const prefix = locale === 'en' ? '' : `/${locale}`;
  // Match the legacy open-button flow: buyers enter the description at PayPal.
  // Prefilling item_name skips that page and opens the login/card-choice screen.
  const fields: Record<string, string> = {
    cmd: '_xclick', business, amount: Number(amount).toFixed(2), currency_code: 'USD',
    item_name: '', return: `${base}${prefix}/payment/result?state=returned`,
    cancel_return: `${base}${prefix}/payment/result?state=cancelled`,
    rm: '1', email, custom: office,
  };
  const inputs = Object.entries(fields).map(([key, val]) =>
    `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(val)}">`).join('\n');

  return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Continue to PayPal</title></head><body><p>Continuing to PayPal…</p><form id="paypal" action="${paypalUrl}" method="post">${inputs}<button type="submit">Continue to PayPal</button></form><script>document.getElementById('paypal').submit()</script></body></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
