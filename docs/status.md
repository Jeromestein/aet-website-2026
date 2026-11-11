# AET Implementation Status

Updated November 10, 2026 after complete Preview-copy reconciliation and isolated
nine-table pre-evaluation implementation. Hosted dev Preview activation/recovery
remains the November 6 acceptance at `b003139`; no hosted retirement has occurred.
The revised pre-evaluation runtime passes physical four-table retirement locally;
formal/translation convergence and hosted activation remain open.
This is the current summary, not a release log.
See the [active checklist](migration-checklist.md) for tasks and
[documentation index](README.md) for module guides.

## Current stage

**Pre-evaluation has a working customer journey, verified locally and through a
controlled hosted Preview test. The unified formal-evaluation application is still
being connected to staff processing, payment and fulfillment. AET 2026 is not yet a complete AET App replacement.**

The dedicated pre-evaluation journey and the pre-evaluation choice inside the
general `/application` form are different entry points. The dedicated journey
works; the general form's pre-evaluation and translation submissions remain
unconnected. Avoid using one flow's acceptance as evidence for another.

## Module progress

| Module | Implemented / recorded evidence | Still open |
| --- | --- | --- |
| Public website | Localized service pages, shared pricing, content migration, redirects and SEO foundations | Retained-content review, official-host acceptance and ownership/indexing checks |
| Shared database | Five shared business tables now serve new pre-evaluation applications in private `aet_preview_core`; old Preview applications remain readable | Hosted historical cutover after the local three-record rehearsal, other service writers, Production activation and compatibility retirement |
| Dedicated pre-evaluation | November 6 hosted core journey passed: chunked upload/download, GPT analysis, Stripe Sandbox payment, result release, customer/CRM reads and two delivered English emails | Hosted mobile/refund/timeout scenarios, production configuration and charging |
| Failure recovery | Both fixes verified on hosted dev Preview: failed upload replacement, stale-finish rejection, paid-result read recovery and direct webhook replay without duplicates | Mobile recovery, broader provider/timeout/refund scenarios |
| Unified `/application` | Three-step evaluation form, required fields, shared 2026 prices, delivery/address details, transactional intake, confirmation and Status handoff | Staff actions, payment truth and report release for this v2 intake; shared pre-evaluation/translation submission |
| Status and documents | Formal lookup, ordinary/chunked uploads, saved Dropbox locations and CRM document access | East-account read scope, deployment migrations and broader hosted recovery checks |
| CRM and staff | Password login, office permissions, Live/Test views, scoped live edits, document/payment details and CSV | New v2 Test intake remains read-only; legacy employee migration/cutover stays off |
| Payments | Standalone Payment, older local pilots and pre-evaluation Stripe Sandbox are separately implemented | Application-linked checkout/webhook/reconciliation for the unified intake; production business rules |
| Email | Branded templates, delivery metadata and request-scoped recovery; hosted confirmation/result mail delivered to the controlled test recipient | New-intake lifecycle notifications and real-customer routing; scheduled mail recovery is deferred |
| Fulfillment and migration | Delivery choices saved; older formal pilot can release a PDF; legacy GPA route restored | New-intake report/paper fulfillment, old links, domain/data reconciliation and old-app retirement |

## Latest hosted acceptance

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

## Isolated convergence and the revised nine-table target

The approved end state is **five business + four operational tables**. The
pre-evaluation implementation now passes local PostgreSQL checks with exactly
those nine tables: files own current upload state; services own bounded current
notification state; customers use non-expiring random application-ID URLs.
Audit and rate limits remain; staff authentication stays separate.

The complete November 10 Preview snapshot contains four old pre-evaluations,
two existing core applications and four formal applications. Local migration
first retires seven redundant sources, then drops `aet_uploads`, `aet_emails`,
`aet_access_tokens` and `aet_sessions`. The complete isolated copy has **21 tables:
9 shared + 10 evaluation + 2 legacy formal**. All ten CRM applications remain.
Formal/translation work must still converge before the whole system reaches nine.

**379 tests / 22 files and TypeScript pass**, including 25 nine-table runtime cases
and 11 full-snapshot cases. Tests cover real service/route code with simulated
providers: ordinary/chunked upload recovery, stale completion, AI/publication,
application-scoped access, signed payment replay/refunds, bounded mail retries,
CRM/Status parity, no-charge handling and rollback after physical DROP. The
no-charge fixture has no payment row; replaying settled payments leaves their
original timestamps intact. Old mail/access/upload evidence is returned to an
external archive rather than another runtime table.

The full-copy test reuses the snapshot captured at 23:04 UTC and its read-only
Dropbox, Stripe and Resend reconciliation. No new hosted read or provider send
was needed for this simplification. See [snapshot provenance](archive/database-full-preview-convergence-2026-11-10.md)
and [nine-table acceptance](archive/database-nine-table-rehearsal-2026-11-10.md).
A temporary fixture-only browser page verified the real customer component and
its application-scoped download link; it was stopped after the check. This was
not a hosted or database-connected browser journey.

Activation still accepts only the owned local Unix-socket database. **Online
Preview retains 32 tables; zero hosted tables were deleted.** Hosted permissions,
backup/rollback, old-link reconciliation, provider outage cases and fresh cutover
validation remain open. Production, Preview settings and deployments are unchanged.

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

1. Rehearse a fresh complete hosted snapshot with the verified mixed-cohort
   importer, refresh provider evidence and drain active work. Then prepare
   separately authorized hosted rollout/rollback and test-exemption display
   acceptance. Keep hosted records and operational tables intact.
2. Verify hosted refund/cancellation visibility, mobile recovery and AI timeout
   handling. Desktop upload/publication recovery and direct test-webhook replay
   now pass; keep production charging/configuration separate.
3. Make one unified formal intake operable by staff: documents, missing-material
   requests, confirmed quote and audited status changes.
4. Connect that intake to payment, then report release and notifications.
5. Extend the general application to the other services, then rehearse cutover.

Detailed acceptance criteria and deferred work belong only in the
[active checklist](migration-checklist.md), not a second task list here.

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
