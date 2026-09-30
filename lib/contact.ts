import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export type OfficeId = 'miami' | 'boston' | 'la' | 'sf' | 'nyc' | 'bj';
export type Office = {
  id: OfficeId;
  slug?: string;
  footerKey?: string;
  hours?: { weekdays: [string, string]; saturday?: [string, string]; zone: string };
  phones: readonly string[];
  emails: readonly string[];
  address: string;
  addressZh?: string;
  addressEs?: string;
  whatsapp?: string;
  wechat?: string;
  tollFreeChina?: string;
  fax?: string;
  qq?: string;
};

/** Public contact facts from the legacy Contact page; LA address chosen by owner. */
export const offices: readonly Office[] = [
  {
    id: 'miami', slug: 'miami', footerKey: 'miami', hours: { weekdays: ['09:00', '17:00'], zone: 'EST' }, phones: ['+1 786-250-3999', '+1 786-881-7058'],
    emails: ['info@aet21.com', 'info@americantranslationservice.com'],
    address: '15321 S Dixie Hwy, #302, Palmetto Bay, FL 33157',
    whatsapp: '786-881-7058', wechat: 'AET-Miami', tollFreeChina: '950 4037 9459', fax: '954 644 7787',
  },
  {
    id: 'boston', slug: 'boston', footerKey: 'boston', hours: { weekdays: ['09:00', '17:30'], saturday: ['09:30', '12:30'], zone: 'EST' }, phones: ['+1 781-712-0258', '+1 781-605-1970'],
    emails: ['boston@aet21.com', 'boston@americantranslationservice.com'],
    address: '6 Pleasant Street, #418, Malden, MA 02148', wechat: 'jennifertjchang',
  },
  {
    id: 'la', slug: 'los-angeles', footerKey: 'losAngeles', hours: { weekdays: ['08:30', '17:00'], zone: 'PST' }, phones: ['+1 949-954-7996'], emails: ['ca2@aet21.com'],
    address: '17802 Sky Park Cir, Suite 205 A, Irvine, CA 92614-6403, United States',
    wechat: 'LA9499547996', tollFreeChina: '950-4041-5989 / 167-6208-4336',
  },
  {
    id: 'sf', hours: { weekdays: ['09:00', '17:00'], zone: 'PST' }, phones: ['+1 415-868-4892'], emails: ['ca@aet21.com'],
    address: '851 Burlway Rd Ste 421, Burlingame, CA 94010',
    wechat: '18611291421', tollFreeChina: '950-4044-1214 / 167-1526-5057',
  },
  {
    id: 'nyc', hours: { weekdays: ['09:00', '17:30'], zone: 'EST' }, phones: ['+1 718-521-6708'],
    emails: ['nyc@aet21.com', 'nyc@americantranslationservice.com'],
    address: '60-20 Woodside Ave, Suite 205, Queens, NY 11377', wechat: 'AET_NYC',
  },
  {
    id: 'bj', slug: 'beijing', footerKey: 'beijing', phones: ['010 65913558'], emails: ['beijing@aet21.com'],
    address: 'Tianshuiyuan Business Center, Building A, Ste 106, No. 2 Tianshuiyuan East, Chaoyang District, Beijing',
    addressZh: '天水园商务中心A座106室，朝阳区天水园东二号',
    addressEs: 'Centro Empresarial Tianshuiyuan, Edificio A, Ste 106, No. 2 Tianshuiyuan Este, Distrito Chaoyang, Beijing',
    qq: '3135192546',
  },
];

export function contactPath(locale: Locale, anchor?: string) {
  return getPathname({ locale, href: '/contact' }) + (anchor ? `#${anchor}` : '');
}

/** Redirect reviewed legacy Contact links inside checked-in content HTML. */
export function localizeContactLinks(html: string, locale: Locale) {
  const localized = html.replace(/href="(?:https?:\/\/(?:www\.)?americantranslationservice\.com\/)?e-contact(?:-zh|-es)?\.php(?=[#?\"])/gi,
    `href="${contactPath(locale)}`);
  return localized.replace(/href="(?:https?:\/\/(?:www\.)?americantranslationservice\.com)?\/?e-office-(miami|boston|los-angeles|beijing)(?:-zh|-es)?\.(?:php|html)(?=[#?\"])/gi,
    (_, slug: string) => `href="${officePath(locale, featuredOffices.find(office => office.slug === slug)!)}`);
}

/** Office data is shared by Contact, detail pages, article contacts and mailing addresses. */
export const featuredOffices = offices.filter(office => office.slug);
export function getOffice(id: OfficeId): Office {
  return offices.find(office => office.id === id)!;
}
export function officePath(locale: Locale, office: Office) {
  return office.slug ? getPathname({ locale, href: `/offices/${office.slug}` }) : contactPath(locale, office.id);
}
export function officeAddress(office: Office, locale: Locale) {
  return locale === 'zh' ? office.addressZh ?? office.address : locale === 'es' ? office.addressEs ?? office.address : office.address;
}
export function phoneHref(phone: string) {
  const number = phone.replace(/[^+\d]/g, '');
  return `tel:${number.startsWith('0') ? '+86' + number.slice(1) : number}`;
}
export function officeDirections(office: Office) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`;
}
export function officeHours(office: Office, locale: Locale) {
  if (!office.hours) return '';
  const days = { en: ['Mon. – Fri.', 'Sat.'], zh: ['周一至周五', '周六'], es: ['Lun. – Vie.', 'Sáb.'] }[locale];
  const time = (value: string) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(`2000-01-01T${value}:00Z`));
  const range = (values: [string, string]) => values.map(time).join(' – ');
  return `${days[0]} ${range(office.hours.weekdays)} ${office.hours.zone}` + (office.hours.saturday ? `; ${days[1]} ${range(office.hours.saturday)} ${office.hours.zone}` : '');
}
export const otherContacts = {
  spanish: { phone: '+1 786-610-6133' },
  taiyuan: { phone: '0351 2815866', mobile: '+86 18734590999', email: 'shanxi@aet21.com' },
};
