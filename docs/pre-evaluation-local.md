# Pre-evaluation local pilot

Implemented October 2, 2026 in `aet-website-2026`, on `dev`. This is the complete
local pre-evaluation workflow, not a production cutover or formal-evaluation
migration. The existing AET App remains operational.

## Current cloud preview — updated October 20, 2026

The current `aet-website-2026-dev` preview on **3022** connects directly to the
existing cloud Supabase project using restricted private preview schemas.
**Docker is not required.** The owner already runs the Next development server.
Do not start the local database, Stripe listener or external worker for this mode.
The older pilot payment, email-worker and AI external-service guards remain in
place. Dropbox files are enabled separately by `DROPBOX_DOCUMENTS_ENABLED` and
share the Status/CRM storage integration. The newer formal intake has its own
confirmation sender and recorded test delivery; mail is not globally disabled.
Employee migration and staff cutover remain disabled.

See [the active configuration and acceptance procedure](staff-auth.md#cloud-business-preview).
The setup below documents the earlier optional local-database/service pilot;
its test fixtures and Docker commands are not the current cloud workflow.
Current password-based staff login and office scopes are documented in
[staff-auth.md](staff-auth.md). Historical email-login descriptions below are
superseded by that document; staff email-link login has been removed.

## Owner-approved behavior

- Direct AI assessment with the legacy customer experience: a generated
  preliminary result appears automatically once payment is confirmed. Staff can
  correct it; mandatory staff approval is not a release gate.
- One education in the customer form, matching the old visible form. Existing
  multiple-education records remain supported by the business tables and are not
  merged or discarded. Required: first/last name, email, residence
  country, institution, study country, degree, and start/end month and year.
  Middle name and supporting documents are optional, as in the legacy form.
  Country selections submit the original codes; study dates are saved as
  `{year, month}` in the existing education table. The second step includes the
  optional document picker; files upload after successful application creation.
  Upload failures show a retry message on the saved application.
- Legacy price: USD 19.00 plus the rounded legacy Stripe gross-up fee of 0.88;
  checkout total is **USD 19.88**, calculated on the server. Card and Alipay are
  enabled; acceptance exercised card payment.
- Status lookup opens the application directly from its complete Application ID,
  matching the legacy app. Confirmation emails include the ID, education summary,
  exact fee and a reusable application URL. No customer account, password or extra
  email-verification step is required. The ID is an access credential and should
  remain private. Internal HTTP-only sessions last 24 hours; the same ID/link
  transparently restores access after expiry. Result emails include the paid
  equivalency and assessment basis.
- The three-step form saves its fields and current step in the browser tab, with
  a Start over action. Refreshing restores the draft; optional files must be
  reselected and the terms must be accepted again. Successful submission clears
  the saved draft.
- One staff administrator and one test recipient: `tech@meiyugroup.org`.
  All pilot email and Stripe customer email are redirected there. Legacy CC/BCC
  recipients are not used. The `office` field is retained but the operational
  pre-evaluation UI has no office selection, badges or access partitioning.
- AI uses the locally authenticated Codex ChatGPT account. There is no OpenAI
  API key, paid API call, Google OCR service or automatic production deployment.

## Open locally

Use the dev worktree at `/Users/plusone/Desktop/Code/aet-website-2026-dev`.
Its current preview and local application origins use port 3022:

- Customer start: <http://localhost:3022/degree-equivalency-tool>
- Application status: <http://localhost:3022/status-check>
- Staff sign-in: <http://localhost:3022/admin/login>
- Staff records: <http://localhost:3022/admin/CRM>
- Previous fictional CRM preview: `/admin/CRM/preview`, behind the same staff
  authentication. Other services in that preview remain fictional.

Staff login, email-link confirmation and dashboard pages are English-only.
New staff links open `/admin/access`; `/en/admin/*`, `/zh/admin/*`, `/es/admin/*`
and lowercase `/admin/crm` redirect to canonical unprefixed staff URLs. Staff
pages have no language selector and do not overwrite the saved website language.
Staff authentication is maintained independently; see [staff authentication](staff-auth.md).
The intended production dashboard remains
`https://app.americantranslationservice.com/admin/CRM`. Hostname routing and
deployment remain pending; see [the deployment proposal](../README.md#application-domains-and-staff-urls).

Customer pages share English, Chinese and Spanish routes. AI results and emails
remain English, matching the legacy result experience. The homepage uses the
local pre-evaluation destination only when `PREEVAL_ENV=local`; other deployment
configurations retain the existing portal link. All new workflow pages are
noindex and excluded from the public sitemap.

## Legacy URL compatibility

The three pre-evaluation paths (start, application and success) are retained,
including the `applicationId` query parameter through language redirects. This
does not establish complete AET App URL parity: the old formal `/status` route,
checkout routes and four standalone staff-tool URLs still return 404. The new
`/status-check` is pre-evaluation-only. See the
[October 15 route audit](app-url-compatibility.md) for the mapping and follow-up
work; existing production email links and app-domain routing need separate checks.

## Local setup and processes

Use `.env.example` as the variable reference; secrets belong only in the ignored
`.env.local`. In the dev worktree, `PREEVAL_ORIGIN` and `PAYMENT_SITE_URL` are
`http://localhost:3022`; `PREEVAL_ADMIN_EMAIL` and `PREEVAL_TEST_EMAIL` both use
`tech@meiyugroup.org`. `PREEVAL_CODEX_BIN` points to the dev worktree's installed
Codex executable. Reuse the configured local database and test services without
copying secrets into documentation. This guide and its service acceptance require
`PREEVAL_DATABASE_MODE=local` and the isolated local database on port 55422.
A separately configured `cloud-preview` mode disables external services and uses
different business tables; do not run these local fixture scripts against it.
Do not overwrite another session's environment to switch modes. The local service
pilot rejects remote database URLs, remote origins, live Stripe keys/events and
Dropbox roots outside the named test folder.

Prerequisites: Node 20.9+, pnpm, Docker, Stripe CLI, the bundled project Codex CLI
with an existing ChatGPT login, and Poppler (`pdfinfo` and `pdftoppm`). The current
machine uses `/opt/homebrew/bin/pdfinfo` and `/opt/homebrew/bin/pdftoppm` through
explicit environment overrides. The account's selected Codex model can be set
with `PREEVAL_CODEX_MODEL`.

```sh
pnpm install --frozen-lockfile
pnpm exec supabase start -x studio,imgproxy,storage-api,realtime,edge-runtime,logflare,vector,supavisor
pnpm exec next dev --port 3022
```

Run setup/start commands only for services that are not already available.
The owner starts the dev server in VS Code; reuse that running port 3022 server.
`pnpm dev` still hardcodes port 3021, which is used by the main checkout. See
[the worktree setup](../README.md#main-and-dev-worktrees). Run each remaining
process from the dev worktree in a separate terminal:

```sh
node --env-file=.env.local scripts/preeval/stripe-listen.mjs
pnpm preeval:worker
```

The Stripe listener forwards only relevant test events to
`/api/pre-evaluation/stripe-webhook` and updates the signing secret privately in
`.env.local`. The development server reloads this file. Restart a user-managed
server if it does not pick up that change. The worker drains durable AI and email
queues; it must remain running for new assessments. `pnpm preeval:worker --once`
processes one cycle. The worker needs normal access to the existing local Codex
login; running it inside a filesystem sandbox that denies Codex app-server state
writes fails even though the assessment subprocess itself is read-only.

This project has an isolated Supabase project ID `aet-pre-evaluation-local`, API
port 55421 and database port 55422. It does not reset or reuse another project's
Supabase instance. Stop this project's database with `pnpm exec supabase stop`
from this directory; omit destructive volume-deletion options. After local
Supabase migrations, run `pnpm legacy:setup` once to prepare the compatible
business-table fixture and workflow bridge. Stop the listener
and worker with Ctrl+C. No production build is required or permitted locally.

## Implementation and recovery

`supabase/migrations/20261002000100_pre_evaluation.sql` owns the private `preeval`
schema: applications, education, files, payments/events, sessions/tokens, email
outbox, AI runs, audit entries and rate limits. Every table has RLS enabled and
no anonymous/authenticated grants. Server code uses the local database connection;
no browser service credentials are exposed.

Submission atomically writes `public.aet_core_applications`,
`public.aet_core_educations` and the auxiliary application/education/audit rows.
Payment transitions write `public.aet_core_payments`; AI results update only the
matching education ID in the original JSON-string format. The original tables
have no residence-country column, so that value remains in the auxiliary table.
No column was added to the original tables. See
[the field mapping and compatibility boundary](legacy-form-compatibility.md). A random request
ID and payload hash prevent duplicate retries or conflicting reuse. Customer
sessions are scoped to one application; staff permissions are checked on every
protected API operation. The customer lookup endpoint validates a complete UUID,
limits request size and request frequency, sets a private session cookie and
returns a localized application URL. It neither sends email nor grants staff
access. Customer responses explicitly project education fields: legacy `ai_output`
must never bypass the unpaid/refunded result gate. Previously issued single-use
links remain compatible; new customer messages use the reusable ID URL.
Cross-origin mutations are rejected; submission, lookup, token, email and payment
actions are limited.

New pre-evaluation files are private Dropbox objects under
`/Team Files/WebsitesDev/Miami/{applicant full name} - {application ID}`; FCE uses
the same folder rule in its assigned office/account. The actual location is
saved, and per-file paths remain authoritative for reads/retries. Historical
`/Team Files/WebsitesDev/AET-PreEvaluation-Test/...` files and legacy email folders
remain compatible. See [Dropbox storage rules and current verification](dropbox.md).
Downloads pass through the authorized backend. PDF/JPEG/PNG signatures and a
20 MB limit are checked, with
five files per application. Identical uploads are deduplicated; interrupted
uploads can be retried after their two-minute lease. PDF processing permits ten
pages per file and twenty total image pages. An oversized/encrypted/unreadable
PDF leaves an actionable AI failure, not a fabricated result.

PDFs are rendered to images, and Codex reads the pages directly. There is no OCR
stage. Form names/emails/payment data are excluded from the AI prompt; uploaded
images can contain their original document content. Inputs are untrusted evidence,
shell/web/MCP tools are disabled, output is schema-validated, and temporary files
are removed. Each run records its input version and output; superseded work
cannot overwrite a newer upload or staff correction. Interrupted or failed AI
runs remain visible and can be retried in the workspace.

Stripe signs payment callbacks. Amount, currency, application ownership and
session identity must match the saved payment; event IDs are deduplicated. A
server-side Stripe reconciliation handles a missed callback on return/refresh.
Unpaid cancellation expires open checkout sessions. Paid cancellation requires
staff contact. Partial/full refunds hide the result; refund events cannot regress
an already-recorded refund. This pilot does not initiate refunds from the UI.

Email templates are React Email components in `lib/preeval/email-template.tsx`.
The outbox stores delivery metadata and business references only, never a subject
or rendered HTML. Send-time rendering reads the application and education records.
Result mail references `result_version`; superseded, cancelled or withheld results
are not sent. Information requests are application audit records with their own
message text; the delivery row stores only that record ID. This preserves the
original staff request without storing an email copy.

Resend idempotency keys use the stable delivery UUID. A SHA-256 digest detects
changed rendered content on retries; a mismatch pauses delivery for review. The
sender records provider receipts, sanitized errors, attempts, leases and cooldowns.
Failed sends retry up to five attempts, with a 60-second delay and three-minute
stale-lease recovery. Retry is limited to 23 hours from the first attempt, including
manual retries. Changed-content/legacy-review records require reconciliation and
cannot be forced through the ordinary retry control.

Staff use account/password login only. The administrator email template and
sender have been removed; historical administrator queue entries are rejected
before rendering or delivery. Customer notifications remain test-contained;
the cloud-preview worker is still disabled. The historical `access_token` column
is unused; no cloud schema or stored records were modified for this removal.

Apply `20261020165103_email_delivery_records.sql` through the local migration
workflow, or use `scripts/email/migrate-delivery-records.mts` for the isolated
preview. Never apply preview schema changes to production. Legacy unsent messages
without reproducible references are retained as failed/review-required records;
sent records keep their original IDs and provider receipts. Workspace `sent` means accepted by
Resend, not necessarily inbox delivery; acceptance separately checked Resend's
`delivered` status. Customers can always reopen their application using its ID
or the reusable link in the confirmation email.

## Customer-flow acceptance — October 15, 2026

This pass supersedes the earlier customer email-link recovery requirement below.
It preserves legacy required fields, optional files, USD 19.88 pricing and automatic
paid results while using the new pale-blue, navy and orange website theme.

- 44 focused unit tests passed (pre-evaluation, customer lookup/email and legacy
  application fields); TypeScript and the 466-key locale check passed.
- 31 customer integration assertions passed: direct and repeated ID lookup,
  normalization, invalid/unknown IDs, expired-session recovery, no extra email,
  cross-application/staff denial, bounded requests and unpaid/refunded result
  protection, including legacy education output. The disposable fixtures were
  removed. `scripts/preeval/customer-integration.ts` refuses cloud-preview mode.
- The existing 21 integration assertions passed again, including real Stripe
  sandbox checkout, USD 19.88, checkout reuse, cancellation and session expiry.
- In-app browser verified three-step submission, draft restoration after refresh,
  Start over, invalid-ID feedback, direct status lookup, language switching,
  optional PDF upload, sandbox card payment and automatic paid result display.
  Desktop and 390px mobile form/status/result views passed visual inspection;
  mobile page width and scroll width were both 390px.
- A fictional one-page PDF completed a byte-identical 745-byte Dropbox upload and
  download. The local Codex account generated a real assessment and correctly
  returned `Unable to determine` for the explicitly synthetic qualification.
  This proves the workflow, not real-world assessment accuracy.
- Resend reported `delivered` for both confirmation and result messages to
  `tech@meiyugroup.org`. Both contained the full ID, education and reusable link;
  the result message also contained the equivalency and reasoning.
- The owner-managed 3022 environment changed to cloud preview during payment
  acceptance. Its configuration was preserved. Payment reconciliation and the
  remaining checks ran against an isolated temporary source snapshot on 3023
  with the existing local database. The temporary server was stopped afterward;
  no persistent worker was left running. A local browser fixture cannot be looked
  up in the separate cloud-preview database.
- Evidence: `output/playwright/preeval-customer-{form-mobile,result-mobile,result-desktop}-2026-10-15.jpg`.
  Private regression reports remain in `.local/`. No build, deployment, bulk
  migration, commit or push was performed by this pass. Staff-login changes and
  production rollout are separate work.

Run the customer regression only with a matching local server/database:

```sh
node --env-file=.env.local --import tsx scripts/preeval/customer-integration.ts
```

## Earlier acceptance evidence

The service/payment/email checks below describe the earlier pilot milestone.
The later form-compatibility pass used 98 unit tests, 13 rollback-only database
checks and browser form navigation; it did not repeat external email, AI,
Dropbox or Stripe operations. See [current status](status.md).

Verified against the existing local development server and isolated Supabase:

- 18 domain checks: required/optional fields, date order, allowed input shape,
  legacy fee calculation, paywall and file signatures.
- 21 API integration checks: atomic/idempotent submission, unauthorized access,
  cross-origin rejection, invalid file/token/signature, real Stripe test checkout,
  fixed amount, checkout reuse, cancellation and expiry.
- 30 lifecycle checks: application/file access isolation, exact Dropbox byte
  round-trip, upload deduplication and interrupted-upload recovery, one-time and
  expired tokens/sessions, payment replay/mismatch checks, stable result timestamps,
  email deduplication and a real rejected-then-successful Resend retry, staff edits,
  information holds, refund ordering and logout invalidation.
- In-app browser: complete customer form, optional PDF upload, actual Stripe
  **sandbox card payment**, automatic AI result unlock, email-link recovery,
  administrator login, persistent notes, supplemental-information request and
  staff result correction. Desktop and 390px mobile layouts checked; Chinese
  and Spanish routes use the same business logic.
- Codex account authentication generated a real result first from form fields,
  then from the uploaded fictional PDF. It recognized the fixture as fictional
  and declined to establish a degree from it. No genuine customer document was
  sent to AI during acceptance.
- Resend confirmed delivery of confirmation, result and recovery messages to
  `tech@meiyugroup.org`; additional test notifications use that same recipient.
- Exactly three historical pre-evaluation records were read through the old
  Supabase API: one completed/paid and two submitted without payment. Each had
  one education and an existing AI output; dates use `{year, month}`. Only a
  structural, de-identified report was saved locally. No historical rows or
  attachments were migrated and no old record was changed.

Refund and asynchronous-payment-failure checks use constructed events on an
isolated synthetic local record. They are not claims of real refunds or Alipay
completion. Provider production settings, real charging, hosted workers, API
billing, production email routing, full data migration and domain cutover remain
outside this local pilot.

```sh
pnpm typecheck
pnpm check:i18n
pnpm test:preeval
pnpm test:preeval:integration
node --env-file=.env.local --import tsx scripts/preeval/lifecycle.ts
```

Integration creates a disposable local application, sends a controlled test email
and creates/expires a real Stripe test checkout. Lifecycle checks additionally
require a paid browser-acceptance application with the root fictional PDF fixture.
They operate on the integration fixture and may send retry-test mail. Private
reports are in ignored `.local/`; browser evidence is in ignored
`output/playwright/preeval-*.jpg`. `inspect-legacy.ts` is an explicitly run,
read-only three-record inspection, never an automatic startup step.
