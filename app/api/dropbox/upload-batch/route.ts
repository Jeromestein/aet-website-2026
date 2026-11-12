import { applicationUnavailableResponse } from '@/lib/application-release';
import { workflowRows } from "../../../../lib/application-core/converged-store";
import { contextFromRequest, requireUploadAllowed } from '@/lib/dropbox/server';
import { handle, json, jsonBody, requireSameOrigin } from '@/lib/dropbox/http';
import { DocumentError } from '@/lib/dropbox/shared';
import { completeUploads, pauseForUpload } from '@/lib/preeval/ai-jobs';
import { scheduleAI } from '@/lib/preeval/ai-scheduler';
import { db, table } from '@/lib/preeval/db';
export const runtime = 'nodejs';
export const maxDuration = 300;
export async function POST(request: Request) {
  const unavailable = applicationUnavailableResponse(); if (unavailable) return unavailable;

  return handle(async () => {
    requireSameOrigin(request);
    const { data: context } = contextFromRequest(request);
    requireUploadAllowed(context);
    const data = await jsonBody(request, 1024);
    if (!['start','complete'].includes(String(data.action))) throw new DocumentError('invalid');
    if (context.kind === 'pre-evaluation') {
      const [app] = await workflowRows(db(), context.id, false);
      if (app) {
        if (data.action === 'start') await pauseForUpload(context.id);
        else { await completeUploads(context.id); await scheduleAI(context.id); }
      }
    }
    return json({ success: true });
  });
}
