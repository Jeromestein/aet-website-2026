# Refund ordering in the evaluation payment pilots

Both `lib/preeval/payments.ts` and `lib/evaluation-application/payments.ts`
use `lib/preeval/stripe-refunds.ts` for refund association and monotonic updates.
No database migration or environment-switch change is required.

## Behavior

- A refund with no stored PaymentIntent uses Stripe's Checkout Session list,
  filtered by that intent. The provider response must have exactly one session;
  its pilot, application reference, intent, currency, total and locally stored
  session association are checked before updating the payment.
- A provider-confirmed session belonging to a different pilot is ignored by this
  flow. An unresolved association, missing local row, or provider failure is an
  error, not a successful acknowledgement. No processed event is recorded on
  failure, so Stripe redelivery can retry it.
- Refund and checkout transactions lock the application before the payment.
  Event IDs are deduplicated in the existing payment event tables. Refund totals
  only increase; stale or repeated events cannot downgrade a full refund.
- Before marking a paid Checkout Session as paid locally, retrieve its
  PaymentIntent with `latest_charge` expanded and check the current refund total.
  This also runs before reconciliation-event deduplication: refunds do not change
  the session's paid status, so the same reconciliation key may reveal new refunds.
- Reconciliation checks open, paid and partially refunded payments (the existing
  most-recent-three limit remains). It can advance partial to full refund even if
  the refund webhook has not arrived. A stale provider snapshot cannot erase a
  refund already stored locally.
- A checkout already refunded at Stripe cannot enqueue a formal payment receipt
  or pass the pre-evaluation result publication gate. A formal refund clears the
  released report reference, preserving the existing report-access restriction.

The provider queries require Checkout Session read and PaymentIntent read access,
including the expanded Charge. Existing test-key validation remains unchanged.
The separate pre-evaluation cloud-preview opt-in belongs to concurrent work and
is not included in the F1-only commit. Provider lookup failures
fail closed: payment completion/publication waits for retry.

## Repeatable regression tests

`tests/payment-refund-ordering.test.ts` uses real PostgreSQL transactions with
mocked Stripe and result-email delivery. Formal receipt enqueueing uses the real
email queue code. It never reads `.env.local` or contacts a provider. The suite is
skipped without `AET_REFUND_TEST_DATABASE_URL`; the URL must point to localhost
and a database named `aet_refund_test`.

Provide a disposable local PostgreSQL database containing Supabase's standard
`anon` and `authenticated` roles. For example, the existing Supabase PostgreSQL
image can be used in a separate temporary container:

```sh
docker run --detach --rm --name aet-refund-f1-test \
  --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=refund_test_only \
  -p 127.0.0.1:53773:5432 \
  --entrypoint /usr/local/bin/docker-entrypoint.sh \
  public.ecr.aws/supabase/postgres:17.11.0.002 \
  postgres -c 'listen_addresses=*'
# Wait until this reports accepting connections.
docker exec aet-refund-f1-test pg_isready -U postgres
docker exec aet-refund-f1-test createdb -U postgres aet_refund_test
AET_REFUND_TEST_DATABASE_URL=postgresql://postgres:refund_test_only@127.0.0.1:53773/aet_refund_test \
  pnpm exec vitest run tests/payment-refund-ordering.test.ts
docker stop aet-refund-f1-test
```

Choose a free local port if 53773 is occupied. The test creates randomly named
schemas, applies the relevant repository migrations to those schemas, and drops
only those schemas during cleanup. Never substitute an existing business database.

Coverage includes both event orders, partial/full refunds, duplicate and stale
events, concurrent checkout/refunds, repeated reconciliation keys, provider and
association failures followed by retries, malformed associations, live-mode
rejection, receipt deduplication, and pre-evaluation publication prerequisites.

These are isolated database/provider-mock checks, not hosted Stripe acceptance.
Remaining external checks are test-mode provider permissions, actual webhook
redelivery and hosted timeout behavior. Unresolved events beyond Stripe's retry
window still require operator redelivery/reconciliation; no background refund
poller or permanent event inbox is introduced here.

## Verification on October 22, 2026

- Rechecked the combined `dev` working tree at HEAD `9068654`, including its
  uncommitted parallel changes. Source-file hashes stayed unchanged throughout
  verification.
- Full-project regression coverage passed: **48 test files, 706 tests**. The
  initial full run passed 676 tests; 30 information-request and upload-fencing
  tests could not initialize PostgreSQL because the macOS sandbox blocked shared
  memory creation. A narrowly authorized rerun of those two files outside the
  sandbox passed all 30 tests. No tests remain unverified in this combined count.
- All database suites were explicitly enabled, including the 79 F1
  refund/publication cases and the email-recovery, information-request and
  upload-fencing regressions. They used disposable databases and mocked external
  providers, including real transaction locking and rollback checks.
- Full-project `pnpm exec tsc --noEmit --incremental false` passed. The earlier
  generated `.next/dev/types/validator.ts` syntax errors were no longer present.
- `pnpm run check:i18n` passed with 586 complete, valid messages in each of
  English, Chinese and Spanish. `git diff --check` also passed.
- Temporary databases and the dedicated container were cleaned up. Verification
  did not modify source files, restart the owner's development server, run a
  production build, commit, push or deploy.
- **Online acceptance has not been performed.** These results do not establish
  hosted Stripe acceptance, real webhook redelivery, provider permissions or
  hosted timeout behavior. No real payments, emails or paid AI requests were made.

## Provider references

- [Stripe webhook event ordering and retries](https://docs.stripe.com/webhooks#event-ordering)
- [List Checkout Sessions by PaymentIntent](https://docs.stripe.com/api/checkout/sessions/list)
