# Pre-evaluation local pilot

## October 22 full customer journey acceptance

The owner accepted the existing 3/4 full-match benchmark and authorized a
synthetic browser submission, Dropbox upload, real GPT analysis and test emails
only to `errplusone@gmail.com`. The checklist was updated first. The owner
restarted the existing 3022 Next server after the ignored email configuration
changed; no second worker or development server was started.

The run exposed disabled pre-evaluation delivery in cloud preview. The fix adds
`PREEVAL_EMAIL_ENABLED` (false by default in `.env.example`) and a UUID-scoped
sender. It filters both eligible and interrupted deliveries by application and
configured recipient; unscoped cloud draining remains disabled. Submission,
authorized reads, AI completion, staff actions and applicable payment callbacks
schedule delivery through Next `after()`. A send failure leaves the saved
application/result intact and preserves the existing retry/idempotency policy.
Customer copy now distinguishes a visible completed result from a result still
withheld for payment, in all three supported languages.

### Observed results

- One synthetic application: `1a25c57d-194c-4c53-9500-b1623886f6e7`, named
  `AET Journey 20261022 Test`. Its two-page PDF is clearly labeled synthetic.
- Data resides in the restricted Supabase preview schemas, not a local Docker
  database. Runtime role `aet_preview_runtime` has no INSERT on the production
  application table; no production or historical records were modified.
- Dropbox saved the file under
  `/Team Files/WebsitesDev/Miami/AET Journey 20261022 Test - 1a25c57d-194c-4c53-9500-b1623886f6e7/`.
  One 1,805-byte file is ready. An authenticated customer download has the exact
  SHA-256 of the original; the AI run records that same hash, Dropbox revision,
  two pages and `basis=documents`.
- One automatic `gpt-6.1-sol` / `preeval-direct-pages-v3` call returned a
  hypothetical Bachelor of Science in Computer Science and explicitly noted the
  document is synthetic. All six saved evidence references match the authored
  page locations. This functional fixture does not extend the accuracy benchmark.
- Submission was saved at 16:49:36.428 UTC; upload audit at 16:49:40.006;
  AI run at 16:49:40.683–16:49:53.010. Upload took 3.58 seconds from save;
  the persisted AI run took 12.33 seconds, and submission-to-result was 16.58.
  Usage: 1,166 input + 431 output = 1,597 tokens. These are single-run timings.
- A fresh customer-only HTTP session, obtained using the Application ID lookup,
  could download the PDF but received `result=null` before payment. Anonymous
  application access returned 401. No result email existed while unpaid.
  The in-app browser already had staff access, which intentionally permits
  unpaid result review; customer restrictions were therefore checked separately.
- An exact-ID, guarded synthetic paid-state transition recorded
  `test.payment_fixture` with `noCharge=true`. Normal `publishIfReady` then
  completed the application and queued result delivery. No Stripe session,
  charge or webhook was created or simulated as a provider event.
- Confirmation receipt `01a16484-a709-7d6c-9fef-8fba9d721f0a` and result receipt
  `01a16486-034f-7425-acd3-c4f0eabd6bec` both report Resend `delivered`.
  Each has one attempt, only `errplusone@gmail.com`, no CC/BCC, the correct
  Application ID and a localhost result link. The result email matches the
  stored result. Mail-server acceptance is not inbox/open confirmation.
- Repeated upload completion, publication and authorized reads retained exactly
  one analysis and one email of each kind. Reload and reopening the result link
  preserved the output. CRM Test search/detail shows the same applicant,
  Pre-Evaluation service, one document, Paid/Completed and the AI result.
- In-app desktop 1280px and mobile 390px result checks passed, including the
  corrected completed-state copy, full degree title, file row and footer; mobile
  document width equals viewport width. The full automated suite passed 498
  tests; TypeScript and whitespace checks passed. No production build was run.

### Retained evidence and remaining boundaries

Private evidence lives in ignored `.local/preeval-journey/2026-10-22/`: original
and downloaded PDFs, fixture, database/run snapshot, customer unpaid/paid payloads,
verification assertions, two rendered test emails, Resend receipts and browser
screenshots. Scripts there are acceptance artifacts, not a production worker.
The synthetic application and Dropbox file remain available for owner review.

The result is at
`http://localhost:3022/zh/degree-equivalency-tool/application/success?applicationId=1a25c57d-194c-4c53-9500-b1623886f6e7`.
Email links require this local server and are not a public deployment. Stripe
checkout/webhook and hosted Vercel execution remain separate acceptance work;
this run validates the paid release gate using a fixture, not actual payment.
The production recipient strategy and deployment cutover remain unchanged.

## October 21 refinement: US equivalency and physical-page evidence

The current `preeval-direct-pages-v3` prompt returns structured US degree, field
and concentration separately from the original foreign qualification. The server
assembles the full customer title. PDF pages are provided as individually identified
single-page copies, without OCR or modifying originals; evidence IDs resolve to
source document/page positions on the server and retain short supporting excerpts.
Unknown IDs are rejected. Location integrity does not prove semantic support, so
source review remains necessary. Historical output stays readable. See the
[benchmark design and comparison](preeval-benchmark.md).


Implemented October 2, 2026 in `aet-website-2026`, on `dev`. This is the complete
local pre-evaluation workflow, not a production cutover or formal-evaluation
migration. The existing AET App remains operational.

## Current cloud preview — updated October 22, 2026

The current `aet-website-2026-dev` preview on **3022** connects directly to the
existing cloud Supabase project using restricted private preview schemas.
**Docker is not required.** The owner already runs the Next development server.
Do not start the local database, Stripe listener or older combined email/payment
worker for this mode.
The older pilot payment and email-worker external-service guards remain in
place. GPT analysis has its own explicit switch and runs inside the existing Next service. Dropbox files are enabled separately by `DROPBOX_DOCUMENTS_ENABLED` and
share the Status/CRM storage integration. Pre-evaluation mail is now opt-in through `PREEVAL_EMAIL_ENABLED=true` and requires
a valid application ID in cloud preview. Submission, authorized reads and the
managed AI scheduler dispatch only that application's eligible mail to
`PREEVAL_TEST_EMAIL`; historical recipients and unscoped queue drains are excluded.
The newer formal intake retains its own confirmation sender.
Employee migration and staff cutover remain disabled.

See [the active configuration and acceptance procedure](staff-auth.md#cloud-business-preview).
The setup below documents the earlier optional local-database/service pilot;
its test fixtures and Docker commands are not the current cloud workflow.
Current password-based staff login and office scopes are documented in
[staff-auth.md](staff-auth.md). Historical email-login descriptions below are
superseded by that document; staff email-link login has been removed.

## Direct GPT analysis — October 20, 2026

The checklist was updated before implementation. The active path is:

`Submit → upload to Dropbox → confirm the entire batch → durable AI queue →
read original Dropbox revisions → OpenAI Responses → save result → release after payment`.

### Owner setup on dev / port 3022

The owner configured `OPENAI_API_KEY` in the dev worktree's ignored `.env.local`
and live acceptance passed below. For a fresh checkout, fill that variable. The local
`PREEVAL_AI_ENABLED=true` and `PREEVAL_OPENAI_MODEL=gpt-6.1-sol` placeholders
are prepared; existing values are never replaced by setup. Keep the key out of
browser code, chat, Git and documentation. After saving environment changes,
restart your existing Next dev command in VS Code:

```sh
pnpm exec next dev --port 3022
```

**Only the existing Next server is needed.** Eligible submissions, completed upload
batches and explicit retries schedule analysis with Next `after()`. The HTTP
response returns first; the server awaits the analysis in that request's managed
background lifetime. Authenticated customer/staff application reads also resume
due or interrupted jobs. The customer result page polls while visible.

No AI request runs if the switch is disabled or the key is absent. Only the
`openai` pipeline is eligible; historical `legacy` jobs are not automatically
processed. An explicit staff retry opts an old pilot application into this pipeline.
The analysis processor itself does not invoke Stripe or send mail. After it
returns, the Next scheduler attempts application-scoped delivery; failures remain
in the outbox and cannot undo a saved analysis. Authorized reads also retry due
mail within the existing cooldown and attempt limits. The old combined
email/payment worker remains disabled in cloud preview.

The CLI remains an optional diagnostic tool, not a prerequisite for the website:

```sh
pnpm preeval:ai --application <application-id>
# Optional continuous diagnostics only; normally unnecessary.
pnpm preeval:ai --watch
```

### Vercel execution and free-tier technical limits

The same Next project serves the page and executes analysis. No separate worker
service, paid queue or minute-level Cron is required. The three execution routes
use Node.js with `maxDuration = 300`; verify **Fluid Compute is enabled** before
hosted acceptance. The OpenAI request itself times out after 150 seconds; Dropbox
and database work also consume the function budget. A platform timeout can still
interrupt a run. The saved lease becomes recoverable after eight minutes without
a heartbeat, respecting the three-attempt cap and retry backoff. Failed/exhausted
jobs require explicit customer/staff retry; page views do not reset the cap.

The optional daily fallback is configured in `vercel.json`:

```json
{"crons":[{"path":"/api/internal/pre-evaluation/process","schedule":"0 9 * * *"}]}
```

This requests one run daily at **09:00 UTC**. Hobby may invoke it anywhere within
that hour. Each invocation considers at most three eligible applications and
waits for those attempts; it does not drain the entire queue or wait through
backoff. Without page visits, a missed/transient job may wait until the next daily
run; backlog can take longer. This is not a guaranteed prompt-recovery service.

For a future authorized deployment:

1. Add server-only `OPENAI_API_KEY`, `PREEVAL_AI_ENABLED=true` and the selected
   `PREEVAL_OPENAI_MODEL` to the intended environment. Keep the existing database,
   Dropbox and origin guards; never copy production secrets into a test target.
2. Set a strong random `CRON_SECRET` (at least 16 characters) and then explicitly
   enable `PREEVAL_AI_DAILY_RECOVERY_ENABLED=true` only after verifying the target.
   Vercel sends it as `Authorization: Bearer …`; unauthorized calls are rejected.
   The recovery switch defaults to `false`.
3. Redeploy when authorized. Vercel Cron runs only on **Production deployments**;
   it does not run automatically in local development or dev Preview. Local and
   Preview analysis still runs after ordinary eligible requests.

The current business pilot explicitly rejects Production, so the daily fallback
is prepared but **not activated or claimed verified on Vercel**. Production
configuration and acceptance remain part of a separately authorized cutover.
The 3022 server has no timer or additional background process to start.

These are technical compatibility choices only: **Vercel Hobby allows personal,
non-commercial use**. A paid AET service must use hosting whose terms permit that
use before launch. OpenAI API usage remains separately billed, and Vercel quota
exhaustion can suspend execution; this design does not make either service unlimited.
Official references: [Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing),
[function duration](https://vercel.com/docs/functions/configuring-functions/duration),
[Cron setup](https://vercel.com/docs/cron-jobs/quickstart),
[Hobby eligibility](https://vercel.com/docs/plans/hobby).

The private migration is `20261020232924_preeval_gpt_analysis.sql`, applied on
October 20 only to `aet_preview_preeval`. For another isolated environment:

```sh
node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/migrate-ai.mts
```

### Files, output and recovery

- Original PDFs use Responses `input_file` with high image detail; JPG/PNG use `input_image`, sent as
  in-memory base64. No public Dropbox link or OpenAI Files upload is created.
  `store:false` is set; it does not promise exemption from provider retention policies.
- The server combines saved per-file paths with the application's pinned canonical
  and historical Dropbox folders, deduplicates paths, records revisions/content
  hashes, and downloads exact revisions. It verifies byte hashes and actual PDF
  pages before calling GPT. Limits: 5 files, 20 MB per file, 30 MB combined,
  10 pages per PDF, 20 pages total; malformed/encrypted/unsupported files fail
  explicitly. Shared uploads are indexed in the same customer/staff file list.
- Attachments remain optional. An explicitly completed application without files
  can receive a clearly marked form-only assessment. Failed, missing or incomplete
  uploads must not silently become a form-only assessment. Retry the original
  failed file; contact staff to replace a saved unreadable/unsupported document.
- Initial form submission waits until all selected uploads succeed. Later customer
  uploads pause analysis until the customer confirms all files are ready. Shared
  multi-file uploads finalize as a batch; failed/interrupted attempts block analysis.
  Interrupted shared-upload attempts can be retried after a 15-minute lease if the
  browser could not cancel them. Pilot upload retries retain their 2-minute lease.
- Customer output stays `result` plus `reasoning`. Additional structured facts,
  conflicts, uncertainty and document/page references are stored for staff review
  in CRM's Service tab, along with model, prompt/input versions and token usage.
  Fields and file contents are untrusted evidence. No tools, browsing or shell
  execution are exposed to the model; output and evidence IDs/pages are validated.
- The queue uses an atomic claim and a run-specific lease, with heartbeats. An
  upload or staff correction invalidates older work; finalization checks input
  version, active run and current file/education snapshot. Stale runs are retained
  as superseded. Transient failures retry at most three times with backoff;
  other failures require customer/staff retry. Customer retries are rate limited.
  This prevents duplicate active jobs, but does not guarantee exactly-once provider
  billing after an ambiguous network failure.
- Result publication still requires confirmed payment. AI completion may enqueue
  result delivery, and its managed scheduler then attempts scoped email sending.
  An email enqueue or dispatch failure cannot erase a completed assessment.

### Verification

Passed 157 focused tests, TypeScript and offline Dropbox checks. The opt-in
synthetic integration script passed 28 checks using the real private preview DB
and Dropbox, including PDF/image/chunked reads, historical folders, batch failures,
concurrent workers, bounded retries, missing evidence, stale jobs, staff corrections,
payment gating, customer file-list parity and protected routes. GPT responses were
injected, not real API responses. No email was dispatched. Temporary applications,
AI records and Dropbox files were removed after tests.

The in-app browser verified Chinese customer pending/queued/failed states,
confirmation and retry, at desktop and 390 px mobile widths. The English CRM drawer was verified at desktop and mobile widths using
synthetic results: model/token metadata, document references, and authenticated
regeneration returned the application to Queued. The subsequent live checks below
verified actual API responses and their saved content. These synthetic cases
establish integration behavior; they are not a benchmark of professional
credential-equivalency accuracy or production readiness.

Reproducible checks:

```sh
pnpm exec vitest run tests/preeval-ai.test.ts tests/preeval.test.ts tests/preeval-customer.test.ts tests/legacy-application.test.ts tests/dropbox-paths.test.ts tests/evaluation-application.test.ts tests/evaluation-workflow.test.ts
PREEVAL_AI_VERIFY=1 node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/verify-ai.mts
# Opt-in real API usage; creates and deletes synthetic preview records/files.
PREEVAL_AI_LIVE_VERIFY=1 node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/verify-ai-live.mts
# Add --case=conflict, --case=blank, --case=image or --case=scan for one case.
```

Official implementation references: [PDF/file inputs](https://developers.openai.com/api/docs/guides/file-inputs),
[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs),
[model capability reference](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
The model is configurable. Live acceptance below records the model actually returned by the API.

### Automatic execution acceptance on port 3022

The owner’s existing Next server processed a new synthetic PNG after the in-app
browser confirmed the upload batch. No CLI AI worker was started. The request
returned before completion; page polling then displayed Completed on desktop and
390 px mobile. The browser retained a staff session, so its result content was
staff-visible; a separate customer-only cookie verified that the unpaid API result
remained hidden. Duplicate completion and application reads left exactly one AI
run, with no additional model request.

The response model was `gpt-6.1-sol`; usage was **1,956 input + 519 output = 2,475
tokens**. It read the institution, country, degree and dates directly from pixels,
flagged the entered-field conflicts, and correctly treated the synthetic document
as insufficient for a real equivalency. The script measured 71.8 seconds including
the wait for the browser confirmation; this is not model latency. Earlier failed
HTTP diagnostics stopped during file loading before the provider call.

A second HTTP acceptance sent two simultaneous batch-completion requests for a
new image-only PDF. It completed in 19.4 seconds with exactly one saved run; GPT
read the scanned facts and conflicts. Usage was **2,445 input + 506 output = 2,951
tokens**. The two successful Next-driven calls used **5,426 tokens** combined.
The PDF download matched the uploaded bytes, the unpaid customer result stayed
hidden, and duplicate completion/read caused no additional model request.

This acceptance uncovered a real runtime difference: the Dropbox SDK returned
Buffer in the standalone script and Blob in Next. AI reads, pilot downloads and
the shared document reader now use one binary adapter. The scan acceptance also verified an authenticated
HTTP download returned the exact original PDF bytes. Upload hooks use static
imports to avoid the older Node/tsx relative dynamic-import failure.

Passed **240 focused tests**, TypeScript, and **40 isolated DB/Dropbox checks**,
including scheduler authorization/configuration, bounded daily work, backoff,
interrupted leases, retry caps, cancellation, completed-job deduplication, upload
fencing, historical folders, chunked reads and staff corrections. One integration
attempt encountered a local IPv6 connection timeout; rerunning with IPv4 preferred
passed. Temporary rows and Dropbox files were removed, including the fixture from
an interrupted test. No email was sent or payment taken; no server was started or
restarted by this work. Vercel execution and Cron delivery remain unverified.

```sh
pnpm exec vitest run tests/preeval-ai-scheduler.test.ts tests/preeval-ai-routes.test.ts tests/dropbox-download.test.ts
# Real HTTP -> Next after -> GPT; only disposable synthetic private-preview data.
PREEVAL_AI_LIVE_VERIFY=1 node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/verify-ai-live.mts --http --case=image
# Optional browser-driven batch confirmation; the script prints the fixture URL,
# waits up to four minutes, then keeps the completed case for 90 seconds and cleans up.
PREEVAL_AI_LIVE_VERIFY=1 node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/verify-ai-live.mts --http --browser --case=image
```

Use a current Node runtime for verification. If this local network cannot reach
Dropbox over IPv6, prefix only the test command with
`NODE_OPTIONS=--dns-result-order=ipv4first`; this is not a deployment requirement.

### Live GPT acceptance

After the owner added the key, six real API calls completed against new synthetic
applications in the private preview schemas. Every original file was uploaded to
Dropbox, read back by revision, validated and sent through the production worker
code with no provider injection. The returned model was `gpt-6.1-sol` throughout.

| Case | Observed result | Input / output tokens | Worker seconds |
| --- | --- | --- | --- |
| Two-page text PDF; final prompt v2 | Extracted Bachelor of Science; flagged the entered Master of Science; cited both pages | 611 / 420 | 11.7 |
| Blank PDF | Insufficient evidence; all extracted facts null; no invented qualification | 491 / 223 | 10.0 |
| PNG with academic text only in pixels | Read Visual Fixture Institute, Canada, Bachelor of Engineering, dates; flagged all form conflicts | 1,924 / 490 | 13.1 |
| Image-only PDF with the same raster fixture | Read the same facts from the scanned page and cited page 1 | 2,413 / 445 | 14.6 |

The initial text-PDF call and its high-detail recheck consumed another 1,097 and
1,074 total tokens. Both read the academic text correctly but made an unsupported
claim about original page availability. PDF inputs now explicitly request high
detail; prompt `preeval-direct-files-v2` limits reasoning to concrete academic
evidence and avoids speculation about parsing/transport. The final text-PDF rerun
above removed that claim while retaining the qualification conflict. The other
three cases were verified before this narrow prompt adjustment.

Total observed usage across all six requests: **6,597 input + 2,591 output = 9,188
tokens**. Timing includes Dropbox reads and database work and is not a latency SLA.
All documents were marked synthetic; returning “Unable to determine” was correct
and was not treated as a verified US degree equivalency. The raster fixture is
`tests/fixtures/preeval-synthetic-scan.png` and contains no real applicant data.

Each case verified persisted output/model/usage and document revision/hash,
confirmed the unpaid customer could not see the result, and confirmed another
worker poll made no duplicate request. No email was enqueued/dispatched and no
payment was made. All temporary application, audit, AI and Dropbox records were
removed in cleanup. No continuous worker, new dev server or deployment was left
running by this acceptance.

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
- The administrator remains `tech@meiyugroup.org`; the current test recipient is
  `errplusone@gmail.com`. Pilot email uses the configured test recipient. Legacy CC/BCC
  recipients are not used. The `office` field is retained but the operational
  pre-evaluation UI has no office selection, badges or access partitioning.
- AI reads the saved Dropbox PDF/images through the server and uses the OpenAI
  Responses API. No Google Vision OCR, Poppler conversion or Codex subprocess
  runs in this pipeline. API credentials remain server-only; deployment is separate.

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

## Earlier local-database setup and processes

Use `.env.example` as the variable reference; secrets belong only in the ignored
`.env.local`. In the dev worktree, `PREEVAL_ORIGIN` and `PAYMENT_SITE_URL` are
`http://localhost:3022`; `PREEVAL_ADMIN_EMAIL` and `PREEVAL_TEST_EMAIL` both use
`tech@meiyugroup.org` in the earlier pilot. The current test recipient is
`errplusone@gmail.com`. AI configuration now follows the direct GPT section above. Reuse the configured local database and test services without
copying secrets into documentation. This guide and its service acceptance require
`PREEVAL_DATABASE_MODE=local` and the isolated local database on port 55422.
A separately configured `cloud-preview` mode retains the Stripe/combined-worker
guards and uses different business tables; Dropbox, GPT and scoped mail have
independent opt-in switches. Do not run these local fixture scripts against it.
Do not overwrite another session's environment to switch modes. The local service
pilot rejects remote database URLs, remote origins, live Stripe keys/events and
Dropbox roots outside the named test folder.

For the optional local database pilot: Node 20.9+, pnpm, Docker and Stripe CLI.
The new AI path does not require Poppler or a local Codex login.

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
server if it does not pick up that change. The legacy worker drains email
and delivery queues; `pnpm preeval:worker --once` processes one cycle. The new
AI queue runs in Next after eligible requests; `pnpm preeval:ai` is now optional diagnostics. See the active setup above.

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

PDFs and supported images now go directly to GPT through the Responses API.
See the active direct GPT section for input limits, audit metadata and recovery.

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
the cloud-preview combined worker is still disabled, while the website can send
application-scoped mail with its explicit opt-in. The historical `access_token` column
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
