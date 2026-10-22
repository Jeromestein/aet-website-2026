# AET Implementation Status

Updated October 22, 2026 from the `dev` code baseline at `adc6461`, documentation
commit `5d10cff`, and the hosted Preview acceptance below. This is the current
summary, not a release log.
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
| Dedicated pre-evaluation | October 22 hosted synthetic journey passed: upload/download, GPT analysis, Stripe Sandbox payment, result release, customer/CRM reads and two delivered emails | Hosted failure-recovery scenarios, production configuration and charging |
| Failure recovery | Abandoned-upload recovery and saved-result publication recovery both merged into `dev` | Exercise both fixes in the authorized hosted environment |
| Unified `/application` | Three-step evaluation form, required fields, shared 2026 prices, delivery/address details, transactional intake, confirmation and Status handoff | Staff actions, payment truth and report release for this v2 intake; shared pre-evaluation/translation submission |
| Status and documents | Formal lookup, ordinary/chunked uploads, saved Dropbox locations and CRM document access | East-account read scope, deployment migrations and broader hosted recovery checks |
| CRM and staff | Password login, office permissions, Live/Test views, scoped live edits, document/payment details and CSV | New v2 Test intake remains read-only; legacy employee migration/cutover stays off |
| Payments | Standalone Payment, older local pilots and pre-evaluation Stripe Sandbox are separately implemented | Application-linked checkout/webhook/reconciliation for the unified intake; production business rules |
| Email | Branded templates, delivery metadata and request-scoped recovery; hosted confirmation/result mail delivered to the controlled test recipient | New-intake lifecycle notifications and real-customer routing; scheduled mail recovery is deferred |
| Fulfillment and migration | Delivery choices saved; older formal pilot can release a PDF; legacy GPA route restored | New-intake report/paper fulfillment, old links, domain/data reconciliation and old-app retirement |

## Latest hosted acceptance

Vercel dev Preview is **Ready** at `5d10cff`, deployment
`dpl_GusfM9qw56wGk3n8kzDeHazfXC9t`. The twelve Preview/dev settings added during
the earlier acceptance remain in place; its temporary listener signing secret
has now been replaced by the permanent Stripe **test** endpoint's secret.

A new synthetic application completed upload, one GPT analysis and USD 19.88
Stripe Sandbox Checkout. Stripe delivered `checkout.session.completed` directly
to the dev webhook: payment became paid, the saved result was published and both
confirmation/result emails were delivered. Customer result and CRM payment views
agree. No relay or application-code change was needed. The earlier hosted run
also checked matching download bytes, unpaid-result hiding, concurrent Checkout
reuse and callback replay without duplicate payment, analysis or email.

Only the stable **dev alias** has a Vercel protection exception, allowing direct
Stripe delivery without Vercel login. App-level staff authentication still returns
401 when unauthenticated, and an unsigned webhook returns 400. Other aliases and
global protection were unchanged. The direct-webhook follow-up verified unchanged
Production variables, deployment and all five Production alias mappings.

Hosted failure injection, cancellation/refund, mobile recovery and production
charging remain open. The earlier temporary-relay run had a default-alias
reassignment that was restored; preserve that historical distinction in the
[full acceptance record](archive/preview-acceptance-2026-10-22.md). The latest
[direct webhook evidence](archive/preview-acceptance-2026-10-22.md#permanent-direct-test-webhook-acceptance)
supersedes its outstanding webhook setup item.

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
  automatic scheduled run remains unverified in this record. The Preview
  acceptance did not inspect Production payment-expiry executions. See [payment expiry](payment-expiry.md).
- AI recovery, email recovery and payment expiry have separate switches and
  acceptance requirements. The architecture diagram is not an activation record.
- The legacy AET App remains needed until replacement coverage and cutover pass.
  No production migration, push or deployment is implied by this status page.

## Next milestone

1. Exercise both integrated pre-evaluation recovery fixes in dev Preview,
   refund/cancellation visibility and mobile recovery states. Direct test-webhook
   delivery is verified; keep production charging/configuration separate.
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
