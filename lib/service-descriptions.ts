import type { Locale } from '@/i18n/routing';
import type { ServiceSlug } from '@/lib/other-services';
const descriptions = {
  'technical-translation': {
    en: 'Technical translation services for documents in specialized fields, including engineering, medicine, science and technology.',
    zh: '提供工程、医学、科学及技术等专业领域的文件翻译服务。',
  },
  interpretation: {
    en: 'Interpretation services for meetings, conferences, appointments and other occasions. Contact AET to discuss your language needs.',
    zh: '提供会议、会谈、预约及其他场合的口译服务，欢迎联系 AET 了解语言服务安排。',
  },
  'expert-opinion-letters': {
    en: 'Expert opinion letters and professional experience evaluations. Explore service options, estimated fees and processing times.',
    zh: '提供专家意见信和工作经验评估服务，了解服务类型、预估费用及办理时间。',
    es: 'Cartas de opinión experta y evaluaciones de experiencia profesional. Consulte las opciones, las tarifas estimadas y los plazos.',
  },
  'general-translation': {
    en: 'General translation services for personal and business documents. Review estimated per-word pricing and request a quote.',
    zh: '提供个人及商务文件的一般翻译服务，查看按字数计算的预估费用并咨询报价。',
  },
  notarization: {
    en: 'Notarization services from AET. Review the available services and contact an office about your document requirements.',
    zh: '了解 AET 公证服务，并联系办公室咨询文件要求。',
  },
} satisfies Record<ServiceSlug, Partial<Record<Locale, string>>>;
export function serviceDescription(service: ServiceSlug, locale: Locale): string {
  const translated: Partial<Record<Locale, string>> = descriptions[service];
  return translated[locale] ?? translated.en!;
}
