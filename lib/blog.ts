import inventory from '@/content/blog/articles.json';
import titles from '@/content/blog/titles.json';
import dates from '@/content/blog/dates.json';
import type { Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';

export const topics = ['translation', 'evaluation', 'interpretation', 'expert'] as const;
export type BlogTopic = typeof topics[number];
export type BlogArticle = { slug: string; title: string; topic: BlogTopic; city: string | null; path: string };
export const pilotSlug = 'boston-foreign-credential-evaluation-services';
export const articles = (inventory as BlogArticle[]).map(article => ({
  ...article, title: titles[article.slug as keyof typeof titles] ?? article.title,
  publishedAt: dates[article.slug as keyof typeof dates] ?? null,
})).sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
export const articleUrl = (article: BlogArticle, locale: Locale) =>
  getPathname({ locale, href: `/blog/${article.slug}` });

export const blogCopy = {
  en: {
    title: 'Credential evaluation guides', eyebrow: 'AET Blog',
    description: 'Understand your foreign credentials in the U.S. Explore evaluation purposes, report types, and the next steps for your education or career.',
    featured: 'Featured guide', featuredDescription: 'Explore why credential evaluation matters and the differences between document-by-document, course-by-course, and professional experience evaluations.',
    other: 'Other topics', returnEvaluation: 'Back to credential evaluation',
    heading: 'Credential evaluation articles', all: 'All topics', search: 'Search articles',
    placeholder: 'Search by title or city', count: '{count} articles', read: 'Read article',
    empty: 'No articles found', emptyHint: 'Try another title, city, or topic.', reset: 'Clear filters',
    general: 'General guide',
    topics: { translation: 'Translation', evaluation: 'Credential evaluation', interpretation: 'Interpretation', expert: 'Expert opinion letters' },
  },
  zh: {
    title: '学历认证指南', eyebrow: 'AET 博客',
    description: '了解海外学历如何对应美国教育体系，认识学历评估的用途与报告类型，为升学和职业发展做好准备。',
    featured: '推荐阅读', featuredDescription: '了解学历评估的用途，以及文凭评估、逐课评估和工作经验评估的区别。',
    other: '其他主题', returnEvaluation: '返回学历认证',
    heading: '学历认证相关文章', all: '全部主题', search: '搜索文章',
    placeholder: '输入英文标题关键词或城市名称', count: '{count} 篇文章', read: '阅读文章',
    empty: '未找到相关文章', emptyHint: '请尝试其他标题关键词、城市名称或主题。', reset: '清除筛选',
    general: '通用指南',
    topics: { translation: '翻译', evaluation: '学历认证', interpretation: '口译', expert: '专家意见信' },
  },
  es: {
    title: 'Guías de evaluación de credenciales', eyebrow: 'Blog de AET',
    description: 'Comprenda sus credenciales extranjeras en Estados Unidos. Explore los fines de la evaluación, los tipos de informes y los siguientes pasos para sus estudios o carrera.',
    featured: 'Lectura destacada', featuredDescription: 'Conozca la importancia de la evaluación y las diferencias entre los informes documento por documento, curso por curso y de experiencia profesional.',
    other: 'Otros temas', returnEvaluation: 'Volver a evaluación de credenciales',
    heading: 'Artículos sobre evaluación', all: 'Todos los temas', search: 'Buscar artículos',
    placeholder: 'Busque por título o ciudad en inglés', count: '{count} artículos', read: 'Leer artículo',
    empty: 'No se encontraron artículos', emptyHint: 'Pruebe otro título, ciudad o tema.', reset: 'Borrar filtros',
    general: 'Guía general',
    topics: { translation: 'Traducción', evaluation: 'Evaluación de credenciales', interpretation: 'Interpretación', expert: 'Cartas de opinión experta' },
  },
} satisfies Record<Locale, unknown>;
export type BlogCopy = typeof blogCopy[Locale];
