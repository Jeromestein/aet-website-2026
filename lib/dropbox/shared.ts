export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const CHUNK_SIZE = 3 * 1024 * 1024;
export const HASH_BLOCK_SIZE = 4 * 1024 * 1024;
export const ACCEPTED_FILES = '.jpg,.jpeg,.png,.pdf,.doc,.docx';
export const offices = ['Miami', 'Los Angeles', 'San Francisco', 'Boston', 'New York'] as const;
export type Office = typeof offices[number];
export type ApplicationKind = 'evaluation' | 'pre-evaluation';
export type Account = 'AET_App' | 'AET_App_East';
export type FileEntry = { id: string; name: string; size: number; uploadedAt: string; pathDisplay: string };
export type FilePage = { files: FileEntry[]; nextCursor: string | null };
export type ErrorCode = 'invalid' | 'access' | 'expired' | 'unavailable' | 'tooLarge' | 'fileType' | 'sequence' | 'upstream' | 'uncertain' | 'integrity' | 'readOnly';
export class DocumentError extends Error {
  constructor(public code: ErrorCode, public status = 400) { super(code); }
}
export function accountForOffice(office: string): Account {
  if (!offices.includes(office as Office)) throw new DocumentError('invalid');
  return office === 'Boston' || office === 'New York' ? 'AET_App_East' : 'AET_App';
}
export function safeSegment(value: unknown): string {
  if (typeof value !== 'string' || !value || value === '.' || value === '..' ||
    /[/\\\u0000-\u001f\u007f]/.test(value) || /[. ]$/.test(value) ||
    new TextEncoder().encode(value).length > 255) throw new DocumentError('invalid');
  return value;
}
export function validateFile(name: string, size: number, mime: string) {
  safeSegment(name);
  if (!Number.isSafeInteger(size) || size <= 0) throw new DocumentError('invalid');
  if (size > MAX_FILE_SIZE) throw new DocumentError('tooLarge', 413);
  const extension = name.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  if (!extension || !types[extension] || (mime && mime !== 'application/octet-stream' && mime !== types[extension])) {
    throw new DocumentError('fileType', 415);
  }
}
