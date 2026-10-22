# Credential intake: database and email acceptance

Current progress was reconciled on October 20, 2026. The dated October 17 tests
below remain historical evidence. See the [current checklist](migration-checklist.md)
and [progress analysis](status.md#2026-10-20--reconcile-dev-progress) for the integrated dev scope.

## Scope

The unified `/application?service=evaluation` flow saves credential evaluation only.
Contact, identity, all education records, selected qualification associations,
services, server-priced fee ranges, report format, mailing address and shipping
are preserved. Other unified service selections remain previews. The initial
October 17 milestone covered persistence and email. Subsequent dev work connected
Status uploads, CRM document inspection and hosted Preview acceptance. New-intake
payment, staff processing and production cutover remain open.

## Storage and isolation

The dev configuration uses the existing Supabase PostgreSQL project
`qrxztgdemfodemlcabcq`, not a local Docker database. Supported runtimes are local
`http://localhost:3022` and the exact configured dev Preview origin documented in
[README](../README.md#vercel-dev-preview). Business test rows are isolated by
schema and DB role; this does not isolate shared live CRM or Dropbox resources.

| Location | Purpose |
| --- | --- |
| `aet_preview_evaluation.applications` | Canonical complete `data.intake` (version 2), request ID/hash, saved quote and Application ID |
| `aet_preview_legacy.fce_applications` | Same-ID compatibility projection for existing CRM list conventions |
| `aet_preview_legacy.fce_educations` | Education rows, with selected IDs recorded in `service_type.websiteQuote.selectedEducationIds` |
| `aet_preview_evaluation.intake_emails` | One delivery record per application, attempt/lease state, content digest and Resend message ID |
| `aet_preview_evaluation.audit` | Submission event |

All application rows, education rows, quote and outbox entry commit together.
`request_id` is unique; exact retries return the original application, changed
replays return 409. No client-provided amount is accepted. The runtime role cannot
insert into production `public.fce_applications`; table mapping and the intake
preview guard reject non-preview operation. Production CRM remains the default.

The preview-only migration allows optional birth dates and international phones
and postal codes, removes a cloned legacy check that mistakenly restricted
payment_status to office names, and creates the RLS-protected confirmation outbox.
It does not alter production tables. The old workflow endpoints reject version-2
intakes to prevent legacy edits from overwriting the saved snapshot.

## Setup and checks

Use the existing dev `.env.local`. Do not copy keys into documentation. Required
configuration is the existing restricted cloud-preview database connection,
`APP_ORIGIN=http://localhost:3022`, disabled employee/auth cutover flags, and
Resend key/from-address settings. No environment change or server restart was
needed for the acceptance run.

Apply only to the configured preview project:

```sh
node --env-file=.env.local --import tsx scripts/application/migrate-preview.mts
```

Run the owner-managed dev server as usual. Then:

```sh
pnpm exec vitest run
pnpm exec tsc --noEmit --incremental false
pnpm check:i18n
pnpm test:intake:integration
```

The integration script creates and deletes its own synthetic rows. Its email
transport is injected and sends no real messages. Do not use real applicant data.

## Shared customer status page

Both sources return the normalized `CustomerStatus` contract from
`/api/customer-status`. The explicit `source=preview` query selects isolated intake
storage; it never falls back to production. The customer UI has one rendering path
with the existing application status, next steps, documents, services, payment,
client and education cards. Saved quote/delivery details and email state enrich
these cards when data exists, regardless of source. Historical missing details
remain labeled unavailable. The staff drawer still uses its compact summary.

Isolated applications show a source label, have no production portal URL and no
invented payment deadline. Status now lists and uploads files using server-derived
Dropbox access; CRM uses the same folder resolver. New-intake payment controls
remain disabled. See [document behavior and boundaries](dropbox.md).
On 2026-10-17 the earlier unified page passed desktop/mobile checks for both sources,
279 unit/regression tests and 26 database/HTTP assertions. The additional run
used simulated mail transport only and removed its disposable records.

## Email behavior

React Email templates live in `lib/application/intake-template.tsx` and share
`lib/email/branded-layout.tsx`. Submission stores only the application reference and
recipient in the delivery table. The sender reads saved application/education and
quote data, renders the template in memory, and sends through Resend. Neither the
subject nor HTML is stored in the database.

Delivery records retain IDs, recipient, state, attempt/lease/cooldown timestamps,
provider receipt, a sanitized error code and a SHA-256 content digest. The digest
cannot reconstruct the message; it prevents a retry from using changed content
under the same provider idempotency key. Changed content pauses delivery for
reconciliation instead of silently sending a different message.

The October 20 migration was applied only to the isolated preview. Existing sent
IDs, states and provider receipts were preserved. For other approved local or
preview databases, run `node --env-file=.env.local --import tsx
scripts/email/migrate-delivery-records.mts`. The migration removes stored subjects
and HTML; any legacy attempted/pending message without reproducible references is
held for review. It never sends mail or resets sent rows. `migrate-preview.mts`
also applies the new schema. Production deployment remains separate.

Standalone email checks use `scripts/register-server-only.mjs` to load server-only
modules without enabling the global `react-server` condition, which is incompatible
with React Email's HTML renderer. `pnpm test:email:records` verifies pre-evaluation
references using disposable preview rows and never sends mail.

The new sender's To recipient is restricted to this preview workflow and
`errplusone@gmail.com`, enforced in code and the outbox constraint. It also copies
the assigned office through `officeCc`, as implemented after the initial milestone.
It does not send to the entered client email or drain the pre-evaluation queue.
See [current office routing](email-templates.md#sender-and-office-copies).

The response completes after database commit; Next.js `after()` attempts delivery.
A failed/crashed sender leaves a durable retryable outbox row. Customer status and
staff details expose retry to the same fixed recipient. Retry uses a 60-second
cooldown, a claimed lease, and the immutable outbox UUID as Resend's idempotency key.
A stale lease can be reclaimed after three minutes. Sent rows are not resent.
Unresolved attempts older than 23 hours require staff reconciliation instead of
risking a duplicate beyond the provider's idempotency retention window.

The UI's “Accepted by email provider” is not an inbox/read receipt. Provider
`last_event=delivered` was separately checked in acceptance. Links use the configured
origin: local links require access to port 3022; hosted links use dev Preview.
The current test template is English;
form/status UI supports English, Chinese and Spanish; staff UI remains English.

## Local acceptance, 2026-10-17

- Five concurrent saves: one Application ID and one confirmation row.
- Conflicting replay 409; invalid/unsupported data 400; cross-origin POST 403.
- Actual database save, selected-education association and immutable fee snapshot.
- Simulated mail outage retains application; cooldown and concurrent retries
  enforced; successful retries do not send another message on later calls.
- Customer status is explicit preview-only, with unknown IDs returning 404;
  default live status cannot find a preview ID.
- Unauthenticated staff APIs return 401; nonmatching office has no test rows.
- 24 reproducible integration assertions pass. 275 unit/regression tests pass.
- Two real Resend confirmations to the approved inbox returned `delivered`:
  - Browser/paper-report test: `e1b9c321-3b72-4b17-a753-5ca6470b30cd`.
  - Same-day course/retry test: `fd3e1dc4-3b20-440d-816c-22f4441ba9f3`.
- These two synthetic applications remain for owner review. They contain no real
  applicant data. The repeatable integration fixture was deleted after testing.
- In-app browser verified submission, saved-ID link, reload persistence, customer
  receipt and authenticated CRM list/detail. Desktop 1440px and mobile 390px checks
  passed; currency strings remain intact with no horizontal overflow.

Review paths:

- `/zh/application?service=evaluation`
- `/zh/status?source=preview&applicationId=e1b9c321-3b72-4b17-a753-5ca6470b30cd`
- `/admin/CRM?source=preview`

Production configuration/cutover, production schema compatibility, long-running
queue scheduling, application-linked payment and subsequent staff processing
remain separate work. Upload/list integration has since passed recorded hosted
acceptance. Neither that acceptance nor this initial milestone establishes
production readiness.
