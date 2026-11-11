# Complete Preview snapshot: isolated convergence acceptance

Date: November 10, 2026. Branch: `dev`, based on `0654547` plus this change.
Scope: a read-only copy of every table in the four private Preview business
schemas; all migration and deletion occur in disposable local PostgreSQL.

## Source and boundaries

The source is project `qrxztgdemfodemlcabcq`, verified against the repository's
Preview configuration. The consistent snapshot was captured in one repeatable-read,
read-only transaction at **2026-11-10 23:04:31 UTC (15:04:31 PST)**. It includes
all rows and column metadata from 32 tables, not only an application-ID subset.
Staff authentication, unrelated public/CMS tables and Supabase system schemas are
outside the previously agreed 32-table business inventory.

| Source schema | Tables | Business cohort |
| --- | ---: | --- |
| `aet_preview_core` | 5 | Two existing core-v1 pre-evaluations |
| `aet_preview_preeval` | 12 | Six pre-evaluation workflows: four old, two core |
| `aet_preview_evaluation` | 10 | Four formal evaluation applications |
| `aet_preview_legacy` | 5 | Four old pre-evaluation projections and formal projections |

There are ten unique applications, not twelve: core rows share identities with
workflow rows. One old pre-evaluation is an explicitly audited no-charge test
fixture. All six pre-evaluations are completed; no active upload, AI run or mail
lease needed interruption. This does not test pausing active hosted work.

Snapshot table-content digest (normalized JSON object keys, SHA-256):
`b040d43afe91816383313b86c86ec4449d38a88f7cadf67f0464d3d1209d355b`.

Raw snapshots, provider evidence and logs are private files outside Git under
`/private/tmp/aet-full-preview-20261110`, with owner-only file permissions. They
are temporary evidence, not a durable backup or rollback artifact for a future
hosted cutover. A second read-only snapshot compared every table's row values and
confirmed **32 tables checked, zero changed tables**.

## Fresh provider reconciliation

Only read operations were used:

- Six Dropbox files: metadata, stable File ID, revision and downloaded content
  checked against the application's saved fingerprint. No file was moved or uploaded.
- Five Stripe test-mode payments: Checkout sessions, PaymentIntents, charge/refund
  fields and line-item pricing checked. Each payment is USD 19.88; the service
  amount is USD 19.00. Total ledger amount is USD 99.40. No new charge or refund.
- Thirteen Resend provider receipts: all report `delivered`. No send or resend.

The offline runtime then uses those captured payment responses and simulated
providers; global fetch is blocked. Signed webhook payloads are generated locally
and passed to the actual route handler. This proves local processing/idempotency,
not a fresh delivery from Stripe to a hosted URL.

## What changed and what passed

The complete dataset exposed a converged CRM reader that returned only
pre-evaluations. Extracting the unchanged formal-record query allows converged
CRM to combine canonical pre-evaluations with retained formal applications,
without querying the removed pre-evaluation tables. Hosted behavior does not
activate the converged path.

The opt-in `application-core-full-snapshot.test.ts` verifies:

1. Restore all 32 tables; compare column names/types and every row value. Let
   generated columns recompute and verify their values; serialize timestamps in UTC.
2. Force a failure after physical retirement and verify transaction rollback
   preserves old, existing core and formal records.
3. Migrate all six pre-evaluations, preserving all existing canonical rows;
   assert seven source tables absent, no remaining `preeval` tables, 13 `aet`
   tables and validated foreign keys. The importer also compares each retained
   operational field, allowing the documented provider-account event-ID prefix.
4. Reconcile all ten CRM records across 11 view/filter/office/sort/export queries,
   including counts, statistics, totals and paging. The expected no-charge change
   is a zero amount and `waived` payment state.
5. Compare all six customer results, identity/education/file metadata and result
   versions, exercise authenticated Status handlers, and compare all four formal
   Status responses. Preserve all formal table rows and the original 16 session
   records. New local sessions exercise access; this does not prove expired hosted
   sessions become usable. Canonical file responses intentionally omit the legacy
   upload-attempt `created_at`; the timestamp remains in the moved upload record.
6. Replay five signed test-payment callbacks twice each: no duplicate payment, AI
   run or email. Exactly five payment records total USD 99.40; the audited fixture
   has no payment row and cannot create Checkout.
7. Preserve all 13 mail records and provider receipts; flushing sent messages
   invokes no delivery function.

Seven full-snapshot tests pass. Combined regression: **350 tests across 21 files,
all passed**, with local PostgreSQL fixtures enabled. `pnpm exec tsc --noEmit
--incremental false` passes. No build, browser test or hosted deployment was run.
Earlier synthetic suites supply new-request, upload-replacement, queued-job,
publication-recovery and access-denial coverage; the fresh snapshot itself consists
of completed applications and is not described as a new end-to-end purchase.

## Physical table accounting

Seven tables are dropped from the local copy:

- `preeval.applications`
- `preeval.educations`
- `preeval.payments`
- `preeval.document_uploads`
- `public.aet_core_applications`
- `public.aet_core_educations`
- `public.aet_core_payments`

Eight operational tables move into `aet`; moving is not counted as deletion.
The local result is **25 tables = 13 shared + 10 evaluation + 2 legacy formal**.
No replacement views or `CASCADE` hide dependencies. Local clusters are stopped
and removed after verification.

**Online Preview remains at 32 tables; zero hosted tables were deleted.**
Production was not queried or changed. No environment variable, provider setting,
deployment or database grant was changed. The final 13-table system still requires
formal/translation writer and shared-operation convergence.

## Remaining gates

- Reconcile a fresh snapshot again at the actual cutover and quiesce active work.
- Prepare restricted hosted roles/grants, explicit activation and recoverable
  backup/rollback. Local owner-role acceptance does not establish hosted-role safety.
- Verify browser presentation, including the test-only waived state.
- Converge formal/translation operations before claiming the entire system has
  reached 13 tables. Do not delete the twelve retained formal tables yet.

See [checklist](../migration-checklist.md), [plan](../database-migration-plan.md)
and [rehearsal instructions](../database-rehearsal.md#complete-hosted-snapshot-local-only-acceptance).
