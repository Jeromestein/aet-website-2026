# Shared database rehearsal

**November 10 update:** the runner now includes the nine-table pre-evaluation
suite. Earlier sections retain their phase-specific 13-table evidence; the new
[acceptance record](archive/database-nine-table-rehearsal-2026-11-10.md) covers
physical four-table retirement. No hosted database is changed.
See the [revised plan](database-migration-plan.md#approved-convergence-target-9-tables).


Phases 1–3 create and test the five shared business tables without changing the
running application or any hosted database. The target is the private `aet`
schema. Those original phases retain source tables. A separate convergence suite
now retires empty pre-evaluation sources inside its own disposable database.

The phase-one/two suite performs **schema, mapping and shadow-read rehearsal**.
The separate phase-three suite switches actual application/education ownership
and business reads for a fresh disposable cohort; it does not call backfill.
Both execute real pre-evaluation services and PostgreSQL. Neither activates a
hosted cutover.
Stripe, Dropbox, AI and email transport use synthetic responses. It neither
charges a card nor sends an email, and it does not test browser screens or hosted
provider delivery. The [phase sequence](database-migration-plan.md#5-delivery-phases-and-acceptance-gates)
keeps historical/hosted cutover and later services behind separate acceptance gates.

## Run safely

Prerequisites: installed project dependencies and local PostgreSQL binaries.
The runner detects common Homebrew PostgreSQL 15 and Linux PostgreSQL 15–17 paths.
For another installation, set `APPLICATION_CORE_TEST_PG_BIN` to its `bin` folder.

```sh
pnpm test:database:rehearsal
```

The runner creates its own temporary cluster and database `aet_core_rehearsal`,
using a unique temporary Unix socket directory, no TCP listener, and synthetic
fixtures. It never loads `.env.local` or accepts an existing database URL. The
cluster is stopped and its directory removed at the end, including test failures.
If PostgreSQL is unavailable, the command fails instead of silently skipping.

Do **not** use `supabase db push`, the legacy integration commands that load
`.env.local`, or a hosted Preview database for this rehearsal. Hosted application
and CRM connections may reach different schemas; a Preview URL alone does not
establish data isolation.

## Files and responsibilities

| File | Responsibility |
| --- | --- |
| [Additive migration](../supabase/migrations/20261106220126_shared_application_core.sql) | Five private tables, constraints, reference checks, immutable submitted snapshots and client access denial; no runtime grants |
| [Backfill](../scripts/database/preeval-backfill.ts) | Transactional snapshot of one dedicated pre-evaluation application; explicit reconciled metadata and returned identity/exception report |
| [Rollback](../scripts/database/rollback-rehearsal.sql) | Drop only the rehearsal target schema, guarded by database name, role and Unix-socket connection |
| [Runner](../scripts/database/rehearse.mjs) | Find local PostgreSQL and run the isolated suite; no environment-file loading |
| [Integration suite](../tests/application-core-rehearsal.test.ts) | Own cluster lifecycle, existing service flow, source fixtures, provider fakes, migration assertions and rollback/replay |

## Backfill rules

- Preserve application, education, file-index and text-compatible payment IDs.
  New service IDs are created once per application/service pair and reused on
  repeated backfill. The returned report is the tested cohort's identity map;
  ambiguous historical sources require a separate reconciliation phase.
- Read current names/email/education from matching legacy projections, as the
  current application does. Workflow state, input versions and payment ledger
  remain authoritative. Source records and paths are never rewritten.
- Capture an original submission only when its parsed payload matches the saved
  request hash. Preserve the old hash with `request_hash_version = 0`; the captured
  business snapshot omits UI locale. Do not reconstruct original submissions from
  current mutable fields, or fabricate acceptance times/terms versions.
- Import a ready file only with explicitly reconciled Dropbox File ID, connection
  and revision. A path or legacy fingerprint is not a File ID. Missing IDs are
  reported and retained in source storage; failed uploads remain operational
  records. File moves update cached metadata without changing identity.
- Preserve original filenames. Historical file/education creation times remain
  NULL when unknown; document `updated_at` records actual import/metadata refresh.
- Keep service prices distinct from payment totals. An explicit verified price
  can record automatic/manual provenance; without it, price remains NULL and is
  reported. The current synthetic pre-evaluation fixture uses USD 19.00 for the
  service and USD 19.88 for Checkout, including the existing fee.
- Supply a verified provider account explicitly. This runner only imports test
  payments; it does not infer office routing, import standalone payments or
  reclassify historic summaries as verified transactions. Preserve recorded
  `paid_at`; never derive it from the latest `updated_at`.
- Put staff notes in `staff_notes`, never customer `notes`. Preserve result/input
  versions and withhold the projected release when payment/current state is
  ineligible. Retain unknown historic `released_at` as NULL and report it.
- Each application's mapping is atomic. Identity conflicts abort it entirely.
  Re-running refreshes a rehearsal snapshot; this is not continuous dual writing
  and must not run after the target becomes authoritative.

## Exit evidence and remaining boundaries

The [November 6 record](archive/database-phase1-rehearsal-2026-11-06.md) covers
submission replay, upload replacement, AI/payment/result/email recovery, refunds,
File ID reconciliation, constraints, access denial and rollback/replay.

The migration deliberately grants no application runtime access. Before cutover,
implement office-scoped repositories and customer-safe projections; preserve
authorization, payment/event fencing and private results. Typed formal/translation
requirements, mailing-address validation, aggregate versions/statuses, mutation
timestamps and new English-only email handling must be enforced by those writers.
Database defaults do not automatically advance `updated_at` or aggregate `version`.

Phase-three File ID metadata lookup and revision-pinned analysis are verified
with simulated storage. Core on-open scanning/staff directory confirmation, real
historical backfill, all-service fulfillment and hosted acceptance remain open.
The old folder registry and operational tables cannot be removed yet. No account,
applicant, quotation, deliverable, Folder ID or new scheduler is introduced.

## Phase-two shared reads

The same isolated command now verifies [core read adapters](../lib/application-core/reader.ts)
against existing pre-evaluation Status and CRM. The CRM query engine is shared,
but production continues to use its existing source. See the
[phase-two evidence](archive/database-phase2-reads-2026-11-06.md) for comparison
fields, permission tests and the resolved legacy education-date discrepancy.
The guard rejects hosted/existing databases. No shadow reads trigger payment,
publication, AI, upload or email side effects.

## Phase-three actual runtime

The runner also executes [the core runtime suite](../tests/application-core-runtime.test.ts).
Its explicit activation function accepts only the disposable database/role/Unix
socket. Submission writes core first; canonical education edits and profile reads
are real runtime adapters. Successful files store File IDs immediately, and service
results/payment projections commit with their operational transition. No backfill
repairs test checkpoints. New core emails are English while UI language stays a
presentation concern.

See [phase-three acceptance](archive/database-phase3-runtime-2026-11-06.md) for
ownership, failure injection and retained tables. No production environment flag
was added. The legacy backfill rejects new authoritative records; do not drop the
core schema or silently switch these records back to legacy writers. Recreate the
complete owned test fixture for rollback. Historical and hosted migration still
require explicit reconciliation and authorization.

## Hosted dev Preview activation

The hosted opt-in uses `APPLICATION_CORE_MODE=preview` and the verified Stripe
**test** account in `APPLICATION_CORE_PROVIDER_ACCOUNT`, scoped only to Vercel
Preview / `dev`. It requires the existing `aet_preview_runtime` connection,
approved branch origin, and disabled employee migration/cutover. The runtime also
checks the actual database role and rejects write privileges on production tables.

Apply only `20261106230843_preview_application_core.sql` to the authorized project.
It creates five private tables in `aet_preview_core`, enables RLS and grants access
only to the existing restricted Preview runtime. Never run the local fixture or
all historical migrations against the hosted project. Existing Preview schemas,
production schemas and old rows remain intact.

New dedicated pre-evaluations use the five core tables plus the retained operational
workflow tables. Existing pre-evaluations continue using their old business records;
CRM combines both cohorts and retained formal evaluations before office scoping,
filtering and pagination. Old submission retries retain their original identity.
No historical backfill or table retirement occurs during this activation.

After the first new core application, do not roll back to a deployment predating
this adapter or simply remove the flag: that would hide canonical education/results
from the old reader. Retain this compatible reader and pause new submissions while
investigating; preserve both table sets and provider event records.

## Historical Preview cohort copies

The [November 6 historical rehearsal](archive/database-historical-cohort-2026-11-06.md)
adds a local copy of the Preview schema layout and one-time cutover evidence gates.
`previewLayout: true` does not permit a hosted connection: the disposable database,
owner and Unix-socket checks still apply. `requireCutoverReady: true` rejects an
existing target, unsettled work, inconsistent payment state, missing ready File IDs
and size mismatches. It must be used for cutover rehearsal rather than refreshing
an already-authoritative v0 record with the snapshot mode.

The normal runner now includes phase-one/two, runtime, Preview-layout and cohort
suites. The private captured-cohort option is described in the acceptance record;
it is not loaded by default. Hosted backfill requires a separate restricted entry
point and a deployment containing the verified old-request retry fix. No old table
is removed by these tools.

## Pre-evaluation physical retirement gate

The same runner includes `tests/application-core-convergence.test.ts`. It starts
with the existing schemas, proves a populated-source guard rejects retirement,
then moves eight operational tables into `aet` and drops seven redundant empty
tables using `scripts/database/converge-preeval-rehearsal.sql` in one transaction.
There is no `CASCADE` or same-name compatibility view. It asserts exactly 13
canonical/runtime tables and all validated FKs before submitting new applications.
The formal fixture remains separate; it is not evidence of formal convergence.

`activateConvergenceRehearsal` checks the database name, login, Unix-socket
connection and retirement state. Activation is held per connection in memory;
no environment variable, web request or hosted deployment enables it. Existing
Preview and legacy paths keep their prior behavior.

The suite exercises the production service/route functions with the converged
adapter, real local PostgreSQL and simulated providers. It includes ordinary,
chunked and shared upload tracking, stale attempts, input fencing, AI retry,
payment/refund ordering, real Stripe signature validation on synthetic callbacks,
transaction-failure publication recovery, scoped customer routes/CRM and email
idempotency. It does not send live messages or charge cards. See the
[acceptance record](archive/database-preeval-convergence-2026-11-06.md).

This first script requires **empty source and target business rows**. It is not
an importer for the existing hosted cohort and must never be placed in automatic
Supabase migration discovery. The populated-copy importer below is a separate
entry point. Hosted grants/cutover remain separate checklist items. The prior
backfill scripts continue testing the prior runtime; they do not activate the
new 13-table path.

## Populated historical retirement gate

`scripts/database/converge-preeval-history.ts` exports
`convergeHistoricalPreevaluation`. It verifies the same owned Unix-socket database,
locks source and target rows/tables, and migrates the entire source cohort plus
operational history in one serializable transaction. Existing core-v1
pre-evaluation rows are preserved exactly after identity/state/price/file/payment
reconciliation; other target cohorts reject migration. Supply explicit service
amounts, verified Dropbox File ID metadata and
one verified provider payment record for each ledger row. Application state must
agree with the ledger; missing evidence, orphan rows and active upload/AI/mail
work reject migration. No environment files or network providers are consulted.

The importer shares the operational DDL with the empty-source gate, then retargets
FKs and drops seven old tables only after reconciliation. Original operational
fields remain intact; payment-event IDs gain account/test scope with an explicit
mapping in the report. Immutable retired business snapshots are kept in existing
`aet_audit` as migration evidence, never as another mutable runtime profile. A
result-version floor prevents reusing an old result-email key. Any failed check,
including a check after DROP, rolls back both data and schema.

The standard runner now includes `tests/application-core-history.test.ts`. To
repeat the captured-copy variant, set `APPLICATION_CORE_HISTORY_SNAPSHOT` to the
private synthetic snapshot file; its directory must also contain `verified.json`.
The test only accepts the previously captured four-record synthetic cohort.
It runs both the original three-record payment-backed case and a mixed case with
all four old records plus two applications generated through the current core-v1
writer. The latter covers a paid result and a queued unpaid AI job. Access tokens
and sessions are created locally before migration; hosted credentials are not
copied. Provider responses use saved evidence, not live API calls.

For the no-charge synthetic fixture, explicitly supply `noChargeAuditId`. The
importer requires the matching original `test.payment_fixture` event, its
`synthetic-e2e-test` actor, `synthetic`/`noCharge` flags and reason, plus no payment
ledger. It records confirmation in `aet_audit` and an exemption reference in
`aet_service_detail.details`, with zero amount and manual pricing. The guarded
runtime derives `waived` only while both audit references remain valid and no
payment exists. Zero price alone never unlocks a result; Checkout is blocked for
this fixture. No payment row, paid timestamp or fourteenth table is invented.

This is not a hosted migration command: schema names are the local fixture
layout, non-v1 target cohorts are rejected, and no runtime deployment switch is
introduced. See the [acceptance scope and remaining gates](archive/database-preeval-history-convergence-2026-11-06.md).


## Complete hosted snapshot, local-only acceptance

The opt-in [full-snapshot suite](../tests/application-core-full-snapshot.test.ts)
restores all 32 captured Preview tables, including existing core and formal rows.
It checks source column names/types and exact restored row values before migration
(including database-generated columns), using UTC timestamp serialization.
It then verifies transactional rollback, seven physical drops, unchanged canonical
rows, all CRM views and formal/customer Status, signed payment replay and sent-mail
preservation. It owns a fresh local Unix-socket cluster and blocks external fetch.

Prepare the authorized read-only snapshot and refreshed provider evidence outside
Git, with owner-only permissions. Never commit raw database records or credentials.
The snapshot must include `project`, `captured_at`, `tables` (all 32 fully qualified
Preview tables) and `columns` (information-schema metadata); adjacent `verified.json`
contains reconciled file/payment references and email receipts. The frozen six-case
acceptance cohort deliberately fails when the source inventory changes; reconcile
and update the fixture contract explicitly instead of silently omitting rows.

```sh
APPLICATION_CORE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
APPLICATION_CORE_FULL_SNAPSHOT=/private/tmp/your-private-snapshot/snapshot.json \
pnpm exec vitest run tests/application-core-full-snapshot.test.ts
```

This opt-in suite is separate from the default synthetic rehearsal command. It
skips when either input variable is absent; do not count a skipped run as acceptance.
`rehearsal-report.json` is a private count/migration artifact; use the complete
Vitest exit status, not the report's existence, to determine success. Provider
read-only reconciliation and before/after hosted comparisons are separate from
the offline test run. See [November 10 evidence](archive/database-full-preview-convergence-2026-11-10.md).

## Nine-table pre-evaluation simplification

The default runner includes `tests/application-core-nine.test.ts` (25 cases).
`activateNineTableRehearsal` requires the owned `aet_core_rehearsal` database,
`core_rehearsal` role, local Unix socket, exact nine-table inventory and required
new columns. No environment flag enables this path on a hosted database.

`scripts/database/simplify-preeval-nine.ts` accepts only the reconciled thirteen
shared tables. It locks the cohort, rejects active upload/AI/mail work, unsupported
services and unconsumed unexpired token-only links, then moves current state and
drops the four superseded tables in one transaction without `CASCADE` or views.
It returns the old rows and digest to its caller; the full-snapshot test saves
that archive outside Git. A hosted version would need a durable reviewed backup
before deletion; this local helper is not a hosted migration command.

The opt-in full-snapshot suite now has eleven cases, including forced DDL failure
rollback, four-table retirement, complete CRM/Status comparison and payment/mail
replay. It reuses the November 10 private snapshot described above; no new fetch
is implicit. The full copy has 21 tables after both migration stages. Provider
calls remain simulated and the local clusters are disposed after each run.

Application UUID links have no customer-cookie or creation-time expiry. File
requests carry `applicationId` and must match the file owner; staff-only actions
remain authenticated. Existing short-lived upload operation tokens still fence
chunk transport and do not limit the lifetime of an application's customer link.
Old token-only links with usable tokens block migration; expired/consumed tokens
are externally archived, and their retired consume route returns 410. Review
old-link communication/compatibility before any hosted cutover.
