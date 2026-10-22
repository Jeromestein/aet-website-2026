import 'server-only';
import { after } from 'next/server';
import { dueAIJobs } from './ai-jobs';
import { processAI } from './ai';
import { deliverApplicationEmails } from './email';

export function automaticAIEnabled() {
  return process.env.PREEVAL_AI_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY?.trim());
}

/** Call only after application authorization or successful creation. A saved job
 * survives dispatch failure; no detached promises or persistent polling loop. */
export async function scheduleAI(applicationId: string) {
  if (!automaticAIEnabled()) return;
  try {
    if (!(await dueAIJobs(1, applicationId)).length) return;
    after(async () => {
      try { await processAI(applicationId); await deliverApplicationEmails(applicationId); }
      catch { console.error('Pre-evaluation AI dispatch failed; persisted job remains recoverable.'); }
    });
  } catch {
    // Scheduling must not turn a successful save into a failed submission.
    console.error('Pre-evaluation AI scheduling failed; persisted job remains recoverable.');
  }
}

/** One daily invocation makes at most three independent attempts. It never sleeps
 * through backoff, resets exhausted jobs, or drains an unbounded queue. */
export async function recoverAIJobs() {
  if (!automaticAIEnabled()) return { attempted: 0, dispatchErrors: 0 };
  const ids = await dueAIJobs(3);
  const results = await Promise.allSettled(ids.map(async id => {
    const processed = await processAI(id);
    await deliverApplicationEmails(id);
    return processed;
  }));
  return {
    attempted: results.filter(result => result.status === 'fulfilled' && result.value).length,
    dispatchErrors: results.filter(result => result.status === 'rejected').length,
  };
}
