# AET Release Checklist

Updated November 12, 2026. The first release is **pre-evaluation and credential
evaluation together, through the unified `/application` entry**.
Develop primarily on `main`, with local or configured Preview testing.
Merging code does not activate new application workflows in Production.
The owner accepts the existing mobile checks for this release. Refunds are manual
in Stripe Dashboard; no refund feature development is planned.
Checked items mean the stated scope passed, not that Production is enabled.
Old Production tables and their data must remain long-term, with no scheduled
delete date. New-system launch or old-app shutdown does not authorize deletion;
any later destructive cleanup requires a separate explicit owner decision.

Read [status](status.md) for current capability and [database architecture](database-architecture.md)
for the six-table model. The [previous detailed checklist](archive/migration-checklist-2026-11-11-before-lean-launch.md)
preserves migration history and acceptance evidence.

## Guarded integration into main

- [x] Remove diagonal outbound-link arrows sitewide per the design guide; verify
  local CRM sidebar, Calendar details and homepage service cards on desktop/mobile.
- [x] Retire the old dev/eval working directories after verified local backups;
  retain `x/aet-eval` and its four unmerged commits for separate review. See
  [local setup and preservation details](development.md#main-checkout-and-retired-worktrees).
- [x] Add a server-side release gate to all new customer application pages and APIs.
- [x] Keep public website application links at the legacy portal and Calendar public.
- [x] Keep staff membership/office authorization separate from customer access.
- [x] Accept explicitly configured Preview deployments without a hard-coded dev branch.
- [x] Retain the existing expiry Cron; do not register the new pre-evaluation scheduler.
- [x] Complete combined-main local/browser verification before integration; see
  [guarded-main acceptance](archive/guarded-main-integration-2026-11-12.md).
- [x] Push guarded main and verify Production remains closed for new applications.
- [x] Configure a dedicated main Preview with the existing test services; verify
  form/review, existing pre-evaluation result/document reads and direct Stripe
  test webhook delivery. See [main Preview acceptance](archive/main-preview-2026-11-12.md).
- [x] Verify main Preview authenticated CRM list loading, search, office filters
  and synthetic Test details after owner sign-in; no record writes performed.
- [ ] Confirm intended staff access to unassigned pre-evaluation records before
  relying on the current account for that queue; do not widen access implicitly.
- [ ] Repeat a fresh application/upload/payment journey when the unified entry is connected.

## First release — both evaluation services

Pre-evaluation: apply → upload → analyze → pay → view result → receive email.
Credential evaluation: apply → upload → staff review → pay → staff prepare and
publish a PDF → download report and receive email. Use the existing six-table
model; automated formal report generation is not required.

### Dedicated pre-evaluation — already verified on dev Preview

This evidence covers the dedicated entry, not the currently unconnected
pre-evaluation choice in `/application`.

- [x] Submit and recover an application using its customer link.
- [x] Upload/download documents, replace a failed upload and reject stale completion.
- [x] Run AI analysis and retain the accepted assessment baseline.
- [x] Complete Stripe Sandbox Checkout and direct signed webhook delivery.
- [x] Release a paid result, recover saved results and avoid duplicate payment/mail.
- [x] Deliver confirmation/result mail to the controlled test recipient.
- [x] Read consistent customer and CRM data from the six shared tables.
- [x] Retire obsolete Preview business tables and schemas after backed-up rehearsal.

Latest runtime: [November 11 hosted journey](archive/preeval-runtime-preview-2026-11-11.md)
passed at `d6d4aa2`, including desktop results, mobile result/status lookup and
official Stripe test-event replay without duplicates. Full mobile intake/payment
was not separately repeated and is accepted as a non-blocker by the owner.
A manual refund/state check remains part of controlled live acceptance.

Earlier evidence: [six-table pre-evaluation](archive/database-six-preview-2026-11-10.md),
[latest shared-table acceptance](archive/database-formal-six-preview-2026-11-11.md),
[upload/publication recovery](archive/preview-recovery-acceptance-2026-11-06.md).

### Pre-evaluation Production runtime — implemented, not activated

- [x] Add explicit Production runtime configuration without activating it; keep
  local/dev Preview on isolated data, test payments and controlled recipients.
- [x] Route Production mail and Checkout receipts to the stored applicant email.
- [x] Support separately configured live Stripe keys/signatures, verify account,
  amount, application ownership and mode; preserve replay/refund protection.
- [x] Keep Production documents separate from Preview folders and retain private access.
- [x] Verify these paths with synthetic provider responses and an isolated local
  six-table database; repeat the existing regression/type checks.

Verification: [offline runtime acceptance](archive/preeval-production-runtime-2026-11-11.md).
These checks do not activate hosted Production.

### Unified application — next development milestone

- [ ] Connect `/application` pre-evaluation submission to the existing working
  lifecycle, including customer/education/office fields, quote and recovery links.
  Preserve existing dedicated applications and links.
- [x] Build the three-step credential application, shared 2026 pricing, exclusive
  document/course selection, education and mailing-address requirements.
- [x] Save credential intake, notify the test recipient, expose Status/uploads and CRM.
- [ ] Connect staff review, missing-material requests, price confirmation and
  status changes to new v2 intake; CRM currently shows these submissions read-only.
- [ ] Enable application-linked Checkout and signed payment reconciliation for
  new credential intake; reuse existing payment/workflow components where compatible.
- [ ] Let staff upload/publish the finished PDF and notify the customer; expose
  authorized report download and retain the selected paper-delivery details.
- [ ] Extend credential intake/fulfillment to the isolated Production runtime and
  real applicant recipients. Current credential paths remain Preview/local only.
- [ ] Verify both complete journeys from `/application` on dev Preview, including
  office access, customer/CRM agreement and duplicate-payment protection.

### Production configuration plan

- [x] Prepare the [Production configuration plan](pre-evaluation-production-plan.md):
  proposed origin, settings, private six-table target, direct live webhook and
  manual Stripe refund procedure for pre-evaluation. This is a documented plan,
  not applied settings or a complete two-service release plan.
- [ ] Extend that plan to the unified entry and credential workflow after dev
  implementation and joint Preview acceptance.
- [x] Accept current mobile result/status checks as sufficient for first release;
  do not add a mandatory second mobile payment run.
- [x] Confirm Stripe Dashboard as the manual refund workflow; retain existing
  webhook/state synchronization without building a new refund module.

### Release gates — after development, separately authorized

- [ ] Prepare an additive, empty Production copy of the current accepted Preview
  six-table structure and a restricted runtime role; compare schema parity and
  verify grants/backups. Preserve old Production tables/data and Preview tables.
- [ ] Configure the chosen public origin, Production-only secrets, direct live
  webhook and document location; verify email sender and AI runtime limits.
- [ ] Confirm the operating owner can find applications/documents and handle
  exceptional cases manually; publish contact/refund and service expectations.
- [ ] Route both public evaluation entry points to the unified application after
  joint acceptance; preserve historical links and keep translation on its old path.
- [ ] Reconcile `main` changes, review the release diff, deploy only after approval,
  and perform authorized controlled live acceptance for both services from the
  unified entry, including credential PDF delivery, with rollback ready. Include
  one manual Stripe refund and state check, using existing
  behavior (both full and partial refunds currently hide the result).

## AICE calendar — separate frontend preview

- [x] Add link-only `/admin/calendar` on dev without a public navigation entry.
  Verify month/week/schedule, mobile, search, relationship filters, timezone changes,
  details and eight events on one day. See [local evidence](archive/calendar-frontend-2026-11-12.md).
- [x] Recover historical research into [local JSON files](../data/aice/README.md),
  preserve 44 raw page captures and separate six unverified announcement leads.
- [x] Connect 20 dated records from `data/aice/events.json`; exclude six unverified
  leads and two undated announcements. Remove the artificial preview feed. Verify
  cross-month dates, source/contact details, timezone conversion and phone Schedule.
- [ ] Design persistence and source ingestion with the owner; then implement
  OpenAI-assisted updates and scheduling. No database or automatic refresh yet.

## Deferred — not first-release blockers

- [ ] Translation intake/fulfillment and its integration into the unified application.
- [ ] Historical Production copying and eventual old-app shutdown, if separately
  requested; retain original Production tables/data even after either action.
- [ ] Rich tracking, audit dashboards, analytics and extensive operational reporting.
- [ ] Scheduled email recovery/cron; reconsider only when failed mail volume warrants it.
- [ ] Further AI tuning beyond the accepted baseline; automatic formal report generation.
- [ ] Advanced customer accounts, additional payment methods and automated logistics.

Keep signature/amount/ownership checks, private documents, idempotency and clear
failure responses in the first release. These protect real applications and
payments; they do not require additional tracking tables or scheduled jobs.
