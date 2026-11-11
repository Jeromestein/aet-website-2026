# AET Migration Checklist

Updated November 10, 2026. Isolated phases one through three and hosted dev Preview
core acceptance at `b003139` are verified. Production and historical cohorts remain
unchanged. A local copy of the old Preview cohort has also been rehearsed;
this is not hosted historical activation. Unchecked capabilities remain open.
Read [status](status.md) for progress, [architecture](migration-architecture.md)
for system relationships and the [documentation index](README.md) for guides.
The [database comparison](database-architecture.md) maps legacy, current and
proposed tables/fields; the five-table model now serves new Preview pre-evaluation applications.
The [database convergence plan](database-migration-plan.md) adds a code-backed
field audit, implemented stages and remaining migration gates.

Checked means the stated implementation or verification is complete, not that
the whole feature is deployed. Keep current work here; dated test output and
the original route inventory live in the [historical checklist](archive/migration-checklist-2026-10-22.md).

## First milestone: reliable pre-evaluation

- [x] Implement the dedicated application, customer ID lookup, uploads, GPT
  analysis, paid-result gate and confirmation/result notifications.
- [x] Record an actual local Dropbox/OpenAI/Resend journey and a separate Stripe
  Sandbox Checkout/webhook run using synthetic data and controlled recipients.
- [x] Accept the existing four-case AI baseline (three full reference matches,
  one partial mapping); preserve the known fourth-case difference.
- [x] Integrate abandoned-upload recovery and saved-result publication recovery
  into `dev`, preserving payment/refund, stale-write and email-deduplication guards.
- [x] Pass the recorded combined 778-test / 51-file suite, TypeScript and i18n.
  See [verification scope](status.md#latest-integrated-verification).
- [x] Confirm Vercel dev Preview `5d10cff` is Ready and inspect desktop form/review,
  CRM, existing synthetic Status/results, pricing/language and GPA behavior.
  See [hosted verification scope and remaining limits](archive/preview-acceptance-2026-10-22.md).
- [x] Synchronize twelve settings only to dev Preview: shared application names,
  restricted database/origin, Dropbox pilot root, OpenAI/model and explicit
  AI/mail/Stripe-test opt-ins. Keep cutover disabled. The temporary listener
  signing secret was subsequently replaced by the permanent dev test endpoint secret.
- [x] Resolve the hosted pre-evaluation attachment download failure with the
  required pilot root; both existing and newly uploaded PDFs return 200 with
  bytes matching their synthetic fixtures.
- [x] Complete a controlled hosted synthetic journey using API and desktop browser
  checks: upload, one GPT analysis, USD 19.88 Sandbox payment, saved result,
  customer/CRM consistency and two delivered emails. Test unpaid access,
  concurrent Checkout reuse, paid Checkout rejection and callback replay.
  The real Stripe test event reached the hosted route through a temporary relay;
  the relay was stopped and its dev-only access revoked.
- [x] **Hosted recovery acceptance (November 6, 2026, `b003139`):** force a
  chunked-upload hash mismatch (502), preserve the failed attempt across a page
  load, abandon it through the customer UI, upload a replacement and complete one
  eligible AI run. Reject the obsolete finish request with 409. After a targeted
  publication outage, retain the paid ledger and saved AI result; three concurrent
  authorized reads recover the same result and enqueue one result email. Direct
  Stripe test-event redelivery completes with no pending webhook and no duplicate
  payment, analysis or result notification. Customer/CRM views agree. The temporary
  Preview-only trigger/function were removed; Production is unchanged. See
  [recovery evidence](archive/preview-recovery-acceptance-2026-11-06.md).
- [x] Configure permanent direct Stripe **test** webhook delivery and its own
  signing secret on dev Preview. A new USD 19.88 Sandbox payment reached the
  hosted handler directly, completed the application and delivered the result
  email. Customer and CRM views agree. Only the dev alias has a Vercel protection
  exception; staff login and Stripe signature checks remain enforced. See the
  [direct webhook acceptance](archive/preview-acceptance-2026-10-22.md#permanent-direct-test-webhook-acceptance).
- [ ] Complete amount/ownership negative cases, cancellation/refund visibility
  and phone recovery checks. Desktop upload/publication recovery and direct event
  replay passed November 6; normal paid/unpaid and return reconciliation also pass.
- [ ] Verify hosted AI runtime/timeout/recovery limits and deployment eligibility
  before production use. Confirm real-customer recipients, charging and operating
  policy separately; test acceptance does not authorize live transactions.

Guide: [pre-evaluation](pre-evaluation-local.md). Additional AI mapping/tuning is
deferred under the owner's accepted baseline; it is not this milestone's gate.

## Unified application and fulfillment

- [x] Build the three-step client/service/office → details → confirmation form,
  including drafts, required pronouns/name/education and optional date of birth.
- [x] Restrict evaluation to Miami, Los Angeles and San Francisco; translation
  choices use the five US offices. Document/course evaluation are mutually
  exclusive, with adjacent sample reports and shared 2026 prices.
- [x] Include starred 24-hour/same-day options, USD 450 course same-day pricing
  and payment/documents due by each handling office's **local 1 pm** cutoff.
- [x] Save delivery choices, paper copies, shipping and a required mailing address
  when needed; show them on review. Preserve all education associations.
- [x] Persist formal intake transactionally with deduplication, a server-priced
  snapshot, same-ID CRM compatibility projection, confirmation mail and Status.
- [ ] Define mutable workflow/payment state for v2 intake while preserving its
  submitted snapshot and prices; keep the CRM projection consistent.
- [ ] Add document readiness and office-authorized staff actions for v2
  intake: request missing material, confirm fees and advance status. Acceptance:
  CRM and customer Status agree after reload; stale/cross-office writes fail.
- [ ] Connect application-linked Stripe test checkout, verified webhook and
  reconciliation to saved service amounts and the fixed Checkout amount; expose
  the same payment truth in Status/CRM and send one receipt. Replayed events must not create another effective payment.
- [ ] Define manual/external payments, adjustments, refunds and needed additional
  payment methods before their production acceptance. Standalone `/payment` and
  older pilot behavior do not establish support in this new intake.
- [ ] Connect current-version report approval/release, eligible customer access,
  quote/payment/result notifications and paper dispatch/tracking.
- [ ] Connect the already-tested dedicated pre-evaluation flow to the general
  entry. Evolve shared contracts as services connect; no broad database rewrite
  is required to finish one formal-evaluation journey.
- [x] **Document the previous nine-table target (November 10, 2026):** five
  business tables plus AI runs, payment events, audit and rate limits. Supersedes
  the November 6 thirteen-table design; see [target and boundaries](database-migration-plan.md#approved-convergence-target-6-tables).
  Pre-evaluation implementation is now verified locally; hosted/cross-service
  rollout remains open. Staff auth/CMS remain outside the budget.
- [x] **Merge upload tracking into documents in isolation:** one file row with
  nullable File ID until ready and current state/version/context. Ordinary,
  chunked and shared uploads preserve ready files and reject stale completion;
  failed/abandoned replacement passes after `aet_uploads` is physically dropped.
- [x] **Replace the local mail table in isolation:** bounded current service
  notification state retains event key, payload hash, receipt and retry budget;
  Resend owns history. Captured delivered receipts are preserved; concurrent
  flush, changed-payload and expired delivery-window guards pass. Old mail rows
  are externally archived. No cron or copied HTML/history array is added.
- [x] **Use non-expiring application-ID links in isolation:** no customer cookie,
  session, extra token or creation-time expiry. Customer file requests must match
  the application; staff actions and private results remain protected. Anyone
  holding an application URL has its customer access. Active legacy token-only
  links block retirement; expired/consumed token routes return 410 afterward.
- [x] **Remove audit business dependencies in isolation:** service owns result
  version, current material request and confirmed test exemption/provenance.
  This enabled the subsequent removal of audit and request-counter tables below.
- [x] **Verify nine-table retirement locally:** 25 runtime cases + 11 full-snapshot
  cases cover migration, CRM/Status, upload recovery, AI/publication, signed
  payment/notification replay and DDL rollback. Combined **379 tests / 22 files**
  and TypeScript pass. Full isolated copy: **21 tables = 9 shared + 12 formal**;
  online Preview remains **32**, with zero hosted deletions. See
  [acceptance](archive/database-nine-table-rehearsal-2026-11-10.md).
- [x] **Previous eight-table stage:** remove `aet_payment_events` from
  the isolated runtime. Preserve the existing Stripe webhook, signature/amount/
  ownership checks and atomic payment-state protection; no replacement event log.
  Repeated callbacks preserve payment/release timestamps and still recover an
  unfinished publication. Concurrent callbacks and stale refunds/success/expiry
  are tested. **385 tests / 22 files and TypeScript pass.** Complete isolated copy:
  **20 = 8 shared + 12 formal**; hosted unchanged.
  See [eight-table acceptance](archive/database-eight-table-rehearsal-2026-11-10.md).
- [x] **Simplify to six tables:** retire `aet_audit` and `aet_rate_limits` in the
  isolated runtime. No new operation/actor history or request quotas; no replacement
  logs or counters. Service state retains notes, current material request, result
  version and confirmed test exemption. Staff history reads are empty. Authorization,
  file limits, payment duplicate protection and recovery remain. **389 tests / 22
  files and TypeScript pass.** Complete isolated copy: **18 = 6 shared + 12 formal**. See
  [six-table acceptance](archive/database-six-table-rehearsal-2026-11-10.md).
- [ ] **Prepare hosted six-table acceptance:** fresh snapshot/quiescence,
  recoverable backup/restore, restricted roles, usable old-link compatibility and
  full customer/staff Preview journey. Local tests do not authorize hosted deletion.
- [ ] **Converge formal/translation to the same six:** retire the twelve remaining
  formal workflow/projection tables only after readers/writers and history pass
  the shared file/payment/notification/access contracts.
- [ ] **Optional future reconsideration — operation history / rate limiting:**
  only revisit if a concrete business need appears. Neither is a launch requirement;
  no staff-change tracking or request quotas are active in the six-table mode.
- [ ] **TODO after launch — Resend delivery tracking:** connect delivered/bounce/
  complaint webhooks and a mail-history UI only when needed. Sending through
  Resend and checking its dashboard is sufficient for the current launch scope.
- [ ] **TODO after launch — Payment event investigation tools:** evaluate a replay/
  tracking UI and dispute/chargeback workflows if actual cases justify them;
  no event table or duplicate JSON event-history array is currently planned.
- [ ] **TODO after launch — Automated exception monitoring:** scheduled payment
  reconciliation, mail retry jobs, provider-outage alerts and operational dashboards.
  Keep existing basic recovery; do not implement new cron/monitoring in this phase.
- [x] **Isolated pre-evaluation convergence (November 6, 2026):** actual entry
  points use five canonical tables and eight shared operational tables. Move
  operational tables, combine upload tracking, and physically drop seven redundant
  empty source tables in an owned disposable database; all old `preeval` table
  names and three public pre-evaluation projections are absent, with no replacement
  views. Twenty post-deletion tests cover submission, chunked/shared uploads,
  recovery, concurrent AI, signed callbacks/refunds, guest links, CRM/Status and
  English email. Combined regression: 329 tests / 19 files; TypeScript passes.
  See [acceptance and exclusions](archive/database-preeval-convergence-2026-11-06.md).
  Hosted Preview and Production remain unchanged; this is a new synthetic cohort.
- [x] **Populated-copy convergence rehearsal (November 6, 2026):** an atomic
  importer reconciles the entire disposable source cohort and preserves business
  IDs, frozen payments, AI history, email receipts, access tokens/sessions and
  upload attempts before physically dropping seven old tables. Three synthetic
  cases and copies of three payment-backed historical Preview applications pass
  six acceptance tests each, including rollback after DROP, CRM/Status parity,
  existing access links, signed callback replay and result-version continuity.
  Combined regression: 335 tests / 20 files; TypeScript passes.
  See [historical retirement evidence](archive/database-preeval-history-convergence-2026-11-06.md).
- [x] **Isolated mixed-cohort convergence (November 6, 2026):** migrate all four
  captured old synthetic records, including the audited no-charge fixture, beside
  two applications created through the core-v1 writer. Preserve every existing
  canonical row, ignore stale workflow profile copies, retain v0/v1 retry rules,
  and resume a queued core AI job after physical retirement. Test exemption uses
  service details plus original audit evidence: zero amount, `waived` projection,
  no fabricated payment and no Checkout. CRM/Status change only the exemption's
  payment label/amount; access, results, email and callback checks pass.
  Combined regression: 343 tests / 20 files; the captured-copy suite passes
  14 tests (6 old-only plus 8 mixed). TypeScript passes. See the
  [mixed-cohort evidence](archive/database-preeval-history-convergence-2026-11-06.md#mixed-cohort-extension).
- [x] **Complete hosted-snapshot reconciliation (November 10, 2026):** restore
  all 32 Preview tables from one fresh read-only snapshot, including four old and
  two existing core pre-evaluations plus four formal applications. Refresh six
  Dropbox File IDs, five Stripe test payments and 13 delivered email receipts.
  Migrate all six pre-evaluations and physically retire seven tables locally;
  preserve existing core rows, formal records, results, sessions and mail history.
  Fix converged CRM to retain formal applications; all 10 records and 11 query
  variants reconcile. Signed callback replay remains idempotent; the audited
  no-charge fixture stays waived without a payment row. Seven snapshot tests and
  350 combined tests / 21 files pass; TypeScript passes. A second hosted read
  confirms all 32 source tables unchanged. The complete local copy now has 25
  tables, including 13 converged tables; the online copy still has 32.
  See [full-snapshot evidence](archive/database-full-preview-convergence-2026-11-10.md).
- [ ] **Hosted cutover readiness:** reconcile a new snapshot at cutover time and
  stop active uploads, AI and leased mail before retirement. Resolve non-v1,
  other-service or ambiguous rows rather than forcing migration. Verify the
  waived test-exemption display in the browser; this is not a general discount
  feature. Keep empty-fixture SQL separate from populated-cohort migration.
- [ ] **Hosted convergence activation:** after historical reconciliation, prepare
  restricted hosted grants/migration and explicit rollout/rollback. The current
  convergence activation only accepts the owned local Unix-socket database;
  there is no hosted environment flag for this new stage.
- [ ] **Cross-service convergence to 6 tables:** migrate formal/translation
  writers onto shared files, service notifications, application-ID access and
  the retained AI execution table;
  reconcile historical IDs and provider references before retiring each source.
  Do not create another service-specific table family or a migration table that
  becomes a permanent seventh runtime table.
- [x] **Phase 1 — Additive shared schema and isolated rehearsal (November 6, 2026):**
  add the five tables in private `aet`, including birth/residence/submission/version
  fields, service pricing/result/workflow fields, document access/revisions and
  payment-ledger timestamps/provider references. Keep source tables and runtime
  readers untouched. Rehearse same-ID transactional backfill, explicit exceptions,
  constraints/client access denial, target-only rollback and replay. The existing
  pre-evaluation submission/upload/AI/payment/result/email service flow passes with
  synthetic data and mocked providers. See the [guide](database-rehearsal.md) and
  [evidence](archive/database-phase1-rehearsal-2026-11-06.md). No hosted database changes.
- [x] **Phase 2 — Isolated pre-evaluation shared reads (November 6, 2026):**
  add guarded read-only core Status/CRM adapters and a shared scoped CRM query
  engine. Verify customer/office access, unassigned records, filters, pagination,
  statistics/export, private fields and stale-result suppression. Preserve full
  PostgreSQL timestamp precision in backfill. See [evidence and scope](archive/database-phase2-reads-2026-11-06.md).
  Runtime sources remain unchanged; formal/translation projections are not included.
- [x] **Align CRM education dates with Status (November 6, 2026):** prefer the
  matching legacy education's edited start/end dates; retain workflow fallback
  when that record is absent. Isolated tests confirm CRM, Status and core-read
  parity, date search and export, without rewriting workflow education values.
- [x] **Phase 3 — Isolated pre-evaluation runtime cutover (November 6, 2026):**
  create canonical applications/education directly, route business reads through
  core, capture File IDs and atomically project retained workflow/payment state.
  Verify the complete service flow without backfill, upload/publication recovery,
  refunds, deduplication, private fields, office scope and failed-write rollback.
  117 focused tests and TypeScript pass; see [evidence and ownership boundaries](archive/database-phase3-runtime-2026-11-06.md).
  This original phase-three record covers the test harness; hosted activation is recorded below.
- [x] **Hosted dev Preview core activation (November 6, 2026):** create only
  `aet_preview_core`, enable the guarded core writer for new dedicated pre-evaluation
  applications and retain all old tables/readers. Real chunked Dropbox upload and
  matching download, one OpenAI analysis, USD 19.88 Stripe Sandbox direct webhook,
  released result, customer/CRM agreement and two delivered English emails pass.
  Old and new applications coexist. Final focused regression: 160 tests/12 files
  plus TypeScript. Production is unchanged. See [acceptance evidence](archive/database-preview-acceptance-2026-11-06.md).
- [x] **Isolated historical Preview cohort rehearsal (November 6, 2026):**
  copy four existing synthetic Preview applications into a disposable database;
  reconcile four Dropbox File IDs and three Stripe Sandbox payments read-only.
  Migrate three supported records without source changes; CRM projections, customer
  results, old access/lookup routes, signed callback replay and stale-after-refund
  behavior pass. Preserve the fourth no-charge paid-state test fixture on its old
  path. Fix v0 submission retries; 30 database tests plus six captured-cohort tests
  and TypeScript pass. See [scope and evidence](archive/database-historical-cohort-2026-11-06.md).
- [ ] **TODO — Hosted historical Preview cutover:** deploy the v0 retry fix first,
  prepare the restricted migration entry point, revalidate sources/provider evidence
  and rerun browser/direct-webhook acceptance after migration. The current hosted
  four-record old cohort remains unchanged; retain the no-charge fixture and all old
  tables. Production cutover and real business-history migration remain separate.
- [ ] **TODO — Complete cohort cutover reconciliation:** file creation timestamps
  remain an explicit unknown; finish real File ID and history reconciliation
  before migrating hosted historical records. Three old Preview records passed
  local-copy migration; original submission/release-time gaps remain explicit. Mixed old/new Preview reads
  are verified; keep one authoritative writer per application.
- [ ] **TODO — Historical contract and source reconciliation:** verify missing
  original submissions, File IDs/revisions, release/education timestamps, pricing
  provenance, provider accounts and standalone/legacy identities against authorized
  sources. Retain unresolved records and history; do not fabricate values or put
  formal/translation rows into public core tables while old readers assume pre-evaluation.
- [ ] **TODO — Migrate by tested cohort:** use the
  [pre-evaluation-first sequence](database-migration-plan.md#5-delivery-phases-and-acceptance-gates)
  and [rollback rules](database-migration-plan.md#6-cutover-rollback-and-permissions).
  Preserve upload/publication recovery, refunds and email deduplication; connect
  formal v2 staff/payment/release deliberately, then translation. Retire legacy
  tables/bridges only after all readers, writers and callbacks are reconciled.
  Local phases one through three and new-cohort hosted dev Preview activation are
  verified. Production cutover, historical migration and new scheduling remain unapproved.
- [ ] **TODO — Shared table naming (November 6, 2026):** use `aet_education`
  and `aet_payments` in the target design. Actual legacy/current tables retain
  `aet_core_educations` and `aet_core_payments`; private phase-one tables now exist
  in migrations, disposable rehearsals and the activated Preview core runtime;
  preserve records/IDs and do not treat a rename as payment-ledger unification.
- [ ] **TODO — Application recipient address and pronouns (November 6, 2026):**
  implement the [application field definitions](migration-architecture.md#planned-application-contact-and-recipient-fields)
  in the form/read adapters. Phase-one SQL adds nullable `mailing_address` JSONB with `name`,
  `country`, `street`, `street2`, `city`, `region`, `postal`, plus nullable text
  `pronouns` to `aet_core_applications`. Require a valid address for physical
  delivery and retain evaluation pronoun validation; digital-only applications
  need no mailing address and translation need not supply evaluee pronouns.
  Preserve each application's submitted address independently of future account
  profiles. Map verified recipient values without inventing legacy data; verify
  confirmation, CRM and Status reads for evaluation and translation. The nullable
  columns exist in the Preview core schema; formal/translation runtime adapters remain TODO.
- [ ] **TODO — Shared payment timestamps (November 6, 2026):** implement the
  [three timestamp definitions](migration-architecture.md#planned-payment-timestamps)
  in shared runtime writers. Phase-one SQL adds `created_at` and `updated_at` to `aet_payments`
  while retaining `paid_at`. Initialize creation/update times for new records;
  maintain `updated_at` on actual changes. Preserve `created_at` and successful
  `paid_at` through refunds and duplicate events. Map trustworthy existing payment
  timestamps and keep unknown legacy history distinguishable; finalize the
  nullable/backfill policy before migration. Acceptance must cover unpaid creation,
  payment success, refund updates and webhook replay. Isolated legacy-to-target
  mapping and pre-evaluation runtime tests pass these cases; the real Preview payment
  has all three timestamps. Cross-service adoption and historical gaps remain TODO.
- [ ] **TODO — English business emails and no application locale (November 6, 2026):**
  follow the [language policy](email-templates.md#planned-language-policy). The
  target application omits `locale`; do not add a replacement business-language
  preference. Automatic confirmation, payment, fee-update, result, information
  request and access emails use English, independently of the form language.
  Page language stays in URL/browser preferences; translation source/target
  languages remain business requirements. Update existing locale-dependent
  consumers before any later schema removal. Acceptance must cover submissions
  from English/Chinese/Spanish pages, delayed/retried emails without a browser,
  valid access links and continued frontend language switching.
  The core master/snapshot omits locale; new core pre-evaluation confirmation/result
  emails are English and were delivered from a Chinese-page hosted journey. Other
  services, old cohorts and the full language/access-mail matrix remain TODO.
- [ ] **TODO — Service details and translation fulfillment (plan recorded November 6, 2026):**
  implement the [planned `aet_service_detail` model](migration-architecture.md#planned-service-details)
  in runtime adapters. The phase-one table/constraints exist; use typed/validated `details`
  payloads and composite uniqueness on `(application_id, service_type)` initially.
  Add optional text `notes` for customer remarks per service (initial 3000-character
  limit); use it instead of `details.instructions`. Preserve the original single
  intake note on its primary service row and keep staff/payment notes separate.
  Verify notes survive confirmation, persistence and CRM/Status reads without
  being copied into unrelated service rows.
  Evaluation plus translation use separate service rows under the same Application
  ID; pure translation creates no education rows and shares documents/payments.
  Add `amount_cents` (nullable), `currency` and `pricing_source` for simple pricing.
  Verify server-side automatic calculation, authorized manual entry, unknown vs.
  zero amounts, single-counted shared shipping, unchanged historical prices,
  preservation of manual amounts, and locked open/paid Checkout amounts.
  Add nullable JSONB `result` for current output, document references and release
  metadata, following the [delivery contract](database-migration-plan.md#service-delivery-result).
  Verify text-only pre-evaluation, evaluation PDF and multi-file translation;
  null/draft results stay private, same-application document references and exact
  delivered revisions are validated, and payment/current-input guards remain.
  Preserve old release history and verify publication/email retries do not
  regenerate output or duplicate notifications. No separate deliverable table.
  Resolve the master-table/legacy mapping, then connect requirements, staff pricing,
  payment and delivery to CRM/Status. Acceptance must cover pure translation and
  combined service requests. Basic zero-education and combined-service storage
  passed locally; end-to-end translation/formal fulfillment is still TODO.

Guides: [intake acceptance](credential-intake-testing.md),
[earlier formal pilot](evaluation-application.md), [email](email-templates.md).
Do not remove v2 workflow guards merely to expose older pilot actions.

## Shared operations and compatibility

- [x] Support English-only staff URLs, password login, office permissions, live
  CRM edits, Test views and document/payment details; retain the restored GPA URL.
- [x] Persist office/application Dropbox locations and preserve historical file
  reads across profile edits. Keep existing customer folders intact.
- [ ] **TODO — Shared `aet_documents` and Dropbox ID tracking (plan recorded November 6, 2026):**
  implement the [file-only index and scan-on-open design](dropbox.md#planned-shared-document-records)
  in runtime upload/lookup/scan adapters. The phase-one index and explicit metadata
  import are rehearsed; keep only file rows, identified by storage connection
  plus Dropbox File ID. No Folder ID, folder rows, location `kind`, `is_folder` or
  `document_locations` in the target; no storage fields on the application master.
  Omit `document_type` and `deleted_at`; file paths remain cached metadata.
  Support authorized [File ID lookup](dropbox.md#file-id-lookup). Derive candidate
  scan directories from current file metadata; follow the [staff-confirmation rules](dropbox.md#directory-resolution-without-folder-ids)
  for empty/existing applications, unavailable IDs, changed paths, conflicting
  parents or uncertain scope. Do not automatically associate a shared directory's
  other files with the application. Derive the first-upload path for new applications
  from office, Application ID and applicant name; register returned File IDs.
  Acceptance must cover whole-folder moves, a single file moved to a shared folder,
  staff directory confirmation, File ID search, unknown/inaccessible IDs, direct
  Dropbox additions, pagination, repeat scans without duplicates and controlled
  customer/report access. Reconcile current registry/legacy readers before cutover.
  Schema and explicit test-metadata backfill are rehearsed locally. Automatic
  discovery/lookup/scan adapters, hosted backfill and cutover remain TODO; no real
  file moves or background synchronization were performed.
- [ ] Enable the East Dropbox app's required read permission and refresh its
  authorization as needed; recheck Boston/New York download bytes. Apply the
  existing location-registry migration wherever current code requires it; this
  current-runtime dependency is separate from the file-only target design.
- [ ] Verify the latest document counts, file sizes, upload/email copy and staff
  interactions at the actual hosted commit. October 20 acceptance predates fixes.
- [ ] Verify the first automatic Production payment-expiry execution. Its recorded
  dashboard-triggered runs passed; keep the old GitHub task disabled. This is
  separate from deferred email automation.
- [ ] Preserve the three legacy checkout/return/success paths and remaining
  standalone staff-tool links, including query parameters. Verify old email
  links against representative records. GPA was restored; do not count it as a
  missing route based on the earlier audit table.
- [ ] Decide and authorize legacy employee migration/cutover only when needed;
  both switches stay off until then. Recheck native staff/office access at rollout.
- [ ] Define remaining CRM import, standalone payment-draft, reporting and export
  requirements before claiming complete old-app parity; existing CSV is not a
  complete replacement for every historical tool.

Guides: [staff](staff-auth.md), [Dropbox](dropbox.md),
[payment expiry](payment-expiry.md), [old app URLs](app-url-compatibility.md).

## Website and production cutover

- [x] Implement the retained website pages, shared locale architecture, pricing,
  office catalog, assets and SEO foundations; keep source inventories available.
- [ ] Review retained content and its language coverage: prices, timing, office
  facts, membership/acceptance claims, legal wording and dated blog material.
  Preserve the intentional English-only imported blog bodies and legal pages.
- [ ] Resolve publication-sensitive AICE wording and other documented source
  conflicts. Missing/deferred source material is not automatically approved for
  publication or deletion. See [blog screening](migration-blog-screening.md).
- [ ] Verify retained navigation, language links, samples/downloads, assets,
  contact actions, payment recipient routing and transaction return behavior on
  the intended deployment. Follow the [SEO checklist](seo-checklist.md).
- [ ] Reconcile current main/dev histories at the next authorized integration;
  confirm which commit each environment runs. Do not use historical ahead/behind
  counts or commit ancestry alone as proof of equivalent deployed behavior.
- [ ] Rehearse migration on controlled data: application/payment counts and
  amounts, education, file links, audit history and staff access. Define backups,
  final synchronization/write freeze and a tested rollback procedure.
- [ ] Configure and verify the public/app hostnames, root/wrong-host routing,
  production origins, access links, payment callbacks and email routing in an
  explicitly authorized cutover. Preserve `/admin/CRM` on the existing app host.
- [ ] Preserve Search Console ownership and analytics configuration; verify
  official-host redirects, metadata, crawl controls, events and payments. Submit
  the sitemap and inspect indexing only after the appropriate authorization.
- [ ] Complete customer/staff production acceptance and reconciliation before
  stopping old-app writes, retiring its deployment or archiving its repository.

The detailed retained-page checklist remains available in the
[historical page inventory](archive/migration-checklist-2026-10-22.md#p0--20-shared-destination-pagessections-linked-by-the-new-homepage).
Its unchecked entries often mean final content/launch acceptance, not missing pages.
Preserve the [legacy URL inventory](seo-legacy-urls.md); retained URLs must have
working destinations when the old public host is replaced.

## Deferred by owner

- [ ] **TODO — Customer accounts and application ownership (November 6, 2026):**
  revisit only when a customer account system is needed; this is not a current
  release gate. No user tables, ownership columns, migrations or login features
  are to be implemented for this planning item now.
  The intended starting model is one customer user owning multiple applications.
  Prefer adding a nullable `customer_user_id` foreign key to the application
  master table when implementing accounts; guest and existing applications may
  remain unlinked. Preserve existing Application IDs and dependent file/payment
  links; do not store an array of application IDs on the user record. An explicit
  user/application association table remains an alternative if shared ownership
  becomes a requirement; organization/member access is deferred.
  Use a stable user ID for ownership, not an email address. Preserve the submitted
  application contact email separately from the changeable account email, and
  do not make application email unique. Keep customer ownership distinct from
  the evaluated person's identity and staff activity. Future implementation must
  include authenticated ownership assignment, verified claiming of guest
  applications and server-side access checks; matching a supplied email alone
  must never grant access. Choose the account/auth table integration at that time;
  do not assume the existing Payload or staff user tables are customer accounts.
- [ ] **TODO — F5 email automation:** reconsider only when operational checks show
  a substantial unsent-email backlog or recurring failures. No further design,
  implementation, scheduler activation or new monitoring now. Existing code is
  retained as a [disabled implementation reference](preeval-email-recovery.md).
- [ ] Revisit additional AI mapping/tuning only if the accepted baseline changes.
- [ ] Revisit unmigrated legacy content/assets if requested: extra Visa material,
  office/language landing pages, excluded services and other held URLs. These are
  not current release gates. Preserve the [original deferred inventory](archive/migration-checklist-2026-10-22.md#deferred-legacy-page-backlog--not-a-current-release-gate)
  and [blog dispositions](migration-blog-inventory.md). Do not silently delete
  old content or redirect it to unrelated pages.

Update the relevant item in place. Link detailed dated evidence instead of
copying test transcripts or adding another full progress report to this file.
