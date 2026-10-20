import 'server-only';
import type { CustomerStatus } from './model';
import { accountForOffice } from '@/lib/dropbox/shared';
import { requireEnabled, seal } from '@/lib/dropbox/server';
import { contextFor } from '@/lib/dropbox/application';

export function statusDocumentContext(record: CustomerStatus, submittedAt = record.submitted) {
  return contextFor({ id: record.id, office: record.office,
    first_name: record.evaluee.first, middle_name: record.evaluee.middle, last_name: record.evaluee.last,
    submitted_at: submittedAt, status: record.status }, 'evaluation');
}

/** Called only after the existing status endpoint has looked up its selected data source. */
export function withDocuments(record: CustomerStatus, submittedAt = record.submitted): CustomerStatus {
  try {
    requireEnabled();
    const context = statusDocumentContext(record, submittedAt);
    return { ...record, documents: {
      state: 'ready', token: seal(accountForOffice(context.office), 'access', context),
      canUpload: context.canUpload === true,
    } };
  } catch {
    return { ...record, documents: { state: 'unavailable' } };
  }
}
