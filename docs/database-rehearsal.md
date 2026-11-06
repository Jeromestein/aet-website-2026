# Shared database rehearsal

Phase 1 creates and tests the five shared business tables without changing the
running application or any hosted database. The target is the private `aet`
schema. Existing public, `preeval` and `evaluation` records remain intact.

This is a **schema and mapping rehearsal**, not a cutover. The integration suite
executes the existing pre-evaluation services against real PostgreSQL, projects
each checkpoint into the new tables, and compares identities, amounts and state.
Stripe, Dropbox, AI and email transport use synthetic responses. It neither
charges a card nor sends an email, and it does not test browser screens or hosted
provider delivery. The [phase sequence](database-migration-plan.md#5-delivery-phases-and-acceptance-gates)
keeps shared repositories and CRM/Status shadow comparisons next.

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

Automatic File ID lookup/scanning, changed-revision download behavior, real
historical backfill, all-service fulfillment and hosted acceptance remain open.
The old folder registry and operational tables cannot be removed yet. No account,
applicant, quotation, deliverable, Folder ID or new scheduler is introduced.
