import 'server-only';
import { DocumentError } from './shared';

/** Dropbox selects Buffer or Blob based on runtime globals, including Next's
 * server environment. Preserve original bytes in either SDK response shape. */
export async function downloadBytes(result: unknown): Promise<Buffer> {
  const { fileBinary, fileBlob } = (result || {}) as { fileBinary?: unknown; fileBlob?: Blob };
  if (Buffer.isBuffer(fileBinary)) return fileBinary;
  if (fileBinary instanceof ArrayBuffer) return Buffer.from(fileBinary);
  if (ArrayBuffer.isView(fileBinary)) return Buffer.from(fileBinary.buffer, fileBinary.byteOffset, fileBinary.byteLength);
  if (fileBlob && typeof fileBlob.arrayBuffer === 'function') return Buffer.from(await fileBlob.arrayBuffer());
  throw new DocumentError('upstream', 502);
}
