# Development and configuration

Use this reference when setting up a checkout, changing configuration or maintaining
shared website data. For current business progress, use [status](status.md);
for unfinished work, use the [migration checklist](migration-checklist.md).

- [Local development and worktrees](#local-development)
- [Environment variables and compatibility](#environment-configuration)
- [Staff authentication](#staff-authentication)
- [Validation, Preview and domain cutover](#validation-and-deployment)
- [Analytics](#analytics)
- [Service scope](#service-scope)
- [Editing and localization](#editing)
- [Pricing, offices and structured data](#shared-pricing)

Configuration instructions do not establish that a feature is deployed. Recorded
acceptance and remaining rollout gates live in the status/checklist documents.

## Local development

Requires Node.js 20.9 or newer and pnpm 9.7.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3021. The development port is configured in `package.json`.

### Main checkout and retired worktrees

Develop in `/Users/plusone/Desktop/Code/aet-website-2026` on `main`. Open this
folder in VS Code and run `pnpm dev` from your terminal at http://localhost:3021.
Reuse the owner's existing server; restart it after configuration changes when
required. The local `APP_ORIGIN` and `PAYMENT_SITE_URL` use port 3021.

The sibling `aet-website-2026-dev` and `aet-website-2026-eval` working directories
were removed on November 12, 2026 after checking their Git state and verifying
private local-file backups under `.local/retired-worktrees/`:

- `dev-20261112-144515`: original dev settings, database backups, test artifacts
  and the original main environment file. Dev's commits are contained in main;
  its development configuration was carried over to main with local port 3021.
- `eval-20261112-144745`: eval settings, local artifacts and a verified incremental
  Git bundle. **Four eval commits remain outside main**, including three not yet
  pushed. Keep branch `x/aet-eval`; review this feature separately before merging.
  Its bundle depends on existing repository history and is not a full repo backup.

Both branches remain available. Backup manifests contain file hashes; the backup
folder is ignored by Git and contains private configuration and data. Do not
commit or publish it. Dependency/build caches were discarded. Reopen old editor
windows and terminals in the main folder. No local application journey was rerun
as part of this directory cleanup; hosted Preview acceptance is recorded separately.

Future isolated feature worktrees should start from main. Worktrees isolate local
files, not external services or databases. Integrate reviewed features into main
and verify before an explicitly authorized push or deployment. Pushing main still
triggers Production; removing these directories does not change deployment settings.

## Environment configuration

Use one private `.env.local` in each worktree for actual local values. Keep
`.env.example` as the shared, secret-free template. Do not create a second `.env`
or service-specific secret file for the same worktree. Both files are grouped by
shared application configuration, pilot test recipient, staff
authentication, CRM, optional AI/email/payments/Dropbox and scheduled tasks.
The template origin defaults to port 3021 for the main checkout.
Organizing settings does not enable or disable their services.

Shared settings now use `APP_`, `APPLICATION_` and Dropbox-specific names.
Pre-evaluation-only settings keep `PREEVAL_`. Formal intake and some staff workflows
use the same configuration/database helpers. Marketing pages alone do not need
this entire configuration; the standalone Production expiry worker needs only
its three settings documented below.

### Temporary legacy-name compatibility

Server code and standalone scripts read through
[`lib/application-environment.mjs`](../lib/application-environment.mjs).
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
| `APP_ENV`, `APP_ORIGIN` | Select local, configured Preview, or the separately authorized six-table Production runtime and its trusted origin. See [runtime modes](pre-evaluation-local.md#production-capable-runtime--implemented-on-dev-not-activated). |
| `APPLICATION_DATABASE_MODE`, `APPLICATION_DATABASE_URL` | Shared application storage. URL is required; mode defaults to local when absent, but cloud-preview must be explicit. Keep mode explicit in the template. This is separate from the live CRM connection. |
| `APPLICATION_TEST_EMAIL` | Required in local/Preview only; controls pre-evaluation/legacy workflow recipients and the pre-evaluation test Checkout email. Production uses the stored applicant email. New formal intake uses its own fixed pilot recipient in `lib/application/intake.ts`; this is not a site-wide recipient override. Keep it even when optional mail dispatch is disabled. |
| `PREEVAL_AI_ENABLED`, `PREEVAL_OPENAI_MODEL` | Optional pre-evaluation AI capability and model override. Missing switch means off; the current model default is `gpt-6.1-sol`. The API key is required when AI is enabled. |
| `PREEVAL_EMAIL_ENABLED` | Optional pre-evaluation Preview/Production mail opt-in; dispatch also requires an application ID. It does not control newer formal-intake confirmation mail, and the older local-database dispatcher bypasses this flag. |
| `PREEVAL_STRIPE_MODE`, `PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET` | Dedicated pre-evaluation mode and live endpoint secret. Test is the default; live requires the explicit main/Production configuration. Separate from the shared Payment page. |
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
override; see [Payment configuration](../content/payment/README.md).

The unused `PREEVAL_CODEX_BIN`, `PREEVAL_CODEX_MODEL`, `PREEVAL_PDFINFO_BIN`
and `PREEVAL_PDFTOPPM_BIN` have been removed from the local file. Current direct
API analysis does not read them. The template also omits unused Stripe publishable
keys because hosted Checkout uses server-side secret keys.

Old pre-evaluation lifecycle and formal-evaluation workflow/browser-fixture
scripts take an explicit `--test-actor=email` command-line argument through
`scripts/legacy-test-actor.ts`. There is no environment-variable fallback or
website setting for this identity. Use a synthetic identity such as
`--test-actor=lifecycle-test@example.invalid`; see
[lifecycle test setup](pre-evaluation-local.md#lifecycle-test-only-audit-identity).
The argument labels test audit entries or synthetic legacy authentication fixtures;
it does not configure website staff membership or change the controlled recipient.

When integrating older feature branches, retain the removal of `admin` from
shared website configuration and the environment template. Adapt old fixtures to
the command-line helper instead of restoring an environment dependency.

One-off verification switches and staff-session cookies should be supplied only
to their explicit verification commands. The optional scoped email-recovery
settings are documented in [email recovery](preeval-email-recovery.md); they
are not required for normal request-scoped mail delivery and are not enabled by
this template. A blank or absent optional provider credential does not by itself
prove that all of its callers are disabled; check the applicable feature's guard.

Keep `STATUS_EXPIRY_ENABLED=false` locally. Vercel Production uses the saved
`STATUS_EXPIRY_DATABASE_URL` and `CRON_SECRET`, with its own expiry switch set
explicitly to `true` when ready. Never import the entire local file into Vercel:
origins, database modes and feature switches are environment-specific. See
[payment-expiry setup](payment-expiry.md). Real values remain Git-ignored;
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
[independent administrator setup](staff-auth.md#independent-administrators-without-employee-migration).

See [the dependency inventory and rollout plan](staff-auth.md) for the
approved roster, server-only configuration, test results and remaining production
work. Authentication uses `STAFF_AUTH_DATABASE_URL`. The original 3022 CRM now
reads and edits the shared production business tables through a separate restricted
`CRM_DATABASE_URL` with `CRM_DATA_SOURCE=live`. Changes appear in the old workspace
after refresh; employee authentication remains unchanged. Customer intake and its
auxiliary workflows still use the isolated `APPLICATION_DATABASE_URL` cloud preview.
No Docker is needed. See [live CRM scope](staff-auth.md#shared-live-business-records).

## Validation and deployment

For current business progress, read the [migration checklist](migration-checklist.md)
and [progress analysis](status.md#module-progress). They distinguish
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
[the local setup guide](pre-evaluation-local.md).
Deployment is intentionally left to the owner.

### Vercel Preview

Develop on `main` and use the dedicated testing origin:
`https://aet-main-preview-meiyutechs-projects.vercel.app`.
See [main Preview acceptance](archive/main-preview-2026-11-12.md) for verified
behavior and remaining checks. The former dev deployment remains available as a
historical deployment; new testing no longer requires the dev branch.

Vercel still uses `main` as its Production branch. A Git push to main still
triggers a Production deployment; this configuration does not change that rule.
For testing without changing Production, explicitly create a Preview deployment
from reviewed main source, wait for Ready, then assign only the testing alias:

```sh
pnpm dlx vercel@65.15.0 deploy --environment preview --project aet-website-2026 --scope meiyutechs-projects
pnpm dlx vercel@65.15.0 alias set <ready-preview-deployment-url> aet-main-preview-meiyutechs-projects.vercel.app --scope meiyutechs-projects
```

Do not use the `git-main` alias for this: it belongs to the Production deployment.
Do not promote this Preview to Production. The testing alias retains the same
public Preview access as the former dev alias; employee login and office checks
still protect CRM. Unique deployment URLs retain Vercel authentication.

Vercel rejects a main-specific Preview variable override while main is the
Production branch. The former dev test configuration therefore now supplies the
**default Preview environment**, including any future Preview branches. Sensitive
variables were moved in place without exporting their values. Four identical
shared Preview/Production variables and their old dev overrides were preserved.
Production variables were not changed. Do not use these defaults for untrusted
branch deployments; existing Git fork protection remains enabled.

Required values are `APP_ENV=preview`, `APPLICATION_DATABASE_MODE=cloud-preview`,
`APPLICATION_CORE_MODE=six-preview`, and the testing HTTPS origin in `APP_ORIGIN`.
`APPLICATION_PREVIEW_ALIAS` contains that exact hostname without a scheme.
When absent, origin validation continues to use `VERCEL_BRANCH_URL`. Forms accept
only the configured origin or the exact current `VERCEL_URL`; request Host and
forwarded headers cannot supply trust. Both staff migration/cutover switches
remain `false`. These settings never enable Production applications.

Authentication, live CRM and isolated intake retain separate database connections.
`CRM_DATA_SOURCE=live` accesses the same business records as the old workspace:
Preview does **not** isolate CRM Live edits. Use Test view for synthetic work.
The six application tables remain in `aet_preview_shared`; no table or grant was
changed. Existing native staff accounts are reused without migration.

Stripe remains in test mode. `PAYMENT_SITE_URL` and `STRIPE_TEST_SITE_URL` use the
new testing origin. Existing test endpoint `we_1UTTP2JMcR2XIhynZXyFcdYa` now points
to its `/api/pre-evaluation/stripe-webhook`; its signing secret and event list
were retained. No relay or temporary secret is needed. Production Stripe remains
unchanged. The existing dedicated pre-evaluation flow is distinct from the still
unconnected pre-evaluation choice in `/application`.

Environment changes apply to new deployments. Local `.env.local` files and server
ports were not changed. Never commit credentials or connection strings.

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
rollback. The pilot accepts local testing and an explicitly configured Preview only;
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
See [payment integration notes](../content/payment/README.md) for setup, verification
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

ChatGPT Ads uses the AET Website Pixel through `OpenAiAdsPixel` and
`lib/openai-ads.ts`. It initializes once and sends `page_viewed` on public
marketing-page navigation, with pathname-only content IDs. It does not send
contact values, application IDs, query strings or completed-lead claims in event
payloads. The SDK handles the incoming `oppref` attribution reference.
Only the official website hosts in production are enabled; localhost, preview
hosts, application/payment/status/document routes and staff pages are excluded.
Debug logging is disabled. The SDK may remain loaded after public-page navigation,
but no measurement call is made on excluded routes. Website installation does
not create Ads Manager conversion goals or verify event receipt.
Run `pnpm exec vitest run tests/openai-ads.test.ts` for the measurement boundaries.

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
[source provenance and launch review](../content/legal/README.md) for the operational
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
[Visa provenance](../content/visa-service/README.md). Other Services includes translation, proofreading, and
English writing, as confirmed by the owner. Their rates and the proofreading
discount threshold share the pricing catalog.
The unified application also consumes the shared evaluation rates. Its
2026 24-hour/same-day choices and office-local 1 pm cutoff are documented in
[the active checklist](migration-checklist.md#unified-application-and-fulfillment).
Do not copy conflicting legacy application prices into new pages.

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
