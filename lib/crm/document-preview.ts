import 'server-only';
import { coreFileMetadata } from '@/lib/application-core/documents';
import { clientForOffice, requireEnabled } from '@/lib/dropbox/server';
import { dropboxPreviewUrl } from '@/lib/dropbox/shared';
import type { Row } from '@/lib/preeval/db';
import { AppError } from '@/lib/preeval/domain';
import { officeForStoredPath } from '@/lib/preeval/dropbox';

/** The caller authorizes the staff member and selects a ready file on their case. */
export async function staffDocumentPreview(file: Row, core: boolean) {
  requireEnabled();
  const metadata = core
    ? await coreFileMetadata(file)
    : (await (await clientForOffice(officeForStoredPath(file.dropbox_path))).filesGetMetadata({path: file.dropbox_path})).result;
  if (metadata['.tag'] !== 'file' || !metadata.path_display) throw new AppError('document_unavailable', 404);
  return {previewUrl: dropboxPreviewUrl(metadata.path_display), uploadedAt: metadata.server_modified};
}
