# Nine-table pre-evaluation: isolated acceptance

Date: November 10, 2026. Branch: `dev`, based on `0654547` plus the current
uncommitted implementation and preceding full-snapshot documentation/CRM fix.
Scope: actual pre-evaluation services and route handlers in disposable PostgreSQL;
no hosted activation, deployment, charge, AI request or email send.

## Result and table inventory

The approved target is implemented for isolated pre-evaluation. Its private `aet`
schema contains exactly these nine tables, with no replacement compatibility views:

| Business (5) | Shared operations (4) |
| --- | --- |
| `aet_core_applications` | `aet_ai_runs` |
| `aet_education` | `aet_payment_events` |
| `aet_service_detail` | `aet_audit` |
| `aet_documents` | `aet_rate_limits` |
| `aet_payments` | |

The full-copy test reuses the [complete Preview snapshot](database-full-preview-convergence-2026-11-10.md)
captured at 23:04:31 UTC, including its read-only provider reconciliation. Four
old pre-evaluations and two existing core applications converge; four formal
applications remain unchanged. The earlier stage removes seven source tables.
This stage physically removes four more: `aet_uploads`, `aet_emails`,
`aet_access_tokens`, `aet_sessions`.

**Complete isolated copy: 32 → 25 → 21 tables**, comprising nine shared tables,
ten retained evaluation tables and two legacy formal tables. The whole system
has not reached nine: formal/translation writers and compatibility must converge
first. Staff auth, CMS and unrelated public tables remain outside this inventory.
**Online Preview still has 32 tables; zero hosted tables were deleted.** Production
was not queried or changed in this implementation.

## Ownership and behavior

- **Documents:** one row per file, nullable provider identity until ready; current
  upload state/version/context replace the separate upload record. Finalized
  Dropbox File IDs remain immutable, including after moves/renames. Ready files
  survive failed replacement. Old attempts cannot finalize a newer upload. The
  current dedupe key/fingerprint remains after success; the attempt ID is cleared.
  No Folder ID, folder-location table or application storage fields are added.
- **Notifications:** service `notification_state` stores at most four current
  kinds (confirmation, result, information, access), with stable delivery/event
  identity, payload hash, receipt, lease and bounded retry state. No HTML or full
  message history is copied into JSON. Concurrent claims, uncertain sends and
  changed content are guarded. Current staff notification views use this state;
  full historical receipt retrieval remains with Resend/external evidence.
- **Customer access:** a random application UUID in its URL grants customer
  access, without a separate secret/hash, cookie, session or expiration. Tests
  keep a ten-year-old application accessible. Any link holder has customer access.
  File requests must include the matching application ID. The UUID does not grant
  staff actions, office overrides or access to withheld/private results. Existing
  short-lived chunk-upload operation tokens remain transport fences only.
- **Business state:** the service owns the monotonic result-version counter,
  current material request, and explicit confirmed synthetic-test exemption plus
  provenance. Audit remains history; deleting its version/request history in a
  test does not change current business state. No fake payment is inserted for
  the audited no-charge fixture.
- **Payment replay:** a new event ID describing an already-settled payment does
  not rewrite that payment's `updated_at` or `paid_at`. Event deduplication,
  refunds and saved-result recovery remain intact.

Resend documents a 24-hour idempotency window; the adapter stops automatic retry
at 23 hours or five attempts and leaves uncertain delivery for review. This avoids
assuming indefinite provider deduplication. See [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
and [receipt retrieval](https://resend.com/docs/api-reference/emails/retrieve-email).
No cron or new external service is introduced. Provider retention and a complete
historical-mail UI are not established by these local tests.

## Migration and activation boundaries

[`simplify-preeval-nine.ts`](../../scripts/database/simplify-preeval-nine.ts)
requires the owned `aet_core_rehearsal` database, `core_rehearsal` session role and
Unix-socket connection. It requires the exact reconciled thirteen-table source,
locks that cohort and rejects running uploads/AI/mail, non-pre-evaluation services,
unmapped mail or multiple unsettled notifications. Unconsumed, unexpired old
token-only links also block retirement. Expired/consumed token records are archived;
after retirement their consume route returns 410. Hosted compatibility/communication
for those URLs still needs review before rollout.

State movement and four `DROP TABLE` operations run in one serializable transaction,
without `CASCADE`. A forced DDL failure proves rollback restores thirteen tables
and removes the new columns. The helper returns original rows and an archive
digest; the full-copy harness writes the archive outside Git under the private
snapshot directory. It includes all thirteen historical mail receipts, upload
records and customer access records, including locally added test sessions.
These temporary files are rehearsal evidence, not durable hosted backups. A
hosted migration must persist and verify a recoverable archive before deletion.

`activateNineTableRehearsal` separately validates the local connection and exact
nine-table schema. There is no environment/HTTP switch to activate this path on
Preview or Production. Retired relation mappings throw rather than silently
falling back to old tables. Existing hosted adapters retain their behavior.

## Verification

**379 tests across 22 files pass**, with all selected PostgreSQL fixtures enabled.
`pnpm exec tsc --noEmit --incremental false` also passes. No `pnpm build` was run.

- 25 nine-table runtime tests execute submission, ID lookup/access, ordinary and
  chunked/shared uploads, failures/replacement/abandonment, late completion,
  moved-file lookup, AI concurrency/stale-input/failure, saved-result recovery,
  signed callbacks/refunds, CRM education edits and English notifications.
- 11 complete-snapshot cases include the previous seven 13-table migration
  comparisons, plus nine-table DDL rollback, physical retirement, all ten CRM
  records/results/formal-data comparison and signed payment/mail replay. Eleven
  CRM query variants cover filters, offices, sorting, totals and exports.
- Five existing test payments remain USD 99.40 in total; the no-charge application
  remains `waived`, has no payment row and cannot create Checkout. Sent receipt
  state does not trigger another send. Global provider fetch is blocked.
- Negative access checks deny missing/mismatched application IDs on downloads,
  staff actions without staff identity, unpublished/refunded results and direct
  anonymous/authenticated database schema access.

The synthetic suite runs through `pnpm test:database:rehearsal`; the complete-copy
suite additionally requires the private `APPLICATION_CORE_FULL_SNAPSHOT` file.
See the [runner guide](../database-rehearsal.md#nine-table-pre-evaluation-simplification).
Private regression logs are under `/private/tmp/aet-nine-implementation`; raw
snapshot/receipt/archive data is not added to Git.

The in-app browser checked the actual customer `ApplicationResult` component in
a temporary fixture-only Next page at `http://localhost:3033`. Completed/payment
status, education, result and attachment link rendered. Clicking Download passed
the application ID to a synthetic endpoint, which confirmed the matching ID.
This checks the one changed UI link, not a real Dropbox download or a full
browser journey against the nine-table database. The temporary server was stopped;
no repository `.env` files or databases were used by that page.

## Next gates

1. Review/commit this local implementation and retain the earlier full-copy fix.
2. Converge formal intake/readers/writers to the same nine tables; preserve formal
   application history before retiring the remaining twelve formal tables.
3. Before any hosted activation, refresh/reconcile the snapshot, pause active
   work, resolve old links and pending provider delivery, prepare a durable
   backup/restore and restricted grants, then verify the full Preview journey.
4. Keep Production separate. This evidence is not authorization to delete hosted
   tables, enable real customer charging or retire the old application.
