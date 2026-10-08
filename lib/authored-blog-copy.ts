import type { Locale } from '@/i18n/routing';

export const authoredBlogCopy = {
  en: {
    primary: 'Check My Document Requirements', documents: 'See required documents',
    reviewed: 'Official requirements checked', article: 'Article',
    phone: 'Call {phone}', contact: 'Contact AET', apply: 'Apply for Evaluation',
    ai: {
      title: 'Explore this article with AI', google: 'Google AI Mode',
      open: 'Open {platform} in a new tab',
      hint: 'Copy the question for Claude or Grok, or if your chosen tool does not fill it in. Sign-in may be required.',
      view: 'View or copy the question', question: 'Question and article link', copy: 'Copy question',
      copied: 'Question copied.', failed: 'Select the question above and copy it manually.',
    },
  },
  zh: {
    primary: '确认我的材料要求', documents: '查看所需材料',
    reviewed: '官方要求核对日期：', article: '文章',
    phone: '致电 {phone}', contact: '联系 AET', apply: '申请学历评估',
    ai: {
      title: '用 AI 进一步了解这篇文章', google: 'Google AI 模式',
      open: '在新标签页中打开 {platform}',
      hint: '使用 Claude、Grok，或其他工具未自动带入问题时，可复制下方问题。部分平台可能需要登录。',
      view: '查看或复制问题', question: '问题与文章链接', copy: '复制问题',
      copied: '问题已复制。', failed: '请选中上方问题并手动复制。',
    },
  },
  es: {
    primary: 'Consultar qué documentos necesito', documents: 'Ver los documentos necesarios',
    reviewed: 'Requisitos oficiales consultados el', article: 'Artículo',
    phone: 'Llamar al {phone}', contact: 'Contactar con AET', apply: 'Solicitar una evaluación',
    ai: {
      title: 'Explore este artículo con IA', google: 'Modo IA de Google',
      open: 'Abrir {platform} en una pestaña nueva',
      hint: 'Copie la pregunta para Claude o Grok, o si la herramienta elegida no la rellena automáticamente. Puede ser necesario iniciar sesión.',
      view: 'Ver o copiar la pregunta', question: 'Pregunta y enlace al artículo', copy: 'Copiar pregunta',
      copied: 'Pregunta copiada.', failed: 'Seleccione la pregunta de arriba y cópiela manualmente.',
    },
  },
} satisfies Record<Locale, unknown>;
