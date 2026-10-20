import 'server-only';
import { requireStaff, requireStaffApplication } from '@/lib/staff/session';
import { liveEnabled } from './live-db';
import { liveDetail } from './live-server';
import { readIntake, requireIntakePreview } from '@/lib/application/intake-server';
import { projectIntakeStatus } from '@/lib/customer-status/model';
import { AppError } from '@/lib/preeval/domain';
import { contextFor } from '@/lib/dropbox/application';
import { statusDocumentContext } from '@/lib/customer-status/documents';
import { timestamp } from './live-domain';
import { listFiles, requireEnabled, type ApplicationContext } from '@/lib/dropbox/server';

/** Resolve folder identity only from a staff-authorized record, never request metadata. */
export async function staffDocuments(kind: 'formal' | 'preeval', id: string, source: 'live' | 'preview', cursor?: string | null) {
  const staff = await requireStaff();
  let context: ApplicationContext;
  if (source === 'preview') {
    requireIntakePreview();
    if (kind !== 'formal') throw new AppError('not_found', 404);
    await requireStaffApplication('formal', id, staff);
    const record = projectIntakeStatus(await readIntake(id));
    context = statusDocumentContext(record);
  } else {
    if (!liveEnabled()) throw new AppError('not_found', 404);
    const { row } = await liveDetail(kind, id, staff);
    // Pre-evaluation authorization uses Unassigned; Miami is only its historic storage location.
    context = contextFor({ ...row, submitted_at: timestamp(row.submitted_at), created_at: timestamp(row.created_at) }, kind === 'formal' ? 'evaluation' : 'pre-evaluation');
  }
  requireEnabled();
  context.canUpload = false;
  return listFiles(context, cursor);
}
