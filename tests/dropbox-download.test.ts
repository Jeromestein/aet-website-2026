import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { downloadBytes } from '../lib/dropbox/download';
const bytes = Buffer.from([0, 255, 128, 65, 10]);
describe('Dropbox download response compatibility', () => {
  it('preserves Node Buffer bytes', async () => {
    expect(await downloadBytes({ fileBinary: bytes })).toEqual(bytes);
  });
  it('preserves Next Blob bytes', async () => {
    expect(await downloadBytes({ fileBlob: new Blob([bytes]) })).toEqual(bytes);
  });
  it('handles ArrayBuffer and sliced typed arrays without adding surrounding bytes', async () => {
    expect(await downloadBytes({ fileBinary: Uint8Array.from(bytes).buffer })).toEqual(bytes);
    const wrapped = new Uint8Array([9, ...bytes, 9]);
    expect(await downloadBytes({ fileBinary: wrapped.subarray(1, -1) })).toEqual(bytes);
  });
  it.each([undefined, {}, { fileBinary: 'corrupted string' }, { fileBlob: {} }])('rejects a response without supported binary content', async result => {
    await expect(downloadBytes(result)).rejects.toMatchObject({ code: 'upstream', status: 502 });
  });
});
