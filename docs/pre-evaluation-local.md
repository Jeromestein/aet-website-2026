# Pre-evaluation local pilot

Implemented October 2, 2026 in `aet-website-2026`, on `dev`. This is the complete
local pre-evaluation workflow, not a production cutover or formal-evaluation
migration. The existing AET App remains operational.

## Owner-approved behavior

- Direct AI assessment with the legacy customer experience: a generated
  preliminary result appears automatically once payment is confirmed. Staff can
  correct it; mandatory staff approval is not a release gate.
- One education per application. Required: first/last name, email, residence
  country, institution, study country, degree, and start/end month and year.
  Middle name and supporting documents are optional, as in the legacy form.
- Legacy price: USD 19.00 plus the rounded legacy Stripe gross-up fee of 0.88;
  checkout total is **USD 19.88**, calculated on the server. Card and Alipay are
  enabled; acceptance exercised card payment.
- Status lookup accepts an Application ID and sends a single-use, 24-hour link
  to the registered email. The ID alone grants no access. Sessions last 24 hours.
- One staff administrator and one test recipient: `tech@meiyugroup.org`.
  All pilot email and Stripe customer email are redirected there. Legacy CC/BCC
  recipients are not used. The `office` field is retained but the operational
  pre-evaluation UI has no office selection, badges or access partitioning.
- AI uses the locally authenticated Codex ChatGPT account. There is no OpenAI
  API key, paid API call, Google OCR service or automatic production deployment.

## Open locally

- Customer start: <http://localhost:3021/degree-equivalency-tool>
- Application recovery: <http://localhost:3021/status-check>
- Staff sign-in: <http://localhost:3021/admin/login>
- Staff records: <http://localhost:3021/admin/CRM>
- Previous fictional CRM preview: `/admin/CRM/preview`, behind the same staff
  authentication. Other services in that preview remain fictional.

Customer pages share English, Chinese and Spanish routes. AI results and emails
remain English, matching the legacy result experience. The homepage uses the
local pre-evaluation destination only when `PREEVAL_ENV=local`; other deployment
configurations retain the existing portal link. All new workflow pages are
noindex and excluded from the public sitemap.

## Local setup and processes

Use `.env.example` as the variable reference; secrets belong only in the ignored
`.env.local`. The pilot rejects remote database URLs, remote origins, live Stripe
keys/events, and Dropbox roots outside the named test folder.

Prerequisites: Node 20.9+, pnpm, Docker, Stripe CLI, the bundled project Codex CLI
with an existing ChatGPT login, and Poppler (`pdfinfo` and `pdftoppm`). The current
machine uses `/opt/homebrew/bin/pdfinfo` and `/opt/homebrew/bin/pdftoppm` through
explicit environment overrides. The account's selected Codex model can be set
with `PREEVAL_CODEX_MODEL`.

```sh
pnpm install --frozen-lockfile
pnpm exec supabase start -x studio,imgproxy,storage-api,realtime,edge-runtime,logflare,vector,supavisor
pnpm dev
```

Reuse an already-running `pnpm dev` on port 3021. Run each remaining process in a
separate terminal:

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
from this directory; omit destructive volume-deletion options. Stop the listener
and worker with Ctrl+C. No production build is required or permitted locally.

## Implementation and recovery

`supabase/migrations/20261002000100_pre_evaluation.sql` owns the private `preeval`
schema: applications, education, files, payments/events, sessions/tokens, email
outbox, AI runs, audit entries and rate limits. Every table has RLS enabled and
no anonymous/authenticated grants. Server code uses the local database connection;
no browser service credentials are exposed.

Submission writes the application, education and audit together. A random request
ID and payload hash prevent duplicate retries or conflicting reuse. Customer
sessions are scoped to one application; staff permissions are checked on every
protected API operation. Access tokens are hashed, single-use and exchanged by
POST from the URL fragment, which is removed from browser history. Cross-origin
mutations are rejected; submission, token, email and payment actions are limited.

Files are private Dropbox objects under
`/Team Files/WebsitesDev/AET-PreEvaluation-Test`. Downloads pass through the
authorized backend. PDF/JPEG/PNG signatures and a 20 MB limit are checked, with
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

The email outbox records attempts, provider IDs, errors and sent state. Resend
idempotency keys prevent duplicate sends during automatic retries; result messages
are deduplicated by application/result version. Failed sends retry up to five
attempts and have a staff retry control. Workspace `sent` means accepted by
Resend, not necessarily inbox delivery; acceptance separately checked Resend's
`delivered` status. Expired access links can always be requested again.

## Acceptance evidence

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
