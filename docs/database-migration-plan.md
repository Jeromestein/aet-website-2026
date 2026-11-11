# Database convergence plan

Updated November 11, 2026. **Hosted dev Preview now uses six private
`aet_preview_shared` tables for both pre-evaluation and formal evaluation.**
All four historical formal applications, five education records and four Dropbox
files have been migrated, alongside the existing pre-evaluation cohort. The
remaining twelve formal tables have been retired after full-copy and hosted checks.
The actual Preview business inventory is **6**. Production remains unchanged.
Translation submission and unified formal-intake payment/fulfillment remain open;
a shared database does not make those product journeys complete.

See [formal convergence acceptance](archive/database-formal-six-preview-2026-11-11.md),
[active checklist](migration-checklist.md) and [rehearsal guide](database-rehearsal.md).
The field audit below remains the migration baseline. Earlier 32/25/21/20/18-table
counts describe historical stages. Staff authentication, legacy CMS and unrelated
Production/system tables are outside this Preview business count.

## Approved convergence target: 6 tables

**November 10, 2026 simplification:** remove `aet_audit` and `aet_rate_limits`
from the eight-table target. Do not record who changed an application or enforce
application request-frequency quotas in this phase. No replacement log, actor
history array, counter table or external rate-limiting service is introduced.
The earlier thirteen-, nine- and eight-table results remain historical evidence.
Both the complete local copy and hosted dev Preview now have **6 shared tables**.
See [hosted acceptance](archive/database-formal-six-preview-2026-11-11.md).

| Ownership | Target tables |
| --- | --- |
| Business (5) | `aet_core_applications`, `aet_education`, `aet_service_detail`, `aet_documents`, `aet_payments` |
| AI execution (1) | `aet_ai_runs` |

Current notes, material requests, result versions and confirmed test exemption
state stay on the application/service records. Staff reads return no operation
history. Staff authentication/office scope, customer application scope, input
validation, payment duplicate protection and file size/type/count constraints
remain. Staff auth, legacy CMS, unrelated public tables and future accounts are
outside this table count. Translation submission, unified formal-intake fulfillment and Production activation
remain separate work.

### Payment handling required for launch

Keep the current Stripe webhook and signature verification. Match the Stripe
account/mode, Checkout/PaymentIntent, application, currency and amount. Serialize
updates on the application/payment row and update only actual state changes;
repeated success must preserve `paid_at`/`updated_at` and produce no extra payment
or operation-history record. Read current Stripe payment/refund state where already
implemented, keep refunded amounts monotonic, and never let a late success or
expiry undo paid/refunded state.

Always attempt the existing result/notification completion path after an accepted
success callback, even when payment is already recorded. This lets the same
callback recover a previously failed publication without another AI run or mail.
No local event ID list, `last_event_id` workaround, second log table or additional
payment fields are needed. Stripe remains the event-history viewer; service
result/notification state owns completion inside AET.

### Deferred exception handling and tracking (TODO, not launch blockers)

- Resend webhooks for delivered/bounced/complained status and a CRM mail-history UI.
- A payment-event tracking/replay UI or cross-provider event ledger, only if actual
  operational needs later justify it; do not reintroduce a table by default.
- Scheduled reconciliation, scheduled mail retries, alert dashboards and broader
  provider-outage automation. Keep these as TODO, not work in this phase.
- Further dispute/chargeback and unusual multi-provider exception workflows.
- Reconsider optional staff operation history or request limiting only if a future
  business need arises; neither is required or implemented in the six-table mode.

Existing basic rollback, signature checks, duplicate protection, refund guards
and saved-result recovery remain in place. Deferral does not remove working
safeguards or authorize real charging/hosted cutover.

### Seven tables removed from the thirteen-table target

| Previous target | New owner / behavior | Implementation gate |
| --- | --- | --- |
| `aet_audit` | Removed; keep current business state only | No actor/change history, no replacement log; archive old evidence only during migration |
| `aet_rate_limits` | Removed; no request-frequency quotas in the new mode | Preserve auth, input validation, file limits and payment guards; no external limiter added |
| `aet_payment_events` | Stripe event history; atomic state changes on `aet_payments` | Physically retire only after callback concurrency, refund ordering and publication recovery pass locally; retain the webhook |
| `aet_uploads` | `aet_documents` owns each file and only its current upload state | Nullable File ID until ready, current upload version/context, stale-completion protection and failed-replacement recovery; no per-attempt history table |
| `aet_emails` | Resend owns full delivery history; `aet_service_detail.notification_state` retains minimal business notification state and provider references | Stable event key, payload fingerprint, provider ID and current status; reconcile pending/uncertain sends without duplicate mail before retirement |
| `aet_sessions` | Customer accesses the application using its random UUID in the URL | No customer session table or cookie required; every customer operation remains limited to that application |
| `aet_access_tokens` | The same application-ID URL is the customer access link | No extra secret, token hash or expiry field; no expiry based on application creation time |

The application-ID URL deliberately grants customer access to anyone holding it.
Use the existing random UUID, never a sequential display number. Links do not
expire automatically and work across browsers/devices. The UUID alone does not
grant staff powers, private notes/drafts, arbitrary Dropbox File-ID lookup, price
editing or report release. Keep staff authentication and office scope separate.
Application IDs must be treated as sensitive links in logs/analytics/public views.
This design does not add per-link revocation; assess any future revocation need
separately rather than silently adding a token or session table back.

`notification_state` is a validated, bounded map of current business notifications
(e.g. confirmation and current result version), not a second mail archive or an
unlimited array. It stores no copied email HTML/history. Link provider records to
the application/service, preserve deduplication across retries and use existing
recovery entry points; no scheduled retry job is introduced. Local implementation
retains at most four kinds: confirmation, result, information and access. The
captured Resend receipts were verified; current staff views expose current state,
not the removed full local history. Provider-history UI and delivery-status tracking are deferred;
review archive/retention only as needed for hosted data retirement. Preserve historical receipts in a reviewed archive before
retiring source tables; do not assume provider history lasts indefinitely.

One document row represents a file, not each upload attempt. Proposed `upload_state`,
`upload_version` and temporary `upload_context` hold only the current operation.
Completed file identity is still storage connection plus Dropbox File ID. A
replacement must not destroy the usable prior file reference before success;
late completion of an older operation must be rejected. The local adapter keeps
only the current dedupe key, source fingerprint, attempt ID and start time;
success removes the attempt ID. Key/fingerprint remain for file deduplication,
not as an upload-attempt history.

The service owns the monotonic result version, current material request and
explicit confirmed test exemption. Retired audit rows may be archived outside the
runtime for migration reconciliation; no new operation history is recorded. AI
jobs remain in their own table. Request-frequency tracking is disabled only in
the explicitly activated six-table runtime, including the authorized dev Preview
cutover. Production behavior is unchanged.

### Completed isolated pre-evaluation gate (historical prerequisites)

These prerequisites passed before the separately authorized November 11 hosted
cutover. Retain them for future cohort rehearsals.

1. Keep all hosted settings, data and Production unchanged during rehearsal. Enable convergence
   only through an explicit connection-identity-checked disposable test harness.
2. Wire the actual pre-evaluation entry points to canonical records; preserve
   upload fencing, AI input versions/leases, payment ordering and mail deduplication.
3. In a disposable database, physically drop the retired pre-evaluation business
   tables and legacy projections after checking the fixture cohort. Do not hide
   them behind same-name tables or views or use `DROP ... CASCADE` to mask dependencies.
4. Run submission/retry, ordinary and chunked uploads, failed-file replacement,
   AI/result recovery, Checkout/callback/refunds, guest access, CRM/Status and email
   checks after the drop. Prove table absence and foreign-key integrity.
5. Record exactly which tables/records were retired and whether providers were
   mocked. A clean synthetic rehearsal does not approve historical or hosted drops.
6. The November 10 fresh complete hosted snapshot passes locally; repeat with a
   new snapshot at cutover time.
   Core-v1 rows are preserved, not backfilled; inconsistent identity, results,
   prices, files or payment references reject the entire transaction. A queued
   job can resume after cutover, while running AI, uploads and leased mail require
   quiescence. Refresh provider evidence and verify exemption display before
   hosted activation. Then adopt shared operations for formal evaluation and
   translation. Preview and Production cutovers need separate authorization.

## Recommendation

Keep the five core entities: application, education, service detail, document,
and payment. Make them the common business records for evaluation and translation.
Keep only AI execution as a separate operational table. Documents and services
own current upload/notification state; application links need no sessions.
Payments own duplicate protection; no audit or request-counter table remains.

The additive foundation is complete for the tested pre-evaluation cohort.
Now converge its runtime and retire verified duplicate storage before expanding
service writers, retaining one authoritative writer for each application. Preserve Application IDs and provider references. Introduce a shared
data-access layer, prove equivalence in Preview, migrate pre-evaluation first,
then formal evaluation and translation. Retire legacy projections only after
their readers, writers, callbacks, and old URLs have been accounted for.

The five-table diagram is a business overview, not a complete physical schema.
Its simplicity comes partly from leaving operational tables off the diagram.
Do not measure this migration by reducing the entire database to five tables.

Keep service pricing on `aet_service_detail` as `amount_cents`, `currency` and
`pricing_source` (automatic or manual), with no `quote` JSON or separate quote
table. Fixed-price services use the shared price configuration; staff can enter
the amount for custom work. Payments preserve the amount used by Checkout.
Store the service's current delivery content, document references and release
metadata in nullable `aet_service_detail.result` JSONB; do not create an
`aet_deliverables` table. The additive phase-one schema implements these fields.
New Preview pre-evaluation uses them; other services remain pending. Documents
hold file identities. Reuse existing operational records and history.

## 1. What the code does today

| Area | Actual behavior | Migration consequence |
| --- | --- | --- |
| Dedicated pre-evaluation | New dev Preview applications write canonical core application/education; old cohorts retain compatible legacy reads; operational workflows remain | Preserve IDs and one authoritative writer; historical migration still requires reconciliation |
| Unified formal intake | Saves the submitted `data.intake` snapshot, server quote, same-ID `fce_*` projections, audit and confirmation-email record in a transaction | Preserve the full submitted snapshot and education-ID mapping, not just the columns shown in the target diagram |
| Formal workflow | Older pilot implements quote, payment, report release and private staff notes; v2 intake is explicitly blocked from that action route | Schema convergence does not make v2 fulfillment implemented; do not remove the guard as a migration shortcut |
| CRM Live | Reads four legacy record families; core applications are unconditionally displayed as pre-evaluation | Do not insert formal/translation records into the live public master until all such readers are adapted |
| CRM Preview | Combines canonical core records with old pre-evaluation/formal projections, excluding duplicate workflow projections | Mixed-cohort filtering, pagination and office scope must remain consistent |
| Customer Status | Legacy formal projection and v2 intake projection are different; v2 currently reports pending payment | Replace the placeholder with verified shared payment truth when that journey is connected |
| Files | Shared folder access, formal files, pre-evaluation files and upload attempts coexist | A successful-file index cannot replace unfinished-upload recovery or report-release checks |
| Payments | Workflow ledgers keep Checkout/PaymentIntent IDs, refunds and event deduplication; legacy rows are summaries | Do not collapse a ledger into `due_amount` and `payment_status` |
| Standalone payment | Separate Stripe/PayPal path; Stripe client selects office account/mode and does not write the application workflow ledger | Keep standalone payments separate until an explicit import/reconciliation contract exists |
| Old AET App | Inserts/updates public tables; old Stripe webhook and some browser hooks also write them | Old writers must be disabled or routed for a migrated cohort, not merely hidden in the new UI |

Evidence: [pre-evaluation service](../lib/preeval/service.ts),
[intake persistence](../lib/application/intake-server.ts),
[legacy writes](../lib/legacy-application/store.ts),
[workflow bridge](../scripts/legacy/workflow-bridge.sql),
[v2 action guard](../app/api/evaluation/[...path]/route.ts),
[Live CRM](../lib/crm/live-server.ts), [Preview CRM](../lib/crm/workspace-server.ts),
[Status projection](../lib/customer-status/model.ts), and
[standalone Stripe client](../lib/stripe.ts).
Legacy cross-check: `aet-app/src/app/(frontend)/(aet-app)/utils/actions.tsx`,
`api/stripe/webhook/route.ts`, and `components/DegreeEquivalencyTable/hooks/`.

### Environment boundaries

The logical `public`, `preeval`, and `evaluation` names are rewritten to
`aet_preview_legacy`, `aet_preview_preeval`, and `aet_preview_evaluation` in
cloud Preview. Live CRM uses a different restricted connection to actual public
tables. A branch does not isolate these data stores or provider accounts.
See [schema routing](../lib/preeval/config.ts) and [Live connection](../lib/crm/live-db.ts).

Hosted dev Preview now uses the separate private `aet_preview_core` namespace
with the five accepted table names and restricted `aet_preview_runtime` login.
It is schema isolation within the existing project, not a separate project. For eventual production,
recommend a private canonical namespace, such as `aet_core`, while old `public`
tables remain compatibility surfaces. **The final namespace needs approval.**
Copying the same IDs into a temporary target is not creating new application
identities. It avoids prematurely mixing new service types into old public
queries. Do not automatically promote Preview test records into production.

## 2. Field audit of the five core entities

### Phase-one implementation boundary

The migration uses the private `aet` schema and does not rename or alter existing
public/workflow tables. There are exactly five new business tables, no quotes,
deliverables, applicant, user or location tables. Client roles have no access.
Server/office policies are deliberately deferred until the shared access layer.

The rehearsal mapping preserves application, education, document-index and payment
IDs; service IDs are new and retained on repeated backfills. Its returned report
provides the tested cohort's identity crosswalk and unresolved evidence. A general
historical identity map is still needed for ambiguous/standalone sources; no new
permanent mapping table is justified by this same-ID cohort alone.

`request_hash_version = 0` preserves the existing locale-inclusive hash while
new captured business snapshots omit locale. Missing snapshots are not recreated
from mutable values. `payer_snapshot` preserves room for standalone payer data;
standalone import itself is not implemented. Education/document creation times
remain NULL when absent from the source. Service price must be explicitly verified;
the payment total, which may include fees, is never treated as the service price.

### Application master

Keep the approved contact, office, service, pronouns/name, mailing address,
purpose, status and timestamp fields. No storage fields, persisted UI locale,
applicant table, or customer-account table is added by this plan.

| Missing or ambiguous item | Recommendation | Evidence / reason |
| --- | --- | --- |
| `date_of_birth` | Add nullable `date`; retain known historical values | General form and formal Status already carry this field; target diagram omitted it |
| `residence_country` | Add nullable country code, distinct from mailing/study country | Dedicated pre-evaluation `country` means country of residence, including digital-only applications |
| `submitted_at` | Add nullable `timestamptz`; preserve source submission time | Legacy formal expiry uses it; creation/import time is not a substitute |
| `request_id`, `request_hash` | Keep submission deduplication, with a unique non-null request ID for new submissions; allow unknown historical values | Both current submission APIs detect replay and changed payloads |
| `submission_version`, `submitted_snapshot` | Add an explicitly versioned, immutable JSONB submission snapshot | Normalized fields are mutable; receipts and original instructions/prices must remain reproducible |
| `version` | Add an integer optimistic-lock version for aggregate edits | Existing formal actions reject stale updates; `updated_at` alone is not the concurrency contract |
| Application status | Define it as an aggregate of service progress; payment status comes from the ledger | A finished evaluation must not mark an unfinished translation completed |
| Required contact fields | Enforce current new-form requirements at submission; allow genuinely missing historical contact data | External orders lack email/phone; do not invent contact details to satisfy new constraints |
| `source` | Not required for the new workflow; review legacy data/consumers before removing it from the design | New pre-evaluation writes null; migration provenance needs its own explicit mapping, not a vague source field |
| Historical client address/fax | Retain original fields in historical snapshots/compatibility; add a distinct contact address only if an active business need is confirmed | Old client/billing address is not necessarily the recipient address, and v2 currently projects recipient fields into legacy address columns |
| Terms acceptance | Preserve any actual submitted acceptance; record a terms version and acceptance time for future flows that collect them | Dedicated pre-evaluation validates `terms = true`; do not invent acceptance time/version for historical records or forms that did not collect them |

New snapshots contain business inputs, not access secrets or UI locale. Preserve
old snapshots unchanged as historical evidence; do not backfill fake submitted
snapshots from today's mutable fields. Existing request hashes include locale:
version the new canonicalization rule and keep old request IDs/hashes resolvable,
so a client retry during cutover does not create a second application.

The future nullable `customer_user_id` remains deferred. When accounts are added,
link ownership to the application and leave the contact/evaluee snapshot intact.
Matching an email is not proof of ownership. Guest access must remain functional.

Evidence: [general form model](../lib/application/model.ts),
[pre-evaluation input](../lib/preeval/domain.ts),
[country label](../lib/preeval/copy.ts),
[submission deduplication](../lib/application/intake-server.ts),
[formal expiry](../lib/customer-status/expiry.ts).

### Education

Keep application-owned 0:N records; pure translation creates zero rows. Retain
the accepted month-precision study dates for this migration rather than inventing
exact days or combining a date-format redesign with table convergence.

| Item | Recommendation |
| --- | --- |
| `sort_order` | Add a stable display order; current service selections start as array indexes and must resolve to stable education IDs before saving |
| `created_at`, `updated_at` | Useful additions for new education records; keep unknown historical timestamps distinguishable rather than copying application dates |
| `ai_output` | Retain as a read-only compatibility projection initially; the current result belongs to service detail, with historical runs preserved in AI run records or an external migration archive |
| Selected education IDs | Store stable IDs in the typed evaluation request, validate same-application ownership and lock relevant records on updates; JSON references are not FKs |

Do not inherit the dedicated pre-evaluation table's `UNIQUE(application_id)`
constraint into `aet_education`. A first pre-evaluation adapter can select one
education explicitly without restricting formal evaluation to one degree.
No separate service/education join table is needed initially; introduce one only
if relational selection queries or more complex associations justify it.

### Service detail

Keep `id`, `application_id`, `service_type`, typed `details`, customer `notes`
and timestamps, with initial uniqueness on `(application_id, service_type)`.

Simple pricing and `result` are the owner-selected direction. The additional
workflow fields remain recommendations to review before combined fulfillment:

| Field | Purpose |
| --- | --- |
| `details_version` | Version the validated requirements payload |
| `status` | Track this service's progress independently of other selected services |
| `input_version` | Invalidate analysis/reports after relevant input changes; preserve the existing workflow counter until authority is switched |
| `staff_notes` | Preserve operational notes as a separate private field, excluded from customer projections |
| `customer_message` | Staff-authored current request/status explanation, distinct from the customer's original `notes`; retain only the current request, without actor/history tracking |
| `amount_cents` | Nullable nonnegative integer: the saved price for this service in cents; `null` means not priced, `0` means an explicitly zero-priced service |
| `currency` | Currency of the service amount, initially `USD`; all services in one Checkout must use the same currency |
| `pricing_source` | `automatic` for server calculation or `manual` for an authorized staff-entered amount; nullable when unpriced or historical provenance is unknown |
| `result` (nullable JSONB) | Current service output and release metadata: content, document references, release status/time and relevant input/result versions; see the [delivery contract](#service-delivery-result) |

Use the master `version` to protect aggregate edits initially; `input_version`
identifies the inputs a result used, not a second optimistic-lock scheme.

| Service | Required contents of the versioned details contract |
| --- | --- |
| Evaluation | Report type (document/course, mutually exclusive), rate/tier, stable selected education IDs, report format, extra-copy quantity and shipping method |
| Pre-evaluation | Selected education ID and relevant assessment request inputs; runtime AI state remains operational |
| Translation | Source/target language, translation type, intended use, optional requested deadline, and delivery requirements when applicable |

Preserve the local-office 1 pm cutoff rule and quoted turnaround snapshot. The
office/timezone/rate configuration remains shared code; no new office/catalog
table is needed just for this migration. Old expert/position/custom services must
remain readable even though new public selection hides them.

`notes` means customer-supplied remarks. Existing `preeval.applications.notes`
and formal `staff_notes` are staff-private; do not copy them into this field.
Legacy `purpose_other` is also editable by Live CRM: inspect provenance and
visibility before exposing historical text as new customer notes. Existing v2
`intake.notes` is the stronger submitted-customer source.

Evidence: [evaluation choices](../lib/application/evaluation.ts),
[delivery validation](../lib/application/delivery.ts),
[pricing snapshots](../lib/application/intake.ts),
[staff actions](../lib/evaluation-application/service.ts),
[pre-evaluation staff notes](../lib/preeval/service.ts).

### Documents

Keep File ID plus storage connection as identity; no Folder ID, folder row,
`document_locations`, `document_type`, or `deleted_at` is introduced in the target.
Keep the approved staff-confirmed directory resolution and on-open scan policy.

| Missing behavior | Recommended representation |
| --- | --- |
| A file's content changes without changing its File ID | Add nullable `storage_rev` and `storage_content_hash`; capture exact versions in AI input manifests and released outputs |
| Metadata refresh after moves/renames | Add `updated_at`; `last_seen_at` is optional if staff need refresh freshness separately |
| Unreleased output/private files | Add an access field such as `access_scope` (`customer_input` / `staff_only`), or retain an equivalent explicit ACL until migration; this is permission, not document type |
| Upload has not produced a File ID yet | Use the same file row with nullable File ID and current upload state/version/context; mark ready only after successful metadata reconciliation |
| Unknown metadata or unavailable files | Allow unknown MIME/size where necessary; report lookup failure and retain the record, without inventing a replacement or treating failure as deletion |

New staff discoveries default to staff-only until association/visibility is
confirmed. Outputs stay staff-only in the ordinary document list; authorized
delivery is granted through the service's released `result` with payment/access
checks.
A File ID or guessed folder path never grants access. File ID lookup must obtain
current authorized metadata; previous path/office names are not sufficient.

The current `sha256` field is not uniformly comparable: pilot code and the shared
uploader use different inputs/algorithms, including `dropbox:<content_hash>`.
Preserve old fingerprints with provenance; do not copy them into a new column
and assume they are all raw-byte SHA-256. Do not confuse stable File ID with a
fixed file revision. Keep historical analysis manifests intact.

Evidence: [AI manifest/revision loading](../lib/preeval/ai-documents.ts),
[shared upload completion](../lib/preeval/ai-jobs.ts),
[upload recovery](../lib/preeval/upload-recovery.ts),
[formal file/release checks](../lib/evaluation-application/service.ts).

### Payments

The phase-one target diagram and SQL now include the ledger fields below.
Replacing `preeval.payments` and `evaluation.payments` still requires shared payment
adapters, event routing and production reconciliation.

| Field/contract | Recommendation |
| --- | --- |
| Existing identity and timestamps | Preserve text-compatible payment IDs, nullable application link for standalone payments, `created_at`, `updated_at`, and `paid_at`; unknown historical times stay unknown |
| Money | Make `amount_cents`, `currency`, `refunded_cents` authoritative for new ledger rows; retain `due_amount` only as a compatibility projection, not a second editable amount |
| Provider routing | Add `provider`, server-controlled `provider_account`, and `provider_mode`; resolve old values from verified configuration/records, never assume all offices share an account |
| Provider references | Add distinct `checkout_session_id` and `payment_intent_id`; preserve old `payment_id` with verified meaning until converted |
| Checkout amount | Freeze the server-approved total in the payment record's `amount_cents` and `currency` before Checkout; no `quote_id`, quote-version system or mandatory new quote-snapshot column. Preserve existing historical price snapshots where present |
| State | Preserve creating/open/paid/expired/partial-refund/refund distinctions; no downgrade from paid or refunded on stale callbacks |
| Unverified legacy summary | Preserve status and provenance as legacy-reported; do not invent provider events or enable new automatic release from an unreconciled balance |

Use provider/account/mode-scoped reference uniqueness and event deduplication.
Retain an at-most-one-open-Checkout rule for each payable application;
one application can still have multiple attempts and historical payments.
Compare money exactly in minor units, not floating-point rounding guesses.
Reconcile shared/core payment projections with workflow ledger rows by verified
identity/provider references; never sum both copies as two payments.

Standalone payments keep their nullable application link and payer/source metadata.
Do not fabricate applications for them. Old formal/external records may contain
only payment summaries; unresolved transactions remain in compatibility storage
until reconciliation, with an explicit count/amount exception report.

Evidence: [pre-evaluation payments](../lib/preeval/payments.ts),
[formal payments](../lib/evaluation-application/payments.ts),
[refund ordering](../lib/preeval/stripe-refunds.ts),
[legacy payment projections](../scripts/legacy/workflow-bridge.sql),
[office account routing](../lib/stripe.ts).

### What replaces the duplicated workflow application data

The end state must not leave two editable copies of every application profile.
Move contact/evaluee/submission fields to the shared master, education to
`aet_education`, and requirements, staff/customer messages, service amounts and current
released results to `aet_service_detail`. Preserve earlier quote/result snapshots
in existing source/audit records until their history is explicitly migrated.
Keep the current pre-evaluation workflow row as a service-linked operational
sidecar while it owns AI scheduling, leases and recovery. It must eventually stop
owning duplicate names, education and business status. Update the AI/publication
adapter before removing those columns; it must not infer release from cached
education `ai_output`.

The formal workflow application row can retire only after its access hash,
submission snapshot, quotes, versions, messages and release references have
verified destinations. Its initial access hash belongs with retained guest-access
records, never in a public snapshot. Its child files/payments/emails/audit/token
FKs must be retargeted or mapped before the parent can be removed. Operational
records retain their own event history; they do not remain independent business
applications. Retire this dependency per service after the isolated physical-drop gate; do not wait for all services to finish before removing proven duplicate storage.

## 3. Additional tables and records

### Simple service pricing and delivery data

Keep the five business tables. Service pricing needs a saved amount, not a
separate quotation entity or a quote JSON document. Store requirements in
`details`, customer remarks in `notes`, and price in the three scalar fields
specified above. Store delivery data in the approved nullable `result` field,
with no separate deliverable table.

The pricing rules are:

1. Fixed-price services: calculate from the shared server-side price configuration,
   selected service/tier and quantities, and save `amount_cents` with
   `pricing_source = automatic`. The frontend can preview the same calculation;
   it cannot submit an authoritative charge amount.
2. Custom work or an adjustment: authorized staff enter the final service amount;
   save it with `pricing_source = manual`. Keep the current amount only; no actor
   log, before/after history or separate quote approval/version system is required.
3. An unknown price stays `null`; all payable services must have a known amount
   before Checkout. Never treat `null` as zero. An explicitly zero-priced service
   must not create a zero-value provider Checkout; define its authorized no-charge
   fulfillment rule before enabling it.
4. Add service amounts in the same currency to obtain the application total.
   Charge shared shipping once, with one service owning that charge. If staff
   change a whole-application total, reconcile it to the service amounts rather
   than storing another competing total or copying it into every service row.
5. Save the approved total and currency in `aet_payments` before Checkout. Lock
   price edits while a Checkout is open; expire/reconcile it before repricing.
   Never change an existing paid transaction's amount. Additional charges require
   an explicit additional-payment action, not mutation of the old payment.

Saved prices do not change when the catalog changes. Changed service selections
require explicit recalculation or staff reconfirmation; do not silently overwrite
a manual amount. Use the already-planned application concurrency check,
not a separate quote-version counter. Derive the balance from saved service prices
and reconciled payments/refunds, not from all Checkout attempts. Independent
payment per service remains deferred.

Backfill a known final amount from verified legacy `due_amount`, a confirmed
workflow price or an exact intake total, with explicit dollars/cents conversion.
A range or unconfirmed translation price remains unknown. Do not infer whether
an old amount was automatic/manual without evidence. An application-wide total
must not be copied into multiple service rows: retain the source and flag an
unresolved split for reconciliation. Existing historical price snapshots stay
available even though new service rows have no quote object.

### Service delivery result

**Approved design direction — November 6, 2026; not implemented.** Add nullable
JSONB `aet_service_detail.result`, with one current result per service row. It may
contain a pre-evaluation conclusion, an evaluation report or several translated
files. Keep the five business entities; do not introduce `aet_deliverables`.
A null value means there is no prepared result yet.

| Result key | Meaning |
| --- | --- |
| `content` | Nullable text or a service-validated structured conclusion; preserve the existing pre-evaluation output shape during migration |
| `documents` | Array of `{ document_id, storage_rev }` references; each ID is an `aet_documents.id`, with the exact file revision used for delivery; empty for a text-only result |
| `status` | `draft` or `released`; an uploaded file is not automatically released |
| `released_at` | Nullable UTC timestamp of successful publication; null before first release; retain unknown historical times as unknown |
| `version`, `input_version` | Preserve relevant existing result/input versions so an older output cannot be published against changed inputs; these are result metadata, not extra tables |

A file-only result can have null content; a text-only result needs no fake file.
Release requires actual content or at least one valid document. Documents remain
the owner of storage connection/File ID and current file metadata; the result
stores references and the delivered revisions, not duplicate storage paths or
file bytes. JSON references are not database foreign keys: the server must validate
same-application ownership, readiness and access, and prevent referenced files
from being removed without an explicit replacement/revocation decision.

Keep creation/upload, release and notification separate. Customer access requires
a released, current result plus the existing payment and authorization checks;
a release flag alone cannot bypass them. Private drafts stay hidden from customer
Status, file lists and generic service-detail responses. A new upload, refund or
changed input cannot silently expose stale/unpaid output. Preserve existing AI run output or externally archive migrated revisions where
needed; do not add release-actor tracking or a report-history table. Keep one current result here, not an unbounded history array.

Reuse existing publication recovery and email deduplication: retrying a failed
publication must reuse the saved output, and retrying a notification must not
regenerate or republish the result. Migration must map pre-evaluation result/version
fields and formal `released_file_id` into the correct service row without treating
every stored file as a delivered report. Keep old workflow fields authoritative
until their replacement passes equivalence and recovery checks.

The current workflow quote/release fields remain authoritative until adapters
and the simple amount/result contracts pass equivalence tests. Do not remove
source history or copy staff-private content into customer-visible results. This is a target
plan, not a database change.

### Operational migration boundaries

Existing runtime tables stay intact until the six-table adapters pass isolated
acceptance. The table below describes the destination, not authorization to delete.

| Existing record | Target disposition | Required preservation |
| --- | --- | --- |
| AI runs/state | `aet_ai_runs` | Input/result versions, manifest, output, queue/lease state and publication recovery |
| Upload tracking | Current state on `aet_documents`; retire `aet_uploads` | File association, active-operation fencing and valid file identity through failed replacement; archive old attempts if needed, no ongoing attempt history |
| Email delivery records | Resend history plus minimal service notification state; retire `aet_emails` | Application/event association, dedupe identity and provider receipt; reconcile unsent/uncertain messages and archive historical evidence |
| Payment events | Retire `aet_payment_events`; inspect history in Stripe | Keep signature/ownership/amount checks, atomic payment-state transitions and repeatable fulfillment; externally archive old rows during isolated retirement |
| Audit | Retire `aet_audit` | Current result version/material request/exemption live on services; archive source evidence externally, no new actor history |
| Customer sessions/tokens | Replace customer flow with non-expiring random application-ID URLs; retire both tables | Customer upload/status/file access scoped to the supplied application; retain staff auth and private-result checks; define redirects for old token-only URLs before retirement |
| Rate limits | Retire `aet_rate_limits` | Disable request-frequency quotas in the new mode; no replacement service or counter array |
| Staff accounts | Retain outside this six-table budget | Staff identity, role and office authorization |
| Migration identity report | Reviewed external artifacts, not another runtime table | Source/target identities, counts, digests, mapping exceptions and rollback evidence |

Do not create parallel service-specific families or a permanent seventh migration
or recovery table. No quote, deliverable, applicant/profile, address-book,
document-location, service-catalog or office table is required for this phase.

## 4. Identity and migration rules

| Current source | Target disposition |
| --- | --- |
| Public core application plus matching pre-evaluation workflow/projection | One canonical application with pre-evaluation service; preserve its existing ID after verifying identity |
| `fce_applications` plus same-ID formal workflow/projection | One canonical application with evaluation service; add translation detail when explicitly selected, without inventing missing languages |
| Core/FCE/workflow education rows | Application-owned education rows; preserve verified existing IDs, all degrees and display order |
| Workflow payments plus core/FCE summaries | Canonical ledger or retained verified projection; deduplicate only proven duplicate identities |
| Workflow file rows plus authorized Dropbox discoveries | File-ID index after metadata resolution; retain workflow document IDs through mapping where a direct reuse is not possible |
| `fce_external_orders` | Keep as a separate legacy source until purpose/service/contact/payment meaning is known; no guessed service or fake email |
| Standalone payments | Retain as standalone; no invented application |
| Actual `document_locations` | Migration-only lookup input until every active reader/upload target has a tested File-ID replacement; never copy its kind or Folder ID into the target |

Use source-qualified mapping, not email/name matching. The same UUID in two
independent legacy families is not proof they are the same application. Check
for collisions before backfill; resolve exceptions explicitly and keep aliases
for old URLs/provider metadata. Audit bigint IDs can also collide across schemas.
Keep old event/token references qualified until all dependents move together.

During shadow/backfill, the old record owns writes. After a cohort switches,
canonical records own writes and legacy copies become one-way projections for
remaining readers. Do not use bidirectional triggers or two independently
editable amounts/statuses. Existing workflow-to-legacy triggers must be replaced
or gated at the same transition, not left as an extra competing writer.

Backfill uses bounded, rerunnable batches and a durable exception manifest.
Baseline-copy consistency and final delta reconciliation are required. Do not
depend only on `updated_at`: some legacy writes do not maintain it reliably.
For this project, prefer a short controlled write pause for the final cohort
copy/compare over designing continuous replication. If a pause cannot be achieved,
a separately designed change journal is required before online migration.

Pause or route **all** relevant writers: old browser edits, legacy API, old/new
webhooks, staff actions, upload completions, AI publication and the existing
payment-expiry worker. Incoming payment events still need durable capture/provider
retry and idempotent replay. A pause must never acknowledge and discard an event.
Keep one effective side-effect owner; shadow reads/backfill must not send email,
charge a customer, rerun AI, move Dropbox files, or release results.

## 5. Delivery phases and acceptance gates

| Phase | Concrete change | Exit gate |
| --- | --- | --- |
| 0. Confirm the contract | Review field additions, approved simple service pricing/result contracts, canonical namespace, statuses, permissions and migration identity rules; collect read-only counts/constraints and unresolved sources | Every current field has a destination or retained location; no unexplained dropping or assumed identities |
| 1. Rehearse additive schema | Prepare migration SQL only after approval; add target fields/tables in disposable/Preview storage and retain an external identity report; keep source tables/readers untouched | Constraints, RLS/grants and idempotent backfill pass on representative synthetic fixtures; restore procedure proven |
| 2. Build shared access and shadow reads | Add repositories for applications, services, education, documents and payments; adapt response projections without moving authority; compare per-source reads | CRM, Status and receipts agree on IDs, office scope, names, degrees, prices, notes and visibility; shadow code has no side effects |
| 3. Move one pre-evaluation cohort | Switch application/education ownership first, reuse AI/email/upload/payment machinery with explicit mappings; preserve dedicated entry before connecting general entry | Existing happy path and upload/publication recovery pass, including refund and stale callback cases; no duplicate application/AI/payment/email |
| 3b. Converge pre-evaluation | Remove duplicate workflow application/education/payment ownership; move eight operational record types under core; physically delete retired tables in a disposable database before running the actual services | Verified for new requests (20 tests), old-only migration (6) and mixed old/core-v1 migration including audited no-charge handling (8); captured-copy variant passes 14 tests. No replacement views. Fresh full hosted-snapshot also passes 7 tests with all 10 CRM records retained; hosted cutover remains separate |
| 3c. Simplify to nine tables | Merge current upload state into documents, delegate mail history to Resend, replace customer sessions/tokens with application-ID access and remove audit business dependencies | Verified locally: 25 runtime cases + 11 full-snapshot cases, physical four-table retirement and DDL rollback; 379 combined tests / 22 files and TypeScript pass. Complete isolated copy at this stage: 21 tables; hosted was then 32. See [acceptance](archive/database-nine-table-rehearsal-2026-11-10.md) |
| 3d. Simplify payments to eight tables | Retire the event table; retain Stripe webhook and payment-state duplicate protection | Verified in isolation; see [acceptance](archive/database-eight-table-rehearsal-2026-11-10.md). Hosted tables remain unchanged |
| 3e. Simplify to six tables | Remove operation history and request-frequency quotas; preserve business state and access checks | Verified locally; see [acceptance](archive/database-six-table-rehearsal-2026-11-10.md). Complete copy: 18 tables. Hosted November 11 cutover also passes: twenty old Preview tables retired, eighteen retained; see [hosted acceptance](archive/database-six-preview-2026-11-10.md) |
| 3f. Converge formal Preview storage | Migrate formal code/history to the same six and retire twelve sources | Completed November 11: fresh backup/restore, four historical applications, hosted intake/upload/mail/CRM/Status, Stripe replay and exact six-table catalog verified; see [acceptance](archive/database-formal-six-preview-2026-11-11.md) |
| 4. Complete formal intake fulfillment | Move intake to canonical records and reuse the retained AI execution table and simplified file/notification/access contracts; add service amount fields and `result` handling, freeze Checkout amounts, then implement v2 staff/payment/release actions deliberately | v2 intake becomes operable with controlled staff actions and correct pricing; old report variants remain readable |
| 5. Connect translation and combinations | Permit translation submission with no education/evaluee requirement; use service amounts, shared payments/files and per-service notes/status | Pure translation and evaluation-plus-translation both complete; completing one service cannot close the other; no double shipping charge |
| 6. Migrate remaining historical cohorts | Reconcile live legacy data, files and payments; update old URLs/callback routing; freeze or redirect old writes per cohort | Counts, sums, references and access checks reconcile; unresolved data stays explicitly isolated, not silently converted |
| 7. Finish compatibility retirement | Complete per-cohort retirement already started at phase 3b; remove remaining formal/translation bridges after approval | Exactly 6 business/runtime tables, with staff auth and legacy CMS counted separately; no active old-table dependency; rollback and retention gates satisfied |

**Phase 1 evidence:** the disposable rehearsal passes schema constraints, client
access denial, same-ID backfill, complete existing pre-evaluation service flow,
refund/recovery scenarios, and target-only rollback/replay. External providers are
simulated; no hosted cutover or full CRM/Status shadow adapter is claimed. See the
[rehearsal record](archive/database-phase1-rehearsal-2026-11-06.md).

Phase-two pre-evaluation read adapters and scoped comparisons are now verified
in the same disposable environment; see [evidence and remaining differences](archive/database-phase2-reads-2026-11-06.md).
The CRM education-date discrepancy is corrected and regression-tested; complete
remaining historical/File ID reconciliation before migrating historical records.
Phase three now passes for a fresh isolated pre-evaluation cohort: canonical
application/education writes, File ID recording, actual business reads and atomic
service/payment projections, retaining operational state and ledger authority.
See [phase-three evidence and boundaries](archive/database-phase3-runtime-2026-11-06.md).
The subsequent [hosted acceptance](archive/database-preview-acceptance-2026-11-06.md)
activates this path for new dev Preview applications with real providers. It does
not rename public tables, migrate historical records or connect general intake.
Pre-evaluation can ship on the shared master while retaining its proven runtime
tables; launching it does not require migrating every historical record first.
Calendar estimates should follow phase 0 counts and reconciliation findings.

### Acceptance cases to carry forward

1. Submission replay returns the same Application ID; changed input under the
   same request ID is rejected, including retries across the adapter transition.
2. Evaluation preserves multiple degrees and selected-degree mapping. Translation
   has zero education rows; birthdays, residence country and mailing address remain distinct.
3. Customer notes do not reveal staff notes. Office restrictions apply to lists,
   statistics, exports, detail views and File-ID search, including unassigned records.
4. Failed/abandoned upload replacement works; stale completion cannot settle a
   newer attempt. File rename/move, missing IDs, changed bytes, pagination and
   uncertain directory confirmation behave as planned.
5. Repeated Checkout/webhook delivery does not charge or publish twice. Partial
   refund before/after payment events cannot restore paid access incorrectly;
   different provider accounts/test-live modes never match accidentally.
6. Paid plus saved AI output recovers publication without rerunning AI. New input,
   cancellation, missing material or refund still blocks inappropriate release.
7. Saved prices do not change with the catalog. Automatic calculation and manual
   entry both persist/read consistently in CRM/Status; manual prices survive a
   catalog refresh. Unknown and zero prices are distinct. Combined-service totals
   count shipping once; stale edits cannot mutate an open or paid Checkout amount.
8. English-only new emails work without a browser. Minimal notification state
   retains event keys/provider references; migrated sent notifications do not
   resend. Pending/uncertain sends and changed payloads reconcile explicitly;
   Resend history is accessible as agreed without a duplicate local mail archive.
9. Random application-ID URLs permit customer uploads/status without sessions,
   cookies, additional tokens or automatic expiry, including long after creation.
   Requests cannot mix another application's files, expose staff-only material or
   invoke staff actions. Any holder of a valid application link has customer access
   by design. Old token URLs have an explicit compatibility transition; future
   account ownership remains an extension, not a migration dependency.
10. A second backfill run creates no duplicates or side effects; restoring a cohort
    preserves source versions, provider events, audit and file identities.

Reuse existing tests rather than invent a parallel test framework:
[intake](../tests/application-intake.test.ts),
[delivery](../tests/application-delivery.test.ts),
[services](../tests/application-services.test.ts),
[CRM identity](../tests/crm-identity.test.ts),
[staff access](../tests/staff-access.test.ts),
[upload fencing](../tests/preeval-upload-fencing.test.ts),
[publication recovery](../tests/preeval-publication.test.ts),
[refund ordering](../tests/payment-refund-ordering.test.ts),
[email delivery](../tests/email-delivery.test.ts),
[formal workflow](../tests/evaluation-workflow.test.ts), and
[intake integration](../scripts/application/intake-integration.mts).
Run affected tests against disposable databases first; hosted tests need explicit
environment/provider configuration. This document does not rerun or claim those tests.

## 6. Cutover, rollback and permissions

Before a cohort switches, export a recoverable database snapshot and save the
mapping/version manifest. Rehearse restore; confirm all writers and webhook
routes are known. Prefer an application-level cohort gate in the shared repository
so existing URLs and provider metadata still resolve to the same Application ID.
The gate is not authorization: staff/customer checks must always run.

Before canonical writes begin, rollback can stop shadow work and keep old readers.
After canonical writes begin, a flag flip alone is insufficient: pause writers,
replay/reconcile canonical changes into the old-compatible representation and
only then switch back. If translation/new fields cannot be represented safely in
old tables, keep those cohorts on the new path and fix forward. Never restore a
whole old database over new payments/uploads. Preserve webhook/event ingestion
and reconcile all events received during the transition before resuming access.

Define server grants and RLS for each new table and any compatibility view. Do not
copy public browser-write privileges into canonical business tables. Keep staff notes and any retained historical migration evidence private, and
preserve office filtering before aggregations. If a
view is introduced, use caller-permission behavior where appropriate and verify
that joins do not expand access; Supabase documents the view/RLS interaction in
its [view guide](https://supabase.com/docs/guides/database/views).

Index actual query paths: application ID on children, office/created_at for CRM,
provider references on payments, and the existing queue predicates. Use FK/unique
constraints for relationships; cross-table ownership checks cannot be promised
by arbitrary JSON or an ordinary row CHECK constraint. See
[PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).
Verify server and pinned CLI versions before executing a later migration; this
plan includes no dependency upgrade or hosted CLI command.

## 7. Decisions still required

| Decision | Recommended starting choice |
| --- | --- |
| Five-table model gaps | Accept birth/residence/submission/concurrency fields and the explicit service/payment/document contracts above before SQL design |
| Pricing and delivery migration mapping | Design direction accepted: service amount fields and nullable `result` JSONB, frozen payment amounts, five business tables. Verify legacy field mapping and release/recovery equivalence before SQL implementation |
| Production namespace and old writes | Private canonical schema with preserved IDs; old public records stay compatible until their writers are retired or gated |
| Unknown/ambiguous legacy data | Keep source records and exception mapping; require reconciliation instead of guessing |
| First migrated cohort | Dedicated pre-evaluation in Preview, preserving current recovery behavior |

Customer accounts, applicant profiles, email cron/background recovery, automatic
translation pricing, multi-recipient shipping and general workflow engines are
outside this migration. The existing payment-expiry worker is a dependency to
account for, not authorization to activate new scheduling.

The [checklist](migration-checklist.md) owns execution TODOs. The proposed database
diagram now includes the accepted simple service-pricing fields and `result`;
other field recommendations remain for review. Keep a readable business diagram and a separate
operational inventory instead of placing every recovery field into one oversized SVG.
