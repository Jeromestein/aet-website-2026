import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export type OfficeId = 'miami' | 'boston' | 'la' | 'sf' | 'nyc' | 'bj';
export type OfficePostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: 'US' | 'CN';
};
export type Office = {
  id: OfficeId;
  slug?: string;
  footerKey?: string;
  hours?: { weekdays: [string, string]; saturday?: [string, string]; zone: string };
  phones: readonly string[];
  emails: readonly string[];
  address: string;
  postalAddress: OfficePostalAddress;
  addressZh?: string;
  addressEs?: string;
  whatsapp?: string;
  wechat?: string;
  tollFreeChina?: string;
  fax?: string;
  qq?: string;
};

/** Derive the displayed address from the same fields used by structured data. */
function defineOffice({ displayCountry, ...office }: Omit<Office, 'address'> & { displayCountry?: boolean }): Office {
  const address = office.postalAddress;
  return {
    ...office,
    address: [address.streetAddress, address.addressLocality,
      [address.addressRegion, address.postalCode].filter(Boolean).join(' '),
      displayCountry ? 'United States' : undefined,
    ].filter(Boolean).join(', '),
  };
}

/** Public contact facts from the legacy Contact page; LA address chosen by owner. */
export const offices: readonly Office[] = [
  defineOffice({
    id: 'miami', slug: 'miami', footerKey: 'miami', hours: { weekdays: ['09:00', '17:00'], zone: 'EST' }, phones: ['+1 786-250-3999', '+1 786-881-7058'],
    emails: ['info@aet21.com', 'info@americantranslationservice.com'],
    postalAddress: { streetAddress: '15321 S Dixie Hwy, #302', addressLocality: 'Palmetto Bay', addressRegion: 'FL', postalCode: '33157', addressCountry: 'US' },
    whatsapp: '786-881-7058', wechat: 'AET-Miami', tollFreeChina: '950 4037 9459', fax: '954 644 7787',
  }),
  defineOffice({
    id: 'boston', slug: 'boston', footerKey: 'boston', hours: { weekdays: ['09:00', '17:30'], saturday: ['09:30', '12:30'], zone: 'EST' }, phones: ['+1 781-712-0258', '+1 781-605-1970'],
    emails: ['boston@aet21.com', 'boston@americantranslationservice.com'],
    postalAddress: { streetAddress: '6 Pleasant Street, #418', addressLocality: 'Malden', addressRegion: 'MA', postalCode: '02148', addressCountry: 'US' }, wechat: 'jennifertjchang',
  }),
  defineOffice({
    id: 'la', slug: 'los-angeles', footerKey: 'losAngeles', hours: { weekdays: ['08:30', '17:00'], zone: 'PST' }, phones: ['+1 949-954-7996'], emails: ['ca2@aet21.com'],
    postalAddress: { streetAddress: '17802 Sky Park Cir, Suite 205 A', addressLocality: 'Irvine', addressRegion: 'CA', postalCode: '92614-6403', addressCountry: 'US' }, displayCountry: true,
    wechat: 'LA9499547996', tollFreeChina: '950-4041-5989 / 167-6208-4336',
  }),
  defineOffice({
    id: 'sf', hours: { weekdays: ['09:00', '17:00'], zone: 'PST' }, phones: ['+1 415-868-4892'], emails: ['ca@aet21.com'],
    postalAddress: { streetAddress: '851 Burlway Rd Ste 421', addressLocality: 'Burlingame', addressRegion: 'CA', postalCode: '94010', addressCountry: 'US' },
    wechat: '18611291421', tollFreeChina: '950-4044-1214 / 167-1526-5057',
  }),
  defineOffice({
    id: 'nyc', hours: { weekdays: ['09:00', '17:30'], zone: 'EST' }, phones: ['+1 718-521-6708'],
    emails: ['nyc@aet21.com', 'nyc@americantranslationservice.com'],
    postalAddress: { streetAddress: '60-20 Woodside Ave, Suite 205', addressLocality: 'Queens', addressRegion: 'NY', postalCode: '11377', addressCountry: 'US' }, wechat: 'AET_NYC',
  }),
  defineOffice({
    id: 'bj', slug: 'beijing', footerKey: 'beijing', phones: ['010 65913558'], emails: ['beijing@aet21.com'],
    postalAddress: { streetAddress: 'Tianshuiyuan Business Center, Building A, Ste 106, No. 2 Tianshuiyuan East, Chaoyang District', addressLocality: 'Beijing', addressCountry: 'CN' },
    addressZh: '天水园商务中心A座106室，朝阳区天水园东二号',
    addressEs: 'Centro Empresarial Tianshuiyuan, Edificio A, Ste 106, No. 2 Tianshuiyuan Este, Distrito Chaoyang, Beijing',
    qq: '3135192546',
  }),
];

export function contactPath(locale: Locale, anchor?: string) {
  return getPathname({ locale, href: '/contact' }) + (anchor ? `#${anchor}` : '');
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
