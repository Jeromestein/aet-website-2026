import { createHash } from "node:crypto";

export type OutgoingEmail = {
  id: string;
  recipient: string;
  from: string;
  subject: string;
  html: string;
};
export type EmailTransport = (mail: OutgoingEmail) => Promise<string>;

export class EmailReviewRequired extends Error {}

/** Keep a digest, not a copy of the message, to detect changed retries. */
export function deliveryHash(mail: OutgoingEmail, previous?: string | null) {
  const digest = createHash("sha256")
    .update(JSON.stringify([mail.from, mail.recipient, mail.subject, mail.html]))
    .digest("hex");
  if (previous && previous !== digest) throw new EmailReviewRequired("email_content_changed");
  return digest;
}
