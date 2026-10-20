import { afterEach, describe, expect, it, vi } from 'vitest';
import { documentCountLabel, loadPreviewDocumentCounts, previewDocumentCount } from '@/lib/crm/document-counts';
const response = (ids: string[], nextCursor: string | null = null) => Response.json({ files: ids.map(id => ({ id })), nextCursor });
afterEach(() => vi.unstubAllGlobals());
describe('preview document counts', () => {
  it('counts unique Dropbox files across every authorized page', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response(['a', 'b'], 'next/+')).mockResolvedValueOnce(response(['b', 'c']));
    vi.stubGlobal('fetch', fetch);
    const signal = new AbortController().signal;
    expect(await previewDocumentCount('test-id', signal)).toBe(3);
    expect(fetch.mock.calls.map(call => call[0])).toEqual([
      '/api/staff-records/formal/test-id/documents?source=preview',
      '/api/staff-records/formal/test-id/documents?source=preview&cursor=next%2F%2B',
    ]);
    expect(fetch.mock.calls[0][1]).toEqual({ cache: 'no-store', signal });
  });
  it('distinguishes empty folders from denied or unavailable folders', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response([])).mockResolvedValueOnce(new Response(null, { status: 403 })).mockResolvedValueOnce(new Response(null, { status: 503 })));
    const result = vi.fn();
    await loadPreviewDocumentCounts(['empty', 'denied', 'offline'], new AbortController().signal, result);
    expect(result).toHaveBeenCalledWith('empty', 0);
    expect(result).toHaveBeenCalledWith('denied', null);
    expect(result).toHaveBeenCalledWith('offline', null);
    expect(documentCountLabel(undefined)).toBe('Checking documents…');
    expect(documentCountLabel(null)).toBe('Documents unavailable');
    expect(documentCountLabel(0)).toBe('0 supporting documents');
    expect(documentCountLabel(1)).toBe('1 supporting document');
  });
  it('does not report a partial count when a later page fails or repeats', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(response(['a'], 'next')).mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetch);
    await expect(previewDocumentCount('test', new AbortController().signal)).rejects.toThrow();
    fetch.mockImplementation(async () => response(['a'], 'repeated'));
    await expect(previewDocumentCount('test', new AbortController().signal)).rejects.toThrow('pagination');
  });
  it('limits concurrency and avoids duplicate record requests', async () => {
    let active = 0, peak = 0;
    const fetch = vi.fn(async () => {
      peak = Math.max(peak, ++active);
      await new Promise(resolve => setTimeout(resolve, 1));
      active--;
      return response([]);
    });
    vi.stubGlobal('fetch', fetch);
    await loadPreviewDocumentCounts(['a', 'b', 'c', 'd', 'e', 'a'], new AbortController().signal, vi.fn());
    expect(peak).toBe(3);
    expect(fetch).toHaveBeenCalledTimes(5);
  });
  it('stops stale counts and queued requests when navigation aborts', async () => {
    const controller = new AbortController(), result = vi.fn();
    const fetch = vi.fn(async () => { controller.abort(); return response(['a']); });
    vi.stubGlobal('fetch', fetch);
    await loadPreviewDocumentCounts(['a', 'b', 'c', 'd'], controller.signal, result);
    expect(result).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
