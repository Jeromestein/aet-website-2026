# AET 2026 Website and App Migration Checklist

## Credential intake acceptance update — 2026-10-17

- [x] Connect unified credential-evaluation submission, unique ID/deduplication,
  transactional persistence, confirmation outbox and retry.
- [x] Verify ID/link status lookup and the same services in authenticated CRM's
  explicit isolated test-data view.
- [x] Test success, concurrency, failure/retry, permissions and source isolation;
  confirm two real Resend deliveries to `errplusone@gmail.com`.
- This recipient supersedes older `tech@meiyugroup.org` test-recipient notes for
  this credential-intake milestone only; it does not change staff authentication.
- Storage is the existing Supabase project's `aet_preview_evaluation` and
  `aet_preview_legacy` schemas. See [credential-intake-testing.md](credential-intake-testing.md).
- [ ] Production cutover and subsequent upload/payment/staff-processing milestones.


Initial inventory: September 28, 2026. Current dev checkpoint reconciled October 17, 2026
against the current working tree, Git history and recorded local verification.
Sources: the local legacy website, sibling AET App implementation, and the 2026
design, navigation and page code. App replacement is tracked separately from
the original public-page migration counts.

## Current dev integration checkpoint — October 17, 2026

This checkpoint supersedes earlier preview-only descriptions. Checked items
indicate the stated implementation or recorded test milestone, not production
readiness. Historical acceptance evidence remains in [status.md](status.md).

### Unified application and evaluation selection

- [x] Build the localized three-step `/application` preview: client/service/office,
  service details, and review, with draft recovery and conditional validation.
- [x] Add required pronouns/name/education, optional birth date and wider degree
  fields; limit evaluation offices to Miami, Los Angeles and San Francisco,
  and translation to the five US offices.
- [x] Make document/course evaluation mutually exclusive, hide uncommon services,
  place sample reports beside the choices and use shared 2026 prices.
- [x] Include starred 24-hour/same-day choices, USD 450 course same-day pricing,
  and each handling office's local 1 pm payment/document cutoff.
- [x] Add report delivery, paper copies, conditional required mailing address,
  shipping fees and the corresponding review summary.
- [ ] Connect this new entry to persisted applications, confirmation emails and
  the upload handoff. Its final submission remains disabled.
- [ ] Finalize the unified application data model and its CRM mapping. Existing
  pilots currently retain legacy-compatible business tables plus workflow tables.

### CRM, staff and customer status

- [x] Connect CRM to shared live records with office-scoped staff authorization,
  restricted edits, audit entries, detail drawers and 20-record pagination.
- [x] Add completion estimates and canonical English-only staff routes.
- [x] Restore localized formal `/status?applicationId=ID` lookup, including client,
  evaluee and linked education fields, without exposing internal notes or reports.
- [x] Add status-page document selection and payment-method previews with explicit
  disconnected states and links to the existing portal.
- [ ] Connect customer-status file lists/uploads, detailed service/delivery data
  and payment execution. Current file selection stays on the customer's device.
- [ ] Complete new live intake, document/payment operations, customer messaging
  and report delivery in the new CRM before retiring the previous workspace.

### Business integration and release

- [x] Retain recorded end-to-end pre-evaluation sandbox acceptance and the formal
  evaluation local pilot; these are separate from the new unified form.
- [ ] Enable and validate production integrations. Current cloud-preview mode
  blocks external mail delivery, Stripe, Dropbox and AI; staff cutover is off.
- [ ] Complete automated formal notifications, paper dispatch and the translation
  order workflow.
- [x] Integrate main through `902657b`, including its newer payment, navigation
  and public-site changes, into dev. Verify type safety, 266 tests, localized
  messages, mocked payment/contact checks and local browser smoke checks.
- [ ] Verify the unified pre-evaluation journey from submission through files,
  payment, email records, CRM handling and customer results before expansion.
- [ ] Complete legacy URL compatibility, domain/callback configuration, production
  acceptance and rollback preparation before replacing AET App.

## Application URL compatibility review — October 16, 2026

- [x] Record the October 15 comparison with the legacy AET App and 23 local GET
  checks. The three pre-evaluation URLs retain their paths and Application ID;
  Chinese customer redirects preserve the query. Staff URLs remain unprefixed.
- [x] Separate application compatibility from the public website's 448-path
  inventory. See [the route mapping and evidence boundaries](app-url-compatibility.md).
- [x] Restore legacy `/status?applicationId=...` for formal applications locally.
  `/status-check` remains pre-evaluation-only; production host cutover is pending.
- [ ] Preserve `/checkout`, `/checkout/return` and `/checkout/success`, including
  their application/payment parameters and intended behavior.
- [ ] Map the four legacy standalone CRM tool URLs, which currently return 404.
  An integrated CRM feature does not by itself preserve its old entry URL.
- [ ] Verify old email links against representative records, integration callbacks
  and actual app/public host routing before an authorized cutover.

## Pre-evaluation customer experience — October 15, 2026

- [x] Restore the legacy account-free flow: confirmation email with Application ID
  and reusable link; direct ID lookup without another email or registration.
- [x] Retain the three form steps, required fields, optional documents and USD
  19.88 total. Add tab-local draft restoration and Start over using the new theme.
- [x] Include education/fees in confirmation and the paid result/reasoning in
  result mail. Prevent legacy education output from exposing an unpaid result.
- [x] Verify 44 focused unit tests, 31 customer API assertions, 21 service API
  assertions, TypeScript, locale completeness, desktop/390px views, real sandbox
  payment, Dropbox byte round-trip, Codex processing and Resend delivery.
  The shared 3022 configuration changed during acceptance; remaining local checks
  used a temporary 3023 snapshot, now stopped. See [acceptance details](pre-evaluation-local.md#customer-flow-acceptance--october-15-2026).
- [ ] Production configuration, hosted AI/queues, live-payment/email routing and
  data/domain cutover remain outside local acceptance.

## Staff routing and local worktree checkpoint — October 15, 2026

- [x] Keep staff login, access confirmation and dashboards English-only, without
  language selectors or language-prefixed browser URLs. Preserve `/admin/CRM`.
- [x] Redirect old `/en/admin/*`, `/zh/admin/*`, `/es/admin/*` and lowercase CRM
  links to canonical staff URLs, preserving query parameters and website language.
- [x] Use `/admin/access` for new staff email links; retain email-link authentication
  and multilingual customer pages. No simplified-login alternative was implemented.
- [x] Verify 28 local route assertions and desktop/mobile login views on port
  3022. Authenticated dashboard and real email-link checks were not repeated for
  this routing change; see [the dated evidence](status.md#english-only-staff-routes--october-15-2026).
- [x] Document the dev worktree, owner-managed VS Code startup, port 3022 and
  ignored local configuration. Branches share history and are integrated by Git
  merge; they are not separate permanent website/backend applications.
- [ ] Implement and verify hostname routing for the proposed one-project,
  two-domain deployment. Preserve the full legacy dashboard address
  `https://app.americantranslationservice.com/admin/CRM`; specify host/root
  redirects and avoid exposing locale prefixes on staff pages.
- [ ] Configure Vercel domains/DNS and production services only in an authorized
  cutover, with access links, callbacks, workers, acceptance and rollback covered.
  The legacy AET App remains operational. See [the deployment proposal](../README.md#application-domains-and-staff-urls).

The dated checkpoints below retain earlier implementation and verification
history; older branch commit IDs and preview-only descriptions are not current
worktree status.

## Pre-evaluation checkpoint — October 2, 2026

The owner-approved local pre-evaluation workflow is implemented and its complete
customer/staff journey has passed local acceptance. See
[local setup and verification boundaries](pre-evaluation-local.md). Direct AI
replaces the old OCR stage; paid results are automatic with staff correction.
All test and administrator email uses `tech@meiyugroup.org`; office partitioning
is omitted. Three historical records were inspected read-only, without bulk import.
Production deployment, full data transition and formal evaluation remain separate.

## Formal application checkpoint — October 2, 2026

The formal evaluation form-first milestone is complete locally: four localized
steps, multiple education/service selections, shared website prices, report and
shipping options, draft restoration, validated persistence and private confirmation.
The local workflow also covers private uploads, Stripe test checkout, staff review,
confirmed quotes and manually prepared PDF report release. Automated notifications,
report authoring, paper dispatch and production launch remain outstanding.
See [scope and verification](evaluation-application.md).

## Website checkpoint — October 1, 2026 (historical)

### 1. Completed

- [x] Implement the original 20 shared destination pages/sections, 80 retained
  Blog articles and the 28-entry Institutions directory. Language variants use
  shared Next.js templates; they are not additional page-building tasks.
- [x] Prepare the 448-path legacy inventory, 277 permanent redirects and SEO
  configuration for 133 indexable pages. Local route/link/SEO checks are recorded
  in [status.md](status.md); they do not establish Google indexing or final business approval.
- [x] Audit the deployed Vercel baseline and prepare locally verified corrections
  for 15 embedded legacy links, preview noindex and Blog checker false positives.
  These corrections have passed local checks; hosted release remains pending.
- [x] Build and locally verify the interactive CRM preview, including office
  badges, education/service detail entries and full update dates. Commit
  `e67dbc1` is on local `dev`; local `main` remains at `3f81ccb`. The CRM uses
  fictional data and is not an operational backend.

### Deferred by owner — October 1, 2026

Unmigrated legacy content, including the 71 content URLs and nine PDF entries,
is postponed for possible future pages. It is not a current task, owner decision
or release blocker. Preserve the inventory and original sources for later use.
This scope decision supersedes earlier pre-cutover review requirements for that
unmigrated material, including the detailed backlog notes below. It does not
approve deleting the sources or mark the content as migrated.

### 2. Next actions

- [x] On `dev`, complete the local [pre-evaluation pilot](#first-end-to-end-milestone--pre-evaluation)
  below: customer submission, durable application/education records, private
  files, test payment, email delivery, staff review and result release.
- [ ] Release the prepared corrections through the authorized deployment workflow
  and verify them on Vercel; keep security-checkpoint-blocked checks explicitly open.
- [ ] Finish acceptance of the currently retained content, payment and application
  flows. Unmigrated legacy content is deferred, not part of this release.
- [ ] Prepare formal-domain cutover and rollback, preserve ownership verification,
  then validate redirects, assets, crawl controls and transactions on the actual host.
- [ ] Submit the new sitemap in Search Console and record post-cutover indexing,
  crawl errors and traffic changes. No automatic monitoring is scheduled.

### 3. Owner decisions and actions

- [ ] Approve unresolved business claims and arrange payment/application acceptance,
  including confirmation of the four payment recipients.
- [ ] Provide Search Console access or perform its export, verification and
  submission steps personally.
- [ ] Authorize push/deployment or publish personally, and choose the
  formal-domain cutover window after the outstanding launch gates are resolved.

The [SEO checklist](seo-checklist.md#current-checkpoint--october-1-2026) contains the
detailed execution order, suggested decisions and acceptance criteria. Existing
decisions on the official domain, shared i18n and Blog biography exceptions remain unchanged.

## Scope and current status

The destination is `aet-website-2026`; the content source is
`server-54.213.58.23/americantranslationservice.com`. Other company websites
(Meiyu Group, Jiahua, immigration, and cryonics) are outside this AET migration.

The original homepage inventory identified **20 distinct destination pages/sections**,
including the blog index but not individual articles. **All 20 now have local
implementations** in the working tree, including the complete **Institutions**
directory. Implementation presence is not final acceptance:
the service, Contact and Payment items below retain their outstanding checks.
The four office pages are committed as `20ef0ab`, with local verification
recorded in `status.md`. The source inventory also contains **109 blog article
PHP entry points**; these are not 109 completed migrations.

| Current milestone | Status |
| --- | --- |
| About AET | Local migration and browser checks complete; committed as `b39184c` |
| Career | Local migration and browser checks complete; committed as `20e8222` |
| Four footer office pages | Local implementation and recorded checks complete; committed as `20ef0ab` |
| Blog | 80 local articles; migration/order changes committed as `63293b4` |
| Full Institutions page | Local migration complete: 28 entries, three locales, search and category filters; browser checks recorded in status.md |
| SEO and old URL mapping | 448-path inventory, 277 permanent redirects and 133 indexable pages implemented and locally checked; unmigrated content deferred by owner |
| CRM preview | Interactive fictional-data preview committed as `e67dbc1` on local `dev`; desktop/mobile checks recorded in status.md |
| AET App replacement | Local pre-evaluation pilot and formal four-step application implemented and tested without Payload; formal local uploads/payment/review/PDF release implemented; production release, notifications and full data transition remain open |
| Vercel test deployment | Baseline audited; latest local corrections await release; some later hosted checks blocked by Vercel security checkpoint |
| Production release | Pending business/content review, payment acceptance and deployment |

September 30 biography reassessment: of 109 blog articles, **78 are local (60 original + 18 restored)**, **30 have other historical findings
requiring a separate decision**, and **1 visa article remains held**. Founder/director
past employment at a NACES agency is not an exclusion. Of seven standalone sources,
two English pages are also migrated (80 local articles total), three Chinese variants are source/URL
references only, and two still need review. See the
[screening report and source evidence](migration-blog-screening.md).

Build each destination once using the project's Next.js i18n architecture:
shared page templates under `app/[locale]/`, with `en`/`zh`/`es` localized content.
Chinese and Spanish are language variants of those same pages, not separate page
rebuilds or additional migration counts. Legacy translated files are content
references and old URLs to map, not additional implementation tasks.

The shared homepage is at `app/[locale]/page.tsx`; message files and locale routing
are configured for `/`, `/zh`, and `/es`. Header services and footer company/office
links now use local locale-aware routes. Legal documents intentionally use their
English-only routes. The homepage Institutions link uses the localized `/institutions` page.
Per-page browser evidence is recorded in [status.md](status.md).

An unchecked item means work remains, even when the route already exists. Checked
page items record local migration and the documented checks; they do not establish
current business claims, external transaction completion or production deployment.
Keep outstanding page-specific checks and the launch checklist below open.

P0 below is the first implementation batch because these destinations are already
exposed by the new homepage. P1 content may follow during development, but every
retained old URL needs a working destination before the old host is retired.
No new route naming convention for migrated detail pages is established here:
retain old URLs or record an explicit old-to-new redirect when a destination is
implemented. Follow the existing locale routing for all shared page templates.

## AET App replacement — dev branch

The owner chose to build the replacement inside `aet-website-2026`, keep website
content in code, and avoid both a repository merge and a new Payload dependency.
Continue CRM development on `dev`. The old AET App stays operational until its
required business workflows and data have passed replacement acceptance.
Completing the public website/SEO checklist alone does not retire AET App.
The deferred legacy content/PDF backlog remains deferred.

### Completed preview work

- [x] Establish the CRM route and workspace navigation with fictional fixtures;
  exclude it from the public sitemap and set noindex/nofollow.
- [x] Implement local search, office/status filters, sorting, pagination,
  application details, sample document review, notes and activity.
- [x] Add payment-request, pre-evaluation and document views, sample creation,
  limited CSV import/export and a GPA calculator. These are preview interactions,
  not production services; the CSV download still needs browser acceptance.
- [x] Increase text size/weight, replace client initials with office badges,
  retain separate Education/Service sections and use `YYYY-MM-DD` update dates.
- [x] Make detail entries visibly clickable and independently usable on mobile;
  verify their corresponding drawers, keyboard entry and responsive layouts.
- [x] Commit the preview as `e67dbc1` and move it to local `dev`. Restore local
  `main` to the pre-CRM commit; no branch was pushed in this workflow.

### First end-to-end milestone — pre-evaluation

Owner priority: prove the replacement through the smaller pre-evaluation
(degree-equivalency) workflow first. This supersedes the previous first milestone
that stopped at a saved application without payments/email. The pilot validates
shared infrastructure; it does not establish full credential-evaluation readiness.

The legacy implementation contains application/education persistence, a dedicated
Stripe checkout path and webhook branch, application-confirmation and result
emails, file upload, AI-assisted results, and staff status/result editing.
Code presence is not evidence that those integrations currently work in production.

Owner decisions on October 2 supersede the earlier staff-confirmed-first and
separate AI/OCR enhancement proposals. Required fields and fees follow the legacy
implementation; attachments remain optional. Direct AI results use the legacy
automatic paid-customer experience. Staff can correct them. Keep an office field
but do not partition or identify offices in this workflow's frontend.

- [x] Map the required/optional fields, USD 19.00 base fee and USD 0.88 Stripe fee,
  payment/application/result states, access and notification behavior.
- [x] Prepare isolated local Supabase and private Dropbox test storage; reuse
  existing Stripe test and Resend services without Payload. Restrict staff/test
  email to `tech@meiyugroup.org`.
- [x] Build shared English/Chinese/Spanish submission, result and status pages.
  Persist validated application, education and file records. Following the
  October 15 clarification, the complete Application ID opens the customer
  application directly through a scoped session; no customer account is needed.
- [x] Implement staff email-link login and backend permissions, and connect
  `/admin/CRM` to durable records, notes, documents, results and audit activity.
- [x] Verify Stripe test checkout, server-derived pricing, signed callbacks,
  duplicate handling, reconciliation, unpaid cancellation and checkout expiry.
- [x] Deliver confirmation/result mail to the approved inbox through Resend;
  record attempts and verify failed-send retry and result deduplication. New
  customer mail includes a reusable ID URL; lookup sends no additional message.
- [x] Generate preliminary results automatically through the existing local
  Codex ChatGPT account. Read PDF pages/images directly, record inputs/output,
  reject stale results, expose failures/retry and allow staff correction.
- [x] Pass the complete local journey: form → saved application/education →
  confirmation → optional Dropbox PDF → direct AI → real Stripe sandbox card
  payment → automatic result → result email → ID/link lookup → staff handling.
- [x] Verify denied/cross-application access, expired/reused tokens and sessions,
  duplicate submissions/uploads/callbacks, interrupted-upload recovery, invalid
  signatures/amounts/ownership, email retry and logout. Constructed refund and
  asynchronous-failure events exercise local states; they are not live refunds.
- [x] Inspect exactly three historical records read-only, retaining only a
  de-identified structural report locally. Do not migrate full history.
- [ ] Separately authorize and implement production configuration, hosted AI and
  worker operation, real-payment/email routing, data transition and cutover.
  Local acceptance does not establish those production conditions.

### Extend the validated foundation to formal evaluation

- [x] Complete the formal four-step form with multiple education/service selections,
  shared website pricing, report/shipping choices, tab-scoped drafts and review.
- [x] Validate and save formal applications in an isolated schema with idempotent
  submission, server-calculated estimates and private confirmation access.
- [x] Reuse staff authentication, persistence, private storage and Stripe test
  clients; keep formal applications, payments, access and audit records separate.
- [x] Add document review, confirmed quotes and private PDF report upload/release.
- [ ] Add automated formal email delivery, report authoring/generation and paper
  dispatch/tracking, as established by the legacy inventory.
- [ ] Add any additional required payment methods, balance adjustments, refunds,
  reminders, manual/external order import, exports and reporting. A passing
  single-payment pilot does not validate these separate workflows.
- [x] Run the formal local acceptance journey: submission, private documents,
  real Stripe sandbox checkout, staff processing, PDF release and customer download.
- [ ] Run production acceptance after configuration, data transition and rollout.

### Data transition and retirement

- [ ] Rehearse migration using a controlled dataset; reconcile application and
  payment counts/amounts, education records, file links and staff access.
- [ ] Define the final data-sync or write-freeze window, backups, domain/link
  changes, payment callback and email routing, and a tested rollback procedure.
- [ ] Complete the required business acceptance and owner-managed release;
  verify live customer/staff workflows before stopping writes to the old app.
- [ ] Retire the old deployment and archive its repository only after the
  replacement and data reconciliation pass. Preserve required historical data
  and audit records; do not delete the old repository as part of UI work.

## Already present in the new homepage

- [x] Homepage structure is implemented, now in `app/[locale]/page.tsx`.
- [x] A localized homepage scaffold and English/Chinese/Spanish message files
  exist in the working tree; their content parity and browser acceptance remain open.
- [x] Navigation retains Evaluation and six Services: Certified Translation,
  Technical Translation, Interpretation, Expert Opinion Letters, General
  Translation, and Notarization.
- [x] Homepage contains evaluation types, company facts, institution logos,
  application steps, pre-evaluation, FAQs, and client reviews.
- [ ] Recheck the homepage after replacing legacy destinations with migrated routes.

The checked items above were confirmed from source code in this inventory.
Previous visual checks are recorded in [status.md](status.md); they were not rerun
for this documentation task.

## P0 — 20 shared destination pages/sections linked by the new homepage

Paths below are relative to `https://www.americantranslationservice.com`.
For a PHP page, migrate its included `*-content.html` plus relevant metadata and
assets; the PHP wrapper and content fragment are not two separate pages.
The English legacy paths identify the content source. Each checklist item covers
one shared page and its i18n content, not three independently implemented pages.

### Evaluation and the six retained services — 7 pages

- [ ] **Foreign Credential Evaluation** — `/e-evaluation.php` → Evaluation page.
  Preserve the introduction, document-by-document and course-by-course options,
  requirements, fees, processing times, sample reports, delivery information,
  institution references, and application/pre-evaluation actions. Align its
  online application instructions with the new homepage's four steps and retain
  the source form-based instructions under Email.
  Local implementation: `/evaluation`, `/zh/evaluation`, and `/es/evaluation`
  now preserve legacy text and reuse the new Pricing module (September 29).
  The application section reuses the homepage Online / Email module: four online
  steps and three source form-based steps, with Online selected by default.
  See [status.md](status.md) for checks;
  final content reconciliation and launch acceptance remain open.
- [ ] **Certified Translation** — `/e-notarized.php` → Certified Translation page.
  Preserve document types, languages, quote/application instructions, pricing,
  sample PDFs, delivery options, and FAQs. Review the old `/apply` portal link;
  do not assume a translation request uses the credential-evaluation form.
  Local implementation: `/certified-translation` and its `/zh` and `/es` variants
  now use the shared service shell, pricing, mobile rails, native FAQ/shipping
  disclosures, and source samples. The old online link was commented out; active
  application instructions are office/email/payment. See [status.md](status.md).
  Final source-claim reconciliation and launch acceptance remain open.
- [ ] **Technical Translation** — `/e-tech-translation.php` → Technical Translation
  page. Preserve the scientific, industrial, medical, business, legal, and
  education content and its contact action.
  Local implementation: `/technical-translation`, English and Chinese source
  copy, image assets, quote email and localized navigation. Spanish has a
  clearly labeled English fallback. See provenance README and [status.md](status.md).
- [ ] **Interpretation** — `/e-interpretation.php` → Interpretation page.
  Preserve supported scenarios, languages, service coverage, and booking/contact
  instructions; carry regional content into relevant supporting pages.
  Local implementation: `/interpretation`, source booking and coverage copy,
  shared prices, peer-use cards and source images. Spanish has a labeled English
  fallback. Regional supporting pages and claim review remain open.
- [ ] **Expert Opinion Letters** — `/e-expert-opinion-letter.php` → Expert Opinion
  Letters page. Preserve purposes, fields, document requirements, fees/timing,
  FAQs, and related evaluation articles.
  Local implementation: `/expert-opinion-letters` in all three source languages,
  with shared price/shipping tables, local form PDF, article links and current
  institution carousel. The legacy page has no FAQ block to migrate.
- [ ] **General Translation** — `/e-translation.php` → General Translation page.
  Preserve language coverage and quote instructions; retain the distinction from
  Certified Translation.
  Local implementation: `/general-translation`, English and Chinese source
  explanations, shared Chinese/English rates and localized Certified link.
  Spanish has a labeled English fallback.
- [ ] **Notarization** — `/e-nus.php` → Notarization page. Preserve retained service
  content; resolve its link to the excluded China Consular Authentication service.
  Do not equate all notarization/apostille content with the excluded service.
  Local implementation: `/notarization`, English and Chinese source sections and
  fees; excluded-service referral removed. Spanish has a labeled English
  fallback. Fee and legal/process review remain open.

### Contact, payment, and company information — 5 pages

- [ ] **Contact** — `/e-contact.php` → Contact page. Verify office details, phone,
  email, QR codes, maps, and contact actions against approved business information.
  Preserve or remap anchors including `#miami`, `#boston`, `#la`, `#sf`, `#nyc`,
  and `#bj` where retained pages link to them.
  - Local implementation (September 29, 2026): English, Chinese and Spanish
    Contact routes now contain all six office anchors, source contact options,
    click-to-call/email links, directions links, and the Other Contact section.
    The owner selected `17802 Sky Park Cir` for Los Angeles across locales.
    Legacy Contact URLs redirect to the localized routes, and existing site
    Contact links point to them. The source Contact pages have no QR code, form,
    or embedded map to migrate. The four footer office-detail pages are now local
    and reuse the shared office catalog and contact component. Business verification
    of office facts remains required before launch; San Francisco and New York
    detail-page disposition remains separate below.
- [ ] **Payment** — `/e-pay.php` → Payment page with a functioning payment path.
  The old form posted to `pay/process.php`; the new server route reproduces its
  PayPal form handoff. Verify it in test mode and confirm all four merchant
  recipients before launch. Preserve approved payment instructions and terms
  links without copying merchant configuration into frontend code.
  - Local `/payment` page drafted September 29, 2026 with the legacy four office
    choices. The PHP form handoff is ported to a local server route using PayPal
    Payments Standard and server-only office configuration; no REST API is needed.
    Header and footer links now target the localized route, and `/e-pay.php`
    redirects there. Merchant routing and payment reconciliation still need
    testing before production launch.
  - September 30 verification: all 12 office/locale combinations, Other Services
    and six invalid submissions passed local checks. The PayPal Purchase details
    landing step was verified on desktop and mobile using synthetic $1 input.
    No payment was completed. Guest checkout, return/cancel behavior, merchant
    recipients and payment reconciliation still require end-to-end acceptance;
    keep this item open. See [verification evidence](status.md).
- [x] **Service Fee** — `/e-fee.php` → localized `/pricing` page, implemented
  September 29, 2026 from the owner-updated legacy fee page. Fees, turnaround,
  shipping and expert-opinion rates use shared records and reusable tables.
  Visa fees were added on October 10, 2026; proofreading and English writing are included in
  Other Services with shared pricing and localized notes. Local verification is recorded in `status.md`; production
  deployment and remaining service-page migrations are still open.
- [x] **About AET** — `/e-aboutus.php` → localized `/about`, `/zh/about`, and
  `/es/about`, implemented September 30, 2026. Preserves the legacy history,
  in-scope highlights, archival photos and client collection in the shared visual
  system. Footer entry, five legacy redirects and original section anchors are
  retained. See `content/about/README.md` and local checks in `status.md`;
  production deployment and business-claim recertification remain separate.
  Committed as `b39184c` (`feat(about): Add localized About AET page`). Checked
  all three locale routes, five redirects with query preservation, 12 image files,
  desktop/mobile layouts, card controls, photo access and language switching.
- [x] **Career** — `/e-careers.php` → `/career` (also `/zh/career` and `/es/career`),
  implemented locally September 30, 2026. All 16 roles and the entire English body
  are preserved verbatim across locales, per owner instruction. Native job
  disclosures, section navigation, mobile benefit cards and local footer links
  are implemented. See [source notes](../content/career/README.md) and local checks
  in `status.md`. Current vacancy status and application submission remain
  publication checks; this does not record a production release.

### Offices shown in the new footer — 4 pages

- [x] **Miami** — `/e-office-miami.php` → `/offices/miami`.
- [x] **Boston** — `/e-office-boston.php` → `/offices/boston`.
- [x] **Los Angeles** — `/e-office-los-angeles.php` → `/offices/los-angeles`.
- [x] **Beijing** — `/e-office-beijing.php` → `/offices/beijing`.

Local implementation is committed as `20ef0ab`. Each page has
English, Chinese and Spanish variants, shared office details, address-based map
links, and localized Contact/footer links. `status.md` records 12 locale route
checks, 12 PHP redirects, unknown-office 404s, desktop/mobile inspection and
contact-data propagation checks. PHP/HTML redirect rules are present; the recorded
HTTP redirect checks cover PHP routes. Current business details and any retained
historical claims still require publication review. Four footer links do not
establish that other offices have closed.

### Trust, legal, and publishing — 4 pages/sections

- [x] **Institutions** — `/e-credential-evaluation-partners.php` → `/institutions`.
  All 28 source entries, supporting information, 17 logos and four section anchors
  are retained in a shared English/Chinese/Spanish directory. The homepage link
  stays local and the PHP URL redirects permanently. Search, category filters,
  complete timing disclosures and responsive layouts were verified locally.
  The WCUI source image is paired with Smith Chason College rather than WCU,
  matching its artwork. Acceptance, relationship and dated admissions claims
  still require publication review; see `content/institutions/README.md`.
- [x] **Terms of Use** — `/e-terms-of-use.php` → `/terms` (local implementation).
- [x] **Privacy Policy** — `/e-privacy-policy.php` → `/privacy` (local implementation).
  Full English source text and section anchors are retained. Per owner direction,
  only English documents remain. Footer and Payment links use the English routes;
  Chinese/Spanish and legacy PHP/English HTML routes redirect. Before launch,
  review payment, analytics and data-handling statements against actual operations;
  see [legal provenance and review items](../content/legal/README.md).
- [x] **Blog index (local implementation)** — `/blog`, `/blog/`, `/blog/index.php`
  normalize to `/blog`. English, Chinese and Spanish indexes list 80 local
  articles with topic filters and search; header/footer links use the active locale.
  All 60 legacy destinations were verified September 30: 58 root HTML paths and
  two PHP paths. All 80 retained article bodies now open locally under
  `/blog/[slug]`; 157 legacy PHP/HTML aliases redirect locally. The default list shows
  28 credential-evaluation articles, with other topics in a secondary selector.
  Article bodies are English-only; surrounding index controls remain localized.
  Listing an article does not complete content approval. Production cutover
  remains pending.

## Shared i18n acceptance — part of each page migration

The site uses Next.js with `next-intl`. These checks apply to the same shared
pages listed above; there is no separate Chinese or Spanish page-building phase.

- [x] Implement each retained page's layout and behavior once under the existing locale
  routing, with localized text in the project's message/content structure.
- [ ] Review useful legacy Chinese/Spanish wording and incorporate it into the
  corresponding shared page's localized content. Resolve differences in fees,
  addresses, service scope, and instructions against the approved common content.
- [x] Replace hardcoded English legacy body links with locale-aware links.
  October 1: 246 old-host links across 39 rendered pages removed; retained
  destinations use the active locale, and ten held article targets are unlinked
  without deleting their text. All 299 page variants and local targets checked.
- [x] Map reviewed old language URLs to the appropriate locale of the shared page,
  including `/home-zh.php` → `/zh` and `/home-es.php` → `/es`.
  Held content URL dispositions remain open in the legacy inventory.
- [ ] Supply reviewed translations or an explicit fallback for missing localized
  content. Blog article bodies are English-only by owner decision and need neither
  translations nor language-availability notices. A missing old PHP file does not
  require recreating a PHP page.
- [ ] Verify language switching, translated content, metadata, `lang`, language
  alternates, fonts, and desktop/mobile presentation. Apply service exclusions
  consistently in all three locales.

### Legacy translation references and redirect sources

This table is reference data, not an additional page checklist. A dash means
there is no current PHP translation source in this inventory.

| Shared page | Chinese legacy source | Spanish legacy source |
| --- | --- | --- |
| Homepage | `/home-zh.php` | `/home-es.php` |
| Evaluation | `/e-evaluation-zh.php` | `/e-evaluation-es.php` |
| Certified Translation | `/e-notarized-zh.php` | `/e-notarized-es.php` |
| Technical Translation | `/e-tech-translation-zh.php` | — |
| Interpretation | `/e-interpretation-zh.php` | — |
| Expert Opinion Letters | `/e-expert-opinion-letter-zh.php` | `/e-expert-opinion-letter-es.php` |
| General Translation | `/e-translation-zh.php` | — |
| Notarization | `/e-nus-zh.php` | — |
| Contact | `/e-contact-zh.php` | `/e-contact-es.php` |
| About AET | `/e-aboutus-zh.php` | — |
| Service Fee | `/c_fee.html` | — |
| Terms of Use | — | `/e-terms-of-use-es.php` |
| Privacy Policy | — | `/e-privacy-policy-es.php` |

The old Chinese footer links to missing local files `e-terms-of-use-zh.php` and
`e-privacy-policy-zh.php`. The old Spanish header also links to missing local files
`e-tech-translation-es.php`, `e-interpretation-es.php`, `e-translation-es.php`,
`e-nus-es.php`, and `e-aboutus-es.php`. Resolve their URLs through the shared page's
locale routing and content policy. Missing-file observations refer to the local
checkout, not a live HTTP audit.
About now supplies a new Spanish translation and maps `/e-aboutus-es.php` to
`/es/about`; it also maps `/e_aboutus.html` and `/c_aboutus.html` to their matching
locales. These completed aliases do not close the remaining sitewide redirect audit.

## P1 — Blog, search landing pages, and supporting content

### Remaining article migration — September 30 (local migration complete)

- [x] Confirm source includes for the remaining 59 retained articles.
- [x] Import 59 English bodies, tables and images, preserving source provenance.
  Offline checks confirm unchanged prose and 57 copied image assets (100 placements across the 59 imported bodies).
- [x] Connect all 60 local articles and map 119 retained legacy URLs.
  All 180 locale/article routes and 59 image paths passed HTTP checks; redirects
  preserve query parameters. Unknown, excluded and held article slugs return 404.
- [x] Verify unchanged source prose, image/table counts, safe HTML and section
  anchors. All 60 index entries link locally; search and topic controls passed.
  In-app browser checks covered evaluation, translation, interpretation and expert
  articles, desktop reading, 390px mobile, contents links, image disclosures and
  horizontal table scrolling. Typecheck and i18n checks passed.
- [x] Update all 60 inventory entries with their local migration status and route.
  Original batch: **60/60 complete**. The restored batch below is also complete:
  **78/78 candidate bodies are local**; 30 require review and 1 visa article is held.
- [ ] Complete publication review of dated fees, timelines, office facts,
  credentials, ratings and immigration-related claims before production cutover.
  Source wording is preserved; migration does not establish current accuracy.


### Credential evaluation priority and article pilot — September 30

- [x] Sort all blog lists and filtered results by original publication date,
  newest first; place 34 undated articles after the 46 dated articles without
  inferring dates from title years or migration timestamps.
- [x] Keep blog article bodies English-only across locales. Remove article
  translation-availability banners and index language notices; no blog
  translation work is planned.
- [x] Make credential evaluation the Blog headline, featured content and default
  list (10 articles); keep all 60 candidates accessible through a secondary control.
- [x] Build a local article pilot at
  `/blog/boston-foreign-credential-evaluation-services` with section navigation,
  report-type sections, original images and a connected index/featured card.
  All locales share the English article body without language-availability notices.
  The subsequent 59-article batch above completes the retained local collection.
- [x] Verify desktop/mobile reading, section links, images, localized navigation
  and old URL mappings. HTTP and Playwright fallback checks passed September 30.
  After removing the language notices, the in-app browser also verified the
  Chinese index and pilot article successfully. Typecheck and i18n checks passed;
  see [verification evidence](status.md).
- [x] Incorporate owner feedback to keep English article content and remove
  translation-availability notices. Implementation committed as `60c415b`.
- [x] Receive owner authorization to extend the pilot to the other 59 articles.
  Final publication review is tracked separately above.

- [x] Withdraw the founder/director NACES past-employment exclusion, including
  biography references in old copies/comments and the associated NACES link.
- [x] Recheck all 48 previously excluded article families and seven standalone
  sources. Restore **18 blog candidates**; keep **30 other findings** for a separate
  decision, not as asserted AICE violations. Georgia's bare AES comment is not
  verified Academic Evaluation Services evidence.
- [x] Migrate the **18 restored English blog candidates** in the
  [article checklist](migration-blog-inventory.md). The original 60 remain complete;
  all 78 candidate bodies are currently local. Visa scope is separate.
- [x] Update the importer biography rule and catalog using reviewed source hashes;
  preserve all biography prose. Verify 240 article/locale routes and 95 image paths
  after adding the two standalone sources below.
  The 18 additions retain 75 image placements and 18 substantive tables.
- [x] Add 36 legacy PHP/root-HTML redirects; with two additional standalone aliases, all **157** redirects preserve query
  parameters, verified on temporary port 3022. The existing 3021 preview requires
  a restart to pick up the expanded redirect configuration.
- [x] Verify desktop, 390px and 320px reading, contents, search and horizontal
  tables in the in-app browser. Final evaluation list: 28; all topics: 80.
- [ ] Recover `/images/A2Z.png` if an original becomes available. It is absent
  locally and its old-site URL returned homepage HTML. Omit its two broken image
  placements in the California/San Francisco lists; retain all text and links.
- [ ] Resolve AICE-reference wording before publication if the membership application
  is under review (application page 13). Restored California, Los Angeles and Georgia
  agency-list sources contain AICE references; reinstatement is not publishing approval.
- [x] Select each retained PHP include as the body source and map the 60 PHP entry
  points plus their 59 existing root HTML aliases to one local route per article.
  The collection has 119 verified permanent redirects. Root HTML copies were
  included in exclusion screening; source text differences are not silently merged.
  Blocked URL handling remains a separate task below.
- [ ] Review `/san-francisco-foreign-language-interpreter-agency.html`, an
  additional English landing page outside the 109-entry inventory. No match was
  found in this scan; verify its content before migrating or merging it.
- [x] Migrate/map the two restored English standalone candidates,
  `/best-credential-evaluation-services.html` and `/e-credential-evaluation-for-uscis.html`.
  These are outside the 109-blog count and bring the local catalog to 80. Both
  root URLs redirect to `/blog/[slug]`. The former still has AICE-reference
  publication review; source prose is preserved.
- [x] Lift biography exclusions on `/c-california-barbercosmo-credential-evaluation-and-translations.html`,
  `/c-how-to-avoid-delays-with-foreign-credential-evaluation.html`, and
  `/c-i-140-education-evaluation.html`. They remain Chinese source/URL references,
  not additional articles under the English-only blog policy.
- [ ] Separately assess the other findings in `/expert-opinion-letter-h1b.html` and
  `/c-eb-2-niw-credential-evaluation.html`; biography reasoning no longer applies.
- [ ] Record the intended old-URL handling for all excluded articles. Do not mark
  them migrated, automatically redirect them to unrelated pages, or delete their
  existing production sources as part of this content-selection task.
- [ ] Preserve **Course by Course Evaluation** content from
  `/e-course-by-course-evaluation.html`: keep a detail page or merge the complete
  useful content into Evaluation and map the old URL. Document by Document can
  remain a section of Evaluation; a separate page is not required by the design.
- [ ] Review `/e-pre-evaluation.html` and `/e_pre_evaluation.html`; consolidate
  useful explanatory content into the homepage/evaluation page and keep the
  existing pre-evaluation tool action. A second tool implementation is unnecessary.
- [ ] Review `/e_testimonials.html`; migrate any additional relevant testimonials
  or consolidate into the homepage/About page with an appropriate old-URL mapping.
- [ ] Preserve the retained Chinese article/landing content:
  `/c-education-evaluation-for-h1b.html`,
  `/c-la-interpretation.html`, `/c-sandiego-interpretation.html`,
  `/c_medical.html`, and `/c_interpretation_case.html`.
  Remove excluded-service promotions from mixed-topic pages while preserving
  retained evaluation, medical translation, and interpretation content. Match
  translated equivalents to one content entry with localized fields; only distinct
  topics need distinct content entries, all using shared page/article templates.
- [ ] Review `/c-articles.html` as a Chinese article index; update its retained
  links. Review the dated `/c-944-article.html` separately before deciding to
  retain, rewrite, or retire it; do not copy it as current guidance.
- [ ] Reconcile older `c_*.html`, `e_*.html`, `/es-evaluation.html`, and other
  historical aliases against the current PHP pages and the old sitemap. Reuse
  unique relevant content; do not create a second page for every legacy filename.

## Deferred legacy page backlog — not a current release gate

- [x] **Visa Services main page** — restored October 10, 2026 at `/visa-service`
  and `/zh/visa-service`, with English content fallback at `/es/visa-service`.
  The four PHP/HTML main-page entry points redirect locally. Shared pricing,
  Services navigation and footer entry are included.
- [ ] **Additional Visa material** — dedicated `e_chinavisaservice.html`,
  `c_chinavisaservice.html`, `/c-schengen-visa-article.html`,
  `/new-york-visa-application-process-services.html` and Boston Visa articles
  remain separate migration decisions. The main page retains its source's
  China-details link to the legacy site.
- [ ] **Editing/Proofreading** — keep out of the rebuilt service scope.
  Resolve `/e-writing.php`, `/e-writing-zh.php`, their older HTML aliases, and
  `/c_paper.html`.
- [ ] **China Consular Authentication** — keep out of the rebuilt service scope.
  Resolve `/e-authentication.php`, `/e-authentication-zh.php`, their older aliases,
  `/c_threecertification.html`, `/c-authentication-article.html`,
  `/c-authentication-article2.html`, and `/c-chinese-authentication-article.html`.
- [ ] **San Francisco and New York office pages** — review
  `/e-office-san-francisco.php` and `/e-office-nyc.php`. Retain an accessible page
  or consolidate verified information into Contact. Keep the new footer limited
  to its specified four offices; do not infer closure from that design decision.
- [ ] **Other language sites** — review `/french/`, `/german/`, `/korean/`,
  `/russian/`, and the older `/spanish/` pages. These are outside the new language
  selector, not automatically approved for deletion. Decide on retention,
  language-appropriate consolidation, or retirement when this deferred work resumes.
- [ ] Exclude backup/test files, raw content fragments, old standalone headers/
  footers, database libraries, and admin/payment implementation files from the
  public page migration. Preserve required backend behavior separately.

The service removal recorded on September 28 applies to the rebuilt homepage's
service presentation. It does not authorize deleting old production content.
For retired URLs, select a genuinely relevant replacement or an intentional
retirement response; do not redirect every removed URL to the homepage.

## Preserve the existing application portal

- [ ] Keep **Apply Now / Online Application / Start Application** linked to
  `https://app.americantranslationservice.com/credential-evaluation-application`.
- [x] Preserve the production **Start Your Pre-Evaluation** portal destination.
  The local pilot homepage uses `/degree-equivalency-tool` only when
  `PREEVAL_ENV=local`; switching the production destination remains a release task.
- [ ] Verify the handoff to existing application/status/upload and checkout flows
  after the website changes. These remain in `aet-app`; they are not marketing
  pages to copy into the new website.
- [ ] Review older application links encountered during content migration,
  particularly the Certified Translation page's app `/apply` link, against the
  intended service flow. Do not redirect all service applications to one form.

## Shared assets, design, and launch completion

- [ ] Reuse the new header/footer, logo assets, typography, colors, page widths,
  spacing, buttons, and mobile navigation across migrated pages. Use suitable
  service, article, office, and policy layouts rather than copying old page CSS.
- [ ] Preserve approved wording, testimonial attribution, and the distinction
  between preliminary assessment and formal evaluation. Review conflicting or
  outdated prices, timing, addresses, acceptance claims, and memberships before
  carrying them into production.
- [ ] Migrate linked assets, especially `/down/applicationform.pdf`,
  `/evaluation_report.pdf`, `/cbcevaluation_report.pdf`, translation sample PDFs,
  office images/maps, and institution logos. Check downloads after route changes.
- [x] Create an explicit redirect inventory from the legacy `.htaccess`, current
  public routes, old sitemap, and linked historical pages. Include `/`,
  `/index.php`, `/home.php`, `/english.html`, `/chinese.html`, old underscored
  service URLs, office aliases, and root HTML article URLs. Preserve case/spelling
  where incoming links rely on it, including `credential-evaluation-for-emloyment`.
  Inventory: 448 paths and 277 configured permanent redirects. Held paths remain
  review items; inventory completion does not approve their publication or retirement.
- [x] Resolve the existing `/office-locations.html` redirect: both it and the
  former missing `/office-locations.php` now point to `/contact`. Unknown routes
  return real 404 responses instead of the old homepage-as-404 fallback.
- [x] Rebuild `sitemap.xml` (and map `/sitemap.html`), canonical URLs, page titles,
  descriptions, language alternates, and appropriate structured data around the
  approved destinations. Local SEO acceptance covers 133 indexable pages.
- [ ] Preserve relevant verified site-ownership/analytics configuration and
  validate it after deployment. The local old sitemap has 208 entries and is
  not a complete or validated list of Google-indexed pages.
- [ ] Verify every new navigation, language, footer, in-page, download, blog,
  contact, and application link. Test redirects for loops, chains, and missing
  destinations. Review desktop/mobile pages in the Codex in-app browser, including
  long tables, FAQs, language text, and office/contact states.
- [ ] Before switching the production domain, ensure all retained paths are served
  by the new site or a deliberately retained legacy host. Keeping an absolute URL
  to the same replaced domain does not keep the old page alive.
- [ ] Complete owner-managed deployment and live checks of final routes, payment
  handoff, forms, downloads, and redirects before marking the migration complete.

## Evidence and verification boundary

- [New project scope and exclusions](../README.md)
- [2026 design baseline](design.md) and [implementation status](status.md)
- [Current navigation](../components/navigation.tsx),
  [footer](../components/site-footer.tsx),
  [institution link](../components/institution-carousel.tsx), and
  [homepage](../app/[locale]/page.tsx), and [locale routing](../i18n/routing.ts)
- [Legacy source directory](../../server-54.213.58.23/americantranslationservice.com/),
  [redirect rules](../../server-54.213.58.23/americantranslationservice.com/.htaccess),
  and [sitemap](../../server-54.213.58.23/americantranslationservice.com/sitemap.xml)

The September 28 source inventory found local source files/directories for all
20 original destinations and the two language homepages, plus referenced includes
for all 109 blog PHP entries. Those historical counts establish source availability,
not current live behavior. The October 1 checklist reconciliation uses current route/link
code, the 448-path inventory and existing verification records in `status.md`; browser and
HTTP tests were not rerun for this documentation-only update. Office and contact
implementation belongs to the separate `20ef0ab` commit and was not altered. No server, payment
configuration or deployment was changed, and no production build was run.
