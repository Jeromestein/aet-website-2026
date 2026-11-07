# Historical pre-evaluation cohort rehearsal — November 6, 2026

## Scope and isolation

The owner authorized migration and CRM/old-link/payment-callback checks in an
isolated environment, retention of old tables and no Production changes.
This run copied the **four existing synthetic hosted Preview pre-evaluations**
into an owned, disposable PostgreSQL database. It did not copy the 189 public
business applications, activate historical migration on Vercel, or write to any
hosted database. Hosted dev remains at `bc32922` with two new core applications.

The harness creates database `aet_core_rehearsal`, uses a unique Unix socket with
no TCP listener, and restores the Preview schema layout. Migration runs as the
local fixture owner; runtime reads, requests and callbacks run as the restricted
`aet_preview_runtime` role. No environment file is loaded by the tests. Network
calls are rejected; external callback delivery and email sending are not enabled.
The cluster is stopped and removed after the run.

## Evidence reconciliation

Before offline replay, read-only Dropbox and Stripe Sandbox queries verified:

- Four retained files: existing path lookup resolved a real Dropbox File ID and
  revision; File-ID download matched the provider content hash and the source
  fingerprint. The older ordinary uploader hashes the **base64 text** of bytes;
  that fingerprint is different from both raw-byte SHA-256 and Dropbox's block hash.
  No files were uploaded, moved, renamed or deleted.
- Three existing Checkout sessions and PaymentIntents: matching application IDs,
  test mode, USD 19.88 paid amount and zero refunds. The provider product description
  independently records USD 19.00 service plus USD 0.88 fee. The service amount
  therefore remains 1,900 cents, separate from each 1,988-cent payment.
- The fourth application's audit contains `test.payment_fixture` with
  `synthetic=true` and `noCharge=true`: an earlier test manually exercised paid
  result release without Stripe. It has **no payment ledger row**. It is retained
  on the old path, not converted into an invented verified payment.

| Source application | Isolated outcome |
| --- | --- |
| `1b79980c-8edf-465c-a68e-1d5c96c30610` | Migrated with its education, File ID, service and payment |
| `c3d052d7-fe1f-4c08-bfa5-af7bd9ff63c3` | Migrated with its education, File ID, service and payment |
| `1f90291e-f413-4911-95e6-9e5ba8ee8bef` | Migrated with its education, File ID, service and payment |
| `1a25c57d-194c-4c53-9500-b1623886f6e7` | Retained: synthetic no-charge paid-state fixture; no ledger |

For the three migrated records, application/education/file/payment IDs are
preserved, payment principal totals 5,964 cents, and service amounts total 5,700
cents. The original submitted payload and historical result-release timestamps
are unavailable: they stay NULL with explicit exceptions. No original submission
or release time is fabricated. Source tables and their histories remain intact.

## Implementation and verification

The backfill accepts the Preview schema layout **only inside its disposable
Unix-socket database guard**. Its one-time cutover mode rejects existing targets,
unsettled workflows, unsupported payment states, missing ready File IDs and
file-size discrepancies. A rejected application leaves no partial core rows.
The general snapshot rehearsal retains its existing explicit non-cutover mode.

Runtime retry validation now recognizes both request hash versions. A migrated
v0 request keeps its original locale-inclusive hash; an identical request returns
the same application ID, while changed details or changed locale are rejected.
New v1 requests retain their current locale-independent behavior. This correction
is local and must be deployed before hosted historical cutover.

| Check | Result and boundary |
| --- | --- |
| Source preservation | Digest of the restored old source rows unchanged by migration |
| CRM | Before/after equality for list, equivalency, payment, documents, oldest sort, completed filter and CSV projections; no double counting |
| Customer data | Names, education dates, status, files, result content/version and timestamps match through shared scoped readers |
| Old result links | Original application IDs and localized result paths preserved; existing access links created before migration still create scoped sessions after migration |
| Lookup/access | Actual lookup and application route handlers succeed; cross-application read denied; consumed access token cannot be reused |
| Payment callback | Actual webhook route validates a locally signed test event based on captured Stripe session data; replay of a pre-existing event twice produces no extra payment, AI run or email |
| Refund ordering | Simulated refund callback followed by stale paid callback retains refunded status and hides the result; no real refund is requested |
| Incomplete record | No-charge fixture rejected atomically and remains readable through the retained legacy path |
| Submission retry | Synthetic v0 retry fixture verifies original hash compatibility and conflict rejection |

`pnpm test:database:rehearsal`: **30 tests across four files passed**, all database
suites enabled. The separate run with the captured Preview cohort passed all
**six cohort tests**. TypeScript (`tsc --noEmit --incremental false`) and whitespace
checks passed. No local production build was run.

These are backend/data and route-handler checks, not browser screenshots or a
real Stripe webhook delivery to a migrated hosted application. The previous
hosted recovery evidence remains separate. No UI was changed.

After the run, another read-only comparison confirmed the hosted four-record
cohort and associated source histories were unchanged, and hosted core still
contained two applications. No push, deployment, schema alteration, old-table
deletion or Production change occurred.

## Reproduction and next gate

The normal runner uses generated synthetic records and needs no private export.
For the explicit captured-cohort rehearsal, place the private `snapshot.json`
and read-only provider `verified.json` beside each other outside Git, then run:

```sh
APPLICATION_CORE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
APPLICATION_CORE_COHORT_SNAPSHOT=/absolute/private/path/snapshot.json \
pnpm exec vitest run tests/application-core-cohort.test.ts
```

The private fixture and provider evidence are not committed. The test records a
mapping/exception report alongside the fixture; it contains no authentication
credentials. Its test importer is restricted to the four approved synthetic
Preview records. It is not a general production export/import tool.

Before a separately authorized hosted historical cutover: deploy the v0 retry
fix, prepare a restricted Preview-only migration entry point, recheck provider
metadata and source versions, preserve the no-charge fixture on its old path,
and repeat browser/real-webhook acceptance on the migrated hosted cohort.
Real historical business data, formal evaluation, translation and table retirement
remain outside this rehearsal. Old tables cannot be removed.
