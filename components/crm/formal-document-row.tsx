'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { caseApi, fileUrl, type CaseReference, type WorkspaceFile } from '@/lib/crm/contracts';
import { formatFileSize } from '@/lib/dropbox/shared';
import { request } from './ui';
import { NewWindowIcon } from './new-window-icon';
import s from './crm.module.css';

type DropboxDetails = { previewUrl: string; uploadedAt: string };
const uploadTime = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
});

export function FormalDocumentRow({ application, file }: { application: CaseReference; file: WorkspaceFile }) {
  const [details, setDetails] = useState<DropboxDetails | null>(null);
  const [failed, setFailed] = useState(false);
  const endpoint = `${caseApi(application)}/admin/documents/${file.id}`;

  useEffect(() => {
    const controller = new AbortController();
    setDetails(null);
    setFailed(false);
    request<DropboxDetails>(endpoint, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setDetails(value); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [endpoint, file]);

  return <div className={s.detailDocument}>
    <div>
      <strong>{details
        ? <a className={s.documentNameLink} href={details.previewUrl} target="_blank" rel="noopener noreferrer"
            aria-label={`${file.name} (opens in Dropbox in a new tab)`}>
            <NewWindowIcon /><span>{file.name}</span>
          </a>
        : file.name}</strong>
      <small>{formatFileSize(file.bytes)}</small>
      {details && <small>Uploaded <time dateTime={details.uploadedAt}>{uploadTime.format(new Date(details.uploadedAt))}</time></small>}
      {failed && <small>Dropbox preview and upload time unavailable.</small>}
    </div>
    <a className={s.documentDownload} href={fileUrl(application, file)} aria-label={`Download ${file.name}`} title={`Download ${file.name}`}>
      <Download size={19} aria-hidden="true"/>
    </a>
  </div>;
}
