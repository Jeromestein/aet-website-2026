# Guarded main integration — November 12, 2026

## Scope and retained behavior

Integrated dev `9eccb44` and main `5e9472b` locally, after adding release guards
in `eca0c46`. This combines the new application/staff workspace with main's
public Calendar, shared controls, Ads click tracking, payment UI, public assets
and existing payment-expiry task. The previous main status log is preserved in
[the main release archive](main-releases-through-2026-11-12.md).

New customer pages redirect to fixed legacy entry URLs in Production unless
explicitly enabled by the server configuration. Their API handlers return 503
before provider calls. Local/configured Preview remains available; a branch name
alone grants no access. Public website buttons retain the legacy application
portal, and the new customer Status link is not added to the footer.

CRM pages require an employee session and retain membership/office checks.
Production employee configuration is independent of application activation.
Missing staff configuration with an existing cookie now renders the unavailable
state instead of crashing; it neither clears that cookie nor exposes records.
Calendar remains public and does not refresh employee sessions. Only the existing
payment-expiry Cron remains registered; no pre-evaluation scheduler is enabled.

## Local verification

- Frozen dependency installation succeeded after combining dependency versions.
- Vitest: **692 passed, 287 optional cases skipped**, across 51 passing and
  15 skipped files. The 28 release-boundary tests include direct calls to all
  19 application API modules. A separate regression checks unavailable staff
  configuration with an existing cookie.
- A run during page compilation hit one subprocess test's five-second timeout;
  the full rerun after stopping the server passed without changing that test.
- TypeScript, translation parity and standalone-payment regression checks passed.
- HTTP verification: **36 checks passed** in a local Next development server
  configured to simulate the closed Production environment. All 12 guarded page
  routes redirected to fixed old-portal URLs without forwarding the synthetic
  application query. All 19 guarded API modules returned the expected 503.
  CRM redirected to login, staff API failed closed without credentials, the
  existing expiry endpoint required authorization, and Calendar/Payment returned 200.
- In-app browser: public Calendar desktop and 390px mobile schedule/search passed;
  unauthenticated CRM showed login, and missing staff configuration with an old
  cookie showed the unavailable state. Desktop/mobile staff login, Chinese
  evaluation/legacy CTA and standalone Payment layout checks passed.
- With local mode restored, `/zh/application?service=evaluation` rendered and
  accepted synthetic name/office edits on desktop and mobile. No application
  was submitted and no payment was made.
- Temporary verification server used `pnpm exec next dev --webpack --port 3031`
  in an isolated worktree, with no provider credentials; it was stopped afterward.

## Boundaries and next authorization

No production build was run, per project instructions. These checks are not a
hosted Vercel build or live-provider acceptance. No Git push, Vercel configuration,
production database changes, employee account changes, live payment or email send
was performed. The real staff login and new customer end-to-end flows were not
rerun against hosted providers in this integration. The existing unrelated feed
CSV and its status note remain uncommitted in the main checkout.

A later authorized push still needs hosted deployment verification. Production
application activation is a separate decision after both evaluation services
work through the unified entry. Preserve old Production tables/data long-term.
