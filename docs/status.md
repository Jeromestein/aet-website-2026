# AET Implementation Status

Updated October 22, 2026 from the local `dev` checkout at `adc6461` and its
committed verification records. This is the current summary, not a release log.
See the [active checklist](migration-checklist.md) for tasks and
[documentation index](README.md) for module guides.

## Current stage

**Pre-evaluation has a working, locally verified customer journey. The unified
formal-evaluation application is still being connected to staff processing,
payment and fulfillment. AET 2026 is not yet a complete AET App replacement.**

The dedicated pre-evaluation journey and the pre-evaluation choice inside the
general `/application` form are different entry points. The dedicated journey
works; the general form's pre-evaluation and translation submissions remain
unconnected. Avoid using one flow's acceptance as evidence for another.

## Module progress

| Module | Implemented / recorded evidence | Still open |
| --- | --- | --- |
| Public website | Localized service pages, shared pricing, content migration, redirects and SEO foundations | Retained-content review, official-host acceptance and ownership/indexing checks |
| Dedicated pre-evaluation | Application, Dropbox upload, direct GPT analysis, saved result, test Checkout and confirmation/result mail; actual local provider acceptance recorded on October 22 | Hosted acceptance of the latest fixes, hosted test webhook, approved production configuration and charging |
| Failure recovery | Abandoned-upload recovery and saved-result publication recovery both merged into `dev` | Exercise both fixes in the authorized hosted environment |
| Unified `/application` | Three-step evaluation form, required fields, shared 2026 prices, delivery/address details, transactional intake, confirmation and Status handoff | Staff actions, payment truth and report release for this v2 intake; shared pre-evaluation/translation submission |
| Status and documents | Formal lookup, ordinary/chunked uploads, saved Dropbox locations and CRM document access | East-account read scope, deployment migrations and broader hosted recovery checks |
| CRM and staff | Password login, office permissions, Live/Test views, scoped live edits, document/payment details and CSV | New v2 Test intake remains read-only; legacy employee migration/cutover stays off |
| Payments | Standalone Payment, older local pilots and pre-evaluation Stripe Sandbox are separately implemented | Application-linked checkout/webhook/reconciliation for the unified intake; production business rules |
| Email | Branded templates, delivery metadata, controlled confirmations and request-scoped recovery | New-intake lifecycle notifications and real-customer routing; scheduled mail recovery is deferred |
| Fulfillment and migration | Delivery choices saved; older formal pilot can release a PDF; legacy GPA route restored | New-intake report/paper fulfillment, old links, domain/data reconciliation and old-app retirement |

## Latest integrated verification

- **Both recovery fixes are included:** result publication (`0d9a496`, merge
  `00689cf`) and upload recovery (`476413c`, merge `adc6461`). The configuration
  refactor and command-line-only legacy test actors were preserved.
- **778 tests across 51 files passed** in the recorded final integration, with
  all opt-in PostgreSQL suites enabled. Databases were disposable and providers
  were mocked. TypeScript and i18n passed (593 messages per language).
- Upload recovery had isolated desktop and 390px mobile interaction checks.
  The combined dev browser check covered the pre-evaluation lookup page only;
  it did not repeat a real upload/payment/AI journey after the merges.
- The earlier October 22 provider acceptance exercised real Dropbox, OpenAI,
  Resend and **Stripe Sandbox** with synthetic applications. It did not establish
  production charging or hosted delivery of the latest recovery fixes.
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
  automatic scheduled run remains unverified in this record. This documentation
  update did not inspect current Production. See [payment expiry](payment-expiry.md).
- AI recovery, email recovery and payment expiry have separate switches and
  acceptance requirements. The architecture diagram is not an activation record.
- The legacy AET App remains needed until replacement coverage and cutover pass.
  No production migration, push or deployment is implied by this status page.

## Next milestone

1. Verify the integrated pre-evaluation recovery behavior in the authorized
   hosted setup, including its test webhook and required Dropbox permissions.
2. Make one unified formal intake operable by staff: documents, missing-material
   requests, confirmed quote and audited status changes.
3. Connect that intake to payment, then report release and notifications.
4. Extend the general application to the other services, then rehearse cutover.

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
