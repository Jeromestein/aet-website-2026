import en from '@/content/certified-translation/en.json';
import zh from '@/content/certified-translation/zh.json';
import es from '@/content/certified-translation/es.json';
import type { Locale } from '@/i18n/routing';

export const certifiedTranslationContent = { en, zh, es } satisfies Record<Locale, typeof en>;
