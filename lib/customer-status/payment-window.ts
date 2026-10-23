/** The legacy payment window starts at submission, never at draft creation. */
export const PAYMENT_DEADLINE_HOURS = 48;
export function paymentDeadline(submittedAt: string): string | null {
  const submitted = Date.parse(submittedAt);
  if (!Number.isFinite(submitted)) return null;
  const deadline = new Date(submitted + PAYMENT_DEADLINE_HOURS * 3600000);
  return Number.isFinite(deadline.getTime()) ? deadline.toISOString() : null;
}
export function paymentWindow(record: {source: string; payment: string; deadline: string | null}, now: number) {
  if (record.source !== 'live') return 'none';
  if (record.payment === 'expired') return 'expired';
  if (record.payment !== 'pending' || !record.deadline) return 'none';
  return Date.parse(record.deadline) <= now ? 'expired' : 'pending';
}
