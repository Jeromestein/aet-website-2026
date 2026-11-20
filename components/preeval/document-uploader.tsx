'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { UploadedFileRow, UploadedFilesPanel, UploadPanel, UploadQueueRow } from '@/components/documents/upload-panel';
import styles from '@/components/documents/documents.module.css';
import { copy, errorText, stateLabel } from '@/lib/preeval/copy';
import { uploadDocuments, validateDocuments, type UploadApi, type UploadPhase } from '@/lib/preeval/upload-client';

type SavedFile = {id: string; name: string; state: string; bytes: number; created_at?: string};
type QueueRow = {id: string; file: File; status: UploadPhase | 'pending'; percent: number};

export function PreevalDocumentUploader({ id, locale, files, canUpload, busy, setBusy, reload, api, children }: {
  id: string; locale: string; files: SavedFile[]; canUpload: boolean; busy: string;
  setBusy: (action: string) => void; reload: () => Promise<boolean>; api: UploadApi; children: ReactNode;
}) {
  const t = useTranslations('documents');
  const c = copy(locale);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const uploading = useRef(false);
  function select(files: FileList) {
    if (!files.length || busy) return;
    const incoming = Array.from(files);
    const existing = queue.filter(row => row.status !== 'success');
    try {
      validateDocuments([...existing.map(row => row.file), ...incoming]);
      setQueue([...existing, ...incoming.map(file => ({id:crypto.randomUUID(), file, status:'pending' as const, percent:0}))]);
      setCompleted(false);
      setError('');
    } catch(e) { setError(errorText(c, (e as Error).message)); }
  }
  async function upload() {
    if (uploading.current || busy || !canUpload || !queue.length) return;
    uploading.current = true;
    setBusy('upload');
    setError('');
    try {
      const remaining = queue.filter(row => row.status !== 'success');
      if (remaining.length) {
        await uploadDocuments(id, remaining.map(row => row.file), api, (file, status, percent) => {
          setQueue(rows => rows.map(row => row.file === file ? {...row, status, percent} : row));
        });
      } else {
        // Saving files succeeded but acknowledging the batch may still need a retry.
        await api(`applications/${id}/uploads-complete`, {});
      }
      setCompleted(true);
    } catch(e) {
      setError(errorText(c, (e as Error).message));
    } finally {
      await reload();
      uploading.current = false;
      setBusy('');
    }
  }
  async function refresh() {
    setBusy('files');
    await reload();
    setBusy('');
  }
  return <div className={`${styles.manager} ${styles.embedded}`}>
    <UploadedFilesPanel disabled={!!busy} onRefresh={refresh}>
      {files.length ? <ul className={styles.files}>{files.map(file => <UploadedFileRow key={file.id} size={file.bytes} uploadedAt={file.created_at}
        state={file.state === 'ready' ? undefined : stateLabel(locale, file.state)}
        name={file.state === 'ready' ? <a href={`/api/pre-evaluation/files/${file.id}?applicationId=${encodeURIComponent(id)}`}
          aria-label={`${c.download}: ${file.name}`}>{file.name}</a> : file.name} />)}</ul> : <p>{t('empty')}</p>}
    </UploadedFilesPanel>
    {children}
    {canUpload && <UploadPanel accept=".pdf,.jpg,.jpeg,.png" disabled={!!busy} rules={<><span>PDF · JPG · PNG</span><span>{c.uploadLimits}</span><span>{c.uploadTotals}</span></>}
      onSelect={select} uploading={busy === 'upload'} onUpload={upload} canSubmit={queue.length > 0 && !completed} completed={completed ? queue.length : 0}>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {!!queue.length && <ul className={styles.queue}>{queue.map(row => <UploadQueueRow key={row.id} {...row}
        controls={<button type="button" disabled={!!busy} aria-label={t('removeNamed', {name:row.file.name})}
          onClick={() => setQueue(rows => rows.filter(item => item.id !== row.id))}>{t('remove')}</button>} />)}</ul>}
    </UploadPanel>}
  </div>;
}
