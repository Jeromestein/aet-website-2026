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
for `PREEVAL_ORIGIN` and `PAYMENT_SITE_URL`. Keep secrets out of Git and restart
the user-managed process after changing startup configuration when required.

Worktrees share Git history but have separate files, dependencies and local
configuration. They do not automatically isolate external services or databases;
both checkouts can still point to the same local Supabase instance. `main` and
`dev` are development branches, not permanent website/backend applications.
To integrate later, commit the intended changes on `dev`, merge `dev` into
`main` from the main checkout, resolve conflicts and verify the result before
an explicitly authorized push or deployment. Do not copy folders over `main`.

## Staff authentication

The new password-based staff login at `/admin/login` uses cloud Supabase Auth
without Docker. Staff membership and office scopes are prepared administratively;
verified first login can preserve the existing email and password without another
registration or invitation. Both employee-migration and staff-cutover switches
remain off in the local preview, and the previous email-login entry is retained.

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
auxiliary workflows still use the isolated `PREEVAL_DATABASE_URL` cloud preview.
No Docker is needed. See [live CRM scope](docs/staff-auth.md#shared-live-business-records).

## Validation and deployment

```sh
pnpm check:i18n
pnpm typecheck
```

Local production builds are not run under the project instructions. The owner manages deployment and the hosted production build.

Import this directory's repository into Vercel and choose the Next.js preset. The
Payment page requires the server-only `PAYPAL_BUSINESS_*` and `PAYMENT_SITE_URL`
values documented in `.env.example`. Public marketing pages need no database;
the application pilot has separate service requirements in
[the local setup guide](docs/pre-evaluation-local.md).
Deployment is intentionally left to the owner.

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
rollback. The current pilot deliberately rejects non-local origins/databases;
binding a domain does not make it production-ready. Keep the existing AET App
operational until the separately authorized cutover. No deployment or DNS change
was made as part of the English-only staff update.

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
pilot (`PREEVAL_ENV=local`), this opens the four-step formal evaluation form at
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
local pilot (`PREEVAL_ENV=local`), the homepage pre-evaluation button opens the new
local workflow; other environments retain the existing portal destination. Miami, Boston, Los Angeles and Beijing
office pages are local at `/offices/{miami,boston,los-angeles,beijing}`, with
English, Chinese and Spanish variants. The localized Contact page is implemented. A localized Payment page is available
at `/payment`; its form uses a local PayPal HTML-form handoff. The header and
footer link to the localized page, and `/e-pay.php` redirects there. Merchant
accounts and payment reconciliation still need live review before launch.

The Blog index is available at `/blog`, `/zh/blog`, and `/es/blog`, with 80
retained articles and search. Credential evaluation is the primary topic:
its 28 articles appear by default, with other topics in a secondary selector.
All 80 English article bodies are local at `/blog/[slug]`; 157 legacy PHP/HTML
article URLs redirect to them. Article bodies remain English-only across locales,
without language-availability notices. Shared navigation and index controls stay
localized. Cards and page titles use each source body's heading; the original
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

As requested by the owner on September 28, 2026, the Services menu retains only:

- Certified Translation
- Technical Translation
- Interpretation
- Expert Opinion Letters
- General Translation
- Notarization

Visa Services, Editing/Proofreading, and China Consular Authentication are removed
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
the website language preference is preserved. Administrator email links open
`/admin/access`; customer status and result pages remain localized.
`/admin/CRM` uses the original sidebar, overview cards, status tabs, desktop table,
mobile cards and detail drawer with durable formal/pre-evaluation data. Statistics,
search, office filters, pagination, document/payment views and CSV export all use
server-enforced staff office permissions. Notes, formal status/quotes/reports,
preliminary result corrections, information requests and audit history use the
existing workflow APIs. `/admin/evaluations` and its detail links redirect into the
corresponding workspace view/drawer; `/admin/CRM/preview` redirects to the workspace.

The 3022 checkout connects directly to isolated cloud Supabase preview schemas;
Docker is not used. Business email, AI, Stripe and file transfer remain paused in
this mode. Both employee migration/cutover switches stay off. The old AET App
remains the production system until a separately authorized cutover. See
[cloud preview boundaries](docs/staff-auth.md#cloud-business-preview).

Bulk import and standalone payment drafts remain unavailable, with explicit UI
explanations. New application opens the existing intake forms; GPA remains a local
calculator. No action displays a successful save unless its API has succeeded.
Historical local-pilot setup is retained in [local workflow notes](docs/pre-evaluation-local.md).

Application URLs are not yet fully compatible with the old portal. The three
pre-evaluation paths are retained; formal `/status?applicationId=ID` now supports
localized customer lookup locally (uploads/payment continue in the old portal).
Legacy checkout and four standalone CRM tool URLs remain open work. See the
[dated URL comparison](docs/app-url-compatibility.md) before app-domain cutover.

## Documentation

- [Design baseline](docs/design.md): brand, fixed copy, logo, palette, typography, homepage composition, and responsive behavior.
- [Form/database compatibility](docs/legacy-form-compatibility.md): original field mappings, website price snapshots, local setup and cutover limits.
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

China Visa is excluded. Other Services includes translation, proofreading, and
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
