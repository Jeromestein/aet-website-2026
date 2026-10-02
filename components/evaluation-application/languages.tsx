'use client';
import { usePathname } from '@/i18n/navigation';
export default function ApplicationLanguages({ locale, search }: { locale: string; search: string }) {
  const pathname = usePathname();
  // Native navigation commits the locale cookie before the unprefixed English redirect.
  // The tab-scoped draft is restored by the destination form.
  return <>{(['en', 'zh', 'es'] as const).map(language => <a key={language} href={`/${language}${pathname}${search}`} lang={language} aria-current={locale === language ? 'page' : undefined}>{language === 'zh' ? '中文' : language.toUpperCase()}</a>)}</>;
}
