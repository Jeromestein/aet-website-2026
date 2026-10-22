# AET Migration Checklist

Current plan as of October 22, 2026; local baseline `dev` at `adc6461`.
Read [status](status.md) for progress, [architecture](migration-architecture.md)
for system relationships and the [documentation index](README.md) for guides.

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
- [ ] Verify both recovery fixes in the authorized hosted setup: fail an upload,
  abandon/replace it, finish the batch and obtain one eligible analysis; after
  a saved paid result's publication failure, an authorized read recovers the
  same result without another AI run or duplicate notification.
- [ ] Configure and verify the intended hosted **test** webhook and signing
  secret; test amount/ownership checks, replay, cancellation and reconciliation.
  Local CLI forwarding is not hosted acceptance. Retest paid/unpaid/refunded
  result visibility and phone/desktop recovery states.
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
  reconciliation to the saved quote; expose the same payment truth in Status/CRM
  and send one receipt. Replayed events must not create another effective payment.
- [ ] Define manual/external payments, adjustments, refunds and needed additional
  payment methods before their production acceptance. Standalone `/payment` and
  older pilot behavior do not establish support in this new intake.
- [ ] Connect current-version report approval/release, eligible customer access,
  quote/payment/result notifications and paper dispatch/tracking.
- [ ] Connect the already-tested dedicated pre-evaluation flow to the general
  entry, then implement translation-specific persistence and fulfillment.
  Evolve shared contracts as these services connect; no broad database rewrite
  is required to finish one formal-evaluation journey.

Guides: [intake acceptance](credential-intake-testing.md),
[earlier formal pilot](evaluation-application.md), [email](email-templates.md).
Do not remove v2 workflow guards merely to expose older pilot actions.

## Shared operations and compatibility

- [x] Support English-only staff URLs, password login, office permissions, live
  CRM edits, Test views and document/payment details; retain the restored GPA URL.
- [x] Persist office/application Dropbox locations and preserve historical file
  reads across profile edits. Keep existing customer folders intact.
- [ ] Enable the East Dropbox app's required read permission and refresh its
  authorization as needed; recheck Boston/New York download bytes. Apply the
  location-registry migration in every intended deployment database.
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
