# Populated pre-evaluation convergence acceptance

Date: November 6, 2026. Branch: `dev`, based on `cce76d4` plus uncommitted
convergence work. Scope: owned disposable PostgreSQL databases only.
No hosted database, deployment, environment or provider setting changed.

## Result

The pre-evaluation runtime works after migrating a populated, reconciled source
cohort into the 13-table target and physically dropping seven old tables. This
extends the [new-request retirement gate](database-preeval-convergence-2026-11-06.md);
it does not establish complete hosted historical acceptance or reduce the hosted
32-table inventory today.

Two fixtures pass the same six acceptance tests:

- Three synthetic historical applications: two paid/completed records with older
  AI runs and result emails, plus an unpaid record with a failed shared upload.
  The fixture includes microsecond timestamps and a result-version floor of 7.
- Local copies of three old synthetic Preview applications with previously
  verified payment and Dropbox evidence. These are the payment-backed subset of
  the [earlier captured cohort](database-historical-cohort-2026-11-06.md). The fourth
  source record is an audited no-charge paid-state fixture without a ledger row;
  it is not imported into this fixture, changed remotely or declared deletable.

The importer requires every source application in its disposable database to be
accounted for. Importing a reconciled subset into a fresh fixture is test coverage,
not permission to drop shared hosted tables that still contain other records.

## Migration and preservation

`scripts/database/converge-preeval-history.ts` runs one serializable transaction:

1. Verify the owned database/login and Unix-socket connection. Reject nonempty
   target business tables, incomplete cohorts, unmapped legacy records, missing
   File IDs, provider-payment disagreement and active upload/AI/mail work.
2. Backfill canonical application, education, service, document and payment rows
   while retaining original IDs, known timestamps, frozen amounts and results.
3. Move eight existing operational tables into `aet`; retain original AI runs,
   delivery receipts, audit history, access credentials, limits and upload rows.
   Merge shared upload attempts into `aet_uploads`. A current queue-control row
   is added only when no settled historical run matches current state.
4. Retarget foreign keys, seed the monotonic result version and qualify historical
   payment-event keys by verified account and test mode. The report records ID
   mappings, counts and a source digest.
5. Preserve retired business snapshots in immutable `aet_audit` migration events.
   These are evidence, not a second mutable application/payment source. No extra
   archive, quote, deliverable, applicant or folder-location table is introduced.
6. Compare original operational fields, then drop the seven retired tables
   without `CASCADE`. Assert exactly 13 physical tables in `aet` and no old
   pre-evaluation tables or same-name replacement views.

The original empty-source SQL remains strict. The populated importer shares its
DDL but supplies complete cohort reconciliation in place of the empty-fixture
guard. Both are outside automatic Supabase migration discovery. The importer has
no hosted switch and cannot overwrite an already populated core-v1 target.

## Acceptance evidence

`tests/application-core-history.test.ts` verifies:

- Rejection of incomplete cohorts, missing File ID evidence, payment-state and
  provider-amount mismatches, and a late upload-mapping error. A deliberately
  unexpected target table triggers failure after DROP; PostgreSQL restores the
  original tables/data and leaves target business tables empty.
- Original operational row identities and fields remain equal; all FKs are valid,
  the new inventory is 13, and canonical payment totals match verified evidence.
- Customer business projections and seven CRM query variants retain rows, totals,
  counts and statistics. Comparisons exclude runtime environment labels.
- Sessions and one-use links created before migration work afterwards; cross-
  application access returns 401. These credentials are generated locally rather
  than copied from hosted customers.
- Actual webhook route handling with real Stripe SDK signature validation on
  synthetic events. Duplicate legacy-shaped callbacks do not add payments, AI
  runs or mail; sent deliveries are not resent. A later stale paid callback does
  not reverse a refund.
- Legacy v0 submission retries retain the original locale-inclusive hash rule;
  changed input conflicts. Staff corrections advance result versions and create
  the next email key. The synthetic failed-upload slot can be abandoned after
  migration. The captured fixture does not independently cover these absent
  submission/failed-upload inputs.

Combined regression: **335 tests across 20 files passed, zero skipped**. This
includes the 20 new-request physical-drop tests and six populated synthetic
migration tests. The captured historical-copy variant separately passes **6/6**.
`pnpm exec tsc --noEmit --incremental false` and `git diff --check` pass.
No production build was run. No frontend code was changed in this stage; browser
visual verification was not performed. Tests call actual service/route handlers.

All databases use temporary local clusters and Unix sockets; teardown stops and
removes them. No environment file or hosted connection is loaded. External fetch
is blocked, and Stripe/Dropbox/AI/email calls are simulated. Captured provider
responses were verified earlier and reused as frozen evidence, not rechecked
live in this run. No live charge, provider delivery or hosted callback is claimed.

## Remaining gates at the initial historical stage

- Reconcile the complete mixed old/core-v1 cohort; the current importer rejects
  nonempty canonical targets. Preserve concurrent-era IDs and avoid double writes.
- Decide explicitly how to retain the audited no-charge fixture without inventing
  a payment; do not discard it to make a whole-table retirement check pass.
- Rehearse queued/pending work and restart boundaries beyond the settled/failed
  cases here; refresh all provider evidence before a hosted migration.
- Prepare restricted hosted grants, rollout/rollback and acceptance under separate
  authorization. No hosted retirement is currently enabled.
- Converge formal/translation writers and shared operations before claiming the
  entire private business/runtime database has reached the 13-table end state.


## Mixed-cohort extension

Follow-up verification on November 6, 2026 keeps the same local-only boundary.
This section supersedes the empty-target and excluded-no-charge limitations of
the initial stage above; it does not change that stage's recorded results.

The importer now accepts an explicitly reconciled mixed source cohort:

- Existing core-v1 pre-evaluation applications must match workflow identity,
  office, state and result versions. Their canonical profile, education, service,
  documents, payments, submission snapshots and timestamps are left unchanged.
  Retained workflow names/emails are deliberately stale in the fixture to prove
  they cannot overwrite authoritative business data.
- Existing canonical service amounts and document/payment identities must match
  evidence. Non-v1 targets, another service, orphaned identities or conflicting
  state reject the entire transaction. A source digest includes canonical and
  legacy snapshots. No source exclusions or replacement views are introduced.
- An audited synthetic no-charge record may specify `noChargeAuditId`. Acceptance
  requires its original `test.payment_fixture` audit, `synthetic-e2e-test` actor,
  explicit synthetic/noCharge flags, reason and an empty payment ledger. A new
  confirmation audit and reference in service details explain the zero amount.
  No payment row, provider receipt, paid timestamp or extra table is created.
- Runtime projects this fixture as `waived`, not `paid`, and prevents Checkout.
  Results remain available under the normal status/AI/input-version/access gates.
  Removing its exemption reference immediately withholds the result; a zero price
  by itself is insufficient. Real unpaid applications remain unpaid and withheld.
  Existing sent mail remains sent; payment callbacks cannot invent a ledger row.

`tests/application-core-history.test.ts` runs six original tests and eight mixed
ones. The captured variant now imports **all four old synthetic Preview copies**
plus **two core-v1 applications generated locally through the actual writer**.
The new records cover a paid completed case and an unpaid queued job. They are
not fresh copies of the hosted core records. The separate all-synthetic variant
also includes failed-upload recovery and v0 original-submission retry evidence.

Additional checks prove:

- All existing canonical fields remain equal after migration and physical DROP.
- Missing/false exemption evidence, request identity drift, result-version drift,
  active AI, uploading files and sending mail reject migration. The existing
  late-failure case still restores old tables and core rows after DROP rollback.
- CRM and Status remain equal except the intentional no-charge correction from
  paid/catalog amount to waived/zero. Payment history stays empty for that record;
  neither received money nor outstanding debt is invented.
- Existing access sessions/links work, callback replay/refunds stay idempotent,
  sent emails are not resent and old results keep monotonic versions.
- v1 retries remain locale-independent; changed business inputs still conflict.
  A queued core job resumes after source deletion, reads the canonical education,
  saves one AI result and withholds it while unpaid.

Final combined regression: **343 tests / 20 files, all passed, none skipped**.
Final captured-copy variant: **14 tests passed**. TypeScript and whitespace checks
pass. All providers are mocked/frozen evidence; no external email, charge, upload,
AI request or fresh provider reconciliation occurs. No frontend page was edited
or browser visual acceptance performed. No commit, push or deployment occurred.

Remaining before hosted convergence: reconcile a fresh complete old/core snapshot
and provider evidence, drain active work, verify the exemption display in the UI,
and prepare restricted grants with a separately authorized rollout/rollback.
The exemption is a narrowly audited test fixture, not a general free-service or
customer discount capability. Formal/translation convergence is still separate.
Production and hosted Preview data/settings are unchanged; zero hosted tables
have been removed.
