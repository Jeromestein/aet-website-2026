import countries from './countries.json';
import regions from './regions.json';

// Same ISO codes and region dataset as the existing AET application.
export const countryCodes = new Set(countries.map(country => country.code));
export const isCountryCode = (value: string) => countryCodes.has(value);
// Fixed labels avoid ICU translation differences between server and browser.
const labelLocale = (locale: string): 'en' | 'zh' | 'es' => locale === 'zh' || locale === 'es' ? locale : 'en';
export function countryOptions(locale = 'en') {
  return countries.map(country => ({ value: country.code, label: country.labels[labelLocale(locale)] }));
}
export function countryLabel(code: string, locale = 'en') {
  return countries.find(country => country.code === code)?.labels[labelLocale(locale)] || code;
}
export function regionOptions(country: string, locale = 'en') {
  const options = regions.filter(region => region.country === country).map(region => ({ value: region.code, label: region.name }));
  return options.length ? options : [{ value: 'no_region', label: locale === 'zh' ? '不适用' : locale === 'es' ? 'No corresponde' : 'Not Applicable' }];
}
