import { describe, expect, it } from 'vitest';
import { deliveryCopy } from '../lib/application/delivery-copy';
import { emptyDelivery, quoteDelivery, selectDeliveryCountry, selectReport, shippingOptions, validateDelivery } from '../lib/application/delivery';
import { initialDraft, restoreDraft, validateStep } from '../lib/application/model';
import { selectEvaluationService } from '../lib/application/evaluation';
import { shipping } from '../lib/pricing';

const mailed = () => ({ ...emptyDelivery(), report: 'paper' as const, shipping: 'domesticFirst',
  address: { name: 'Preview Recipient', country: 'US', street: '123 Example Street', street2: 'Suite 200', city: 'Los Angeles', region: 'CA', postal: '90001' } });

describe('general application report delivery', () => {
  it('requires no mailing details for PDF and charges only the PDF report', () => {
    expect(validateDelivery(emptyDelivery())).toEqual({});
    expect(quoteDelivery(emptyDelivery())).toMatchObject({ minCents: 1000, maxCents: 1000, incomplete: false });
    const switched = selectReport({ ...mailed(), extraCopies: 2 }, 'pdf');
    expect(switched).toMatchObject({ extraCopies: 0, shipping: '', address: mailed().address });
    expect(quoteDelivery({ ...mailed(), report: 'pdf', extraCopies: 2 }).lines.map(line => line.rate.id)).toEqual(['pdf']);
    expect(selectReport(switched, 'paper').address).toEqual(mailed().address);
  });
  it('requires recipient, full address and shipping only when mailing a paper report', () => {
    const errors = validateDelivery(selectReport(emptyDelivery(), 'paper'));
    for (const path of ['address.name', 'address.country', 'address.street', 'address.city', 'shipping']) expect(errors).toHaveProperty('evaluationDelivery.' + path);
    expect(errors).not.toHaveProperty('evaluationDelivery.address.street2');
    expect(validateDelivery(mailed())).toEqual({});
    const invalid = { ...mailed(), address: { ...mailed().address, name: '  ', postal: 'abc', region: '' } };
    expect(validateDelivery(invalid)).toMatchObject({ 'evaluationDelivery.address.name': 'required', 'evaluationDelivery.address.postal': 'postal', 'evaluationDelivery.address.region': 'required' });
    expect(validateDelivery({ ...mailed(), address: { ...mailed().address, postal: '90001-1234' } })).toEqual({});
  });
  it('supports international addresses without imposing U.S. state or ZIP rules', () => {
    const delivery = { ...mailed(), shipping: 'internationalExpress', address: { ...mailed().address, country: 'GB', region: '', postal: 'SW1A 1AA' } };
    expect(validateDelivery(delivery)).toEqual({});
    expect(validateDelivery({ ...delivery, address: { ...delivery.address, country: 'HK', postal: '' } })).toEqual({});
    expect(validateDelivery({ ...delivery, address: { ...delivery.address, country: 'invalid' } })).toHaveProperty('evaluationDelivery.address.country', 'country');
  });
  it('clears incompatible shipping when the destination changes and never prices stale shipping', () => {
    const changed = selectDeliveryCountry(mailed(), 'CN');
    expect(changed.shipping).toBe('');
    expect(changed.address).toMatchObject({ country: 'CN', region: '', name: 'Preview Recipient', street: '123 Example Street' });
    expect(shippingOptions('')).toEqual([]);
    const stale = { ...changed, shipping: 'domesticFirst' };
    expect(validateDelivery(stale)).toHaveProperty('evaluationDelivery.shipping', 'shipping');
    expect(quoteDelivery(stale)).toMatchObject({ minCents: 2000, maxCents: 2000, incomplete: true });
  });
  it('uses the shared 2026 report and shipping catalog without charging PDF twice', () => {
    for (const rate of shipping) {
      const delivery = { ...mailed(), shipping: rate.id, address: { ...mailed().address, country: rate.id.startsWith('domestic') ? 'US' : 'CN' } };
      const cost = rate.price.kind === 'fixed' ? rate.price.amount : NaN;
      expect(quoteDelivery(delivery)).toMatchObject({ minCents: (20 + cost) * 100, maxCents: (20 + cost) * 100, incomplete: false });
    }
  });
  it('prices extra copies as the current range and rejects invalid quantities', () => {
    expect(quoteDelivery({ ...mailed(), extraCopies: 2 })).toMatchObject({ minCents: 11000, maxCents: 15000, needsQuote: true });
    for (const extraCopies of [-1, 0.5, 21]) {
      expect(validateDelivery({ ...mailed(), extraCopies })).toHaveProperty('evaluationDelivery.extraCopies', 'copies');
      expect(quoteDelivery({ ...mailed(), extraCopies }).incomplete).toBe(true);
    }
  });
  it('restores mailing details and stops review if a required address is incomplete', () => {
    const now = Date.now();
    const draft = { ...initialDraft('evaluation'), contactName: 'Preview', email: 'preview@example.com', phone: '+1 202 555 0148', office: 'la',
      pronouns: 'mx', firstName: 'Preview', lastName: 'Applicant', purpose: 'education', evaluationDelivery: mailed(),
      educations: [{ school: 'Example University', country: 'CN', degree: 'Bachelor', start: '2018-09', end: '2022-06' }] };
    draft.evaluationRequest = selectEvaluationService(draft.evaluationRequest, 'document', 1);
    const restore = (data: unknown) => restoreDraft(JSON.stringify({ version: 1, updatedAt: now, step: 2, data }), now);
    expect(restore(draft)).toMatchObject({ step: 2, data: { evaluationDelivery: mailed() } });
    expect(restore({ ...draft, evaluationDelivery: { ...mailed(), address: { ...mailed().address, street: '' } } })).toMatchObject({ step: 1 });
    const { evaluationDelivery: _delivery, ...oldDraft } = draft;
    expect(restore(oldDraft)).toMatchObject({ step: 2, data: { evaluationDelivery: emptyDelivery() } });
  });
  it('keeps mailing requirements out of pre-evaluation and translation', () => {
    for (const service of ['pre-evaluation', 'translation'] as const) {
      const errors = validateStep({ ...initialDraft(service), evaluationDelivery: selectReport(emptyDelivery(), 'paper') }, 1);
      expect(Object.keys(errors).some(path => path.startsWith('evaluationDelivery'))).toBe(false);
    }
  });
  it('has complete report-delivery copy in all three languages', () => {
    for (const locale of ['zh', 'es'] as const) expect(Object.keys(deliveryCopy[locale]).sort()).toEqual(Object.keys(deliveryCopy.en).sort());
  });
});
