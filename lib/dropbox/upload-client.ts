import { HASH_BLOCK_SIZE } from './shared';

export async function contentHash(file: File, signal: AbortSignal) {
  const hashes: Uint8Array[] = [];
  for (let offset = 0; offset < file.size; offset += HASH_BLOCK_SIZE) {
    signal.throwIfAborted();
    hashes.push(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.slice(offset, offset + HASH_BLOCK_SIZE).arrayBuffer())));
  }
  signal.throwIfAborted();
  const joined = new Uint8Array(hashes.length * 32);
  hashes.forEach((hash, index) => joined.set(hash, index * 32));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', joined)), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function base64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
