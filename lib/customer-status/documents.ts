import 'server-only';
import type { CustomerStatus } from './model';
import { accountForOffice, safeSegment, type Office } from '@/lib/dropbox/shared';
import { requireEnabled, folderPath, seal, type ApplicationContext } from '@/lib/dropbox/server';

/** Called only after the existing status endpoint has looked up its selected data source. */
export function withDocuments(record: CustomerStatus, submittedAt = record.submitted): CustomerStatus {
  try {
    requireEnabled();
    const context: ApplicationContext = {
      id: safeSegment(record.id), kind: 'evaluation', office: record.office as Office,
      fullName: safeSegment([record.evaluee.first, record.evaluee.middle, record.evaluee.last].filter(Boolean).join(' ')),
      folderKey: safeSegment(record.id), submittedAt,
      canUpload: ['submitted', 'processing'].includes(record.status.toLowerCase()),
      ...(record.source === 'preview' ? { storage: 'preview' as const } : {}),
    };
    if (!/^\d{4}-\d{2}-\d{2}/.test(submittedAt)) throw new Error('missing_submission_date');
    folderPath(context);
    return { ...record, documents: {
      state: 'ready', token: seal(accountForOffice(context.office), 'access', context),
      canUpload: context.canUpload === true,
    } };
  } catch {
    // Document configuration failures must not hide the rest of the application.
    return { ...record, documents: { state: 'unavailable' } };
  }
}
