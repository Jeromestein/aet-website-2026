import type { Locale } from '@/i18n/routing';

const en = {
  title: 'Choose your evaluation service', hint: 'Choose one evaluation service, then select a processing time.', sampleReport: 'Sample report',
  turnaround: 'Processing time', selectTier: 'Choose a processing time', qualifications: 'Qualifications to evaluate',
  qualificationHint: 'Select from the education records above.', included: 'One qualification is included in the base fee.',
  additional: 'Each additional qualification: {amount}', count: '{count} qualification(s)',
  translation: 'I also need document translation', translationHint: 'Translation is quoted separately after we review your documents.',
  selectionError: 'Choose one evaluation service.', tierError: 'Choose an available processing time.', educationError: 'Select at least one of the education records above.',
  selectedServices: 'Selected services', fees: 'Fee estimate', subtotal: 'Estimated subtotal (USD)',
  feeScope: 'Includes the selected evaluation, report and shipping. Payment processing fees are not included.',
  pending: 'Additional services await a quote; they are not included in the subtotal.', awaitingQuote: 'Awaiting quote',
  incomplete: 'Complete the processing time and qualification selections to calculate these fees.', empty: 'Your selected services and fees will appear here.',
  baseFee: 'Base service fee', additionalFees: 'Additional qualifications', serviceTotal: 'Service subtotal',
  linkedEducation: 'Qualifications included', reviewTitle: 'Services and fees',
};
type EvaluationCopy = { [Key in keyof typeof en]: string };
const zh: EvaluationCopy = {
  title: '选择评估服务', hint: '选择一种评估服务，再选择办理时效。', sampleReport: '示例报告',
  turnaround: '办理时效', selectTier: '请选择办理时效', qualifications: '需要评估的学历',
  qualificationHint: '从上方填写的学历中选择。', included: '基础费用包含一项学历。', additional: '每项附加学历：{amount}', count: '{count} 项学历',
  translation: '同时需要文件翻译', translationHint: '翻译费用将在审阅文件后单独报价。',
  selectionError: '请选择一种评估服务。', tierError: '请选择可用的办理时效。', educationError: '请至少选择一项上方填写的学历。',
  selectedServices: '已选服务', fees: '费用预估', subtotal: '费用预估小计（美元）',
  feeScope: '包含已选评估、报告及邮寄费用，不含支付手续费。', pending: '另有服务待报价，尚未计入小计。', awaitingQuote: '待报价',
  incomplete: '请选择办理时效和关联学历，以计算对应费用。', empty: '选择服务后，这里会显示服务明细及费用。',
  baseFee: '基础服务费', additionalFees: '附加学历费', serviceTotal: '本项服务小计', linkedEducation: '评估学历', reviewTitle: '服务与费用',
};
const es: EvaluationCopy = {
  title: 'Elija el servicio de evaluación', hint: 'Elija un servicio de evaluación y seleccione un plazo de tramitación.', sampleReport: 'Ver ejemplo',
  turnaround: 'Plazo de tramitación', selectTier: 'Seleccione un plazo', qualifications: 'Titulaciones que desea evaluar',
  qualificationHint: 'Seleccione entre los registros académicos anteriores.', included: 'La tarifa base incluye una titulación.', additional: 'Cada titulación adicional: {amount}', count: '{count} titulación(es)',
  translation: 'También necesito traducción de documentos', translationHint: 'La traducción se cotiza por separado tras revisar los documentos.',
  selectionError: 'Elija un servicio de evaluación.', tierError: 'Seleccione un plazo disponible.', educationError: 'Seleccione al menos una de las titulaciones anteriores.',
  selectedServices: 'Servicios seleccionados', fees: 'Estimación de tarifas', subtotal: 'Subtotal estimado (USD)',
  feeScope: 'Incluye la evaluación, el informe y el envío seleccionados. No incluye comisiones de pago.', pending: 'Hay servicios pendientes de cotización que no están incluidos en el subtotal.', awaitingQuote: 'Pendiente de cotización',
  incomplete: 'Complete los plazos y las titulaciones para calcular las tarifas.', empty: 'Aquí aparecerán los servicios seleccionados y sus tarifas.',
  baseFee: 'Tarifa base', additionalFees: 'Titulaciones adicionales', serviceTotal: 'Subtotal del servicio', linkedEducation: 'Titulaciones incluidas', reviewTitle: 'Servicios y tarifas',
};
export const evaluationCopy: Record<Locale, EvaluationCopy> = { en, zh, es };
