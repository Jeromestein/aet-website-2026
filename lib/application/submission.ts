import { z } from 'zod';
import { DRAFT_KEY } from './model';

export type ConnectedService = 'evaluation' | 'pre-evaluation';
export type SubmittedApplication = { id: string; service: ConnectedService };
export type SubmissionAttempt = { requestId: string; payload: string; result?: SubmittedApplication };
export const submissionKey = (service: ConnectedService) => DRAFT_KEY + '-submission-' + service;

export function restoreSubmissionAttempt(raw: string | null, service: ConnectedService): SubmissionAttempt | null {
  try {
    const value = JSON.parse(raw || 'null');
    if (!z.uuid().safeParse(value?.requestId).success || typeof value.payload !== 'string' || JSON.parse(value.payload)?.data?.service !== service) return null;
    return {requestId:value.requestId, payload:value.payload,
      ...(z.uuid().safeParse(value.result?.id).success ? {result:{id:value.result.id, service}} : {})};
  } catch { return null; }
}
