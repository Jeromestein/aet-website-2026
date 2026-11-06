# AET Migration Checklist

Planning updated November 6, 2026. Implementation evidence remains the
October 22 `dev` baseline at `adc6461`, with hosted Preview acceptance of `5d10cff`.
New planning items do not imply implementation or fresh runtime verification.
Read [status](status.md) for progress, [architecture](migration-architecture.md)
for system relationships and the [documentation index](README.md) for guides.
The [database comparison](database-architecture.md) maps legacy, current and
proposed tables/fields; its target structure remains a plan, not a migration.
The [database convergence plan](database-migration-plan.md) adds a code-backed
field audit and staged migration gates; its recommendations await review.

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
- [ ] Verify both recovery fixes in the authorized hosted setup: fail an upload,
  abandon/replace it, finish the batch and obtain one eligible analysis; after
  a saved paid result's publication failure, an authorized read recovers the
  same result without another AI run or duplicate notification.
- [x] Configure permanent direct Stripe **test** webhook delivery and its own
  signing secret on dev Preview. A new USD 19.88 Sandbox payment reached the
  hosted handler directly, completed the application and delivered the result
  email. Customer and CRM views agree. Only the dev alias has a Vercel protection
  exception; staff login and Stripe signature checks remain enforced. See the
  [direct webhook acceptance](archive/preview-acceptance-2026-10-22.md#permanent-direct-test-webhook-acceptance).
- [ ] Complete amount/ownership negative cases, cancellation/refund visibility
  and phone/desktop recovery checks; normal paid/unpaid, replay and return
  reconciliation passed in the earlier controlled hosted run.
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
- [ ] Add document readiness and office-authorized, audited staff actions for v2
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
- [ ] **TODO — Review the database convergence contract (November 6, 2026):**
  review the [field audit](database-migration-plan.md#2-field-audit-of-the-five-core-entities)
  and [simple pricing, delivery and operational-record plan](database-migration-plan.md#3-additional-tables-and-records).
  Decide missing birth/residence/submission/version fields, per-service workflow
  fields, document access/revision metadata and payment-ledger completeness.
  Use `aet_service_detail.amount_cents`, `currency` and `pricing_source` for
  automatically calculated or staff-entered prices; no service `quote` JSON or
  separate `aet_quotes` table. Freeze the amount/currency on the payment record.
  Keep current delivery information in nullable `aet_service_detail.result`;
  do not create `aet_deliverables`.
  Preserve existing history and resolve namespace/historical exceptions before
  SQL implementation. The proposed diagram now includes simple pricing fields
  and `result`; other proposed field additions remain under review.
- [ ] **TODO — Rehearse a reversible database migration:** follow
  [phases 0–2](database-migration-plan.md#5-delivery-phases-and-acceptance-gates)
  in disposable/Preview storage after implementation is authorized. Preserve
  identities, map all writers, validate backfill/permissions and compare CRM/Status
  reads with no provider side effects. Do not merge formal/translation rows into
  live public core tables while old readers assume every row is pre-evaluation.
- [ ] **TODO — Migrate by tested cohort:** use the
  [pre-evaluation-first sequence](database-migration-plan.md#5-delivery-phases-and-acceptance-gates)
  and [rollback rules](database-migration-plan.md#6-cutover-rollback-and-permissions).
  Preserve upload/publication recovery, refunds and email deduplication; connect
  formal v2 staff/payment/release deliberately, then translation. Retire legacy
  tables/bridges only after all readers, writers and callbacks are reconciled.
  Planning only: no database change, production cutover or new scheduler now.
- [ ] **TODO — Shared table naming (November 6, 2026):** use `aet_education`
  and `aet_payments` in the target design. Actual legacy/current tables retain
  `aet_core_educations` and `aet_core_payments` until a separately planned migration;
  preserve records/IDs and do not treat a rename as payment-ledger unification.
- [ ] **TODO — Application recipient address and pronouns (November 6, 2026):**
  implement the [application field definitions](migration-architecture.md#planned-application-contact-and-recipient-fields)
  in a later authorized phase. Add nullable `mailing_address` JSONB with `name`,
  `country`, `street`, `street2`, `city`, `region`, `postal`, plus nullable text
  `pronouns` to `aet_core_applications`. Require a valid address for physical
  delivery and retain evaluation pronoun validation; digital-only applications
  need no mailing address and translation need not supply evaluee pronouns.
  Preserve each application's submitted address independently of future account
  profiles. Map verified recipient values without inventing legacy data; verify
  confirmation, CRM and Status reads for evaluation and translation. Plan only;
  no database or runtime changes now.
- [ ] **TODO — Shared payment timestamps (November 6, 2026):** implement the
  [three timestamp definitions](migration-architecture.md#planned-payment-timestamps)
  in a later authorized phase. Add `created_at` and `updated_at` to `aet_payments`
  while retaining `paid_at`. Initialize creation/update times for new records;
  maintain `updated_at` on actual changes. Preserve `created_at` and successful
  `paid_at` through refunds and duplicate events. Map trustworthy existing payment
  timestamps and keep unknown legacy history distinguishable; finalize the
  nullable/backfill policy before migration. Acceptance must cover unpaid creation,
  payment success, refund updates and webhook replay. Plan only; no database or
  runtime changes now.
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
  Decision recorded only; no runtime change, database migration or deployment now.
- [ ] **TODO — Service details and translation fulfillment (plan recorded November 6, 2026):**
  implement the [planned `aet_service_detail` model](migration-architecture.md#planned-service-details)
  only in a later authorized implementation phase. Use typed/validated `details`
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
  combined service requests. This item authorizes no database changes now.

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
  in a later authorized phase. Keep only file rows, identified by storage connection
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
  This is a plan only: no database changes, backfill, file moves or background sync.
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
