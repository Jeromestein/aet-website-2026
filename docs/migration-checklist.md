# AET Release Checklist

Updated November 20, 2026. The first release is **pre-evaluation and credential
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

## Application checkout pricing

- [x] Verify locally that pre-evaluation and formal evaluation charge one processing fee, including office-adjusted quotes. New pre-evaluations total USD 18.85.
- [ ] Verify both fee breakdowns and the matching Stripe totals on Preview before rollout.

## CRM application history

- [x] Combine historical and new applications before search, ordering, page counts and CSV export.
- [x] Enforce assigned offices and explicit unassigned access for historical applications.
- [x] Open historical records read-only and keep new application writes in the six-table schema.
- [x] Show estimated deadlines in the merged CRM Status column and mobile cards for eligible paid formal orders.
- [ ] Apply the [updated history function](../scripts/database/production-crm-history.sql) and verify deadlines for a paid historical order and a paid new order in the hosted CRM.

## Terms and document requirements

- [x] Add applicant acceptance checks, no acceptance guarantee and general
  original/official electronic record requirements to Terms of Use; align both
  Status notices in EN/ZH/ES without naming states.
- [x] Verify legacy notice expand/collapse and desktop/mobile wrapping through
  an isolated local component preview without customer data.
- [x] Verify the new website `/terms` in the local browser with the development
  server bound to `localhost`.

## Customer access simplification

- [x] Remove legacy customer Cookie issuance/validation, one-use token exchange,
  24-hour access copy and retired pilot runners. Keep reusable application-ID links.
- [x] Retain employee login, office permissions, application/file scoping and
  payment/report gates; leave databases and historical migration files untouched.
- [x] Show recovery guidance for old token-only links and redirect the old formal
  form into `/application?service=evaluation`; verify desktop/mobile navigation.
- [x] Record the no-customer-session design rule and local regression evidence in
  [the cleanup record](archive/customer-access-cleanup-2026-11-17.md).
- [x] Refresh Calendar invariants, email-preview boundaries and main Preview
  fixtures; full local suite passed with 1004 tests and no failures. The 17
  historical-snapshot cases remain conditional on an external fixture. See
  [test repair acceptance](archive/customer-access-cleanup-2026-11-17.md#test-baseline-repair--follow-up).

## Staff email previews

- [x] November 20: enable the staff gallery in Production and close it on main Preview. Verified the Production staff sign-in redirect and main Preview HTTP 404.

- [x] Gate the gallery route and CRM link with `EMAIL_PREVIEW_ENABLED` (default closed); retain employee authentication.
- [x] Complete the initial Preview-only acceptance with 46 focused tests,
  clean-snapshot type checking, local closed-route UI and hosted Preview CRM/gallery access.

- [x] Add an authenticated `/admin/email-preview` gallery and CRM Tools link for
  all eight business email categories, both information-request versions and quote states.
- [x] Verify the hosted main Preview gallery on desktop/mobile and confirm
  Production remained on its previous deployment during the November 17 trial. See [email gallery acceptance](archive/email-gallery-preview-2026-11-17.md).

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
- [x] Repeat the unified pre-evaluation application/upload/AI/Sandbox-payment/result/
  email journey on main Preview; verify CRM Test and unchanged Production.
  See [unified entry acceptance](archive/unified-preeval-preview-2026-11-12.md).

## First release — both evaluation services

Pre-evaluation: apply → upload → analyze → pay → view result → receive email.
Credential evaluation: apply → upload → staff review → pay → staff prepare and
publish a PDF → download report and receive email. Use the existing six-table
model; automated formal report generation is not required.

### Dedicated pre-evaluation — already verified on dev Preview

This historical hosted evidence covers the dedicated entry. The unified entry is
now also accepted on main Preview; see the unified entry acceptance above.

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

### Pre-evaluation Production runtime

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

### Unified application — main Preview accepted

- [x] Connect `/application` pre-evaluation submission to the existing working
  lifecycle, including customer/education/office fields, quote and recovery links.
  Preserve existing dedicated applications and links. Local API/database tests
  and desktop/mobile form checks passed; fresh hosted acceptance is linked above.
- [x] Redirect the old pre-evaluation form and `/apply` into localized `/application`;
  retain saved status/result links and existing Production release gates.
- [x] Use one customer `/status` lookup for both services, including pre-evaluation
  submission, confirmation links, Stripe returns and old result paths on the new website.
- [x] Save pre-evaluation contact/office/notes, require residence country and terms,
  display the service price, processing fee and total, defer AI until documents are ready or explicitly skipped,
  and preserve service-specific retries plus existing formal retry fingerprints.
- [x] Build the three-step credential application, shared 2026 pricing, exclusive
  document/course selection, education and mailing-address requirements.
- [x] Save credential intake, notify the test recipient, expose Status/uploads and CRM.
- [x] Connect staff review, missing-material requests, price confirmation and
  status changes to new v2 intake in the restricted six-table Preview.
- [x] Enable application-linked Checkout and signed payment reconciliation for
  new credential intake; reuse existing payment/workflow components where compatible.
- [x] Verify staff fee adjustments on main Preview for formal orders before first
  checkout. A USD 110.00 test order changed to USD 95.50 in CRM, customer Status
  and Stripe Sandbox. The fee email was delivered. The open Checkout blocked a
  second edit from an already-open staff page. Staff fee editing shipped in `0059f00`.
- [x] Verify the customer fee breakdown locally for increases, discounts and
  final quotes on estimates with a range. Keep one divider above the total.
- [x] Let staff upload/publish the finished PDF and notify the customer; expose
  authorized report download and retain the selected paper-delivery details.
- [x] Enable credential intake, applicant notifications, private documents, live
  Checkout and signed payment reconciliation on the isolated Production runtime.
- [x] Verify unified pre-evaluation on main Preview: selected office, customer/CRM
  agreement, document download, paid result and both delivered emails.
- [x] Verify the complete credential journey from `/application` on main Preview:
  supplement request, confirmed quote, Sandbox payment/direct webhook, private PDF
  draft, publication/download and five delivered notifications. See
  [credential acceptance](archive/unified-credential-preview-2026-11-12.md).

### Production configuration plan

- [x] Document the [Production configuration plan](pre-evaluation-production-plan.md)
  for both services, including the www origin, private six-table schema, shared
  live webhook and staff publication of formal reports.
- [x] Accept current mobile result/status checks as sufficient for first release;
  do not add a mandatory second mobile payment run.
- [x] Confirm Stripe Dashboard as the manual refund workflow; retain existing
  webhook/state synchronization without building a new refund module.

### Production direct-link release and remaining acceptance

- [x] Deploy main `00362c1` with `APPLICATIONS_ENABLED=true`. Verify anonymous
  English/Chinese intake, both office selectors, staff login protection and old
  public Apply links. Verify the live webhook destination, verified sender,
  AI model access and the three dedicated Dropbox office folders.
- [x] Close the Production pilot with `APPLICATIONS_ENABLED=false` on November 19.
  Verify the English and Chinese redirects, the legacy pre-evaluation destination,
  intake API rejection, and the signed-in staff CRM list (1,226 applications).
- [x] Reopen the Production direct link on November 20. Verify that English and
  Chinese applicants can see both evaluation options and that both homepages
  still point to the legacy applications.

- [x] Prepare an additive, empty Production copy of the current accepted Preview
  six-table structure and a restricted runtime role; compare schema parity and
  verify grants/backups. Preserve old Production tables/data and Preview tables.
- [ ] Confirm the AI runtime limits during live pre-evaluation acceptance.
- [ ] Confirm the operating owner can find applications/documents and handle
  exceptional cases manually; publish contact/refund and service expectations.
- [ ] Complete one controlled Production pre-evaluation from the direct link.
  Verify upload/download, live payment, released result, applicant emails and
  office visibility. Issue a manual Stripe refund and verify the customer and
  CRM states. Both full and partial refunds currently hide the result.
- [ ] Complete one controlled Production formal evaluation from the direct link.
  Verify staff review, supporting documents, final quote, live payment, applicant
  emails and customer download of the PDF published by the assigned office.
- [ ] After both journeys pass, review the release diff and rollback procedure,
  then switch both public evaluation buttons together with owner approval.
  Keep translation and unresolved historical links on the old site.

### Legacy pre-evaluation email links

- [x] On November 20, verify one historical Production application at `/status` with
  its original ID. The page showed the paid, completed assessment from the original
  result email. The downloaded attachment matched the original file's content hash.
- [ ] Before switching the old link for everyone, migrate the remaining pre-evaluations
  under their original IDs. Reconcile payment and refund states, released results
  and attachments. If the stored result is a placeholder, use the result actually
  sent to the customer. Keep unresolved applications accessible on the old site.
- [ ] At cutover, keep DNS and HTTPS active for `app.americantranslationservice.com`.
  Redirect `https://app.americantranslationservice.com/degree-equivalency-tool/application/success?applicationId=ID`
  to `https://www.americantranslationservice.com/status?applicationId=ID`, preserving the
  exact ID. Scope the redirect to this result path so other legacy routes still work.
- [ ] Before retiring the old pre-evaluation reads and writes, open original email
  links while signed out and look up the same IDs on the main site. Verify that a
  completed case shows the original result and downloadable files, and an unpaid
  case keeps its payment status and result restrictions. Check that visiting a
  migrated case triggers no new charge, assessment or email. Retain the old
  Production tables and data after cutover.

## AICE calendar — separate frontend preview

- [x] Add link-only `/admin/calendar` on dev without a public navigation entry.
  Verify month/week/schedule, mobile, search, relationship filters, timezone changes,
  details and eight events on one day. See [local evidence](archive/calendar-frontend-2026-11-12.md).
- [x] Recover historical research into [local JSON files](../data/aice/README.md),
  preserve 44 raw page captures and separate six unverified announcement leads.
- [x] Connect 22 dated records from `data/aice/events.json`; exclude four unverified
  leads and two undated announcements. Remove the artificial preview feed. Verify
  cross-month dates, source/contact details, timezone conversion and phone Schedule.
  November 16: promote the verified CHEA and Montreal leads, retain other leads,
  and rename the visible page to Calendar.
- [ ] Design persistence and source ingestion with the owner; then implement
  OpenAI-assisted updates and scheduling. No database or automatic refresh yet.

## Deferred — not first-release blockers

- [ ] Translation intake/fulfillment and its integration into the unified application.
- [ ] Complete remaining historical Production copying and eventual old-app shutdown
  when authorized. Follow the [pre-evaluation email link checklist](#legacy-pre-evaluation-email-links)
  for that service.
- [ ] Rich tracking, audit dashboards, analytics and extensive operational reporting.
- [ ] Scheduled email recovery/cron; reconsider only when failed mail volume warrants it.
- [ ] Further AI tuning beyond the accepted baseline; automatic formal report generation.
- [ ] Advanced customer accounts, additional payment methods and automated logistics.

Keep signature/amount/ownership checks, private documents, idempotency and clear
failure responses in the first release. These protect real applications and
payments; they do not require additional tracking tables or scheduled jobs.
