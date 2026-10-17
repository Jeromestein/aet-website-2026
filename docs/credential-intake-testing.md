# Credential intake: local database and email acceptance

## Scope

The unified `/application?service=evaluation` flow saves credential evaluation only.
Contact, identity, all education records, selected qualification associations,
services, server-priced fee ranges, report format, mailing address and shipping
are preserved. Other unified service selections remain previews. No document
upload, payment, user-account system, staff authentication migration or deployment
is included in this milestone.

## Storage and isolation

The current dev configuration uses the existing Supabase PostgreSQL project
`qrxztgdemfodemlcabcq`, not a local Docker database. The website runs locally at
`http://localhost:3022`; business test rows are isolated by schema and DB role.

| Location | Purpose |
| --- | --- |
| `aet_preview_evaluation.applications` | Canonical complete `data.intake` (version 2), request ID/hash, saved quote and Application ID |
| `aet_preview_legacy.fce_applications` | Same-ID compatibility projection for existing CRM list conventions |
| `aet_preview_legacy.fce_educations` | Education rows, with selected IDs recorded in `service_type.websiteQuote.selectedEducationIds` |
| `aet_preview_evaluation.intake_emails` | One immutable confirmation per application, attempt/lease state and Resend message ID |
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
`PREEVAL_ORIGIN=http://localhost:3022`, disabled employee/auth cutover flags, and
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
node --env-file=.env.local --conditions=react-server --import tsx scripts/application/intake-integration.mts
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
invented payment deadline. File selection remains local and upload disabled;
payment controls are disabled when there is no connected payment destination.
On 2026-10-17 the unified page passed desktop/mobile checks for both sources,
279 unit/regression tests and 26 database/HTTP assertions. The additional run
used simulated mail transport only and removed its disposable records.

## Email behavior

The new sender is restricted to this preview workflow and
`errplusone@gmail.com`, enforced in code and the outbox constraint. It never drains
the existing pre-evaluation queue or sends to the entered client email, admin
email, CC or BCC. Existing staff-auth/pre-evaluation settings are not changed.

The response completes after database commit; Next.js `after()` attempts delivery.
A failed/crashed sender leaves a durable retryable outbox row. Customer status and
staff details expose retry to the same fixed recipient. Retry uses a 60-second
cooldown, a claimed lease, and the immutable outbox UUID as Resend's idempotency key.
A stale lease can be reclaimed after three minutes. Sent rows are not resent.
Unresolved attempts older than 23 hours require staff reconciliation instead of
risking a duplicate beyond the provider's idempotency retention window.

The UI's “Accepted by email provider” is not an inbox/read receipt. Provider
`last_event=delivered` was separately checked in acceptance. Local links open only
where the port-3022 server is accessible. The current test template is English;
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
queue scheduling, payment/upload and subsequent staff processing remain separate
work. This local milestone must not be represented as production readiness.
