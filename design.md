# AET Website Design Guide

This document defines the visual identity and implementation details for the
American Education and Translation Services (AET) website, including brand
presentation, typography, color, page structure, components, and responsive
behavior. It guides the Next.js website prepared for deployment on Vercel.

## Brand Foundation

AET provides professional translation and foreign credential evaluation
services. Its website should clearly explain these services, their purposes,
and the steps needed to apply. Employment, immigration, and education are key
contexts for visitors seeking evaluation of international credentials.

The visual tone should be professional, clear, reliable, and approachable.
Use orderly layouts, readable typography, pale-blue surfaces, and generous
whitespace to make service information easy to understand. Keep application
and contact actions visible and easy to use.

The existing AET homepage copy is the default for public-facing text. Improve
its presentation without replacing concrete service explanations with newly
invented slogans or an unrelated brand narrative. These design principles
guide the interface; they are not additional marketing statements to publish.

## Message Architecture

Organize the message around what AET does, which service the visitor needs,
how to begin, and the supporting experience and recognition. Preserve the
existing homepage wording wherever possible.

### Hero — Exact Copy

**Heading**

> Professional Translation & Evaluation Services

**Description**

> Professional translations and credential evaluations trusted by USCIS, colleges, and government agencies nationwide.

**Buttons:** Apply Now · Contact Us

Keep the heading, description, and button labels unchanged. Responsive line
breaks and visual styling may change. Show the existing BBB A+ Rating artwork
with the Hero actions.

### Service and Content Hierarchy

Use the existing section and service names:

| Content role | Public-facing wording | Purpose |
| --- | --- | --- |
| Main service | Foreign Credential Evaluation | Explain educational credential evaluation and its uses |
| Evaluation types | Document by Document Evaluation; Course by Course Evaluation; Expert Opinion Letters | Help visitors distinguish the available reports and services |
| Preliminary assessment | Pre-Evaluation Services | Explain the preliminary assessment before a formal evaluation |
| Experience and service evidence | Why Choose Us | Present existing experience, membership, and language information |
| Additional services | Other Services | Group Certified Translation, Interpretation, Technical Translation, and Visa Services |
| Institutional recognition | Trusted by Leading Institutions | Present the institution logos and existing acceptance statements |
| Client feedback | What Our Clients Say | Present the existing testimonials with their attribution |

Retain the original service descriptions as the starting copy. If a component
needs a shorter excerpt, preserve the meaning and important qualifications;
do not substitute a new promise. Keep the distinction between preliminary
assessment and formal credential evaluation clear.

### Application and Supporting Actions

Preserve the action label appropriate to each section: **Apply Now**,
**Contact Us**, **Start Application**, **Learn More About FCE**, and
**Start Your Pre-Evaluation**. Keep each action connected to its intended
service or destination rather than renaming all actions to a generic slogan.

### Institution Message

**Description**

> Our credential evaluation services are recognized and accepted by educational institutions, government agencies, and professional organizations across the United States.

**Supporting sentence below the logos**

> Our evaluations are widely accepted by universities, employers, and government agencies nationwide.

Keep the supporting sentence grouped with **Explore all institutions**.
The two-row carousel may change how the logos are presented without changing
these statements.

### Copy Preservation Rules

- Preserve the original spelling, capitalization, and wording of fixed Hero
  text and named services. Change line breaks and layout to fit the device.
- Prefer the original section headings to aspirational replacement headlines.
- Do not introduce new brand-belief, brand-promise, or emotional taglines.
- Keep testimonials and attributions faithful to the original text.
- Do not silently change prices, processing times, response-time statements,
  membership dates, ratings, or acceptance claims while redesigning a section.
  Record any necessary factual correction separately before updating that copy.
- Do not expand existing acceptance statements into additional guarantees.
- Retain the agreed placement of the institution carousel directly below Hero;
  preserving text does not require preserving the old visual layout.

## Logo

The AET identity combines a blue United States silhouette, a red capital A,
and a gold-edged navy road. Use the refreshed artwork consistently across the
website. Keep the colors of the emblem independent of the page palette.

### Logo Variants

| Variant | Asset | Use |
| --- | --- | --- |
| Full emblem | `public/brand/aet-emblem.png` | Brand illustrations and larger standalone placements |
| Light-background horizontal logo | `public/brand/aet-logo-header.svg` | Header and pale-blue or near-white surfaces |
| Dark-background horizontal logo | `public/brand/aet-logo-footer.svg` | Navy footer and dark surfaces |
| Full-map browser icon | `public/brand/aet-icon-32.png` | Browser tabs; preserve the supplied map, A, and road |
| Application icons | `public/brand/aet-icon-192.png`, `public/brand/aet-icon-512.png` | Manifest icons and larger square placements |

The horizontal logos pair the full emblem with two lines of Poppins Semibold:
“American Education” and “and Translation Services”. Header lettering is navy
(`#18334E`); footer lettering is near-white (`#F8FBFE`). Text is converted to
outlines so the exported artwork does not depend on installed fonts. The SVG
lockups contain an embedded raster emblem and vector lettering; they are not
fully vector artwork. Transparent 3x PNG exports are also provided.

Browser and application icons use the owner-selected full-map artwork in
`public/brand/aet-browser-icon-source.png`: blue United States silhouette,
red A, and gold-edged navy road on white. Preserve this artwork and its aspect
ratio; do not substitute the generated compact monogram. Fit it within a square
white canvas without cropping or stretching. The favicon contains 16px, 32px,
and 48px versions; the Apple touch icon is 180px and manifest icons are 192px
and 512px. Header and footer lockups retain the refreshed emblem.

### Placement and Sizing

- Use the complete horizontal logo in both the header and footer, not a plain
  text substitute for AET.
- The horizontal artwork has a 520:120 aspect ratio. Display the header logo
  at approximately 259px wide on desktop and 170–202px on mobile. Keep its
  height automatic and maintain readable navigation spacing.
- Display the footer logo up to 280px wide, constrained to its column width.
- Keep at least one quarter of the emblem height clear around a logo. Avoid
  placing text, rules, or controls in that space.
- Use transparent artwork on the appropriate light or dark surface; do not add
  a white rectangular tile around the header or footer logo.
- Keep the logo out of busy photographs and preserve its aspect ratio.
- Do not recolor, stretch, rotate, apply blend modes, or add shadows to the
  identity artwork. Do not attach a promotional slogan to the lockup.
- Keep the high-resolution generated masters for future export. The original
  supplied logo remains unchanged.

## Color System

Use pale blue and cool white for the main surfaces, navy for readable text and
professional depth, and a restrained orange accent for the application action.
The canonical tokens are defined once in `app/globals.css` and shared by global
styles and component CSS modules.

| Token | Canonical value | Primary use |
| --- | --- | --- |
| `--paper` | `#F8FBFE` | Page background and near-white surfaces |
| `--blue` | `#EAF4FC` | Hero, institution carousel, and supporting pale-blue surfaces |
| `--surface` | `#FFFFFF` | Cards and light text on dark backgrounds |
| `--ink` | `#18334E` | Headings, main text, dark sections, and blue-button hover |
| `--muted` | `#5B6D7E` | Secondary text on light backgrounds |
| `--action-blue` | `#284F75` | Standard buttons, outlined actions, and key metrics |
| `--accent` | `#507FA6` | Supporting blue graphics and small decorative accents |
| `--line` | `#D9E5EF` | Subtle borders and dividers on light backgrounds |
| `--footer` | `#142E45` | Footer background |
| `--orange` | `#C7471D` | Apply Now button and restrained action emphasis |
| `--orange-hover` | `#A93816` | Apply Now hover state |

### Color Rules

- Let pale blue and cool white dominate. Keep the Hero and institution carousel
  visually connected with the same pale-blue background.
- Use navy sections to create rhythm for the process story and closing action.
  The footer uses its dedicated darker navy.
- Keep the institution logos on the section background without white tiles.
- Use the orange filled button for Apply Now. Use blue for standard actions,
  blue outlines for secondary actions, and light buttons on dark sections.
- Pair the orange button with white text. `#C7471D` provides approximately
  4.83:1 contrast against white; its darker hover state preserves readability.
- Use shared tokens for flat backgrounds, ordinary text, borders, and controls.
  Deliberate gradient stops, translucent overlays, and decorative tints may use
  related blue shades; do not create new near-identical colors for the same role.
- Use light text on dark surfaces. Reserve muted blue-gray text for light surfaces.
- Keep red, blue, and gold in the logo artwork unchanged. Logo colors do not
  automatically become page background or button colors. Small gold review
  stars may remain as a rating indicator.
- Check text, controls, hover, and focus contrast in their actual context.
  Decorative accents and divider colors are not substitutes for readable text.

## Material, Light, and Motifs

Create a calm atmosphere with light blue surfaces and restrained depth.

- Use layered cool whites and pale blues.
- Use soft reflections and diffused highlights; avoid mirror-like metallic
  effects and glossy gold gradients.
- Use supporting blue accents only on refined edges and details.
- Allow generous negative space so content can breathe.
- Circular light, orbit, or pearl forms may support composition when subtle.
- The lotus may appear as a single abstract petal, restrained bloom, embossed
  form, glass texture, soft shadow, or mother-of-pearl watermark.
- Never use traditional lotus patterns, religious imagery, complex botanical
  line art, or a lotus as a second logo.

## Typography

The typographic experience should feel like a premium editorial publication,
not a corporate presentation or dashboard.

- Use the approved brand typeface when supplied. Until then, treat font choices
  as implementation defaults rather than permanent brand assets.
- Configure heading and body fonts through HubSpot theme fields. Do not hardcode
  a page-specific font stack.
- Use large, quiet headlines; short paragraphs; wide line spacing; and generous
  separation between content groups.
- Use sentence case for headings and buttons. Reserve uppercase for short
  eyebrows, section labels, and compact metadata.
- Keep body text at least `16px`, with a line height of approximately `1.6–1.8`.
- Keep paragraph width comfortable for reading, generally no more than
  `60–72ch`.
- Do not shrink text to fit. Shorten the copy or change the layout.
- Avoid decorative script fonts, playful display fonts, and excessive weight
  changes.

## Layout and Composition

- Prefer a flat editorial composition over grids of UI cards.
- Use one dominant visual or idea per section.
- Maintain generous and consistent left and right margins.
- Use whitespace to establish hierarchy before adding borders, fills, or shadows.
- Use fine rules and restrained alignment cues instead of heavy containers.
- Cards are allowed when they clarify repeated information, but they should not
  make the site feel like a dashboard.
- Keep corner radii restrained and consistent. Avoid oversized, playful pill
  shapes on large content surfaces.
- Shadows should be soft, low-contrast, and used only to suggest material depth.
- Motion should be slow, subtle, and purposeful. Avoid promotional motion,
  bouncing elements, or effects that compete with medical content.
- Respect `prefers-reduced-motion`.

## Photography

Photography must combine science, art, and life.

### Preferred Subjects

- **Science:** real laboratories, embryology, procedures, and clinical systems.
- **Space:** architecture, air, light, materials, circulation, and details.
- **People:** real physicians and care teams portrayed with restraint and warmth.
- **Life:** hands, light, anticipation, connection, and human detail.

### Photography Rules

- Prefer approved, authentic INCINTA facilities and people over generic stock.
- Use natural light, quiet color, controlled framing, and editorial crops.
- Show medical environments accurately; do not stage unsupported capabilities.
- Avoid generic smiling-family clichés, sentimental maternity imagery, baby
  footprints, egg icons, and promotional fertility symbolism.
- Use meaningful alt text for informative images and empty alt text for purely
  decorative images.
- Do not reuse the same prominent image repeatedly across adjacent sections.

## Navigation and Global Shell

- Keep navigation simple and patient-centered. Complex content should be hidden
  within clear information architecture, not exposed as a dense mega-menu.
- Preserve the existing two-level navigation behavior unless usability evidence
  supports a change.
- Primary patient paths should include Home, Why INCINTA, Our Standard, Doctors,
  Treatments, Locations, Laboratory & Science, Patient Resources, About, and
  Schedule a Consultation.
- The header should be cool white or softly translucent, with minimal shadow.
- Use the shared action blue for the header action and small identifiers.
- Keep Patient Portal as a visible utility action.
- The footer should use the INCINTA identity, verified contact information,
  patient links, legal links, and the approved legal-entity language.
- Rebranding visible identity does not automatically authorize changing the
  legal entity, privacy controller, phone number, form destination, or domain.

## Buttons and Calls to Action

- Primary CTA: **Schedule a Consultation**.
- Secondary CTAs: **Call** and **Find a Location**.
- Keep actions visible, but let trust and evidence precede sales pressure.
- Use orange for Apply Now and action blue for standard filled buttons, with white text.
- Use blue text links or a restrained blue outline for secondary actions.
- Keep logo gold out of filled button surfaces.
- Controls must be at least `44px` high and have clear hover, active, focus, and
  disabled states.
- Avoid repeated CTA clusters at every section boundary.

## Homepage Flow

The homepage should follow this sequence:

1. **Emotion / Hero** — `Life Is the Ultimate Art.`
2. **Why** — explain why the beginning of life deserves more than a routine
   medical process.
3. **Standard** — introduce `A New Standard in Fertility Care.`
4. **Five Proofs** — turn the five standards into evidence, not just headings.
5. **Experts** — physicians and embryology professionals.
6. **Network** — `One INCINTA Network` across the approved locations.
7. **Action** — `Your Beginning Starts Here.` with consultation, call, and
   location paths.

The five standards are:

1. **Science, Revealed.**
2. **Architected for Life.**
3. **Life, Treasured.**
4. **Systems of Excellence.**
5. **Private by Nature.**

Each standard must be supported by approved, understandable evidence. Do not
publish facility, laboratory, security, privacy, outcome, or network claims
solely because they appear in a presentation.

## Page Patterns

### Doctor Pages

- Open with an approved portrait, one medical philosophy statement, and a
  consultation CTA.
- Present board certification, expertise, research, and outcomes only in a
  compliant form.
- Include the physician's communication approach and reason for choosing
  reproductive medicine where approved.
- End with appointment, location, and related-treatment paths.
- Do not format the page as a résumé.

### Location Pages

- Present each center as distinctive evidence within `One INCINTA Network`.
- Include approved photography, physicians, available services, verified
  laboratory or surgical capabilities, map, parking or arrival information,
  and appointment access.
- Keep visual standards and the consultation path consistent across locations.

### Treatment Pages

Treatment pages should help patients make decisions rather than imitate an
encyclopedia. Follow this sequence:

1. **Understand** — What am I facing?
2. **Decide** — When may this treatment be appropriate?
3. **Experience** — What would care at INCINTA involve?
4. **Proof** — Why is this team or setting trustworthy?
5. **Next** — How do I begin?

## Mobile Design

Mobile is a primary brand experience, not a reduced desktop layout.

- Present one major idea per viewport whenever practical.
- Keep navigation short, thumb-friendly, and easy to close.
- Keep consultation, call, and location actions easy to reach without obscuring
  content.
- Lead with concise content and progressively reveal deeper detail.
- Avoid horizontal page overflow. Horizontal card scrolling is acceptable only
  when it is obvious, keyboard-accessible, and does not hide essential content.
- Preserve image focal points and readable contrast at narrow widths.
- Test at `390px` and at the site's major responsive breakpoints.

## Accessibility and Performance

- Meet WCAG 2.2 AA contrast and interaction requirements.
- Preserve semantic headings, landmarks, keyboard navigation, skip links,
  visible focus states, form labels, status messages, and reduced motion.
- Never communicate meaning through color alone.
- Use responsive images with explicit dimensions to reduce layout shift.
- Load the hero image intentionally for good LCP performance; lazy-load
  below-the-fold media.
- Avoid decorative effects that materially delay content or interaction.
- Verify desktop and mobile layouts with no horizontal overflow, broken images,
  clipped text, or browser console errors.

## HubSpot Implementation Rules

- Expose the complete INCINTA palette and heading/body typography through
  `fields.json`.
- Components must consume semantic theme tokens rather than hardcoded near-match
  colors.
- Keep shared identity in the global header and footer modules.
- Keep page copy, approved imagery, links, facts, and calls to action editable in
  HubSpot modules.
- Preserve existing routes, forms, Patient Portal links, analytics, and page
  relationships during the visual rebrand unless a separate migration plan
  explicitly changes them.
- Use an isolated, noindex INCINTA preview page and a unique drag-and-drop content
  area before changing the existing homepage instance.
- A template upload alone does not guarantee that saved HubSpot page content will
  adopt new defaults. Verify the actual page instance before publication.
- Keep source code in this repository as the source of truth for templates,
  modules, responsive behavior, styles, and JavaScript.

## Do and Don't

### Do

- Lead with pale blue and cool white.
- Use generous whitespace.
- Reserve orange for application emphasis.
- Use authentic medical and architectural photography.
- Use the lotus only as an abstract supporting motif.
- Use navy sections and blue accents intentionally.
- Make medical information clear and credible.
- Preserve calm while keeping the next action obvious.

### Don't

- Do not introduce purple as a competing brand color.
- Do not cover large areas with orange or gold.
- Do not extend the logo red and gold into unrelated interface accents.
- Do not use traditional lotus patterns or a lotus as a logo.
- Do not use baby footprints, egg icons, or generic fertility symbols.
- Do not create a promotion-poster feeling.
- Do not attach explanatory text below the logo.
- Do not build dense dashboards, excessive card grids, or decorative UI chrome.
- Do not publish unverified medical, facility, outcome, security, or privacy
  claims.

## Review Checklist

Before approving a page, confirm that:

- The visible identity is consistently INCINTA Pearl Luxe.
- Pale blue and cool white dominate the composition.
- Navy, blue, and orange follow the roles defined in the Color System.
- The page communicates one clear idea at a time.
- Photography is approved, authentic, and accurately captioned.
- Medical and operational claims have appropriate approval and support.
- Primary and secondary actions follow the approved hierarchy.
- Desktop and mobile layouts are readable and free from overflow.
- Keyboard, focus, contrast, alt text, forms, and reduced motion are verified.
- Navigation, appointment, phone, location, Patient Portal, and legal links work.
- Metadata, canonical URLs, analytics, and redirects are verified before launch.
