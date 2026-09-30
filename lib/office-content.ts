import type { Locale } from '@/i18n/routing';

/** Adapted from the four legacy e-office-*-content.html pages; contact facts live in contact.ts. */
export const officeContent = {
  en: {
    about: 'About this office', contact: 'Contact information', services: 'Our services', history: 'Company history', guarantee: 'Our guarantee',
    quote: 'Request a free estimate', all: 'All offices', pricing: 'View pricing',
    intro: 'Founded in 2009 by an immigrant and NAFSA member, Mr. Jeremy Yan, American Education and Translation Services has long known the struggles of immigrants in the USA.',
    regions: { miami: 'Miami is home to our headquarters for translation and foreign credential evaluation services.', boston: 'Our Boston office serves as the headquarters in North USA, providing translation and credential evaluation services to the New England region.', la: 'Our Los Angeles office serves as the headquarters in California and the west coast, providing translation and credential evaluation services to Southern California. The office is located in Irvine.', bj: 'Our Beijing office serves as the headquarters in China, supporting Chinese clients seeking services in the United States.' },
    serviceItems: ['Certified translations in more than 100 languages, including Spanish–English and Chinese–English.', 'Foreign credential evaluation for immigration, employment, and education purposes.', 'Simultaneous interpretation between Chinese and English.', 'Rush services available for most selected cases.'],
    beijingServices: ['Coordination with US offices for certified translations.', 'Assistance with foreign credential evaluation document preparation.', 'Document collection and verification services.', 'Chinese-to-English translation services.', 'Local customer support and consultation.'],
    historyItems: ['Established in 2009.', 'Selected as one of the most popular businesses on Yelp.', 'Corporate member of the American Translators Association (ATA) since 2009.', 'Founder Mr. Jeremy Yan, a veteran certified translator / credential evaluator since 1997 in Miami.', 'Translation and interpretation by seasoned language professionals, with a specialty in Chinese and English.'],
    promises: ['E-mail responses in 30 mins', 'Quick turnaround with no hidden fees', 'Digital copies accepted online', '5-star review customer service', 'Easy to reach', 'Customer service that puts you first'],
    evaluator: 'Experienced credential evaluators from NACES', coordination: 'Experienced coordination with US offices',
  },
  zh: {
    about: '办公室介绍', contact: '联系方式', services: '我们的服务', history: '公司历史', guarantee: '我们的承诺',
    quote: '获取免费报价', all: '查看所有办公室', pricing: '查看价格',
    intro: '美国教育与翻译服务公司由移民、NAFSA 会员 Jeremy Yan 先生于 2009 年创办，深知移民在美国面临的困难。',
    regions: { miami: '迈阿密是 AET 总部所在地，提供翻译与海外学历评估服务。', boston: '波士顿办公室是美国北部总部，为新英格兰地区提供翻译与学历评估服务。', la: '洛杉矶办公室是加州和西海岸总部，为南加州地区提供翻译与学历评估服务。办公室位于 Irvine（尔湾）。', bj: '北京办公室是中国总部，为需要美国相关服务的中国客户提供支持。' },
    serviceItems: ['提供超过 100 种语言的认证翻译，包括西英互译和中英互译。', '用于移民、就业和升学的海外学历评估。', '中英同声传译。', '大多数选定业务可提供加急服务。'],
    beijingServices: ['协调美国办公室办理认证翻译。', '协助准备海外学历评估文件。', '文件收集与核验服务。', '中文译英文服务。', '本地客户支持与咨询。'],
    historyItems: ['成立于 2009 年。', '获选为 Yelp 最受欢迎的商家之一。', '自 2009 年起成为美国翻译协会（ATA）企业会员。', '创办人 Jeremy Yan 先生自 1997 年起在迈阿密从事认证翻译与学历评估工作。', '由经验丰富的语言专业人员提供翻译和口译，专长为中英语言服务。'],
    promises: ['30 分钟内回复邮件', '办理快捷，无隐藏费用', '接受在线提交电子副本', '五星评价客户服务', '联系便捷', '以客户为先的服务'],
    evaluator: '具有 NACES 机构工作经验的学历评估人员', coordination: '具备与美国办公室协调业务的经验',
  },
  es: {
    about: 'Acerca de esta oficina', contact: 'Información de contacto', services: 'Nuestros servicios', history: 'Historia de la empresa', guarantee: 'Nuestra garantía',
    quote: 'Solicitar una cotización gratuita', all: 'Todas las oficinas', pricing: 'Ver precios',
    intro: 'Fundada en 2009 por el inmigrante y miembro de NAFSA, el Sr. Jeremy Yan, American Education and Translation Services conoce las dificultades de los inmigrantes en Estados Unidos.',
    regions: { miami: 'Miami alberga nuestra sede central de traducción y evaluación de credenciales extranjeras.', boston: 'Nuestra oficina de Boston es la sede del norte de Estados Unidos y ofrece traducción y evaluación de credenciales en Nueva Inglaterra.', la: 'Nuestra oficina de Los Angeles es la sede de California y la costa oeste, con servicios de traducción y evaluación de credenciales para el sur de California. La oficina se encuentra en Irvine.', bj: 'Nuestra oficina de Beijing es la sede de China y brinda apoyo a clientes chinos que necesitan servicios en Estados Unidos.' },
    serviceItems: ['Traducciones certificadas en más de 100 idiomas, incluidos español–inglés y chino–inglés.', 'Evaluación de credenciales extranjeras para inmigración, empleo y educación.', 'Interpretación simultánea entre chino e inglés.', 'Servicios urgentes disponibles para la mayoría de los casos seleccionados.'],
    beijingServices: ['Coordinación con oficinas de Estados Unidos para traducciones certificadas.', 'Ayuda para preparar documentos de evaluación de credenciales extranjeras.', 'Recopilación y verificación de documentos.', 'Traducción de chino a inglés.', 'Atención al cliente y consultas locales.'],
    historyItems: ['Fundada en 2009.', 'Seleccionada entre los negocios más populares de Yelp.', 'Miembro corporativo de la American Translators Association (ATA) desde 2009.', 'El fundador, Sr. Jeremy Yan, trabaja como traductor certificado y evaluador de credenciales desde 1997 en Miami.', 'Traducción e interpretación por profesionales experimentados, con especialidad en chino e inglés.'],
    promises: ['Respuestas por email en 30 minutos', 'Tramitación rápida sin cargos ocultos', 'Se aceptan copias digitales en línea', 'Atención al cliente con reseñas de 5 estrellas', 'Contacto accesible', 'Servicio que da prioridad al cliente'],
    evaluator: 'Evaluadores de credenciales con experiencia en agencias NACES', coordination: 'Experiencia en coordinación con oficinas de Estados Unidos',
  },
} satisfies Record<Locale, unknown>;
