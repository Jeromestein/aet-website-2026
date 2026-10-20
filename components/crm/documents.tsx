'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { formatFileSize, type FileEntry, type FilePage } from '@/lib/dropbox/shared';
import s from './crm.module.css';

export function CaseDocuments({ kind, id, source = 'live' }: { kind: string; id: string; source?: 'live' | 'preview' }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const supported = kind === 'formal' || kind === 'preeval';
  async function load(next?: string) {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setBusy(true); setError('');
    try {
      const query = new URLSearchParams({ source, ...(next ? { cursor: next } : {}) });
      const response = await fetch(`/api/staff-records/${kind}/${encodeURIComponent(id)}/documents?${query}`, { cache: 'no-store', signal: current.signal });
      if (!response.ok) {
        if ([401, 403, 404].includes(response.status)) { setFiles([]); setCursor(null); }
        throw new Error(response.status === 401 ? 'Please sign in again to view documents.' : response.status === 403 ? 'You do not have access to these documents.' : 'Documents could not be loaded. Please try again.');
      }
      const page: FilePage = await response.json();
      if (current.signal.aborted) return;
      setFiles(previous => next ? Array.from(new Map([...previous, ...page.files].map(file => [file.id, file])).values()) : page.files);
      setCursor(page.nextCursor);
    } catch (failure) { if (!current.signal.aborted) setError(failure instanceof Error ? failure.message : 'Documents could not be loaded.'); }
    finally { if (!current.signal.aborted) setBusy(false); }
  }
  useEffect(() => {
    setFiles([]); setCursor(null);
    if (supported) void load();
    return () => controller.current?.abort();
    // Reload only for a different record/source or an explicit refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id, source]);
  return <section className={s.detailContent}>
    <div className={s.documentHeading}><h3>Uploaded Files</h3>{supported && <button type="button" disabled={busy} onClick={() => void load()}><RotateCcw size={14}/>Refresh</button>}</div>
    {!supported ? <p className={s.helperText}>Document lookup is not available for imported orders.</p> : <>
      <p className={s.helperText}>Open files in Dropbox using your office account.</p>
      {error && <p className={s.formError} role="alert">{error}</p>}
      {busy && <p role="status">Loading documents…</p>}
      {!busy && !error && !files.length && <p>No files found in this application's folder.</p>}
      {!!files.length && <div className={s.documentTableWrap}><table className={s.documentTable}>
        <thead><tr><th scope="col">File Name</th><th scope="col">Size</th><th scope="col">Uploaded Time</th></tr></thead>
        <tbody>{files.map(file => <tr key={file.id}>
          <td><a title={file.name} href={`https://www.dropbox.com/preview${file.pathDisplay.split('/').map(encodeURIComponent).join('/')}`} target="_blank" rel="noopener noreferrer">{file.name}</a></td>
          <td>{formatFileSize(file.size)}</td>
          <td><time dateTime={file.uploadedAt}>{new Date(file.uploadedAt).toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</time></td>
        </tr>)}</tbody>
      </table></div>}
      {cursor && <button type="button" className={s.secondaryButton} disabled={busy} onClick={() => void load(cursor)}>Load more files</button>}
    </>}
  </section>;
}
