# AET Implementation Status

Progress and verification evidence only. The design baseline lives in [design.md](design.md).

Updated September 25, 2026 after the homepage design pass. This records local
implementation and checks, not production deployment or accessibility certification.

### Why Choose Us BBB emphasis — September 28, 2026

- Follow-up: replaced the organization-name-only caption with highest-rating
  context and a commitment to dependable service, clear communication, and
  customer care. Highest-rating terminology follows
  [BBB's rating overview](https://www.bbb.org/about/overview-of-ratings).
- Follow-up checks: Codex in-app browser at 1440px and 390px confirms readable
  copy; mobile has no page overflow. Typecheck and diff whitespace checks pass.
  Screenshots: `output/playwright/why-choose-bbb-copy-desktop-2026-09-28.png`
  and `output/playwright/why-choose-bbb-copy-mobile-2026-09-28.png`.

- Removed the duplicate Experience & Membership strip below the institutions.
- Added the existing transparent BBB A+ Rating artwork beneath the Why Choose Us
  introduction with a Better Business Bureau caption. It remains visible while
  the original experience, language, and ATA fact panels change.
- Codex in-app browser: inspected the updated section at 1440px, 390px, and 320px;
  the badge loads and there is no page overflow. Confirmed the strip is absent
  and scrolled to the ATA panel with the BBB artwork still visible.
- `pnpm typecheck` and `git diff --check` passed using the existing port-3021
  server. No production build or deployment was performed.
- Screenshots: `output/playwright/why-choose-bbb-desktop-2026-09-28.png` and
  `output/playwright/why-choose-bbb-mobile-2026-09-28.png`.

### Hero layout refinement — September 28, 2026

- Set the wide-desktop title to three lines and reduced excess Hero height. Limited
  paragraph width and moved the portrait toward the right with a lighter overlay.
- Kept the photo behind the entire mobile Hero; removed the separate image block
  below the copy. Applied responsive crops and a stronger gradient behind mobile text.
- Aligned both actions at 54px on desktop and 50px on mobile, preserving their
  labels, colors, icons, and destinations. Retained the transparent BBB artwork.
- Codex in-app browser: visually checked the homepage Hero at 320, 390, 760, 850,
  and 1440px; no page overflow, and the mobile image covers the Hero background.
- `pnpm typecheck` and `git diff --check` passed. Used the existing port-3021 server;
  no production build, push, or deployment was performed for this follow-up.
- Screenshots: `output/playwright/hero-layout-desktop-2026-09-28.png` and
  `output/playwright/hero-layout-mobile-2026-09-28.png`.

### Hero BBB refinement — September 28, 2026

- Replaced only the Hero's white-backed BBB badge with the transparent derivative
  `public/images/bbb-hero-transparent.png`; original artwork remains unchanged.
- Kept “BBB A+ Rating” alternative text and the badge below the Hero actions.
  The artwork uses a compact navy layout with no card background or button styling.
- Codex in-app browser: inspected the current desktop Hero and 390px/320px mobile
  layouts; image loads, remains legible, and does not create page overflow.
- `pnpm typecheck` and `git diff --check` passed. Existing button styles and design
  rules were not changed. This follow-up has not been deployed.
- Screenshots: `output/playwright/bbb-hero-desktop-2026-09-28.png` and
  `output/playwright/bbb-hero-mobile-2026-09-28.png`.

### Implemented and locally checked

- [x] Retained AET header/footer artwork, the full-map icon assets, shared palette,
      exact Hero heading/description/actions, and BBB A+ artwork below the actions.
      Header, Hero, and footer inspected in the Codex in-app browser.
- [x] Applied the enlarged Poppins hierarchy, Fraunces facts heading, Gaegu figures,
      1280px content limit, section spacing, and larger card padding. The four-digit
      2009 figure has a separate scale and fits its desktop and mobile panels.
- [x] Preserved two institution rows of eight logos with 72/80-second rightward
      cycles, no logo tiles or pause button, and the required supporting sentence/link.
      Focus stops movement and exposes native scrolling through all logos; reduced
      motion and no JavaScript leave the original groups scrollable without duplicates.
- [x] Restored separate legacy descriptions for Document by Document Evaluation,
      Course by Course Evaluation, and Expert Opinion Letters in the featured card.
      Supporting service names, testimonial text and attributions, existing facts,
      FAQ processing time, and existing destinations remain in place.
      Source: the legacy site's `home-content.html`, documented in ASSETS.md.
- [x] Kept the homepage sections in the design-guide order. The three process
      stages now cover choosing an evaluation, providing the application/documents,
      and receiving an evaluation with a contact-team next step. No delivery guarantee
      or new processing-time claim was added.
- [x] Implemented native mobile rails for facts, supporting services, and testimonials
      at 760px and below. Each uses 88% cards, 16px gaps, proximity snapping, an exposed
      next-card edge, and progressive previous/next controls. All last cards are fully
      reachable; previous/next end states and native keyboard scrolling were checked.
      Required process steps, FAQs, Hero, and footer remain in vertical flow.
- [x] Desktop facts and process imagery enhance only above 850px, with at least 720px
      viewport height and no reduced-motion preference. Smaller/shorter viewports,
      reduced motion, and no JavaScript expose all content without pinned switching.
      Desktop selectors, the 2009 card, and changing process imagery were inspected.
- [x] Mobile navigation and language selection use native disclosures. Menu selection
      and Escape close the enhanced mobile menu and return focus to its trigger.
      Native menu and FAQ opening also work with JavaScript disabled.
- [x] Retained the 1920 x 1080 graduation source, 2560 x 1440 Hero source, and
      1600 x 2400 consultation source. Responsive image sizing and crops were checked;
      consultation imagery retains both faces and their documents. No broken images
      were found in the final browser check.
- [x] `pnpm typecheck` and `git diff --check` pass. No production build was run.

### Verification evidence

- Existing owner-run preview: `http://localhost:3021`; no server was started/restarted.
- Codex in-app browser: 320, 390, 760, 850, and 1440px checks, plus the 761px navigation
  boundary. Hero, services, mobile card navigation, native menu, desktop facts,
  process photos, pre-evaluation, expanded FAQ, and footer were inspected.
- Supplemental Playwright: the five required widths have no page overflow or
  overflowing headings/buttons. With reduced motion, no fact is hidden, pinned
  switching is off, and running page animations are absent.
- JavaScript-disabled checks: mobile menu and FAQ work, all three native rails can
  scroll, facts stay visible, and every process image is positioned above its copy.
  Desktop fallback images have explicit containing blocks and there is no page overflow.
- Enlargement checks: 200% root-text sizing at 1440px and 720 x 500 reflow (the CSS
  viewport equivalent of 200% zoom at 1440 x 1000). The Hero also wraps within its
  column after text enlargement. These are simulations, not a native browser-zoom test.
- Screenshots and raw checks are under `output/playwright/`. `aet-desktop.png` and
  `aet-mobile.png` show the final Hero; section captures show facts, rail end states,
  and the mobile footer. Full-page captures use reduced motion to expose all content.

### Remaining pre-launch checks

- [ ] Native browser 200% zoom, physical-device touch, and a full screen-reader /
      contrast audit. Keyboard and disclosure spot checks are not a full WCAG audit.
- [ ] Live availability and final production routing of all application, contact,
      payment, office, language, and legal destinations. This design pass preserves
      their targets; it does not submit forms or validate external workflows.
- [ ] Owner-managed deployment and production checks. No commit, push, or deployment
      was performed as part of this design pass.
