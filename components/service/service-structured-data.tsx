import { renderVisaPrices } from '@/lib/visa';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { StructuredData } from '@/components/structured-data';
import { serviceGraph, organizationId } from '@/lib/structured-data';
import { absoluteUrl, indexableLocales, localizedPath } from '@/lib/seo';
import { certifiedTranslationContent } from '@/lib/certified-translation';
import { evaluationContent } from '@/lib/evaluation';
import { getOtherServiceContent, type ServiceSlug } from '@/lib/other-services';
import { certifiedTranslation, evaluationGroups, preEvaluation, expertOpinion, interpretation, generalTranslation, pricingPolicy, visaServiceRates, type Rate } from '@/lib/pricing';
import { formatPrice, formatTurnaround } from '@/lib/pricing-format';

type SchemaService = 'evaluation' | 'certified-translation' | ServiceSlug;
const serviceRates: Partial<Record<SchemaService, readonly Rate[]>> = {
  evaluation: [...evaluationGroups.flatMap(group => [...group.rates]), ...preEvaluation],
  'certified-translation': certifiedTranslation,
  'expert-opinion-letters': expertOpinion,
  interpretation,
  'visa-service': visaServiceRates,
  'general-translation': generalTranslation,
};
const units = { person: 'person', copy: 'copy', hour: 'hour', page: 'page', word: 'word', chineseWord: 'Chinese word', englishWord: 'English word' };

export async function ServiceStructuredData({ service, locale }: { service: SchemaService; locale: Locale }) {
  const path = `/${service}`;
  if (!indexableLocales(path).includes(locale)) return null;
  const content = service === 'evaluation' ? evaluationContent[locale]
    : service === 'certified-translation' ? certifiedTranslationContent[locale]
    : getOtherServiceContent(service, locale).content;
  const description = 'description' in content ? content.description
    : content.sections.find(section => section.html)?.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? content.title;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  const offers = serviceRates[service]?.map(rate => {
    const price = rate.price;
    const numericPrice = price.kind === 'fixed' ? { price: price.amount }
      : price.kind === 'from' ? { minPrice: price.amount }
      : price.kind === 'range' ? { minPrice: price.min, maxPrice: price.max } : undefined;
    const note = rate.note ? t(`notes.${rate.note}`, {
      simultaneousMinimumHours: pricingPolicy.simultaneousMinimumHours,
      telephoneMinimumHours: pricingPolicy.telephoneMinimumHours,
      proofreadingDiscountMinimumPages: pricingPolicy.proofreadingDiscountMinimumPages,
    }) : undefined;
    return {
      '@type': 'Offer', name: t(`services.${rate.label}`),
      url: absoluteUrl(`${localizedPath(path, locale)}#price`),
      seller: { '@id': organizationId },
      description: [t('columns.price'), formatPrice(price, locale, t), rate.turnaround && formatTurnaround(rate.turnaround, t), note].filter(Boolean).join(' — '),
      ...(numericPrice ? { priceSpecification: {
        '@type': 'UnitPriceSpecification', priceCurrency: 'USD', ...numericPrice,
        ...('unit' in price && price.unit ? { referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: units[price.unit] } } : {}),
      } } : {}),
    };
  });
  return <StructuredData data={serviceGraph({ path, locale, name: content.title, description: service === 'visa-service' ? renderVisaPrices(description) : description, offers })} />;
}
