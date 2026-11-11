import { z } from 'zod';
import { configuration } from './config';

/** Only persisted application data may be supplied by callers. */
export function applicationRecipient(storedEmail: string) {
  const config = configuration();
  if (!config.production) return config.recipient;
  return z.email().parse(storedEmail.trim().toLowerCase());
}
