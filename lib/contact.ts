import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export type OfficeId = 'miami' | 'boston' | 'la' | 'sf' | 'nyc' | 'bj';
export type Office = {
  id: OfficeId;
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
    id: 'miami', phones: ['+1 786-250-3999', '+1 786-881-7058'],
    emails: ['info@aet21.com', 'info@americantranslationservice.com'],
    address: '15321 S Dixie Hwy, #302, Palmetto Bay, FL 33157',
    whatsapp: '786-881-7058', wechat: 'AET-Miami', tollFreeChina: '950 4037 9459', fax: '954 644 7787',
  },
  {
    id: 'boston', phones: ['+1 781-712-0258', '+1 781-605-1970'],
    emails: ['boston@aet21.com', 'boston@americantranslationservice.com'],
    address: '6 Pleasant Street, #418, Malden, MA 02148', wechat: 'jennifertjchang',
  },
  {
    id: 'la', phones: ['+1 949-954-7996'], emails: ['ca2@aet21.com'],
    address: '17802 Sky Park Cir, Suite 205 A, Irvine, CA 92614-6403, United States',
    wechat: 'LA9499547996', tollFreeChina: '950-4041-5989 / 167-6208-4336',
  },
  {
    id: 'sf', phones: ['+1 415-868-4892'], emails: ['ca@aet21.com'],
    address: '851 Burlway Rd Ste 421, Burlingame, CA 94010',
    wechat: '18611291421', tollFreeChina: '950-4044-1214 / 167-1526-5057',
  },
  {
    id: 'nyc', phones: ['+1 718-521-6708'],
    emails: ['nyc@aet21.com', 'nyc@americantranslationservice.com'],
    address: '60-20 Woodside Ave, Suite 205, Queens, NY 11377', wechat: 'AET_NYC',
  },
  {
    id: 'bj', phones: ['010 65913558'], emails: ['beijing@aet21.com'],
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
  return html.replace(/href="(?:https?:\/\/(?:www\.)?americantranslationservice\.com\/)?e-contact(?:-zh|-es)?\.php(?=[#?\"])/gi,
    `href="${contactPath(locale)}`);
}
