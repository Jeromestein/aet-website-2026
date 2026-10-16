import type { Locale } from '@/i18n/routing';

const en = {
  title: 'Report & delivery', hint: 'Choose how you would like to receive your report.', format: 'Report format',
  emailHint: 'The PDF report will be sent to the email address entered in Step 1.',
  mailingTitle: 'Mailing address', mailingHint: 'Enter the recipient and full delivery address for your paper report.',
  recipient: 'Recipient / organization', country: 'Country / region', street: 'Street address', street2: 'Apartment, suite, floor, etc.',
  city: 'City', region: 'State / province', postal: 'ZIP / postal code', postalHint: 'Enter a postal code if used at the destination.',
  extraCopies: 'Additional paper copies', copiesHint: 'One paper copy is included. Additional copies: {amount} each, sent to the same address.',
  shipping: 'Shipping method', shippingHint: 'Choose a destination country first. Shipping time is separate from evaluation processing time.',
  shippingError: 'Choose a shipping method available for this destination.', postalError: 'Enter a valid U.S. ZIP code.', copiesError: 'Enter a whole number from 0 to 20.',
  incomplete: 'Choose a shipping method to complete the delivery estimate.', rangeNote: 'Additional copies are estimated as a price range; the final fee will be confirmed.',
};
type DeliveryCopy = { [Key in keyof typeof en]: string };
const zh: DeliveryCopy = {
  title: '报告与寄送', hint: '选择您希望接收报告的方式。', format: '报告接收方式',
  emailHint: 'PDF 报告将发送至第一步填写的电子邮箱。',
  mailingTitle: '收件地址', mailingHint: '请填写纸质报告的收件人及完整邮寄地址。',
  recipient: '收件人／机构名称', country: '国家或地区', street: '街道地址', street2: '公寓、套房、楼层等',
  city: '城市', region: '州／省', postal: '邮政编码', postalHint: '如目的地使用邮编，请填写。',
  extraCopies: '额外纸质副本份数', copiesHint: '已包含一份纸质报告。每份额外副本：{amount}，寄往同一地址。',
  shipping: '邮寄方式', shippingHint: '请先选择收件国家或地区。邮寄时间不包含评估办理时间。',
  shippingError: '请选择适用于收件地址的邮寄方式。', postalError: '请输入有效的美国邮政编码。', copiesError: '请输入 0 至 20 之间的整数。',
  incomplete: '请选择邮寄方式，以完善寄送费用预估。', rangeNote: '额外副本费用按价格区间预估，最终费用需确认。',
};
const es: DeliveryCopy = {
  title: 'Informe y envío', hint: 'Elija cómo desea recibir el informe.', format: 'Formato del informe',
  emailHint: 'El informe PDF se enviará al correo electrónico indicado en el paso 1.',
  mailingTitle: 'Dirección de envío', mailingHint: 'Indique el destinatario y la dirección completa para el informe impreso.',
  recipient: 'Destinatario / organización', country: 'País / región', street: 'Dirección', street2: 'Apartamento, oficina, piso, etc.',
  city: 'Ciudad', region: 'Estado / provincia', postal: 'Código postal', postalHint: 'Indique el código postal si se utiliza en el destino.',
  extraCopies: 'Copias impresas adicionales', copiesHint: 'Incluye una copia impresa. Cada copia adicional: {amount}, enviada a la misma dirección.',
  shipping: 'Método de envío', shippingHint: 'Primero seleccione el país de destino. El plazo de envío es independiente del plazo de evaluación.',
  shippingError: 'Seleccione un método de envío disponible para este destino.', postalError: 'Introduzca un código postal válido de EE. UU.', copiesError: 'Introduzca un número entero de 0 a 20.',
  incomplete: 'Seleccione un método de envío para completar la estimación.', rangeNote: 'Las copias adicionales se estiman como un rango; se confirmará la tarifa final.',
};
export const deliveryCopy: Record<Locale, DeliveryCopy> = { en, zh, es };
