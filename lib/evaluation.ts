import en from '@/content/evaluation/en.json';
import zh from '@/content/evaluation/zh.json';
import es from '@/content/evaluation/es.json';
import type { Locale } from '@/i18n/routing';

/** Reviewed, static legacy copy. No user-supplied HTML is accepted. */
export const evaluationContent = { en, zh, es } satisfies Record<Locale, typeof en>;
