# AET Website 2026

A Next.js App Router website for American Education and Translation Services, with a homepage, Evaluation, Certified Translation, and shared Pricing page. Built with TypeScript, responsive CSS, and small client-side enhancements. Ready to import into Vercel as a Next.js project.

## Local development

Requires Node.js 20.9 or newer and pnpm 9.7.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3021. The development port is configured in `package.json`.

## Validation and deployment

```sh
pnpm check:i18n
pnpm typecheck
```

Local production builds are not run under the project instructions. The owner manages deployment and the hosted production build.

Import this directory's repository into Vercel and choose the Next.js preset. The
Payment page requires the server-only `PAYPAL_BUSINESS_*` and `PAYMENT_SITE_URL`
values documented in `.env.example`; other pages need no API keys or database.
Deployment is intentionally left to the owner.

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

Application and pre-evaluation buttons connect to the existing
app.americantranslationservice.com portal. Miami, Boston, Los Angeles and Beijing
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

Before replacing the production domain, migrate those routes or host the legacy site at a separate domain and update these URLs; otherwise they will point back to missing pages on the replacement site. This homepage is suitable for a separate Vercel preview immediately. Configure canonical URLs and the full legacy redirect map only when the production domain and migration plan are settled.

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

## Documentation

- [Design baseline](docs/design.md): brand, fixed copy, logo, palette, typography, homepage composition, and responsive behavior.
- [Implementation status](docs/status.md): completed checks, partial work, and pending acceptance items.
- [Migration checklist](docs/migration-checklist.md): legacy page scope, priorities, language coverage, blog inventory, and launch dependencies.
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
the active locale. External legacy pages and the separate application portal keep
their existing destinations and manage their own language settings.

Edit corresponding keys in all three `messages/*.json` files. Missing messages
fall back to English; development logs and `pnpm check:i18n` report omissions.
The check also validates message syntax, interpolation arguments, and preservation
of the original English testimonials. Translated reviews are labeled as translations;
brand artwork, institution names, and existing application screenshots are retained.
Localized titles, descriptions, HTML language attributes, and alternate-language
response links are supplied. Canonical URLs await the production-domain decision.

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
