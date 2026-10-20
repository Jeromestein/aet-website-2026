import 'server-only';
import { accountForOffice, DocumentError, safeSegment, type ApplicationKind, type Office } from './shared';
import { folderPath, seal, type ApplicationContext } from './server';

async function lookup(applicationId: unknown, kind: unknown) {
  if (typeof applicationId !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(applicationId) ||
    !['evaluation', 'pre-evaluation'].includes(String(kind))) throw new DocumentError('invalid');
  const base = process.env.AET_APPLICATIONS_SUPABASE_URL;
  const key = process.env.AET_APPLICATIONS_SUPABASE_ANON_KEY;
  if (!base || !key) throw new DocumentError('unavailable', 503);
  const url = new URL(`/rest/v1/${kind === 'evaluation' ? 'fce_applications' : 'aet_core_applications'}`, base);
  if (url.protocol !== 'https:') throw new DocumentError('unavailable', 503);
  url.searchParams.set('select', kind === 'evaluation'
    ? 'id,email,first_name,middle_name,last_name,office,submitted_at,status,payment_status,paid_at'
    : 'id,email,first_name,middle_name,last_name,created_at,purpose');
  url.searchParams.set('id', `eq.${applicationId}`);
  url.searchParams.set('limit', '1');
  if (kind === 'pre-evaluation') url.searchParams.set('purpose', 'eq.degree-equivalency');
  let records;
  try {
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('lookup');
    records = await response.json();
  } catch { throw new DocumentError('unavailable', 503); }
  const row = Array.isArray(records) ? records[0] : undefined;
  if (!row) throw new DocumentError('access', 403);
  return row;
}

export function contextFor(row: Record<string, string | null>, kind: ApplicationKind) {
  const fullName = [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ');
  const context: ApplicationContext = {
    id: safeSegment(row.id), kind,
    office: kind === 'evaluation' ? row.office as Office : 'Miami',
    fullName: safeSegment(fullName),
    folderKey: safeSegment(row.id),
    // Unregistered legacy records can still read their historical email folder.
    // New applications pin an ID-only location in their creation transaction.
    ...(kind === 'pre-evaluation' && row.email
      ? { legacyFolderKey: safeSegment(row.email) } : {}),
    submittedAt: (kind === 'evaluation' ? row.submitted_at || row.created_at : row.created_at) || '',
    canUpload: kind === 'pre-evaluation' || ['submitted', 'processing'].includes(row.status?.toLowerCase() ?? ''),
  };
  // Persisting the identity must not require Dropbox OAuth credentials.
  // Signing access and provider operations validate account configuration.
  folderPath(context);
  if (typeof context.submittedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(context.submittedAt)) throw new DocumentError('unavailable', 503);
  return context;
}

/** Optional standalone lookup; matching the email does not prove mailbox ownership. */
export async function applicationAccess(input: Record<string, unknown>) {
  const { applicationId, email, kind } = input;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DocumentError('invalid');
  const row = await lookup(applicationId, kind);
  if (typeof row.email !== 'string' || row.email.trim().toLowerCase() !== email.trim().toLowerCase()) throw new DocumentError('access', 403);
  const context = contextFor(row, kind as ApplicationKind);
  return { success: true, token: seal(accountForOffice(context.office), 'access', context), office: context.office, canUpload: context.canUpload };
}

/** Legacy status links use the unguessable application UUID as their access key.
 * Do not require another email form or accept folder/office details from callers. */
export async function applicationStatus(applicationId: unknown) {
  const row = await lookup(applicationId, 'evaluation');
  const context = contextFor(row, 'evaluation');
  return {
    success: true, token: seal(accountForOffice(context.office), 'access', context),
    application: {
      id: context.id, name: context.fullName, office: context.office,
      submittedAt: context.submittedAt, status: row.status ?? '',
      paymentStatus: row.payment_status ?? '', paidAt: row.paid_at ?? null,
      canUpload: context.canUpload,
    },
  };
}
