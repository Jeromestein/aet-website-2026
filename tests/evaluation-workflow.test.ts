import { describe, expect, it } from 'vitest';
import { initialData, quote } from '../lib/evaluation-application/domain';
import { canDownloadReport, confirmQuote, payableTotal, staffSchema } from '../lib/evaluation-application/workflow';
function fixed() { const data = initialData(); data.services.document.tier = 'standard'; return data; }
describe('formal evaluation billing and release rules', () => {
  it('uses the website total without a manual quote for fixed services', () => { const data = fixed(); expect(payableTotal({ quote: quote(data), confirmed_quote: null })).toBe(11000); });
  it('blocks payment for copy ranges', () => { const estimate = { ...quote(fixed()), min: 21000, max: 25000, needsQuote: true }; expect(payableTotal({ quote: estimate, confirmed_quote: null })).toBeNull(); });
  it.each([9999, 11001, -1, NaN, Infinity, 11000.5])('rejects altered fixed website prices: %s', base => { const data = fixed(); expect(() => confirmQuote(quote(data), data, base, 0, 'Quote')).toThrow(); });
  it('requires a separate positive quote for requested customized services', () => { const data = fixed(); data.services.customized = true; expect(payableTotal({ quote: quote(data), confirmed_quote: null })).toBeNull(); expect(() => confirmQuote(quote(data), data, 11000, 0, 'Custom')).toThrow(); expect(confirmQuote(quote(data), data, 11000, 12345, 'Customized service')).toEqual({ base: 11000, additional: 12345, total: 23345, explanation: 'Customized service' }); });
  it('rejects unrequested additional fees', () => { const data = fixed(); expect(() => confirmQuote(quote(data), data, 11000, 100, 'Unexpected fee')).toThrow(); });
  it.each([['paid', 'processing'], ['unpaid', 'completed'], ['pending', 'completed'], ['refunded', 'completed'], ['partially_refunded', 'completed'], ['paid', 'cancelled']])('blocks report access for %s / %s', (payment_status, status) => expect(canDownloadReport({ payment_status, status, released_file_id: 'report' }, 'report')).toBe(false));
  it('validates manual totals independently of the original fixed estimate', () => {
    const action = { action: 'adjust_amount', version: 1, explanation: 'Revised fee', total: 9550 };
    expect(staffSchema.safeParse(action).success).toBe(true);
    for (const total of [0, 49, 9550.5, 1000000]) expect(staffSchema.safeParse({ ...action, total }).success).toBe(false);
    expect(staffSchema.safeParse({ ...action, explanation: '  ' }).success).toBe(false);
    expect(payableTotal({ quote: quote(fixed()), confirmed_quote: { kind: 'adjusted', total: action.total, explanation: action.explanation } })).toBe(9550);
  });
  it('only exposes the specific released report', () => { const app = { payment_status: 'paid', status: 'completed', released_file_id: 'released' }; expect(canDownloadReport(app, 'released')).toBe(true); expect(canDownloadReport(app, 'draft')).toBe(false); });
  it('rejects staff-controlled payment states and missing edit versions', () => { expect(staffSchema.safeParse({ action: 'status', version: 1, status: 'paid', message: '' }).success).toBe(false); expect(staffSchema.safeParse({ action: 'notes', notes: 'hello' }).success).toBe(false); expect(staffSchema.safeParse({ action: 'notes', version: 1, notes: 'hello', total: 1 }).success).toBe(false); });
});
