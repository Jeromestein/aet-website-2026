import type { Locale } from '@/i18n/routing';
import en from '@/content/payment/en.json';
import zh from '@/content/payment/zh.json';
import es from '@/content/payment/es.json';

export const paymentOffices = ['miami', 'boston', 'california', 'nyc'] as const;
export const paymentServices = ['certified', 'evaluation', 'interpretation', 'other'] as const;
export type PaymentOffice = (typeof paymentOffices)[number];
export type PaymentService = (typeof paymentServices)[number];

export type PaymentContent = {
  title: string;
  eyebrow: string;
  description: string;
  sections: { card: string; alternatives: string; security: string; shipping: string };
  form: {
    intro: string; name: string; email: string; phone: string; address: string; address2: string;
    city: string; state: string; zip: string; service: string; serviceOther: string;
    addressGroup: string; office: string; amount: string; amountHelp: string; terms: string; termsLink: string;
    privacyLink: string; submit: string; newTab: string;
  };
  services: Record<PaymentService, string>;
  offices: Record<PaymentOffice, string>;
  alternatives: { intro: string; contact: string; zelle: string; bank: string; check: string };
  security: { paragraph: string };
  shipping: { intro: string; domestic: string; international: string };
};

export const paymentContent: Record<Locale, PaymentContent> = { en, zh, es };
