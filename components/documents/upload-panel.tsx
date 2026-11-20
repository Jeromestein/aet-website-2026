'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { Check, CircleCheck, FileText, Info, UploadCloud } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatFileSize } from '@/lib/dropbox/shared';
import styles from './documents.module.css';

export function UploadedFilesPanel({ children, onRefresh, disabled }: {
  children: ReactNode; onRefresh: () => void; disabled: boolean;
}) {
  const t = useTranslations('documents');
  const titleId = useId();
  return <section aria-labelledby={titleId} className={styles.panel}>
    <div className={styles.headingRow}><h2 id={titleId}>{t('files')}</h2>
      <button type="button" onClick={onRefresh} disabled={disabled}>{t('refresh')}</button></div>
    {children}
  </section>;
}

export function UploadedFileRow({ name, size, uploadedAt, state }: {
  name: ReactNode; size: number; uploadedAt?: string; state?: string;
}) {
  const locale = useLocale();
  return <li>
    <div className={`${styles.fileName} ${styles.listName}`}>
      {state ? <FileText size={19} aria-hidden="true"/> : <CircleCheck className={styles.savedIcon} size={19} aria-hidden="true"/>}
      <strong>{name}</strong>
    </div>
    <div className={styles.fileDetails}><span>{formatFileSize(size, locale)}</span>
      {uploadedAt && <time dateTime={uploadedAt}>{new Date(uploadedAt).toLocaleString(locale)}</time>}
      {state && <span>{state}</span>}
    </div>
  </li>;
}

export function FileDropzone({ accept, disabled, onSelect, rules }: {
  accept: string; disabled: boolean; onSelect: (files: FileList) => void; rules: ReactNode;
}) {
  const t = useTranslations('documents');
  const input = useRef<HTMLInputElement>(null);
  const rulesId = useId();
  const [dragging, setDragging] = useState(false);
  return <>
    <div id={rulesId} className={styles.rules}>{rules}</div>
    <div className={`${styles.dropzone} ${dragging && !disabled ? styles.dragging : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(!disabled); }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) onSelect(event.dataTransfer.files); }}>
      <UploadCloud className={styles.uploadIcon} size={32} aria-hidden="true"/>
      <p>{t('drop')}</p>
      <button type="button" className={styles.chooseButton} disabled={disabled} onClick={() => input.current?.click()}>{t('choose')}</button>
      <input hidden ref={input} type="file" multiple accept={accept} disabled={disabled}
        aria-describedby={rulesId} aria-label={t('choose')} onChange={event => {
          if (event.target.files?.length) onSelect(event.target.files);
          event.target.value = '';
        }} />
    </div>
  </>;
}

type UploadPanelProps = {
  accept: string; disabled: boolean; rules: ReactNode; onSelect: (files: FileList) => void;
  children: ReactNode; canSubmit: boolean; uploading: boolean; onUpload: () => void; completed: number;
};

export function UploadPanel({ accept, disabled, rules, onSelect, children, canSubmit, uploading, onUpload, completed }: UploadPanelProps) {
  const t = useTranslations('documents');
  const titleId = useId();
  return <section className={styles.panel} aria-labelledby={titleId}>
    <h2 id={titleId}>{t('uploadTitle')}</h2>
    <FileDropzone {...{accept, disabled, rules, onSelect}} />
    <aside className={styles.uploadHelp}>
      <Info size={17} aria-hidden="true"/>
      <div><p>{t('retryHelp')}</p><div className={styles.contacts}>
        <span><b>{t('westOffices')}</b><a href="mailto:ca2@aet21.com">ca2@aet21.com</a></span>
        <span><b>{t('otherOffices')}</b><a href="mailto:info@americantranslationservice.com">info@americantranslationservice.com</a></span>
      </div></div>
    </aside>
    {completed > 0 && <div className={styles.successBanner} role="status"><CircleCheck size={26} aria-hidden="true"/>
      <div><strong>{t('complete')}</strong><p>{t('completeDetail', {count:completed})}</p></div></div>}
    {children}
    <button type="button" className={`${styles.primary} ${completed ? styles.completeButton : ''}`} disabled={disabled || !canSubmit} onClick={onUpload}>
      {completed > 0 && <Check size={19} aria-hidden="true"/>}{uploading ? t('uploading') : completed ? t('complete') : t('upload')}
    </button>
    {!completed && <p className={styles.note}>{t('keepOpen')}</p>}
  </section>;
}

type QueueStatus = 'pending' | 'hashing' | 'uploading' | 'saving' | 'success' | 'failed' | 'cancelled';

export function UploadQueueRow({ file, status, percent, controls, children }: {
  file: File; status: QueueStatus; percent: number; controls: ReactNode; children?: ReactNode;
}) {
  const t = useTranslations('documents');
  const locale = useLocale();
  return <li className={status === 'success' ? styles.successRow : undefined}>
    <div className={styles.headingRow}><strong className={styles.fileName}>{file.name}</strong>{controls}</div>
    <div className={styles.fileDetails}><span>{formatFileSize(file.size, locale)}</span>
      <span role="status" className={status === 'success' ? styles.successBadge : undefined}>
        {status === 'success' && <Check size={15} aria-hidden="true"/>}{t(`status.${status}`)} {percent > 0 && `${percent}%`}
      </span>
    </div>
    <progress value={percent} max={100} aria-label={t('progressNamed', {name:file.name})} />
    {children}
  </li>;
}
