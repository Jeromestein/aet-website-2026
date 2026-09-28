# AET Implementation Status

Progress and verification evidence only. The design baseline lives in [design.md](design.md).

Updated September 25, 2026 after the homepage design pass. This records local
implementation and checks, not production deployment or accessibility certification.

### Google rating and equal-height testimonials — September 28, 2026

- Shortened xiao h to the second original paragraph at the owner's request.
  The other four reviews remain complete. Removed per-slide height changes:
  all cards now stretch to the tallest natural height for the current viewport.
  Avatars retain explicit 48 x 48 dimensions and contain their original images.
- Added a restrained Google reviews summary with 5.0, five gold stars, and
  “Read more reviews” linking to the owner's Google search in a new tab.
  Checked the live Google business panel: 5.0 out of 5 on September 28, 2026.
  The score is static; no live review count is displayed.
- Codex in-app browser: desktop (1440px) and mobile (390px) inspected. All five
  cards measure the same height, and the rail height remains unchanged after
  keyboard-activated next/previous navigation. At 320px, all cards also remain
  equal-height, all avatars remain 48 x 48, and there is no page overflow.
  Verified the outbound href and new-tab target against the supplied destination.
- `pnpm typecheck` and `git diff --check` passed. Existing preview server reused;
  no production build or deployment. Screenshots:
  `output/playwright/testimonials-google-desktop-2026-09-28.png` and
  `output/playwright/testimonials-google-mobile-2026-09-28.png`.

### Header redesign — September 28, 2026

- Adopted the IRFC header structure: translucent light desktop bar, centered
  navigation, separate language control, circular mobile toggle, and a navy
  viewport-height mobile menu with numbered rows and expandable service links.
  Retained AET artwork, fonts, and blue palette.
- Restored Home, Evaluation, Services, Contact, Payment, and Blog from the legacy
  `americantranslationservice.com/header.html`, including all nine Services links
  and English/Chinese/Spanish options. Home points to this rebuilt homepage;
  service, contact, payment, blog, and translated pages retain legacy destinations.
- At 1080px and below, only the logo and hamburger remain in the top bar.
  Native disclosures support basic access without JavaScript; enhancements add
  Escape/outside/focus-away dismissal, focus containment, background scroll
  locking, selection closing, and breakpoint resets.
- Codex in-app browser: visually inspected desktop at 1440px and 1081px, phones
  at 390px and 320px, desktop service/language dropdowns, mobile open/closed
  states, and the expanded nine-service list. Verified keyboard expansion,
  Escape focus restoration, language-to-logo focus wrap, and Home selection
  closing the mobile panel. Scrolled the expanded list to its final service
  and the lower navigation/language choices. Physical touch was not tested.
- Width checks at 320, 390, 760, 850, 1080, 1081, 1200, and 1440px found no page
  overflow. Reduced-motion and no-JavaScript fallbacks were inspected in code,
  not separately browser-emulated for this change.
- `pnpm typecheck` and `git diff --check` passed. Used the existing port-3021
  preview; no server restart, production build, commit, push, or deployment.
- Screenshots: `output/playwright/header-desktop-2026-09-28.png`,
  `output/playwright/header-mobile-2026-09-28.png`, and
  `output/playwright/header-mobile-menu-2026-09-28.png`.

### Footer icons and office list — September 28, 2026

- Removed every diagonal arrow from the footer and removed New York and San
  Francisco from its office links at the owner's request. Added recognizable
  monochrome LinkedIn, Yelp, Facebook, and Google icons beside their labels.
- Codex in-app browser: checked the footer at 1440px and social icons at 390px;
  confirmed four social SVGs, no arrow icons, no removed office links, visible
  keyboard focus, and no mobile page overflow. Typecheck and diff checks passed.
- Screenshots: `output/playwright/footer-social-desktop-2026-09-28.png` and
  `output/playwright/footer-social-mobile-2026-09-28.png`.

### Legacy footer redesign — September 28, 2026

- Restored all 22 destinations from the legacy `footer.html`: five services,
  four popular links, six offices, four social/review links, and three blog/legal
  links. Preserved the original labels and 2009 - Present copyright statement.
- Added a scoped, server-rendered footer component with the existing AET logo,
  IRFC-inspired navy brand/navigation layout, and a separate legal row. Mobile
  keeps services full-width above the popular-links and office columns.
- Codex in-app browser: visually checked the desktop footer at 1440px and both
  halves of the mobile footer at 390px. DOM checks at 320, 390, 760, 850, and
  1440px found no page/footer overflow and all links have at least 44px height.
  Confirmed logo loading, visible keyboard focus, and no captured console errors.
- Compared rendered link destinations against the local legacy footer: all 22
  match. External destination availability was not re-tested.
- `pnpm typecheck` and `git diff --check` passed on the existing port-3021 server.
  No production build or deployment was performed.
- Screenshots: `output/playwright/footer-desktop-2026-09-28.png` and
  `output/playwright/footer-mobile-2026-09-28.png`.

### Homepage testimonial carousel — September 28, 2026

- Replaced the two-review section with all five legacy testimonials and original
  avatars; retained both xiao h paragraphs and omitted undated relative timestamps.
- Moved client feedback after the closing application panel, immediately before
  the footer. Desktop shows two cards; mobile shows an 88%-width card and a next-card
  cue. Previous/next buttons loop at both ends, with a visible range counter above
  the cards. Height follows the fully visible reviews without truncating copy.
- Codex in-app browser: visually inspected at 1440px, 390px, and 320px; checked
  desktop and mobile navigation, end-to-start wrapping, native keyboard scrolling,
  long/short review heights, and avatar loading. Width checks at 320, 390, 760,
  850, and 1440px found no page overflow. Physical touch gestures were not tested.
- Reduced-motion handling and the native no-JavaScript scrolling fallback were
  inspected in code; these modes were not separately browser-emulated for this change.
- `pnpm typecheck` and `git diff --check` passed using the existing port-3021 server.
  No production build, server restart, commit, push, or deployment was performed.
- Screenshots: `output/playwright/testimonials-desktop-2026-09-28.png` and
  `output/playwright/testimonials-mobile-2026-09-28.png`.

### Institution spacing refinement — September 28, 2026

- Reduced section padding, introduction spacing, logo slot dimensions, and row
  gaps. Balanced square emblems against wordmarks without cropping artwork.
- Kept the existing wording and two moving rows. Mobile copy remains 16px with
  1.6 line height; the footer link has its own line and a 44px minimum target.
- Codex in-app browser: visually inspected the institution section at 320px,
  390px, and 1440px with no page overflow. At 390px, section height decreased
  from 877px to 706px (about 20%). Confirmed focus stops each row's animation
  and exposes native scrolling; normal cycles remain 72/80 seconds.
- `pnpm typecheck` and `git diff --check` passed using the existing port-3021
  server. No production build or deployment was performed.
- Screenshots: `output/playwright/institutions-mobile-2026-09-28.png` and
  `output/playwright/institutions-desktop-2026-09-28.png`.

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
