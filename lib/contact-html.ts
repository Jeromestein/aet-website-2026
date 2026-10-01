import references from '@/content/contact/legacy-references.json';
import { getOffice, officeHours, phoneHref, type OfficeId } from '@/lib/contact';
import { localizeContentLinks } from '@/lib/content-links';
import type { Locale } from '@/i18n/routing';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const referenceBySource = new Map(references.map(reference => [reference.source, reference]));
const pattern = new RegExp([...referenceBySource.keys()].map(escapeRegex).join('|'), 'g');

/** Resolve reviewed legacy contact literals once, against the current office catalog.
 * Match the immutable import spellings, not current values: later catalog edits
 * update article contacts without rewriting or reimporting historical prose.
 */
export function renderContactReferences(html: string, locale: Locale, contentLocale: Locale = locale) {
  const updated = html.replace(pattern, source => {
    const reference = referenceBySource.get(source)!;
    const office = getOffice(reference.office as OfficeId);
    if (reference.field === 'hours') return escapeHtml(officeHours(office, contentLocale));
    const value = office[reference.field as keyof typeof office];
    return escapeHtml(Array.isArray(value) ? value[reference.index ?? 0] ?? '' : typeof value === 'string' ? value : '');
  }).replace(/href="tel:([^"]+)"/g, (_, number: string) => `href="${phoneHref(number)}"`);
  return localizeContentLinks(updated, locale);
}
