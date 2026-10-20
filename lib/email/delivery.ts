import { createHash } from "node:crypto";

export type OutgoingEmail = {
  id: string;
  recipient: string;
  from: string;
  cc?: string[];
  subject: string;
  html: string;
};
export type EmailTransport = (mail: OutgoingEmail) => Promise<string>;

export class EmailReviewRequired extends Error {}

/** Keep a digest, not a copy of the message, to detect changed retries. */
export function deliveryHash(mail: OutgoingEmail, previous?: string | null) {
  // Preserve existing no-CC hashes while detecting any change in copied recipients.
  const payload: unknown[] = [mail.from, mail.recipient, mail.subject, mail.html];
  if (mail.cc?.length) payload.push(mail.cc);
  const digest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  if (previous && previous !== digest) throw new EmailReviewRequired("email_content_changed");
  return digest;
}
