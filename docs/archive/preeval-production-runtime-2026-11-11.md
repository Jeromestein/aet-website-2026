# Pre-evaluation Production Runtime — Offline Acceptance

Date: November 11, 2026. Scope: development on `dev`; no commit, push or deployment.
The unrelated database architecture/document changes already in the worktree were preserved.

## Implementation

- Explicit `six-production` mode: trusted main/Production origin, separate
  restricted `aet_runtime` role and six-table `aet` target. Startup verifies actual
  role, isolation, table inventory, RLS and public grants; it does not provision SQL.
- Production notification and Checkout recipients come from the persisted
  application. Preview retains its controlled recipient and test-only payments.
- Separate live webhook secret, explicit live mode, actual Stripe account
  verification and mode/amount/application checks. Existing refund and replay
  handling is retained. Synthetic exemptions/test payments cannot release results.
- Separate Production document roots. Existing File ID ownership/authorization
  and staff membership/office rules remain in use. Production workspace reads
  pre-evaluation without touching retired formal tables.
- No new business tables, tracking system or scheduled jobs.

## Verification

- Full regression with `APPLICATION_CORE_TEST_PG_BIN` set: **764 passed,
  174 skipped**, 57 passing files and six optional suites skipped.
- New runtime suite: **34 passed**, including eight local PostgreSQL cases.
  These cover actual restricted-role queries, grants, persisted recipient,
  signed callback acceptance/rejection, receipt deduplication, open Checkout
  reuse, account/amount/ownership/mode mismatch, refunded-result withholding,
  synthetic-payment exclusion, customer/staff reads and cancellation.
- Existing Preview six-table, formal and pre-evaluation workflow tests passed.
- `pnpm typecheck` passed; no production build was run.
- Database tests create and remove their own local clusters. Stripe responses
  and email transports are synthetic; the live-shaped keys are inert fixtures.

## Boundaries and release work

Production settings, schemas, files, payment configuration and deployments were
not changed. No browser journey on a newly deployed version or actual live charge
was performed. Optional suites requiring separate database URLs/snapshot inputs
were skipped; they are not counted as passed. UI layout and client code were not edited.

Next: final hosted Preview/mobile acceptance, separately reviewed provisioning
of the empty Production target, live webhook/sender configuration, public-entry
routing and a reviewed release. Existing AET App records are not a migration
prerequisite. See the [active checklist](../migration-checklist.md).
