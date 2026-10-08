import type { Locale } from '@/i18n/routing';

export const cslbBlogPath = '/blog/cslb-foreign-credential-evaluation';

export const cslbEntry = {
  "en": {
    "title": "Applying for a California contractor license?",
    "body": "Explore how foreign education may count toward CSLB experience requirements and what to confirm before ordering an evaluation.",
    "action": "Read the CSLB article"
  },
  "zh": {
    "title": "正在申请加州承包商执照？",
    "body": "了解海外学历如何用于申请 CSLB 经验抵扣，以及订购评估报告前需要确认的事项。",
    "action": "阅读 CSLB 博客文章"
  },
  "es": {
    "title": "¿Solicita una licencia de contratista en California?",
    "body": "Conozca cómo los estudios extranjeros pueden contar para los requisitos de experiencia de CSLB y qué confirmar antes de solicitar una evaluación.",
    "action": "Leer el artículo sobre CSLB"
  }
} satisfies Record<Locale, { title: string; body: string; action: string }>;
