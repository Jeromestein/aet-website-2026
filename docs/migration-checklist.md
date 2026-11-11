# AET Release Checklist

Updated November 11, 2026. The first release is **dedicated pre-evaluation**.
Develop and test on `dev`; Production activation requires a separate release.
The owner accepts the existing mobile checks for this release. Refunds are manual
in Stripe Dashboard; no refund feature development is planned.
Checked items mean the stated scope passed, not that Production is enabled.

Read [status](status.md) for current capability and [database architecture](database-architecture.md)
for the six-table model. The [previous detailed checklist](archive/migration-checklist-2026-11-11-before-lean-launch.md)
preserves migration history and acceptance evidence.

## First release — dedicated pre-evaluation

Scope: apply → upload documents → analyze → pay → view result → receive email.
Use the dedicated pre-evaluation entry; the general `/application` pre-evaluation
choice is not an equivalent implementation.

### Already verified on dev Preview

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

### Current development — formal operation mode

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

### Production configuration plan

- [x] Prepare the [Production configuration plan](pre-evaluation-production-plan.md):
  proposed origin, settings, private six-table target, direct live webhook and
  manual Stripe refund procedure. This is a documented plan, not applied settings.
- [x] Accept current mobile result/status checks as sufficient for first release;
  do not add a mandatory second mobile payment run.
- [x] Confirm Stripe Dashboard as the manual refund workflow; retain existing
  webhook/state synchronization without building a new refund module.

### Release gates — after development, separately authorized

- [ ] Prepare the empty Production six-table schema and restricted runtime role;
  verify grants and backups. Existing AET App records stay in the old system.
- [ ] Configure the chosen public origin, Production-only secrets, direct live
  webhook and document location; verify email sender and AI runtime limits.
- [ ] Confirm the operating owner can find applications/documents and handle
  exceptional cases manually; publish contact/refund and service expectations.
- [ ] Route public pre-evaluation links to the new flow; keep unfinished formal
  evaluation/translation entry points on the old system.
- [ ] Reconcile `main` changes, review the release diff, deploy only after approval,
  and perform an authorized controlled live application/payment acceptance with
  rollback ready. Include one manual Stripe refund and state check, using existing
  behavior (both full and partial refunds currently hide the result).

## Next release — formal evaluation

- [x] Build the three-step general application, shared 2026 pricing, exclusive
  document/course selection, education and mailing-address requirements.
- [x] Save formal intake, notify the test recipient, expose Status/uploads and CRM.
- [ ] Let staff review documents, request missing material, confirm price/payment
  and advance the application; keep customer Status consistent.
- [ ] Enable application-linked payment for the new intake.
- [ ] Let staff upload and publish the finished PDF and notify the customer.
- [ ] Verify office permissions and one complete manual fulfillment journey.

## Deferred — not first-release blockers

- [ ] Translation intake/fulfillment and a fully unified application experience.
- [ ] Historical Production import and complete AET App retirement.
- [ ] Rich tracking, audit dashboards, analytics and extensive operational reporting.
- [ ] Scheduled email recovery/cron; reconsider only when failed mail volume warrants it.
- [ ] Further AI tuning beyond the accepted baseline; automatic formal report generation.
- [ ] Advanced customer accounts, additional payment methods and automated logistics.

Keep signature/amount/ownership checks, private documents, idempotency and clear
failure responses in the first release. These protect real applications and
payments; they do not require additional tracking tables or scheduled jobs.
