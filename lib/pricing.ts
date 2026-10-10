/** Business facts from the owner-updated e-fee.php, September 29, 2026.
 * Amounts are USD. Website language does not change the document-language scope.
 * Keep prices and turnaround together; localized messages contain presentation only.
 */
export type Price =
  | { kind: 'fixed' | 'from'; amount: number; unit?: 'person' | 'copy' | 'hour' | 'page' | 'word' | 'chineseWord' | 'englishWord' }
  | { kind: 'range'; min: number; max: number; unit?: 'hour' | 'page' | 'word' | 'chineseWord' | 'englishWord' }
  | { kind: 'quote' }
  | { kind: 'variable' };
export type Turnaround =
  | { kind: 'businessDays' | 'hours'; value: number }
  | { kind: 'businessDayRange'; min: number; max: number }
  | { kind: 'hourRange'; min: number; max: number }
  | { kind: 'sameDay' | 'sameTranslation' | 'notApplicable' };
export type Rate = { id: string; label: string; price: Price; turnaround?: Turnaround; note?: string; tracking?: boolean };
const fixed = (amount: number): Price => ({ kind: 'fixed', amount });
const days = (value: number): Turnaround => ({ kind: 'businessDays', value });
const tier = (id: string, label: string, amount: number, turnaround: Turnaround): Rate => ({ id, label, price: fixed(amount), turnaround });

export const certifiedTranslation: readonly Rate[] = [
  { id: 'degree', label: 'degree', price: { kind: 'from', amount: 70 }, turnaround: days(3) },
  { id: 'transcript', label: 'transcript', price: { kind: 'from', amount: 80 }, turnaround: days(5) },
  ...['birth', 'marriage', 'license'].map((id): Rate => ({ id, label: id, price: { kind: 'from', amount: 80 }, turnaround: days(3) })),
  { id: 'paper', label: 'paper', price: { kind: 'fixed', amount: 20, unit: 'copy' }, turnaround: { kind: 'sameTranslation' } },
  { id: 'pdf', label: 'pdf', price: fixed(20), turnaround: { kind: 'sameTranslation' } },
  { id: 'other', label: 'other', price: { kind: 'quote' }, turnaround: { kind: 'notApplicable' } },
];
export const documentEvaluationStandard = { price: 100, businessDays: 7 } as const;
/** Evaluation-page rates from e-evaluation-content.html; shared by every locale. */
export const evaluationExtraCopy: Price = { kind: 'range', min: 40, max: 60 };
export const preEvaluation: readonly Rate[] = [
  { id: 'preEvaluation', label: 'preEvaluation', price: { kind: 'range', min: 40, max: 60 }, turnaround: { kind: 'hourRange', min: 24, max: 48 } },
];
export const documentEvaluation: readonly Rate[] = [
  tier('standard', 'document', documentEvaluationStandard.price, days(documentEvaluationStandard.businessDays)),
  tier('rush', 'document', 150, days(3)),
  tier('nextDay', 'document', 200, { kind: 'hours', value: 24 }),
  tier('sameDay', 'document', 250, { kind: 'sameDay' }),
];
export const courseEvaluation: readonly Rate[] = [
  tier('standard', 'course', 180, days(8)), tier('rush', 'course', 210, days(5)),
  tier('express', 'course', 280, days(3)), tier('nextDay', 'course', 350, { kind: 'hours', value: 24 }),
];
export const expertOpinion: readonly Rate[] = [
  tier('standard', 'expert', 620, days(21)), tier('rush', 'expert', 700, days(14)), tier('express', 'expert', 800, days(8)),
];
export const positionEvaluation: readonly Rate[] = [
  tier('standard', 'position', 300, days(10)), tier('rush', 'position', 400, days(5)),
  tier('express', 'position', 500, days(3)), tier('priority', 'position', 600, days(2)),
];
export const interpretation: readonly Rate[] = [
  { id: 'personal', label: 'personal', price: { kind: 'range', min: 60, max: 100, unit: 'hour' }, note: 'onSite' },
  { id: 'business', label: 'business', price: { kind: 'range', min: 100, max: 250, unit: 'hour' }, note: 'onSite' },
  { id: 'simultaneous', label: 'simultaneous', price: { kind: 'range', min: 350, max: 450, unit: 'hour' }, note: 'simultaneous' },
  { id: 'telephone', label: 'telephone', price: { kind: 'range', min: 80, max: 120, unit: 'hour' }, note: 'telephone' },
];
export const generalTranslation: readonly Rate[] = [
  { id: 'toEnglish', label: 'toEnglish', price: { kind: 'range', min: 0.1, max: 0.4, unit: 'chineseWord' } },
  { id: 'toChinese', label: 'toChinese', price: { kind: 'range', min: 0.12, max: 0.4, unit: 'englishWord' } },
];
export const proofreading: readonly Rate[] = [
  { id: 'technicalProofreading', label: 'technicalProofreading', price: { kind: 'range', min: 75, max: 100, unit: 'page' }, note: 'proofreading' },
  { id: 'nonTechnicalProofreading', label: 'nonTechnicalProofreading', price: { kind: 'range', min: 35, max: 75, unit: 'page' }, note: 'proofreading' },
];
export const englishWriting: readonly Rate[] = [
  { id: 'englishWriting', label: 'englishWriting', price: { kind: 'range', min: 0.5, max: 1.2, unit: 'word' }, note: 'writing' },
];
export const otherServices: readonly Rate[] = [
  ...generalTranslation.map(rate => ({ ...rate, note: 'general' })), ...proofreading, ...englishWriting,
];
export const shipping: readonly Rate[] = [
  { id: 'domesticFirst', label: 'domesticFirst', price: fixed(10), turnaround: { kind: 'businessDayRange', min: 5, max: 7 }, tracking: false },
  { id: 'domesticPriority', label: 'domesticPriority', price: fixed(17), turnaround: { kind: 'businessDayRange', min: 2, max: 5 }, tracking: true },
  { id: 'domesticExpress', label: 'domesticExpress', price: fixed(42), turnaround: { kind: 'businessDayRange', min: 1, max: 2 }, tracking: true },
  { id: 'internationalFirst', label: 'internationalFirst', price: fixed(20), turnaround: { kind: 'businessDayRange', min: 10, max: 15 }, tracking: false },
  { id: 'internationalExpress', label: 'internationalExpress', price: fixed(88), turnaround: { kind: 'businessDayRange', min: 3, max: 5 }, tracking: true },
  { id: 'internationalFedex', label: 'internationalFedex', price: fixed(93), turnaround: { kind: 'businessDayRange', min: 1, max: 3 }, tracking: true },
];
export const pricingPolicy = { sameDayCutoff: '1:00pm EST', simultaneousMinimumHours: 3, telephoneMinimumHours: 0.5, proofreadingDiscountMinimumPages: 10 } as const;
export const pricingSections = ['translation', 'evaluation', 'expert', 'interpretation', 'general', 'visa', 'shipping'] as const;
export type PricingSectionId = typeof pricingSections[number];

export const evaluationGroups = [
  { id: "document", rates: documentEvaluation }, { id: "course", rates: courseEvaluation },
  { id: "expert", rates: expertOpinion }, { id: "position", rates: positionEvaluation },
] as const;
export const pricingAnchors: Record<PricingSectionId, string> = { translation: "translation", evaluation: "evaluation", expert: "expert-opinion", interpretation: "interpretation", general: "other", visa: "visa", shipping: "shipping" };

/** Visa fees from the legacy Visa Service pages, preserved at the owner's request.
 * The introductory starting price and Q2/L starting price are distinct source claims.
 * Consular/application charges are separate from AET service fees.
 */
const visaBaseFees = {
  advertisedChina: 75,
  photoFour: 15,
  photoTwo: 12,
  chinaTourist: 99,
  chinaOther: 300,
  chinaUS: 140,
  chinaCanada: 68,
  chinaOtherMin: 23,
  chinaOtherMax: 122,
  canadaService: 500,
  canadaApplication: 180,
  canadaShipping: 76,
  schengenService: 450,
  ukService: 450,
  japanService: 415,
  japanSingle: 27,
  japanMultiple: 55,
  koreaService: 350,
  koreaApplication: 40,
} as const;
export const visaFees = { ...visaBaseFees, canadaTotal: visaBaseFees.canadaApplication + visaBaseFees.canadaShipping } as const;
export const visaServiceRates: readonly Rate[] = [
  { id: 'advertisedChina', label: 'visa_advertisedChina', price: { kind: 'from', amount: visaFees.advertisedChina }, note: 'visaAdvertised' },
  { id: 'chinaTourist', label: 'visa_chinaTourist', price: { kind: 'from', amount: visaFees.chinaTourist, unit: 'person' }, note: 'visaService' },
  { id: 'chinaOther', label: 'visa_chinaOther', price: { kind: 'fixed', amount: visaFees.chinaOther, unit: 'person' }, note: 'visaService' },
  { id: 'canadaService', label: 'visa_canadaService', price: { kind: 'fixed', amount: visaFees.canadaService, unit: 'person' }, note: 'visaService' },
  { id: 'schengenService', label: 'visa_schengenService', price: { kind: 'fixed', amount: visaFees.schengenService, unit: 'person' }, note: 'visaService' },
  { id: 'ukService', label: 'visa_ukService', price: { kind: 'fixed', amount: visaFees.ukService, unit: 'person' }, note: 'visaService' },
  { id: 'japanService', label: 'visa_japanService', price: { kind: 'fixed', amount: visaFees.japanService, unit: 'person' }, note: 'visaService' },
  { id: 'koreaService', label: 'visa_koreaService', price: { kind: 'fixed', amount: visaFees.koreaService, unit: 'person' }, note: 'visaService' },
];
export const visaExternalRates: readonly Rate[] = [
  { id: 'chinaUS', label: 'visa_chinaUS', price: fixed(visaFees.chinaUS) },
  { id: 'chinaCanada', label: 'visa_chinaCanada', price: fixed(visaFees.chinaCanada) },
  { id: 'chinaOtherCountries', label: 'visa_chinaOtherCountries', price: { kind: 'range', min: visaFees.chinaOtherMin, max: visaFees.chinaOtherMax } },
  { id: 'canadaApplication', label: 'visa_canadaApplication', price: fixed(visaFees.canadaApplication) },
  { id: 'canadaShipping', label: 'visa_canadaShipping', price: fixed(visaFees.canadaShipping) },
  { id: 'canadaTotal', label: 'visa_canadaTotal', price: fixed(visaFees.canadaTotal) },
  { id: 'japanSingle', label: 'visa_japanSingle', price: fixed(visaFees.japanSingle) },
  { id: 'japanMultiple', label: 'visa_japanMultiple', price: fixed(visaFees.japanMultiple) },
  { id: 'koreaApplication', label: 'visa_koreaApplication', price: fixed(visaFees.koreaApplication) },
  { id: 'schengenConsulate', label: 'visa_schengenConsulate', price: { kind: 'variable' } },
  { id: 'ukConsulate', label: 'visa_ukConsulate', price: { kind: 'variable' } },
];
export const visaPhotoRates: readonly Rate[] = [
  { id: 'photoFour', label: 'visa_photoFour', price: fixed(visaFees.photoFour) },
  { id: 'photoTwo', label: 'visa_photoTwo', price: fixed(visaFees.photoTwo) },
];
