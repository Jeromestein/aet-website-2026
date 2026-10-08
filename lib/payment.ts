import type { Locale } from '@/i18n/routing';
import en from '@/content/payment/en.json';
import zh from '@/content/payment/zh.json';
import es from '@/content/payment/es.json';
import bankDetails from '@/content/payment/bank-details.json';
import { getOffice, type OfficeId } from '@/lib/contact';
const mailingRows = (rows: { label: string; value?: string; officeAddress?: string }[]) => rows.map(row => ({
  label: row.label, value: row.officeAddress ? getOffice(row.officeAddress as OfficeId).address : row.value ?? '',
}));
export const paymentBankDetails = { ...bankDetails, miami: mailingRows(bankDetails.miami), boston: mailingRows(bankDetails.boston), check: mailingRows(bankDetails.check) };

export const paymentOffices = ['miami', 'boston', 'california', 'nyc'] as const;
export const paymentServices = ['certified', 'evaluation', 'interpretation', 'other'] as const;
export type PaymentOffice = (typeof paymentOffices)[number];
export type PaymentService = (typeof paymentServices)[number];

export type PaymentContent = {
  title: string;
  eyebrow: string;
  description: string;
  card: { restriction: string; description: string };
  sections: { card: string; alternatives: string; security: string; shipping: string };
  form: {
    intro: string; name: string; email: string; phone: string; address: string; address2: string;
    city: string; state: string; zip: string; service: string; serviceOther: string;
    addressGroup: string; office: string; amount: string; amountHelp: string; terms: string; termsLink: string;
    privacyLink: string; submit: string; newTab: string;
  };
  services: Record<PaymentService, string>;
  offices: Record<PaymentOffice, string>;
  alternatives: {
    navLabel: string; depositCheckTitle: string; miami: string; boston: string; deposit: string; check: string; instructions: string;
    stepsTitle: string; steps: string[]; bankTitle: string; selectOffice: string;
    offices: Record<PaymentOffice, string>; fields: Record<string, string>;
    businessName: string; zelleEmail: string; noteLabel: string; note: string;
  };
  security: {
    columns: string[]; methods: { method: string; details: string[][] }[];
    noteLabel: string; note: string;
  };
  shipping: {
    domestic: string; international: string; toggle: string;
    noteLabel: string; note: string; columns: string[]; methods: Record<string, string>;
  };
};

export const paymentContent: Record<Locale, PaymentContent> = { en, zh, es };
