# Dev Preview acceptance — October 22, 2026

The initial inspection below was followed by the owner-authorized configuration
sync and acceptance run recorded at the end. Its configuration/download blockers
are resolved. The later permanent direct webhook acceptance also passed;
fault-recovery tests remain open. Historical statements apply to their recorded
phase only; the final section supersedes the temporary-listener configuration.

## Deployment identity

- Commit: `5d10cff75f61ea2966f52b6c29f02f8cc5cf2fb8` on `dev`.
- Vercel deployment: `dpl_2SrZPwXGRd19hKGHt2deSq9ivUCQ`.
- [Deployment details](https://vercel.com/meiyutechs-projects/aet-website-2026/2SrZPwXGRd19hKGHt2deSq9ivUCQ): **Ready**, Preview, Latest for dev; duration 1m 5s.
- [Stable Preview](https://aet-website-2026-git-dev-meiyutechs-projects.vercel.app) was assigned to that deployment.
- GitHub's Vercel commit status also reported successful deployment.

## Browser checks

The in-app browser reached Vercel's authentication screen. Verification continued
in the owner's already-authenticated AET Chrome profile. These were desktop checks.

| Check | Result |
| --- | --- |
| Chinese homepage | Loaded with expected navigation and imagery |
| Unified application | Required-field validation, five translation offices versus three evaluation offices, required education, document/course mutual exclusion and report links rendered correctly |
| Evaluation pricing | Document 24-hour/same-day USD 200/250 and course 24-hour/same-day USD 350/450; local 1 pm cutoff present |
| Mailing details and review | Incomplete address blocked review; US state/ZIP became required; USD 450 + PDF/paper USD 20 + first-class postage USD 10 produced USD 480 on review |
| Dedicated pre-evaluation form | Personal information, education and review worked; USD 19 + USD 0.88 fee shown |
| CRM | Existing authenticated session loaded Live and Test lists; search empty state and service/document/payment dialogs worked |
| Existing paid synthetic pre-evaluation | ID lookup reopened the saved completed result; customer and CRM showed Paid/Completed and the same result |
| Existing synthetic formal intake | Status loaded quote, education, two file entries and recorded confirmation-mail status; payment remained explicitly unconnected |
| GPA | Two three-credit A/B courses produced GPA 3.500000 and six credits |
| Standalone payment UI | Office selection exposed Stripe test payment; no Checkout or payment was submitted |
| Pricing and language | Shared prices/cutoff matched the form; Chinese to English navigation worked, then Chinese was restored |

No application submission, new upload, payment, AI regeneration, staff edit or
manual email delivery was performed. Confirmation forms were stopped before
submission because formal intake also CCs the handling office. Reading existing
paid synthetic results is not a new upload/payment/AI end-to-end run. No browser
console errors were observed in the inspected application, pre-evaluation, CRM,
payment and pricing states; this does not negate the server download failure below.

## Blocking finding: pre-evaluation attachment download

An existing synthetic pre-evaluation's customer Download link returned
`{"error":"service_unavailable"}` instead of a PDF. Vercel recorded an error
for `/api/pre-evaluation/files/adaef01b-cd6a-492b-a082-3468c888c926`
at 13:31:31 PDT in this exact Preview deployment.

The handler logs only the error name (`[pre-evaluation] Error`), so it did not
provide a detailed runtime cause. Configuration inspection plus source inspection
identified a concrete blocker: `officeForStoredPath()` calls
`required('DROPBOX_LEGACY_PILOT_ROOT')` before checking even canonical paths.
Neither this variable nor its `PREEVAL_DROPBOX_ROOT` fallback exists in the Vercel
project. No shared variables are linked. This must be resolved and the actual
PDF download retested; other provider failures cannot be ruled out until then.

## Local versus hosted configuration

Only variable names, presence and non-secret local settings were compared.
No secret values were displayed, copied into this report or changed.

| Configuration | Local dev | Vercel project evidence / consequence |
| --- | --- | --- |
| Shared APP/APPLICATION names | New names used | Existing `PREEVAL_ENV`, `PREEVAL_ORIGIN`, `PREEVAL_DATABASE_MODE`, `PREEVAL_DATABASE_URL`, `PREEVAL_TEST_EMAIL` remain; compatibility aliases explain why current reads work |
| `DROPBOX_LEGACY_PILOT_ROOT` | Set | New and legacy names absent; blocks pilot file-path resolution |
| `OPENAI_API_KEY` | Present | Absent; no linked shared variable |
| `PREEVAL_AI_ENABLED` | `true` | Absent; hosted automatic AI is not enabled |
| `PREEVAL_OPENAI_MODEL` | `gpt-6.1-sol` | Absent; optional because code has the same default |
| `PREEVAL_EMAIL_ENABLED` | `true` | Absent; pre-evaluation cloud mail dispatch remains disabled despite existing Resend credentials |
| `PREEVAL_STRIPE_TEST_ENABLED` | `true` | Absent; CRM explicitly reports payment verification disabled/not configured |
| `STRIPE_TEST_SECRET_KEY` | Present | Present for dev Preview; standalone Stripe test UI is available |
| `STRIPE_TEST_WEBHOOK_SECRET` | Present for local acceptance | Listed for Production only, not Preview; hosted endpoint and matching signing secret still need separate verification |

Do not copy localhost settings wholesale. Hosted settings require `APP_ENV=preview`,
the stable HTTPS dev origin, the restricted cloud-preview database configuration,
and continued disabled employee migration/cutover. A local Stripe CLI signing
secret is not the hosted webhook's secret. The previous explicit deferral of
email scheduling still applies; it is separate from request-scoped mail dispatch.

## Initial inspection disposition

Deployment and the checks above passed, but **full hosted business acceptance did
not pass**. First resolve the missing dev Preview configuration and download error,
then deploy through the authorized process and run controlled new-application,
upload/replacement, AI, test payment/webhook and publication-recovery acceptance.
No Vercel environment, production setting or application code was changed by this
inspection. No local production build or repeated unit suite was run.


## Authorized configuration sync and hosted acceptance

The owner authorized syncing missing variables to **dev Preview**, redeploying and
running the complete pre-evaluation journey, with Production excluded. No
application code, local environment file, database schema or scheduled recovery
configuration was changed. No commit/push or local production build was performed.

### Final deployment and configuration

- Commit: `5d10cff75f61ea2966f52b6c29f02f8cc5cf2fb8`, branch `dev`.
- Final deployment: `dpl_2psHygKUcaGobE4nPEVAJP6bZ7cX`, **Ready / Preview**,
  duration 27 seconds; [deployment details](https://vercel.com/meiyutechs-projects/aet-website-2026/2psHygKUcaGobE4nPEVAJP6bZ7cX).
- The stable dev Preview alias points to this deployment.
- All twelve additions are scoped to `target: preview`, `gitBranch: dev`.

| Added setting | Purpose / non-secret value |
| --- | --- |
| `APP_ENV` | `preview` |
| `APP_ORIGIN` | Stable HTTPS dev Preview origin |
| `APPLICATION_DATABASE_MODE` | `cloud-preview` |
| `APPLICATION_DATABASE_URL` | Restricted preview runtime connection |
| `APPLICATION_TEST_EMAIL` | Existing controlled test recipient |
| `DROPBOX_LEGACY_PILOT_ROOT` | `/Team Files/WebsitesDev/AET-PreEvaluation-Test` |
| `OPENAI_API_KEY` | Existing authorized OpenAI credential |
| `PREEVAL_AI_ENABLED` | `true` |
| `PREEVAL_OPENAI_MODEL` | `gpt-6.1-sol` |
| `PREEVAL_EMAIL_ENABLED` | `true` |
| `PREEVAL_STRIPE_TEST_ENABLED` | `true` |
| `STRIPE_TEST_WEBHOOK_SECRET` | Matching temporary Stripe CLI listener signing secret |

Existing provider credentials and compatibility aliases were preserved. The
listener secret does not configure a permanent Stripe Dashboard webhook endpoint.
Secret values, access cookies and Checkout URLs are excluded from this record.

### New synthetic journey

Application `c3d052d7-fe1f-4c08-bfa5-af7bd9ff63c3` is named
`AET Preview 20261022 Test`. Its two-page, 1,802-byte PDF explicitly labels itself
as synthetic and not a valid credential. Only test application schemas and the
configured development Dropbox location were used. The restricted runtime role
has no INSERT privilege on live application tables. No existing customer record
was edited.

| Check | Observed result |
| --- | --- |
| Hosted submission and upload | Submission 201, upload 200 and upload-completion 200 through the stable dev host |
| New attachment download | 200, PDF content type and exact fixture hash match |
| Previously failing attachment | Existing file `adaef01b-cd6a-492b-a082-3468c888c926` returned 200, 1,801 bytes and matched its retained fixture |
| AI | One completed `gpt-6.1-sol` run, result version 1; 1,770 total tokens |
| Result access before payment | Anonymous request 401; authorized unpaid response hid the saved result |
| Checkout creation | Two concurrent requests returned one test Checkout session; USD 19.88, correct application/recipient and dev return URL |
| Browser payment | Stripe Sandbox test card 4242; Checkout complete, payment intent succeeded, charge paid and `livemode=false` |
| Hosted callback | Real `checkout.session.completed` event forwarded to the hosted route and returned 200 |
| Publication | Application became Paid/Completed, with the same saved result and one AI attempt |
| Email | Confirmation and result each sent once and reported delivered by Resend; only the controlled recipient, no CC/BCC |
| Replay and duplicate purchase | Replayed completed event returned 200 without another effective payment, AI run or email; paid Checkout request returned 409 |
| Customer and staff UI | In-app customer result and Chrome CRM Test view agreed on Paid/Completed and the saved result; desktop visual checks passed |

The AI returned **Unable to determine** because the supplied pages explicitly
identify themselves as synthetic. This is expected for the fixture, not a failed
analysis or evidence of a real credential equivalency.

At 13:47:57 PDT the hosted webhook recorded payment; result email dispatch followed
at 13:48:00, before browser-return reconciliation at 13:48:01. Thus callback-driven
publication was exercised, not only the return-page fallback. The two provider
message IDs were `01a1655c-4ac6-7863-a420-6541af8a17f3` (confirmation) and
`01a1655e-e512-718c-b70a-ac1ef7ed7b88` (result); both delivery receipts were checked.

Submission, upload and AI used hosted API requests; customer lookup, Stripe
Checkout, the completed customer page and CRM were exercised in the browser.
The form-to-review desktop interactions had passed during the initial inspection.
Submission/upload/AI occurred just before the final Preview redeployment on an
intermediate deployment of the same commit and configuration. The application
survived redeployment; payment return, replay and final customer/CRM reads passed
on the final Preview. This was not one uninterrupted all-browser run.

### Temporary callback access and cleanup

Vercel authentication protects the dev Preview. A two-hour shareable-access token
was created only for the dev alias; no project-wide protection bypass or
Production protection change was made. A temporary Stripe CLI test-mode listener
forwarded the real event to the hosted webhook, with dev-only access attached
only to that destination. No permanent Stripe endpoint was created and no existing
endpoint was changed.

After verification, the listener exited and its dev alias access token was revoked.
The temporary relay is no longer running. Consequently this acceptance proves
hosted handler behavior, but does **not** establish ongoing unattended direct
Stripe-to-Preview delivery. A permanent dev test webhook and its own signing secret
remain required before relying on that delivery path.

### Deployment correction and Production boundary

The first accepted redeployment request used the API's `staging` target, which
created `dpl_9frgY5quB1FvWztQJMSbTiQDCLh5` and unexpectedly assigned the project's
default `aet-website-2026-meiyutechs-projects.vercel.app` alias to it. That alias
had pointed to Production. It was promptly restored to its original deployment,
`dpl_CYoB72snSNcHbj96mqnGRhRvCzMC`. The formal business domains were never moved.

The subsequent redeployment inherited Preview from the original Preview deployment
and is the final deployment identified above. Final API comparison confirmed:

- Production environment-variable records and the Production deployment pointer
  match the pre-operation snapshot.
- All five original Production aliases again point to the original deployment:
  the two formal business hosts, project alias, default team alias and main alias.
- Project authentication/protection and runtime resource settings match the
  pre-operation snapshot.
- The dev alias points to the final Ready Preview and its temporary access is revoked.

The temporary default-alias reassignment is recorded explicitly; it should not be
summarized as an operation that never touched any Production-associated routing.

### Remaining acceptance scope

The primary hosted journey passed. Deliberately injected abandoned/replaced upload
failures, saved-result publication failures, cancellation/refund visibility, mobile
recovery states and worst-case AI timeout behavior were not repeated in this run.
Permanent direct test webhook delivery is still open. No production charging,
real-customer email routing, employee cutover or new scheduling was enabled.

Sanitized screenshots, synthetic input and concise acceptance/boundary records
remain under `/private/tmp/aet-preview-sync/`. On the owner's cleanup follow-up,
37 temporary items were removed, including the relay and test scripts, credential
copies, access-cookie files, raw provider responses and cached Python files. The
listener was confirmed stopped and its dev-only access confirmed revoked before
cleanup. No application code was added or changed for the relay; the repository's
pre-existing local `scripts/preeval/stripe-listen.mjs` was left unchanged.

The dev Preview `STRIPE_TEST_WEBHOOK_SECRET` still contains the CLI-listener
signing configuration. Replace it with the direct Stripe test endpoint's signing
secret when configuring that endpoint. Local cleanup did not change Vercel
variables or deploy another version. This dated record retains the durable
conclusions; secret-bearing temporary responses are no longer retained.


## Permanent direct test webhook acceptance

The owner authorized replacing the dev temporary signing secret and rerunning the
payment flow, with Production excluded. This follow-up changed hosted configuration
only; no application code, relay service or scheduler was added.

### Durable configuration

- Stripe **test** endpoint: `we_1UTTP2JMcR2XIhynZXyFcdYa`, enabled, `livemode=false`.
- URL: `https://aet-website-2026-git-dev-meiyutechs-projects.vercel.app/api/pre-evaluation/stripe-webhook`.
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
- API version: `2026-09-30.endive`, matching the installed Stripe SDK.
- Only Preview / branch `dev` `STRIPE_TEST_WEBHOOK_SECRET` was replaced with this
  endpoint's signing secret. Local CLI configuration was left unchanged.
- A Vercel alias-level protection override applies only to the stable dev alias.
  This makes that alias reachable without Vercel login, including future dev
  deployments. Application-level staff login and webhook signature checks still
  apply. It is not a path-only exception. No global protection change was made.
- Redeployed the existing dev commit `5d10cff` as Preview, without a Production
  target. Ready deployment: `dpl_GusfM9qw56wGk3n8kzDeHazfXC9t`; only the dev alias
  is attached. No new code commit was deployed.

### New synthetic application and observed results

- Application: `1f90291e-f413-4911-95e6-9e5ba8ee8bef`;
  `AET Direct Webhook 20261022 Test`, controlled recipient `errplusone@gmail.com`.
- Hosted API submission and synthetic PDF upload succeeded. One real GPT analysis
  completed at 21:21:26 UTC. The unpaid customer response withheld the result.
  The explicit synthetic document appropriately produced `Unable to determine`;
  this tests workflow behavior, not credential-assessment accuracy.
- Browser Stripe Sandbox Checkout charged test card 4242 for **USD 19.88**.
  Session `cs_test_a1xIiFZQZJSBdgn8rbgumv1LQv55ETHS3EnDrGSe9MR35yKiE0oa3Nbrvl`
  became `complete/paid`, `livemode=false`.
- Event `evt_1UTTVTJMcR2XIhynKEnN0cV2` was created at 21:26:39 UTC and had
  `pending_webhooks=0`. The database recorded `checkout.session.completed` from
  actor `stripe` at 21:26:40.362 UTC. The new endpoint was the only enabled test
  webhook; the legacy disabled endpoint was untouched. No CLI listener ran.
- Application became `completed`, payment `paid`, AI `completed`, result version 1.
  Exactly one payment and one AI run were recorded. The result email was sent at
  21:26:42.709 UTC. Confirmation and result each had one send attempt; Resend
  returned `delivered` for both provider IDs:
  `01a1657d-387e-7632-a3fb-c29a7b2234bf` and
  `01a16582-54bd-7ce6-af28-8f03d8d46222`.
- The in-app browser returned to the customer result page and showed paid,
  completed and the published result. Chrome's existing authenticated CRM Test
  view showed the same application, USD 19.88 paid and completed.
- The browser was allowed to return normally. The observed Stripe audit establishes
  direct webhook handling; this run does not separately prove the close-browser
  scenario. The first attempt closed Checkout too early and left it open/unpaid;
  the same session was reopened and paid successfully, without a second charge.

### Boundaries and remaining scope

Unsigned webhook requests returned 400; unauthenticated staff requests returned
401. Production env entries, deployment `dpl_CYoB72snSNcHbj96mqnGRhRvCzMC`, all
five Production alias mappings and project-wide protection matched the snapshot
from before this follow-up. No live Stripe key, live charge, employee cutover or
mail-recovery schedule was used. The old disabled test endpoint was unchanged.

The earlier fault-injection, refund/cancellation and mobile recovery TODOs remain.
Sanitized evidence and screenshots are retained under
`/private/tmp/aet-direct-webhook/`; temporary helpers, credentials, cookies and raw
provider/configuration responses are removed after verification. The permanent
endpoint, dev alias override and Vercel signing secret remain configured.
