# AET Implementation Status

Progress and verification evidence only. The design baseline lives in [design.md](design.md).

Updated September 25, 2026 after the homepage design pass. This records local
implementation and checks, not production deployment or accessibility certification.

### Transparent browser icons — September 28, 2026

- Replaced browser PNG/ICO and manifest icon exports with transparent-background
  versions of the selected full-map AET artwork. Retained the original source
  and the separate opaque Apple touch icon.
- Confirmed transparent corners in locally served PNGs and all 16/32/48px ICO
  frames. The homepage exposes refreshed automatic icon URLs after reload.
- Codex in-app browser: inspected the actual 32px PNG and 16px ICO on pale-blue,
  light, and dark preview surfaces; both loaded without a white tile. This checks
  asset rendering, not every external browser's existing favicon cache.
- Evidence: `output/playwright/favicon-transparent-2026-09-28.png`. The temporary
  preview page was removed after verification. `git diff --check` passed.
- Reused the owner's server. No build, push, or deployment.

### Process application screenshots and CTA — September 28, 2026

- Added a prominent orange Start Application button below the process introduction,
  linking to the owner's credential-evaluation application URL. Mobile uses a
  full-width button; keyboard focus has a visible white outline.
- Replaced all three process photographs with screenshots captured from the live
  application's Service Type menu, Client Information form, and Office menu.
  Restored the legacy three-step sequence: choose evaluation type, complete the
  application, and submit documents to an office. The third image illustrates
  office selection; it does not represent an upload or successful submission.
- Screenshots keep their proportions and full content in white frames. Desktop
  retains the scrolling image transitions; mobile stacks each image with its copy.
- Codex in-app browser: visually checked all three stages at 1440px and 390px,
  plus the CTA at 320px. No horizontal page overflow at these widths. All active
  screenshots loaded. Keyboard activation of the new CTA reached the exact live
  application URL. No personal data, uploads, or application submissions were used.
- `pnpm typecheck` and `git diff --check` passed. Reused the owner's port-3021
  server; no build, server restart, push, or deployment.
- Evidence: `output/playwright/process-desktop-2026-09-28.png`,
  `process-step2-2026-09-28.png`, `process-step3-2026-09-28.png`, and
  `process-mobile-2026-09-28.png` in the same directory. Reduced-motion and
  no-JavaScript behavior was not separately browser-tested in this change.

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

### Fact scroll exit correction — September 28, 2026

- Replaced viewport-based progress estimates with the actual sticky range:
  section height minus scene height, starting at the scene's CSS top offset.
  Each fact receives an equal interval; selectors land in its midpoint.
- Section height derives from the fact count (one viewport plus 65vh per fact),
  giving the last fact a full interval before the scene unpins.
- Supplemental Playwright real-wheel checks at 1440x1000, 1512x800, and 1920x720:
  facts appear as 15+, 100+, 2009, A+, and 5 at 10/30/50/70/90 percent;
  scene top remains 100px through 98 percent, and moves upward after 100 percent.
  The active card stays within the viewport at the sampled pinned positions.
- Codex in-app browser: scrolled from BBB to Google at 1440x1000 and confirmed
  the fifth card stays pinned. At 390px the native mobile rail still advances,
  with natural section height and no horizontal overflow. Reduced-motion check
  exposes all five facts and disables all sphere animations.
- `pnpm typecheck` and `git diff --check` passed; used the existing port-3021
  server. No production build or deployment was performed.
- Screenshot: `output/playwright/facts-scroll-fifth-held-2026-09-28.png`.

### Fifth Google review fact — September 28, 2026

- Added a fifth fact panel for five-star Google reviews, with five gold stars
  and a summary of the existing testimonial themes: responsive communication,
  professional evaluations, and helpful service. This describes five-star
  reviews, not a verified aggregate Google score or review count.
- Extended the desktop section to 360vh to preserve reading time for five facts.
- Codex in-app browser: selected the fifth panel at 1440px and navigated the
  mobile rail to 5/5 at 390px. The final next control is disabled; the copy fits
  and neither viewport has page overflow. Typecheck and diff checks passed.
- Screenshots: `output/playwright/google-fifth-card-desktop-2026-09-28.png`
  and `output/playwright/google-fifth-card-mobile-2026-09-28.png`.

### Fourth BBB fact and floating spheres — September 28, 2026

- Moved the BBB explanation from the introduction into a fourth fact panel with
  a large A+, a Better Business Bureau heading, and the highest-rating/service
  commitment copy. Added the fourth selector and retained native mobile rails.
- Added eight decorative spheres (six on mobile) behind the content. Independent
  slow drift combines with vertical-scroll or mobile-rail position changes.
  Extended the desktop section to 295vh to retain reading time for all four facts.
- Codex in-app browser: checked desktop at 1440px and mobile at 390px/320px.
  Selected the fourth desktop panel and advanced the mobile rail to 4/4 with
  its next control disabled. Copy fits and mobile has no page overflow.
  Confirmed the desktop scroll progress changes from 0 to 1 and the first
  sphere moves by 45px horizontally and 75px vertically.
- Supplemental Playwright reduced-motion check: pinned switching is disabled,
  all four facts are visible, all eight spheres have no animation or transform,
  and the desktop page has no horizontal overflow.
- `pnpm typecheck` and `git diff --check` passed. Used the existing port-3021
  server; no production build or deployment was performed.
- Screenshots: `output/playwright/bbb-fourth-card-desktop-2026-09-28.png` and
  `output/playwright/bbb-fourth-card-mobile-2026-09-28.png`.

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
      stages cover choosing an evaluation type, completing the application,
      and submitting documents to an office, illustrated by live application screenshots.
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
