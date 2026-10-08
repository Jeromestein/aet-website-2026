import type { Locale } from '@/i18n/routing';
import type { OfficeId } from '@/lib/contact';
import en from '@/content/contact/en.json';
import zh from '@/content/contact/zh.json';
import es from '@/content/contact/es.json';

export type ContactContent = {
  title: string;
  eyebrow: string;
  description: string;
  findOffice: string;
  sections: { how: string; offices: string; other: string };
  introHeading: string;
  options: { id: string; title: string; body: string }[];
  priority?: string;
  labels: Record<'phone' | 'email' | 'address' | 'hours' | 'whatsapp' | 'wechat' | 'tollFreeChina' | 'fax' | 'qq' | 'more' | 'directions' | 'officeDetails', string>;
  offices: Record<OfficeId, { name: string; title: string; visitNote?: string; phoneNotes?: string[] }>;
  other: { title: string; nyc: string; taiyuan: string; mobile: string };
};

export const contactContent: Record<Locale, ContactContent> = { en, zh, es };
