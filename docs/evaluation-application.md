# Formal evaluation application

Local application and processing milestone, October 2, 2026. Destination: `aet-website-2026`.
The legacy FCE form in the sibling `aet-app` is a structural reference; this
implementation does not merge Payload or copy its database or customer data.

## Customer workflow

`/credential-evaluation-application`, `/zh/credential-evaluation-application`
and `/es/credential-evaluation-application` share the same four-step form:

1. Client: purpose, office, organization/name, postal address, email, phone and
   optional fax. International telephone/postal formats are accepted; U.S.
   destinations require a state and valid ZIP code.
2. Evaluee and education: title, legal name, date of birth, and repeatable
   education records with institution, degree, country and study dates. Position
   and custom requests may omit academic history. Academic evaluations require it.
3. Services and delivery: Document-by-Document, Course-by-Course, Expert Opinion
   Letters, Position Evaluation, custom requests and optional translation.
   Additional degrees cannot exceed the entered education records. Reports can
   be PDF only or PDF with a paper copy, with additional copies, destination-based
   shipping and an independent mailing address.
4. Review: editable sections, itemized estimate, document preparation notes,
   consent and idempotent submission. A private saved confirmation can be reopened
   and printed from the same browser for 24 hours.

Tab-scoped drafts use `sessionStorage`, expire after 24 hours, survive refresh and
language changes, and are cleared after submission. Browser/session restoration
may retain tab storage according to browser settings. Consent must be reconfirmed
after refresh or any data change. No draft is sent to the server until submission.
Storage failure keeps the in-memory form usable and displays a warning.

The localized `/apply` bridge connects header, homepage, Evaluation, About,
application-method and pre-evaluation-result actions to this form only when
`PREEVAL_ENV=local`. Other environments continue to the existing portal.

## Pricing authority

`lib/pricing.ts` is the only price catalog. The form, server estimate and public
Pricing/Evaluation tables share its rate records; translations contain no fees.
The website's rates and available tiers override outdated legacy form constants:

- Expert Opinion Letters: $620 / 21 business days, $700 / 14 business days,
  $800 / 8 business days.
- International USPS Express: $88. Removed legacy UPS and Course-by-Course
  same-day options are not offered because they are absent from the website.
- Additional degrees: $40 for Document-by-Document and $60 for Course-by-Course,
  carried over from the legacy form and added to the shared website catalog.
- PDF-only report: $10; PDF with one paper copy: $20, from the legacy form,
  now shown in the shared price tables.
- Additional paper copies: the website's published $40–$60 range takes precedence
  over the conflicting $20 legacy form value. Keep the estimate as a range until
  AET confirms the exact fee; do not invent a rule assigning a fixed amount.
- Translation/custom work requires a separate quote. No additional payment processing surcharge is added to formal checkout.

Amounts are calculated as integer cents on both client and server. The server
rejects client-supplied totals and unsupported service IDs/tiers. Saved estimates
retain line items, amounts and processing times as a submission-time snapshot.

## Local persistence and access

The existing isolated local database connection is reused; no new service or
development server is needed. Apply `20261002000200_formal_evaluation.sql` and
`20261002000300_evaluation_workflow.sql` with
the normal local Supabase migration workflow. It adds a private `evaluation`
schema with JSON object constraints and RLS, without modifying pre-evaluation
tables. Both migrations have been applied to the existing local test database.

`POST /api/evaluation/applications` validates all four steps, rejects cross-origin
and oversized requests, rate-limits submissions, calculates its own estimate and
atomically saves the application. UUID request IDs and a separate random access
key make retries idempotent without granting access via the reference alone.
The access key is hashed in the database and issued in a path-scoped HTTP-only,
SameSite cookie. Customer access also expires on the server after 24 hours.
`GET /api/evaluation/applications/{id}` permits that application's browser or an
already-authenticated local administrator. Responses are private and non-cacheable.

## Processing workflow

The saved confirmation is also the customer's status page. Supporting documents
(PDF/JPG/PNG, up to 20 MB each and 20 documents) use the existing isolated Dropbox
test root, under a separate `formal-{applicationId}` directory. File signatures,
size, ownership and duplicate content are checked. Downloads require application
access and use attachment disposition; storage paths are never returned to customers.

Fixed-price selections can proceed directly to Stripe **test** Checkout. Estimates
with copy-price ranges or translation/custom services require staff confirmation.
The website-priced subtotal must stay within the original saved range; fixed
website prices cannot be overridden. Translation/custom work is a separate positive
amount with an explanation. Quotes lock while a payment is open or completed.
Checkout charges the server's confirmed total, reuses open sessions, reconciles
on the successful return, and verifies amount/currency/application identity on
signed events. The existing pre-evaluation webhook also dispatches formal events,
so the existing local listener can be reused. A dedicated formal webhook exists at
`/api/evaluation/stripe-webhook`. Only test keys/events are accepted.

`/en/admin/evaluations` reuses the existing administrator login and provides search,
status filtering, paginated cases, education and service columns, application
and delivery details, internal notes, customer-visible information requests,
quote confirmation, PDF report upload/release and audit history. Edits include an
optimistic version check. Staff cannot manually mark a payment as paid.

Processing requires verified payment and supporting documents. Publishing requires
processing status, paid status, no document upload in progress, and a PDF draft
prepared for the current supporting-document version. Customers see only the
explicitly released report. Reopening the case or receiving a refund hides it.
Unpaid cancellation expires open Checkout sessions and prevents further uploads
or payments. Cancellation of paid/refunded applications requires staff handling.

Staff can generate a private single-use link valid for 24 hours, replacing unused
prior links. Tokens are hashed, consumed atomically and exchanged for a scoped,
HTTP-only 24-hour session. Tokens travel in the URL fragment and are removed from
the visible URL before use. Staff deliver these links through their normal channel;
this workflow does not send email automatically.

## Remaining production and operational work

This is an isolated **local pilot**, not a production replacement. Automated formal
email notifications, self-service email recovery, formal report authoring/generation,
paper dispatch/tracking, additional payment methods, balance adjustments/refund
initiation, legacy data migration and production configuration remain separate.
Reports are manually prepared PDFs uploaded and explicitly released by staff.
No live payment or applicant communication was performed during this milestone.

## Verification

```sh
pnpm typecheck
pnpm check:i18n
pnpm test:evaluation
pnpm test:preeval
pnpm test:evaluation:integration
pnpm test:evaluation:workflow
# Optional: real isolated Dropbox uploads and Stripe test session creation/expiration
pnpm test:evaluation:workflow --services
```

Integration checks create disposable fictional local records, verify persistence,
price calculation, retry/ownership/expiry controls and failure handling, then
delete only those fixtures. The form-only integration test sends no email, starts no payment and uploads no files.
The workflow integration test uses signed synthetic payment events in disposable
local records. Its optional `--services` mode additionally uploads a synthetic
one-pixel image to the Dropbox test root, downloads it, creates/reuses a real Stripe
test Checkout session and expires it. Local records are cleaned up; synthetic
Dropbox files remain in the isolated test directory. No emails are sent.
`browser-fixture.ts` prepares an explicitly fictional case, private ignored access
links and a synthetic report for interactive acceptance. Do not share its access file.
Browser verification and screenshots are recorded in `docs/status.md`.
Production build, push and deployment remain with the owner.
