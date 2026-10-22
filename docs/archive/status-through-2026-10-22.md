# AET Implementation Status

> **Historical record — frozen on October 22, 2026.**
> Entries describe their original checkpoints, not today's configuration. Use [current status](../status.md) and the [active checklist](../migration-checklist.md) for ongoing work.

## 2026-10-22 — Integrate upload recovery into dev

- Confirmed `dev` was clean at `00689cf`, after the environment configuration
  updates and result-publication recovery merge. Merged
  `x/preeval-upload-recovery` (`476413c`). Runtime code merged automatically;
  resolved the status-document conflict by retaining both sets of records.
- All 778 tests across 51 files passed with every opt-in PostgreSQL suite enabled,
  including upload fencing/recovery, information resubmission, publication
  recovery and refund/email regressions. Tests used disposable local databases
  and mocked providers; temporary clusters were stopped and removed afterward.
- Full TypeScript, i18n (593 messages per language) and whitespace checks passed.
  The owner-run port 3022 server displayed the pre-evaluation application lookup
  page correctly in the Codex in-app browser. This integration check did not
  exercise uploads against business data; the feature's isolated desktop/mobile
  recovery verification remains recorded below.
- Preserved the shared environment names and command-line-only legacy test
  identities. No production build, owner-server restart, push or deployment.

## 2026-10-22 — Integrate result publication recovery into dev

- Confirmed `dev` was clean at `9ce7210` before merging
  `x/preeval-result-publication` (`0d9a496`). Resolved the status-document
  conflict by retaining both sets of records. Runtime code merged without text
  conflicts; the shared environment names and command-line-only legacy test
  actors remain intact. The upload-recovery branch was not part of this merge.
- The combined result passed all 759 tests across 51 files with every opt-in
  PostgreSQL suite enabled, including 26 publication recovery tests. Databases
  were disposable local clusters, providers were simulated, and the clusters
  were stopped and removed after testing. No business database was used.
- Full TypeScript using the existing generated route types, i18n (586 messages
  per language) and whitespace checks passed. No frontend changes or browser
  acceptance, production build, server restart, push or deployment. Hosted
  acceptance remains pending; F5 scheduler work remains deferred.

## 2026-10-22 — Audit environment names, defaults and documentation scopes

- Audited the current dev worktree's environment files, runtime readers, scripts,
  tests and setup guides. Corrected shortened variable names in comments and
  limited the alias claim to the six shared-name fallbacks in README. Retained
  pre-evaluation-specific AI, email and test-payment names.
- Corrected the fresh-checkout AI instructions: the template defaults to disabled;
  the existing local configuration explicitly opts in. Clarified that the mail
  switch and shared test-recipient setting do not override newer formal-intake
  confirmation delivery, which uses a separate fixed pilot recipient.
- Scoped the Payment guide's no-webhook claim to standalone Payment; separate
  application API handlers still consume the test webhook secret. Aligned email
  recovery caller instructions with one private local environment file per
  worktree and externally managed scheduler secrets.
- Both environment files parse with Next's environment loader, without duplicate
  keys: 50 template entries and 44 local entries. The six template-only settings
  are optional daily AI recovery, shared Stripe mode/test return origin, and
  account-specific Stripe keys. Missing local BOS keys leave Boston/NYC Stripe
  unavailable; missing shared Stripe mode defaults to test only in development.
  All assignments, secrets, feature states and file permissions were preserved;
  the local file remains ignored with mode 0600.
- All 160 targeted tests across nine files, full TypeScript and whitespace checks
  passed. Credential-free startup probes of the package workflow/integration
  commands reached their expected argument/configuration rejection. No full
  integration workflow, external provider, database or live Vercel check was run.
- This audit changed comments and documentation only. No runtime change, frontend
  change, server restart, commit, push or deployment was performed.

## 2026-10-22 — Make legacy test identities command-line only

- Replaced the temporary script environment input with an explicit
  `--test-actor=email` argument for all three legacy scripts. The shared
  script-only helper trims/lowercases one value and rejects missing, blank,
  bare or duplicate arguments. No environment fallback remains.
- Updated legacy invocation examples and tests, removed obsolete environment
  stubs, and replaced the retired variable name in historical prose with a
  description. The current dev source, docs, tests and both environment files
  have zero matches for the retired name; Git history and dependency/build
  caches are outside this audit. Other worktrees were not edited.
- All 79 targeted tests across five files, full TypeScript and whitespace checks
  passed. Subprocess tests exercised only early rejection with no credentials;
  no full lifecycle, database or provider workflow was run.
- No frontend or additional environment-file changes, commit, push, Vercel
  configuration change or deployment in this follow-up.

## 2026-10-22 — Remove the legacy test actor from website configuration

- Removed the legacy test-identity setting and the `admin` return property from the shared
  website configuration reader. New-name and legacy-name application setups work
  without it; an obsolete value does not affect website configuration.
- Removed its assignment from `.env.example` (50 remaining entries) and the
  ignored `.env.local` (44 remaining entries). All retained local values and mode
  0600 were preserved. Controlled recipients and staff authentication are unchanged.
- The pre-evaluation lifecycle script and two older formal evaluation scripts
  (workflow integration and browser fixture) now require the identity only when
  explicitly run, via `scripts/legacy-test-actor.ts`. Missing/blank input fails
  before fixtures, database access or provider operations. Supplied identities
  are trimmed/lowercased for their existing audit or legacy fixture usage.
- Updated the setup guides with invocation-scoped examples, removed the normal
  website test fixtures' dependency, and added missing/empty/whitespace startup
  checks for all three scripts plus identity-normalization coverage.
- All 77 targeted tests across five files, full TypeScript and whitespace checks
  passed. A fresh process loaded `.env.local` and accepted website configuration
  with no test actor; no provider/database operation was needed for this check.
  Only fail-fast script paths were run, not their side-effecting test workflows.
- No frontend changes, production build, commit, push, Vercel edit or deployment.
  Restart the owner-managed 3022 process to discard its old environment entry.
- At the intermediate reference audit, the dev worktree still contained the old
  name in seven files: the script-only helper, two regression test files, README,
  two legacy-script guides and this historical log. Website `lib/` / `app/` code
  and both environment files had no reference. The later command-line-only
  cleanup removes those remaining name references; older wording was clarified.
- The separate `x/preeval-result-publication` and `x/preeval-upload-recovery`
  worktrees still have their older configuration readers/templates. They have not
  received this dev change; upload-recovery also has unrelated working changes.
  No other worktree was edited. Preserve this removal when integrating them into
  dev, and rerun the configuration tests on the combined result.

## 2026-10-22 — Rename shared environment variables with legacy fallback

- Renamed the six shared settings to `APP_ENV`, `APP_ORIGIN`,
  `APPLICATION_DATABASE_MODE`, `APPLICATION_DATABASE_URL`,
  `APPLICATION_TEST_EMAIL` and `DROPBOX_LEGACY_PILOT_ROOT` across runtime code,
  standalone scripts, tests, the environment template/local file and guides.
  Pre-evaluation-specific switches kept their names. At this stage the test actor
  still lived in website configuration; the later removal entry above supersedes
  that behavior and moves it to explicit legacy-script invocations.
- Added `lib/application-environment.mjs` as the shared server/Node reader.
  New names take priority, including explicit empty strings; only undefined
  values fall back to the six legacy aliases. No environment mutation, cached
  configuration snapshot or cross-service credential fallback was introduced.
- Preserved all 45 local assignment values under their renamed keys; the local
  file remains ignored with mode 0600. Both environment files passed Next parsing
  and duplicate-key checks. The cloud setup script now writes new database keys.
- Passed 164 related tests across 10 files (162 initially, then the updated
  14-test compatibility suite including two additional hosted-boundary cases).
  Full TypeScript and whitespace checks passed. Tests cover old-only, new-only,
  mixed/conflicting and explicitly empty values, hosted Preview/Production guards,
  and standalone Node without a TypeScript loader. No production build ran.
- A fresh process loaded only the new local names and successfully ran a read-only
  `SELECT 1` through the application database helper. No migration, email, AI,
  payment or other write workflow was executed.
- After the owner restarted port 3022, the in-app browser verified the homepage's
  local pre-evaluation link and formal application redirect, plus the enabled
  application form at 1280px and 390px. Screenshots are in
  `/private/tmp/aet-env-rename-20261022/`. No application was submitted.
- No commit, push, Vercel environment edit or deployment. Existing hosted aliases
  can remain until a separately authorized rollout; README documents the order.

## 2026-10-22 — Audit and regroup environment variables

- Reviewed the active dev worktree's template/local settings against application,
  script and test readers. Preserved historical `PREEVAL_` names that also serve
  formal intake and staff workflows; documented required, optional and legacy
  compatibility settings in README and in matching environment-file groups.
- Removed four unreferenced local Codex/Poppler variables (49 local entries to 45).
  Preserved every retained local assignment byte-for-byte, including credentials,
  recipients and feature-switch values. Removed two unused Stripe publishable-key
  placeholders from the example (53 entries to 51) and aligned its origin with
  dev port 3022; the comments explain main port 3021.
- Documented that the email switch is a cloud-preview opt-in, not a global mail
  kill switch. At this stage the shared reader still required the admin test
  identity; that requirement was subsequently removed as recorded above.
- Both files passed Next environment parsing, duplicate-key and whitespace checks.
  No runtime code, service state or Vercel configuration was changed. Local
  configuration remains Git-ignored with mode 0600. No build or deployment.

## 2026-10-22 — Recover saved pre-evaluation result publication

- Authorized customer/staff detail reads now retry `publishIfReady` before
  loading a fresh application snapshot. A paid result saved with completed AI
  but processing application status can recover after a transient publication
  failure, including cloud preview without a local worker. No AI regeneration,
  scheduled recovery or new external request is involved.
- Existing publication eligibility is rechecked under the application row lock;
  result versions and email dedupe keys are preserved. Customer projections
  additionally require completed AI and no pending uploads. An enqueue failure
  after publication cannot hide the committed result; later reads can retry the
  missing enqueue. Existing email dispatch and review rules remain unchanged.
- Added 26 real temporary-PostgreSQL tests with simulated AI/Stripe/email and
  database triggers that reject publication/enqueue. Verified repeated failures,
  concurrent reads, both payment orders, unpaid/pending/refund withholding,
  cancellation/information/upload gates, staff corrections, superseded AI runs,
  stale emails and deterministic row-lock races with refunds/uploads/corrections.
  Route tests also verify authorization precedes the recovery-capable read.
- Verification: 645 tests passed in the full run with publication, information
  and upload PostgreSQL suites enabled; the remaining 87 refund/email database
  tests passed separately against disposable loopback databases (732 total).
  Full TypeScript, i18n (586 messages per language) and whitespace checks passed.
  No production build, live provider calls, real email/payment or deployment.
- Backend-only change; no browser/UI acceptance was performed. Hosted fault
  recovery still requires acceptance after an authorized integration/deployment.
  Recovery requires a subsequent authorized detail read and database availability;
  unattended/email scheduler work remains deferred under F5. At feature
  validation, the branch remained isolated while `dev` had unrelated local work;
  the subsequent integration is recorded above.

## 2026-10-22 — Recover abandoned pre-evaluation uploads

- Added authorized, persistent unfinished-upload lists and explicit abandonment
  to the customer pre-evaluation page and shared FileManager. Failed/cancelled
  queue removal now abandons the matching server attempt before removing the
  browser row. A refreshed page can recover attempts even without an upload key.
- Abandonment locks the application, matches the exact file timestamp or shared
  attempt ID, removes only an unfinished reservation and records an audit event.
  It releases file quota, invalidates prior AI inputs/results and keeps the batch
  pending. Ready files, newer retries, foreign attempts and cancelled applications
  remain protected. Active uploads still block completion and staff AI retry;
  an empty abandoned batch must receive a replacement before completion.
- Preserved same-file retry and fenced stale callbacks before provider commits.
  Customer chunk tokens now bind timestamp text before PostgreSQL casting to
  retain microseconds; the driver's default timestamp serializer otherwise
  truncates them. The older pre-evaluation multipart endpoint also holds its
  attempt claim through storage/indexing. Formal evaluation behavior is unchanged.
- No database migration is needed: deletion uses the existing server role's
  SELECT/INSERT/UPDATE/DELETE grants and private-schema RLS policy. A disposable
  PostgreSQL test exercised the restricted role and mapped preview schema without
  adding columns or widening grants. No cloud database was changed.
- Regression coverage uses disposable PostgreSQL and mocked Dropbox/AI, including
  failure/cancel A -> abandon -> B -> complete -> retry, same-file retry, active
  blockers, quota release, microsecond fencing, concurrent commit/abandonment,
  old success/failure callbacks, authorization/origin checks, cancellation and a
  regenerated paid result. Full suite: 725 tests passed without skips; typecheck,
  i18n and whitespace checks passed. No production build was run.
- Visual acceptance: Codex in-app browser exercised customer abandonment and
  requeue in a temporary isolated harness. Playwright exercised the shared
  failure/remove/replacement flow at 390px and inspected the actual customer
  success route at 390px/1280px, including a synthetic completed result. No
  horizontal overflow. Only Dropbox transport was simulated in the shared UI;
  recovery and completion APIs wrote to the disposable local database. The result
  display fixture did not call a real AI provider. Screenshots are under
  `output/playwright/`; temporary routes/configuration and the 3033 server were
  removed/stopped after verification. Ports 3021/3022 were not changed.
- Kept on `x/preeval-upload-recovery` for sequential integration: `dev` contains
  another conversation's uncommitted changes. Live provider/hosted acceptance
  remains pending. No push, deployment, real mail, charge, or new Cron.


## 2026-10-22 — Deploy and verify the standalone Production expiry Cron

- Production commit `83357c3` was pushed to `MeiyuTech/aet-website-2026/main`.
  Vercel deployment `CYoB72snSNcHbj96mqnGRhRvCzMC` is Ready and assigned to
  the production domain. Dev Cron source is committed as `dff8def`.
- Released only the independent Cron worker, helper, tests, dependencies and
  schedule on the existing marketing main branch. Other dev application changes
  remain outside Production; unrelated working changes were preserved.
- Vercel Cron is Enabled with `/api/internal/customer-status/expire` scheduled
  daily at 12:00 UTC (Hobby has a one-hour scheduling window). Three required
  variables are saved for Production, with expiry enabled.
- Unauthenticated production GET returned 401 with no-store. A Vercel dashboard
  Run at 18:45:21 UTC returned 200 and logged `expired: 77, batchFull: false`.
  A second Run at 18:46:09 UTC returned 200 with `expired: 0, batchFull: false`.
  Read-only before/after checks found 77 eligible transitions, zero remaining
  eligible rows and no changes to non-target payments, status or submitted_at.
- Standalone release: 18 tests, full TypeScript and whitespace checks passed.
  Existing dev checkout: 38 related tests passed. No local production build.
- The old GitHub workflow is still disabled_inactivity. This verifies hosted
  manual execution and registration; the next automatic scheduled delivery is
  not yet observed. Evidence: `/private/tmp/aet-cron-production-schedule.png`.


## 2026-10-22 — Repair generated Next route types and pass the full type check

- Confirmed one active Next dev server for this worktree on port 3022. Its
  generated `.next/dev/types/validator.ts` contained a truncated statement and
  repeated route/layout validation blocks. The original corruption trigger was
  not established; no framework upgrade or dependency patch was applied.
- Backed up the malformed artifact, then triggered the existing Next route watcher
  by updating an existing layout's modification time. Next regenerated the route
  types from current routes; layout contents were verified unchanged. The owner’s
  server remained running, with no additional restart or production build.
- `pnpm typecheck --incremental false` passed with exit code 0 using the original
  repository `tsconfig.json`, including generated Next route validators. No type
  exclusions or ignored build errors were introduced; `tsconfig.json` and
  `next-env.d.ts` remained byte-identical to their pre-repair snapshots.
- This resolves the full-type-check limitation recorded in the CRM payment
  verification follow-up below. Whitespace checks passed. Backup evidence is in
  `/private/tmp/aet-next-type-repair-20261022/`; no commit, push or deployment.

## 2026-10-22 — Align CRM payment verification with Stripe test configuration

- Pre-evaluation staff details now return a payment-verification capability using
  the same server-side test-key/configuration guard as actual Stripe actions.
  The Payment tab shows enabled/unavailable copy and enables Verify payment only
  when allowed. Formal-evaluation preview restrictions remain in place.
- Successful reconciliation reports "Payment status checked."; the existing busy
  lock prevents repeated clicks while the request runs. No credentials reach the UI.
- After the owner's 3022 restart, the Codex in-app browser verified the existing
  synthetic Stripe case at 1280px and 390px, including a real Verify payment click.
  It remained Paid/Completed at USD 19.88 with one payment and one send attempt
  for each confirmation/result email. No new checkout or charge was created.
- 92 targeted regression tests and source TypeScript checks passed, as did the
  whitespace check. Full default type checking was blocked by malformed generated
  `.next/dev/types/validator.ts`; the source check excluded `.next` through a
  temporary configuration and did not modify repository TypeScript settings.
- Screenshots: `/private/tmp/aet-payment-verification-20261022/desktop.png` and
  `mobile.png`. No commit, push or deployment in this follow-up.

## 2026-10-22 — Verify pre-evaluation Stripe test payment and result delivery

- Added an explicit pre-evaluation-only Stripe test opt-in for restricted cloud
  preview, with live-key/event rejection and unchanged formal/combined-worker
  restrictions. Reused the owner's restarted 3022 server.
- Submitted a new synthetic case, uploaded its PDF to Dropbox and ran GPT once.
  Completed a real Sandbox 4242-card checkout for USD 19.88; the signed Stripe
  callback returned 200 and unlocked the result before return reconciliation.
- One payment row survived concurrent checkout requests and duplicate local event
  replays. Invalid signatures, live events, amount/currency/ownership mismatch and
  repeat checkout after payment were rejected. Customer-only unpaid/paid gates
  passed; in-app desktop checkout return/reload showed Paid/Completed and result.
- Confirmation and result each sent once only to `errplusone@gmail.com`; both
  Resend receipts report delivered. Click-to-callback 1.98 seconds, then 0.92
  seconds to result email send. No manual paid fixture or real charge.
- 91 targeted regression tests, TypeScript and whitespace checks passed. The
  temporary local callback forwarder was stopped; no push or deployment.
- Case and evidence: [Stripe test acceptance](../pre-evaluation-local.md#october-22-stripe-test-payment-acceptance).

## 2026-10-22 — Consolidate and organize local environment configuration

- Merged the prepared expiry connection and Cron secret into the existing
  `.env.local`; kept local expiry disabled and deleted the duplicate secret file.
- Grouped local settings and `.env.example` consistently by service, preserving
  every existing local value and template default. Retained legacy local tool keys.
- Updated preparation tooling to reuse/append local settings without replacing
  unrelated variables, and refreshed README, expiry and migration instructions.
- Verified parsed values, unique keys, Git ignore and mode 0600. No database change,
  credential rotation, production activation, server restart or deployment.


## 2026-10-22 — Prepare the Vercel payment-expiry database credential

- On explicit owner authorization, provisioned `aet_payment_expiry` on the existing
  project with a TLS-tested restricted pooler login and pending -> expired RLS.
  Preserved existing business policies and the CRM payment-write prohibition.
- Generated the connection and Cron secret in a Git-ignored mode-0600 file for
  Production configuration. Did not edit loaded local environment variables,
  Vercel settings, old GitHub scheduling, or production payment records.
- Passed 24 live privilege/rollback checks and TypeScript. Verified business-row
  fingerprints unchanged; 77 records currently meet the original expiry rule.
  Security advisor returned no finding for the affected table; unrelated existing
  findings are recorded in the setup guide. No task dispatch or deployment.
- Production environment setup and first real scheduled-run verification remain
  with the owner. See [the exact Vercel variables](../payment-expiry.md#prepared-production-credentials-2026-10-22).


## 2026-10-22 — Verify pre-evaluation upload, GPT and notification journey

- Kept the owner-accepted model/v3 benchmark unchanged and updated the checklist
  before testing. Used one clearly synthetic PDF/application in restricted cloud
  preview; all live test mail went only to `errplusone@gmail.com`.
- Added opt-in application-scoped Resend dispatch to the existing Next request/AI
  lifecycle. Recipient/scope filters protect historical queue entries; notification
  outages leave saved applications/results intact. No separate worker is required.
- Real browser submission, Dropbox save/download byte equality and automatic GPT
  analysis passed. One two-page document, one 12.33-second AI run, six correct
  evidence page references and 1,597 tokens; submission-to-result took 16.58 seconds.
- Verified customer-only unpaid withholding, anonymous denial and paid publication
  with an audited synthetic paid-state fixture. Confirmation/result emails each
  sent once and both provider receipts are `delivered`; repeated reads/completion
  did not duplicate analysis or mail. Stripe checkout/webhook was not exercised.
- Result-link reload, CRM Test list/detail, desktop 1280px and mobile 390px passed.
  Corrected completed-result copy that still told paid customers to wait for payment.
  Full suite: 498 passed; TypeScript and diff checks passed; no build/deploy/push.
- Retained synthetic case `1a25c57d-194c-4c53-9500-b1623886f6e7` for inspection.
  See [journey evidence and limits](../pre-evaluation-local.md#october-22-full-customer-journey-acceptance).


## 2026-10-22 — Collapsible CRM sidebar

- Replaced the Visit AET website trailing arrow with a globe icon and theme-orange
  text on a pale orange background.
- Added a desktop toggle between the full sidebar and a 72px icon rail, keeping
  the AET emblem, active navigation, named icon tooltips, refresh and account
  controls. The content area expands, and browser storage remembers the choice.
  Mobile retains the full drawer navigation.
- TypeScript and diff whitespace checks passed. After the owner reopened the
  local page, Codex in-app verification passed at 1440px and 390px: full/sidebar
  icon layouts, the orange website link without a trailing arrow, reload
  persistence, keyboard expansion and mobile drawer open/Escape-close behavior.
  Desktop collapse also remained set when resizing back from the mobile drawer.
  Screenshots were saved under `/private/tmp/aet-crm-sidebar-20261022/`.
- Presentation-only update; no application data or staff login changes.

## 2026-10-22 — Align formal Status with the legacy payment window

- Corrected the deadline to `submitted_at + 48 hours`, with no creation-time
  fallback. Persisted expired payments no longer show a running timer; paid,
  failed/refunded and disconnected preview intakes have no pending countdown.
- Confirmed the old GitHub workflow is `disabled_inactivity`; latest visible
  success is May 18, 2026. Did not reactivate or dispatch that production task.
- Added an opt-in, secret-protected daily replacement with atomic pending-to-expired
  updates, batch bounds and dedicated least-privilege role setup. Production
  provisioning/activation remains an explicit deployment step; CRM cannot write payments.
- Passed 38 focused tests, TypeScript, 19 rolled-back SQL/permission checks and
  local endpoint authorization. In-app desktop and 390px mobile checks passed for
  the real historical application's expired-window state. No business rows changed.
- See [payment-expiry rules, scheduler evidence and activation](../payment-expiry.md).


## 2026-10-22 — Restore the standalone legacy GPA calculator

- Replaced the connected CRM's simplified 4.0-scale modal with a new-tab link to
  `/admin/CRM/gpa-calculator`, protected by the same staff session check as CRM.
- Compared directly with `aet-app/src/components/gpa/GPACalculator.tsx`: preserve
  course-name/credits/grade rows separated by tabs or spaces, case-insensitive
  aliases, the A+ 4.35 scale, credit-only P/CR/T and GPA-counted F/WF.
- Preserve the copyable GPA Summary labels, six-decimal GPA, three-decimal total
  credits and two-decimal grade subtotals, with combined F/WF and P/CR rows.
  Show T when present (the old UI counted but omitted it); malformed rows now
  produce line-specific errors instead of silently lowering the course count.
- Added responsive input/result panels, grading reference, Copy summary and Reset.
  Editing input invalidates the previous result. Calculation stays in the browser;
  there is no application write or transcript persistence.
- Passed eight focused GPA tests and TypeScript. Existing 3022 server returns
  307 to staff login for unauthenticated access and 308 from the localized legacy
  URL to the canonical staff URL. Initial in-app verification reached login.
- On the owner's follow-up request, used their open authenticated Chrome tabs to
  calculate identical synthetic inputs on the live legacy page and the new
  `http://localhost:3022/admin/CRM/gpa-calculator` page. No IP-address alias used.
  Twenty mixed courses returned GPA `2.517187` and total credits `41.000` on both;
  all original distribution rows matched after whitespace normalization. Covered
  every letter-grade band, fractional credits, mixed tabs/spaces, lowercase grades,
  Fail/Pass/Credit aliases, WF and T. The new T row is the only summary-content
  difference: one course / 3.00 credits, already counted in both total-credit values.
- The original two-course example also matched: GPA `2.736364`, total credits
  `5.500`, and every summary row. Desktop result screenshots were inspected and
  saved with the exact inputs and rendered outputs. Mobile remains unverified.
  No real transcript or applicant data was used or changed.
- No server restart, production build, commit, push or deployment in this task.

## 2026-10-22 — Simplified CRM navigation and overview

- Temporarily hid FCE and Payment links in the shared desktop/mobile navigation;
  Applications, Pre-evaluation and Test remain visible. Direct view URLs and the
  application Payment drawer shortcut remain available.
- Hid the four overview cards in live and test workspaces, allowing the list to
  follow the page heading without an empty statistics area.
- Verified localhost:3022 in the Codex in-app browser at 1440px and 390px:
  live application list, mobile navigation and Test list. TypeScript and diff
  whitespace checks passed. No new tests were added for this presentation change.
- Presentation-only update; application data and staff login behavior are unchanged.

## 2026-10-21 — Committed v3 baseline comparison

- Committed the reviewed GPT integration, degree title and page-identity refinement
  as `1372473`, then ran the same four cases once with unchanged inputs/model.
- Four completed calls took 14.50, 15.68, 13.51 and 13.53 seconds. Total batch was
  57.40 seconds versus 72.64; mean analysis time 14.30 versus 18.11. Tokens rose
  from 85,051 to 88,774 (+4.4%). The observed 21.0% time reduction is one comparison,
  largely driven by one case; it is not a demonstrated repeatable speed-up.
- Degree levels agree in 4/4; full reference equivalency remains 3/4. The fourth
  output is more specific but still uses a different US field/concentration mapping.
  Staff-approved normalization policy remains open; no answer hardcoding was added.
- Source-page visual review found no wrong page locations among 30 v3 evidence
  items, compared with three wrong locations in the baseline. Valid IDs do not
  independently verify the semantic truth of future claims or excerpts.
- Private comparison, raw responses and timing/usage records remain Git-ignored.
  No changed labels, hidden retries, database writes, emails, payment, deployment
  or push. See [benchmark comparison](../preeval-benchmark.md#v3-comparison-results).


## 2026-10-21 — Degree title and physical-page evidence implementation

- Added structured US degree level/name/field/concentration, distinct from source
  qualification. Complete customer titles are assembled within the existing limit;
  ambiguous evidence can still return Unable to determine. No case answer rules.
- Replaced multi-page counting with individually identified single-page PDF inputs.
  Model evidence references are resolved to original locations by the server;
  unknown IDs are rejected and short excerpts are retained. Originals and existing
  limits remain unchanged. This verifies location, not semantic truth of a claim.
- Passed 113 focused tests, the full 464-test suite and TypeScript; all 23 real source
  pages rendered identically after copying. Source documents, reference answers
  and baseline outputs are unchanged. No OCR, frontend edit, database migration,
  server restart or build was needed for this refinement.
- The verified implementation was committed as `1372473` before the second
  four-case live benchmark; measured comparison is recorded above.


## 2026-10-21 — Historical pre-evaluation GPT baseline

- Ran four private cases once each through the unchanged production analysis
  function, using `gpt-6.1-sol` and prompt `preeval-direct-files-v2`. All four
  completed; no hidden retry, reference-report upload or prompt tuning.
- Calls took 13.49, 16.00, 12.52 and 30.44 seconds; total sequential batch 72.64
  seconds, mean 18.11 seconds. Usage: 83,065 input + 1,986 output = 85,051 tokens.
  Local file-to-analysis timing excludes Dropbox, queue, CRM, payment and email.
- Assistant comparison found matching bachelor level in 4/4 cases, full reference
  equivalency in 3/4, and one partial US field/concentration mapping. A separate
  visual check identified three wrong citation page locations in one case despite
  its correct degree conclusion. No general accuracy claim or staff sign-off.
- Added an opt-in timed runner with offline preflight, hashes and private raw/parsed
  output. Passed 18 existing AI tests and TypeScript including the runner. Stored
  analysis and proposed improvements in the ignored run directory; production
  prompt, UI and workflows remain unchanged. No server restart, build or deployment.
- Priorities: preserve US degree/concentration detail, validate evidence locations,
  remove irrelevant course-level caveats, then benchmark input/latency optimizations
  and broaden the independent test set. See [benchmark instructions](../preeval-benchmark.md).

## 2026-10-21 — Private degree-only pre-evaluation benchmark

- Built four owner-provided historical FCE cases in the Git-ignored
  `.local/preeval-benchmark/fce-v1/` directory. Kept byte-exact source/report copies,
  source inventory, SHA-256 hashes, page maps and exact report paragraph citations.
- Expected labels cover only US degree level, field and concentration. GPA, credits
  and course results were not extracted or scored. Original uploaded transcripts
  and reference reports remain unchanged, including any grades they contain.
- Prepared five input PDFs containing all 23 original pages. Split the 11-page
  input into 10 + 1 pages; rendered comparison confirmed identical pixels for all
  11 pages. Missing submitted form values remain blank, never inferred from answers.
- Offline validation passed for all cases. Eight deliberate negative checks rejected
  hash mismatch, incorrect page mapping, reference-as-input, path escape, extra
  answer metadata, report-derived form fields, extra request documents and symlink
  escape. Confirmed the local corpus is Git-ignored and diff whitespace is clean.
- No actual model calls, accuracy scores, database writes, Dropbox uploads, emails,
  UI changes, server restart, build, deployment or commit in this dataset task.
  A live benchmark runner remains separate. See [instructions](../preeval-benchmark.md).

## 2026-10-20 — Automatic pre-evaluation execution within Hobby technical limits

- Updated the checklist before implementing request-triggered Next `after()` jobs.
  The existing 3022 server now runs eligible submissions, completed upload batches
  and customer/staff retries. Authorized application reads resume due jobs, with
  existing atomic claims, backoff, retry caps and upload/correction fencing.
- Added a secret-protected, opt-in daily recovery route, limited to three attempts,
  and a single daily Cron entry. Execution routes use Node.js and 300-second limits.
  No minute Cron, paid queue, separate hosted process or second local terminal is
  required. Daily recovery is off by default; Preview/local Cron does not auto-run.
- Fixed the real Next/Dropbox Buffer-versus-Blob response difference across AI and
  document downloads. Static upload-hook imports also avoid the Node/tsx dynamic
  import failure found during integration checks. No OCR was added.
- Passed 240 focused tests, TypeScript and 40 isolated DB/Dropbox checks. In-app
  browser confirmation triggered one real GPT request through 3022 and automatically
  reached Completed on desktop and mobile. The returned model was `gpt-6.1-sol`,
  with 2,475 tokens. A second HTTP scan-PDF check took 19.4 seconds and 2,951
  tokens; concurrent completion requests produced one run. Duplicate reads did not regenerate. Customer-only
  API access preserved the unpaid result gate; the browser used its existing staff
  session. An authenticated download matched the original bytes exactly.
- Removed synthetic rows/files, including the interrupted-test fixture. No mail
  dispatch, payment, additional dev server, deployment or production cutover.
- Hobby compatibility is technical only: its terms restrict use to personal,
  non-commercial projects. Paid-service hosting eligibility, production guards,
  Fluid Compute settings and hosted Cron/function acceptance remain open.
  See [execution setup](../pre-evaluation-local.md#vercel-execution-and-free-tier-technical-limits)
  and [acceptance](../pre-evaluation-local.md#automatic-execution-acceptance-on-port-3022).

## 2026-10-20 — Pre-evaluation direct GPT file analysis

- Updated the migration checklist first. Added an independent Responses API worker
  that reads original PDF/images from canonical and historical Dropbox paths,
  without OCR or a local Codex subprocess. Added server-only key/model placeholders.
- Upload batches, durable claims, heartbeats, bounded retries and version/run
  fencing protect partial uploads and staff corrections. Customer/staff file lists
  include shared uploads. Paid result release remains unchanged. AI never dispatches
  mail or calls Stripe. Staff CRM includes run metadata and evidence references.
- Applied the additive migration only to private preview schemas; verified RLS and
  browser-role denial. The security advisor reported no new-table finding.
- Passed 157 focused tests, TypeScript, offline Dropbox checks and 28 isolated
  real DB/Dropbox integration checks with injected model responses. Customer
  desktop/mobile confirmation, waiting, failure and retry were checked in-app.
  English CRM history/evidence and regeneration were also verified on desktop
  and mobile. Synthetic applications and files were removed afterward.
- After the owner added the API key, live `gpt-6.1-sol` acceptance passed for text
  PDF, image-only PDF, PNG and blank evidence. Six requests including two diagnostic
  rechecks used 9,188 tokens. Extracted facts, conflicts, insufficient evidence,
  persisted results/usage, payment gating and duplicate-job prevention were checked.
  PDF input now requests high detail. Prompt v2 removes unsupported speculation
  about file parsing; the conflict case was rerun successfully. Test rows/files
  were deleted; no email was enqueued or sent, and no payment was made.
- Hosted execution acceptance, deployment and production cutover remain separate. See
  [the setup and live acceptance guide](../pre-evaluation-local.md#live-gpt-acceptance).

## 2026-10-20 — Unify application document storage

- Updated the checklist first, then shared the applicant-name/application-ID
  folder rule across FCE, pre-evaluation, Status/CRM and the older local pilots.
  New applications pin the resolved location in their creation transaction.
  Historical records pin on first document access or before a live FCE office
  reassignment. Later name/office edits retain the saved storage account/path.
- Preserve old pre-evaluation email-folder reads and recorded isolated-pilot
  per-file paths. New applications do not inherit old email-folder access.
  Retries preserve the existing file path; formal pilot reports stay under a
  child directory excluded from the customer document list. No historical
  customer files were moved, renamed or deleted.
- Generated the location-registry migration through the Supabase CLI and applied
  it only to the private `aet_preview_evaluation` schema. Verified RLS, denied
  browser-role access and restricted runtime SELECT/INSERT. No legacy business
  table was migrated. Deployment targets must receive the migration before code
  rollout. Security-advisor output had no finding for the new table; existing
  unrelated findings remain outside this scope.
- Passed 30 real integration assertions for canonical/historical upload and
  download, byte equality, chunking, retry deduplication, application isolation,
  cursor binding, concurrent initialization, immutable locations and report
  hiding. Passed 128 focused tests across 11 files, TypeScript and the offline
  Dropbox checks.
- The East Dropbox app can upload/list, but its provider rejected downloads for
  missing `files.content.read`. Boston/New York reads need that external
  permission fixed and retested; this run did not change OAuth authorization.
- Used the owner's running 3022 server for Status upload, list refresh/reload and
  desktop/mobile visual verification. Both sizes showed the saved file; a backend
  download matched the source bytes. Evidence is under `output/playwright/` in
  `dropbox-path-desktop.png` and `dropbox-path-mobile.png`.
- Cleaned up synthetic database records and generated Dropbox folders using
  recoverable deletion. No email, AI processing, payment, build, commit, push or
  deployment was performed. See [Dropbox documentation](../dropbox.md) for rerun
  commands, compatibility rules and release prerequisites.

## 2026-10-20 — Reconcile dev progress

- Audit baseline `40eb360`: reconcile the current checklist with route/form guards,
  database adapters, migrations, CRM, documents, email and prior acceptance records.
  Retain the findings as the current checklist and written progress analysis.
- Mark the new formal intake's persistence, confirmation, Status uploads and CRM
  inspection as completed with recorded dev Preview acceptance. Preserve open
  staff-processing, application-payment, report-delivery and production gates.
  Separate older local pilot acceptance from the newer version-2 journey.
- Correct stale statements about disabled submission, staff email-link login,
  globally disabled external services and separate preview Dropbox storage.
  Document the real office CC and shared live CRM/database boundary.
- Identify the next integration work: authorized version-2 staff actions, document
  readiness metadata, confirmed quotes, payment state/hosted callbacks, and reliable
  notification/report delivery. Record main-only `71ddcf9` for later reconciliation.
- Fresh checks pass: 385 tests across 32 files, TypeScript, 586 messages per locale,
  offline Dropbox/payment/contact checks. No new browser/hosted acceptance, database
  mutation, email, payment, build, commit, push or deployment in this documentation audit.

### Integration gaps and next implementation

The new formal-evaluation intake has recorded dev Preview acceptance through
submission, confirmation, Status uploads and staff inspection. The hosted run
used `58da862`; the subsequent document-count, file-size and wording fixes were
verified locally through `40eb360`. Hosted re-verification of those fixes remains
open. No new external acceptance was performed during this documentation audit.

| Gap | Current code evidence | Required next result |
| --- | --- | --- |
| New-intake staff workflow | [IntakeDrawer](../../components/crm/intake-drawer.tsx) is read-only; [formal API](../../app/api/evaluation/[...path]/route.ts) rejects version 2 | Add office-authorized review, missing-material requests and confirmed quotes with audit history; preserve the submitted snapshot and CRM projection consistently |
| Documents versus processing | [Dropbox integration](../dropbox.md) lists provider files; [older workflow](../../lib/evaluation-application/service.ts) requires `evaluation.files`, readiness and input versions | Define durable file references/readiness and report freshness, including existing uploads; a file count alone is not processing readiness |
| Payment truth | [new Status projection](../../lib/customer-status/model.ts) returns `payment: pending`; [Status controls](../../components/customer-status/sections.tsx) disable new-intake payment | Connect application-linked checkout, verified webhook/reconciliation, actual paid state in Status/CRM and one receipt |
| Notifications | [submission route](../../app/api/application-intake/route.ts) attempts delivery through `after()`; [sender](../../lib/application/intake-email.ts) supports leased retries | Add scheduled recovery and staff failure handling; connect quote/payment/result events to new intake |
| General application model | [saveIntake](../../lib/application/intake-server.ts) stores an evaluation-specific snapshot and compatibility rows | Define shared service contracts as services are connected; a broad database rewrite is not required to finish the current evaluation journey |
| Hosted and production scope | [runtime guard](../../lib/preview-environment.ts) accepts local or configured dev Preview; [pilot config](../../lib/preeval/config.ts) blocks older external clients in cloud preview | Establish hosted application payment/worker operation and acceptance before separately authorized production cutover |

Live CRM can edit existing business records. Test intake database isolation does
not isolate the existing Dropbox accounts, LA archives or real office email CC.
Customer Status retains the requested application-ID access model. Email records
track delivery metadata, not a complete two-way email inbox.

Standalone `/payment` does not mark a new intake paid. The older formal pilot
already has sandbox checkout, signed events, reconciliation and PDF release;
pre-evaluation also has AI/results. Reuse these foundations through explicit
new-intake adapters rather than removing the existing guards.

Recommended order: recheck hosted fixes and reconcile main-only `71ddcf9`; make
new intake operable by staff; connect application payment; complete report/mail
delivery and recovery; then integrate unified pre-evaluation and translation.
Preserve old links, reconcile data/payments/files and rehearse rollback before
domain cutover or retirement. Detailed acceptance criteria remain in the
[current checklist](migration-checklist-2026-10-22.md#next-delivery-order-and-acceptance).

## 2026-10-20 — Fix the three Preview acceptance findings locally

- Test CRM document counts now read all pages from the existing staff-authorized
  Dropbox endpoint used by Documents, deduplicate file IDs and limit concurrent
  record lookups to three. Only visible version-2 test intakes use this lookup;
  live records and older storage flows retain their existing behavior. Failed or
  incomplete reads show an unavailable state, never a misleading zero. Counts
  refresh with navigation/manual refresh, without tab-focus polling.
- Customer saved files, upload queues and CRM Documents share B/KB/MB formatting.
  The existing 687-byte PDF now displays `687 B`, and the large fixture `6 MB`.
- Updated English/Chinese/Spanish form and receipt copy to describe Status uploads,
  disabled test payments and the existing office CC. The confirmation email now
  points to test-document upload instead of describing a local-only workflow.
  Recipient routing, previously sent messages and payment behavior are unchanged.
- Passed 51 focused tests covering pagination, duplicate files, empty/error states,
  cancellation/concurrency, byte units, office authorization, intake and email
  routing/assets. TypeScript and all three locale checks passed.
- In-app browser verification on owner-run localhost:3022 passed: Test desktop and
  390px mobile counts showed two files for the acceptance record and the older
  uploaded test record, with zero for the two empty records; manual refresh kept
  the correct counts. CRM Documents and desktop/mobile customer Status displayed
  both PDFs with correct units. Form upload/CC instructions and the rendered mobile
  email template were checked. Mobile CRM/Status had no page-width overflow.
- Reused existing synthetic records/files; no new application, upload or email was
  submitted during this fix. No auth, environment, database or Production changes.
  This entry records local dev verification only; no commit, push or deployment.

## 2026-10-20 — Exercise the hosted application-to-CRM flow

- Tested the stable dev Preview at commit `58da862` using the authenticated
  Chrome session. The in-app browser requires Vercel sign-in; no protection
  setting was changed. This pass covered desktop browser behavior.
- Submitted one clearly fictional Miami application through the public form:
  `9b41e75f-1ae6-4666-9a26-e03dbc44dda1` (TEST Preview E2E 1020). Required-field
  validation, two education records, selected qualifications, review, draft
  restoration after reload and the $150 estimate passed. Read-only SQL checks
  found one intake row, one Test CRM projection and zero matching live rows.
- Status automatically opened the saved application, displayed the same details
  and estimate, rejected malformed IDs and handled a nonexistent valid UUID.
  The native file picker excluded TXT. Actual uploads saved a 687-byte PDF and
  a 6,292,854-byte PDF, exercising the small-file and chunked paths. Both remained
  visible after reload and appeared in CRM Documents. Dropbox rendered the large
  PDF's synthetic content successfully. No customer document was uploaded.
- The confirmation outbox recorded one successful attempt. Resend reported
  `delivered` to the fixed test recipient with the existing Miami office CC.
  The subject contained the test marker and application ID; both Status links
  used HTTPS, the stable dev host and `source=preview`. Logo assets used the
  public website host. Inbox placement/read status was not independently checked.
- CRM manual refresh found the fourth isolated application. Search, opening a
  row via its date cell, Copy ID feedback, Education/Service/Payment/Documents
  tabs, and the localized Status-link destination passed. Filtered CSV export
  produced exactly one matching application (419 bytes); the browser download
  event waiter timed out, but the native download UI and saved CSV verified success.
- A separate deployment-origin session without an app login redirected CRM to
  login, rejected fictional incorrect credentials and returned `access_denied`
  from the staff-workspace endpoint. The stable native-admin session continued
  to work. The owner previously confirmed fresh correct-password sign-in.
  Live Pre-evaluation and Payment lists loaded; FCE showed 20 rows per page.
- Open findings: Test list document count remains zero after two Dropbox uploads
  (`components/crm/workspace.tsx` reads the older `row.files` source). Customer
  file sizes below 0.01 MB round to `0 MB` (`components/documents/file-manager.tsx`).
  Intake form/receipt copy still says local testing excludes uploads, and its
  recipient-only wording omits the existing office CC (`lib/application/intake-copy.ts`).
  The intake email notice also still describes local-only links/no upload request
  (`lib/application/intake-template.tsx`). These findings are fixed locally in the follow-up entry above.
- Current limits: this intake is intentionally read-only in CRM and payment is
  disabled. Other unified-form service choices are preview-only. This pass did
  not exercise real-record edits, payment settlement, report release, alternate
  staff-office roles, upload interruption/retry, email failure/retry, or mobile.
- Vercel API confirmed dev is READY on `dpl_EAVGBh4Q4soirqVmfethhWtqzHqQ`.
  Production remained on `dpl_FoFAiaXqdc4UNEzJvbwCuNB8Wc2v`, main commit
  `71ddcf9`. No employee account, live business record, deployment setting or
  runtime code was changed. Retained the single marked test application and its
  two synthetic PDFs for owner review. No build, commit, push or deployment.

## 2026-10-20 — Verify the hosted dev Preview

- With owner authorization, committed and pushed Preview runtime adaptation
  `bea638f` to the Vercel-linked `MeiyuTech/aet-website-2026` dev branch. Vercel
  deployment `dpl_CaaG6ZHxNm7eCPeXhKUDWHykMCJy` reached READY and received the
  stable dev branch alias. No local production build was run.
- The owner confirmed a successful fresh sign-in. Browser checks independently
  verified the existing native-admin session and live CRM on the hosted branch
  URL: 1,191 applications, 20 rows per page, search, and direct Payment drawer
  navigation. The Test section loaded its three isolated applications and the
  same detail drawer.
- The live Documents tab listed all three PDFs for the checked San Francisco
  record. Opening its file link reached the authenticated Dropbox PDF viewer.
  The isolated test record listed its two existing uploaded image files. These
  checks were read-only; upload/write behavior was not re-tested on Preview.
- Before/after Vercel API snapshots confirmed that Production stayed on the same
  main deployment and all 56 environment records were unchanged by this push.
  The 33 dev overrides remain Preview/dev-only. Both employee migration/cutover
  switches stay disabled; no employee account or business record was changed.
- The in-app browser was gated by Vercel sign-in. Visual checks used the owner's
  already-authenticated Chrome session; no protection setting was changed.

## 2026-10-20 — Configure branch-scoped Vercel dev Preview

- Added and verified 33 server-side environment entries scoped only to Preview /
  `dev` in the existing `aet-website-2026` Vercel project. API snapshots confirmed
  every pre-existing variable record remained unchanged; Production stays on main.
  Credentials were read from existing local configuration without displaying or
  committing them. No service-role, live Stripe or PayPal credential was added.
- Added exact-origin support for the stable dev branch URL and the current Vercel
  deployment URL. Hosted configuration requires Preview + dev + cloud-preview,
  both employee switches off, and the same restricted database roles. Existing
  local 3022 remains supported; other hosts, branches and Production are rejected.
- Passed 88 focused tests and TypeScript. Under simulated hosted configuration,
  read-only `select 1` checks passed for all three cloud connections and Supabase
  Auth settings returned HTTP 200. The owner-run 3022 login route returned 200.
  Vercel's variable list visually confirmed Preview/dev labels and masked secrets.
- No local production build, employee/business-record mutation, email send, push
  or deployment. Hosted login/CRM/status acceptance still requires deployment of
  this code. Payment webhooks and worker/AI operation remain separate work.


## 2026-10-20 — Make upload completion clear

- Customer uploads use an orange picker/action, green saved rows and progress,
  checkmarks, and a batch-complete message. Completed batches no longer show
  the keep-open warning. The native file input is replaced by a translated picker.
- Added compact format/size/chunk limits, retry guidance, and clickable LA/SF
  and other-office email contacts in English, Chinese and Spanish.
- A short Web Audio chime plays once after all files in the attempted batch are
  confirmed saved. Audio is unlocked by the upload click; unavailable audio
  does not affect saving. Failed or cancelled batches do not play a success tone.
- Verified a real upload of the existing public header logo on the synthetic
  Miami status record at localhost:3022, then its green completion state on
  desktop and 390px mobile. No page overflow or browser warnings/errors.
  TypeScript and all three locale checks passed. A mocked upload/audio check
  covered complete success, partial failure, total failure and unavailable audio;
  speaker output was not independently measured. Dropbox paths/chunks unchanged.

## 2026-10-20 — Add the Payment detail shortcut

- Moved Payment before Status in the shared live/test application table.
- Added a Payment trigger using the Education/Service hover and focus styling;
  it opens the Payment drawer tab directly on desktop and mobile.
- Preserved recorded amounts, quote-needed labels, payment-state colors and
  existing record permissions. No database or authentication changes.
- Validation: TypeScript and whitespace checks passed; checked the Test list
  at localhost:3022 in the in-app browser at desktop and mobile widths, including
  column order, focus highlight and opening the Payment tab.

## 2026-10-20 — Simplify application rows and add quick actions

- Removed the trailing application arrow column and mobile identity arrow.
  Clicking a non-interactive part of a row/card opens its overview drawer;
  Education and Service controls still open their respective sections. Desktop
  rows also support Enter/Space.
- Added Copy ID with success/error feedback and a customer Status link beneath
  the drawer identity. Formal live links use the new Status page; intake links
  preserve their stored locale and preview source. Other record kinds retain
  Copy ID without advertising an unsupported status lookup.
- Added a blue truck in Service when stored delivery requires mailing, following
  the legacy delivery-method rule for live records and saved delivery for test
  records. No record writes, authentication changes or delivery actions.
- Verified on owner-run localhost:3022: desktop row opening from the date cell,
  copy success feedback, live and test Status link destinations, the Rachelle
  record's mail icon, and desktop/mobile drawer layouts. Preview list query
  returned its three records. TypeScript, 26 focused CRM tests and whitespace
  checks passed. No build, push or deployment.

## 2026-10-20 — Match the legacy Dropbox file table

- CRM Documents uses File Name / Size / Uploaded Time columns. Blue file names
  open the existing Dropbox preview links in a new tab, with full-name tooltips.
  Dates include hours and minutes using the old viewer formatting.
- Verified three real file links and rendered table at localhost:3022 in the
  in-app browser on desktop and at 390px. No horizontal page overflow on mobile.
  TypeScript and whitespace checks passed. File contents were not reopened;
  the existing Dropbox sign-in requirement remains unchanged.

## 2026-10-20 — Connect CRM document lists to existing Dropbox folders

- Consolidated overlapping Documents implementations after the owner assigned
  this work to the dashboard chat. Retained the requested legacy folder rule:
  Status and CRM share `contextFor`; preview selects records without adding a
  Dropbox directory prefix. This supersedes the earlier preview-storage note below.
- Live and intake drawers now share a file list with names, sizes, update dates,
  manual refresh and pagination. Links open Dropbox preview. Each read checks
  active staff identity and the selected application's existing office grant;
  request parameters cannot supply a folder, name or office.
- Verified the supplied Fen Jiang live application on localhost:3022: three PDF
  files were returned and rendered in the original desktop drawer. Clicking the
  first file reached Dropbox sign-in. The owner chose to perform the remaining
  file-opening, mobile and upload-to-CRM checks personally; those are not claimed
  as verified in this change. No files were moved, uploaded or deleted here.
- TypeScript, 20 focused tests, offline Dropbox checks and whitespace checks
  passed. No employee login changes, push, deployment or server restart.

## 2026-10-20 — Align test CRM details and simplify navigation

- Moved Test to the left navigation, ordered Applications / FCE / Pre-evaluation /
  Payment links / Test. Removed the inline preview switch, workspace Documents
  entry and document strip. Per-record Documents remains available.
- Replaced the intake receipt inside the test drawer with the live drawer's shared
  identity, badges and six tabs. Education and Service reuse the same white cards;
  saved prices, linked qualifications, notes and confirmation delivery remain
  visible. Education/Service list actions open their matching section directly.
- Preserved the original read-only intake endpoint, live write endpoints, office
  permissions and employee authentication. No database writes, email sends,
  payments, deployment or push were performed.
- Verification: owner-run dev server on 3022; in-app browser checked live FCE,
  test navigation, all six test sections, direct Education entry, 1440px desktop
  and 390px mobile layouts. Typecheck and 12 focused CRM tests passed.

## 2026-10-20 — Move Dropbox work to dev and connect the existing status page

- Corrected the checkout mistake: backed up both trees, moved the reusable
  Dropbox code/configuration/dependency to `aet-website-2026-dev`, and restored
  the task's tracked/untracked changes, appended local settings and dependency
  in `aet-website-2026`. Main reports a clean working tree. Unrelated dev CRM,
  design and email work was preserved; no merge or commit was created.
- Integrated into the existing `customer-status` endpoint and documents card.
  It signs access from the selected live/preview record. The current application
  opens without another ID/email form; service, delivery, payment, education and
  email sections stay in place. Submitted/processing upload eligibility is
  enforced by both upload routes. Refresh rechecks the two-hour access snapshot.
- Live records keep original office folders and LA submission-date archives.
  Preview records use `{account base}/AET-FormalEvaluation-Test/{office}/{name} - {id}`
  and never copy into live LA archives. The signed storage source also binds
  chunk continuation. Existing pre-evaluation storage behavior is unchanged.
- Reused the owner's running port 3022. In-app browser checked the exact supplied
  preview URL and connected list/uploader. Playwright CLI additionally uploaded
  a 1 KiB synthetic PDF and a 6 MiB + 701 byte PDF through the real UI/API/Dropbox
  flow; both reached saved 100%, with the large file using three 3 MiB chunks.
  Downloaded bytes matched both local file sizes and full Dropbox content hashes.
  Only those two exact synthetic file IDs were recoverably deleted afterward.
- Desktop 1440px and mobile 390px upload states passed visual checks; mobile had
  no horizontal overflow and no repeat application-ID/email inputs. Fresh status
  visits had no Google tag script. Evidence: `output/playwright/dropbox-dev-desktop.png`
  and `output/playwright/dropbox-dev-mobile.png` (captured before test cleanup).
- TypeScript, i18n (579 messages per locale), 19 customer-status/intake tests,
  expanded offline Dropbox checks and whitespace checks passed. Added checks for
  signed preview/live separation, no preview LA copy, read-only statuses and
  unavailable document configuration preserving the application response.
- No build, server restart, push or deployment. Hosted limits/configuration and
  acceptance with a real applicant remain release checks.


## 2026-10-20 — Blue-gradient business email design

- Committed the prior sender/CC/public-asset fixes as `e430289` before starting
  this design. Unrelated CRM changes remain outside that commit.
- Applied a shared navy/blue gradient hero to all seven business templates, with
  shorter white headings, one orange pill action at the top, a tighter logo band,
  compact fee sections and a light footer. HTML text and solid navy fallback remain.
- Preserved business data, payment states, pending quotes and public asset URLs.
  No delivery code changed, and no test email was sent for this design exploration.
- Passed 54 relevant tests, TypeScript and whitespace checks. In-app browser verified
  intake desktop/mobile, primary action, body and footer. Supplemental checks covered
  all seven templates at 900px and 390px: logo loaded, no horizontal overflow, one
  primary button each. Pending quotes still make no payment request.
- Screenshots: `output/playwright/gradient-{intake,payment,result}-{900,390}.png`.
  Gmail/Outlook rendering of the new gradient is not yet verified. The owner
  approved committing this design. No build, restart, push or deployment.

## 2026-10-20 — Public assets for delivered emails

- Separated email image/font hosting from local application URLs. All seven
  templates and the dev gallery use `EMAIL_ASSET_ORIGIN`, defaulting to the public
  website. Removed the intake renderer's fallback to the local application origin.
- Verified the public PNG and all three Poppins files return HTTP 200 and match
  local assets byte-for-byte. All seven live preview responses contain public
  HTTPS image/font URLs. Invalid/local asset-origin configuration is rejected.
- Passed 54 focused unit tests, TypeScript and whitespace checks. In-app browser
  verified intake desktop and 390px mobile with the public logo visibly loaded.
- Resent the existing owner-authorized TEST application confirmation to the same
  recipient and Miami CC. Retrieved Resend's stored HTML and verified the public
  image URL; the original delivery record was preserved. No email body stored.
  The owner confirmed that the image now displays correctly in Gmail.
- No build, server restart, commit, push or deployment. Local application links
  remain local; this change only fixes hosted email assets.

## 2026-10-20 — Verified sender domain and office CC

- Updated dev sender configuration to `AET <info@americantranslationservice.com>`;
  Resend reports the domain verified with sending enabled. Production unchanged.
- Formal intake, payment and fee notices resolve office CC from saved data, using
  legacy mailbox mappings. Unknown offices pause delivery; CC changes invalidate
  retry digests. Pre-evaluation has no office assignment to infer. No body storage.
- Passed 51 focused unit tests, TypeScript, 14 isolated formal-delivery checks and
  30 intake/database/HTTP checks. Integration sends used injected transports and
  removed only their disposable fixtures. Existing TEST application was preserved.
- Sent one owner-requested TEST confirmation to the approved test recipient with
  Miami CC using the new sender; Resend reports `delivered`. Kept the original receipt and
  recorded only metadata for this additional send. Inbox placement is unverified.
- Reused port 3022; no UI edits, build, server restart, commit, push or deployment.

## 2026-10-20 — Title Case email headings

- Updated all seven business emails' main headings, subheadings and intake step
  titles to Title Case. Application data and body prose are unchanged.
- In-app browser verified intake desktop/mobile; supplemental browser checks
  confirmed all seven heading sets and no horizontal overflow at 390px.
  Evidence: `output/playwright/email-title-case.png`. No emails sent.
- Pre-commit validation passed all 315 tests across 25 files and TypeScript.

## 2026-10-20 — Match email typography to the homepage

- All seven business templates now load the same locally hosted Poppins assets
  as the homepage: 400 for body copy and 600 for headings/actions, with 700 for
  strong emphasis and Arial/Helvetica fallbacks. Primary button labels use Title
  Case, including the pending-quote variant.
- TypeScript and whitespace checks passed. In-app browser verified formal intake
  desktop/mobile. Supplemental browser checks confirmed Poppins 400/600 loaded,
  correct button labels and no horizontal overflow for all seven templates at
  900px and 390px. Evidence: `output/playwright/email-poppins-*.png`.
- No delivery logic changed or emails sent. Inbox font support remains dependent
  on the receiving client; the preview confirms browser rendering only.

## 2026-10-20 — Unified business email templates and missing receipts

- Applied the approved formal-confirmation design to the other four customer
  templates. Added the missing legacy payment confirmation and service-fee update
  templates, bringing the development gallery to seven business categories.
  The owner excluded Thanksgiving/Christmas promotions. Staff login-link and
  password recovery emails remain removed. See [email inventory](../email-templates.md).
- Added atomic, reference-only formal payment/quote delivery records and connected
  the optional formal pilot payment callback, staff quote action and worker.
  Rendering reads canonical application data, confirmed payment details and the
  referenced quote audit. Duplicate payment events cannot queue another receipt;
  superseded quotes/refunded payments are withheld. No subject or HTML is stored.
- Generated and applied the formal delivery migration only to the isolated preview
  schema. Existing intake receipts were unchanged. The cloud-preview worker stays
  paused, fixed test-recipient limits remain, latest intake payment actions stay
  read-only and the live CRM adapter still does not send notifications.
- Passed 82 focused template/delivery/intake/customer/workflow/auth tests and
  TypeScript. The final pending-quote copy adjustment passed its 32 relevant tests.
  Passed 12 isolated database checks covering transactional queueing, current data,
  quote supersession, payment replay, refund blocking and browser-role denial.
  Synthetic records were removed. No mail or Stripe transaction was sent.
- In-app browser checked payment desktop/mobile, fee-pending mobile and result
  mobile states. Supplemental screenshots and layout checks covered all seven
  templates at 900px and 390px: logos loaded and no horizontal overflow. Gallery
  selections, pending/confirmed quote states and width switching work; iframe
  height fits content and stays stable on resize. Screenshots:
  `output/playwright/business-mail-*.png`. Gmail/Outlook inbox rendering is untested.
- Reused port 3022. No build, restart, commit, push or deployment.

## 2026-10-20 — Formal application confirmation email redesign

- Redesigned only the formal intake confirmation with the existing full AET logo,
  2026 website colors, structured application/education details, readable fee
  estimate, orange action, next steps and compact linked navy footer. Kept existing
  quote/range behavior, private application ID and pilot disclosures.
- The development gallery uses a local asset origin so the real logo loads while
  synthetic application/footer links remain nonfunctional. Its intake frame is
  taller to expose the complete letter. No delivery or database behavior changed.
- Passed 42 existing intake/email/customer tests, TypeScript and whitespace checks.
  In-app browser verified desktop and 390px preview, including the lower content
  and footer. Supplemental full-page screenshots are in
  `output/playwright/intake-redesign-{desktop,mobile}-2026-10-20.png`. This is browser
  rendering verification, not a Gmail/Outlook inbox compatibility test.
- Reused port 3022. No real mail, build, restart, commit, push or deployment.

## 2026-10-20 — Retire staff email-link login

- Removed the administrator email template, enqueue/render logic, email-login and
  token-consumption pages, fallback login link and legacy mail-login API branch.
  The preview gallery now lists five customer templates.
- Staff access uses the existing verified password session and office membership.
  Old staff link tokens and legacy staff cookies are rejected regardless of the
  former cutover flag. Customer links/sessions continue to work. Historical admin
  queue items fail closed before rendering or contacting the mail provider.
- Passed 55 focused authentication/email/customer tests and TypeScript. Rebuilt
  two damaged generated development route-type cache files using Next's own
  generator; no server restart or build. Removed pages and API returned 404.
- In-app browser verified the five-template gallery and preserved the existing
  signed-in staff session. A separate Playwright browser verified password-only
  login at desktop and 390px, without signing the owner out. Screenshots are in
  `output/playwright/staff-password-only-{desktop,mobile}-2026-10-20.png`.
- The old optional lifecycle script now requires a password-authenticated test
  staff cookie instead of minting a legacy administrator session. It was not run.
- No cloud schema, stored records, accounts, credentials or external settings were
  changed. No mail sent, commit, push or deployment. Email visual redesign remains
  a proposal pending discussion; customer template appearance is unchanged.

## 2026-10-20 — Email template preview gallery

- Added development-only `/api/email-template-preview` with all six current React
  Email templates, real subject lines and desktop/390px preview modes. The raw view
  exposes each rendered email separately. Production requests return 404.
- Uses synthetic application data and nonfunctional example links; does not read
  the database, enqueue mail or contact the delivery provider.
- Verified all six selections in the in-app browser and the mobile-width toggle.
  TypeScript passed. Reused the owner's server on port 3022; no server restart,
  build, commit, push or deployment.

## 2026-10-20 — React Email templates and metadata-only delivery records

- Added pinned React Email 6.11.3 and shared JSX email components. Formal intake,
  pre-evaluation confirmation/result/access/information and the existing admin
  email-login fallback render from source data at send time. No subject or HTML
  is written to application delivery tables.
- Delivery metadata retains application/recipient IDs, result version or business
  information-request reference, state, attempts, leases, cooldowns, sanitized error
  codes, provider receipt and a SHA-256 content digest. Retries preserve the UUID;
  changed content and superseded/withheld results pause for reconciliation.
  The fallback sign-in nonce is retained only while delivery is pending and cleared
  after provider acceptance. Staff password reset remains removed.
- Applied the generated delivery-record migration only to the isolated preview
  schemas. The two existing sent intake receipts retained their IDs, state and
  provider IDs. Runtime/browser permissions and RLS were checked; no production
  schema, business row, staff account or provider setting changed.
- Passed 293 unit/regression tests across 23 files, TypeScript and whitespace
  checks, 29 intake database/HTTP checks and 10 delivery-record database checks.
  Integration tests used injected transport or rendered in memory; no mail sent.
  Disposable test records were removed. Fixed the standalone server-only loader
  so React Email can use react-dom/server without the global react-server condition.
- In-app browser verified Next.js-rendered intake, result and information templates.
  Supplemental Playwright checks passed at 390px for intake/result layouts; the
  intake page had no horizontal overflow. Temporary synthetic preview routes were
  removed. Evidence: `output/playwright/email-{intake,result}-{desktop,mobile}-2026-10-20.png`.
- Supabase security advisors had no findings on the two changed delivery tables.
  Existing unrelated public-schema findings remain outside this scope; see the
  [RLS advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).
- Reused the owner's port-3022 server. No build, restart, commit, push, deployment
  or real delivery verification. Existing test-recipient/worker containment remains.

## 2026-10-20 — Remove staff self-service password recovery

- The owner keeps three staff accounts and handles additions and password
  assistance manually. Removed forgot/reset pages, the login recovery link,
  Resend recovery sender, token helper and recovery-only migration bypass.
- Preserved login/logout, membership checks, manual administrator provisioning
  and verified first-login password migration. Historical SQL remains unchanged;
  no cloud accounts, passwords, database tables or provider settings were changed.
- Passed 52 staff regression tests across six files, TypeScript and whitespace
  checks. Both removed pages and both removed API actions returned HTTP 404 on
  the existing port-3022 server. Cloud acceptance scripts were updated but not run.
- In-app browser visually verified `/admin/login` via 127.0.0.1 with no recovery
  entry. The browser's password toggle did not expose a state change; an isolated
  Playwright session on localhost confirmed the Show/Hide interaction works.
  No real credentials were submitted. Screenshot:
  `output/playwright/staff-login-no-recovery-2026-10-20.png`.
- Reused the owner-managed server; no production build, restart, commit, push or
  deployment. Customer notification storage is outside this change.

## 2026-10-20 — CRM new-application destination

- New application links directly to `/application` from the workspace header and
  import dialog, replacing the old modal. Existing locale routing is preserved.
- Kept the payment-request action and mobile action sizing intact.
- In-app browser verified header clicks reach the new form on desktop and 390px
  mobile; TypeScript and whitespace checks passed. No application was submitted.
- Evidence: `output/playwright/crm-new-application-{destination,mobile}.png`.

## 2026-10-17 — Unified customer status UI

- Live and isolated credential records now use one `CustomerStatus` contract and
  the same status/next-steps/documents/services/payment/client/education components.
  Removed the separate customer intake receipt path; source selection stays explicit.
- Saved quote ranges, selected qualifications, delivery and confirmation-mail retry
  appear within the shared cards when available. Test IDs have no production portal
  links or invented payment deadlines. Existing live records remain read-only here.
- Verified both sources in the in-app browser at 1440px and 390px; no horizontal
  overflow. Checked invalid-ID feedback, valid lookup retaining `source=preview`,
  saved fees/delivery, mail state and disabled unconnected payment controls.
- 279 tests across 22 files, 26 isolated database/HTTP assertions, TypeScript and
  locale checks passed. Integration fixtures cleaned up; no additional real mail sent.
- Evidence: `output/playwright/unified-status-{preview,live}-{desktop,mobile}.png`
  and `output/playwright/unified-status-mobile-fees.png`.
- Owner-run port 3022 server reused; no production build, push or deployment.

## 2026-10-17 — Credential intake persistence and confirmation mail

- Connected the unified credential-evaluation form to the isolated Supabase preview
  schemas, with transactional application/education/quote/outbox persistence and
  request-ID deduplication. Added customer status receipts and an explicit CRM test
  view under existing staff permissions. Other intake services remain previews.
- Confirmation delivery is pinned to `errplusone@gmail.com`; two real test messages
  returned Resend `delivered`, including a retry after simulated delivery failure.
  No production business rows, login behavior, payments or file transfers changed.
- 275 tests across 22 files, 24 database/HTTP integration assertions, TypeScript and
  i18n checks passed. Browser verified submission, status, reload protection and
  authenticated CRM on desktop/mobile; corrected mobile price wrapping.
- See [credential-intake-testing.md](../credential-intake-testing.md) for exact tables,
  guardrails, migration/test commands, retained synthetic IDs and remaining scope.
  Screenshots: `output/playwright/intake-{crm,status}-{desktop,mobile}-2026-10-17.png`
  and `output/playwright/intake-status-mobile-fees-2026-10-17.png`.
- Used the owner-run port 3022 server; no restart, production build, push or deploy.

## 2026-10-17 — Evaluation samples and service guidance

- Highlighted both evaluation sample-report links with a theme-blue button,
  document icon and external-link arrow. Added a question-mark link beside the
  service heading to the localized `/evaluation#service` explanation, with
  descriptive English, Chinese and Spanish accessible labels. All three links
  use a separate tab and preserve the existing form state.
- TypeScript, i18n (500 messages per locale) and whitespace checks passed.
  In-app browser inspected the current form and English desktop/mobile states
  at 1440px/390px; mobile width matched the viewport without horizontal overflow.
  Both PDF destinations returned HTTP 200. Verified rendered link targets and
  separately opened the explanation destination to confirm its anchor/content.
  The in-app browser did not expose a new tab after clicking the help link, so
  automatic popup behavior remains unconfirmed in this browser.
- Owner follow-up: renamed the English action to “View Evaluation Sample”,
  with matching Chinese/Spanish labels. Replaced warm colors with shared pale
  blue, navy text/border and a navy/white hover state. Rechecked English desktop
  (1440px) and mobile (390px); the longer label fits without horizontal overflow.
  Follow-up screenshots: `output/playwright/evaluation-sample-blue-{desktop,mobile}-2026-10-17.png`.
- Screenshots: `output/playwright/evaluation-service-help-{desktop,mobile}-2026-10-17.png`.
  Preserved draft fields and selection, restored viewport; no form submission,
  server restart, production build, commit, push or deployment.


## 2026-10-17 — Integrate latest main into dev

- Merge main through `902657b`, which includes the fetched GitHub main and one
  additional local documentation commit. Preserve the dev application, CRM and
  customer-status work alongside main's Stripe, navigation and public-site updates.
- Resolve shared pricing and translation conflicts while retaining USD 450
  course same-day evaluation and the handling office's local 13:00 cutoff.
- Typecheck, all 266 tests across 21 test files, i18n validation (500 messages
  per locale), mocked payment/contact checks and whitespace checks pass.
- In-app browser smoke checks pass for the Chinese application first step,
  Stripe cancelled-result page with shared navigation/footer, and evaluation
  pricing. Mobile layouts and live transactions were not re-tested in this merge.
- Reuse the existing local server; do not change secrets, run a production
  build, submit applications, send emails or perform real payments.

## 2026-10-15 — Hero service-specific actions

- Changed the Hero evaluation action to Apply for Credential Evaluation
  (学历评估申请) and linked it to the homepage `#process` section. Added dedicated
  Hero contact copy for translation and other services in all three languages;
  other Contact Us labels are unchanged. The contact action uses theme navy
  with white text and retains the localized Contact destination.
- Allowed long action labels to wrap while retaining fixed icon sizes. In-app
  browser verified English/Chinese desktop layouts at 1440px, English mobile
  at 390px, and Chinese/Spanish at 320px without horizontal overflow. Verified
  the Chinese evaluation action lands below the header on desktop and mobile,
  and the English contact action opens `/contact`.
- Typecheck, i18n validation, and whitespace checks passed. Screenshots are
  `output/playwright/hero-actions-*-2026-10-15.png`. Reused the existing preview;
  no build, commit, push, or deployment.

## 2026-10-15 — Apply Now navigation and online application labels

- Renamed the desktop/mobile header action to Apply Now and linked it to the
  active language's homepage `#process` section. Renamed the shared process
  actions to Start Online Application, retaining their application-portal URL.
  Updated English, Chinese, and Spanish labels.
- Corrected initial hash alignment after hydration expands the preceding
  homepage scroll story; the process section now lands below the sticky header.
- Typecheck, i18n validation, and whitespace checks passed. In-app browser
  verified cross-page navigation in all three languages, English at 1440px
  desktop and 390px mobile, and Spanish at 320px. Mobile menus close on selection;
  same-page navigation reaches the section, and checked phones have no horizontal
  overflow. The online action still targets the existing application portal.
- Screenshots: `output/playwright/apply-now-{desktop,mobile}-2026-10-15.png`.
  Used the existing local server; no build, commit, push, or deployment.

## 2026-10-15 — Production payment verification

- Checked the deployed `https://www.americantranslationservice.com` website.
  English, Chinese and Spanish Payment routes return HTTP 200 in live mode.
  All four office choices offer customer-facing Stripe payment copy.
- Submitted synthetic $0.50 verification requests to the production payment
  endpoint for Boston, NYC, California and Miami. Each returned a live Checkout
  session readable with its expected account credential, with the correct USD
  amount and office metadata. All four remained unpaid and were then expired.
- Verified production unpaid-result pages, mismatched-office rejection, amount
  minimum, missing agreement and stale-test-form guards. An identical Boston
  retry reused the same session. PayPal handoffs for all four offices return
  HTTP 200 and their merchant values match local configuration; no PayPal
  transaction was submitted.
- In-app browser verified both accounts' Checkout branding, the Chinese desktop
  form and 390px form/cancel page without horizontal overflow, and California's
  Checkout cancel link back to the production result page. Boston's cancel click
  encountered one in-app timeout; the same destination returned HTTP 200 in
  393ms and opened correctly in a fresh browser tab. No payment-page console
  errors were observed. Browser viewport was reset after the checks.
- Screenshots: `output/playwright/stripe-online-{desktop,mobile,cancel-mobile,bos-checkout,ca-checkout}-2026-10-15.png`.
  No code, credentials, hosting configuration or payment settings were changed.
  Actual card charges, emailed receipts and bank payouts remain untested in this
  verification; manual office reconciliation remains the intended workflow.
- Content follow-up: the retained Visa/Mastercard-only notice does not match
  the additional card brands displayed in both live Checkout pages. The retained
  $250 and $500 transfer guidance also needs a consistent owner-approved policy.
  These business rules were recorded, not silently changed during inspection.

## 2026-10-15 — Live Stripe Checkout preparation

- Added explicit test/live modes with no credential fallback. Boston and NYC use
  the Boston account; California and Miami use the original account in each mode.
  Production leaves Stripe disabled unless a mode is explicitly configured.
- Reused the original account's existing live credential from the application
  project after confirming that its test/live keys identify the same account.
  That account reports charges and payouts enabled. Both account groups now have
  local test/live credentials; `.env.local` remains ignored and uses test mode.
- The form asks for an office before offering Stripe. Live-mode form, Checkout,
  and result text omit test wording in all three languages. Test mode keeps its
  explicit labels. Stale forms cannot silently switch between test and live.
- Added retry idempotency, office/mode/source verification, a required public
  HTTPS return origin for live payments, and customer/service metadata for manual
  reconciliation. This standalone flow does not create an application/order or
  automate fulfillment and email; see `content/payment/README.md` for deployment.
- Created one unpaid $0.50 live Checkout session for each office and verified the
  amount, live mode, office metadata, and unpaid result. Visually checked both
  accounts' hosted Checkout branding, then expired all four unpaid sessions.
  No card details were entered and no real payment was made in these checks.
- Passed typecheck, i18n validation, whitespace checks, and the expanded isolated
  payment checks for routing, mode guards, idempotency, response verification,
  malformed inputs, and the existing PayPal paths.
- In-app browser checks passed for English, Chinese, and Spanish live form
  choices, all four offices, and Chinese desktop/390px form and cancellation
  result states. Mobile had no horizontal overflow. Screenshots are in
  `output/playwright/stripe-live-{form-desktop,form-mobile,result-mobile}-2026-10-15.png`
  and `stripe-{bos,original}-live-checkout-2026-10-15.png`.
- Reused the owner's test server on port 3021. A temporary isolated live-copy
  preview on port 3029 used fixture keys and was stopped after verification.
  No production build or deployment was run. Hosted production variables and
  deployment remain pending; Git does not upload `.env.local`. Customer release
  still requires the deployed return flow and operational reconciliation check.

## 2026-10-15 — Boston / NYC Stripe account routing

- Boston and NYC now select `STRIPE_TEST_SECRET_KEY_BOS`; California and Miami
  retain the original test key. Missing Boston credentials cannot fall back to
  the original account. Return verification uses the same office account and
  rejects mismatched office metadata, even between Boston and NYC.
- Created dedicated test/live restricted keys in the Boston/NYC Stripe account,
  each with Checkout Sessions write/read permission only. Saved both secrets
  and the corresponding publishable keys to ignored `.env.local` (mode 600),
  preserving the original entries. `.env.example` contains blank placeholders.
  The payment integration accepts test credentials only and never reads the
  reserved live credential; no live API request or payment was made.
- Pinned requests to API version `2026-09-30.endive` and replaced the removed
  static payment-method parameter with the supported card eligibility filter.
  This resolves the new account's rejected Checkout request without expanding
  key permissions. The original account also passed test-session creation.
- Passed typecheck, i18n validation, whitespace checks and the expanded isolated
  `node scripts/check-payment.cjs` checks for all office routes, restricted test
  keys, account isolation, tampered inputs and the existing PayPal paths.
- Submitted the Boston form without a configured Boston key and verified its
  localized unavailable result in the in-app browser on desktop and at 390px,
  with no horizontal overflow. Screenshots:
  `output/playwright/stripe-bos-unavailable-{desktop,mobile}-2026-10-15.png`.
- After the owner completed Stripe verification, used the in-app browser to
  submit Boston and NYC forms to the Boston/NYC account's branded sandbox
  Checkout. Completed one Boston $0.50 test-card payment and verified the
  website's success page; NYC Checkout and its cancel return also passed.
  Retrieved both sessions with the restricted test key and confirmed test mode,
  50 USD cents and their respective office metadata. No real money was charged.
  Desktop screenshots: `output/playwright/stripe-bos-success-2026-10-15.png`,
  `output/playwright/stripe-nyc-checkout-2026-10-15.png` and
  `output/playwright/stripe-nyc-cancel-2026-10-15.png`.
- Reused port 3021 and reset the viewport. No build, commit, push or deployment.

## 2026-10-15 — Stripe test Checkout

- Added an optional Stripe test choice to the existing Payment form in English,
  Chinese and Spanish, preserving PayPal as the default. The selected amount
  opens hosted Checkout in a new tab; the original form remains available.
- Only a server-side test key enables Stripe. Amounts use integer USD cents;
  live keys and unexpected Checkout destinations are rejected. Return pages
  verify the session with Stripe before displaying test success and explain
  cancelled, incomplete, unverified and unavailable outcomes.
- Completed a $0.50 sandbox card payment from the Chinese form through Stripe
  to the verified success page, using synthetic customer details and the official
  test card. Also checked Stripe's return link reaches the cancelled result.
  No real money was charged and no service order was created.
- Passed typecheck, i18n validation, whitespace checks, three-locale rendered-page
  checks and `node scripts/check-payment.cjs`. The isolated script checks amount
  boundaries, test/live credentials, redirects, result verification, failures and
  all four existing PayPal merchant paths without external requests.
- In-app browser verified the desktop form and success/cancel states, plus the
  Stripe option at 390px with no horizontal overflow. Screenshots are saved as
  `output/playwright/stripe-{form-desktop,form-mobile,checkout-test,success,cancel}-2026-10-15.jpg`.
- This initial test used the original configured Stripe account; the subsequent
  Boston/NYC routing change is recorded above. Order persistence, webhooks and
  application/email workflows remain future work. See `content/payment/README.md`.
  Reused port 3021 and reset the viewport. Changes are on `main`; no build,
  commit, push or deployment.

## 2026-10-14 — ATA membership links

- Linked the homepage ATA fact heading, About timeline reference, and Certified
  Translation certificate image and ATA text to AET's official ATA member-directory
  profile in English, Chinese, and Spanish.
- Removed the membership-ID sentence from all three Certified Translation locales
  and added the missing space after ATA in the Chinese certificate caption.
  A full source/content/text-asset scan found no remaining ID references; the ATA
  logo and certificate images were visually checked and do not display the ID.
- Passed typecheck, whitespace checks, and rendered-link checks across all nine
  localized pages. The in-app browser verified the Chinese homepage on desktop
  and at 390px, the mobile certificate section, and the About timeline. Clicking
  the homepage member link reached AET's official ATA company profile; the mobile
  homepage had no page-level horizontal overflow.
- Screenshots: `output/playwright/ata-member-{desktop,mobile}-2026-10-14.png`.
  The corrected Chinese certificate copy also passed desktop and 390px in-app
  visual checks, with no page overflow; all three rendered service pages omit
  the ID. Screenshots: `output/playwright/ata-copy-{desktop,mobile}-2026-10-14.png`.
  Reused port 3021 and reset the viewport. No build, commit, push, or deployment.

## 2026-10-10 — Blog contact event

- Connected the owner's `contact_us` event to authored Blog phone and Contact-page
  buttons in all three locales, with article, locale, method and placement.
  Existing article queues remain; application and AI clicks do not send this event.
- Same-tab web links wait for Google's callback or an independent two-second
  fallback, guarded against duplicate navigation. Phone, modified and new-tab
  actions remain native; missing or failing analytics does not block navigation.
- Passed typecheck, whitespace checks and `node scripts/check-blog-contact.cjs`:
  localized events, callback/timeout races, absent/throwing analytics, cancellation,
  native link behavior and event scope. Tests use fakes and send no analytics data.
- In-app browser verified the English intro CTA on desktop and Chinese closing
  CTA at 390px reach their localized `/contact#la` destinations. Screenshots:
  `output/playwright/contact-event-{desktop,mobile}-2026-10-10.jpg`.
  No console errors on the checked desktop route or mobile horizontal overflow.
- Reused port 3021 and reset the viewport. No build, commit, push or deployment.
  GA4 receipt, key-event settings and Google Ads import remain unverified.

## 2026-10-10 — GA4 Google tag

- Added Google tag `G-7SF10M7GBE` to the shared locale layout with
  `next/script` after hydration, covering English, Chinese and Spanish pages
  while preserving the existing `dataLayer` queue.
- Passed typecheck, whitespace checks and HTTP checks for all three homepages
  and CSLB articles. In-app browser navigation from the homepage through Blog
  to the CSLB article retained exactly one initializer and one loader.
- Visually checked the homepage and CSLB article at the default desktop viewport,
  plus the article at 390px with no horizontal overflow. Screenshots:
  `output/playwright/ga4-cslb-{desktop,mobile}-2026-10-10.jpg`.
- GA4 receipt and enhanced-measurement settings are not verified. Custom blog
  click events and Google Ads conversions still need separate configuration.
  Reused the existing dev server; no build, commit, push or deployment.

## 2026-10-10 — CSLB institution entry

- Replaced the CSLB initials placeholder with the unchanged 392 × 99 logo from
  CSLB's official website header. Updated only the CSLB record in English,
  Chinese and Spanish using the authored Blog guide: education credit, practical
  experience, evaluation/translation and provider/report confirmation. Added a
  localized article link; other institution records and the total of 28 remain.
- Passed typecheck, existing i18n checks, whitespace checks and focused three-locale
  HTTP/source comparisons for record scope, logo, complete notes and article URLs.
  The logo response and SHA-256 digest match the downloaded official artwork.
- In-app browser verified the Chinese desktop card at 1440px and mobile at 390px,
  CSLB search, keyboard disclosure expansion, natural logo dimensions, no mobile
  horizontal overflow, and navigation to the Chinese Blog article. Screenshots:
  `output/playwright/institutions-cslb-desktop.png` and `institutions-cslb-mobile.png`.
- The existing 3021 process served stale compiled directory content after reload,
  although the new static logo was available. Verification used a temporary source
  copy with `WATCHPACK_POLLING=true pnpm exec next dev --webpack --port 3034`.
  That process was stopped after verification and the viewport override was reset.
  At the owner's request, stopped the stale 3021 process; it required SIGKILL
  after SIGTERM left the development lock held. Verified the lock could be
  acquired and released. After the owner restarted it, final HTTP checks confirmed
  the updated logo and copy on 3021. No production build or manual deployment.

## 2026-10-10 — Translation navigation group

- Added Translation between Evaluation and Other Services in the shared desktop
  and mobile navigation. Moved Certified Translation, Technical Translation,
  Interpretation, and General Translation into it, preserving their destinations.
  Renamed Services to Other Services across English, Chinese, and Spanish.
- Tightened compact desktop spacing through 1392px after finding the English
  application button crowded the right edge at narrower desktop widths.
- Passed typecheck, i18n validation, and whitespace checks. In-app browser checks
  covered English desktop at 1201px and 1440px, Spanish desktop navigation, and
  Chinese mobile at 390px and 320px. Verified both dropdown contents, desktop
  exclusivity and Escape, mobile scrolling, and General Translation navigation
  with automatic menu closure. Checked narrow English and Chinese layouts have
  no horizontal overflow. Screenshots: `output/playwright/header-translation-*.png`.
- Restarted the preview with the owner's explicit authorization using
  `WATCHPACK_POLLING=true pnpm dev` at `http://localhost:3021`; it remains running.
  No production build, commit, push, or deployment.

## 2026-10-10 — Visa Service and shared pricing

- Restored `/visa-service` and `/zh/visa-service` from the English/Chinese legacy
  PHP body files, using the shared service-page layout. Spanish shows a labeled
  English body fallback with noindex. Added Services menu/footer links, sitemap
  entries, English/Chinese sharing images, Service offers and four legacy redirects.
- Preserved all nine source sections in both languages, including their office
  literals, qualifications and processing times. The photo-promotion image is
  transcribed as accessible text. The dedicated China-details page remains an
  external legacy destination. See `content/visa-service/README.md` for exceptions.
- Added one Visa fee catalog in `lib/pricing.ts`. Source-body interpolation, the
  service pricing summary, global Pricing and structured offers share its values.
  The 21 table rows separate service, external and photo fees; Canada's combined
  charge is derived. The introductory China fee and Q2/L starting fee remain
  separate source claims. Undefined consular charges are marked as variable.
- Passed `pnpm typecheck`, `pnpm check:i18n`, `git diff --check` and
  `python3 scripts/check-visa.py`. The latter compares all source sections,
  rendered pricing parity in all three locales, anchors, metadata, JSON-LD and
  the four legacy main-page entry points.
- Codex in-app browser: English service page and Pricing Visa section inspected
  at 1440px desktop and 390px mobile; Chinese service page at 320px. Section-index
  jumps work, tables stack on phones, and checked pages have no horizontal overflow.
  Corrected the Visa table's desktop qualification-column width. Screenshots are
  under `output/playwright/visa-*.png`.
- Started the previously unavailable preview with `WATCHPACK_POLLING=true pnpm dev`
  at `http://localhost:3021`; restarted the agent-owned process after observing
  stale development modules. Preview remains running for owner review.
- No production build, commit, push or deployment.


Progress and verification evidence only. The design baseline lives in [Design guide](../design/README.md).

### Dev checklist and scoped commit verification — October 17, 2026

- Reconciled the migration checklist with the unified application preview,
  evaluation pricing/delivery, live CRM, staff permissions and customer status.
  Kept actual submission, disconnected integrations and production cutover open.
- Separated customer-status API/model/tests, localized customer UI, and progress
  documentation into scoped commits. No feature behavior changed during this pass.
- Reran the customer-status and CRM completion suites: 14 tests passed. TypeScript
  without incremental output, locale validation (466 messages per locale) and
  whitespace checks passed. Vitest required permission to write its temporary
  cache in the sibling dev worktree.
- Browser checks were not repeated in this commit-only pass; the October 16
  desktop/mobile and interaction evidence below remains the visual baseline.
  No production build, server restart, remote push or deployment was performed.

### Status customer details connected — October 16, 2026

- With explicit owner authorization, expanded the existing UUID-scoped customer
  lookup to select the legacy client/evaluee fields from fce_applications and
  education fields from fce_educations joined by application_id. Both live and
  isolated-preview branches use explicit field lists; no staff notes, internal
  assessment output or unreleased reports are returned.
- Connected all three information sections to the response, removed preview-only
  badges, localized countries/purpose and rendered each linked education record.
  Empty fields show Not provided; no education rows show an explicit empty state.
  Date-only birth values remain date-only, avoiding timezone changes.
- Verified the owner-provided application against the earlier legacy reference
  and inspected real customer/evaluee/education fields in the in-app browser.
  Desktop and 390px mobile checks passed without horizontal overflow. Captured
  layout evidence with personal field values masked:
  `output/playwright/aet-status-connected-desktop.png` and
  `output/playwright/aet-status-connected-mobile.png`.
- TypeScript, all six focused status/projection tests and whitespace checks pass.
  Tests cover field mappings, missing fields, education dates and exclusion of
  internal fields. No business records changed; no build, restart or deployment.

### Status page section parity — October 16, 2026

- Compared legacy StatusCheck, SelectedServicesCard, ClientInfoCard,
  EvalueeInfoCard and PaymentOptions. Restored the missing customer sections in
  legacy order: document requirements/file list/upload, service details/payment,
  client information, evaluee information and education.
- Frontend-only placeholders clearly identify disconnected data and actions.
  Service summary and saved amount continue using the existing status response.
  Personal fields and detailed delivery/service breakdowns remain unconnected;
  no customer API projection, database access or permissions were expanded.
- Added local-only file selection/drop/removal with extension/size validation;
  upload remains disabled. Added Zelle/online radio selection, Zelle instruction
  preview/back and existing-portal links. No recipient details or success states
  are fabricated. The file-list placeholder does not claim no files were received.
- TypeScript and whitespace checks passed. In-app browser inspected the restored
  sections and Zelle expand/back behavior. Supplemental browser checks verified
  payment switching, synthetic file selection/removal, disabled upload and 390px
  mobile width without horizontal overflow. Screenshots:
  `output/playwright/aet-status-sections-desktop.png`,
  `output/playwright/aet-status-sections-mobile.png`,
  `output/playwright/aet-status-sections-detail.png`.
- No file transmission, payment, business-record mutation, build or deployment.

### Formal customer Status page — October 16, 2026

- Added localized `/status?applicationId=ID` pages with the shared website
  Navigation/SiteFooter, manual lookup and automatic loading from old email URLs.
- Reads the existing formal record by complete UUID through the configured live
  connection on 3022, or isolated legacy tables in preview mode. Returns only
  status, timestamps, office, service labels, saved amount and completion estimate;
  excludes contact details, staff notes and unreleased reports. The endpoint uses
  same-origin checks, bounded requests, rate limits and no-store/noindex headers.
- Shows the legacy 48-hour payment window only for unpaid submitted applications.
  Completion estimates reuse the existing validated turnaround projection.
- Upload and payment actions explicitly open the existing portal; no new file or
  payment integration is enabled. `/status-check` remains pre-evaluation-only.
- Verified the owner's reference ID against the old portal and the new page,
  automatic reload, invalid ID and missing-record feedback in the in-app browser.
  Inspected desktop and supplemental 390px mobile screenshots with website header
  and footer. TypeScript (without incremental cache) and all 12 focused status /
  completion tests passed. No build, business-record write, restart or deployment.
- Evidence: `output/playwright/aet-status-desktop.png` and
  `output/playwright/aet-status-mobile.png`. Production app-host cutover remains
  unverified; this local endpoint retains the configured localhost boundary.

### Twenty-record workspace pages — October 16, 2026

- Unified live/preview page sizes and the UI fallback at 20 records. Retained
  the CSV export limit and existing permission, filtering and sorting behavior.
- On localhost:3022, verified 20 desktop rows numbered 1–20, then 21–40 on page
  two with the matching pagination range. Verified 20 mobile cards at 390px
  without horizontal overflow. Restored page one and the default viewport.
- TypeScript and whitespace checks passed. Screenshot:
  `output/playwright/crm-page-size-20.png`. No business writes, restart or deployment.

### Status-column completion timeline — October 16, 2026

- Replaced Shared business record beneath live status badges with a compact
  processing timeline, estimated completion date and remaining/overdue days.
  Preserved columns, drawer behavior, mobile cards and manual-refresh behavior.
- The read-only projection uses existing paid_at and service_type data, legacy
  Eastern 1pm cutoff and inclusive weekdays (weekends skipped; no holiday calendar),
  plus validated saved turnaround snapshots. Missing/unknown inputs and completed,
  cancelled, preliminary, imported or standalone payment records have no timeline.
- Count remaining calendar days in Eastern time, including the full due date.
  Unlike the old fixed 14-day graphic, the fill uses the actual payment-to-deadline
  window and is explicitly labeled as elapsed time, not completed evaluation work.
- All 36 focused completion/detail/live tests and TypeScript passed. Tests cover
  cutoff, weekend/winter timezone, same-day/24-hour, due-today/overdue, amber threshold,
  saved snapshots, missing inputs and the live row projection.
- On the owner's localhost:3022 server, inspected real green and red timelines in
  the 1440px desktop list and 390px mobile cards; mobile width stayed at 390px.
  Screenshots: `output/playwright/crm-progress-desktop.png` and
  `output/playwright/crm-progress-mobile.png`. No business data or employee login
  changes, new polling, server restart, build, push or deployment.

### Unified application preview — October 16, 2026

- Added asterisks to existing 24-hour/same-day tiers and a highlighted receipt
  cutoff note below the processing selector. Selected expedited tiers retain
  the asterisk and reminder in sidebar fees and review. Passed 31 focused tests
  and TypeScript; checked Chinese desktop (1440px), mobile (390px) and review
  in the in-app browser on 3022.
- Owner confirmed course same-day at USD 450 and a 13:00 cutoff in each handling
  office's local time. Restored that tier to the shared 2026 catalog and updated
  English/Chinese/Spanish intake and public Pricing/Evaluation notes. Public
  tables now mark both 24-hour and same-day tiers with asterisks.
- Passed 88 application/shared-catalog tests, TypeScript and the three-language
  message check. In-app browser verification on 3022 covered Pricing at 1440px/
  390px, the mobile Evaluation fee table, application service selection at both
  widths, and mobile review/refresh restoration. Course same-day is USD 450;
  PDF-only adds USD 10 for a USD 460 subtotal. No horizontal overflow on checked
  mobile pages. Evidence: `output/playwright/aet-local-cutoff-pricing-{desktop,mobile}.png`,
  `output/playwright/aet-local-cutoff-application-{desktop,mobile}.png`, and
  `output/playwright/aet-local-cutoff-review-mobile.png`.
- Added Report & delivery below evaluation services: PDF-only or PDF plus a mailed
  paper copy, with optional extra copies. Mailing exposes recipient/address fields
  and country-filtered shipping; required address fields block review. U.S. state
  and ZIP validation is separate from international address entry. Switching to PDF
  removes mailing/extra-copy fees while retaining the address for reuse.
- Sidebar and review now include report and postage from the 2026 catalog; additional
  copies retain the catalog's USD 40–60 range. Review includes the full destination,
  report email, shipping method and copy count. Payment processing remains excluded.
- Passed 31 focused application tests and TypeScript. In-app browser checks on 3022
  verified missing-address errors, domestic/international shipping filtering,
  PDF-only fee reset, complete mailing review and draft restoration after refresh.
  Inspected Chinese desktop (1440px) and mobile (390px) delivery and review layouts
  with no horizontal overflow. Evidence: `output/playwright/aet-report-delivery-desktop.png`,
  `output/playwright/aet-report-delivery-mobile.png`, and
  `output/playwright/aet-report-delivery-review-mobile.png`.
- Simplified evaluation selection to document/course radio cards, with exactly
  one required; removed help choosing and hid expert/position services from this
  intake. Moved each PDF sample link beside its service, outside the radio label.
  Switching retains qualification associations and replaces the quoted fee.
  Old drafts drop retired choices and require reselection if both types were selected.
- Passed 22 focused application tests and TypeScript. In-app browser checks on
  3022 passed required-choice feedback, keyboard/mobile mutual exclusion, independent
  sample links, and review showing only the current service plus pending translation.
  Inspected Chinese cards/review at 1440px desktop and 390px mobile with no overflow.
  Evidence: `output/playwright/aet-evaluation-exclusive-{desktop,mobile}.png`
  and `output/playwright/aet-evaluation-exclusive-review-mobile.png`.
- Earlier iteration (superseded by the two-choice selection above): replaced
  the single formal-evaluation dropdown with four multi-select service
  cards below education. Processing tiers, prices and additional-degree charges
  come from the existing 2026 catalog. Document/course services link to selected
  education records; removing a record preserves other associations and updates fees.
- Added optional translation and help choosing, with required guidance notes and
  explicit pending quotes. Sidebar/review share a fee calculation and show selected
  services, tiers and qualifications; review breaks out base/additional fees.
  Report delivery and payment remain outside this service-only preview.
- Passed 20 focused application tests and TypeScript, covering current catalog
  rates, combinations, stale tiers, invalid education references, unchecking,
  record removal, guidance-only quotes and old/new draft restoration.
- In-app browser passed service-required/guidance-required feedback, multi-service
  pricing, qualification deselection, review/edit and refresh restoration on 3022.
  Checked Chinese 1440px desktop/390px mobile cards and review, Spanish 390px long
  labels and English 1024px cards without horizontal overflow. Verified the shared
  same-day cutoff note. Evidence: `output/playwright/aet-application-service-cards-{desktop,mobile}.png`
  and `output/playwright/aet-application-services-review-{desktop,mobile}.png`.
- Added required pronouns (Mr./Ms./Mx.) before the name fields and optional date
  of birth for both evaluation services. First/last names and education fields
  now have required asterisks. School and study country share a desktop row;
  the degree name spans the entire row. New identity fields appear in review
  and draft restoration; older drafts retain their answers.
- Passed 11 application tests and TypeScript. In-app browser checks passed for
  required-field errors, date entry, review and refresh restoration. Inspected
  Chinese identity/education layouts at 1280px desktop and 390px mobile without
  horizontal overflow. Screenshots: `output/playwright/aet-application-identity-desktop.png`
  and `output/playwright/aet-application-education-required-{desktop,mobile}.png`.
- Removed the duplicate first-step footer counter and kept Continue right-aligned.
  Forward actions are green; Back uses a black background and white text. Checked
  the Chinese first/second-step action bars at 1024px desktop and 390px mobile,
  returning to step one and confirming no mobile overflow. TypeScript and
  whitespace checks passed. Screenshot:
  `output/playwright/aet-application-navigation-buttons.png`.
- Added the legacy evaluation-notes example, guidance, sample-report links and
  complete acceptance notice below Additional requirements for formal evaluation.
  Reused all three languages from AET App's serviceNotes copy and existing local
  PDF assets. Sample links open in separate tabs; both return HTTP 200 as PDFs.
- Restyled Start over with red text, a reset icon and no underline. Verified
  confirmation and cancellation without clearing the current draft. Inspected
  the English evaluation notes, stacked sample cards, notice and reset control
  at 1440px desktop and 390px mobile; no mobile horizontal overflow. TypeScript,
  all eight application tests and whitespace checks passed. Screenshot:
  `output/playwright/aet-application-evaluation-notes-desktop.png`.
- Removed parenthesized English from the Chinese name labels and inset all
  application dropdown chevrons by 14px. Verified equal name-input top positions
  on a 1024px desktop, stacked fields and office spacing on a 390px phone,
  office selection and TypeScript. Screenshot:
  `output/playwright/aet-application-labels-selects.png`.
- Added `/application`, `/zh/application` and `/es/application` with the owner's
  three-step flow: client/organization name, email, phone, service and office;
  conditional service requirements; then review with editable sections.
- Added preliminary/formal evaluation and translation branches, service query
  preselection, service-dependent offices, accessible field errors, month/year
  selectors, tab-scoped draft restoration and clear-draft confirmation. Changing
  service retains compatible answers and clears offices outside its allowed list.
- Evaluation/pre-evaluation use Miami, Los Angeles and San Francisco. Translation
  uses Miami, Boston, Los Angeles, San Francisco and New York. Removed Beijing
  from this application per the owner's updated scope, including its localized
  labels. Restoring a draft clears removed offices while preserving other answers.
- Replaced office cards with a service-filtered dropdown and added required
  asterisks to client/organization name, email and phone. Verified evaluation's
  three offices, selection summary updates and
  incompatible-office reset in the in-app browser. Inspected desktop (1440px)
  and mobile (390px) with no horizontal overflow; TypeScript passed again.
- Rechecked the five-office translation dropdown on desktop and mobile after
  removing Beijing. All eight focused tests and TypeScript passed, including
  rejection and restoration of a previously saved Beijing selection.
- Submission remains disabled and explicitly labeled as unavailable. Review
  describes the intended confirmation email followed by a separate upload page;
  this iteration creates no applications, sends no mail and has no upload control.
  Existing customer intake, database tables, CRM and navigation destinations are
  not changed by this feature.
- Verified all three branches, required-office validation, incompatible-office
  reset, review/edit and refresh restoration in the in-app browser on the owner's
  existing localhost:3022 server. Inspected Chinese desktop at 1440px and mobile
  review at 390px, plus English desktop and Spanish mobile layouts; no horizontal
  overflow was observed. Replaced native month inputs after an in-app browser
  input compatibility issue and reverified the evaluation review flow.
- Eight focused tests, TypeScript (`--incremental false`) and all 466 shared
  translation keys per locale passed. The new typed copy has its own three-locale
  completeness check in the focused tests. No build, server restart, push,
  deployment or production data writes.
- Screenshots: `output/playwright/aet-application-desktop.png` and
  `output/playwright/aet-application-review-mobile.png`. Concurrent CRM and staff
  recovery edits are outside this change.

### Staff connection recovery — October 16, 2026

- Investigated a reported ENOTFOUND for the Supabase pooler. DNS resolution and
  a read-only database connectivity check both succeeded during investigation;
  the underlying intermittent DNS cause has not been established.
- Added one bounded retry for transient failures of the staff membership read.
  Persistent connection failures become a sanitized service-unavailable error;
  permission/query errors are not retried and no stale permission is reused.
- Login and CRM entry pages now show an explicit connection-recovery screen with
  Try again for this expected failure, without bypassing staff authorization or
  treating it as an incorrect password. Employee login configuration is unchanged.
- All 28 focused session/API/retry/page tests passed. Outage branches were simulated
  in tests, without disrupting the cloud database. TypeScript and whitespace checks
  passed. On the existing localhost:3022 server, an authenticated visit to login
  redirected to CRM and loaded 1,184 business records without a visible error.
- Screenshot: `output/playwright/crm-connection-recovered-2026-10-16.png`.
  No build, server restart, production data writes, push or deployment.

### Shared homepage navigation across customer workflows — October 16, 2026

- Extended the homepage Navigation and SiteFooter to pre-evaluation application,
  status, result and legacy access pages; formal evaluation application, receipt
  and access pages; and the payment-return page. Staff retains its separate
  English-only workspace. This supersedes the landing-only scope below.
- Scoped formal form styles to the main content, kept its skip link and print
  layout, and offset the sticky fee summary below the shared header. Formal
  private-link exchange still disables language switching while handling a token.
- TypeScript, all 466 translation keys per locale, and diff whitespace checks
  passed. Verified both application forms at 1440px desktop and 390px mobile on
  the owner's existing localhost:3022 server, with no horizontal overflow.
  Checked shared footer colors/columns, mobile menu opening and Escape close,
  and Chinese-to-English status-page switching retaining a synthetic ID query.
- Verified shared navigation/footer on status, no-ID result/receipt, no-token
  access and cancelled-payment return states. Staff login redirected to the
  existing English CRM workspace. No applications or payments were submitted;
  this pass verifies presentation, not a new end-to-end transaction.
- Screenshots: `output/playwright/customer-shared-{desktop,mobile}-2026-10-16.png`
  and `output/playwright/customer-shared-formal-footer-2026-10-16.png`.
  Restored the browser viewport and left the pre-evaluation application preview
  open. No build, server restart, commit, push or deployment in this pass.

### Pre-evaluation photographic hero — October 16, 2026

- Expanded the existing graduates photograph into the landing-page background,
  with white copy over a navy gradient and the orange application action. The
  compact white fee card overlaps the lower edge on desktop; the three steps
  sit alongside it. On phones, the photo is reframed above the copy and the fee
  card follows below. This supersedes the earlier photo-above-price-card layout.
- Kept the USD 19.00 service fee, USD 0.88 processing fee, existing destinations,
  localized content and original image file. Styles are isolated to the landing
  page. The landing page directly reuses the homepage Navigation and SiteFooter;
  shared application/staff shells remain unchanged.
- TypeScript and diff whitespace checks passed. In-app browser verification on
  the owner's 3022 server passed Chinese, English and Spanish at 1440px desktop
  and 390px mobile, with no observed horizontal overflow. Checked mobile fees,
  steps and footer, and followed both Chinese application/status actions to their
  existing pages without submitting data. The default viewport was restored.
- Follow-up verification of the shared homepage header/footer passed at 1440px
  desktop and 390px mobile: Chinese/English page rendering, desktop language
  selection retaining the pre-evaluation route, mobile menu opening/Escape close,
  complete footer columns/legal links and no horizontal overflow. TypeScript,
  all 466 locale keys in each language and diff whitespace checks passed.
- Initial hero screenshots: `output/playwright/preeval-hero-{desktop,mobile}-2026-10-16.png`.
  Shared navigation/footer screenshots:
  `output/playwright/preeval-site-chrome-{desktop,mobile}-2026-10-16.png` and
  `output/playwright/preeval-site-footer-{desktop,mobile}-2026-10-16.png`.
  No service configuration, server restart, production build, push or deployment
  in this pass. Concurrent CRM edits remain outside this change.

### Consistent case drawer cards — October 16, 2026

- Unified client, education, service and payment information cards to white
  surfaces, the shared light border, 8px corners and consistent desktop/mobile
  padding. Standardized field-label and value typography; preserved field order,
  drawer interaction and semantic status/office badge colors.
- Verified Overview, Education, Service and Payment in the localhost:3022 in-app
  browser, plus Education/Service at 390px. No horizontal overflow observed in
  the mobile service drawer. CSS-only change; diff whitespace checks passed.
  Screenshot: `output/playwright/crm-unified-cards-2026-10-16.png`.
- No business records, authentication, commit, push or deployment changes.

### Legacy detail content within the case drawer — October 16, 2026

- Saved the preceding CRM integration and presentation baseline on dev in commit
  `0bb9422`, excluding unrelated pre-evaluation landing changes. No push.
- Retained the right-hand drawer, its dimensions, identity header, tabs and list
  entry points. Changed only live Education/Service contents: four education
  fields with country labels and month/year dates; original Selected Services
  ordering with notes, turnaround/price, delivery, extras, total and fee note.
- Saved quote snapshots remain authoritative; zero due amounts and unknown prices
  are handled explicitly. No business rows or login configuration were changed.
- TypeScript and 31 focused tests passed. In-app browser on localhost:3022 verified
  both tabs at desktop and 390px mobile, internal scrolling to the total/footnote,
  no horizontal overflow, and reopening Service from the application list.
  Screenshots: `output/playwright/crm-drawer-education-2026-10-16.png` and
  `output/playwright/crm-drawer-service-2026-10-16.png`.

### Education/service presentation rollback — October 16, 2026

- Reverted the centered education/service dialogs at the owner's request and
  restored the preceding live case drawer sections. Removed only the related
  presentation helpers, styles and tests; retained other CRM changes.
- TypeScript passed. Verified Education and Service tabs on localhost:3022 in
  the in-app browser at desktop and 390px mobile widths. No business data,
  authentication, push or deployment changes were made.

### Consistent evaluee identity — October 16, 2026

- Replaced contact-name display with Evaluee Name in the shared CRM list, drawer
  title, search/sort source and CSV export. Uses the stored Mr./Ms./Mx. title and
  first, optional middle and last names, matching the original system. Missing
  titles are not inferred; missing evaluee names never fall back to a contact.
  Updated both live and isolated-preview mappings without writing business rows.
- TypeScript, 26 focused CRM tests and the preview read query passed. In-app
  browser matched all six names in the owner's reference, verified full-name
  search and the matching drawer title, and checked desktop/390px mobile display
  without horizontal page overflow. Screenshot:
  `output/playwright/crm-evaluee-name-2026-10-16.png`.

### CRM row numbering and date order — October 16, 2026

- Moved Updated At to the left of client/application information and added a
  continuous row number. Numbering follows the current filtered result across
  pages; the mobile cards show the same number and update date at the top.
  Both live and preview overview drawers retain Created At alongside Updated At.
  Existing creation-date sorting and business values are unchanged.
- TypeScript and diff checks passed. In-app browser verified left-hand column
  order, page two numbering 8–14, both detail timestamps, 1440px desktop columns,
  and 390px mobile cards without page-level horizontal overflow.
  Screenshots: `output/playwright/crm-numbered-{desktop,mobile}-2026-10-16.png`.

### Compact CRM heading — October 16, 2026

- Removed the redundant breadcrumb/status/date/avatar top bar requested by the
  owner. The main content starts with its existing heading; mobile navigation
  now sits beside the eyebrow above the title. Sidebar account and refresh
  controls remain available.
- TypeScript and diff checks passed. In-app browser verified Formal evaluations
  on desktop and at 390px, including mobile menu open/Escape close and no
  page-level horizontal overflow. Screenshots:
  `output/playwright/crm-no-topbar-{desktop,mobile}-2026-10-16.png`.

### Manual CRM refresh — October 16, 2026

- Removed the window-focus refresh listener at the owner's request. Returning
  from another tab/window keeps the current list; staff use Refresh workspace
  to retrieve changes made elsewhere. Search, filters, pagination and successful
  saves retain their normal data loading behavior.
- Verified in the existing 3022 in-app browser: returning from a separate website
  tab left the list visible with no loading state; manual refresh entered loading
  and returned the live list. No database or authentication changes.
  Screenshot: `output/playwright/crm-manual-refresh-2026-10-16.png`.

### Shared live CRM records — October 16, 2026

- Connected the original `/admin/CRM` on the owner's restarted 3022 server in
  `aet-website-2026-dev` to the existing production business tables. The authorized
  owner account reads 1,184 applications: 997 formal, one imported order and 186
  preliminary applications. The payment view also includes 120 standalone records.
- Added a restricted server connection and private audit. Supports status, office,
  unpaid submitted formal amount due, shared original notes and editable preliminary
  result corrections. Writes target the exact original rows; the old system sees
  them after refresh. Office permissions apply before every read and write.
- Preserved the original dashboard presentation and detail drawer. Historical
  dates now normalize database Date values; missing historical amounts display
  as unrecorded, and status changes require an explicit selection. New live intake,
  documents, imports, messaging and provider payment operations remain in the old
  workspace; customer forms still use the isolated cloud preview.
- Passed TypeScript, 196 unit tests and 33 cloud checks. Cloud write logic used
  fictional records inside a rolled-back administrative transaction; the actual
  restricted connection was separately checked for allowed update columns, row
  locks and forbidden credential/payment/delete operations using empty result sets.
  No runtime role grant/switch or browser save to a real customer was performed.
- The full employee table and six business-table fingerprints match the original
  baseline after rollback. Existing public policies and timestamp triggers are
  unchanged; six policies apply only to the new runtime role. Both employee
  migration/cutover flags remain false. No passwords or invitations were changed.
- In-app browser verified live counts, Miami search/filter, formal contact/payment
  detail and amount controls, preliminary result controls, payment list, and the
  original desktop/mobile layout. The 390px list and drawer have no page-level
  horizontal overflow. Screenshot: `output/playwright/crm-live-desktop-2026-10-16.png`.
- The new editor rejects stale snapshots; the old editor still lacks revision
  checks. See [live scope and acceptance](../staff-auth.md#shared-live-business-records).
  No Docker, production build, commit, push or deployment in this integration pass.

### Application URL compatibility audit — October 16, 2026

- Recorded the October 15 legacy-source comparison and 23 GET checks on the
  owner's existing 3022 server: 15 application routes, three public-website
  aliases and five Chinese-cookie cases. No submissions or external service
  operations were performed during the URL audit.
- The three pre-evaluation URLs, formal intake and staff login/CRM entries are
  retained. Chinese pre-evaluation redirects preserve `applicationId`; staff
  URLs remain unprefixed. All three sampled public-site aliases redirect with 308.
- Legacy formal `/status`, three checkout paths and four standalone CRM tool
  paths return 404. The new `/status-check` is pre-evaluation-only, so a blanket
  redirect would not restore formal application lookup. No compatibility fix
  was made in this documentation pass.
- Pre-commit verification on October 16 passed all 44 focused pre-evaluation/legacy
  tests, TypeScript without output and the 466-key English/Chinese/Spanish locale
  check. The October 15 browser and service acceptance remains the evidence for
  those flows; no external-service acceptance was repeated for this commit.
- Added [the complete route mapping](../app-url-compatibility.md), source references
  and remaining cutover checks. Route responses do not establish historical data
  availability, authenticated feature acceptance or production hostname readiness.

### Independent new-website administrator — October 15, 2026

- Provisioned the owner-approved `errplusone@gmail.com` membership as an active
  administrator for Boston, New York, Miami, San Francisco, Los Angeles and
  unassigned records. The owner created the confirmed Auth identity and entered
  the password in Supabase. No invitation or application email was sent.
- Added independent staff support without a legacy/Payload user. The private
  roster uses its existing UUID as the primary key and permits a null legacy ID;
  recovery tokens support both native staff and existing legacy-linked tokens.
  Added an idempotent, validation-first administrative provisioning command.
- Passed TypeScript, all 175 unit tests and 20 native cloud/cleanup checks.
  Coverage includes unmapped identity denial, password login, original dashboard,
  all-office permissions, password reset/token invalidation, deactivation and
  logout. Temporary Auth/membership/recovery fixtures were removed.
- In-app browser passed native test-account login into the original `/admin/CRM`,
  all five office options plus unassigned, and sign-out to `/admin/login` on the
  owner's 3022 server. Screenshot:
  `output/playwright/native-staff-dashboard-2026-10-15.png`.
  The real owner's password was not collected or tested by the agent.
- Final verification confirmed the real account is linked, confirmed, active and
  password-enabled. All three original employee credential/scope fingerprints and
  the complete legacy user table match their pre-change baseline. Both migration
  and cutover switches remain false. The business database remains the isolated
  cloud preview; no production business records were copied.
- Work stayed in `aet-website-2026-dev`, directly connected to cloud Supabase.
  No Docker, server restart, production build, deployment, commit or push.

### Original CRM connected to cloud business workflows — October 15, 2026

- Restored the original CRM presentation at `/admin/CRM`: sidebar, four overview
  cards, document strip, status tabs, desktop table, mobile cards, education/service
  triggers and right-hand detail drawer. The simplified lists are no longer the
  staff entry points. Formal list/detail URLs and the former preview URL redirect
  into the connected workspace; no fictional records are embedded in its UI.
- Added a staff-only workspace endpoint. Office permissions apply before overview
  metrics, filters, search, sorting, pagination, document/payment summaries and CSV
  export. The formal legacy office, including NULL, remains authoritative. Export
  covers all matching pages, escapes spreadsheet formulas and caps at 5,000 cases.
- Connected drawer notes, formal status/quotes/report actions, preliminary result
  corrections, information requests, payment history, customer access and audit to
  existing protected APIs. Formal payment history and preliminary office are
  staff-only detail fields. New application opens existing intake forms; import
  orders and standalone payment drafts explicitly remain unavailable. GPA retains
  its local calculator behavior.
- Verified on the owner's existing `aet-website-2026-dev` server at 3022, directly
  against isolated cloud Supabase. TypeScript, 173 unit tests and 325 cloud checks
  passed; cleanup added four checks (329 total). The focused cloud run used
  `--seed-directly` for synthetic preliminary fixtures after the public intake
  limiter rejected repeated setup. The public limiter was not changed or reset.
- In-app browser passed 1440px desktop, 390px mobile and 320px narrow mobile;
  education/service drawers, persisted notes after reload, status/audit updates,
  preliminary result save, office/search/empty states, pagination, document/report
  and payment views, old detail/preview redirects, denied-office drawer, new-form
  links, GPA, mobile focus trap/Escape and sign-out. Mobile widths had no page-level
  horizontal overflow. CSV contents and scope were verified through the HTTP API.
- Removed all temporary test users and business records. Employee credential/scope
  fingerprints and production business policies/triggers match their baseline;
  Auth user count restored. Both staff migration/cutover switches remain false.
  No Docker, server restart, production build, deployment, commit or push.
- Screenshots (synthetic records, since cleaned up):
  `output/playwright/crm-connected-{desktop,mobile,mobile-drawer}-2026-10-15.png`.

### Pre-evaluation customer-flow completion — October 15, 2026

- Restored direct Application ID and reusable email-link lookup without customer
  registration/login or a second email. Internal cookies remain application-scoped.
- Added three-step draft restoration and Start over; preserved legacy fields,
  optional files, USD 19.88 pricing and the new website theme. Confirmation mail
  now includes education/fees; result mail includes the paid assessment/reasoning.
- Fixed an unpaid-result exposure through legacy education `ai_output`; the
  customer response now includes only permitted education fields. Transient load
  errors clear after recovery, and unknown IDs do not trigger repeated polling.
- Passed 44 focused unit tests, TypeScript, the 466-key locale check, 31 customer
  API checks and 21 existing service API checks. Coverage includes duplicate and
  conflicting submission, checkout reuse/cancellation/expiry, direct/repeated ID
  access, session expiry, isolation, malformed inputs and unpaid/refund gating.
- In-app browser passed submission, refresh/draft restoration, Start over,
  invalid-ID feedback, direct lookup and locale switching. Desktop and 390px
  mobile form/status/result views passed; mobile had no horizontal overflow.
- Real service acceptance passed with fictional data: Stripe sandbox card payment,
  a 745-byte exact Dropbox upload/download, local Codex assessment and automatic
  paid result display. AI identified the synthetic document and declined to
  assign a degree. Resend confirmed both confirmation and result mail delivered
  to `tech@meiyugroup.org`, with the intended ID/link/education/result content.
- 3022 changed to a separate cloud-preview database during this pass. Its
  configuration was preserved; remaining local checks used a temporary source
  snapshot on 3023. That server was stopped after acceptance; no worker remains
  running. The local test application is not present in the cloud preview.
- Screenshots: `output/playwright/preeval-customer-form-mobile-2026-10-15.jpg`,
  `preeval-customer-result-mobile-2026-10-15.jpg` and
  `preeval-customer-result-desktop-2026-10-15.jpg`. See
  [detailed acceptance](../pre-evaluation-local.md#customer-flow-acceptance--october-15-2026).
  No build, deployment, bulk migration, commit or push by this pass. Concurrent
  staff-auth work was preserved and is not included in these acceptance claims.

### Cloud business database and office permissions — October 15, 2026

- Continued only in `aet-website-2026-dev` using the owner's existing 3022 server,
  directly against cloud Supabase project `qrxztgdemfodemlcabcq`; no Docker,
  production build, server restart by Codex, deployment or push.
- Prepared three private preview schemas (23 tables) and a restricted business
  login. Copied legacy table definitions, checks/indexes and internal foreign
  keys only; no real customer rows. Workflow triggers target preview tables.
  Auth and business connections remain separate. Business connection attempts
  to read credentials or update production applications were rejected.
- Passed **241 HTTP/database acceptance checks plus four final cleanup checks**
  using three disposable staff identities and 12 fictional applications. Tested
  the approved all-office, west/Miami and east office groups across all five
  named offices and unassigned records: list/detail/update/file/report/access-link
  authorization, explicit unassigned access and immediate deactivation.
- Confirmed customer/staff isolation, private notes, optimistic concurrency,
  idempotent submission, education relationships, exact prices, result payment
  gates/refund revocation and legacy workflow/payment bridges. Fixed formal
  queue office labels to use the same authoritative business record as access
  checks, including a null office and a conflicting workflow JSON snapshot.
- Cloud preview suppresses business email delivery and AI work, and blocks
  Stripe/Dropbox calls before the network. Six confirmation outbox entries were
  deduplicated with zero delivery attempts. File metadata and report release
  were tested; real file transfer, charges, provider webhooks and mail/AI delivery
  were not tested in this pass.
- In-app browser passed authenticated CRM/formal lists on desktop (1440px),
  pre-evaluation detail and note save with an audit entry, and formal detail at
  390px with no horizontal overflow. The west fixture saw exactly four allowed
  records in each workflow. Logout returned to `/admin/login`; viewport reset.
  Evidence in `output/playwright/`: `cloud-crm-desktop-2026-10-15.png`,
  `cloud-detail-desktop-2026-10-15.png`, `cloud-formal-desktop-2026-10-15.png`,
  `cloud-formal-mobile-detail-2026-10-15.png`.
- All **171 unit tests**, TypeScript and whitespace checks passed. Synthetic
  business/Auth/staff records were removed. Real employee credential/membership
  snapshots and production policy/trigger metadata compared unchanged. Both
  migration/cutover flags remain false; original employee login remains active.
- Production cutover remains pending: legacy direct Data API policies are broader
  than the new office rules and need coordinated remediation, followed by
  production workflow backfill, external service acceptance and restore rehearsal.
  Details and reproducible commands are in [staff-auth.md](../staff-auth.md).

### Supabase staff authentication candidate — October 15, 2026

- Implemented password login, visibility toggle, user-requested password recovery,
  reset and logout in the correct `aet-website-2026-dev` worktree on port 3022.
  Supabase Auth and the private roster connect directly to the cloud; no Docker
  runtime is required for this authentication path. This repository has no
  Payload runtime dependency. The dependency inventory and rollout boundaries
  are recorded in [staff-auth.md](../staff-auth.md).
- Prepared the three owner-approved employee mappings and office scopes. All
  three remain pending, with original legacy hashes/salts and no Auth UUIDs.
  Both employee-migration and staff-cutover switches remain false. The previous
  staff email-login page, endpoint, links and sessions are retained for the
  transition; customer authentication remains independent.
- Passed TypeScript checking, all 157 tests in the current checkout (including
  43 focused staff-auth tests), and 24 synthetic cloud acceptance assertions.
  Cloud checks cover concurrent first login, exact password preservation,
  confirmed identity without an invitation call, refresh, 3022 HTTP cookies,
  authenticated CRM page rendering, origin rejection, recovery/reset, retired
  password rejection, account deactivation and logout. Fixture records were
  deleted; the Auth user count returned to zero and all real staff records were
  compared unchanged. No application recovery mail was sent by these tests.
- In-app browser passed desktop 1440px and mobile 390px login inspection, password
  visibility, failed-login messaging, unknown-email recovery confirmation,
  invalid-reset-link handling and the retained email-login entry. Mobile width
  is 390px with no horizontal overflow. Screenshots in `output/playwright/`:
  `supabase-staff-login-desktop-2026-10-15.png`,
  `supabase-staff-login-mobile-2026-10-15.png`, and
  `supabase-staff-forgot-mobile-2026-10-15.png`.
- At the initial authentication checkpoint, full business-data operations were
  not rerun because the local workflow database was unavailable. The later cloud
  acceptance above supersedes that limitation for isolated business operations. Office access helpers are covered by unit tests;
  end-to-end list/detail/mutation/file authorization against the target business
  schema, customer/payment integrations, cloud business configuration, direct
  Data API policy review and restore rehearsal remain pre-cutover requirements.
- The owner restarted 3022 after the authorized connection configuration copy.
  No real employee was migrated; no production login was retired. No production
  build, deployment or push was run. The mistaken legacy-checkout code changes
  were restored and that checkout was verified clean. No encrypted backup or
  business data was copied into this project.

### Staff routing and worktree documentation — October 15, 2026

- Recorded the required legacy production dashboard URL, English-only staff
  scope, multilingual customer scope and current email-link authentication.
  Clarified that office badges/filters apply only to the fictional preview.
- Added the main/dev checkout paths, ports 3021/3022, owner-managed VS Code
  startup, local origin/email configuration and Git-merge integration workflow.
- Recorded the proposed single Vercel project with website/app domains, the
  distinction between DNS binding and hostname/path routing, and outstanding
  production configuration, worker/AI operation, acceptance and rollback work.
  Hostname routing and domain configuration remain unimplemented in this pass.
- Documentation was reconciled with the current proxy, package scripts,
  worktree listing and non-secret local configuration. Checked document links
  and whitespace; no application tests or browser checks were repeated for
  this documentation-only update. No push, deployment or DNS change was made.

### English-only staff routes — October 15, 2026

- Staff pages now use English with canonical unprefixed `/admin/*` URLs.
  The legacy dashboard remains `/admin/CRM`; localized admin paths and the
  lowercase CRM alias permanently redirect to their canonical counterparts.
  New staff email links use `/admin/access`. Customer pages remain localized,
  and visiting staff pages does not overwrite the saved website language.
- Passed TypeScript checking, the 466-message English/Chinese/Spanish locale
  check, and 28 HTTP routing assertions against the user's existing port 3022
  development server. Checks cover all three locale-prefix redirects, query
  preservation, CRM casing, English login/access responses, protected-page
  login redirects, and Chinese/Spanish public-page rendering.
- In-app browser: the existing `/zh/admin/login` tab redirected to
  `/admin/login`, showing the English login form without language controls.
  Desktop and 390px mobile views passed visual inspection; the mobile page
  has no horizontal overflow. Screenshots are in `output/playwright/` as
  `staff-login-desktop-2026-10-15.png` and `staff-login-mobile-2026-10-15.png`.
- Authenticated dashboard content and real email-link delivery/consumption
  were not exercised in this pass. Authentication requirements are unchanged.

### Form and database compatibility — October 2, 2026

- Aligned the new pre-evaluation and formal forms with the original business
  fields. Country/region controls submit original codes; date selectors retain
  calendar dates and `{year, month}` education dates. Formal notes are in step 1,
  education entries remain optional, extra copies are a separate report choice,
  and shipping uses the client address. The earlier independent-recipient and
  relaxed international-format behavior described below has been superseded.
- Pre-evaluation has its optional document picker in the education step. Selected
  files upload after the application is saved; a failed upload shows a retry
  message. Country display names are static across server/browser to prevent
  hydration errors caused by differing locale-data versions.
- Read only legacy schema metadata and reproduced the five original business
  table definitions in the isolated local fixture. Verified columns, types,
  nullability, defaults, primary/foreign keys and check constraints against that
  metadata. No original business column or constraint was changed. Submission
  saves original business rows and auxiliary workflow/access rows atomically;
  workflow bridges update original status, payment and education result fields.
- Kept the website's formal service rates and actual turnaround options. Added
  an optional immutable quote snapshot inside the existing service JSON field,
  plus a small `aet-app` reader patch for service cards, completion estimates,
  email details and payment eligibility. Historical rows keep their previous
  calculation. Unconfirmed ranges cannot be charged at their lower bound.
- Passed 98 website unit tests, 13 rollback-only database compatibility checks,
  24 formal API checks and 59 workflow API checks. The old application passed
  29 focused reader/component tests. Both repositories passed type checks;
  the website has 466 matching valid messages in each language. No production
  build was run. The API fixtures were removed, including orphaned synthetic
  business rows from the first test pass.
- In-app browser: Chinese formal application completed all four steps and saved
  a fictional request with an extra copy and a $150–$170 unconfirmed estimate.
  Loaded that saved row through the actual old form reader and confirmed purpose,
  report code and pending-payment interpretation. Inspected 1280px desktop and
  390px mobile views. Pre-evaluation passed applicant/education/review navigation,
  optional documents and displayed $19.88 total; its final submission was not
  repeated during this pass. Mobile pages have no horizontal overflow.
- Screenshots in `output/playwright/`: `legacy-compatible-evaluation-desktop.png`,
  `legacy-compatible-evaluation-mobile.png`, `legacy-compatible-evaluation-saved.png`,
  `legacy-compatible-preeval-desktop.png`, `legacy-compatible-preeval-mobile.png`.
  Fixed the country-label hydration mismatch; no new errors appeared on reload.
  The old full application was not browser-tested; its reader/card changes were
  verified by data round-trip and component tests without starting its server.
- This remains local compatibility work. Auxiliary workflow tables still exist;
  this is not a production cutover, historical migration or simultaneous-edit
  synchronization between systems. No email, AI job, external upload, actual
  payment, production database update, push or deployment was performed in this
  pass. The pre-evaluation rate was not changed. See
  [the mapping and cutover boundary](../legacy-form-compatibility.md).

### Formal evaluation application and local workflow — October 2, 2026

- Completed the localized four-step formal application: client details,
  evaluee/multiple educations, evaluation services and report/shipping options,
  and review/consent/submission. Includes field-level errors, gated forward
  navigation, return-to-edit, tab-scoped draft restoration, international
  addresses, independent recipients and a mobile total before the action buttons.
- Document-by-Document, Course-by-Course, Expert Opinion Letters and Position
  Evaluation use the public website catalog in `lib/pricing.ts`. Added the
  legacy additional-degree and PDF/paper report options to that same catalog
  and the public Pricing/Evaluation tables. Website prices override conflicting
  legacy fees/tiers. Extra paper copies retain the published $40–$60 range;
  translation/custom services remain separate quotes.
- Added server-side validation/calculation, idempotent local persistence and
  private confirmations. The new `evaluation` schema and migration were applied
  only to the existing isolated local Supabase database. Reused the running
  development server on port 3021; no server/container restart was needed.
- Passed 52 formal-domain tests, the existing 18 pre-evaluation tests, 20 formal
  API integration checks, typecheck, three-language message validation and
  whitespace checks. API acceptance covers price tampering, retries, ownership,
  24-hour server-enforced expiry, CSRF rejection, request-size limits and private
  database permissions. Disposable integration records were removed.
- In-app browser passed the four-step English flow using fictional data, two
  education records, multiple services/additional degrees, consent validation,
  submission and receipt reload. Checked PDF switching removes paper/shipping
  fees, Canada-based billing with a separate U.S. recipient changes shipping
  options, and extra copies produce the correct fee range. New application
  starts blank after successful submission.
- Verified 1440px desktop and 390px mobile layouts, Chinese/Spanish form and
  receipt localization, language changes with draft retention, website price
  table display, and the Evaluation-page action opening the local application.
  Checked mobile page width: no horizontal document overflow.
- Screenshots under `output/playwright/`: `evaluation-form-zh-desktop.jpg`,
  `evaluation-services-mobile.jpg`, `evaluation-form-es-mobile.jpg`,
  `evaluation-receipt-mobile.jpg`, and `evaluation-shared-pricing-desktop.jpg`.
- Extended the form into a local workflow: supporting-document uploads, private
  downloads, fixed or confirmed quotes, Stripe test checkout/reconciliation,
  staff queue and case review, internal notes, customer messages, PDF draft upload,
  explicit report release, refunds/release gating, and single-use access renewal.
  Applied the second formal migration only to the existing isolated local database.
- Latest checks pass: 88 unit tests (52 form, 18 workflow and 18 pre-evaluation),
  20 form API checks, 59 workflow API checks, typecheck, 461 matching messages per language, and whitespace
  checks. Workflow acceptance includes synthetic signed payment/refund events,
  duplicate events, quote locking, private drafts/notes, stale report prevention,
  access-link replacement/reuse/expiry, CSRF, cancellation and authorization.
  The real-service test passed 66 checks with isolated Dropbox upload/download,
  duplicate upload, Stripe test session reuse, exact website amount and expiry.
- In-app browser completed a real Stripe **sandbox** card checkout for fictional
  case `e48325a6-f394-4b4f-8997-abdccf2afb5a`: $100 document evaluation + $10 PDF
  report = $110.00, no surcharge. Return automatically reconciled as paid.
  Uploaded a synthetic supporting image, reviewed the case, uploaded a clearly
  marked synthetic PDF, saved staff notes and released the report. After staff
  logout, the customer downloaded the PDF; its SHA-256 matches the uploaded file.
- Verified desktop 1440px and mobile 390px customer status, staff detail and staff
  search/filter states; no horizontal page overflow. Checked Chinese, English and
  Spanish customer views and private access-link consumption. Screenshots include
  `formal-case-desktop.jpg`, `formal-case-mobile.jpg`, `formal-workspace-mobile.jpg`,
  `formal-complete-zh-mobile.jpg`, and `formal-complete-en-desktop.jpg` under
  `output/playwright/`. Fixed a Next.js route-config re-export caught in the browser.
- Browser-tested the quote-required branch with extra copies and translation:
  website estimate $210–$250, staff-confirmed website subtotal $220 plus $50
  translation, customer-visible total $270. The fixed website fees stayed unchanged;
  extra copies were $90 for two, within the published $80–$120 range. Captured in
  `formal-confirmed-quote-zh.jpg`. This second fictional case was not paid.
- Automated formal emails, self-service email recovery, report authoring, paper
  dispatch/tracking and production rollout remain open. No email, live charge,
  production build, commit, push or deployment was performed. The retained browser
  case and PDFs are explicitly synthetic. See [scope](../evaluation-application.md).

### Pre-evaluation local workflow — October 2, 2026

- Implemented the full local pre-evaluation path: localized form, durable
  application/education, private Dropbox documents, Stripe test checkout and
  signed callbacks, direct AI assessment, automatic paid-result display,
  Resend notifications, application recovery and staff workspace.
- Owner decisions: retain legacy required/optional fields and USD 19.88 total;
  no separate OCR; automatic AI release after payment with staff corrections;
  no office partitioning; administrator and sole test recipient are
  `tech@meiyugroup.org`. These supersede the earlier manual-result-first plan.
- Started isolated Supabase `aet-pre-evaluation-local` on ports 55421/55422.
  Reused the owner's running development server on port 3021. Existing
  Supabase instances, old application data and production settings were not
  changed. Exactly three old records were read for structural inspection;
  no historical identity/document data was imported.
- Passed 18 domain tests, 21 API integration checks and 30 lifecycle checks.
  Coverage includes idempotent submission, private/cross-application access,
  token/session expiry and reuse, duplicate/signed/mismatched payment events,
  cancellation/expiry, interrupted-upload retry, Resend failure/retry, staff
  corrections, stable result timestamps and refund ordering. Anonymous
  database access was separately denied as expected. Refund/async-failure
  states were simulated on isolated fixtures, not real transactions.
- Completed a real Stripe **sandbox** card checkout for a fictional application.
  The signed callback and server reconciliation recorded the exact USD 19.88;
  the customer result unlocked automatically. Dropbox upload/download returned
  identical bytes. Codex account authentication generated real output from
  form fields and then from an uploaded PDF; the result correctly identified
  the PDF as explicitly fictional. No OpenAI API key or OCR service was used.
- Resend confirmed `delivered` for application, result, recovery, supplemental
  information and corrected-result messages to the approved test mailbox.
  Inbox placement was not manually inspected; workspace `sent` means provider
  acceptance, while this verification used Resend's delivery status.
- In-app browser passed English customer submission/payment/upload/result,
  secure recovery, staff login, search, notes, information requests and result
  correction. Desktop and 390px mobile views were inspected. Chinese and
  Spanish form/landing navigation, localized metadata and language switching
  were checked. An access-link Strict Mode issue found during testing was
  corrected and the emailed link successfully reopened the saved application.
- Typecheck, 18 domain tests, site i18n validation and whitespace checks passed.
  No production build, push or deployment. Setup, processes, limitations and
  acceptance commands: [pre-evaluation-local.md](../pre-evaluation-local.md).
- Screenshots: `output/playwright/preeval-result-{desktop,mobile}.jpg`,
  `preeval-workspace-{desktop,mobile}.jpg`, `preeval-form-zh-mobile.jpg`.
  Earlier CRM-preview and website evidence below remains historical.

### Pre-evaluation-first development priority — October 1, 2026

- Reordered the replacement checklist around the owner's proposed pre-evaluation
  pilot. It supersedes the earlier saved-application-only first milestone and
  includes test payments, controlled email delivery, staff review and results.
- Read the sibling AET App's degree-equivalency form/types, submission action,
  Stripe webhook branch, result/status hooks and customer success/result UI.
  These show an existing path covering the intended shared capabilities; no
  external service or production transaction was exercised.
- Kept formal-evaluation-specific pricing/report/delivery work and legacy AI/OCR
  parity separate. The pilot can first validate delivery of a staff-confirmed
  preliminary result; it does not establish full evaluation or AI readiness.
- This is a documentation/priority update on `dev`. The CRM still uses fictional
  fixtures, and no backend integration, email send, payment or deployment was
  performed in this update.

### CRM branch and checklist reconciliation — October 1, 2026

- Confirmed `e67dbc1` on local `dev` contains the CRM preview, UI refinements and
  related documentation. Local `main` is at `3f81ccb`, matching the local
  `origin/main` reference. The branch transfer did not push or deploy anything.
- Extended the migration checklist with the owner's no-merge/no-Payload
  replacement direction, completed preview work and ordered backend milestones.
  The next milestone is a persistent test application with staff access,
  education/service data and private documents; payments/email and legacy-data
  transition remain unchecked.
- Reconciled against current Git state, preview source, dependency/route files,
  sibling AET App record types and its CRM authentication/office-filter code.
  Existing browser/typecheck evidence supports only the completed preview work.
  This documentation update does not establish production-service readiness.

### CRM detail entry affordances — October 1, 2026

- Added blue underlined labels, persistent right chevrons, hover/focus styling
  and destination tooltips to education/service detail triggers. Missing
  education is plain text without an arrow or a misleading detail action.
- Mobile cards now have independent client, education and service buttons,
  each opening the corresponding drawer section, without nested buttons.
- Passed TypeScript and whitespace checks. In-app browser verified desktop
  education entry via keyboard, service entry via click, both direct mobile
  entries, and the mobile card layout without horizontal page overflow.
- Screenshots: `output/playwright/crm-detail-entry-{desktop,mobile}-2026-10-01.jpg`.
  Reused the running local preview; no production build or deployment.

### CRM readability and information layout — October 1, 2026

- Increased CRM font sizes and weights. Replaced client initials with consistent
  BOS/NYC/MIA/LA/SF office badges and removed the separate Office column.
- Added a dedicated Education column alongside Service, with direct links to
  separate drawer sections. Education shows fictional degree, institution,
  country and study-period records; missing education has an explicit empty
  state. New and imported sample applications start without education records.
- Updated dates use `YYYY-MM-DD` in the table, mobile cards and application
  details. Narrow desktop tables retain all columns through local scrolling.
  Search includes office codes and education fields; CSV exports include
  education summaries and update dates.
- Passed TypeScript checks. Codex in-app browser verified desktop (1440px and
  1280px), mobile (390px) and narrow-screen (320px) states without horizontal
  page overflow. Checked education/service details, multiple and missing
  education records, office-badge synchronization and NYC search (three results).
  Corrected mobile study-period wrapping and verified the final narrow drawer.
- Screenshots: `output/playwright/crm-refinement-{desktop,mobile,education}-2026-10-01.jpg`.
  Verification reused the owner's running server on port 3021. The page remains
  a fictional-data preview; no production integrations, build or deployment.

### CRM interactive visual preview — October 1, 2026

- Added the English CRM preview at `/admin/CRM` (also reachable through the
  existing locale routing). Based the workflow on the sibling AET App's
  Applications, Payment Links and Degree Equivalency CRM code. The live reference
  redirected to login; no production customer records were accessed.
- Built an AET-branded workspace with office-scoped sample metrics, searchable
  and sortable application lists, status filters, pagination, a detail drawer,
  document review, notes and session activity. Added payment-request and
  pre-evaluation views, a document list, sample application creation, limited CSV
  import/export and a weighted 4.0-scale GPA calculator.
- The preview contains explicitly fictional records and amounts. Changes use
  browser memory only and reset on refresh. Payment requests remain sample
  drafts, and email previews do not send messages. No authentication, database,
  payment, storage or email integration was added; Payload is not a dependency.
  These remain implementation work before this page can become an operational
  CRM. The existing AET App remains the live business system.
- Passed TypeScript and whitespace checks. HTTP checks returned 200 for the
  unprefixed, Chinese and Spanish CRM URLs, each with noindex/nofollow. Confirmed
  exclusion from the sitemap and that the homepage still returns 200.
- Codex in-app browser passed desktop (1440px), mobile (390px) and narrow-screen
  (320px) checks, with no horizontal page overflow. Verified search, combined
  office/search empty states, clear filters, sorting, pagination, the detail
  drawer, document review, blocked premature status changes, subsequent status
  updates, note saving and activity records.
- Also verified sample application creation, payment-draft creation, invalid CSV
  rejection and a two-order sample import, the pre-evaluation subset, GPA
  recalculation (3.57 to 3.68 when the first course changes from 3 to 6 credits),
  mobile card details, navigation switching and Escape dismissal. No browser
  warning/error was captured. CSV export is implemented but its download was
  not separately browser-verified.
- Screenshots: `output/playwright/crm-preview-{desktop,mobile,detail}-2026-10-01.jpg`.
  Reused the owner's running development server on port 3021 and left the preview
  open. No local production build, deployment, commit or push was performed.
### CSLB Blog publication date — October 8, 2026

- Set the new guide's publication date to October 8, 2026. Its previous null value
  put it after dated articles; the existing newest-first sort now places it first.
  The separate Boston featured recommendation remains an editorial selection.
- Updated the date guidance and schema checker for authored articles. Typecheck,
  whitespace, and HTTP checks passed: all three Blog lists show CSLB first among
  29 evaluation articles, preserve the full date order, and expose the matching
  article publication date. Browser policy still blocks rendered visual checks.

### CSLB Blog CTA destinations — October 8, 2026

- Replaced email CTAs and drafts in all three languages with the California
  phone number, localized Contact page, and existing evaluation application.
  Introductory and process CTAs now go directly to Contact. Updated the short
  Blog guide and click methods to match; earlier email-related notes are superseded.
- Typecheck, i18n, whitespace, and HTTP checks passed for all three articles and
  Contact destinations, including the office anchor and absence of mailto links.
  The application URL matches the existing site entry; no form was submitted.
- Browser policy still blocks rendered desktop/mobile verification. Reused the
  existing server without restarting; no build, commit, push, or deployment.

### CSLB Blog translations — October 8, 2026

- Added complete Chinese and Spanish versions of the CSLB guide at the owner's
  request. Titles, body, contents, image descriptions/captions, AI prompts, inquiry
  controls, and email drafts now follow the selected language. The 80 retained
  articles remain English-only; the earlier CSLB language scope below is superseded.
- Each version has a self-referencing canonical URL, matching language alternates,
  BlogPosting language, and localized sharing card. The sitemap contains 83 article
  URLs for 81 articles. Blog cards/search use translated titles; queued click events
  include the article locale. Updated the existing SEO/schema checkers accordingly.
- Passed typecheck, i18n, checker syntax, whitespace, and focused HTTP checks for
  all three article/index/parent pages, translated figures/contact/AI URLs, metadata,
  JSON-LD, sharing images, sitemap alternates, and query-preserving 308 redirects.
  Six pilot/imported article routes retained their previous indexing rules.
- Visually inspected both new sharing cards and fixed Chinese punctuation wrapping.
  The prior browser policy denial still prevents rendered desktop/mobile and live
  copy/language-switch verification. Reused the running port-3021 server; no build,
  commit, push, or deployment.

### CSLB Blog imagery — October 8, 2026

- Added a generated construction-planning illustration near the article beginning
  and reused the licensed document-consultation photograph after the materials
  section. Visible captions identify illustrative use; alt text describes the
  contents. Image provenance and the generation prompt are recorded in ASSETS.md.
- Added optional figures to authored articles, with responsive Next Image sources,
  fixed aspect ratios, and lazy loading. The lead asset also supplies BlogPosting
  imagery; the schema checker now recognizes optimized image URLs.
- Inspected both source images. Typecheck, whitespace, and checker syntax passed.
  HTTP checks passed all three article interfaces, captions, image dimensions,
  optimized image loading, and the English article image schema. Responsive WebP
  responses at 384px and 828px were about 11–46 KB.
- The previous in-app browser policy denial remains a visual-verification blocker;
  no alternate browser bypass was attempted. Desktop/mobile rendered appearance
  has not been verified. Reused the existing port-3021 server without restarting;
  no build, commit, push, deployment, or advertising action.

### CSLB Blog conversion — October 8, 2026

- Created `/blog/cslb-foreign-credential-evaluation` with the approved title,
  direct introduction, first-person questions, official source links, and California
  email/phone inquiry actions. The shared Blog layout retains English prose across
  all three interfaces. A requirements-review date is shown; no publication date
  or author is invented before launch.
- Added five AI destinations near the beginning and a copyable question containing
  the public canonical URL. Claude and Grok use entry-page links. Click intent is
  queued in `dataLayer`; no analytics tag, lead reporting, or ad campaign is active.
- New authored content has its own catalog/registry outside the legacy importer.
  Blog search includes slugs so “CSLB” finds the approved question title. There are
  now 81 articles, including 29 evaluation articles. Evaluation links directly to
  the guide; all three former service routes return 308 with query values retained.
- Removed the superseded translated service drafts, their sharing images, and
  unused service-shell additions. Added one 1200 × 630 Blog sharing card and
  updated sitemap coverage without modifying the 80 imported article sources.
- Passed typecheck, i18n, whitespace, all three article/parent/index HTTP checks,
  TOC IDs, contact targets, encoded AI URLs, canonical/noindex/BlogPosting rules,
  sharing-image dimensions, 308 query preservation, and sitemap membership.
  The existing 79-body static checker and representative pilot/imported HTTP
  regressions passed. Inspected the generated sharing card visually.
- Browser security policy rejected the in-app local-page operation. Desktop/mobile
  visual checks and copy/prefill interactions were not run; no alternate browser
  bypass was attempted. External AI fetching could reach Claude/Grok entry pages
  but could not verify ChatGPT/Perplexity/Google query behavior. Copyable text is
  available as the fallback. See [authored content notes](../../content/blog/authored/README.md).
- Port 3021 was initially down. Sandboxed `pnpm dev` hit file-watcher errors and
  was stopped; the approved sandbox-external `pnpm dev` is running at
  `http://localhost:3021`. No production build, commit, push, deployment, inquiry,
  or advertising purchase was performed.

### Short Blog article guide — October 8, 2026

- Reviewed the existing 80-article collection and related guidance, then narrowed
  `docs/blog-requirements.md` at the owner's request to six writing rules and an
  example outline: search-focused titles, direct answers, first-person questions,
  AI links after the introduction, scannable content, and a relevant closing action.
- Updated documentation entry points to match the narrower scope. Existing
  language, design, migration, and verification guidance remains in its own files.
- Local references and whitespace checked. Documentation only: no page edits,
  new AI links, analytics changes, browser run, or build at that stage. The later
  owner-approved CSLB conversion is recorded above.

### CSLB evaluation subpage — October 8, 2026

- Historical draft, superseded by the Blog conversion above.
- Added `/evaluation/cslb` with English, Chinese, and Spanish content and a
  localized entry on each Evaluation page. The guide covers education credit,
  documents, sealed official transcripts, next steps, fees, FAQs, and contact.
  Official CSLB sources and content boundaries are recorded in
  `content/blog/authored/README.md` (moved during the Blog conversion).
- Reused the service-page shell with an optional introduction and parent
  breadcrumb. Added localized metadata, three-level breadcrumb structured data,
  sitemap entries, and three 1200 x 630 sharing images. The existing image
  generator can now limit generation to explicitly selected sitemap paths.
- Inquiry actions use the California contact catalog and a localized email
  template; no new backend or application-portal purpose was added. No AICE
  reference, CSLB endorsement, guaranteed acceptance, or credit outcome appears
  in the new copy. AET eligibility and the report type still require CSLB
  confirmation before a customer orders.
- Typecheck, existing i18n checks, new locale-content structure checks, and
  whitespace checks passed. Served HTML checks passed all three routes, parent
  links, canonicals, language alternates, sharing images, breadcrumbs, five FAQs,
  section anchors, pricing/contact destinations, and email/phone targets.
- Codex in-app browser verified English and Chinese desktop at 1440px, all three
  languages at 390px, and Chinese/Spanish at 320px without horizontal page
  overflow. Checked the main contact action, English/Chinese FAQ disclosure,
  all three mobile process cards and disabled final Next control, language
  switching with the route/fragment retained, and the Chinese Evaluation entry
  link. Mail and phone destinations were inspected without sending or calling.
  Screenshots: `output/playwright/cslb-{en-desktop,zh-desktop,zh-mobile,es-contact-mobile}-2026-10-08.png`.
- Reused the existing server on port 3021. No production build, commit, push,
  deployment, advertising campaign, or external submission was performed.

### Four contact methods — October 8, 2026

- Updated the shared Contact instructions to Phone, Email, WeChat, Visit in that
  order, with matching icons and English, Chinese, and Spanish copy. The four
  office detail pages reuse these instructions. Retained the one-office guidance
  and San Francisco reservation exception; office contact values remain centralized.
- Typecheck, i18n validation, and whitespace checks passed. Local HTTP checks
  verified method ordering across all 15 localized Contact and office detail pages.
- Codex in-app browser passed English desktop (1440px), all three Contact locales
  on mobile (390px), and the Spanish Boston office instructions on mobile. English
  mobile controls reached each of the four cards and disabled Next on the last;
  mobile pages had no horizontal page overflow. Desktop evidence:
  `output/playwright/contact-four-methods-desktop.jpg`.
- Reused the existing server on port 3021 without restarting it. No build, commit,
  push, or deployment was performed.

### Payment Zelle priority — October 8, 2026

- Kept Card Payment first and moved Zelle instructions, all six steps, the office
  selector and Zelle note ahead of the retained Deposit / Check details. Renamed
  the alternatives heading to list Zelle first and the bank panel to Zelle Bank
  Information, with equivalent Chinese and Spanish copy. Added a Deposit / Check
  subheading to distinguish the later bank/check details.
- Aligned the processing table with Card, Zelle, Bank Transfer/Deposit, Check.
  Verified all other localized payment copy is preserved; recipients, amounts,
  payment validation and handoff behavior were not changed.
- Typecheck, i18n and whitespace checks passed. Codex in-app browser verified
  English desktop at 1440px (including Boston office switching), and Chinese
  and Spanish mobile at 390px with no horizontal page overflow. Screenshots:
  `output/playwright/payment-zelle-{desktop,zh-mobile,es-mobile}-2026-10-08.png`.
- Port 3021 was not running. Started `pnpm dev`; sandbox file-watcher failures
  required restarting that process outside the sandbox. The preview server
  remains running at `http://localhost:3021`. No build, payment, push or deployment.

### San Francisco visit policy and Evaluation promise — October 1, 2026

- Updated the shared San Francisco phone to the Los Angeles office number,
  +1 949-954-7996. Added a prominent reservation-required note to its Contact
  card in English, Chinese and Spanish, and clarified the general visit copy
  so the no-appointment statement excludes San Francisco.
- Replaced the Chinese and Spanish AET promise's NACES affiliation wording
  with a general description of experienced credential evaluation professionals.
  The English promise already uses this wording and remains unchanged.
- Passed typecheck, all three language message checks and diff whitespace checks.
  Local HTTP checks passed the reservation text, telephone link and Evaluation
  promise on all six localized Contact/Evaluation pages.
- Codex in-app browser passed English Contact's San Francisco card and Chinese
  Evaluation's promise at 1440px desktop and 390px mobile. The mobile office
  anchor reaches the correct card; the Chinese Evaluation page has no horizontal
  page overflow. Screenshots: `output/playwright/sf-contact-{desktop,mobile}-2026-10-01.png`
  and `output/playwright/evaluation-promise-{desktop,mobile}-2026-10-01.png`.
- Verification used the existing development server on port 3021; no production
  build was run. The owner subsequently requested committing and pushing these
  changes. Hosted deployment status is not verified by these local checks.

### Release-readiness spot check — October 1, 2026

- User authorized a local commit. Push, deployment and domain/DNS changes were
  not performed. Latest local fixes still require a hosted release.
- Live read-only checks: the Vercel homepage returned 200 without the new
  noindex header; the official www homepage still redirected to Apache
  `/home.php`; the existing credential-application entry page returned 200 on
  Vercel. Entry-page availability is not payment/application workflow acceptance.
- DNS lookup: the apex resolved to the old server, www aliased the apex, and
  the app subdomain had its own Vercel CNAME. Preserve application and email DNS
  records when preparing the marketing-site cutover.
- Release gates: deploy the latest commit and verify it; confirm production
  payment configuration/recipients and authorized transaction acceptance; prepare
  Vercel domain binding, DNS rollback and active Search Console verification.
  After cutover, verify TLS, redirects, crawl controls and submit the new sitemap.
  Deferred unmigrated content/PDFs are not part of these gates.
- Pre-commit typecheck, three-language messages, fragment regression tests,
  static Blog and body-link checks passed. No local production build was run.

### Owner scope decision — October 1, 2026

- Defer all currently unmigrated legacy content and PDF review for possible future
  pages. The 71 content URLs and nine PDFs are no longer current tasks, owner
  decisions or release blockers. This supersedes earlier launch-gate wording for
  that material; acceptance of the currently retained site still applies.
- Preserve source files and the URL inventory. No content was migrated, deleted
  or marked permanently retired; no route, redirect, HTTP behavior or deployment
  was changed. Updated checklists and inventory generation to retain this scope
  decision on future regenerations.

### Hosted audit and local corrections — October 1, 2026

- Audited `https://aet-website-2026.vercel.app`. The stable Vercel production
  alias lacked a noindex directive. Added host-specific `X-Robots-Tag` protection
  for every `*.vercel.app` alias, retaining the official canonical origin and
  indexing behavior. The local regression check passed 42 host/path cases,
  including official domains, language pages, assets, robots/sitemap and 404s.
- Fixed 15 encoded legacy URLs in Evaluation's AI-summary links (five per
  language). They now refer to each language's canonical Evaluation page.
  Extended the body-link checker to inspect encoded external query text; it
  reproduced the old-link failure before the edit and passed after the fix.
- Corrected the earlier report of three invalid blog fragments: parsing bare
  date-led fragments with libxml invented paragraph wrappers absent from the
  source and real article container. The checker now uses a block container;
  regression cases still detect genuine invalid nesting. No article prose was
  modified. HTTP parity also now uses the existing contact renderer so reviewed
  office updates do not trigger false failures; original prose hashes remain
  independently checked. Three fragment regression tests passed.
- Hosted baseline checks passed 299 page variants, 4,861 local links, 318 unique
  targets, 133 SEO/share-image cases and 277 redirects. The later legacy-404
  checks triggered HTTP 403 with `X-Vercel-Mitigated: challenge`. Hosted crawling
  stopped; subsequent hosted Blog/schema checks were blocked, not counted as
  passes. Those responses were Vercel security checkpoints, not application 500s.
- Local checks on the existing owner-run port 3021 passed: 782 source HTML links,
  all 299 page variants, 240 Blog routes, 95 article images, 157 Blog redirects,
  133 SEO/schema pages, all 277 redirects and 162 unmapped legacy 404s. The current
  blocked-term scan found no unreviewed member-company matches; 14 articles with
  NACES biography terms remain covered by the existing reviewed exception list.
- Codex in-app browser: hosted desktop/mobile navigation; local institution
  search, empty/reset/category states; combined Blog search/topic filters;
  payment required-field attributes and office switching; Chinese-to-Spanish
  language switching with the route/fragment retained. Evaluation's corrected
  links were inspected at desktop and 390px; Spanish Evaluation had no page
  overflow or broken images at 320px. No browser warning/error was captured.
  Viewport override reset. Screenshot:
  `output/playwright/hosted-audit-ai-links-mobile-2026-10-01.jpg`.
- Typecheck, 259 messages per locale and whitespace checks passed. No production
  build, server restart, real form submission, payment, push or deployment was
  performed. These corrections are local; hosted post-deployment verification
  and payment-provider acceptance remain outstanding.

### Body-link cleanup — October 1, 2026

- Reproduced 246 old-host body links on 13 page families across English, Chinese
  and Spanish (39 rendered pages). The same 299-page crawl now finds zero.
  Of those 246 references, 42 now resolve directly to local destinations;
  204 references to ten held article targets retain their text without links.
- Updated the imported HTML itself, including contact links already rewritten
  by the old renderer: 145 source references normalized and 96 held references
  unlinked. Source counts differ from rendered counts because shared content and
  English-only articles appear across locales. No article was approved, added,
  retired or redirected by this cleanup.
- Added one shared HTML link localizer for services, application instructions,
  careers and blog bodies, including Evaluation's separately rendered pricing
  headings. Locale changes preserve query strings and section fragments;
  downloads, legal pages, external references and the application portal retain
  their intended destinations. Fixed the misspelled San Francisco office URL
  to the existing Contact office section. Legacy production files are untouched.
- `scripts/check-content-links.py` passed on the owner's existing port 3021:
  782 source HTML links, 299 rendered page variants, 4,861 local links and 318
  unique page/file targets. Every local target returned directly, all fragments
  existed and page links retained their locale. Body text on all 299 pages was
  identical to the pre-edit crawl. Existing Blog checks passed for 79 imported
  bodies, including source prose hashes, markup, images and contents anchors.
- Typecheck, all 259 messages per locale and whitespace checks passed. Direct
  localizer checks covered query/fragment retention, repeat rendering, locale
  switching, and external/file/legal exclusions. No production build was run.
- Codex in-app browser: desktop Chinese Evaluation pricing links and the actual
  jump to Chinese Expert Opinion Letters passed. At 390 x 844, the cleaned
  Chinese Evaluation related-article list and the linked education article
  rendered correctly, with document width 390 and Chinese navigation preserved.
  The related article's existing new-tab action did not open a tab in the in-app
  browser; its inspected href was opened directly for the target-page check.
  Viewport override was reset. Screenshots: `output/playwright/content-links-desktop-2026-10-01.png`
  and `output/playwright/content-links-mobile-2026-10-01.png`.
- The ten article targets below remain held for content/disposition review.
  Their removed hyperlinks do not resolve the broader SEO launch gates:
  - `/Indian-degree-evaluation-in-USA.html`
  - `/best-education-credential-evaluation-agencies.html`
  - `/credential-evaluation-for-emloyment.html`
  - `/diploma-translation-and-evaluation.html`
  - `/education-credential-evaluation-purposes.html`
  - `/education-evaluation-h1b.html`
  - `/foreign-credential-evaluation-for-immigration.html`
  - `/how-to-avoid-delays-with-foreign-credential-evaluation.html`
  - `/how-to-get-an-international-evaluation.html`
  - `/international-transcript-evaluation.html`
- No server restart, commit, push or deployment was performed.

### SEO local implementation and final acceptance — September 30, 2026

- Completed the local SEO checklist implementation for the approved 133-page
  catalog: 80 BlogPosting entities, 130 BreadcrumbList entities and 133 localized
  static sharing cards. Article dates preserve the source catalog (46 dated,
  34 undated). Sixty-four articles use existing inline images; sixteen omit
  image rather than promote archived reports/reviews/certificates or logo artwork.
  No author or modification date was invented.
- Replaced clipped service descriptions with complete localized sentences.
  Open Graph and Twitter metadata use the same canonical page and image.
  Cards reuse the original logo, palette and actual page titles; system fonts
  are rasterized into PNGs and are not redistributed. Total PNG size is 7.1 MB.
- Reconciled all 208 old sitemap entries and related source/alias inventories
  into 448 unique paths. Added 27 redirects, bringing the application total to
  277. Chinese service/office aliases and known PDF relative-path aliases now
  resolve. Each mapping retains its query and required destination anchor.
- Added reusable `scripts/check-seo.py`, `scripts/inventory-legacy-seo.py`, and
  `scripts/generate-share-images.py`; expanded the structured-data checker for
  multi-script graphs, Article/Breadcrumb coverage and article-image visibility.
- Passed typecheck, all 259 translation messages per locale, whitespace checks,
  133 canonical/sitemap/hreflang/OG/Twitter/image checks, 277 redirect checks,
  eight untranslated fallbacks, two payment-result noindex checks, and genuine
  404 responses for 162 unmapped old paths. Passing 404 behavior does not approve
  retiring the held content. No production build was run.
- Schema.org hosted code validation reported zero errors and warnings for
  representative Boston Article/Breadcrumb, Expert Opinion Service/Offers, and
  Contact/six-office graphs. The full catalog also passed the official-vocabulary
  checker. These checks parse rendered markup, not a deployed production crawl.
- Google Rich Results Test code mode confirmed valid supported items:
  [Boston article](https://search.google.com/test/rich-results/result?id=BA_XXuvnjHlki1_QBLxF0g)
  and [Contact directory](https://search.google.com/test/rich-results/result?id=2P3h8Wk5hISMr42OuJl9jQ).
  No critical errors. The Boston source has optional missing author/image warnings;
  business entities also have non-critical recommendations. Missing verified facts
  were not fabricated to remove optional warnings. Results can expire.
- Codex in-app browser verified the English article desktop layout and Chinese
  Pricing desktop view. Its viewport override did not take effect (still 1280px),
  so the required mobile check used the prescribed Playwright CLI fallback.
  Both Chinese Pricing and the English Boston article passed at 390 × 844 with
  document width 390 and no horizontal overflow. Browser screenshots are in
  `output/playwright/seo-pricing-mobile.png`, `seo-article-mobile.png`, and
  `seo-google-results.jpg`. No UI copy/layout was changed by the schema additions.
- Local verification used a fresh isolated source copy on port 3035 to load the
  complete redirect table. The temporary server and Playwright session are now
  stopped. The owner's port-3021 server remains untouched and
  needs a restart to pick up redirect imports. Deployment, push and Search Console
  submission remain owner actions.
- Remaining launch gates: disposition of 71 content URLs (including 30 previously
  held article families and other standalone/Chinese sources), nine legacy PDFs,
  one Search Console verification file, hosted preview noindex and production
  domain/redirect/crawl checks. See `docs/seo-legacy-urls.md`; none is represented
  as completed by this local acceptance.

### Organization, office and service structured data — September 30, 2026

- Added safely serialized, server-rendered JSON-LD to 38 pages: homepage/About
  Organization graphs, six Contact-directory branches and four office-detail
  templates as LocalBusiness, and seven service types across 17 translated pages.
  Preserved legacy organization/office entity IDs on the confirmed production host.
  Untranslated Spanish service fallbacks omit duplicate schema.
- Postal fields now generate both the existing English address strings and office
  JSON-LD. Verified all six display addresses against the prior catalog. Phone,
  email and hours remain shared; no Beijing hours/postcode were invented. Social
  links come from the footer's existing public list; Boston Yelp belongs to its
  branch, and the Google search link is excluded from sameAs.
- Offers use the visible shared pricing records, including the estimated-price
  label, starting prices, ranges, units, turnaround and interpretation conditions.
  Quoted services have no numeric price. Expert Opinion Letters uses Service and
  valid Offer/UnitPriceSpecification records ($620/$700/$800), not the legacy
  Product/invalid USD type or hardcoded $100 price.
- Passed TypeScript, i18n, whitespace and the reusable
  `scripts/check-structured-data.py` checks on the owner's existing port 3021.
  Checked all 133 sitemap pages, 38 JSON-LD graphs, four untranslated fallbacks,
  logo availability, official Schema.org vocabulary domains/object ranges,
  graph references and visible contact/price facts. A direct serializer test also
  confirmed script-closing input is escaped while Unicode/JSON values round-trip.
- Closed the prior local redirect acceptance gap using an isolated temporary
  source copy on port 3035: all 28 new permanent redirects retained query strings
  and target anchors, and all 133 sitemap routes plus eight fallback and two
  payment-result routes passed metadata/indexing checks. The temporary webpack
  preview initially had a corrupt generated prerender manifest; clearing only its
  generated cache and warming routes sequentially resolved the problem.
- Codex in-app browser passed the contact directory on port 3021, old English
  homepage entry with a saved Chinese preference on 3035, and 390px Chinese
  Beijing-office/Spanish expert-price states. The three expert-price tiers matched
  JSON-LD. Mobile pages had no horizontal overflow; final browser logs had no
  errors/warnings. Temporary viewport overrides were reset.
- Temporary command: `WATCHPACK_POLLING=true pnpm exec next dev --webpack --port 3035`.
  That process is stopped. The owner's 3021 process was not restarted and still
  needs a restart for its imported redirect table; page/component changes were
  verified through its existing hot reload.
- Updated the SEO checklist. Article/Breadcrumb markup, sharing images and full
  remaining legacy URL reconciliation are still pending, as are hosted Rich
  Results Test/Search Console/deployment checks. No build, commit, push or deployment.

### SEO foundation — September 30, 2026

- Created `docs/seo-checklist.md` with staged acceptance criteria. The owner
  confirmed `https://www.americantranslationservice.com` as the production origin.
- Added shared URL/metadata helpers, canonical and Open Graph URLs across public
  pages, and HTML hreflang for actual translations. Removed generic middleware
  alternates that advertised untranslated/noindex pages or the preview host.
  English-only blog/career variants and Spanish service fallbacks canonicalize
  to English and use noindex; legal routing and payment-result noindex remain.
- Added robots.txt and a sitemap containing 133 canonical pages, including 80
  English articles. Omitted speculative modification dates. Vercel previews have
  noindex metadata; hosted preview behavior still requires deployment verification.
- Added 28 historical entry-point redirects, including the legacy HTML sitemap.
  English homepage aliases use `/en` to override a saved non-English preference
  before the existing locale middleware resolves to `/`. Full legacy URL/host
  migration remains open; this is not a complete redirect inventory.
- Passed TypeScript, i18n and whitespace checks. HTTP verification passed for all
  133 sitemap pages: successful direct responses, self-canonical URLs, matching
  metadata/sitemap alternates, Open Graph URLs, and no unintended noindex. Eight
  untranslated variants and two payment-result routes passed their indexing checks.
- Codex in-app browser inspected the English desktop homepage and 390px Chinese
  homepage/article states. Canonical and language metadata matched expectations;
  mobile pages had no horizontal overflow. The Chinese legacy homepage preserved
  its query string. Final new redirect acceptance awaits the owner's restart of
  port 3021: the running process still caches the earlier imported redirect table.
- Organization, office, service and article JSON-LD remain next in the checklist.
  No production build, commit, push, deployment or Search Console action performed.

### Complete institution directory — September 30, 2026

- Added `/institutions`, `/zh/institutions` and `/es/institutions` through one
  shared template. All 28 entries, four original categories/anchors, descriptions
  and complete timing notes are preserved; Chinese and Spanish prose is localized.
  Added search, category filters, result counts, a reset/empty state and native
  note disclosures. The homepage carousel now links to the active locale.
- Preserved 17 original image files byte-for-byte. Corrected the source's WCUI
  artwork pairing to Smith Chason College; WCU uses a text placeholder. Source
  descriptions, dates and relationship claims remain subject to publication
  review in `content/institutions/README.md`.
- Passed TypeScript, existing i18n checks, whitespace checks and an additional
  directory-content audit: English source equality for every entry/section;
  matching three-locale IDs, names and record counts; 28 server-rendered entries
  per route; complete notes; four anchors; unique IDs; all 17 logo responses and
  source checksums. The legacy PHP URL returns 308 and retains its query string;
  the browser confirmed the licensing/government fragment reaches the new page.
- Codex in-app browser passed English desktop search (including whitespace and
  multiword queries), empty/reset states, category filtering and note expansion;
  Chinese mobile keyword search and keyboard expansion; Spanish narrow-screen
  filters; homepage-to-directory navigation and Chinese-to-Spanish switching.
  Inspected 1440, 850, 760, 390 and 320px states without horizontal page overflow.
  Final page logs contained no errors or warnings. Screenshots:
  `output/playwright/institutions-desktop.jpg` and `institutions-mobile.jpg`.
- The owner's 3021 server initially returned 500. Early verification used a
  temporary copy on 3034 with polling/webpack. The owner server subsequently
  recovered, and final desktop/mobile, logo, link, locale and redirect checks
  ran against the actual project on 3021. The temporary 3034 server was stopped;
  the owner's server was not manually restarted. Viewport override was reset.
- No production build, commit, push or deployment. No-JavaScript HTML includes
  all entries and native disclosures; a separate JavaScript-disabled browser
  run was not completed because the supplemental Playwright CLI could not write
  its session cache within the sandbox. Native 200% zoom and a full accessibility
  audit were not performed.

### About AET migration — September 30, 2026

- Added `/about`, `/zh/about`, and `/es/about` through one shared localized page.
  Retained 11 dated history entries, 10 in-scope highlights, 11 archival photos,
  the original client collection and testimonial/career destinations. Added
  source notes in `content/about/README.md`; no new business claims were invented.
- Reused the shared header/footer and service-page shell, with a desktop timeline
  and card grids, native mobile rails, original photo links and legacy section IDs.
  Footer About links stay localized. Five legacy About URLs redirect permanently.
- Passed TypeScript, i18n and whitespace checks. HTTP checks passed for all three
  languages, one H1 per page, unique IDs, anchor targets, footer/career links and
  all 12 image files. Five 308 redirects preserved query parameters.
- Codex in-app browser checked 1440px desktop, 850/760px tablet, 390px Chinese and
  320px Spanish layouts without page overflow. Checked photo/section navigation,
  mobile highlight/photo controls, keyboard access to the last photo (11/11),
  Spanish-to-English switching and footer About navigation. Screenshots are
  `output/playwright/about-*.jpg`. Native 200% zoom and a full accessibility audit
  were not performed.
- The initial port-3021 preview encountered watcher errors and stopped; a
  separate server also became unavailable during checks. Remaining verification
  used an isolated temporary copy on port 3033 with
  `WATCHPACK_POLLING=true pnpm exec next dev --webpack --port 3033`.
  That temporary server was stopped after verification. Other concurrent edits
  were preserved. No production build, commit, push or deployment was performed.

Updated September 25, 2026 after the homepage design pass. This records local
implementation and checks, not production deployment or accessibility certification.

### Shared office pages and contact catalog — September 30, 2026

- Added local Miami, Boston, Los Angeles and Beijing detail pages in English,
  Chinese and Spanish. Footer and Contact detail links use these routes;
  legacy office PHP/HTML URLs redirect to them. Invalid slugs return 404.
- Extracted `OfficeCard` for Contact and office details. Public phone/email/address,
  messaging channels and structured business hours live in `lib/contact.ts`.
  Maps derive from that address; Beijing's phone link uses +86. Payment recipient
  mailing addresses reference the catalog, while payment account identities stay
  separate. Imported service/article contact literals use immutable source aliases
  resolved against the catalog; historical image files remain unchanged.
- Passed TypeScript, all three locale message checks, 12 office route checks,
  12 PHP redirects and unknown-office 404. An in-memory catalog mutation verified
  propagation to article text, phone/email links, hours, map queries and payment
  addresses without changing actual business data.
- In-app browser inspected all four English desktop pages (1440px), representative
  Chinese/Spanish office pages at 390px, footer navigation, locale switching,
  Contact detail links and contact cards, the Los Angeles article contact section,
  and Payment recipient addresses. Mobile pages had no document overflow.
  Screenshots: `output/playwright/office-*-desktop.jpg`, `office-*-mobile.jpg`,
  and `office-blog-contact-regression.jpg`.
- The original 3021 server returned empty responses after file-watcher errors.
  Verification used a temporary source copy with polling/webpack on 3022, then
  stopped that temporary server. The owner's 3021 server later recovered; its
  actual Chinese Miami page was also opened in-app successfully. A rapid
  pre-hydration language-menu interaction emitted a shared-navigation hydration
  warning; subsequent page navigation and office content rendered correctly.
  No build, commit, push, deployment, message or payment submission was performed.

### Career page — September 30, 2026

- Added `/career`, `/zh/career` and `/es/career` using the shared site shell and
  the complete English legacy Career source. All 10 full-time and 6 part-time
  roles, benefits, application instructions and closing copy remain unchanged.
- Source and rendered-body comparisons passed on all three routes: 27,358
  normalized characters, including all collapsed descriptions. Original address
  capitalization is preserved independently of shared dynamic contact formatting.
- Footer Career links now stay local. `/e-careers.php?from=legacy` returns 308 to
  `/career?from=legacy`. The original Google Forms URL remains unchanged.
- In-app browser passed desktop and 390px job expand/collapse, keyboard access to
  the application link, section jumps and mobile benefit-card navigation. At
  320px and 390px there was no page-level horizontal overflow. Final desktop
  and mobile screenshots are `output/playwright/career-desktop.jpg` and
  `output/playwright/career-mobile.jpg`; the viewport override was reset.
- The existing preview stopped during configuration reload, with file-watcher
  errors recorded. Verification used a temporary polling/webpack server on 3021;
  that temporary server was stopped after verification.
- TypeScript and i18n checks passed after refreshing generated Next route types.
  No production build, commit, push or deployment. Current vacancies and external
  application submission were not verified.

### Newest-first blog ordering — September 30, 2026

- Replaced pilot/topic pinning within article lists with descending original
  publication dates. The credential-evaluation default and featured guide remain.
- Generated lightweight date metadata for all 80 articles: 46 source dates and
  34 null dates. Undated articles follow dated articles; ties retain inventory order.
  Dates come only from leading source dates/bylines, including legacy spacing.
- Passed source reproducibility and TypeScript checks. In-app browser verified
  `/zh/blog` default evaluation order, all-topic order, expert filtering and search;
  mobile 390px evaluation list has the same order and no horizontal overflow.
  Saved desktop/mobile `blog-newest-first-*.jpg` in `output/playwright/`.
  Viewport reset; no build, commit, push or deployment.

### Two restored standalone English articles — September 30, 2026

- Completed the two remaining restored English standalone sources after the 18-blog
  batch: `best-credential-evaluation-services` and `e-credential-evaluation-for-uscis`.
  Both appear in the blog, with English bodies across locales and root-URL redirects.
- Final catalog: **80 local articles** (78 of the original 109 blogs + 2 standalone).
  Topics: 28 evaluation, 42 translation, 7 interpretation, 3 expert opinion.
  Source body headings are retained: the USA list is now titled 10 Best Credential
  Evaluation Services (2026) in the supplied local source, not the older 15-item title.
- Added explicit standalone source handling and reviewed source hashes. Preserved
  16 additional image placements and 11 tables. Numeric source anchors are retained;
  one duplicate q2 anchor becomes q2-2. Removed the old duplicated footer/map iframe
  from the H1B page, retaining article prose and written contact information.
- Final generated collection: 79 bodies plus the separate pilot; 191 image placements,
  93 unique image files and 32 tables. The two missing A2Z placements remain recorded.
- Final verification passed: 240 locale routes, 95 image URLs, invalid-slug 404s,
  reproducible source/prose checks, TypeScript and i18n. All 157 redirects passed
  308/query checks on temporary port 3022; that server is stopped. Port 3021 still
  requires a restart for new redirect configuration (article routes already work).
- In-app browser verified USA article at desktop width, H1B guide at 390px (one
  footer, no duplicate IDs, no page overflow), default evaluation (28), all topics
  (80), and USA-title search (one result). Saved `blog-restored-usa-desktop.jpg` and
  `blog-restored-uscis-mobile.jpg` under `output/playwright/`. Viewport reset.
- No build, commit, push or deployment. Thirty other blog findings and one visa
  topic remain unresolved; publication acceptance is separate from local migration.

### Restored 18 blog articles — September 30, 2026

- Migrated all 18 restored candidates (16 evaluation + 2 expert opinion), bringing
  the local total to 78: 26 evaluation, 42 translation, 7 interpretation, 3 expert.
  The 30 other findings, one visa topic and two standalone English candidates
  remain separate. No Chinese article-body variants were added.
- Retained all source prose, author/date text, biography mentions and NACES links.
  `biography-review.json` records reviewed source hashes; the importer permits
  those specific biography matches and stops on changed/unreviewed sources.
- The new batch retains 75 image placements and 18 substantive tables. Across
  77 imported bodies plus the separate pilot, generated bodies contain 175 image
  placements from 83 unique files and 21 substantive tables. New asset descriptions
  were checked visually against source contact sheets; dated captures use disclosures.
- Missing source `/images/A2Z.png` affects California and San Francisco agency lists.
  Local source is absent; the old-site URL returns homepage HTML, not an image.
  Omitted only those two broken placements, retained all organization prose/links,
  and recorded the issue in `migration-report.json` and the checklist.
- Repaired eight `#q1.html` links to existing `#q1` targets. Fixed legacy relative
  service/contact/application-PDF URLs and the malformed `link to https://` citation.
  Verified all ten local destinations linked by the new batch, including fragments.
  Decorative dash separators are omitted; article prose remains unchanged.
- Verification passed: importer reproducibility/prose checks, 234 locale/article
  routes (H1, English body parity, noindex, IDs/anchors), 85 image paths, invalid
  slugs, TypeScript, i18n and whitespace. Full route/image checks use port 3021.
- All 155 legacy redirects (36 new) passed 308/query-preservation checks using a
  temporary port-3022 server because the existing preview retained startup config.
  Started `pnpm exec next dev --webpack --port 3022` in an isolated temporary
  checkout after symlink/Turbopack and sandbox watcher failures; it is now stopped.
  Port 3021 was not restarted and still needs to reload the new redirect config.
- In-app browser passed Georgia desktop/390px, China guide at 320px, mobile expert
  contents expansion, table keyboard scrolling without page overflow, Georgia
  search (one result), all topics (78), expert (3) and default evaluation (26).
  Screenshots: `output/playwright/blog-restored-georgia-desktop.jpg` and
  `blog-restored-georgia-mobile.jpg`. Viewport override reset; Georgia preview retained.
- No production build, commit, push or deployment. AICE-reference publication
  review and dated-claim review remain tracked separately.

### Blog biography exclusion reassessment — September 30, 2026

- Owner correction: past employment at a NACES agency does not exclude an article.
  Rechecked all 48 previously excluded article families (entry/include/root/shared
  sources) and seven standalone sources. Restored 18 blog candidates, leaving 30
  with other historical findings for a separate decision and one visa topic held.
- Inventory at reassessment (before the subsequent migration above):
  60 migrated locally + 18 awaiting migration + 30 pending review
  + 1 visa held = 109. Two English standalone candidates are also restored; three
  Chinese variants have biography exclusions lifted but are source/URL references,
  and two standalone sources retain other findings. Standalone counts are separate.
- Corrected Georgia's unsupported AES-comment attribution; its section describes FCE.
  Five restored blog families currently have biography hits only in the older root copy.
- Updated screening evidence, inventory and main checklist. AICE references in the
  restored California/Los Angeles/Georgia lists and standalone USA list are tracked
  separately against application page 13 if the application is under review.
- Documentation/source review only: no article import, frontend change, membership
  status verification, browser check, commit or deployment. The importer/catalog
  at that point implemented the original 60-article scope; the migration above expands it.

### Payment source-copy restoration — September 30, 2026

- Restored the legacy card restrictions and introduction, Miami/Boston public
  deposit details, Boston check instructions, six Zelle steps, all four office
  selections and the participating-bank link. Public masked account values,
  routing/SWIFT details and addresses are copied exactly from the source.
- Restored all nine processing/security rows, the $500 note, all six shipping
  methods with source headings and the domestic/international lost-package
  policies. Preserved both original $250/$500 statements and the original Zelle
  initial Chase display versus Bank of America after office selection.
- English copy follows `e-pay-content.html`, checked against the live old page.
  Chinese and Spanish include the same full content. The existing disabled
  legacy captcha remains omitted; no backend/payment-handoff changes were made.
- In-app browser verified English desktop, all four Zelle office selections,
  Chinese mobile at 390px, Spanish mobile at 320px and shipping expansion.
  Neither mobile width had page overflow. Screenshots are under
  `output/playwright/payment-content-restored-*.jpg`.
- Normalized source-to-rendered comparison covers 147 of 148 legacy text
  segments; only the intentionally omitted Verify Code control label differs.
  All three locales have six Zelle steps, nine processing rows, six shipping
  methods and both amount statements. Typecheck, i18n and whitespace checks
  passed. Reused the existing server; no build, payment submission or deployment.

### Remaining 59 blog articles — September 30, 2026

- Completed local migration of the other 59 retained English articles: 9
  evaluation, 42 translation, 7 interpretation and 1 expert opinion. Together
  with the original Boston pilot, all 60 bodies now open locally; 0 remain to
  import in the original scope. The later biography reassessment above restores
  18 of the original 48 exclusions; the other 30 require review and visa stays held.
- Added a shared article renderer, semantic contents navigation, responsive
  tables, preserved dates and images, localized internal links, and body-heading
  display titles. The legacy H1B title mismatch is resolved in favor of its body
  heading (2026); source metadata remains recorded. No author/date was invented.
- Preserved normalized prose for every imported body, plus 100 image placements
  from 57 source files and three substantive tables. Assets were copied
  byte-for-byte and visually classified; historical figures use disclosures.
  Fixed legacy image-only paragraph handling and nested image-link/disclosure
  markup after comparing image counts and inspecting the rendered articles.
- Removed duplicate legacy contents/share controls and inline behavior/styling.
  Thirteen links to excluded articles become plain text, without importing any
  excluded content. The offline importer rechecks all retained PHP/includes/root
  copies against the documented exclusion aliases and records source hashes.
- All 60 index links now use local article routes. Added 119 PHP/root-HTML permanent
  redirects. HTTP verification passed for 180 article/locale routes (body parity,
  H1, noindex and fragments), 59 image paths, 119 redirects with query preservation,
  and unknown/excluded/held article 404s. Source integrity, safe HTML, image/table
  counts and contents targets passed. Typecheck and i18n checks passed.
- In-app browser verified evaluation, translation, interpretation and expert
  articles on desktop and 390px mobile: default 10 evaluation entries, all 60
  local links, search, mobile contents, image disclosure and table scrolling.
  Wide comparison tables were adjusted after mobile inspection to prevent
  words being squeezed into narrow columns; the page itself does not overflow.
  Screenshots include `output/playwright/blog-migration-evaluation-desktop.jpg`,
  `blog-migration-table-mobile.jpg` and `blog-migration-interpretation-mobile.jpg`.
- Updated the main checklist and all 60 inventory entries to distinguish local
  migration completion from publication acceptance. Source-claim accuracy review
  and production cutover remain open; no publishing or deployment was performed.
- The previous port-3021 server was stopped. Started `pnpm dev` for verification;
  sandbox file-watcher errors required restarting that process outside the sandbox.
  The replacement preview server remains running at `http://localhost:3021`.

### Privacy and Terms — September 30, 2026

- Added `/privacy` and `/terms` with a shared restrained reading layout,
  desktop section index and native mobile directory disclosure. Per the owner's
  follow-up, only English documents remain; Spanish copies and the Chinese
  fallback notice were removed. All 12 Privacy and 13 Terms sections retain
  the original text, anchors, lists and emphasis. No effective date was invented.
- All footer and Payment legal links point to the English routes. Former
  Chinese/Spanish routes and old English PHP/HTML and Spanish/Chinese PHP
  aliases redirect there. Legal pages ignore language detection without changing
  the saved site-language cookie or advertising alternate-language documents.
- HTTP checks covered both documents through unprefixed, English, Chinese and
  Spanish paths under all three language preferences: all resolve to English,
  preserve full text and query parameters, and leave the locale cookie unchanged.
  Localized Contact/Payment pages and their legal links passed regression checks.
- In-app browser checked desktop Privacy, mobile Terms at 390px without overflow,
  and redirects from Chinese Privacy and Spanish Terms to the English pages.
  Initial connection timeouts were resolved using a fresh tab. Typecheck, i18n
  and whitespace checks passed. Evidence: `output/playwright/legal-english-only.png`.
- Reused the existing development server and its automatic configuration reload.
  No manual server restart, production build, commit, push or deployment here.
  Owner review of actual payment, analytics, retention and security practices
  remains before launch; see `content/legal/README.md`.

### Payment landing-flow parity — September 30, 2026

- Restored the legacy empty `item_name` in the PayPal handoff. The previous
  service-name prefill bypassed the Purchase details step. Required-field
  validation, office selection, USD amount, and localized return URLs remain.
- Used the existing port-3021 server and synthetic $1 preview information to
  obtain the updated API's handoff HTML. Opened that HTML through a temporary
  local preview in the Codex in-app browser; PayPal reached
  `/webapps/shoppingcart#/checkout/openButton` with Description, $1.00, quantity
  1, and Continue. Verified desktop and 390px mobile views. No Continue click,
  login, card entry, or payment completion; downstream guest checkout unverified.
- Local checks passed for all 12 office/locale combinations, Other Services,
  six invalid submissions, TypeScript, and i18n. Removed the temporary preview.
  Screenshots: `output/playwright/payment-open-button-desktop.jpg` and
  `output/playwright/payment-open-button-mobile.jpg`. No build or deployment.

### Blog priority and first article pilot — September 30, 2026

- Made credential evaluation the Blog headline, introduction, featured guide and
  default list (10 articles). Other topics live in a secondary selector; all 60
  entries remain accessible, with evaluation sorted first. Reset returns to
  evaluation. This supersedes the initial all-topics default below.
- Added `/blog/boston-foreign-credential-evaluation-services` and corresponding
  localized routes. The featured and list cards link to this local article;
  the other 59 bodies remain on legacy URLs. English prose was preserved in full
  and verified against the source, with semantic sections and report-type lists.
- Added desktop contents, native mobile contents, the two original images,
  evaluation-service and Boston-contact actions. Corrected image descriptions:
  the sources show a historical evaluation report and archived reviews, not
  office photos. Historical details are labeled; reviews are collapsed by default.
  No publication date or author was invented. Article bodies are English-only by
  owner decision, without language-availability notices; Chinese/Spanish article
  routes remain noindexed because they duplicate the English body.
- Both legacy article paths return 308 to the new route with query preservation.
  All six index/article locale routes and both images return 200; section IDs
  are unique. Full source prose and image-byte comparisons passed. Rechecked
  the pilot entry/include/root copy against exclusion terms; none matched.
- The in-app browser's old error tab was blocked as a data URL; it was not used.
  The valid HTTP preview tab subsequently timed out on selection/screenshot.
  Used the prescribed Playwright CLI fallback: desktop index/article at 1440px,
  mobile screenshots at 390px, and all six routes at 320px without page overflow.
  Topic selection (42 translation / 60 all), empty search, reset to 10 evaluation,
  local article navigation, mobile contents links and archived-image expansion
  passed. Both article images loaded successfully.
- Typecheck, i18n and whitespace checks passed. Screenshots:
  `output/playwright/blog-evaluation-desktop.png`, `blog-evaluation-mobile.png`,
  `blog-article-desktop.png` and `blog-article-mobile.png`.
- Reused the existing server; redirect configuration reloaded automatically.
  No build, production mutation or deployment. Owner feedback, content-claim
  review remain open before extending this pilot or publishing.
  The inventory's article completion checkbox intentionally remains unchecked.

### Blog English-only content — September 30, 2026

- Removed article translation-availability banners and the index language notice
  from all locale variants. Blog bodies are English-only by owner decision; shared
  navigation and index controls remain localized. Updated the migration checklist
  and source/design notes so blog translations are no longer a pending task.
- Verified the Chinese blog index and pilot article visually in the in-app browser:
  both notices are absent, the article starts directly with its English prose,
  and the index still defaults to 10 credential-evaluation articles.
  Typecheck, i18n and whitespace checks passed. Screenshot:
  `output/playwright/blog-english-only.jpg`.

### Blog index — September 30, 2026

- Built `/blog`, `/zh/blog`, and `/es/blog` with the shared header/footer,
  localized interface, 60 English article titles, topic filters, title/city search,
  result counts and an empty-state reset. All entries render on the server and
  remain readable without JavaScript. Excluded and held articles are absent.
- Header/footer Blog links now use the active locale. `/blog/` and
  `/blog/index.php` return 308 redirects; the PHP alias preserves query parameters.
- Verified all 60 legacy destinations with GET: 58 root HTML articles and two
  PHP articles return 200 without falling back to the homepage. The other 58
  PHP paths fall back to `/home.php`, so explicit working paths are stored in
  the catalog. Article bodies remain on the old site and are not marked migrated.
- In-app browser checks passed for English desktop (1440px), English mobile
  (390px), and Chinese/Spanish narrow mobile (320px), with no page overflow.
  Combined evaluation/Boston filtering returns two articles; unmatched search
  returns zero and Clear filters restores 60; Chinese expert filtering returns
  one. Header/footer Chinese Blog links resolve to `/zh/blog`.
- Typecheck, existing locale validation and whitespace checks passed. Catalog
  validation confirms exactly the inventory's 60 unique candidate slugs and
  corresponding local source files. Screenshot: `output/playwright/blog-desktop.jpg`.
  Reused the running server. No build, deployment or production mutation.
- Before launch: complete article accuracy review and content migration
  or provide a separate legacy host before switching the production domain.

### Payment page draft — September 29, 2026

- Built English, Chinese and Spanish `/payment` pages with the shared service
  shell, the source form fields and four existing payment-office choices.
  The form ports the old PHP processor to a local PayPal HTML-form handoff,
  with server-side office routing and validation; no REST API credential or new
  merchant choice was added. Local ignored merchant configuration was copied
  from the legacy source.
- Optional mailing address is collapsible. Terms and privacy links remain
  available. Secondary methods direct users to confirm current instructions
  with their office rather than republishing unverified bank information.
  Shipping tables reuse the shared Pricing records.
- The header and footer link to the localized route, and `/e-pay.php` redirects
  to `/payment`. A real or sandbox payment was not submitted. Before launch,
  verify office recipients, payment return/cancel behavior, and reconciliation. The legacy
  IPN success handler did not record transactions; a browser return is not
  proof of payment. Deployment needs the payment environment values.
- Local handoff checks generated PayPal forms for all four offices with the
  expected amount, USD currency and localized return URL; malformed office,
  amount and terms submissions returned 400. No PayPal form was submitted.
  The Chinese payment form and cancel-return page rendered in the in-app
  browser. Typecheck, i18n and whitespace checks passed; no build or deploy.
- Navigation follow-up: header Payment, footer popular Payment, and the
  homepage online-payment text now resolve to the active locale. The in-app
  browser checked Chinese and Spanish links and the homepage payment link;
  `/e-pay.php?ref=demo` returned 308 to `/payment?ref=demo` locally.
  Typecheck and i18n checks passed. No payment was submitted.

### Contact — September 29, 2026

- Built localized English, Chinese and Spanish Contact pages with the legacy
  email/visit instructions, six offices, phone/email actions, directions links,
  secondary contact channels and Other Contact details. Los Angeles uses the
  owner-selected `17802 Sky Park Cir` address in every locale.
- Reused the service-page shell and mobile card rail. Remapped sitewide Contact
  links and reviewed service-copy links to the localized page; legacy Contact
  PHP URLs return 308. The footer's Los Angeles link points to the new card so
  it does not lead to the conflicting address on the old office-detail page.
- Moved the six office jump links into the left page index on desktop. At
  1000px and below, the compact page index stays above the content and the
  office jump links remain in a horizontal row above the office cards.
- Local browser verified six office anchors, the LA address and contact actions,
  mobile horizontal card navigation, `#sf` positioning and no 390px page
  overflow. Typecheck, i18n and whitespace checks passed. No build or deploy.
- Office contact information, hours and service availability still need owner
  review before launch. The four footer office-detail pages were subsequently migrated; see the September 30 office entry.

### Remaining five service pages — September 29, 2026

- Added Technical Translation, Interpretation, Expert Opinion Letters, General
  Translation, and Notarization with the shared service shell. English and Chinese
  follow their legacy content files; Expert also uses its Spanish source. The
  other Spanish routes visibly label their English fallback and are noindexed.
- Connected navigation, homepage cards, footer and 11 existing legacy PHP paths
  to localized routes. Current shared rates replace conflicting Interpretation,
  Expert and General Translation source prices; Expert shipping also reuses the
  shared catalog. Source-specific applications and the Expert PDF remain intact.
- Expert partners use the homepage institution carousel. Its legacy Why Choose
  infographic is omitted because of unverified absolute acceptance/review claims.
  The excluded China authentication referral is removed from Notarization.
- In-app browser: all five Chinese pages and Expert Spanish render at 320px
  without page overflow, duplicate IDs or failed images. Spanish fallback notice
  renders. Selected English legacy redirects return 308. Typecheck, locale checks
  and whitespace checks passed. Reused the running server; no build or deployment.
- Remaining before launch: source-claim/business review (especially coverage,
  client logos, notary fees and legal/process copy), Spanish translations for four
  pages if required, and broader contact/related-page migration.

### Service template and Certified Translation — September 29, 2026

- Added `docs/service-page-template.md` and linked it from repository guidance.
  Extracted `ServicePage`, reviewed-copy rendering and interior CSS into
  `components/service/`; Evaluation and Certified Translation now share the shell.
- Added Certified Translation in English, Chinese and Spanish. Retained source
  definitions, formats, uses, ATA information, coverage, languages, four FAQs and
  office/email/payment application steps. Benefits and application use mobile
  horizontal rails. Sample downloads are inside the first native FAQ disclosure.
- Reused eight certified-translation and six shipping records. Rendered rate rows
  match Pricing in all locales. Table qualifications remain outside the tables.
  The source's commented online link is not exposed as a translation workflow.
- Homepage, navigation and footer link to localized routes. All three legacy PHP
  URLs return 308 and retain query parameters. Internal anchors are valid/unique.
- Source-text comparison passed for all three locales' explanations, benefits,
  application and FAQ. Five original image/PDF assets match bytes and return 200.
- In-app browser: desktop title/sections/application; mobile rail navigation through
  step 3 and disabled end control; shipping and sample FAQ expansion; Chinese and
  Spanish 320px layouts; language switch retains route and #faq. Evaluation desktop
  shell and mobile step navigation passed regression checks. Checked states have
  no page overflow. Typecheck, locale validation and whitespace checks passed.
- Evidence: `output/playwright/certified-translation-desktop.png`,
  `certified-translation-mobile-application.png`, and
  `certified-translation-mobile-faq.png`. Reused the running server; no manual
  restart, production build, deployment, payment or application submission.

### Mobile horizontal card correction — September 29, 2026

- Homepage and Evaluation online steps now use `CardRail`, including native
  horizontal scrolling, snap points, a next-card cue, and previous/next controls
  with a position counter at 760px and below. Evaluation report types and benefit
  cards use the same rail; a single localized guarantee remains full width.
- Reduced mobile process heading scale and introduction spacing. Desktop homepage
  animation and Evaluation's two-column step grid remain intact. Updated the
  design guide to explicitly supersede the old vertical-process exception.
- In-app browser checked both pages at 390px, step navigation through card 4 and
  disabled end control, Evaluation type/benefit next controls, 320px Chinese and
  Spanish layouts, Email tab switching, and 1440px desktop layout. Checked phone
  states have no page overflow. Typecheck, i18n, and whitespace checks passed.
- Evidence: `output/playwright/evaluation-mobile-step-rail.png`,
  `home-mobile-step-rail.png`, and `evaluation-mobile-benefit-rail.png`.
  Reused the existing server; no build or deployment.

### Shared institution carousel — September 29, 2026

- Evaluation now uses the homepage's `InstitutionCarousel` and the same 16-logo
  selection in `lib/institutions.ts`, as requested. The outdated FCE client montage
  is no longer rendered. No legacy-only logos were added.
- Added an embedded layout with the localized Credential Evaluation Partners
  heading and contact link. Homepage heading, copy, institution link, and animation
  remain unchanged. Both pages share motion, focus-pause, and responsive rules.
- In-app browser verified Evaluation at 1440px and 390px, keyboard row scrolling,
  no mobile overflow or failed loaded images, and homepage rendering with 16 logos.
  Typecheck, locale checks, and whitespace checks passed. Screenshots:
  `output/playwright/evaluation-partners-desktop.png` and
  `output/playwright/evaluation-partners-mobile.png`.
  Reused the existing server; no build, deployment, or restart.

### Shared Why Choose AET cards — September 29, 2026

- Extracted `BenefitCard` with shared surface styles and story/compact variants.
  Homepage facts retain their figures, copy, animation, controls, and mobile rail.
  English Evaluation shows four compact cards. Chinese and Spanish retain three
  comparison rows and render the standalone AET guarantee as a shared card.
  Source content and shared price/timing interpolation are unchanged.
- In-app browser: Evaluation checked at 1440px and 390px, including all three
  languages and keyboard scrolling of the comparison table. Homepage desktop
  selection reached the ATA card; mobile next-card control moved to language
  coverage. No page overflow in the checked mobile states.
- Typecheck, 257-key locale validation, and whitespace checks passed. Evidence:
  `output/playwright/evaluation-benefits-desktop.png` and
  `output/playwright/evaluation-benefits-mobile.png`.
  Reused port 3021; no build, deployment, or server restart.

### Shared Online / Email application methods — September 29, 2026

- Added Online / Email tabs to the shared homepage and Evaluation `ProcessStory`.
  Online is selected by default and retains the four-step flow. Email preserves
  each locale's legacy three-step list, PDF application form, and five office links
  in `content/application-methods.json`. Acceptance reminders live in the module;
  document requirements and pre-evaluation notes remain on Evaluation.
- Added keyboard tab selection and responsive layouts. Both methods remain
  readable before hydration or with JavaScript disabled.
- In-app browser checks passed on Evaluation and the homepage: method switching,
  keyboard arrows/Home/End support, desktop and mobile layouts, and all three
  locales at narrow widths. Source text comparison, SSR content, PDF download,
  typecheck, i18n validation (257 keys per locale), and whitespace checks passed.
- Reused the existing port-3021 server. Screenshots are under `output/playwright/`:
  `evaluation-methods-email-desktop.png` and `evaluation-methods-email-mobile.png`.
  No production build, deployment, or submission.

### Shared four-step Evaluation process — September 29, 2026

- Replaced the legacy three-step application list with the homepage's existing
  `ProcessStory` component. Both pages now share the same four steps, localized
  messages, real application screenshots, and Start Application links.
- Added an embedded layout for the service-page column: two cards per row on
  desktop and a vertical flow on phones, with no pinned animation. The homepage
  keeps its original layout, heading ID, and desktop scroll behavior.
- Retained the legacy acceptance reminder, document requirements, and
  pre-evaluation explanation beneath the shared process. Removed obsolete
  three-step content from all three locale files. Pricing remains unchanged.
- Verified rendered process headings, descriptions, and all four cards match
  the homepage for English, Chinese, and Spanish. In-app browser desktop/mobile
  checks passed, including the section anchor and narrow localized layouts.
  Typecheck, i18n validation, and whitespace checks passed.
- Used the already-running port-3021 server; did not start, restart, or stop it.
  Screenshots: `output/playwright/evaluation-four-steps-desktop.png` and
  `evaluation-four-steps-mobile.png`. No build, deployment, or submission.

### Evaluation page — September 29, 2026

- Added `/evaluation`, `/zh/evaluation`, and `/es/evaluation` with the existing
  header/footer, responsive section navigation, service cards, source application
  steps, downloads, and a native shipping disclosure.
- Preserved each locale's legacy prose. Normalized-whitespace comparisons of
  introduction, steps, report types, related articles, and sample sections pass
  against all three originals at initial import. The three-step instructions
  were subsequently replaced by the shared four-step module described above.
  Localized source differences are documented in `content/evaluation/README.md`;
  historical claims and external workflows were not newly verified.
- Reused `PricingTable` and existing evaluation/shipping records. All 15 shared
  evaluation tiers match the rendered Pricing page in all locales. Added the
  legacy pre-evaluation and extra-copy ranges to the shared catalog; Evaluation
  renders 16 fee rows and 6 shipping rows. Pricing's existing rows are unchanged.
  Standard price, processing days, and cutoff also reference shared records.
- Homepage/header/footer Evaluation links now use locale routes. Three legacy
  PHP URLs return 308 to the corresponding language paths and preserve queries.
  Internal anchor targets are valid and unique. All three PDFs and the client
  image return HTTP 200 with bytes matching the originals.
- In-app browser: checked desktop/mobile introductions, price navigation,
  responsive tables, shipping expansion, and Chinese-to-Spanish switching that
  retains the Evaluation path/hash. All locales have no page-width overflow at
  320, 390, 760, 850, and 1440px. Type and i18n checks passed (253 keys).
- Screenshots under `output/playwright/`: `evaluation-en-desktop-pricing.png`,
  `evaluation-en-mobile.png`, `evaluation-en-mobile-shipping.png`,
  `evaluation-es-mobile.png`, and `evaluation-es-mobile-pricing.png`.
- Used a temporary `pnpm dev` server at `http://localhost:3021`; sandbox watcher
  restrictions required an approved run outside the sandbox. No production build,
  push, deployment, or application/payment/contact submission. The temporary
  server was stopped after verification. Pricing's desktop evaluation section
  was also visually rechecked; no browser console warnings/errors were captured.

### Pricing follow-up — September 29, 2026

- Restored technical proofreading ($75–100/page), non-technical proofreading
  ($35–75/page), and English writing ($0.50–1.20/word) under Other Services.
  Rates and the 10-page discount threshold use shared catalog constants;
  all three locales include the discount and client-supplied outline notes.
- Removed the sidebar top rule, increased its heading from 13px to 16px,
  and removed the document-language notice and Chinese-price-list link as requested.
- Local in-app browser: verified English desktop (1440px), Chinese mobile
  Other Services (390px), and Spanish mobile navigation/content. Checked mobile
  document widths without horizontal overflow. Typecheck, i18n validation
  (251 keys per locale), and diff whitespace checks passed.
- Used a temporary `pnpm dev` server at http://localhost:3021 for verification.
  The temporary server was stopped after verification. No production build
  or deployment was performed.

### Shared Pricing page — September 29, 2026

- Added `/pricing`, `/zh/pricing`, and `/es/pricing` with shared navigation,
  footer, service-section index, quote links, and responsive semantic tables.
  `/e-fee.php` redirects to `/pricing`; retained legacy section anchors work.
- Centralized USD price types, units, turnaround, shipping/tracking and minimum
  durations in `lib/pricing.ts`. Shared formatting and reusable `PricingTable`
  and `PricingSection` components serve the new page. The two expert-opinion
  displays share one rate array. Homepage pricing, standard processing and its
  FAQ now interpolate the same Document-by-Document constants.
- Used the owner's updated legacy fee page: certified translation starts at
  $70/$80, Document-by-Document rush is $150/3 business days, and expert letters
  are $620/21, $700/14, $800/8 business days. Preserved non-Chinese-document
  pricing scope, final-quote qualification, office variation, cutoff, hourly
  minimums, transportation supplements and shipping conditions.
- China Visa is excluded. The owner subsequently confirmed proofreading and
  English writing belong in Pricing; these are restored in the follow-up above.
  No application-form-only rates were added.
- Compared all 38 displayed rows against the updated legacy HTML, including
  amounts, applicable turnaround, price types and shipping tracking. Confirmed
  the shared expert records and homepage standard values reference the catalog.
- Codex in-app browser: inspected English and Chinese desktop layouts at 1280px,
  Spanish desktop interpretation, English/Chinese mobile at 390px, and Spanish
  shipping at 320px. No page overflow was found in the checked states. Verified
  section navigation, Spanish-to-English page switching, the mobile Pricing
  menu entry, and the homepage desktop pricing and expanded mobile timing FAQ.
- `pnpm typecheck`, `pnpm check:i18n` (248 keys per locale), and `git diff --check`
  passed. Legacy redirect returns 308 and preserves query parameters.
- A temporary `pnpm dev` server on port 3021 was necessary because no server was
  running. Sandbox file-watch restrictions required an approved run outside the
  sandbox. The temporary server was stopped after verification. No production
  build, commit, push or deployment was performed.
- Evidence: `output/playwright/pricing-en-desktop.png`,
  `pricing-zh-mobile.png`, and `pricing-es-mobile-shipping.png`.

### Homepage internationalization — September 28, 2026

- Added `next-intl` and a shared `app/[locale]` layout/page for English `/`,
  Simplified Chinese `/zh`, and Spanish `/es`. Added request configuration,
  locale navigation helpers, and locale routing through `proxy.ts`.
- Localized 171 messages per language, covering the full homepage, navigation,
  footer, accessible controls, image descriptions, and metadata. Preserved the
  original English reviews and labeled Chinese/Spanish reviews as translations.
  Existing legacy destinations, institution names, and application screenshots remain.
- Added a top-right globe/current-language selector on desktop and phones, plus
  synchronized choices inside the mobile menu. Switching preserves the current
  pathname, query, and fragment; Home/logo links retain the active locale.
- Added a one-year language preference cookie, browser-language matching, English
  fallback for missing messages, and a translation validation command. Canonical
  URLs remain pending the production-domain/migration decision.
- Codex in-app browser: visually checked Chinese/Spanish desktop and phone states,
  the English homepage, the Spanish mobile menu and expanded FAQ. Checked all
  three languages at 320/390/760/850/1201/1280/1440px: no page or header horizontal
  overflow. Verified Chinese to Spanish, Spanish to Chinese, and English selection,
  refresh, saved Spanish preference on a root visit, query/fragment preservation,
  and Escape closing the mobile menu with restored focus and background scrolling.
  No warning/error messages were present in the final browser console check.
- HTTP checks passed for all three homepages, saved preferences, browser-language
  selection, explicit-locale precedence, invalid cookies, English-prefix redirect,
  unsupported/missing routes returning 404, and an unlocalized icon request.
- `pnpm check:i18n` (171 messages per locale, syntax, matching placeholders and
  original reviews), `pnpm typecheck`, and `git diff --check` passed. Refreshed
  generated route types with `pnpm exec next typegen` after moving the page/layout.
- No existing port-3021 server was running. A temporary `pnpm dev` server was used;
  sandbox file-watch limitations required running it outside the sandbox. The
  verification server was stopped afterward. No production build or deployment.
- Evidence under `output/playwright/`: `i18n-zh-desktop.png`,
  `i18n-es-mobile-menu.png`, and `i18n-es-mobile-faq.png`.

### Mobile Hero breathing room — September 28, 2026

- Increased mobile Hero padding from 48px on both sides to 72px above and 88px
  below the content, adding 64px of height without changing text or button sizes.
  The photo remains the full-section background; desktop styles are unchanged.
- Codex in-app browser: visually checked 390px and 320px phones, with no clipping
  or horizontal overflow. The Hero measures about 536px and 564px respectively.
  Rechecked desktop at 1440px: Hero remains 600px high with 64px vertical padding.
- `git diff --check` passed. Reused the existing server. The preceding BBB move
  is committed as `c88cb1b`. No build, push, or deployment.
- Evidence: `output/playwright/hero-mobile-spacing-2026-09-28.png`.

### BBB service trust row — September 28, 2026

- Moved the transparent BBB A+ artwork from below the Hero actions to a compact
  row below the service cards, opposite Contact Us. Added a fine divider and
  retained the existing contact destination. The image is 110px wide (about 38px
  high); the link keeps a 44px minimum target.
- Reduced the desktop Hero minimum height to 600px and mobile vertical padding
  to 48px. Mobile retains the full-section photo background.
- Codex in-app browser: inspected the service row at 1440px, 390px, and 320px,
  with both items on one line and no page overflow. Checked the updated Hero at
  1440px and 320px; confirmed no BBB artwork remains in the Hero, and checked
  keyboard focus plus the Contact Us href without navigating off-site.
- `pnpm typecheck` and `git diff --check` passed. Existing server reused; no build,
  push, or deployment. Evidence under `output/playwright/`:
  `bbb-services-desktop-2026-09-28.png`, `bbb-services-mobile-2026-09-28.png`, and
  `hero-without-bbb-desktop-2026-09-28.png`.

### Homepage section order — September 28, 2026

- Kept the Hero first, followed by FCE and other services, Why Choose Us,
  Trusted by Leading Institutions, Simple 4-Step Process, Pre-Evaluation,
  FAQs, and Google client reviews. Updated the design-guide order.
- Codex in-app browser: confirmed the complete rendered section order at 1440px
  and 390px. Visually checked the moved sections and their transitions on desktop
  and mobile; both widths have no horizontal page overflow.
- `pnpm typecheck` and `git diff --check` passed. Reused the existing server.
  Earlier pre-evaluation and redundant-action changes were committed as `346ece6`
  before this reorder. No push or deployment.
- Evidence: `output/playwright/home-order-desktop-2026-09-28.png` and
  `output/playwright/home-order-mobile-2026-09-28.png`.

### Removed redundant homepage actions — September 28, 2026

- Removed the standalone closing Start Application panel and the entire strip
  below the service cards containing “Translation and evaluation services.” and
  Contact Us. Removed the two icon imports made unused by the strip deletion.
- FAQs now lead directly into client feedback; the service cards lead into the
  application process. Updated the design guide's section order and exclusions.
- Codex in-app browser: visually checked both transitions at 1440px and 390px,
  confirmed both removed containers are absent, and found no horizontal overflow.
  `pnpm typecheck` and `git diff --check` passed. Existing server reused;
  no build, restart, commit, push, or deployment in this update.
- Evidence under `output/playwright/`: `removed-closing-desktop-2026-09-28.png`,
  `removed-contact-strip-desktop-2026-09-28.png`, and
  `removed-closing-mobile-2026-09-28.png`.

### Pre-evaluation emphasis and complete legacy copy — September 28, 2026

- Follow-up styling: changed the question to pale blue and the CTA to the shared
  orange action color, removed its arrow, and added a white keyboard-focus outline.
  Verified the question and text-only button visually at 1440px and 390px in the
  in-app browser; the mobile button fits without page overflow and retains the
  degree-equivalency-tool URL. Copy is unchanged. Evidence:
  `output/playwright/pre-evaluation-colors-desktop-2026-09-28.png` and
  `output/playwright/pre-evaluation-colors-mobile-2026-09-28.png`.
- Promoted the original degree-equivalency question to a prominent standalone
  heading. Restored the bold “We provide:” heading, all three benefits, and the
  complete closing paragraph in place of the shortened preliminary-assessment note.
- Kept the dark-blue panel and graduation image, widened the desktop copy column,
  and retained the existing Start Your Pre-Evaluation destination. Mobile stacks
  the image and complete content in normal reading order.
- Compared the section's title and full copy against legacy `home-content.html`:
  exact match after whitespace normalization. Only typography and layout differ.
- Codex in-app browser: visually checked desktop at 1440px and the mobile question
  and benefit list at 390px. Width checks at 320, 390, 760, 850, and 1440px found
  no horizontal page overflow; text and the button fit narrow/intermediate widths.
- `pnpm typecheck` and `git diff --check` passed. Existing local server reused;
  no build, restart, commit, push, or deployment in this update.
- Evidence under `output/playwright/`: `pre-evaluation-desktop-2026-09-28.png`,
  `pre-evaluation-mobile-question-2026-09-28.png`, and
  `pre-evaluation-mobile-benefits-2026-09-28.png`.

### Reduced service scope — September 28, 2026

- Removed Visa Services, Editing/Proofreading, and China Consular Authentication
  from both navigation menus. Removed the Visa Services homepage card and the
  Visa / Consular Authentication footer links. The other six menu services remain.
- Recorded the retained services and exclusions in README.md and aligned the
  design guide. Legacy pages and the separate application portal were not changed.
- Codex in-app browser: verified the expanded six-item desktop menu at 1440px
  and mobile menu at 390px, the mobile service rail reaching Technical Translation
  at 3 / 3, and the mobile footer. No removed service destination remains in the
  homepage DOM; the mobile page has no horizontal overflow.
- `pnpm typecheck` and `git diff --check` passed. Reused the existing development
  server; no build, restart, push, or deployment.
- Evidence: `output/playwright/services-retained-desktop-2026-09-28.png` and
  `output/playwright/services-retained-mobile-2026-09-28.png`.

### Logo wordmark size — September 28, 2026

- Enlarged the complete header/footer wordmark by 7.5%, tightened its spacing,
  and proportionally reduced the emblem within the unchanged outer dimensions.
  Updated both SVG and transparent PNG exports; wording and colors are unchanged.
- Codex in-app browser: inspected header/footer at 1440px and 390px, plus the 320px header.
  Logos load with complete text and no page overflow. Export alpha bounds remain
  inside the canvas, and `git diff --check` passed.
- Evidence: `output/playwright/logo-size-desktop-2026-09-28.png` and
  `output/playwright/logo-size-mobile-2026-09-28.png`. No build or deployment.

### Restored legacy logo wording — September 28, 2026

- Restored the full two-line wording in the header/footer SVG and PNG lockups:
  “American Education and” / “Translation Services,CORP (AET)”. Updated both
  image alt attributes while preserving the emblem and transparent backgrounds.
- Codex in-app browser: checked the header and footer at 1440px and 390px.
  Both assets loaded, the complete wording fits, and the page has no horizontal
  overflow at those widths.
- `pnpm typecheck` and `git diff --check` passed. Existing port-3021 server reused;
  no build, push, or deployment. Screenshots:
  `output/playwright/logo-wording-desktop-2026-09-28.png` and
  `output/playwright/logo-wording-mobile-2026-09-28.png`.

### Restored FCE introduction and benefits — September 28, 2026

- Restored “What is Foreign Credential Evaluation?” and its complete paragraph,
  plus “Why Choose AET for FCE?” and all four benefits from the legacy
  `americantranslationservice.com/home-content.html`, preserving the wording.
- Placed the content before the existing evaluation/services cards. Desktop uses
  two columns; at 850px and below the introduction and benefits stack in reading order.
- Codex in-app browser: visually verified the new content at 1440px and 390px.
  Width checks at 320, 390, 760, 850, and 1440px found no horizontal page overflow;
  the new text also fits its containers at the narrow and intermediate widths.
- `pnpm typecheck` and `git diff --check` passed. Reused the owner's port-3021
  server; no build, restart, push, or deployment.
- Evidence: `output/playwright/fce-desktop-2026-09-28.png` and
  `output/playwright/fce-mobile-2026-09-28.png`.

### Transparent browser icons — September 28, 2026

- Replaced browser PNG/ICO and manifest icon exports with transparent-background
  versions of the selected full-map AET artwork. Retained the original source
  and the separate opaque Apple touch icon.
- Confirmed transparent corners in locally served PNGs and all 16/32/48px ICO
  frames. The homepage exposes refreshed automatic icon URLs after reload.
- Codex in-app browser: inspected the actual 32px PNG and 16px ICO on pale-blue,
  light, and dark preview surfaces; both loaded without a white tile. This checks
  asset rendering, not every external browser's existing favicon cache.
- Evidence: `output/playwright/favicon-transparent-2026-09-28.png`. The temporary
  preview page was removed after verification. `git diff --check` passed.
- Reused the owner's server. No build, push, or deployment.

### Four-step process correction — September 28, 2026

- Corrected the distinction between evaluation purpose (USCIS, employment,
  education) and report type. The homepage now has four steps: purpose, application
  details, evaluation type in Services, and document upload on the status page.
  Retained the orange Start Application CTA and expanded progress indicators to four.
- Captured the actual Services screen after completing earlier wizard steps with
  fictional demo data. No application was submitted. The capture includes the three
  requested report types without applicant details.
- Replaced the office-selection illustration with the upload controls cropped
  from the owner's supplied screenshot. Application ID, URL, and uploaded-file
  records are excluded. Automated approval blocked reading the individual status
  record; the supplied screenshot is the source for this fourth-step image.
- Codex in-app browser: verified four titles and indicators, desktop third/fourth
  image switching at 1440px, loaded images and stacked third/fourth steps at 390px,
  and no page overflow at 1440/390/320px. The 320px CTA is 68px high and both
  process application links retain the requested destination.
- `pnpm typecheck` and `git diff --check` passed. Existing local server reused;
  no production build, commit, push, or deployment in this correction.
- Evidence under `output/playwright/`: `process-four-step-types-desktop.png`,
  `process-four-step-upload-desktop.png`, and `process-four-step-upload-mobile.png`.

### Process application screenshots and CTA — September 28, 2026 (superseded above)

- Added a prominent orange Start Application button below the process introduction,
  linking to the owner's credential-evaluation application URL. Mobile uses a
  full-width button; keyboard focus has a visible white outline.
- Replaced all three process photographs with screenshots captured from the live
  application's Service Type menu, Client Information form, and Office menu.
  Restored the legacy three-step sequence: choose evaluation type, complete the
  application, and submit documents to an office. The third image illustrates
  office selection; it does not represent an upload or successful submission.
- Screenshots keep their proportions and full content in white frames. Desktop
  retains the scrolling image transitions; mobile stacks each image with its copy.
- Codex in-app browser: visually checked all three stages at 1440px and 390px,
  plus the CTA at 320px. No horizontal page overflow at these widths. All active
  screenshots loaded. Keyboard activation of the new CTA reached the exact live
  application URL. No personal data, uploads, or application submissions were used.
- `pnpm typecheck` and `git diff --check` passed. Reused the owner's port-3021
  server; no build, server restart, push, or deployment.
- Evidence: `output/playwright/process-desktop-2026-09-28.png`,
  `process-step2-2026-09-28.png`, `process-step3-2026-09-28.png`, and
  `process-mobile-2026-09-28.png` in the same directory. Reduced-motion and
  no-JavaScript behavior was not separately browser-tested in this change.

### Google rating and equal-height testimonials — September 28, 2026

- Shortened xiao h to the second original paragraph at the owner's request.
  The other four reviews remain complete. Removed per-slide height changes:
  all cards now stretch to the tallest natural height for the current viewport.
  Avatars retain explicit 48 x 48 dimensions and contain their original images.
- Added a restrained Google reviews summary with 5.0, five gold stars, and
  “Read more reviews” linking to the owner's Google search in a new tab.
  Checked the live Google business panel: 5.0 out of 5 on September 28, 2026.
  The score is static; no live review count is displayed.
- Codex in-app browser: desktop (1440px) and mobile (390px) inspected. All five
  cards measure the same height, and the rail height remains unchanged after
  keyboard-activated next/previous navigation. At 320px, all cards also remain
  equal-height, all avatars remain 48 x 48, and there is no page overflow.
  Verified the outbound href and new-tab target against the supplied destination.
- `pnpm typecheck` and `git diff --check` passed. Existing preview server reused;
  no production build or deployment. Screenshots:
  `output/playwright/testimonials-google-desktop-2026-09-28.png` and
  `output/playwright/testimonials-google-mobile-2026-09-28.png`.

### Header online application action — September 28, 2026

- Added an orange Online Application button at the desktop header's far right,
  linking to `https://app.americantranslationservice.com/credential-evaluation-application`.
  The same action appears below the navigation inside the mobile menu.
- Moved the compact-header breakpoint to 1200px to leave room for the new action;
  mobile still shows only the logo and hamburger in the closed header.
- Codex in-app browser: visually verified 1440px and 1201px desktop layouts and
  open mobile menus at 390px and 320px. Confirmed the application href, no overflow
  at the narrow desktop/mobile checks, and Escape closing the menu. No application
  was submitted. Typecheck and diff whitespace checks passed; no build or deployment.
- Screenshots: `output/playwright/header-application-desktop-2026-09-28.png`
  and `output/playwright/header-application-mobile-2026-09-28.png`.

### Header redesign — September 28, 2026

- Adopted the IRFC header structure: translucent light desktop bar, centered
  navigation, separate language control, circular mobile toggle, and a navy
  viewport-height mobile menu with numbered rows and expandable service links.
  Retained AET artwork, fonts, and blue palette.
- Restored Home, Evaluation, Services, Contact, Payment, and Blog from the legacy
  `americantranslationservice.com/header.html`, including all nine Services links
  and English/Chinese/Spanish options. Home points to this rebuilt homepage;
  service, contact, payment, blog, and translated pages retain legacy destinations.
- At 1080px and below, only the logo and hamburger remain in the top bar.
  Native disclosures support basic access without JavaScript; enhancements add
  Escape/outside/focus-away dismissal, focus containment, background scroll
  locking, selection closing, and breakpoint resets.
- Codex in-app browser: visually inspected desktop at 1440px and 1081px, phones
  at 390px and 320px, desktop service/language dropdowns, mobile open/closed
  states, and the expanded nine-service list. Verified keyboard expansion,
  Escape focus restoration, language-to-logo focus wrap, and Home selection
  closing the mobile panel. Scrolled the expanded list to its final service
  and the lower navigation/language choices. Physical touch was not tested.
- Width checks at 320, 390, 760, 850, 1080, 1081, 1200, and 1440px found no page
  overflow. Reduced-motion and no-JavaScript fallbacks were inspected in code,
  not separately browser-emulated for this change.
- `pnpm typecheck` and `git diff --check` passed. Used the existing port-3021
  preview; no server restart, production build, commit, push, or deployment.
- Screenshots: `output/playwright/header-desktop-2026-09-28.png`,
  `output/playwright/header-mobile-2026-09-28.png`, and
  `output/playwright/header-mobile-menu-2026-09-28.png`.

### Footer icons and office list — September 28, 2026

- Removed every diagonal arrow from the footer and removed New York and San
  Francisco from its office links at the owner's request. Added recognizable
  monochrome LinkedIn, Yelp, Facebook, and Google icons beside their labels.
- Codex in-app browser: checked the footer at 1440px and social icons at 390px;
  confirmed four social SVGs, no arrow icons, no removed office links, visible
  keyboard focus, and no mobile page overflow. Typecheck and diff checks passed.
- Screenshots: `output/playwright/footer-social-desktop-2026-09-28.png` and
  `output/playwright/footer-social-mobile-2026-09-28.png`.

### Legacy footer redesign — September 28, 2026

- Restored all 22 destinations from the legacy `footer.html`: five services,
  four popular links, six offices, four social/review links, and three blog/legal
  links. Preserved the original labels and 2009 - Present copyright statement.
- Added a scoped, server-rendered footer component with the existing AET logo,
  IRFC-inspired navy brand/navigation layout, and a separate legal row. Mobile
  keeps services full-width above the popular-links and office columns.
- Codex in-app browser: visually checked the desktop footer at 1440px and both
  halves of the mobile footer at 390px. DOM checks at 320, 390, 760, 850, and
  1440px found no page/footer overflow and all links have at least 44px height.
  Confirmed logo loading, visible keyboard focus, and no captured console errors.
- Compared rendered link destinations against the local legacy footer: all 22
  match. External destination availability was not re-tested.
- `pnpm typecheck` and `git diff --check` passed on the existing port-3021 server.
  No production build or deployment was performed.
- Screenshots: `output/playwright/footer-desktop-2026-09-28.png` and
  `output/playwright/footer-mobile-2026-09-28.png`.

### Homepage testimonial carousel — September 28, 2026

- Replaced the two-review section with all five legacy testimonials and original
  avatars; retained both xiao h paragraphs and omitted undated relative timestamps.
- Moved client feedback after the closing application panel, immediately before
  the footer. Desktop shows two cards; mobile shows an 88%-width card and a next-card
  cue. Previous/next buttons loop at both ends, with a visible range counter above
  the cards. Height follows the fully visible reviews without truncating copy.
- Codex in-app browser: visually inspected at 1440px, 390px, and 320px; checked
  desktop and mobile navigation, end-to-start wrapping, native keyboard scrolling,
  long/short review heights, and avatar loading. Width checks at 320, 390, 760,
  850, and 1440px found no page overflow. Physical touch gestures were not tested.
- Reduced-motion handling and the native no-JavaScript scrolling fallback were
  inspected in code; these modes were not separately browser-emulated for this change.
- `pnpm typecheck` and `git diff --check` passed using the existing port-3021 server.
  No production build, server restart, commit, push, or deployment was performed.
- Screenshots: `output/playwright/testimonials-desktop-2026-09-28.png` and
  `output/playwright/testimonials-mobile-2026-09-28.png`.

### Institution spacing refinement — September 28, 2026

- Reduced section padding, introduction spacing, logo slot dimensions, and row
  gaps. Balanced square emblems against wordmarks without cropping artwork.
- Kept the existing wording and two moving rows. Mobile copy remains 16px with
  1.6 line height; the footer link has its own line and a 44px minimum target.
- Codex in-app browser: visually inspected the institution section at 320px,
  390px, and 1440px with no page overflow. At 390px, section height decreased
  from 877px to 706px (about 20%). Confirmed focus stops each row's animation
  and exposes native scrolling; normal cycles remain 72/80 seconds.
- `pnpm typecheck` and `git diff --check` passed using the existing port-3021
  server. No production build or deployment was performed.
- Screenshots: `output/playwright/institutions-mobile-2026-09-28.png` and
  `output/playwright/institutions-desktop-2026-09-28.png`.

### Fact scroll exit correction — September 28, 2026

- Replaced viewport-based progress estimates with the actual sticky range:
  section height minus scene height, starting at the scene's CSS top offset.
  Each fact receives an equal interval; selectors land in its midpoint.
- Section height derives from the fact count (one viewport plus 65vh per fact),
  giving the last fact a full interval before the scene unpins.
- Supplemental Playwright real-wheel checks at 1440x1000, 1512x800, and 1920x720:
  facts appear as 15+, 100+, 2009, A+, and 5 at 10/30/50/70/90 percent;
  scene top remains 100px through 98 percent, and moves upward after 100 percent.
  The active card stays within the viewport at the sampled pinned positions.
- Codex in-app browser: scrolled from BBB to Google at 1440x1000 and confirmed
  the fifth card stays pinned. At 390px the native mobile rail still advances,
  with natural section height and no horizontal overflow. Reduced-motion check
  exposes all five facts and disables all sphere animations.
- `pnpm typecheck` and `git diff --check` passed; used the existing port-3021
  server. No production build or deployment was performed.
- Screenshot: `output/playwright/facts-scroll-fifth-held-2026-09-28.png`.

### Fifth Google review fact — September 28, 2026

- Added a fifth fact panel for five-star Google reviews, with five gold stars
  and a summary of the existing testimonial themes: responsive communication,
  professional evaluations, and helpful service. This describes five-star
  reviews, not a verified aggregate Google score or review count.
- Extended the desktop section to 360vh to preserve reading time for five facts.
- Codex in-app browser: selected the fifth panel at 1440px and navigated the
  mobile rail to 5/5 at 390px. The final next control is disabled; the copy fits
  and neither viewport has page overflow. Typecheck and diff checks passed.
- Screenshots: `output/playwright/google-fifth-card-desktop-2026-09-28.png`
  and `output/playwright/google-fifth-card-mobile-2026-09-28.png`.

### Fourth BBB fact and floating spheres — September 28, 2026

- Moved the BBB explanation from the introduction into a fourth fact panel with
  a large A+, a Better Business Bureau heading, and the highest-rating/service
  commitment copy. Added the fourth selector and retained native mobile rails.
- Added eight decorative spheres (six on mobile) behind the content. Independent
  slow drift combines with vertical-scroll or mobile-rail position changes.
  Extended the desktop section to 295vh to retain reading time for all four facts.
- Codex in-app browser: checked desktop at 1440px and mobile at 390px/320px.
  Selected the fourth desktop panel and advanced the mobile rail to 4/4 with
  its next control disabled. Copy fits and mobile has no page overflow.
  Confirmed the desktop scroll progress changes from 0 to 1 and the first
  sphere moves by 45px horizontally and 75px vertically.
- Supplemental Playwright reduced-motion check: pinned switching is disabled,
  all four facts are visible, all eight spheres have no animation or transform,
  and the desktop page has no horizontal overflow.
- `pnpm typecheck` and `git diff --check` passed. Used the existing port-3021
  server; no production build or deployment was performed.
- Screenshots: `output/playwright/bbb-fourth-card-desktop-2026-09-28.png` and
  `output/playwright/bbb-fourth-card-mobile-2026-09-28.png`.

### Why Choose Us BBB emphasis — September 28, 2026

- Follow-up: replaced the organization-name-only caption with highest-rating
  context and a commitment to dependable service, clear communication, and
  customer care. Highest-rating terminology follows
  [BBB's rating overview](https://www.bbb.org/about/overview-of-ratings).
- Follow-up checks: Codex in-app browser at 1440px and 390px confirms readable
  copy; mobile has no page overflow. Typecheck and diff whitespace checks pass.
  Screenshots: `output/playwright/why-choose-bbb-copy-desktop-2026-09-28.png`
  and `output/playwright/why-choose-bbb-copy-mobile-2026-09-28.png`.

- Removed the duplicate Experience & Membership strip below the institutions.
- Added the existing transparent BBB A+ Rating artwork beneath the Why Choose Us
  introduction with a Better Business Bureau caption. It remains visible while
  the original experience, language, and ATA fact panels change.
- Codex in-app browser: inspected the updated section at 1440px, 390px, and 320px;
  the badge loads and there is no page overflow. Confirmed the strip is absent
  and scrolled to the ATA panel with the BBB artwork still visible.
- `pnpm typecheck` and `git diff --check` passed using the existing port-3021
  server. No production build or deployment was performed.
- Screenshots: `output/playwright/why-choose-bbb-desktop-2026-09-28.png` and
  `output/playwright/why-choose-bbb-mobile-2026-09-28.png`.

### Hero layout refinement — September 28, 2026

- Set the wide-desktop title to three lines and reduced excess Hero height. Limited
  paragraph width and moved the portrait toward the right with a lighter overlay.
- Kept the photo behind the entire mobile Hero; removed the separate image block
  below the copy. Applied responsive crops and a stronger gradient behind mobile text.
- Aligned both actions at 54px on desktop and 50px on mobile, preserving their
  labels, colors, icons, and destinations. Retained the transparent BBB artwork.
- Codex in-app browser: visually checked the homepage Hero at 320, 390, 760, 850,
  and 1440px; no page overflow, and the mobile image covers the Hero background.
- `pnpm typecheck` and `git diff --check` passed. Used the existing port-3021 server;
  no production build, push, or deployment was performed for this follow-up.
- Screenshots: `output/playwright/hero-layout-desktop-2026-09-28.png` and
  `output/playwright/hero-layout-mobile-2026-09-28.png`.

### Hero BBB refinement — September 28, 2026

- Replaced only the Hero's white-backed BBB badge with the transparent derivative
  `public/images/bbb-hero-transparent.png`; original artwork remains unchanged.
- Kept “BBB A+ Rating” alternative text and the badge below the Hero actions.
  The artwork uses a compact navy layout with no card background or button styling.
- Codex in-app browser: inspected the current desktop Hero and 390px/320px mobile
  layouts; image loads, remains legible, and does not create page overflow.
- `pnpm typecheck` and `git diff --check` passed. Existing button styles and design
  rules were not changed. This follow-up has not been deployed.
- Screenshots: `output/playwright/bbb-hero-desktop-2026-09-28.png` and
  `output/playwright/bbb-hero-mobile-2026-09-28.png`.

### Implemented and locally checked

- [x] Retained AET header/footer artwork, the full-map icon assets, shared palette,
      exact Hero heading/description/actions, and BBB A+ artwork below the actions.
      Header, Hero, and footer inspected in the Codex in-app browser.
- [x] Applied the enlarged Poppins hierarchy, Fraunces facts heading, Gaegu figures,
      1280px content limit, section spacing, and larger card padding. The four-digit
      2009 figure has a separate scale and fits its desktop and mobile panels.
- [x] Preserved two institution rows of eight logos with 72/80-second rightward
      cycles, no logo tiles or pause button, and the required supporting sentence/link.
      Focus stops movement and exposes native scrolling through all logos; reduced
      motion and no JavaScript leave the original groups scrollable without duplicates.
- [x] Restored separate legacy descriptions for Document by Document Evaluation,
      Course by Course Evaluation, and Expert Opinion Letters in the featured card.
      Supporting service names, testimonial text and attributions, existing facts,
      FAQ processing time, and existing destinations remain in place.
      Source: the legacy site's `home-content.html`, documented in ASSETS.md.
- [x] Kept the homepage sections in the design-guide order. The four process
      stages cover selecting purpose, completing application details, choosing
      evaluation type, and uploading documents on the status page, using real UI captures.
- [x] Implemented native mobile rails for facts, supporting services, and testimonials
      at 760px and below. Each uses 88% cards, 16px gaps, proximity snapping, an exposed
      next-card edge, and progressive previous/next controls. All last cards are fully
      reachable; previous/next end states and native keyboard scrolling were checked.
      Required process steps, FAQs, Hero, and footer remain in vertical flow.
- [x] Desktop facts and process imagery enhance only above 850px, with at least 720px
      viewport height and no reduced-motion preference. Smaller/shorter viewports,
      reduced motion, and no JavaScript expose all content without pinned switching.
      Desktop selectors, the 2009 card, and changing process imagery were inspected.
- [x] Mobile navigation and language selection use native disclosures. Menu selection
      and Escape close the enhanced mobile menu and return focus to its trigger.
      Native menu and FAQ opening also work with JavaScript disabled.
- [x] Retained the 1920 x 1080 graduation source, 2560 x 1440 Hero source, and
      1600 x 2400 consultation source. Responsive image sizing and crops were checked;
      consultation imagery retains both faces and their documents. No broken images
      were found in the final browser check.
- [x] `pnpm typecheck` and `git diff --check` pass. No production build was run.

### Verification evidence

- Existing owner-run preview: `http://localhost:3021`; no server was started/restarted.
- Codex in-app browser: 320, 390, 760, 850, and 1440px checks, plus the 761px navigation
  boundary. Hero, services, mobile card navigation, native menu, desktop facts,
  process photos, pre-evaluation, expanded FAQ, and footer were inspected.
- Supplemental Playwright: the five required widths have no page overflow or
  overflowing headings/buttons. With reduced motion, no fact is hidden, pinned
  switching is off, and running page animations are absent.
- JavaScript-disabled checks: mobile menu and FAQ work, all three native rails can
  scroll, facts stay visible, and every process image is positioned above its copy.
  Desktop fallback images have explicit containing blocks and there is no page overflow.
- Enlargement checks: 200% root-text sizing at 1440px and 720 x 500 reflow (the CSS
  viewport equivalent of 200% zoom at 1440 x 1000). The Hero also wraps within its
  column after text enlargement. These are simulations, not a native browser-zoom test.
- Screenshots and raw checks are under `output/playwright/`. `aet-desktop.png` and
  `aet-mobile.png` show the final Hero; section captures show facts, rail end states,
  and the mobile footer. Full-page captures use reduced motion to expose all content.

### Remaining pre-launch checks

- [ ] Native browser 200% zoom, physical-device touch, and a full screen-reader /
      contrast audit. Keyboard and disclosure spot checks are not a full WCAG audit.
- [ ] Live availability and final production routing of all application, contact,
      payment, office, language, and legal destinations. This design pass preserves
      their targets; it does not submit forms or validate external workflows.
- [ ] Owner-managed deployment and production checks. No commit, push, or deployment
      was performed as part of this design pass.

## 2026-10-08 — Boston address update

- Updated the shared Boston postal address to `6 Pleasant Street, #419, Malden, MA 02148`.
  Office cards, directions, structured data, payment recipient addresses, and mapped
  legacy article references derive their current address from this catalog.
- Verified rendered HTML for the English, Chinese, and Spanish Boston office pages,
  Contact, Payment, and the Boston translation-company article: each includes the new
  address and excludes the former suite number.
- Codex in-app browser checks passed for the Chinese Boston contact section at desktop
  and 390px mobile widths; the address wraps correctly and the directions URL uses #419.
- Used a temporary local preview on port 3021 with Watchpack polling because native
  file watching exceeded the environment limit. No production build or deployment.
