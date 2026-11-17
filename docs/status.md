# AET Implementation Status

## 2026-11-11 — Evaluation feed trial file

- Added `public/ads/aet-evaluation-feed.csv` with two standard evaluation
  offerings, using the website's listed estimated prices of USD 100 and USD 180
  and processing times of 7 and 8 business days. Descriptions retain the estimate
  qualification; fixed payable totals and service-category eligibility remain
  unverified. Availability reflects the services offered on the public site,
  not a verified fulfillment-capacity check.
- Validated two unique item IDs, all ten columns, UTF-8 CSV round-trip parsing,
  price formats and HTTPS URLs. Both public image URLs and the evaluation page
  returned HTTP 200; image responses were PNG.
- Prepared for the owner's manual upload trial only. No Feed upload or campaign
  activation was performed.

Updated November 12, 2026. The owner now requires **pre-evaluation and credential
evaluation to launch together through `/application`**. The dedicated pre-evaluation
journey is verified on earlier dev Preview; the unified pre-evaluation choice is
now verified end to end on main Preview at `67a9cf1`. The unified credential
journey also passed main Preview acceptance on November 12, including staff review,
payment and manual PDF publication. Both use the six-table model. Translation remains deferred;
Production has not been activated for these new workflows.
This is the current summary, not a release log.
See the [active checklist](migration-checklist.md) for tasks and
[documentation index](README.md) for module guides.

The staff email gallery and CRM Tools link now require `EMAIL_PREVIEW_ENABLED=true`;
the default is closed, independently of customer application release. See
[email gallery configuration](email-templates.md#gallery-release-switch).

## Terms and document requirements — November 17

Terms of Use now states the applicant’s responsibility to confirm acceptance and
report requirements, no guarantee of acceptance, and possible original/official
electronic record requirements without state-specific limits. Both application
codebases use the general document guidance in EN/ZH/ES Status notices.
The legacy notice’s isolated local component preview passed in-app desktop and
390px mobile checks, including expand/collapse and wrapping. The website’s
`/terms` page returned 200 and displayed the new clauses in the in-app browser
when the dev server was bound to `localhost`.

## Guarded main integration — November 12

Dev is integrated into main and the guarded main deployment is live. New
application workflows remain closed in Production, public application links retain
the old portal, and Calendar remains public. CRM requires employee sessions and
office authorization. Missing Production staff configuration remains fail-closed.

A dedicated [main Preview](https://aet-main-preview-meiyutechs-projects.vercel.app/zh/application)
now reuses the former dev test configuration. Formal form/review, existing synthetic
pre-evaluation lookup/result/document download and a direct Stripe test webhook
replay passed. Anonymous CRM access is blocked. After owner login, Live/Test list
loading, synthetic-record ID search, office filters and Test detail sections
passed. The current account sees three offices; its Live pre-evaluation list is
empty, consistent with the explicit Unassigned-access rule for legacy records.
No access grants were changed. No new formal submission/email or fresh payment
journey was run in that check. Unified pre-evaluation was subsequently connected
locally; that change is not covered by the earlier hosted acceptance. Production deployment, aliases and environment variables were
verified unchanged by this Preview setup. Source fix `eac0b3c` is integrated into main. See [Preview acceptance](archive/main-preview-2026-11-12.md),
[local integration verification](archive/guarded-main-integration-2026-11-12.md) and
[prior main release history](archive/main-releases-through-2026-11-12.md).

## Current stage

**Both evaluation journeys now work on main Preview. The next milestone is
credential Production-runtime support and joint release readiness.**
The unified entry reuses pre-evaluation upload/AI/payment/result handling.
Credential v2 intake now connects staff review, missing-material requests, fee
confirmation, Stripe test payment and manual PDF publication. The owner can review
the completed synthetic application in CRM Test; no Production activation occurred.

The pre-evaluation Production-capable runtime and its
[configuration plan](pre-evaluation-production-plan.md) are prepared, not activated;
credential intake/fulfillment still needs Production support. Extend the plan for
both services, confirm office ownership and complete separately authorized live
acceptance before opening public entry links. The owner accepts existing mobile result/status checks and will handle
refunds manually in Stripe Dashboard; no refund UI/API work is planned.
Old Production tables/data remain long-term alongside the new schema and existing
Preview tables. There is no deletion date or authorization to remove old tables.
The six-table count describes the new business model, not the whole project.

## Unified entry — main Preview accepted, November 12

New pre-evaluation applications now start at `/application?service=pre-evaluation`.
The old dedicated form URL redirects there; existing application IDs, status,
upload, checkout and result links continue to work. `/apply` redirects to the
formal choice after its existing release gate. Public Production CTAs and release
gates are unchanged.

The form saves contact/organization, phone, handling office, applicant identity,
residence country, one education and customer notes in existing canonical fields.
Review includes USD 19.88 and required terms. Successful submission opens the saved
application's document section; AI waits for upload completion or an explicit
no-documents choice on a pristine application. Failed uploads cannot be skipped.
Office-scoped CRM shows the saved contact fields and customer notes.

Local checks: 111 focused tests plus 31 six-table integration cases passed,
including submission retry/conflict, office visibility, upload, AI, payment,
result release and deduplicated mail using a disposable PostgreSQL database and
provider doubles. TypeScript and locale checks passed. In-app desktop/390px checks
covered the three-step form, fees, terms validation, draft restore and old-entry
redirect. Those local checks used no hosted providers.

The subsequent [main Preview acceptance](archive/unified-preeval-preview-2026-11-12.md)
passed a fresh unified application, PDF upload/download hash check, AI analysis,
USD 19.88 Stripe Sandbox payment, automatic result release, two delivered English
emails and authenticated CRM Test list/details. Existing direct test webhook is
unchanged; Stripe reports zero pending webhooks. Production deployment and
configuration remain unchanged. Translation submission is still deferred.

## Credential fulfillment — main Preview accepted, November 12

A new synthetic `/zh/application?service=evaluation` submission completed contact,
education, Course-by-Course selection, translation add-on and paper mailing details.
Staff requested a transcript, confirmed USD 210 catalog fees plus USD 35 translation,
and saw the real Sandbox payment update automatically through the existing signed
webhook. Processing before payment was rejected. The staff-uploaded PDF remained
private until explicit release; the customer then downloaded the identical file.
Confirmation, information request, fee update, payment and report emails each reached
the controlled test recipient once, with no office CC. No tables or cron were added.

[Acceptance evidence](archive/unified-credential-preview-2026-11-12.md) records the
synthetic ID, provider receipts, checks and limitations. Formal reports are prepared
by staff; postal dispatch remains an office task using the saved address. Production
runtime/configuration and real-customer acceptance are still open.

## Module progress

| Module | Implemented / recorded evidence | Still open |
| --- | --- | --- |
| Public website | Localized service pages, shared pricing, content migration, redirects and SEO foundations | Retained-content review, official-host acceptance and ownership/indexing checks |
| ChatGPT Ads measurement | Public page-view and Blog CTA click measurement retained from main; isolated from customer/staff routes | Real Pixel receipt and Ads Manager conversion-event setup; no completed-lead instrumentation |
| Shared database | Six shared tables serve Preview pre-evaluation and formal evaluation; all 32 old Preview source tables retired after acceptance | Prepare the same accepted structure in an empty Production target for new orders; preserve old Production tables/data long-term; history copying and translation are deferred |
| Dedicated pre-evaluation | November 11 runtime Preview journey passed at `d6d4aa2`: upload/download, AI analysis, Stripe Sandbox payment, result release, customer/CRM reads and two delivered English emails; mobile result/status lookup passed | Unified entry accepted on main Preview November 12; next: joint release configuration and authorized live acceptance, including a manual Stripe refund/state check |
| Failure recovery | Both fixes verified on hosted dev Preview: failed upload replacement, stale-finish rejection, paid-result read recovery and direct webhook replay without duplicates | Broader mobile/provider recovery is deferred; manual refund/state verification remains in controlled live acceptance |
| Unified `/application` | Three-step evaluation form, required fields, shared 2026 prices, delivery/address details, transactional formal intake and Status handoff; pre-evaluation accepted end to end on main Preview at `67a9cf1` | Joint Production runtime/configuration and release review; translation remains deferred |
| Status and documents | Formal lookup, ordinary/chunked uploads, Dropbox File ID tracking and CRM document access | East-account read scope, deployment migrations and broader hosted recovery checks |
| AICE calendar | Public `/admin/calendar` (Calendar) reads 22 dated records directly from [saved JSON](../data/aice/README.md), with month/week/schedule, organizer filters, timezone handling, contacts and source links; excludes four unverified leads and two undated records; CHEA and Montreal added November 16 ([source update](../data/aice/README.md#november-16-update)); artificial preview feed removed ([initial verification](archive/calendar-frontend-2026-11-12.md)) | Database design, ingestion, OpenAI-assisted refresh and scheduling remain deferred; historical saved sources, not a live feed |
| Shared form controls | Global custom select arrow (14px right inset, 44px text clearance) and rounded field focus halo; composite shells share one ring. Local in-app desktop/mobile checks passed for CRM sample filters, calendar and Payment; earlier application/Blog focus checks passed | Hosted deployment not performed; CRM visual check used fictional preview records |
| Link icon cleanup | Removed 33 diagonal outbound-arrow icons/text markers across website, CRM, Calendar, application samples, Payment and email preview; removed obsolete arrow-only table column and styling. Local desktop/mobile visual checks passed for CRM sidebar, calendar details and homepage service cards | Local source changes only; not deployed |
| CRM and staff | Password login, office permissions, Live/Test views, scoped live edits, document/payment details and CSV | v2 Test intake supports office-scoped review, quote and report release; legacy employee migration/cutover stays off |
| Payments | Standalone Payment, older local pilots and pre-evaluation Stripe Sandbox are separately implemented | Credential linked Sandbox Checkout/direct webhook accepted; live credential runtime and business rules remain open |
| Email | Staff-only eight-category React Email gallery at `/admin/email-preview` accepted on main Preview November 17; [verification](archive/email-gallery-preview-2026-11-17.md). Branded templates, delivery metadata and request-scoped recovery; hosted confirmation/result mail delivered to the controlled test recipient | Applicant-address routing is tested offline on dev; five formal lifecycle notifications delivered in Preview; hosted real-customer acceptance remains open; scheduled recovery is deferred |
| Fulfillment and migration | Delivery choices saved; older formal pilot can release a PDF; legacy GPA route restored | New-intake PDF delivery accepted in Preview; paper dispatch stays manual; Production cutover and old-app retirement remain open |

## Current dev runtime verification — November 11

The new `six-production` opt-in is restricted to the configured `main` Production
deployment and private `aet` schema/`aet_runtime` role. Preview keeps its current
schema, test-only Stripe and controlled recipient. Formal fulfillment remains
closed in Production. Staff membership and office authorization are retained.

Local regression: **764 passed, 174 optional cases skipped**. The new Production
mode suite includes 34 checks, with eight cases using an owned local PostgreSQL
cluster and mocked providers. TypeScript passes. That offline run used no hosted
providers. The subsequent hosted run below used synthetic Preview data and test
payments only.

Hosted dev Preview at `d6d4aa2` subsequently passed the complete synthetic
application/upload/AI/Sandbox-payment/result/email journey. Confirmation and result
mail were delivered to the controlled test recipient; CRM agrees with the customer
page. A direct official Stripe event replay left payment, AI, result version and
mail unchanged. Desktop result and 390 px mobile result/status lookup passed.
Production configuration, live payments and real-customer mail remain untested
and unchanged. A separate full mobile payment run is not required for this first
release by the owner; its prior verification boundary is unchanged.
See [hosted runtime acceptance](archive/preeval-runtime-preview-2026-11-11.md).

See [offline runtime acceptance and exclusions](archive/preeval-production-runtime-2026-11-11.md)
and [configuration guide](pre-evaluation-local.md#production-capable-runtime--implemented-on-dev-not-activated).

## Earlier shared-table hosted acceptance — November 11

Dev Preview is **Ready** with formal evaluation and pre-evaluation on the six
`aet_preview_shared` tables. `APPLICATION_CORE_MODE=six-preview` remains scoped to
Preview/dev. Four formal applications, five education rows and four Dropbox files
were migrated without changing the eight existing pre-evaluation applications.
The last twelve old formal workflow/projection tables have been deleted after a
fresh full backup, restored-copy rehearsal and hosted acceptance.
The four obsolete Preview schemas and seven unused functions have also been
removed. Preview now has one business schema, `aet_preview_shared`, containing
six tables and three active functions; staff/CRM Live and Production schemas remain.

Hosted checks cover all four formal Status links and their original quotes,
historical file discovery, CRM Test, a new idempotent formal intake, Dropbox
upload/File ID indexing and a delivered English confirmation. A browser check
identified and fixed the upload permission for `reviewing`/`needs_information`.
The existing paid pre-evaluation still passes file hash, released result, two
delivered mails, six old links and official Stripe Sandbox replay without duplicates.

The earlier real pre-evaluation payment/AI journey remains valid. Formal payment,
report release, refund ordering and concurrency were tested in isolated PostgreSQL
with provider doubles. That migration did not enable the unified v2 fulfillment UI;
the later November 12 credential acceptance above now covers it. No live charge
was performed.

Full regression: **730 passed, 174 skipped** (optional integration environments),
plus eight targeted formal cases and TypeScript. The runtime has no Production
write grants. See [formal convergence acceptance](archive/database-formal-six-preview-2026-11-11.md)
and [earlier pre-evaluation acceptance](archive/database-six-preview-2026-11-10.md).

## Earlier hosted core acceptance — November 6

Vercel dev Preview is **Ready** at `b003139`, deployment
`dpl_9CErCogfTCmRHUbR38t3KHJGwfdF`. New pre-evaluation applications use
`aet_preview_core`; existing applications continue through their compatible
readers. Isolation uses private schemas and a restricted login in the existing
Supabase project, not a separate Supabase project.

A new synthetic application completed a real Dropbox chunked upload and matching
byte download, one OpenAI analysis, USD 19.88 Stripe **Sandbox** Checkout, direct
permanent test-webhook delivery, result release and two English Resend emails
confirmed delivered. Customer results and CRM Test agree. The initial activation run retained all
nine test applications, and an older paid application's result remained accessible.
The explicit synthetic credential correctly produced “Unable to determine”; this
is workflow evidence, not an assessment-quality benchmark.

Unauthenticated protected API access returned 401 and an unsigned webhook returned
400. The runtime role has no production-table write grants. Production remains at
`fc1ab0d`, deployment `dpl_3NCtp1ZJBRYxi2puGVLg2eCuQJZR`; no Production settings,
main branch, old tables or historical records were changed.

See the [November 6 activation record](archive/database-preview-acceptance-2026-11-06.md).
The subsequent [hosted recovery run](archive/preview-recovery-acceptance-2026-11-06.md)
verified a real failed upload followed by browser replacement and one AI run.
A synthetic application-specific database fault then blocked publication after
payment without losing the saved result. Once removed, normal authorized reads
published the same result and one delivered result email; direct Stripe event
redelivery left no pending webhook or duplicate payment/analysis/mail. CRM Test
now contains 10 applications, including the recovered completed application.
No runtime patch, redeployment, cron, provider-setting change or production change
was needed. Cancellation/refund, mobile recovery, broader provider outages and
production charging remain open. Earlier checks remain in the
[October 22 record](archive/preview-acceptance-2026-10-22.md).

## Isolated convergence and the six-table launch target

The approved target is **five business tables + one AI execution table**.
After payment-event retirement, the new pre-evaluation runtime also removes
`aet_audit` and `aet_rate_limits`. It records no operation/actor history and applies
no application request-frequency quotas. No substitute table, JSON history list
or external limiter is introduced.

Current notes, result versions, material requests and confirmed test exemptions
remain on service records. The Stripe webhook, basic payment duplicate/refund
protection, saved-result recovery, staff/customer authorization and file limits
remain intact. Staff reads return an empty operation history.

The November 10 local stage had **18 tables = 6 shared + 12 formal**.
The November 11 fresh-copy formal migration and hosted cutover reduced this to **6**. The final
six-table scope excludes staff auth, legacy CMS and unrelated public/system tables.
See [six-table acceptance](archive/database-six-table-rehearsal-2026-11-10.md)
for exact checks: **389 tests across 22 files and TypeScript pass**. Earlier phase
acceptance records are historical.

Launch remains focused on application → documents → payment → result → email.
Advanced mail/payment tracking, scheduled retries and monitoring remain deferred.
Optional operation history and request limiting may be reconsidered only if future
needs justify them, without making them current launch work.

The original six-table acceptance was local-only. The November 11 hosted
acceptance above supersedes that deployment boundary: both evaluation families
use the shared tables and all 32 obsolete Preview source tables are retired.
Translation submission and Production cutover remain incomplete.

## Earlier isolated database verification

The final focused suite passes **160 tests across 12 files**, with all selected
PostgreSQL fixtures enabled, plus TypeScript. It covers phase-one backfill,
phase-two scoped reads, phase-three runtime transitions, hosted schema/role
mapping, mixed old/new cohorts, chunked upload indexing, recovery and deduplication.
These tests use disposable databases and simulated providers; the real-provider
hosted acceptance above is separate evidence.

The [phase-three runtime record](archive/database-phase3-runtime-2026-11-06.md),
[phase-two comparisons](archive/database-phase2-reads-2026-11-06.md) and
[phase-one rehearsal](archive/database-phase1-rehearsal-2026-11-06.md) retain their
original scopes. Operational AI/upload/email/session tables and the payment ledger
remain necessary. Hosted historical backfill and Production cutover have not occurred.
The explicit core opt-in is enabled only for dev Preview.

The [historical cohort rehearsal](archive/database-historical-cohort-2026-11-06.md)
used local copies of four existing synthetic Preview applications. Three with
verified Stripe payments migrated with CRM/customer/old-link parity and signed
callback/refund replay; the fourth is an audited no-charge paid-state test fixture
and remains on its old path. Four Dropbox files were reconciled read-only. The
runner now passes 30 tests across four database files, plus six tests using the
captured cohort; TypeScript passes. A v0 request-hash retry fix is local, not yet
deployed. All hosted source records and the two hosted core applications are
unchanged; this does not establish hosted historical acceptance.

## Latest integrated verification

Current results are recorded [above](#current-dev-runtime-verification--november-11).
The following list preserves the earlier recovery-integration evidence.

- **Both recovery fixes are included:** result publication (`0d9a496`, merge
  `00689cf`) and upload recovery (`476413c`, merge `adc6461`). The configuration
  refactor and command-line-only legacy test actors were preserved.
- **778 tests across 51 files passed** in the recorded final integration, with
  all opt-in PostgreSQL suites enabled. Databases were disposable and providers
  were mocked. TypeScript and i18n passed (593 messages per language).
- Upload recovery had isolated desktop and 390px mobile interaction checks.
  The earlier integration-time browser check covered the pre-evaluation lookup
  page only; the later hosted primary journey is recorded separately above.
- The November 6 provider acceptance exercised real Dropbox, OpenAI, Resend and
  **Stripe Sandbox** on the deployed core runtime. A follow-up also verified hosted
  upload/publication failure recovery. Production charging remains unverified.
- The October 20 hosted acceptance predates later dev changes. A local commit
  is not proof that the same version is running on Vercel.

Evidence: [final integration record](archive/status-through-2026-10-22.md#2026-10-22--integrate-upload-recovery-into-dev),
[result-publication integration](archive/status-through-2026-10-22.md#2026-10-22--integrate-result-publication-recovery-into-dev),
[local provider journey](pre-evaluation-local.md#october-22-full-customer-journey-acceptance)
and [Stripe test payment](pre-evaluation-local.md#october-22-stripe-test-payment-acceptance).
These are existing records; documentation cleanup did not rerun those checks.

## Operational boundaries

- **Live CRM affects existing business records.** Intake preview schemas do not
  isolate Dropbox accounts or office email CC. Staff authentication, live CRM
  and intake retain separate configured database connections.
- **Email scheduling remains deferred by owner decision.** Keep F5 as TODO;
  reconsider only after a substantial unsent backlog or recurring failure is
  observed. Do not design, implement or activate further scheduling now.
- **Formal payment expiry is separate:** the October 22 record documents its
  Production deployment and successful dashboard-triggered runs. The first
  automatic scheduled run remains unverified in this record. The Preview
  acceptance did not inspect Production payment-expiry executions. See [payment expiry](payment-expiry.md).
- AI recovery, email recovery and payment expiry have separate switches and
  acceptance requirements. The architecture diagram is not an activation record.
- The legacy AET App remains needed until replacement coverage and cutover pass.
  No production migration, push or deployment is implied by this status page.

## Next milestone

Extend credential intake and fulfillment to the restricted Production runtime in
code, then complete the joint release configuration plan and office-owner review.
Prepare an additive empty Production target only when separately authorized;
preserve all old Production tables. Activate both services together after controlled
live acceptance. Translation stays on the old system. Historical import, richer
tracking and scheduled email recovery remain deferred.
Detailed tasks belong in the [active checklist](migration-checklist.md).

## Documentation maintenance

The October 22 cleanup separates current status, next actions and historical
evidence. The [archived status log](archive/status-through-2026-10-22.md) retains
the prior implementation/verification history; the [archived checklist](archive/migration-checklist-2026-10-22.md)
retains the detailed page inventory and original decisions. Do not read old
unchecked boxes as newly requested work. Existing architecture diagrams remain
in [one maintained reference](migration-architecture.md).

The design entry is `docs/design/README.md`, alongside the website and business
UI patterns in the same directory; email visuals live with the existing email
guide. Service-specific Hero labels supersede the old generic pair, and changing implementation milestones
link to current status instead of being repeated in the design rules. No UI or
business behavior changed during this documentation work.

Documentation-only validation: all 51 Markdown files and 576 relative links/heading
anchors were checked with no broken destinations. The core design guide is 139
lines (previously 674); its 11 color tokens and the moved email design were
preserved, and Hero labels match the current locale source. Historical records
and architecture diagrams were preserved during the document moves. Whitespace
checks passed; runtime/provider and browser checks were not rerun for Markdown-only edits.
