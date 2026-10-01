import type { Locale } from '@/i18n/routing';
import { absoluteUrl, localizedPath } from '@/lib/seo';
import { offices, getOffice, officePath, phoneHref, type Office } from '@/lib/contact';
import { contactContent } from '@/lib/contact-content';
import { organizationName, foundingYear, socialLinks } from '@/lib/organization';

export const organizationId = absoluteUrl('/#organization');
const logo = absoluteUrl('/brand/aet-logo-header.png');
const reference = (id: string) => ({ '@id': id });
export const graph = (nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
const language = (locale: Locale) => locale === 'zh' ? 'zh-Hans' : locale;

export function organizationSchema() {
  const headquarters = getOffice('miami');
  return {
    '@type': 'Organization', '@id': organizationId,
    name: organizationName, alternateName: 'AET', foundingDate: foundingYear,
    url: absoluteUrl('/'), logo,
    telephone: phoneHref(headquarters.phones[0]).slice(4), email: headquarters.emails[0],
    address: { '@type': 'PostalAddress', ...headquarters.postalAddress },
    // Yelp identifies the Boston branch; the Google search URL is not an entity ID.
    sameAs: socialLinks.filter(([name]) => name === 'LinkedIn' || name === 'Facebook').map(([, url]) => url),
  };
}

export function officeId(office: Office) {
  const legacyId = { miami: 'miami', boston: 'boston', la: 'los-angeles', sf: 'san-francisco', nyc: 'new-york', bj: 'beijing' }[office.id];
  return absoluteUrl(`/#${legacyId}-office`);
}

export function officeSchema(office: Office, locale: Locale) {
  const hours = office.hours;
  return {
    '@type': 'LocalBusiness', '@id': officeId(office),
    name: `${organizationName} — ${contactContent[locale].offices[office.id].name}`,
    url: absoluteUrl(officePath(locale, office)), logo,
    parentOrganization: reference(organizationId),
    address: { '@type': 'PostalAddress', ...office.postalAddress },
    telephone: office.phones.map(phone => phoneHref(phone).slice(4)), email: [...office.emails],
    ...(office.id === 'boston' ? { sameAs: socialLinks.filter(([name]) => name === 'Yelp').map(([, url]) => url) } : {}),
    ...(hours ? { openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `https://schema.org/${day}`), opens: hours.weekdays[0], closes: hours.weekdays[1] },
      ...(hours.saturday ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['https://schema.org/Saturday'], opens: hours.saturday[0], closes: hours.saturday[1] }] : []),
    ] } : {}),
  };
}

export function officeGraph(locale: Locale, selected: readonly Office[] = offices) {
  return graph([
    { ...organizationSchema(), department: selected.map(office => reference(officeId(office))) },
    ...selected.map(office => officeSchema(office, locale)),
  ]);
}

export function serviceGraph({ path, locale, name, description, offers }: {
  path: string; locale: Locale; name: string; description: string; offers?: object[];
}) {
  const url = absoluteUrl(localizedPath(path, locale));
  const serviceId = absoluteUrl(`${path}#service`);
  return graph([
    organizationSchema(),
    { '@type': 'WebPage', '@id': `${url}#webpage`, url, name, inLanguage: language(locale), mainEntity: reference(serviceId) },
    { '@type': 'Service', '@id': serviceId, name, description, url,
      provider: reference(organizationId), mainEntityOfPage: reference(`${url}#webpage`),
      ...(offers?.length ? { offers } : {}),
    },
  ]);
}
