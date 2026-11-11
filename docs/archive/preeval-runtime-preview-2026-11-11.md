# Pre-evaluation Runtime — Hosted Preview Acceptance

Verified November 11, 2026, after the Production-capable runtime and lean release
plan were committed as `d6d4aa2` on `dev`. This is Preview workflow acceptance;
it does not activate or certify live Production operation.

## Deployment and boundary

- [Vercel deployment](https://vercel.com/meiyutechs-projects/aet-website-2026/9fTxtZaXcqSssA9zAFSweSJNNeiu)
  completed successfully for `d6d4aa2`.
- [Dev Preview](https://aet-website-2026-git-dev-meiyutechs-projects.vercel.app)
  continues to use the six `aet_preview_shared` tables and `aet_preview_runtime`.
- Both configured GitHub `dev` push destinations were synchronized. The preceding
  committed Preview schema cleanup (`9aa219b`) was also included in the push.
- No Production environment variables, database grants, live Stripe settings,
  real-customer files/mail, main branch or Production deployment were changed.
- No local production build was run. The prior local verification remains
  764 tests passed, 174 optional cases skipped, plus TypeScript.

## Synthetic customer journey

Application: `02983bc3-b19d-487e-95ac-e2a5c1e75197`.

1. Filled the Chinese dedicated pre-evaluation form in the in-app browser with
   synthetic name, an invalid example email, Fictional Test University and a
   test-only degree. Reviewed the US$19.88 total and submitted once.
2. Uploaded a PDF explicitly labelled as a synthetic test credential. One document
   was indexed in Dropbox; downloading it produced an identical SHA-256 hash.
3. One AI run completed. Before payment, the public response reported AI complete
   and payment unpaid while keeping `result: null`; the page hid the result.
4. Completed Stripe **Sandbox** Checkout with a standard test card. Stripe reports
   `livemode: false`, `amount_total: 1988`, payment `paid` and the matching
   application ID. No real money was charged or payment method saved.
5. Returned to the customer page, which automatically showed paid/completed and
   the released result. The deliberately fictitious document correctly produced
   “Unable to determine”; this is workflow evidence, not a quality benchmark.
6. Resend reported both the English confirmation and result emails as `delivered`,
   addressed to the configured controlled test recipient. The invalid applicant
   address was not used for delivery.
7. The existing authenticated CRM Test view showed the same application, paid
   US$19.88, completed assessment and one supporting document.

## Webhook and duplicate protection

The checkout completion event was `evt_1UajZkJMcR2XIhynqjM4cagN`, with zero
pending webhooks. An official Stripe CLI redelivery to the existing enabled
Preview endpoint `we_1UTTP2JMcR2XIhynZXyFcdYa` also ended with zero pending
webhooks. A before/after database comparison confirmed unchanged payment and AI
row counts, result version and notification state/provider IDs. No local relay,
temporary signing key or webhook configuration change was used.

## Visual checks and evidence

- In-app browser: full form/review/Checkout/return journey, desktop result at
  1440 × 1000, mobile result at 390 × 844 and mobile application-ID status lookup.
- The mobile page had document width equal to viewport width (390 px), with no
  horizontal overflow. Status lookup restored the same paid result.
- No customer-page console errors were recorded. CRM Test was checked using the
  existing authenticated Chrome session.
- Local evidence: `/private/tmp/aet-runtime-preview-20261111/` contains sanitized
  provider/database verification JSON, replay comparison and desktop/mobile/CRM
  screenshots. No credentials are included in this tracked record.

## Remaining release checks

The full form/upload/payment journey was not repeated from scratch at a phone
viewport. Mobile replacement/retry, fresh hosted refund scenarios, operational
owner sign-off and Production provisioning/configuration/live acceptance remain
open. Earlier failure-recovery evidence remains linked from the active checklist.
Unrelated database architecture/diagram edits were preserved outside these commits.
