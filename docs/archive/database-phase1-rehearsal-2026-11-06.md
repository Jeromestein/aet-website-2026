# Database phase-one rehearsal — November 6, 2026

Scope: `dev`, starting from `64891c1`; user authorized additive migration scripts
and an isolated pre-evaluation rehearsal. Production changes were excluded.

## Implemented

- Five new business tables in private `aet`: applications, education, services,
  documents and payments. No existing table rename, deletion, runtime route change,
  dual-write trigger, remote grant or deployment.
- Filled birth/residence/submission/version gaps, service progress/private notes,
  simple service amounts and JSON results, file access/revisions, and payment
  account/reference/refund/timestamp fields. `due_amount` is generated from cents.
- Same-ID transactional pre-evaluation snapshot/backfill with explicit file and
  pricing reconciliation. Unknown original snapshots, file IDs and price
  provenance are reported; missing historical timestamps remain NULL.
- Private schema/client access checks, ownership/uniqueness constraints, immutable
  captured submissions, and rehearsal-only rollback.

## Verification

The suite creates a fresh PostgreSQL 15 cluster, binds only its private temporary
Unix socket, loads synthetic source fixtures and migrations, and removes the
cluster afterwards. It does not read project environment files or use a hosted
connection. Database operations and pre-evaluation service logic are real;
provider responses are mocked. No customer data, real charge, delivered email,
external AI request, Dropbox scan or browser interaction is included.

Commands used:

```sh
pnpm test:database:rehearsal
PREEVAL_PUBLICATION_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
PREEVAL_F4_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
APPLICATION_CORE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
pnpm exec vitest run tests/application-core-rehearsal.test.ts \
  tests/preeval-publication.test.ts tests/preeval-upload-fencing.test.ts \
  tests/preeval.test.ts
pnpm exec tsc --noEmit --incremental false
```

Results: **81 tests passed across four files**, including nine new rehearsal
cases; TypeScript passed. No production build was run.
Documentation checks verified 185 local links and exact correspondence of all
84 target diagram columns to SQL. The in-app browser loaded the updated viewer,
switched to Proposed, and displayed the diagram at readable size. The temporary
document server was stopped after inspection.

| Case | Observed result |
| --- | --- |
| Submission and identity | Existing submit/session services work; repeated request reuses application; changed payload is rejected; core IDs align |
| Upload/AI/payment/release | Real service/database flow reaches paid/completed; unreleased output stays hidden; USD 19.00 service price stays distinct from USD 19.88 payment |
| Publication failure | Saved paid result recovers on authorized service read; no new AI generation and no duplicate result email |
| Email failure | Failed simulated transport retries with persisted delivery record; subsequent flush sends no duplicates |
| Upload replacement | Failed old attempt blocks completion until explicitly abandoned; replacement completes; stale abandonment is rejected |
| File metadata | Unresolved File ID yields an exception and no invented document; moved/renamed metadata preserves record/File IDs and original source path |
| Refund/replay | Full refund remains authoritative after an old paid callback; customer result is hidden and target release is withheld |
| Legacy unknowns | Missing original snapshot, education timestamps and service-price evidence stay NULL with explicit exceptions |
| Translation/combination shape | Organization-only translation can have zero education; multiple degrees and separate evaluation/translation service rows are supported at the schema level |
| Integrity/access | Duplicate services/files/open Checkouts, excess refunds, cross-application references, mutable original snapshots and client reads are rejected |
| Atomic migration conflict | Conflicting File ID aborts all target writes for that application and leaves its source data intact |
| Rollback/replay | Dropping target schema preserves workflow rows and source payment totals; existing result read still works; reapplying reproduces the same source IDs and release state |

The first rollback test exposed a test-runner transaction/connection-pool mismatch.
Executing its self-contained SQL transaction on a reserved connection fixed it;
the rollback/replay test then passed.

## Next gate

Phase 2: shared repositories and read comparisons for customer Status, CRM and
receipts, including office access and private notes/results. Runtime continues to
use existing tables until that comparison and a one-cohort cutover are verified.
Historical source counts, real provider/File ID reconciliation, automatic folder
scan behavior, English-only runtime emails and formal/translation fulfillment
remain unverified. Hosted Preview and Production were neither accessed nor changed.
