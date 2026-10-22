# AET Website 2026

A Next.js App Router website for American Education and Translation Services, with a homepage, Evaluation, Certified Translation, and shared Pricing page. Built with TypeScript, responsive CSS, and small client-side enhancements. Ready to import into Vercel as a Next.js project.

## Local development

Requires Node.js 20.9 or newer and pnpm 9.7.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3021. The development port is configured in `package.json`.

### Main and dev worktrees

The current local setup uses two checkouts of the same Git repository:

| Branch | Local directory | Preview |
| --- | --- | --- |
| `main` | `/Users/plusone/Desktop/Code/aet-website-2026` | `http://localhost:3021` |
| `dev` | `/Users/plusone/Desktop/Code/aet-website-2026-dev` | `http://localhost:3022` |

Open the intended directory in VS Code and run its server from your own terminal.
For the dev worktree, use:

```sh
pnpm exec next dev --port 3022
```

`pnpm dev` still selects port 3021 in both checkouts; `.env.local` does not
override that explicit script argument. Reuse the owner's running server for
the matching checkout. The dev worktree's ignored `.env.local` uses port 3022
for `APP_ORIGIN` and `PAYMENT_SITE_URL`. Keep secrets out of Git and restart
the user-managed process after changing startup configuration when required.

Worktrees share Git history but have separate files, dependencies and local
configuration. They do not automatically isolate external services or databases;
both checkouts can still point to the same local Supabase instance. `main` and
`dev` are development branches, not permanent website/backend applications.
To integrate later, commit the intended changes on `dev`, merge `dev` into
`main` from the main checkout, resolve conflicts and verify the result before
an explicitly authorized push or deployment. Do not copy folders over `main`.

## Environment configuration

Use one private `.env.local` in each worktree for actual local values. Keep
`.env.example` as the shared, secret-free template. Do not create a second `.env`
or service-specific secret file for the same worktree. Both files are grouped by
shared application configuration, pilot test recipient, staff
authentication, CRM, optional AI/email/payments/Dropbox and scheduled tasks.
The template origin defaults to port 3022 for the dev worktree; use 3021 for main.
Organizing settings does not enable or disable their services.

Shared settings now use `APP_`, `APPLICATION_` and Dropbox-specific names.
Pre-evaluation-only settings keep `PREEVAL_`. Formal intake and some staff workflows
use the same configuration/database helpers. Marketing pages alone do not need
this entire configuration; the standalone Production expiry worker needs only
its three settings documented below.

### Temporary legacy-name compatibility

Server code and standalone scripts read through
[`lib/application-environment.mjs`](lib/application-environment.mjs).
The new name wins whenever it is defined, including an explicit empty string;
only an absent new name falls back to its old alias. Required empty values still
fail validation instead of silently using an older connection or recipient.
Values are read at call time without copying aliases into `process.env`.

| New name | Temporary fallback |
| --- | --- |
| `APP_ENV` | `PREEVAL_ENV` |
| `APP_ORIGIN` | `PREEVAL_ORIGIN` |
| `APPLICATION_DATABASE_MODE` | `PREEVAL_DATABASE_MODE` |
| `APPLICATION_DATABASE_URL` | `PREEVAL_DATABASE_URL` |
| `APPLICATION_TEST_EMAIL` | `PREEVAL_TEST_EMAIL` |
| `DROPBOX_LEGACY_PILOT_ROOT` | `PREEVAL_DROPBOX_ROOT` |

The template and local file contain only the new names. During a later authorized
Vercel rollout, deploy the compatibility reader first using the existing aliases,
then add new names with the same environment-specific values and redeploy.
Verify the intended environment before removing old Vercel entries. Keep the
compatibility reader until all scripts/deployments have migrated. No Vercel
configuration or deployment was changed by this local rename. The cloud-setup
script reads either naming scheme and writes the new database keys going forward.

### Required and optional settings

| Variables | Requirement and current purpose |
| --- | --- |
| `APP_ENV`, `APP_ORIGIN` | Required for the application pilot; select local or the approved dev Preview and its trusted origin. Also consumed by staff configuration and older form routing. |
| `APPLICATION_DATABASE_MODE`, `APPLICATION_DATABASE_URL` | Shared application storage. URL is required; mode defaults to local when absent, but cloud-preview must be explicit. Keep mode explicit in the template. This is separate from the live CRM connection. |
| `APPLICATION_TEST_EMAIL` | Required by the shared config reader; controls pre-evaluation/legacy workflow recipients and the pre-evaluation test Checkout email. New formal intake uses its own fixed pilot recipient in `lib/application/intake.ts`; this is not a site-wide recipient override. Keep it even when optional mail dispatch is disabled. |
| `PREEVAL_AI_ENABLED`, `PREEVAL_OPENAI_MODEL` | Optional pre-evaluation AI capability and model override. Missing switch means off; the current model default is `gpt-6.1-sol`. The API key is required when AI is enabled. |
| `PREEVAL_EMAIL_ENABLED` | Optional pre-evaluation cloud-preview mail opt-in; dispatch also requires an application ID. It does not control newer formal-intake confirmation mail, and the older local-database dispatcher bypasses this flag. |
| `PREEVAL_STRIPE_TEST_ENABLED` | Optional permission for pre-evaluation test payment calls in cloud-preview. Missing means no opt-in; local pilot behavior and formal-payment restrictions are unchanged. This does not select live/test mode for the shared Payment page. |
| `DROPBOX_LEGACY_PILOT_ROOT` | Historical pilot-path compatibility. The saved-path resolver still requires it, even though new uploads use office/application folders. Retain it while those readers remain. |
| `PREEVAL_AI_DAILY_RECOVERY_ENABLED` | Optional scheduled AI recovery only; absent/false disables that endpoint's work. On-demand AI does not require this switch. |

Local values may intentionally differ from the safe template: `APP_ENV=local`
can use `APPLICATION_DATABASE_MODE=cloud-preview` for a localhost server backed
by the restricted cloud database. Local opt-ins do not enable Vercel services.
Optional entries need not be copied into `.env.local`: missing
`PREEVAL_AI_DAILY_RECOVERY_ENABLED` disables scheduled AI recovery; missing
`STRIPE_PAYMENT_MODE` selects test only in development and disables the shared
Payment page elsewhere. Each office needs its own account key for the selected
mode; missing BOS keys leave Boston/NYC Stripe unavailable without falling back
to another office account. `STRIPE_TEST_SITE_URL` is an optional return-origin
override; see [Payment configuration](content/payment/README.md).

The unused `PREEVAL_CODEX_BIN`, `PREEVAL_CODEX_MODEL`, `PREEVAL_PDFINFO_BIN`
and `PREEVAL_PDFTOPPM_BIN` have been removed from the local file. Current direct
API analysis does not read them. The template also omits unused Stripe publishable
keys because hosted Checkout uses server-side secret keys.

Old pre-evaluation lifecycle and formal-evaluation workflow/browser-fixture
scripts take an explicit `--test-actor=email` command-line argument through
`scripts/legacy-test-actor.ts`. There is no environment-variable fallback or
website setting for this identity. Use a synthetic identity such as
`--test-actor=lifecycle-test@example.invalid`; see
[lifecycle test setup](docs/pre-evaluation-local.md#lifecycle-test-only-audit-identity).
The argument labels test audit entries or synthetic legacy authentication fixtures;
it does not configure website staff membership or change the controlled recipient.

When integrating older feature branches, retain the removal of `admin` from
shared website configuration and the environment template. Adapt old fixtures to
the command-line helper instead of restoring an environment dependency.

One-off verification switches and staff-session cookies should be supplied only
to their explicit verification commands. The optional scoped email-recovery
settings are documented in [email recovery](docs/preeval-email-recovery.md); they
are not required for normal request-scoped mail delivery and are not enabled by
this template. A blank or absent optional provider credential does not by itself
prove that all of its callers are disabled; check the applicable feature's guard.

Keep `STATUS_EXPIRY_ENABLED=false` locally. Vercel Production uses the saved
`STATUS_EXPIRY_DATABASE_URL` and `CRON_SECRET`, with its own expiry switch set
explicitly to `true` when ready. Never import the entire local file into Vercel:
origins, database modes and feature switches are environment-specific. See
[payment-expiry setup](docs/payment-expiry.md). Real values remain Git-ignored;
restart the owner-run local server after environment edits.

## Staff authentication

The owner maintains three staff accounts and handles additions and password
assistance manually. Self-service password-reset pages and emails are not part
of the website.

The new password-based staff login at `/admin/login` uses cloud Supabase Auth
without Docker. Staff membership and office scopes are prepared administratively;
verified first login can preserve the existing email and password without another
registration or invitation. Both employee-migration and staff-cutover switches
remain off in the local preview. Staff email-link login has been removed.

Independent website administrators can already sign in with an explicitly
confirmed Supabase Auth account and private membership while both switches are
off. The owner sets the password in Supabase; the server-only
`scripts/staff/add-native-admin.mts` command assigns approved all-office access
without creating a legacy employee or sending an invitation. See
[independent administrator setup](docs/staff-auth.md#independent-administrators-without-employee-migration).

See [the dependency inventory and rollout plan](docs/staff-auth.md) for the
approved roster, server-only configuration, test results and remaining production
work. Authentication uses `STAFF_AUTH_DATABASE_URL`. The original 3022 CRM now
reads and edits the shared production business tables through a separate restricted
`CRM_DATABASE_URL` with `CRM_DATA_SOURCE=live`. Changes appear in the old workspace
after refresh; employee authentication remains unchanged. Customer intake and its
auxiliary workflows still use the isolated `APPLICATION_DATABASE_URL` cloud preview.
No Docker is needed. See [live CRM scope](docs/staff-auth.md#shared-live-business-records).

## Validation and deployment

For current business progress, read the [migration checklist](docs/migration-checklist.md)
and [progress analysis](docs/status.md#2026-10-20--reconcile-dev-progress). They distinguish
the new intake, older local pilots, shared live CRM and remaining release gates.

```sh
pnpm check:i18n
pnpm typecheck
node scripts/check-blog-contact.cjs
node scripts/check-payment.cjs
node scripts/check-dropbox.cjs
```

Local production builds are not run under the project instructions. The owner manages deployment and the hosted production build.

Import this directory's repository into Vercel and choose the Next.js preset. The
Payment page requires the server-only `PAYPAL_BUSINESS_*` and `PAYMENT_SITE_URL`
values documented in `.env.example`. Public marketing pages need no database;
the application pilot has separate service requirements in
[the local setup guide](docs/pre-evaluation-local.md).
Deployment is intentionally left to the owner.

### Vercel dev Preview

The Vercel project `aet-website-2026` uses `main` for Production. The `dev`
Preview has branch-specific configuration; existing Production variables are
preserved. Its stable application origin is
`https://aet-website-2026-git-dev-meiyutechs-projects.vercel.app`.

Use `APP_ENV=preview`, `APPLICATION_DATABASE_MODE=cloud-preview`, and that HTTPS
origin in `APP_ORIGIN`. Keep system environment variables enabled. The server
requires Vercel Preview, Git branch `dev`, and an exact match with
`VERCEL_BRANCH_URL`. Forms accept only that branch origin or the current exact
`VERCEL_URL`; no wildcard host or forwarded request header is trusted.
`STAFF_LEGACY_MIGRATION_ENABLED` and `STAFF_AUTH_CUTOVER_ENABLED` must both remain
`false`. Production/other branches are not enabled by this pilot configuration.

Authentication, live CRM and isolated intake retain their three separate database
connections. `CRM_DATA_SOURCE=live` reads and writes the same records as the old
workspace; deployment environments do not isolate those business records.
The existing staff accounts are not migrated. An already-provisioned native admin
uses `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `STAFF_AUTH_DATABASE_URL` without a
service-role key. Dropbox uses both existing office accounts and stored paths.

Dev Preview uses `STRIPE_PAYMENT_MODE=test` with both offices' test keys and an
HTTPS `STRIPE_TEST_SITE_URL`; no live Stripe or PayPal credentials were added.
A hosted webhook endpoint and its matching signing secret have not been set up
by this configuration change. Local CLI webhook secrets are not copied to the
hosted environment. Legacy local-only form routes, hosted AI acceptance and
production cutover remain outside this Preview setup. The newer `/application`
intake, `/status` lookup and `/admin/CRM` use the configured cloud connections.

Local `.env.local` and port 3022 remain unchanged. The owner authorized the dev
push and Preview acceptance; checked behavior and remaining limits are recorded
in `docs/status.md`. Production cutover requires separate authorization.
Environment changes apply to new deployments. Never commit connection strings
or keys.

### Application domains and staff URLs

The owner requires the existing staff address to remain
`https://app.americantranslationservice.com/admin/CRM`, including the legacy
uppercase `CRM` path. Staff pages are English-only and never expose `/en`,
`/zh` or `/es` prefixes. Customer website/application pages retain three languages.

The recommended deployment arrangement discussed with the owner is one Vercel
project for this combined codebase, with both custom hostnames attached:

| Hostname | Intended content after cutover |
| --- | --- |
| `www.americantranslationservice.com` | Public website and service content |
| `app.americantranslationservice.com` | Customer applications, status/access pages and staff `/admin/*` pages |

This is a proposed deployment arrangement, not an already configured domain split.
A separate Vercel project is only needed if independent deployments/configuration
are deliberately chosen; the `app` prefix alone does not require a second project.
Vercel supports adding multiple custom domains through the project's domain
settings. See [Vercel custom-domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

The routing has two layers: DNS and Vercel domain bindings deliver requests to
the project; application routing then reads the requested hostname and pathname
to select the intended content. The Next.js `app/` source directory does not
automatically bind an `app.` subdomain. A future hostname rule in `proxy.ts`
can redirect or internally rewrite requests; an internal rewrite keeps the
public browser URL unchanged. See [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).

Already implemented locally: `proxy.ts` handles `/admin/*` through an English-only
middleware, internally resolving the existing `[locale]` pages as English. It
redirects prefixed admin links and `/admin/crm` to their unprefixed canonical paths,
preserves query parameters, and leaves the saved public-site language unchanged.
The browser therefore displays `/admin/CRM`, while the page implementation can
remain under `app/[locale]/admin/CRM/page.tsx`. Authentication remains required.

Still pending: hostname-based separation, root/wrong-host behavior, Vercel/DNS
configuration, production application origins, access/payment return URLs and
webhook validation, hosted worker/AI operation, and production acceptance with
rollback. The pilot accepts local testing and the explicitly configured dev Preview only;
binding a production domain does not make it production-ready. Keep the existing AET App
operational until the separately authorized cutover. No deployment or DNS change
was made as part of the English-only staff update.
### Stripe Checkout

Stripe Checkout uses `STRIPE_PAYMENT_MODE`
(`test` or `live`) and separate server-side credentials for each account/mode.
California/Miami use `STRIPE_{TEST,LIVE}_SECRET_KEY`; Boston/NYC use the same
names with `_BOS`. No credential fallback is allowed. Live mode removes test
copy and requires an HTTPS `PAYMENT_SITE_URL`. Local development remains in test
mode. Production defaults to disabled unless its mode is explicitly configured.
See [payment integration notes](content/payment/README.md) for setup, verification
and the manual reconciliation boundary. Git pushes do not upload `.env.local`.
Deployment is intentionally left to the owner.

## Analytics

The shared locale layout loads Google tag `G-7SF10M7GBE` with `next/script`
after hydration on public English, Chinese, and Spanish pages. Status/documents
pages omit the tag on fresh visits and disable it while active. Keep a single
installation. GA4 enhanced measurement must include browser-history page changes
to track client-side navigation. Authored Blog phone and Contact-page buttons
also send `contact_us` with article, locale, method and placement. Same-tab web
links wait for the event callback or a separate two-second fallback; telephone
and new-tab actions retain native behavior. Other Blog click objects remain in
`dataLayer`. These events measure contact intent, not completed inquiries.
GA4 receipt, key-event settings and Google Ads import still need account verification.

## Scope

The complete institution directory is available at `/institutions`,
`/zh/institutions` and `/es/institutions`. It preserves 28 legacy entries across
four categories, with localized search, filters and complete application notes.
The homepage carousel links locally and the legacy partners PHP URL redirects.
See [institution content provenance](content/institutions/README.md).

About AET is implemented at `/about`, `/zh/about`, and `/es/about`, with a shared
history timeline, service highlights, archival photo gallery and client collection.
The footer uses the localized route and five legacy About entry points redirect
there. See [About content provenance](content/about/README.md).

The homepage uses a shared `app/[locale]/page.tsx` template with Next.js i18n
(`next-intl`) for English, Chinese, and Spanish. English uses `/`; Chinese and
Spanish use `/zh` and `/es`. Migrate each additional page once through this same
locale architecture; language variants do not require separate page implementations.

Formal application buttons use the localized `/apply` entry point. In the local
pilot (`APP_ENV=local`), this opens the four-step formal evaluation form at
`/credential-evaluation-application`; other environments retain the existing
application portal. The form supports shared website pricing, multiple education
records, report/delivery options, tab-scoped drafts, validated local submissions
and private confirmation pages. See [formal application scope](docs/evaluation-application.md).
Formal applications now continue through private document upload, confirmed quotes,
Stripe test checkout, staff review at `/admin/evaluations`, and PDF report release.
Customer access can be renewed with a staff-issued single-use link. This remains a
local pilot; automated formal email notifications and production launch are pending.
Both application forms now save business fields through the original table
contracts. After the local Supabase migrations, run `pnpm legacy:setup`; it
creates a schema-only local fixture and installs auxiliary workflow bridges.
Existing production tables and records are untouched. See
[field mappings and the old-reader compatibility patch](docs/legacy-form-compatibility.md). In the
local pilot (`APP_ENV=local`), the homepage pre-evaluation button opens the new
local workflow; other environments retain the existing portal destination. Miami, Boston, Los Angeles and Beijing
office pages are local at `/offices/{miami,boston,los-angeles,beijing}`, with
English, Chinese and Spanish variants. The localized Contact page is implemented. A localized Payment page is available
at `/payment`; its form supports the existing PayPal HTML-form handoff and an
optional Stripe Checkout. The header and
footer link to the localized page, and `/e-pay.php` redirects there. Production environment configuration, deployed return routes and office payment
reconciliation must be verified before client use.

The Blog index is available at `/blog`, `/zh/blog`, and `/es/blog`, with 80
retained articles and one new CSLB guide. Credential evaluation is the primary topic:
its 29 articles appear by default, with other topics in a secondary selector.
All 81 articles are local at `/blog/[slug]`; 157 legacy PHP/HTML article URLs
redirect to them. The 80 retained bodies remain English-only across locales,
without language-availability notices. The CSLB guide has complete English,
Chinese, and Spanish versions with localized titles and search metadata.
Shared navigation and index controls stay localized. Cards and page titles use each source body's heading; the original
metadata titles remain in the source catalog for provenance. `/blog/` and
`/blog/index.php` redirect to `/blog`. Local migration is complete; publication
review of dated claims and production cutover remain open. See
[blog source and verification notes](content/blog/README.md).

Pricing is implemented at `/pricing`, `/zh/pricing`, and `/es/pricing`. The
Services menu and footer use these localized routes. `/e-fee.php` redirects to
`/pricing`, preserving the legacy section anchors for retained services.

Evaluation is implemented at `/evaluation`, `/zh/evaluation`, and `/es/evaluation`.
It preserves legacy prose and reuses Pricing's table component and shared rates.
The homepage/header/footer use these routes, and the three legacy evaluation PHP
URLs redirect to them. Original form and sample PDFs are served locally.
See [content provenance](content/evaluation/README.md) for source details.

The CSLB guide is a Blog article at `/blog/cslb-foreign-credential-evaluation`,
in English, Chinese, and Spanish, with an entry on each Evaluation page. The former `/evaluation/cslb` paths
redirect to the article in the same interface language and preserve query strings.
It covers education credit, document requirements, AI reading links, and contact
before ordering. See [authored content notes](content/blog/authored/README.md).

Certified Translation is implemented at `/certified-translation`,
`/zh/certified-translation`, and `/es/certified-translation`. It uses the shared
service-page shell, Pricing records, mobile card rails, and the legacy three-step
email workflow. The three legacy notarized PHP entry points redirect to it.
See [service-page template](docs/service-page-template.md) before adding services
and [translation provenance](content/certified-translation/README.md) for sources.

The production origin is `https://www.americantranslationservice.com`, confirmed
by the owner on September 30, 2026 and centralized in `lib/seo.ts`. Canonical URLs,
Open Graph URLs, language alternates and sitemap entries use this origin even
in local previews. Vercel preview deployments emit noindex metadata. Every
`*.vercel.app` alias also receives an `X-Robots-Tag: noindex, follow` header,
including the stable alias for a Vercel production deployment. The host-specific
rule does not disable indexing on the official custom domain. Other public
preview hosts need equivalent noindex configuration before publication.

The complete legacy URL inventory is in `docs/seo-legacy-urls.md`. On October 1,
the owner deferred unmigrated legacy content and PDFs for possible future pages;
they are not current tasks or release blockers. Preserve their source inventory.
Search Console ownership verification remains a launch task. Known retained entry points redirect to local routes;
removed services are not silently redirected to the homepage. See the SEO checklist
for verification and remaining launch work.

## Service scope

The Services menu retains the following services (Visa restored by owner request on October 10, 2026):

- Certified Translation
- Technical Translation
- Interpretation
- Expert Opinion Letters
- General Translation
- Notarization
- Visa Services

Editing/Proofreading and China Consular Authentication are removed
from the rebuilt website's desktop/mobile navigation, homepage service cards,
and footer wherever previously listed. Do not reintroduce their labels or links
when copying content from the legacy website. Foreign Credential Evaluation,
its evaluation types, and Pre-Evaluation Services remain available.

This scope applies to this rebuilt homepage; it does not delete legacy website
pages or change the separate application portal.

## Pre-evaluation workflow and CRM

The local pre-evaluation pilot is implemented at `/degree-equivalency-tool` with
English, Chinese and Spanish customer pages. `/status-check` opens an application
directly from its complete Application ID; confirmation emails include that ID
and a reusable application link. Customers do not register, sign in, or wait for
another email. `/admin/login` is the separate staff authentication entry.
Staff pages use English-only, unprefixed `/admin/*` URLs, including the legacy
`/admin/CRM` address. Old language-prefixed staff links redirect to these URLs;
the website language preference is preserved. Staff use account/password login;
customer status and result pages remain localized.
`/admin/CRM` uses the original sidebar, overview cards, status tabs, desktop table,
mobile cards and detail drawer with durable formal/pre-evaluation data. Statistics,
search, office filters, pagination, document/payment views and CSV export all use
server-enforced staff office permissions. Notes, formal status/quotes/reports,
preliminary result corrections, information requests and audit history use the
existing workflow APIs. `/admin/evaluations` and its detail links redirect into the
corresponding workspace view/drawer; `/admin/CRM/preview` redirects to the workspace.

The 3022 checkout connects directly to isolated cloud Supabase preview schemas;
Docker is not used. Dropbox transfers are enabled independently; pre-evaluation
GPT analysis now runs automatically in the Next service after an eligible request,
using a server-only key. No second local terminal is required. An optional daily
recovery endpoint fits Hobby scheduling limits; hosted acceptance and commercial
plan eligibility remain separate. The older formal-payment and combined-worker
guards stay in place. Pre-evaluation Stripe Sandbox checkout can be explicitly
enabled with `PREEVAL_STRIPE_TEST_ENABLED=true`; local payment tests also need a
temporary Stripe CLI callback forwarder. See [payment setup and verified
acceptance](docs/pre-evaluation-local.md#october-22-stripe-test-payment-acceptance). Pre-evaluation notifications can now run in that same request lifecycle:
set `PREEVAL_EMAIL_ENABLED=true` only with the intended `APPLICATION_TEST_EMAIL`.
Cloud preview sends are scoped to one authorized application; it does not drain
historical mail globally. See [AI setup and acceptance](docs/pre-evaluation-local.md#direct-gpt-analysis--october-20-2026)
and [full journey verification](docs/pre-evaluation-local.md#october-22-full-customer-journey-acceptance).
Both employee migration/cutover switches stay off. The old AET App
remains the production system until a separately authorized cutover. See
[cloud preview boundaries](docs/staff-auth.md#cloud-business-preview).

Bulk import and standalone payment drafts remain unavailable, with explicit UI
explanations. New application opens the existing intake forms; GPA remains a local
calculator. No action displays a successful save unless its API has succeeded.
Historical local-pilot setup is retained in [local workflow notes](docs/pre-evaluation-local.md).

Application URLs are not yet fully compatible with the old portal. The three
pre-evaluation paths are retained; formal `/status?applicationId=ID` now supports
localized customer lookup and Dropbox documents locally. Payment remains in the
existing portal for live applications. See [Dropbox integration](docs/dropbox.md).
Legacy checkout and four standalone CRM tool URLs remain open work. See the
[dated URL comparison](docs/app-url-compatibility.md) before app-domain cutover.

## Documentation

- [Migration architecture](docs/migration-architecture.md): English Mermaid diagrams of AET 2026 and legacy AET App, shared data boundaries, and remaining integration work.
- [Design baseline](docs/design.md): brand, fixed copy, logo, palette, typography, homepage composition, and responsive behavior.
- [Form/database compatibility](docs/legacy-form-compatibility.md): original field mappings, website price snapshots, local setup and cutover limits.
- [Blog article structure](docs/blog-requirements.md): search-focused titles, reader questions, direct answers, and AI links near the top.
- [Implementation status](docs/status.md): completed checks, partial work, and pending acceptance items.
- [App URL compatibility](docs/app-url-compatibility.md): legacy/current route mapping, query and language behavior, and remaining cutover gaps.
- [Migration checklist](docs/migration-checklist.md): legacy page scope, CRM replacement milestones on `dev`, language coverage, blog inventory, and launch dependencies.
- [SEO checklist](docs/seo-checklist.md): ordered work and acceptance checks for redirects, indexing, metadata, and structured data.
- [Agent guidance](AGENTS.md): reading order and project working rules.

The design guide specifies intended behavior; check the status file before treating a requirement as implemented.

## Existing action destinations

- Application: https://app.americantranslationservice.com/credential-evaluation-application
- Preliminary assessment: https://app.americantranslationservice.com/degree-equivalency-tool

Validate routes, metadata, and the intended deployment before launch. Do not submit applications, contact forms, or payments during link checks.

## Editing

- `app/[locale]/page.tsx`: shared homepage structure and service links.
- `messages/en.json`, `messages/zh.json`, `messages/es.json`: localized interface and homepage content.
- `i18n/routing.ts`: supported locales and locale URL behavior.
- `app/globals.css`: base responsive styles and motion. Reduced-motion preferences are respected.
- `app/reference-style.css`: shared AET surfaces, photo treatment, and logo presentation.
- `app/home-design.css`: final design-guide typography, spacing, responsive rails, and native menu styling.
- `components/card-rail.tsx`: progressive previous/next controls over native horizontal scrolling.
- `components/scroll-stories.tsx`: fact selectors and process imagery, with unpinned reduced-motion and no-JavaScript fallbacks.
- `components/navigation.tsx`: mobile navigation, language links, and progressive scroll reveals.
- `app/[locale]/layout.tsx`: localized layout and page metadata.
- `public/images/`: locally copied assets; see ASSETS.md.

Poppins, Fraunces, and Gaegu are hosted locally in `public/fonts/` and loaded through `app/fonts.css`. Font licenses and provenance are documented in ASSETS.md. Native details elements keep FAQs functional without JavaScript. Page content remains visible if JavaScript is disabled.

## Internationalization

Locale routing uses `next-intl`: `/` (English), `/zh` (Simplified Chinese), and
`/es` (Spanish). An explicit locale URL takes precedence; otherwise the saved
`AET_LOCALE` preference is used, followed by the browser language and English.
The preference cookie lasts one year. `/en` updates the preference and redirects
to `/`, so English remains selectable after visiting another locale.

The header language selector is available on desktop and mobile. Switching keeps
the current pathname, query parameters, and fragment. Home and logo links stay in
the active locale. Imported HTML uses `lib/content-links.ts` to preserve that
locale on internal page links; downloads and English-only legal URLs stay
language-neutral. Held article references retain their text without a link.
External references and the separate application portal keep their destinations.

Edit corresponding keys in all three `messages/*.json` files. Missing messages
fall back to English; development logs and `pnpm check:i18n` report omissions.
The check also validates message syntax, interpolation arguments, and preservation
of the original English testimonials. Translated reviews are labeled as translations;
brand artwork, institution names, and existing application screenshots are retained.
Localized titles, descriptions, HTML language attributes, absolute canonical URLs
and HTML alternate-language links are supplied. Alternates include only genuine
translations and always use the confirmed production host. English-only blog and
career variants, and untranslated service fallbacks, canonicalize to English and
use noindex outside English; only indexable variants appear in the sitemap.
Legal pages retain their English-only redirects.

After moving routes, run `pnpm exec next typegen` if existing generated route types
still reference the old paths, then run `pnpm typecheck`. This does not build the site.

## Legal documents

`/privacy` and `/terms` use a shared reading layout and the complete English
legacy text in `content/legal/`. Legal documents are English-only in every site
language. Footer and Payment links point to these English routes; former Chinese,
Spanish and legacy legal URLs redirect with section anchors preserved. Visiting
a legal page does not change the saved site language. See
[source provenance and launch review](content/legal/README.md) for the operational
statements that still require owner review.

## Shared pricing

`lib/pricing.ts` is the single source for USD fees, price types (fixed, starting,
range, or quoted), units, turnaround, shipping/tracking, and minimum durations.
The baseline is the owner's September 29, 2026 updated legacy `e-fee.php`, not
the conflicting older service-page or application-form prices. The owner requested
removal of the document-language notice and Chinese-price-list link from Pricing.

`components/pricing/pricing-table.tsx` renders any catalog rate collection;
`components/pricing/pricing-section.tsx` renders a complete reusable service
section with its qualifications. Future service pages should import these
records/components rather than copying prices into page copy. Expert Opinion
Letters and Professional Experience Evaluation share the same rate records.
The homepage fee, standard turnaround, and FAQ interpolate the shared
Document-by-Document values. `lib/pricing-format.ts` handles localized price and
time display; `messages/*.json` contains wording, not fee or turnaround values.

Example: `<PricingSection section="translation" />` or
`<PricingTable rates={expertOpinion} caption={localizedTitle} showService={false} />`.

Visa fees are now included from the legacy Visa Service pages, as requested on
October 10, 2026. `visaFees` supplies the source prose, service tables, Pricing
page and structured offers. The introductory China starting fee and Q2/L starting
fee remain distinct. Consular/application charges are separate from AET fees;
Canada's application-plus-shipping total is derived. See
[Visa provenance](content/visa-service/README.md). Other Services includes translation, proofreading, and
English writing, as confirmed by the owner. Their rates and the proofreading
discount threshold share the pricing catalog.
No application-form-only add-ons have been imported. Existing old-site service
pages and the separate application portal are outside this shared data module.

## Shared office information

Edit `lib/contact.ts` to update public office addresses, phone numbers, email
addresses, messaging channels, or business hours. The four office detail pages,
six-office Contact directory, map directions and payment recipient mailing
addresses read this catalog. `components/offices/office-card.tsx` is the shared
contact module; office detail pages use its expanded layout. Office names and
field labels live in `content/contact/{en,zh,es}.json`, and the shared office-page
copy lives in `lib/office-content.ts`.

Imported article/service HTML passes through `lib/contact-html.ts` so reviewed
contact literals resolve against the same catalog. `content/contact/legacy-references.json`
is an immutable spelling map for imported source text, not a place to edit current
business details. Historical images are unchanged. New imports with additional
contact spellings must extend this map. Payment identities (Zelle/PayPal/bank
accounts) stay separately configured and must not follow general contact email edits.

Footer office links and Contact's Office details links use the localized office
routes. Legacy `e-office-{slug}[{-zh,-es}].php` and `.html` URLs redirect there.

## Structured data

`lib/structured-data.ts` generates Organization, LocalBusiness and Service graphs.
`components/structured-data.tsx` safely serializes them into server-rendered JSON-LD.
Homepage/About identify the organization; Contact describes all six offices; each
local office page describes its branch. Seven retained service types use the shared
provider ID. Untranslated service fallback pages omit duplicate service markup.

Office postal fields in `lib/contact.ts` also generate the existing English display
address; edit these fields when updating an address. Localized Beijing addresses
remain in the same record. Existing social links are shared with the footer through
`lib/organization.ts`; generic search links are not organization identity links.

Service offers read the visible shared rates from `lib/pricing.ts`, including
estimated/starting/range prices, units, turnaround and applicable minimums. Do not
add a second pricing table inside the schema module. Run
`python3 scripts/check-structured-data.py` against the existing local server to
check JSON parsing, Schema.org properties, entity references and visible facts.
The script uses Python's standard library and downloads the official vocabulary;
`--vocabulary /path/to/cached.json` supports a previously downloaded copy.
Google rich-result eligibility and post-deployment inspection remain separate checks.

### SEO maintenance checks

Use the existing preview. Restart it after changing the redirect configuration.
Export configured redirects without a production build:

```sh
node -e 'require("next/dist/server/config").default("phase-development-server",process.cwd()).then(async c=>require("fs").writeFileSync("/tmp/aet-redirects.json",JSON.stringify(await c.redirects())))'
python3 scripts/check-content-links.py --url http://localhost:3021
python3 scripts/test-blog-fragments.py
python3 scripts/check-blog.py --url http://localhost:3021
python3 scripts/check-preview-indexing.py
python3 scripts/check-seo.py --redirects /tmp/aet-redirects.json
python3 scripts/check-structured-data.py
python3 scripts/inventory-legacy-seo.py --redirects /tmp/aet-redirects.json
```

`check-content-links.py` checks imported HTML and all 299 page variants for old
body links, locale consistency, direct local destinations and valid fragments.
`check-seo.py` checks sitemap/canonical/hreflang, sharing image dimensions,
redirect destinations/queries/anchors, fallback noindex and legacy 404 behavior.
`check-structured-data.py` checks Schema.org vocabulary and visible facts.
Use `--base-url` for a different preview. The inventory script reads the sibling
legacy checkout; it does not execute PHP or alter the old site.

For public staging, pass `--expect-noindex` to `check-seo.py` and `check-blog.py`.
The indexing test uses Host headers against the local server to verify both
Vercel aliases and official-domain behavior. Blog HTTP parity uses the actual
contact renderer; static source hashes independently protect imported prose.
Avoid repeated hosted bulk crawls if Vercel responds with a security checkpoint;
record the blocked scope and complete local checks without bypassing protection.

Sharing cards are committed PNGs under `public/share`, so serving them does not
require a font service or image-generation endpoint. After page title changes,
regenerate them with `python3 scripts/generate-share-images.py` (Pillow required).
The script defaults to macOS Arial/Arial Unicode fonts; use `--font` and
`--cjk-font` with available equivalent fonts elsewhere. Fonts are rasterized,
not copied or redistributed. The unchanged AET logo follows ASSETS.md.

`content/blog/schema-images.json` selects existing inline article imagery of at
least 50,000 pixels, excluding archived reports, reviews, certificates and logos.
Recheck image relevance against the article when its content changes. Missing
verified author, image or date information stays absent from Article markup.
The publication dates continue to come from the original-source date catalog.
