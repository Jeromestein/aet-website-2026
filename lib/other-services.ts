import type { Locale } from '@/i18n/routing';
import technicalEn from '@/content/technical-translation/en.json';
import technicalZh from '@/content/technical-translation/zh.json';
import interpretationEn from '@/content/interpretation/en.json';
import interpretationZh from '@/content/interpretation/zh.json';
import expertEn from '@/content/expert-opinion-letters/en.json';
import expertZh from '@/content/expert-opinion-letters/zh.json';
import expertEs from '@/content/expert-opinion-letters/es.json';
import generalEn from '@/content/general-translation/en.json';
import generalZh from '@/content/general-translation/zh.json';
import notarizationEn from '@/content/notarization/en.json';
import notarizationZh from '@/content/notarization/zh.json';

import visaEn from '@/content/visa-service/en.json';
import visaZh from '@/content/visa-service/zh.json';

export const serviceSlugs = ['technical-translation', 'interpretation', 'expert-opinion-letters', 'general-translation', 'notarization', 'visa-service'] as const;
export type ServiceSlug = typeof serviceSlugs[number];
export type ServiceSection = { id: string; title: string; html: string; scenarios?: string[] };
export type ServiceContent = { source: string; title: string; sections: ServiceSection[] };

const contents: Record<ServiceSlug, Partial<Record<Locale, ServiceContent>>> = {
  'technical-translation': { en: technicalEn, zh: technicalZh },
  interpretation: { en: interpretationEn, zh: interpretationZh },
  'expert-opinion-letters': { en: expertEn, zh: expertZh, es: expertEs },
  'general-translation': { en: generalEn, zh: generalZh },
  'visa-service': { en: visaEn, zh: visaZh },
  notarization: { en: notarizationEn, zh: notarizationZh },
};

export function getOtherServiceContent(slug: ServiceSlug, locale: Locale) {
  return { content: contents[slug][locale] ?? contents[slug].en!, hasLocaleContent: Boolean(contents[slug][locale]) };
}
