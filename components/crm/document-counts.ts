"use client";
import { useEffect, useState } from 'react';
import type { WorkspaceSnapshot } from '@/lib/crm/contracts';
import { loadPreviewDocumentCounts } from '@/lib/crm/document-counts';

export function usePreviewDocumentCounts(snapshot: WorkspaceSnapshot | null, enabled: boolean) {
  const [result, setResult] = useState<{ snapshot: WorkspaceSnapshot | null; counts: Record<string, number | null> }>({ snapshot: null, counts: {} });
  useEffect(() => {
    if (!enabled || !snapshot || snapshot.liveData) return;
    const controller = new AbortController();
    setResult({ snapshot, counts: {} });
    const ids = snapshot.rows.filter(row => row.kind === 'formal' && row.intakeVersion === 2).map(row => row.id);
    void loadPreviewDocumentCounts(ids, controller.signal, (id, count) => {
      setResult(previous => ({ snapshot, counts: { ...previous.counts, [id]: count } }));
    });
    return () => controller.abort();
    // A new snapshot follows navigation or manual refresh; tab focus never reloads files.
  }, [snapshot, enabled]);
  return result.snapshot === snapshot ? result.counts : {};
}
