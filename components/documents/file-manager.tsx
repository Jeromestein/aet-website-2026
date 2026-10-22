'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CircleCheck, UploadCloud, Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CHUNK_SIZE, ACCEPTED_FILES, formatFileSize, DocumentError, validateFile, type ErrorCode, type FileEntry, type FilePage } from '@/lib/dropbox/shared';
import styles from './documents.module.css';
import { contentHash, base64 } from '@/lib/dropbox/upload-client';

type Status = 'pending' | 'hashing' | 'uploading' | 'saving' | 'success' | 'failed' | 'cancelled';
type QueueFile = { id: string; file: File; status: Status; percent: number; error?: ErrorCode; archiveFailed?: boolean };
class RequestError extends Error {
  constructor(public code: ErrorCode, public status: number, public retryAfter = 1) { super(code); }
}
async function request<T>(url: string, init: RequestInit, token?: string): Promise<T> {
  const response = await fetch(url, {
    ...init, cache: 'no-store',
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new RequestError(data.error ?? 'upstream', response.status, Math.min(300, Number(response.headers.get('Retry-After')) || 1));
  return data;
}
function errorCode(error: unknown): ErrorCode {
  return error instanceof RequestError || error instanceof DocumentError ? error.code : 'upstream';
}
function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

/** showPreviewLink is for a trusted staff host, not a customer-controlled URL flag. */
export function FileManager({ token, canUpload = true, showPreviewLink = false, onBusyChange, embedded = false }: { embedded?: boolean; token: string; canUpload?: boolean; showPreviewLink?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const t = useTranslations('documents');
  const locale = useLocale();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState<ErrorCode | null>(null);
  const [queue, setQueue] = useState<QueueFile[]>([]);
  const [selectionError, setSelectionError] = useState<ErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [batchError, setBatchError] = useState<ErrorCode | null>(null);
  const [dragging, setDragging] = useState(false);
  const cancelled = useRef(new Set<string>());
  const active = useRef<AbortController | null>(null);
  const listController = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const completionAudio = useRef<AudioContext | null>(null);

  async function refresh(cursor?: string) {
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    setListBusy(true); setListError(null);
    try {
      const page = await request<FilePage>(`/api/dropbox/viewFilesListFolder${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { signal: controller.signal }, token);
      if (controller.signal.aborted) return;
      setFiles(previous => cursor ? Array.from(new Map([...previous, ...page.files].map(file => [file.id, file])).values()) : page.files);
      setNextCursor(page.nextCursor);
    } catch (error) { if (!controller.signal.aborted) setListError(errorCode(error)); }
    finally { if (!controller.signal.aborted) setListBusy(false); }
  }
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; listController.current?.abort(); active.current?.abort(); void completionAudio.current?.close().catch(() => {}); };
    // A token change remounts this manager through its parent's key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function select(selected: FileList | null) {
    if (busy || !selected) return;
    try {
      const incoming = Array.from(selected);
      incoming.forEach(file => validateFile(file.name, file.size, file.type));
      if (incoming.length + queue.length > 20) throw new DocumentError('invalid');
      setSelectionError(null);
      setQueue(previous => [...previous, ...incoming.map(file => ({ id: crypto.randomUUID(), file, status: 'pending' as const, percent: 0 }))]);
    } catch (error) { setSelectionError(errorCode(error)); }
    if (input.current) input.current.value = '';
  }
  function update(id: string, patch: Partial<QueueFile>) {
    setQueue(previous => previous.map(row => row.id === id ? { ...row, ...patch } : row));
  }
  async function upload() {
    if (busy || !canUpload) return;
    // Unlock audio during the upload click; sound failure must never block saving.
    try {
      completionAudio.current ??= new AudioContext();
      void completionAudio.current.resume().catch(() => {});
    } catch { /* Audio is optional in browsers that block or do not support it. */ }
    const pending = queue.filter(item => item.status === 'pending' || item.status === 'failed' || item.status === 'cancelled');
    let saved = 0;
    setBatchError(null);
    setBusy(true); onBusyChange?.(true);
    const batch = (action: string) => request('/api/dropbox/upload-batch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    }, token);
    try { if (pending.length) await batch('start'); }
    catch (error) {
      for (const row of pending) update(row.id, { status: 'failed', error: errorCode(error) });
      setBusy(false); onBusyChange?.(false); return;
    }
    cancelled.current.clear();
    for (const row of pending) {
      if (!mounted.current) break;
      if (cancelled.current.has(row.id)) continue;
      const controller = new AbortController();
      active.current = controller;
      let uploadKey: string | undefined;
      let committing = false;
      const post = <T,>(body: object) => request<T>('/api/dropbox/chunked-upload', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal,
      }, token);
      update(row.id, { status: 'hashing', percent: 0, error: undefined, archiveFailed: false });
      try {
        let result: { archive: string };
        if (row.file.size <= CHUNK_SIZE) {
          controller.signal.throwIfAborted();
          update(row.id, { status: 'saving' });
          committing = true;
          const form = new FormData(); form.append('file', row.file);
          // Commit requests are deliberately not auto-retried: a lost response
          // can still mean the file was saved, especially with autorename.
          result = await request('/api/dropbox/upload', { method: 'POST', body: form, signal: controller.signal }, token);
        } else {
          const hash = await contentHash(row.file, controller.signal);
          const started = await post<{ uploadKey: string }>({
            action: 'start', fileName: row.file.name, fileSize: row.file.size, mime: row.file.type, contentHash: hash,
          });
          uploadKey = started.uploadKey;
          for (let offset = 0; offset < row.file.size; offset += CHUNK_SIZE) {
            controller.signal.throwIfAborted();
            update(row.id, { status: 'uploading' });
            const chunkData = await base64(row.file.slice(offset, offset + CHUNK_SIZE));
            const body = { action: 'append', uploadKey, chunkIndex: Math.floor(offset / CHUNK_SIZE), chunkData };
            let appended: { uploadKey: string; offset: number } | undefined;
            for (let attempt = 0; attempt < 3; attempt++) {
              controller.signal.throwIfAborted();
              try { appended = await post(body); break; }
              catch (error) {
                if (controller.signal.aborted || attempt === 2 || error instanceof RequestError && error.status < 500 && error.status !== 429) throw error;
                await delay((error instanceof RequestError ? error.retryAfter : 1) * 1000 * (attempt + 1), controller.signal);
              }
            }
            if (!appended) throw new Error('append');
            uploadKey = appended.uploadKey;
            update(row.id, { percent: Math.min(99, Math.round(appended.offset / row.file.size * 100)) });
          }
          controller.signal.throwIfAborted();
          update(row.id, { status: 'saving' });
          committing = true;
          result = await post({ action: 'finish', uploadKey });
          uploadKey = undefined;
        }
        update(row.id, { status: 'success', percent: 100, archiveFailed: result.archive === 'failed' });
        saved++;
      } catch (error) {
        update(row.id, {
          status: controller.signal.aborted ? 'cancelled' : 'failed',
          error: controller.signal.aborted ? undefined
            : committing && !(error instanceof RequestError) ? 'uncertain' : errorCode(error),
        });
        if (uploadKey && !committing) {
          await request('/api/dropbox/chunked-upload', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cancel', uploadKey }), signal: AbortSignal.timeout(10000),
          }, token).catch(() => {});
        }
      }
    }
    if (saved === pending.length) {
      try { await batch('complete'); }
      catch (error) { setBatchError(errorCode(error)); saved = 0; }
    }
    active.current = null;
    if (mounted.current) {
      setBusy(false); onBusyChange?.(false);
      if (saved > 0 && saved === pending.length) {
        const audio = completionAudio.current;
        if (audio?.state === 'running') {
          try {
            const start = audio.currentTime;
            for (const [frequency, volume] of [[1046.5, .12], [1568, .04]]) {
              const tone = audio.createOscillator(), gain = audio.createGain();
              tone.frequency.value = frequency;
              gain.gain.setValueAtTime(0, start);
              gain.gain.linearRampToValueAtTime(volume, start + .012);
              gain.gain.exponentialRampToValueAtTime(.001, start + .65);
              tone.connect(gain); gain.connect(audio.destination);
              tone.start(start); tone.stop(start + .7);
              tone.onended = () => { tone.disconnect(); gain.disconnect(); };
            }
          } catch { /* Keep the visual confirmation when audio is unavailable. */ }
        }
      }
      await refresh();
    }
  }
  function cancel(row: QueueFile) {
    cancelled.current.add(row.id);
    if (row.status === 'hashing' || row.status === 'uploading') active.current?.abort();
    update(row.id, { status: 'cancelled' });
  }
  const allSaved = !batchError && queue.length > 0 && queue.every(row => row.status === 'success');
  const formatSize = (size: number) => formatFileSize(size, locale);
  return <div className={embedded ? `${styles.manager} ${styles.embedded}` : styles.manager} aria-busy={busy}>
    <section aria-labelledby="uploaded-title" className={styles.panel}>
      <div className={styles.headingRow}><h2 id="uploaded-title">{t('files')}</h2>
        <button type="button" onClick={() => void refresh()} disabled={listBusy}>{t('refresh')}</button></div>
      {listBusy && <p role="status">{t('loading')}</p>}
      {listError && <p className={styles.error} role="alert">{t(`errors.${listError}`)}</p>}
      {!listBusy && !listError && !files.length && <p>{t('empty')}</p>}
      {!!files.length && <ul className={styles.files}>{files.map(file => <li key={file.id}>
        <div className={`${styles.fileName} ${styles.savedName}`}><CircleCheck size={19} aria-hidden="true"/>{showPreviewLink && file.pathDisplay
          ? <a href={`https://www.dropbox.com/preview${file.pathDisplay.split('/').map(encodeURIComponent).join('/')}`} target="_blank" rel="noopener noreferrer">{file.name}</a>
          : <strong>{file.name}</strong>}</div>
        <div className={styles.fileDetails}><span>{formatSize(file.size)}</span>
          <time dateTime={file.uploadedAt}>{new Date(file.uploadedAt).toLocaleString(locale)}</time></div>
      </li>)}</ul>}
      {nextCursor && <button type="button" disabled={listBusy} onClick={() => void refresh(nextCursor)}>{t('more')}</button>}
    </section>
    {canUpload ? <section className={styles.panel} aria-labelledby="upload-title">
      <h2 id="upload-title">{t('uploadTitle')}</h2>
      <div id="file-rules" className={styles.rules}><span>PDF · JPG · PNG · DOC(X)</span><span>{t('limits')}</span><span>{t('chunks')}</span></div>
      <div className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
        onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files); }}>
        <UploadCloud className={styles.uploadIcon} size={32} aria-hidden="true"/>
        <p>{t('drop')}</p>
        <button type="button" className={styles.chooseButton} disabled={busy} onClick={() => input.current?.click()}>{t('choose')}</button>
        <input hidden id="document-files" ref={input} type="file" multiple accept={ACCEPTED_FILES} disabled={busy}
          aria-describedby="file-rules" aria-label={t('choose')} onChange={event => select(event.target.files)} />
      </div>
      <aside className={styles.uploadHelp}>
        <Info size={17} aria-hidden="true"/>
        <div><p>{t('retryHelp')}</p><div className={styles.contacts}>
          <span><b>{t('westOffices')}</b><a href="mailto:ca2@aet21.com">ca2@aet21.com</a></span>
          <span><b>{t('otherOffices')}</b><a href="mailto:info@americantranslationservice.com">info@americantranslationservice.com</a></span>
        </div></div>
      </aside>
      {allSaved && <div className={styles.successBanner} role="status"><CircleCheck size={26} aria-hidden="true"/><div><strong>{t('complete')}</strong><p>{t('completeDetail', {count: queue.length})}</p></div></div>}
      {batchError && <p className={styles.error} role="alert">{t(`errors.${batchError}`)}</p>}
      {selectionError && <p className={styles.error} role="alert">{t(`errors.${selectionError}`)}</p>}
      {!!queue.length && <ul className={styles.queue}>{queue.map(row => <li key={row.id} className={row.status === 'success' ? styles.successRow : undefined}>
        <div className={styles.headingRow}><strong className={styles.fileName}>{row.file.name}</strong>
          {!busy ? <button type="button" onClick={() => setQueue(previous => previous.filter(item => item.id !== row.id))} aria-label={t('removeNamed', { name: row.file.name })}>{t('remove')}</button>
            : ['pending', 'hashing', 'uploading'].includes(row.status) && <button type="button" onClick={() => cancel(row)} aria-label={t('cancelNamed', { name: row.file.name })}>{t('cancel')}</button>}</div>
        <div className={styles.fileDetails}><span>{formatSize(row.file.size)}</span><span role="status" className={row.status === 'success' ? styles.successBadge : undefined}>{row.status === 'success' && <Check size={15} aria-hidden="true"/>}{t(`status.${row.status}`)} {row.percent > 0 && `${row.percent}%`}</span></div>
        <progress value={row.percent} max={100} aria-label={t('progressNamed', { name: row.file.name })} />
        {row.error && <p className={styles.error} role="alert">{t(`errors.${row.error}`)}</p>}
        {row.archiveFailed && <p className={styles.warning} role="status">{t('archiveFailed')}</p>}
      </li>)}</ul>}
      <button type="button" className={`${styles.primary} ${allSaved ? styles.completeButton : ''}`} disabled={busy || (!batchError && !queue.some(row => row.status !== 'success'))} onClick={() => void upload()}>
        {allSaved && <Check size={19} aria-hidden="true"/>}{busy ? t('uploading') : allSaved ? t('complete') : t('upload')}
      </button>
      {!allSaved && <p className={styles.note}>{t('keepOpen')}</p>}
    </section> : <p className={styles.panel} role="status">{t('errors.readOnly')}</p>}
  </div>;
}

export function DocumentsAccess({ enabled }: { enabled: boolean }) {
  const t = useTranslations('documents');
  const [access, setAccess] = useState<{ token: string; office: string; canUpload: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      setAccess(await request('/api/dropbox/access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: form.get('kind'), applicationId: String(form.get('applicationId')).trim(), email: String(form.get('email')).trim() }),
      }));
    } catch (failure) { setError(errorCode(failure)); }
    finally { setBusy(false); }
  }
  if (!enabled) return <p className={styles.panel} role="status">{t('errors.unavailable')}</p>;
  if (access) return <>
    <p className={styles.context}>{t('office', { office: access.office })}</p>
    <FileManager token={access.token} canUpload={access.canUpload} key={access.token} onBusyChange={setUploading} />
    <button type="button" className={styles.reset} disabled={uploading} onClick={() => { setAccess(null); setError(null); }}>{t('otherApplication')}</button>
  </>;
  return <form onSubmit={unlock} className={styles.panel}>
    <h2>{t('accessTitle')}</h2><p>{t('intro')}</p>
    <div className={styles.fields}>
      <label htmlFor="application-kind">{t('kind')}<select id="application-kind" name="kind" disabled={busy}>
        <option value="evaluation">{t('evaluation')}</option><option value="pre-evaluation">{t('preEvaluation')}</option>
      </select></label>
      <label htmlFor="application-id">{t('applicationId')}<input id="application-id" name="applicationId" type="text" required maxLength={36}
        pattern="[A-Fa-f0-9]{8}(-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}" autoComplete="off" spellCheck={false} disabled={busy} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>
      <label htmlFor="application-email">{t('email')}<input id="application-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /></label>
    </div>
    {error && <p className={styles.error} role="alert">{t(`errors.${error}`)}</p>}
    <button type="submit" className={styles.primary} disabled={busy}>{busy ? t('loading') : t('open')}</button>
    <p className={styles.note}>{t('privacy')}</p>
  </form>;
}
