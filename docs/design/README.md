# AET Design Guide

Shared design rules for AET 2026. Read this guide first, then only the relevant
page pattern below. These are requirements, not proof of implementation;
[status](../status.md) and the [checklist](../migration-checklist.md) own progress.

| Work area | Detailed reference |
| --- | --- |
| Homepage, navigation, Blog, institutions and motion | [Website patterns](website.md) |
| Application forms, customer Status, pre-evaluation and CRM | [Business UI patterns](business-ui.md) |
| Business email | [Email design](../email-templates.md#visual-design) |
| New service pages / article writing | [Service template](../service-page-template.md) / [Blog requirements](../blog-requirements.md) |
| Source assets / configuration | [Asset provenance](../../ASSETS.md) / [Development](../development.md) |

## Content and identity

- Be professional, clear, reliable and approachable: readable service information,
  generous space and obvious application/contact actions.
- Preserve approved wording, service names, testimonials and attribution. Do not
  invent metrics or change fees, turnaround, memberships, ratings or acceptance
  claims during visual work. Distinguish preliminary assessment from formal evaluation.
- Use the official ATA company profile for verification; never publish AET's ATA
  membership ID in copy, metadata or image alt text.
- Follow the [approved service scope](../development.md#service-scope). Keep
  Editing/Proofreading and China Consular Authentication out of navigation,
  service cards and footer links; their historical price records do not change scope.
- Read prices from `lib/pricing.ts`, office facts from `lib/contact.ts` and
  localized interface copy from `messages/*.json`. Preserve source qualifications.
  Homepage wording and hierarchy are specified in [website patterns](website.md).

## Logo

Assets live in `public/brand/`; sources and licenses belong in [ASSETS.md](../../ASSETS.md).

| Placement | Asset | Display rule |
| --- | --- | --- |
| Light header | `aet-logo-header.svg` | 300px desktop; 202–220px phones |
| Navy footer | `aet-logo-footer.svg` | Up to 280px, contained by its column |
| Large emblem | `aet-emblem.png` | Preserve proportions and clear space |
| Browser/application icons | `aet-icon-16/32/48/192/512.png` | From `aet-browser-icon-source.png` |

Header/footer lockups use a raster emblem and outlined Poppins Semibold lettering
at 520:120. Preserve both lines — “American Education and” and
“Translation Services,CORP (AET)” — including CORP and (AET) in image alt text.
Transparent PNG exports also remain available.

Do not recolor, stretch, rotate, shadow or blend logos. Keep clear space of at
least one quarter of the emblem height and retain source masters. Header/footer
artwork and full-map/red-A/road browser icons have transparent backgrounds; the
separate 180px Apple touch icon keeps its white canvas. Favicon frames are 16/32/48px.

## Color

Use shared tokens from `app/globals.css`. Pale blue and cool white dominate;
navy supplies contrast and orange identifies application actions. Blue tints may
support gradients. Logo red/gold remain in artwork; rating stars may stay gold.

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#F8FBFE` | Page background |
| `--blue` | `#EAF4FC` | Pale-blue surfaces |
| `--surface` | `#FFFFFF` | Cards / light text |
| `--ink` | `#18334E` | Primary text / navy surfaces / blue-button hover |
| `--muted` | `#5B6D7E` | Secondary text |
| `--action-blue` | `#284F75` | Standard buttons / outlined actions / metrics |
| `--accent` | `#507FA6` | Supporting graphics |
| `--line` | `#D9E5EF` | Borders and dividers |
| `--footer` | `#142E45` | Footer |
| `--orange` | `#C7471D` | Application action / restrained emphasis |
| `--orange-hover` | `#A93816` | Application-action hover |

White on the orange token has approximately 4.83:1 contrast. Keep semantic status
colors distinct: green saved/success, amber attention, red errors/destructive actions.
The general application's green forward/black Back buttons are an explicit
[form-specific rule](business-ui.md#general-application), not a global button change.

## Typography and spacing

Host fonts locally with `font-display: swap` and retain licenses. Values below
are CSS-pixel targets at a 16px root; use fluid rem limits without shrinking the
root. Poppins uses Arial/sans-serif fallback; decorative display roles are defined
in [website patterns](website.md#display-typography).

| Role | Weight | Desktop | Mobile |
| --- | --- | --- | --- |
| Body / service descriptions | Poppins 400 | 16–19px; line height 1.7–1.8 | 16px |
| Navigation / buttons | Poppins 600 | 15–16px | 14–16px |
| Hero | Poppins 600 | 61–102px | 44–64px |
| Section headings | Poppins 600 | 34–72px | 32–48px |
| Short labels | Poppins 600 | 12–14px | 12px |

Heading line height is about 1.0–1.15 with restrained -0.035em to -0.045em
tracking. Keep paragraphs around 45–65 characters wide; reserve uppercase for
short labels. Chinese needs appropriate fallbacks and natural line heights;
longer Spanish copy must wrap. CRM uses its own denser, heavier type scale.

| Layout | Desktop | Mobile |
| --- | --- | --- |
| Content | Maximum 1280px; about 56px gutters | 20px gutters; 16px at narrow widths |
| Section spacing | 96–120px | 56–72px |
| Header | 86px | 76px |
| Card gaps / padding | 24–28px / 32–48px | 16–20px / 24–32px |
| Card / large-panel radius | 24–30px / 30–40px | 22–26px / 24–30px |

Leave 24–32px from headings to supporting copy and 48–72px before main section
content. Allow taller sections and cards instead of shrinking or truncating copy.
Use soft shadows and keep decorative shapes outside the reading path. Compact
business cards and forms use the [business UI dimensions](business-ui.md).

## Interaction, accessibility and language

- Provide real destinations, at least 44px touch targets, visible focus/hover/active
  states and keyboard access. Do not represent an unavailable action as a saved result.
- Use native disclosures and scrolling where appropriate. Keep text and actions
  available without animation; reduced motion stops continuous movement, pinned
  fact changes and smooth scrolling. Hide decorative/duplicate content from
  assistive tools. Page content must remain readable without enhancement.
- Only designated rails and tables may scroll horizontally. Preserve wrapping,
  normal vertical reading flow and usability at 200% zoom; avoid page-wide overflow.
- Customer pages share localized navigation/footer and EN `/`, ZH `/zh`, ES `/es`
  structure. Staff `/admin/*` pages stay English-only without locale prefixes.
- An explicit locale wins, then saved preference, browser language and English.
  Switching preserves page, query and fragment, except protected formal link
  exchange while the token is in memory. Never change the customer's language
  through staff navigation. Missing translations use English and are flagged.
- Preserve institution names, full company wordmarks and application screenshots.
  Mark translated testimonials as translations; imported Blog bodies and legal
  pages retain their approved English-only behavior. Do not invent missing translations.

## Acceptance and maintenance

- Verify branding, approved copy, shared prices, destinations, samples and images.
- Check 320/390/760/850/1440px and 200% zoom for wrapping, clipping, controls and
  local scrolling; exercise affected desktop/mobile states in the in-app browser.
- Check keyboard/focus, contrast, meaningful alt text, native disclosures, reduced
  motion and fallback reading order. Target WCAG 2.2 AA without claiming certification.
- Follow [AGENTS.md](../../AGENTS.md) for checks and server ownership; no local production build.
- Update the existing rule in its owning guide. Keep progress, deployment state
  and test transcripts in status/checklist/dated evidence, not this design guide.
