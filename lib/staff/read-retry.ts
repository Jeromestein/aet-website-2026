import {setTimeout as delay} from 'node:timers/promises';
import {AppError} from '../preeval/domain';

const transientCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'CONNECT_TIMEOUT', 'CONNECTION_CLOSED']);
/** Retry only an idempotent membership read; never reuse stale permissions. */
export async function readStaffMembership<T>(read: () => PromiseLike<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await read(); }
    catch (error) {
      const code = (error as {code?: string})?.code;
      if (!code || !transientCodes.has(code)) throw error;
      if (attempt === 1) throw new AppError('service_unavailable', 503);
      await delay(250);
    }
  }
}
