# Phase-three pre-evaluation runtime rehearsal — November 6, 2026

Starting point: `dev` at `4a40e70`. This change activates actual service reads and
writes against the new core for a **fresh synthetic pre-evaluation cohort** in a
disposable PostgreSQL cluster. It does not enable a hosted feature flag, migrate
historical customers, or change Preview/Production configuration.

## What owns each record

| Data | Phase-three authority and retained compatibility |
| --- | --- |
| Application identity, contact/evaluee fields, request deduplication and submitted snapshot | `aet.aet_core_applications`; created first in the submission transaction. New requests use hash version 1, excluding presentation locale. Existing version-0 rows require explicit reconciliation |
| Education | `aet.aet_education`; selected by the service's education IDs. AI, Status, CRM, admin listing and emails read it. A staff adapter applies office scope, optimistic version checking, audit and result invalidation |
| Service selection and amount | `aet.aet_service_detail`; dedicated pre-evaluation saves USD 19.00 automatically. Existing fixed USD 19.88 Checkout remains unchanged. General/manual/combined-service pricing is outside this cohort |
| Service state, private staff notes and current result | Same-transaction projection into `aet_service_detail` from the retained workflow state machine. Result version, input version, payment state and upload readiness gate customer access. The workflow is the single transition writer; this is not independently editable dual authority |
| Completed files | `aet.aet_documents`; require provider-returned File ID, storage connection and revision. Existing `preeval.files`/`document_uploads` retain attempts, fences and recovery; no document row is invented for failed uploads |
| Payment state | Existing `preeval.payments` remains the operational ledger for Checkout/webhook/refund processing, atomically mapped by the same payment ID into `aet_payments`. Core CRM/Status read the mapped payment truth; neither copy is summed twice. Ledger retirement is deferred |
| AI, audit, email, tokens and sessions | Existing operational tables and foreign keys remain. Required workflow profile columns are compatibility data; new submissions do not write `preeval.educations`. Deliberately injected incorrect old records do not override canonical reads |

No new table, Folder ID, folder registry, scheduler, or database migration is
introduced in phase 3. The phase-one schema already supports this cohort. New
dedicated submissions do not create old workflow education or public legacy application/education/payment
rows or `document_locations` rows. Existing legacy triggers consequently have no
new public parent to update. Historical and formal readers remain unchanged by
default; the activation guard rejects an unreconciled or mixed workflow cohort.

Core activation is an explicit call to
[`activateCoreRehearsal`](../../lib/application-core/runtime.ts) with an owned
connection and test provider account. It verifies database name, database owner
and a Unix socket with no server network address. Only the test harness calls it;
there is no environment/HTTP switch and no application startup activation.
Backfill now rejects authoritative version-1 applications to avoid overwriting
new business records with old compatibility copies. Do not use target-only schema
drop as a rollback after ownership changes; discard/recreate the complete disposable
fixture. A hosted cutover still needs its own grants, recovery and rollout plan.

## Files and presentation

AI metadata lookup and authorized downloads resolve the saved **File ID**, then
use current provider metadata and pinned revision for analysis. Moves/renames do
not make cached `storage_path` authoritative. Later dedicated uploads inspect the
current directories of known File IDs. Multiple directories or a location outside
the dedicated transport's supported structure returns
`directory_confirmation_required`; a staff confirmation interface and general
on-open scan/reconciliation remain future work. Existing shared folder scanning
is retained for old flows, not claimed as migrated to the new cohort.

Customer responses do not expose storage IDs/paths, private notes or draft output.
Staff detail can still inspect a draft. English email rendering reads canonical
profile/education and uses existing delivery IDs and digest protection. Browser
language remains presentation context in the retained workflow, not a field on
the new core tables or submitted snapshot.

## Verified acceptance

117 tests pass across nine files, including 11 new core-runtime integration cases
and the existing phase-one/two, publication, upload-fencing, CRM and Status
regressions. TypeScript and whitespace checks pass.

- Concurrent identical submissions return one Application ID; changed business
  input conflicts; changing only UI language does not create another application.
- A complete real-service/real-SQL flow runs submission → upload → AI → test
  Checkout callback → eligible result → queued English mail → CRM/Status reads,
  **without calling the phase-one backfill**.
- Corrupting workflow names and injecting an obsolete education proves business reads use core.
  Staff education edits update core, reject stale versions and invalidate old
  output before another analysis. Original submitted snapshots remain immutable.
- Concurrent Checkout reuses one session; callback replay does not create another
  payment, AI run or result email. Refunds before and after completion withhold
  access. Payment identity/account/frozen amount mismatches require reconciliation.
- Both upload transports capture File IDs; failed upload replacement works and
  stale shared completion cannot invoke storage. Missing provider identity cannot
  produce a ready canonical document.
- File rename/move still permits authorized download and analysis. Cross-application
  file access is denied; uncertain upload destinations require confirmation.
- A saved paid AI result recovers publication after an injected publication failure
  without another AI run. Email failure retries retain the delivery ID and body.
- Unpaid cancellation, missing-information requests and private staff notes map
  correctly; customer/office restrictions continue to withhold protected records.
- Injected canonical writes failing mid-transaction roll back application creation
  or workflow mutations; no partial canonical/workflow success is acknowledged.

Run the owned-cluster suites:

```sh
pnpm test:database:rehearsal
```

Full focused regression command:

```sh
APPLICATION_CORE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
PREEVAL_PUBLICATION_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
PREEVAL_F4_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
pnpm exec vitest run tests/application-core-rehearsal.test.ts \
  tests/application-core-runtime.test.ts tests/preeval-publication.test.ts \
  tests/preeval-upload-fencing.test.ts tests/preeval.test.ts \
  tests/crm-workspace.test.ts tests/customer-status.test.ts \
  tests/crm-identity.test.ts tests/crm-details.test.ts
pnpm exec tsc --noEmit --incremental false
```

The test owns and removes its PostgreSQL cluster. It does not load `.env.local`.
Stripe, Dropbox, AI and email transports are deterministic fakes, and global
network fetch is blocked. This is backend/service integration acceptance, not a
browser journey or real-provider/hosted acceptance. No development server was
started; no build, deployment, commit or push is part of this phase's execution.

## Next gates

1. Review the isolated adapters before choosing a separately authorized dev
   Preview cohort and runtime role. Do not activate these guards against hosting.
2. Reconcile historical IDs, files, provider accounts, snapshots and mixed-cohort
   routing; map existing URLs and all old writers before historical cutover.
3. Implement staff-confirmed directory selection and core scan synchronization
   before replacing shared document browsing/upload for the general intake.
4. Complete hosted provider/browser/failure acceptance with isolated credentials.
   Retire payment/workflow compatibility only after that evidence; formal v2,
   translation and Production remain separate phases.
