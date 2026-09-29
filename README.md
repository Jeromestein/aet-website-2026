# AET Website 2026

A Next.js App Router website for American Education and Translation Services, with a homepage and shared Pricing page. Built with TypeScript, responsive CSS, and small client-side enhancements. Ready to import into Vercel as a Next.js project.

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

Import this directory's repository into Vercel, choose the Next.js preset, and keep the default build/output settings. No environment variables, database, or external API keys are required. Deployment is intentionally left to the owner.

## Scope

The homepage uses a shared `app/[locale]/page.tsx` template with Next.js i18n
(`next-intl`) for English, Chinese, and Spanish. English uses `/`; Chinese and
Spanish use `/zh` and `/es`. Migrate each additional page once through this same
locale architecture; language variants do not require separate page implementations.

Application and pre-evaluation buttons connect to the existing
app.americantranslationservice.com portal. Service details, contact, payment,
blog, office, and policy destinations still point to the existing production
website. Payment is not implemented in this project.

Pricing is implemented at `/pricing`, `/zh/pricing`, and `/es/pricing`. The
Services menu and footer use these localized routes. `/e-fee.php` redirects to
`/pricing`, preserving the legacy section anchors for retained services.

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

## Shared pricing

`lib/pricing.ts` is the single source for USD fees, price types (fixed, starting,
range, or quoted), units, turnaround, shipping/tracking, and minimum durations.
The baseline is the owner's September 29, 2026 updated legacy `e-fee.php`, not
the conflicting older service-page or application-form prices. Preserve its
non-Chinese-document scope independently of the UI language.

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

China Visa is excluded. Proofreading and English writing are currently omitted
in line with the narrowed new-site scope, pending the owner's scope response.
No application-form-only add-ons have been imported. Existing old-site service
pages and the separate application portal are outside this shared data module.
