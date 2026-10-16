import { describe, expect, it } from 'vitest';
import { workspaceCsv, type WorkspaceRow } from '../lib/crm/contracts';

describe('staff workspace exports', () => {
  const row: WorkspaceRow = { id: 'case-1', kind: 'formal', name: '  =HYPERLINK("https://example.invalid")', email: 'client@example.invalid', office: null, service: 'Translation', purpose: '', country: 'US', educations: [{ school: 'College, "A"', degree: 'Bachelor', country: 'US', start: '', end: '' }], status: 'submitted', payment_status: 'unpaid', amount: null, created_at: '2026-10-15T12:00:00Z', updated_at: '2026-10-15T12:00:00Z', files: [], payments: [], attention: true };
  it('escapes spreadsheet formulas even after leading whitespace and quotes CSV fields', () => {
    const csv = workspaceCsv([row]);
    expect(csv).toContain('"\'  =HYPERLINK(""https://example.invalid"")"');
    expect(csv).toContain('"Bachelor / College, ""A"""');
    expect(csv).toContain('"Unassigned"');
  });
  it('preserves cents without converting an unquoted application into a zero price', () => {
    const csv = workspaceCsv([row, { ...row, amount: 1988 }]);
    expect(csv).toContain('"Unpaid","","2026-10-15"');
    expect(csv).toContain('"Unpaid","19.88","2026-10-15"');
  });
});
