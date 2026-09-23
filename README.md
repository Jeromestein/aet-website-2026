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
pnpm run build
```

Import this directory's repository into Vercel, choose the Next.js preset, and keep the default build/output settings. No environment variables, database, or external API keys are required. Deployment is intentionally left to the owner.

## Scope

Only `/` is rebuilt. Application and pre-evaluation buttons connect to the existing app.americantranslationservice.com portal. Service details, contact, payment, blog, office, policy, and Chinese/Spanish links point to the existing production website. Payment is not implemented in this project.

Before replacing the production domain, migrate those routes or host the legacy site at a separate domain and update these URLs; otherwise they will point back to missing pages on the replacement site. This homepage is suitable for a separate Vercel preview immediately. Configure canonical URLs and the full legacy redirect map only when the production domain and migration plan are settled.

## Editing

- `app/page.tsx`: page content, service links, testimonials, and FAQs.
- `app/globals.css`: base responsive styles and motion. Reduced-motion preferences are respected.
- `app/reference-style.css`: IRFC-inspired styling adapted to AET blue: photo-led hero, rounded cards, pill buttons, and soft tonal surfaces.
- `components/navigation.tsx`: mobile navigation, language links, and progressive scroll reveals.
- `app/layout.tsx`: page metadata.
- `public/images/`: locally copied assets; see ASSETS.md.

Poppins, Fraunces, and Gaegu are hosted locally in `public/fonts/` and loaded through `app/fonts.css`. Font licenses and provenance are documented in ASSETS.md. Native details elements keep FAQs functional without JavaScript. Page content remains visible if JavaScript is disabled.
