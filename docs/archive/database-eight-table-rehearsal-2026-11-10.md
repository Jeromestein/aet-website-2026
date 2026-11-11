# Eight-table pre-evaluation: payment simplification acceptance

Date: November 10, 2026. Branch: `dev`, based on `a3f8117` plus this change.
Scope: disposable local PostgreSQL only. Existing hosted Stripe webhook delivery,
Preview data/configuration and Production remain unchanged. No commit, push or
deployment is part of this verification.

## Accepted launch scope

Remove `aet_payment_events`; retain five business tables plus `aet_ai_runs`,
`aet_audit` and `aet_rate_limits`. Keep the existing Stripe webhook, signature
verification, account/mode/application/amount checks and basic duplicate protection.
Stripe is the event-history viewer. No replacement event table, last-event field,
unbounded event-ID array or additional payment columns are introduced.

Under the existing application/payment row locks, update payment state only when
it actually changes. Replayed or concurrent success notifications preserve payment
and release timestamps and do not create duplicate payment/business-audit rows.
Audit records actual state changes, not each callback receipt. Refund totals remain
monotonic; stale success, smaller refund and expiry cannot restore access after a
refund. Accepted success callbacks still invoke the existing publication path when
payment is already recorded, allowing recovery after a failed result release.
Already released results no longer rewrite service `updated_at` on every replay.
Existing service notification state prevents a second result mail.

The [checklist](../migration-checklist.md) defers Resend delivery/bounce/complaint
webhooks, a full mail-history UI, payment-event investigation/replay tooling,
scheduled reconciliation/retries, operational alerts and broader dispute/provider
exception workflows. These are TODOs, not additional launch work. Existing basic
correctness and recovery behavior is retained.

## Local migration and counts

The guarded helper [simplify-preeval-eight.ts](../../scripts/database/simplify-preeval-eight.ts)
accepts only the exact nine-table `aet` schema in owned `aet_core_rehearsal`, with
session role `core_rehearsal` and a local Unix socket. It locks the local tables,
rejects other service types, returns old event rows and a digest to the caller,
and drops only `aet.aet_payment_events` in one serializable transaction. No
`CASCADE`, replacement view or new runtime table is used. The full-copy harness
saves the retired rows privately outside Git. A forced DROP failure restores the
original event rows and nine-table state.

`activateEightTableRehearsal` separately validates the connection and exact eight
relations before selecting payment-state-only handling. The historical thirteen-
and nine-table paths retain their event-table behavior. No hosted flag or endpoint
activates the new mode; the live adapters and formal evaluation remain unchanged.

The complete-copy test reuses the [November 10 snapshot](database-full-preview-convergence-2026-11-10.md)
and previously captured provider evidence. It does not fetch a newer snapshot or
make fresh Stripe/Dropbox/Resend requests. Its four old and two core pre-evaluations
retain their identities and results; four formal applications remain unchanged.

| Stage | Complete isolated copy | Shared pre-evaluation tables |
| --- | ---: | ---: |
| Restored Preview snapshot | 32 | Existing separated schemas |
| First convergence | 25 | 13 |
| Prior compact phase | 21 | 9 |
| Current payment simplification | **20** | **8** |

The other twelve are ten evaluation workflow tables and two legacy formal tables.
They remain until the formal workflow converges. Staff auth, CMS and unrelated
public/system tables are outside this count. Online Preview remains at the last
verified 32-table state; zero hosted tables were deleted. Production was not queried.

## Verification

**385 tests across 22 files pass**, with all selected local PostgreSQL fixtures
enabled. `pnpm exec tsc --noEmit --incremental false` passes. `git diff --check`
passes. No build was run.

- The previous 25-case compact suite is renamed to
  `application-core-eight.test.ts` (subsequently superseded by
  [application-core-six.test.ts](../../tests/application-core-six.test.ts)) and
  expanded to **28 cases**. Tests execute the existing service/route handlers with
  real local PostgreSQL and simulated providers after physical event-table removal.
- Six concurrent signed callbacks using the same and different event IDs produce
  one payment and one effective payment audit entry. Confirmation/result sends do
  not multiply on another event; payment/release timestamps remain unchanged.
- A database trigger forces result publication to fail after payment commits.
  The handler returns 503; after removing the fault, the same signed webhook
  returns 200 and publishes the saved result, with one AI run and one result
  notification. No new payment is created.
- Concurrent partial/full refund callbacks and subsequent older refund, success
  and expiry notifications retain the full refund and withheld result.
- The **14-case full-snapshot suite** retains earlier migration comparisons and
  adds event-table DROP rollback, complete 20-table inventory/business comparison,
  and concurrent signed payment replay on eight tables. All ten CRM applications,
  formal rows, payment rows, released results and current notification receipts
  remain consistent. The audited no-charge fixture still cannot create Checkout.
- Existing tests retain unsigned/incorrect-amount rejection, failed uploads,
  stale completions, AI concurrency, scoped customer/staff access and notification
  deduplication/recovery. Global external fetch is blocked in these local suites.

The default `pnpm test:database:rehearsal` runner now selects the eight-table suite.
Full-snapshot tests additionally require the existing private
`APPLICATION_CORE_FULL_SNAPSHOT` file. Clusters are stopped and deleted by their
fixtures; no existing database URL or environment file is loaded. Private logs
are `/private/tmp/aet-eight-regression.log` and `/private/tmp/aet-eight-types.log`.

The planned Mermaid source, SVG and viewer metadata now contain eight entities;
the regenerated static diagram was visually checked. No application UI changed,
so no new browser/customer-flow claim is made for this backend-only change.

## Remaining rollout boundary

Before hosted adoption, take a fresh consistent snapshot, retain a durable backup,
validate restricted roles and run the full Preview journey with the actual provider
webhook. Local state-based duplicate protection does not establish hosted delivery
acceptance. Formal/translation migration and Production activation remain separate
requests. This work adds no Resend webhook, cron, tracking dashboard or event ledger.
