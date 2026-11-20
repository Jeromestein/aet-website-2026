import { NextIntlClientProvider } from 'next-intl';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SavedServiceDetails } from '@/components/customer-status/saved-details';
import { initialDraft } from '@/lib/application/model';
import { selectEvaluationService } from '@/lib/application/evaluation';
import { intakeQuote } from '@/lib/application/intake';
import { projectIntakeStatus } from '@/lib/customer-status/model';
import type { ConfirmedQuote } from '@/lib/evaluation-application/workflow';
import messages from '@/messages/en.json';

function breakdown(confirmedQuote: ConfirmedQuote | null, max = 16000, needsQuote = false) {
  const data = initialDraft('evaluation');
  data.evaluationRequest = selectEvaluationService(data.evaluationRequest, 'document', 1);
  data.evaluationRequest.services.document.tier = 'rush';
  const quote = { ...intakeQuote(data), max, needsQuote };
  const record = projectIntakeStatus({
    id: 'test', locale: 'en', status: 'submitted', createdAt: '', data, quote,
    email: { state: 'sent', attempts: 1, recipient: '' }, statusPath: '/status',
  });
  record.workflow = { confirmedQuote, message: '', canPay: true, report: null };
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <SavedServiceDetails record={record} locale="en" />
    </NextIntlClientProvider>
  );
}

describe('customer status fee breakdown', () => {
  it.each([[13550, '-$24.50', '$135.50'], [18000, '+$20.00', '$180.00']] as const)(
    'reconciles the saved line items to the adjusted total of %i cents', (total, delta, amount) => {
      const html = breakdown({ kind: 'adjusted', total, explanation: 'Updated by the Miami office.' });
      for (const text of ['$150.00', '$10.00', 'Office fee adjustment', delta, 'Adjusted total', amount, 'Updated by the Miami office.']) {
        expect(html).toContain(text);
      }
      expect(html).not.toContain('Estimated fees');
    }
  );
  it('retains the original estimate before an office update', () => {
    const html = breakdown(null);
    expect(html).toContain('Estimated fees');
    expect(html).toContain('$160.00');
    expect(html).not.toContain('Office fee adjustment');
  });
  it('keeps a range alongside a final adjusted quote without guessing a difference', () => {
    const html = breakdown({ kind: 'adjusted', total: 20000, explanation: 'Includes shipping.' }, 19000, true);
    for (const text of ['$160.00', '$190.00', 'Adjusted total', '$200.00']) expect(html).toContain(text);
    expect(html).not.toContain('Office fee adjustment');
  });
  it('shows the additional fee from a previously itemized quote', () => {
    const html = breakdown({ base: 16000, additional: 3000, total: 19000, explanation: 'Includes translation.' }, 16000, true);
    for (const text of ['Translation / customized services', '$30.00', '$190.00']) expect(html).toContain(text);
    expect(html).not.toContain('Office fee adjustment');
  });
});
