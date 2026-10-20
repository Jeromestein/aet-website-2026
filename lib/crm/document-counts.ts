import type { FilePage } from '@/lib/dropbox/shared';

/** Read every page through the same staff-authorized endpoint as the drawer. */
export async function previewDocumentCount(id: string, signal: AbortSignal): Promise<number> {
  const ids = new Set<string>();
  const cursors = new Set<string>();
  let cursor: string | null = null;
  do {
    signal.throwIfAborted();
    const query = new URLSearchParams({ source: 'preview', ...(cursor ? { cursor } : {}) });
    const response = await fetch(`/api/staff-records/formal/${encodeURIComponent(id)}/documents?${query}`, { cache: 'no-store', signal });
    if (!response.ok) throw new Error('Documents unavailable');
    const page: FilePage = await response.json();
    signal.throwIfAborted();
    page.files.forEach(file => ids.add(file.id));
    cursor = page.nextCursor;
    if (cursor) {
      if (cursors.has(cursor)) throw new Error('Document pagination did not advance');
      cursors.add(cursor);
    }
  } while (cursor);
  return ids.size;
}

/** Limit provider traffic to three visible records at a time. Failure is not zero. */
export async function loadPreviewDocumentCounts(ids: string[], signal: AbortSignal, onCount: (id: string, count: number | null) => void) {
  const pending = [...new Set(ids)];
  async function worker() {
    while (pending.length && !signal.aborted) {
      const id = pending.shift()!;
      let count: number | null;
      try { count = await previewDocumentCount(id, signal); }
      catch { count = null; }
      if (!signal.aborted) onCount(id, count);
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker));
}

export function documentCountLabel(count: number | null | undefined): string {
  if (count === undefined) return 'Checking documents…';
  if (count === null) return 'Documents unavailable';
  return `${count} supporting document${count === 1 ? '' : 's'}`;
}
