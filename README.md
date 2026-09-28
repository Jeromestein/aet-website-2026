# AET Website 2026

A standalone Next.js App Router homepage for American Education and Translation Services. Built with TypeScript, responsive CSS, and small client-side enhancements. Ready to import into Vercel as a Next.js project.

## Local development

Requires Node.js 20.9 or newer and pnpm 9.7.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3021. The development port is configured in `package.json`.

## Validation and deployment

```sh
pnpm typecheck
```

Local production builds are not run under the project instructions. The owner manages deployment and the hosted production build.

Import this directory's repository into Vercel, choose the Next.js preset, and keep the default build/output settings. No environment variables, database, or external API keys are required. Deployment is intentionally left to the owner.

## Scope

Only `/` is rebuilt. Application and pre-evaluation buttons connect to the existing app.americantranslationservice.com portal. Service details, contact, payment, blog, office, policy, and Chinese/Spanish links point to the existing production website. Payment is not implemented in this project.

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
- [Agent guidance](AGENTS.md): reading order and project working rules.

The design guide specifies intended behavior; check the status file before treating a requirement as implemented.

## Existing action destinations

- Application: https://app.americantranslationservice.com/credential-evaluation-application
- Preliminary assessment: https://app.americantranslationservice.com/degree-equivalency-tool

Validate routes, metadata, and the intended deployment before launch. Do not submit applications, contact forms, or payments during link checks.

## Editing

- `app/page.tsx`: page content, service links, testimonials, and FAQs.
- `app/globals.css`: base responsive styles and motion. Reduced-motion preferences are respected.
- `app/reference-style.css`: shared AET surfaces, photo treatment, and logo presentation.
- `app/home-design.css`: final design-guide typography, spacing, responsive rails, and native menu styling.
- `components/card-rail.tsx`: progressive previous/next controls over native horizontal scrolling.
- `components/scroll-stories.tsx`: fact selectors and process imagery, with unpinned reduced-motion and no-JavaScript fallbacks.
- `components/navigation.tsx`: mobile navigation, language links, and progressive scroll reveals.
- `app/layout.tsx`: page metadata.
- `public/images/`: locally copied assets; see ASSETS.md.

Poppins, Fraunces, and Gaegu are hosted locally in `public/fonts/` and loaded through `app/fonts.css`. Font licenses and provenance are documented in ASSETS.md. Native details elements keep FAQs functional without JavaScript. Page content remains visible if JavaScript is disabled.
