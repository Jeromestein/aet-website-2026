import en from '@/content/institutions/en.json';
import zh from '@/content/institutions/zh.json';
import es from '@/content/institutions/es.json';
import type { Locale } from '@/i18n/routing';

export type DirectoryEntry = {
  id: string;
  name: string;
  description: string;
  note: string;
  logo?: string;
  initials?: string;
};
export type DirectorySection = { id: string; title: string; description: string; entries: DirectoryEntry[] };
export type DirectoryContent = { title: string; intro: string; closing: string; applyUrl: string; sections: DirectorySection[] };
export const institutionDirectory: Record<Locale, DirectoryContent> = { en, zh, es };

export const directoryCopy = {
  en: {
    label: 'Institutions', eyebrow: 'Credential evaluation', heading: 'Find an institution.',
    summary: 'Explore the full list', entries: 'directory entries', categories: 'categories',
    qualification: 'Before you apply',
    qualificationText: 'Requirements vary by institution, program and purpose. Confirm that your receiving institution accepts the report type you need before ordering an evaluation. Inclusion in this list does not guarantee acceptance.',
    search: 'Search institutions', placeholder: 'Search by name, location or keyword',
    all: 'All institutions', count: '{count} of {total} entries', reset: 'Clear filters',
    empty: 'No institutions found', emptyHint: 'Try a different name or keyword, or clear the filters to view the full list.',
    notes: 'Application & timing notes', contact: 'Contact Us', apply: 'Apply Online',
    closingTitle: 'Find the right report for your next step.', back: 'Back to directory',
  },
  zh: {
    label: '机构列表', eyebrow: '学历评估', heading: '查找相关机构。',
    summary: '浏览完整机构列表', entries: '条机构记录', categories: '个分类',
    qualification: '申请前请确认',
    qualificationText: '要求因机构、项目和用途而异。订购评估前，请向接收机构确认所需的报告类型及接受要求。收录于本名单并不保证报告一定获接受。',
    search: '搜索机构', placeholder: '按名称、地点或关键词搜索', all: '全部机构',
    count: '显示 {count} 条，共 {total} 条', reset: '清除筛选',
    empty: '未找到相关机构', emptyHint: '请尝试其他名称或关键词，或清除筛选以查看完整列表。',
    notes: '申请与时间说明', contact: '联系我们', apply: '在线申请',
    closingTitle: '为下一步选择合适的评估报告。', back: '返回机构目录',
  },
  es: {
    label: 'Instituciones', eyebrow: 'Evaluación de credenciales', heading: 'Encuentre una institución.',
    summary: 'Explore la lista completa', entries: 'entradas en el directorio', categories: 'categorías',
    qualification: 'Antes de solicitar',
    qualificationText: 'Los requisitos varían según la institución, el programa y el propósito. Confirme con la institución receptora que acepta el tipo de informe que necesita antes de pedir una evaluación. Figurar en esta lista no garantiza la aceptación.',
    search: 'Buscar instituciones', placeholder: 'Busque por nombre, lugar o palabra clave',
    all: 'Todas las instituciones', count: '{count} de {total} entradas', reset: 'Borrar filtros',
    empty: 'No se encontraron instituciones', emptyHint: 'Pruebe otro nombre o palabra clave, o borre los filtros para ver la lista completa.',
    notes: 'Notas sobre solicitudes y plazos', contact: 'Contáctenos', apply: 'Solicitar en línea',
    closingTitle: 'El informe adecuado para su próximo paso.', back: 'Volver al directorio',
  },
} satisfies Record<Locale, Record<string, string>>;

export type DirectoryCopy = typeof directoryCopy.en;
