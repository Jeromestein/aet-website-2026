import type { Locale } from '@/i18n/routing';
import en from '@/content/about/en.json';
import zh from '@/content/about/zh.json';
import es from '@/content/about/es.json';
import photos from '@/content/about/photos.json';

type AboutContent = {
  title: string; eyebrow: string; description: string; intro: string;
  sections: Record<'history' | 'highlights' | 'photos' | 'clients' | 'testimonials' | 'careers', string>;
  timeline: { year: string; body: string; href?: string; linkLabel?: string }[];
  highlights: { title: string; body: string }[];
  photos: string[]; photoNote: string; clientsAlt: string; viewPhoto: string;
  testimonialsLink: string; careersLink: string;
};

export const aboutContent: Record<Locale, AboutContent> = { en, zh, es };
export const aboutPhotos = photos;
