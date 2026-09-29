# AET Implementation Status

Progress and verification evidence only. The design baseline lives in [design.md](design.md).

Updated September 25, 2026 after the homepage design pass. This records local
implementation and checks, not production deployment or accessibility certification.

### Service template and Certified Translation — September 29, 2026

- Added `docs/service-page-template.md` and linked it from repository guidance.
  Extracted `ServicePage`, reviewed-copy rendering and interior CSS into
  `components/service/`; Evaluation and Certified Translation now share the shell.
- Added Certified Translation in English, Chinese and Spanish. Retained source
  definitions, formats, uses, ATA information, coverage, languages, four FAQs and
  office/email/payment application steps. Benefits and application use mobile
  horizontal rails. Sample downloads are inside the first native FAQ disclosure.
- Reused eight certified-translation and six shipping records. Rendered rate rows
  match Pricing in all locales. Table qualifications remain outside the tables.
  The source's commented online link is not exposed as a translation workflow.
- Homepage, navigation and footer link to localized routes. All three legacy PHP
  URLs return 308 and retain query parameters. Internal anchors are valid/unique.
- Source-text comparison passed for all three locales' explanations, benefits,
  application and FAQ. Five original image/PDF assets match bytes and return 200.
- In-app browser: desktop title/sections/application; mobile rail navigation through
  step 3 and disabled end control; shipping and sample FAQ expansion; Chinese and
  Spanish 320px layouts; language switch retains route and #faq. Evaluation desktop
  shell and mobile step navigation passed regression checks. Checked states have
  no page overflow. Typecheck, locale validation and whitespace checks passed.
- Evidence: `output/playwright/certified-translation-desktop.png`,
  `certified-translation-mobile-application.png`, and
  `certified-translation-mobile-faq.png`. Reused the running server; no manual
  restart, production build, deployment, payment or application submission.

### Mobile horizontal card correction — September 29, 2026

- Homepage and Evaluation online steps now use `CardRail`, including native
  horizontal scrolling, snap points, a next-card cue, and previous/next controls
  with a position counter at 760px and below. Evaluation report types and benefit
  cards use the same rail; a single localized guarantee remains full width.
- Reduced mobile process heading scale and introduction spacing. Desktop homepage
  animation and Evaluation's two-column step grid remain intact. Updated the
  design guide to explicitly supersede the old vertical-process exception.
- In-app browser checked both pages at 390px, step navigation through card 4 and
  disabled end control, Evaluation type/benefit next controls, 320px Chinese and
  Spanish layouts, Email tab switching, and 1440px desktop layout. Checked phone
  states have no page overflow. Typecheck, i18n, and whitespace checks passed.
- Evidence: `output/playwright/evaluation-mobile-step-rail.png`,
  `home-mobile-step-rail.png`, and `evaluation-mobile-benefit-rail.png`.
  Reused the existing server; no build or deployment.

### Shared institution carousel — September 29, 2026

- Evaluation now uses the homepage's `InstitutionCarousel` and the same 16-logo
  selection in `lib/institutions.ts`, as requested. The outdated FCE client montage
  is no longer rendered. No legacy-only logos were added.
- Added an embedded layout with the localized Credential Evaluation Partners
  heading and contact link. Homepage heading, copy, institution link, and animation
  remain unchanged. Both pages share motion, focus-pause, and responsive rules.
- In-app browser verified Evaluation at 1440px and 390px, keyboard row scrolling,
  no mobile overflow or failed loaded images, and homepage rendering with 16 logos.
  Typecheck, locale checks, and whitespace checks passed. Screenshots:
  `output/playwright/evaluation-partners-desktop.png` and
  `output/playwright/evaluation-partners-mobile.png`.
  Reused the existing server; no build, deployment, or restart.

### Shared Why Choose AET cards — September 29, 2026

- Extracted `BenefitCard` with shared surface styles and story/compact variants.
  Homepage facts retain their figures, copy, animation, controls, and mobile rail.
  English Evaluation shows four compact cards. Chinese and Spanish retain three
  comparison rows and render the standalone AET guarantee as a shared card.
  Source content and shared price/timing interpolation are unchanged.
- In-app browser: Evaluation checked at 1440px and 390px, including all three
  languages and keyboard scrolling of the comparison table. Homepage desktop
  selection reached the ATA card; mobile next-card control moved to language
  coverage. No page overflow in the checked mobile states.
- Typecheck, 257-key locale validation, and whitespace checks passed. Evidence:
  `output/playwright/evaluation-benefits-desktop.png` and
  `output/playwright/evaluation-benefits-mobile.png`.
  Reused port 3021; no build, deployment, or server restart.

### Shared Online / Email application methods — September 29, 2026

- Added Online / Email tabs to the shared homepage and Evaluation `ProcessStory`.
  Online is selected by default and retains the four-step flow. Email preserves
  each locale's legacy three-step list, PDF application form, and five office links
  in `content/application-methods.json`. Acceptance reminders live in the module;
  document requirements and pre-evaluation notes remain on Evaluation.
- Added keyboard tab selection and responsive layouts. Both methods remain
  readable before hydration or with JavaScript disabled.
- In-app browser checks passed on Evaluation and the homepage: method switching,
  keyboard arrows/Home/End support, desktop and mobile layouts, and all three
  locales at narrow widths. Source text comparison, SSR content, PDF download,
  typecheck, i18n validation (257 keys per locale), and whitespace checks passed.
- Reused the existing port-3021 server. Screenshots are under `output/playwright/`:
  `evaluation-methods-email-desktop.png` and `evaluation-methods-email-mobile.png`.
  No production build, deployment, or submission.

### Shared four-step Evaluation process — September 29, 2026

- Replaced the legacy three-step application list with the homepage's existing
  `ProcessStory` component. Both pages now share the same four steps, localized
  messages, real application screenshots, and Start Application links.
- Added an embedded layout for the service-page column: two cards per row on
  desktop and a vertical flow on phones, with no pinned animation. The homepage
  keeps its original layout, heading ID, and desktop scroll behavior.
- Retained the legacy acceptance reminder, document requirements, and
  pre-evaluation explanation beneath the shared process. Removed obsolete
  three-step content from all three locale files. Pricing remains unchanged.
- Verified rendered process headings, descriptions, and all four cards match
  the homepage for English, Chinese, and Spanish. In-app browser desktop/mobile
  checks passed, including the section anchor and narrow localized layouts.
  Typecheck, i18n validation, and whitespace checks passed.
- Used the already-running port-3021 server; did not start, restart, or stop it.
  Screenshots: `output/playwright/evaluation-four-steps-desktop.png` and
  `evaluation-four-steps-mobile.png`. No build, deployment, or submission.

### Evaluation page — September 29, 2026

- Added `/evaluation`, `/zh/evaluation`, and `/es/evaluation` with the existing
  header/footer, responsive section navigation, service cards, source application
  steps, downloads, and a native shipping disclosure.
- Preserved each locale's legacy prose. Normalized-whitespace comparisons of
  introduction, steps, report types, related articles, and sample sections pass
  against all three originals at initial import. The three-step instructions
  were subsequently replaced by the shared four-step module described above.
  Localized source differences are documented in `content/evaluation/README.md`;
  historical claims and external workflows were not newly verified.
- Reused `PricingTable` and existing evaluation/shipping records. All 15 shared
  evaluation tiers match the rendered Pricing page in all locales. Added the
  legacy pre-evaluation and extra-copy ranges to the shared catalog; Evaluation
  renders 16 fee rows and 6 shipping rows. Pricing's existing rows are unchanged.
  Standard price, processing days, and cutoff also reference shared records.
- Homepage/header/footer Evaluation links now use locale routes. Three legacy
  PHP URLs return 308 to the corresponding language paths and preserve queries.
  Internal anchor targets are valid and unique. All three PDFs and the client
  image return HTTP 200 with bytes matching the originals.
- In-app browser: checked desktop/mobile introductions, price navigation,
  responsive tables, shipping expansion, and Chinese-to-Spanish switching that
  retains the Evaluation path/hash. All locales have no page-width overflow at
  320, 390, 760, 850, and 1440px. Type and i18n checks passed (253 keys).
- Screenshots under `output/playwright/`: `evaluation-en-desktop-pricing.png`,
  `evaluation-en-mobile.png`, `evaluation-en-mobile-shipping.png`,
  `evaluation-es-mobile.png`, and `evaluation-es-mobile-pricing.png`.
- Used a temporary `pnpm dev` server at `http://localhost:3021`; sandbox watcher
  restrictions required an approved run outside the sandbox. No production build,
  push, deployment, or application/payment/contact submission. The temporary
  server was stopped after verification. Pricing's desktop evaluation section
  was also visually rechecked; no browser console warnings/errors were captured.

### Pricing follow-up — September 29, 2026

- Restored technical proofreading ($75–100/page), non-technical proofreading
  ($35–75/page), and English writing ($0.50–1.20/word) under Other Services.
  Rates and the 10-page discount threshold use shared catalog constants;
  all three locales include the discount and client-supplied outline notes.
- Removed the sidebar top rule, increased its heading from 13px to 16px,
  and removed the document-language notice and Chinese-price-list link as requested.
- Local in-app browser: verified English desktop (1440px), Chinese mobile
  Other Services (390px), and Spanish mobile navigation/content. Checked mobile
  document widths without horizontal overflow. Typecheck, i18n validation
  (251 keys per locale), and diff whitespace checks passed.
- Used a temporary `pnpm dev` server at http://localhost:3021 for verification.
  The temporary server was stopped after verification. No production build
  or deployment was performed.

### Shared Pricing page — September 29, 2026

- Added `/pricing`, `/zh/pricing`, and `/es/pricing` with shared navigation,
  footer, service-section index, quote links, and responsive semantic tables.
  `/e-fee.php` redirects to `/pricing`; retained legacy section anchors work.
- Centralized USD price types, units, turnaround, shipping/tracking and minimum
  durations in `lib/pricing.ts`. Shared formatting and reusable `PricingTable`
  and `PricingSection` components serve the new page. The two expert-opinion
  displays share one rate array. Homepage pricing, standard processing and its
  FAQ now interpolate the same Document-by-Document constants.
- Used the owner's updated legacy fee page: certified translation starts at
  $70/$80, Document-by-Document rush is $150/3 business days, and expert letters
  are $620/21, $700/14, $800/8 business days. Preserved non-Chinese-document
  pricing scope, final-quote qualification, office variation, cutoff, hourly
  minimums, transportation supplements and shipping conditions.
- China Visa is excluded. The owner subsequently confirmed proofreading and
  English writing belong in Pricing; these are restored in the follow-up above.
  No application-form-only rates were added.
- Compared all 38 displayed rows against the updated legacy HTML, including
  amounts, applicable turnaround, price types and shipping tracking. Confirmed
  the shared expert records and homepage standard values reference the catalog.
- Codex in-app browser: inspected English and Chinese desktop layouts at 1280px,
  Spanish desktop interpretation, English/Chinese mobile at 390px, and Spanish
  shipping at 320px. No page overflow was found in the checked states. Verified
  section navigation, Spanish-to-English page switching, the mobile Pricing
  menu entry, and the homepage desktop pricing and expanded mobile timing FAQ.
- `pnpm typecheck`, `pnpm check:i18n` (248 keys per locale), and `git diff --check`
  passed. Legacy redirect returns 308 and preserves query parameters.
- A temporary `pnpm dev` server on port 3021 was necessary because no server was
  running. Sandbox file-watch restrictions required an approved run outside the
  sandbox. The temporary server was stopped after verification. No production
  build, commit, push or deployment was performed.
- Evidence: `output/playwright/pricing-en-desktop.png`,
  `pricing-zh-mobile.png`, and `pricing-es-mobile-shipping.png`.

### Homepage internationalization — September 28, 2026

- Added `next-intl` and a shared `app/[locale]` layout/page for English `/`,
  Simplified Chinese `/zh`, and Spanish `/es`. Added request configuration,
  locale navigation helpers, and locale routing through `proxy.ts`.
- Localized 171 messages per language, covering the full homepage, navigation,
  footer, accessible controls, image descriptions, and metadata. Preserved the
  original English reviews and labeled Chinese/Spanish reviews as translations.
  Existing legacy destinations, institution names, and application screenshots remain.
- Added a top-right globe/current-language selector on desktop and phones, plus
  synchronized choices inside the mobile menu. Switching preserves the current
  pathname, query, and fragment; Home/logo links retain the active locale.
- Added a one-year language preference cookie, browser-language matching, English
  fallback for missing messages, and a translation validation command. Canonical
  URLs remain pending the production-domain/migration decision.
- Codex in-app browser: visually checked Chinese/Spanish desktop and phone states,
  the English homepage, the Spanish mobile menu and expanded FAQ. Checked all
  three languages at 320/390/760/850/1201/1280/1440px: no page or header horizontal
  overflow. Verified Chinese to Spanish, Spanish to Chinese, and English selection,
  refresh, saved Spanish preference on a root visit, query/fragment preservation,
  and Escape closing the mobile menu with restored focus and background scrolling.
  No warning/error messages were present in the final browser console check.
- HTTP checks passed for all three homepages, saved preferences, browser-language
  selection, explicit-locale precedence, invalid cookies, English-prefix redirect,
  unsupported/missing routes returning 404, and an unlocalized icon request.
- `pnpm check:i18n` (171 messages per locale, syntax, matching placeholders and
  original reviews), `pnpm typecheck`, and `git diff --check` passed. Refreshed
  generated route types with `pnpm exec next typegen` after moving the page/layout.
- No existing port-3021 server was running. A temporary `pnpm dev` server was used;
  sandbox file-watch limitations required running it outside the sandbox. The
  verification server was stopped afterward. No production build or deployment.
- Evidence under `output/playwright/`: `i18n-zh-desktop.png`,
  `i18n-es-mobile-menu.png`, and `i18n-es-mobile-faq.png`.

### Mobile Hero breathing room — September 28, 2026

- Increased mobile Hero padding from 48px on both sides to 72px above and 88px
  below the content, adding 64px of height without changing text or button sizes.
  The photo remains the full-section background; desktop styles are unchanged.
- Codex in-app browser: visually checked 390px and 320px phones, with no clipping
  or horizontal overflow. The Hero measures about 536px and 564px respectively.
  Rechecked desktop at 1440px: Hero remains 600px high with 64px vertical padding.
- `git diff --check` passed. Reused the existing server. The preceding BBB move
  is committed as `c88cb1b`. No build, push, or deployment.
- Evidence: `output/playwright/hero-mobile-spacing-2026-09-28.png`.

### BBB service trust row — September 28, 2026

- Moved the transparent BBB A+ artwork from below the Hero actions to a compact
  row below the service cards, opposite Contact Us. Added a fine divider and
  retained the existing contact destination. The image is 110px wide (about 38px
  high); the link keeps a 44px minimum target.
- Reduced the desktop Hero minimum height to 600px and mobile vertical padding
  to 48px. Mobile retains the full-section photo background.
- Codex in-app browser: inspected the service row at 1440px, 390px, and 320px,
  with both items on one line and no page overflow. Checked the updated Hero at
  1440px and 320px; confirmed no BBB artwork remains in the Hero, and checked
  keyboard focus plus the Contact Us href without navigating off-site.
- `pnpm typecheck` and `git diff --check` passed. Existing server reused; no build,
  push, or deployment. Evidence under `output/playwright/`:
  `bbb-services-desktop-2026-09-28.png`, `bbb-services-mobile-2026-09-28.png`, and
  `hero-without-bbb-desktop-2026-09-28.png`.

### Homepage section order — September 28, 2026

- Kept the Hero first, followed by FCE and other services, Why Choose Us,
  Trusted by Leading Institutions, Simple 4-Step Process, Pre-Evaluation,
  FAQs, and Google client reviews. Updated the design-guide order.
- Codex in-app browser: confirmed the complete rendered section order at 1440px
  and 390px. Visually checked the moved sections and their transitions on desktop
  and mobile; both widths have no horizontal page overflow.
- `pnpm typecheck` and `git diff --check` passed. Reused the existing server.
  Earlier pre-evaluation and redundant-action changes were committed as `346ece6`
  before this reorder. No push or deployment.
- Evidence: `output/playwright/home-order-desktop-2026-09-28.png` and
  `output/playwright/home-order-mobile-2026-09-28.png`.

### Removed redundant homepage actions — September 28, 2026

- Removed the standalone closing Start Application panel and the entire strip
  below the service cards containing “Translation and evaluation services.” and
  Contact Us. Removed the two icon imports made unused by the strip deletion.
- FAQs now lead directly into client feedback; the service cards lead into the
  application process. Updated the design guide's section order and exclusions.
- Codex in-app browser: visually checked both transitions at 1440px and 390px,
  confirmed both removed containers are absent, and found no horizontal overflow.
  `pnpm typecheck` and `git diff --check` passed. Existing server reused;
  no build, restart, commit, push, or deployment in this update.
- Evidence under `output/playwright/`: `removed-closing-desktop-2026-09-28.png`,
  `removed-contact-strip-desktop-2026-09-28.png`, and
  `removed-closing-mobile-2026-09-28.png`.

### Pre-evaluation emphasis and complete legacy copy — September 28, 2026

- Follow-up styling: changed the question to pale blue and the CTA to the shared
  orange action color, removed its arrow, and added a white keyboard-focus outline.
  Verified the question and text-only button visually at 1440px and 390px in the
  in-app browser; the mobile button fits without page overflow and retains the
  degree-equivalency-tool URL. Copy is unchanged. Evidence:
  `output/playwright/pre-evaluation-colors-desktop-2026-09-28.png` and
  `output/playwright/pre-evaluation-colors-mobile-2026-09-28.png`.
- Promoted the original degree-equivalency question to a prominent standalone
  heading. Restored the bold “We provide:” heading, all three benefits, and the
  complete closing paragraph in place of the shortened preliminary-assessment note.
- Kept the dark-blue panel and graduation image, widened the desktop copy column,
  and retained the existing Start Your Pre-Evaluation destination. Mobile stacks
  the image and complete content in normal reading order.
- Compared the section's title and full copy against legacy `home-content.html`:
  exact match after whitespace normalization. Only typography and layout differ.
- Codex in-app browser: visually checked desktop at 1440px and the mobile question
  and benefit list at 390px. Width checks at 320, 390, 760, 850, and 1440px found
  no horizontal page overflow; text and the button fit narrow/intermediate widths.
- `pnpm typecheck` and `git diff --check` passed. Existing local server reused;
  no build, restart, commit, push, or deployment in this update.
- Evidence under `output/playwright/`: `pre-evaluation-desktop-2026-09-28.png`,
  `pre-evaluation-mobile-question-2026-09-28.png`, and
  `pre-evaluation-mobile-benefits-2026-09-28.png`.

### Reduced service scope — September 28, 2026

- Removed Visa Services, Editing/Proofreading, and China Consular Authentication
  from both navigation menus. Removed the Visa Services homepage card and the
  Visa / Consular Authentication footer links. The other six menu services remain.
- Recorded the retained services and exclusions in README.md and aligned the
  design guide. Legacy pages and the separate application portal were not changed.
- Codex in-app browser: verified the expanded six-item desktop menu at 1440px
  and mobile menu at 390px, the mobile service rail reaching Technical Translation
  at 3 / 3, and the mobile footer. No removed service destination remains in the
  homepage DOM; the mobile page has no horizontal overflow.
- `pnpm typecheck` and `git diff --check` passed. Reused the existing development
  server; no build, restart, push, or deployment.
- Evidence: `output/playwright/services-retained-desktop-2026-09-28.png` and
  `output/playwright/services-retained-mobile-2026-09-28.png`.

### Logo wordmark size — September 28, 2026

- Enlarged the complete header/footer wordmark by 7.5%, tightened its spacing,
  and proportionally reduced the emblem within the unchanged outer dimensions.
  Updated both SVG and transparent PNG exports; wording and colors are unchanged.
- Codex in-app browser: inspected header/footer at 1440px and 390px, plus the 320px header.
  Logos load with complete text and no page overflow. Export alpha bounds remain
  inside the canvas, and `git diff --check` passed.
- Evidence: `output/playwright/logo-size-desktop-2026-09-28.png` and
  `output/playwright/logo-size-mobile-2026-09-28.png`. No build or deployment.

### Restored legacy logo wording — September 28, 2026

- Restored the full two-line wording in the header/footer SVG and PNG lockups:
  “American Education and” / “Translation Services,CORP (AET)”. Updated both
  image alt attributes while preserving the emblem and transparent backgrounds.
- Codex in-app browser: checked the header and footer at 1440px and 390px.
  Both assets loaded, the complete wording fits, and the page has no horizontal
  overflow at those widths.
- `pnpm typecheck` and `git diff --check` passed. Existing port-3021 server reused;
  no build, push, or deployment. Screenshots:
  `output/playwright/logo-wording-desktop-2026-09-28.png` and
  `output/playwright/logo-wording-mobile-2026-09-28.png`.

### Restored FCE introduction and benefits — September 28, 2026

- Restored “What is Foreign Credential Evaluation?” and its complete paragraph,
  plus “Why Choose AET for FCE?” and all four benefits from the legacy
  `americantranslationservice.com/home-content.html`, preserving the wording.
- Placed the content before the existing evaluation/services cards. Desktop uses
  two columns; at 850px and below the introduction and benefits stack in reading order.
- Codex in-app browser: visually verified the new content at 1440px and 390px.
  Width checks at 320, 390, 760, 850, and 1440px found no horizontal page overflow;
  the new text also fits its containers at the narrow and intermediate widths.
- `pnpm typecheck` and `git diff --check` passed. Reused the owner's port-3021
  server; no build, restart, push, or deployment.
- Evidence: `output/playwright/fce-desktop-2026-09-28.png` and
  `output/playwright/fce-mobile-2026-09-28.png`.

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

### Four-step process correction — September 28, 2026

- Corrected the distinction between evaluation purpose (USCIS, employment,
  education) and report type. The homepage now has four steps: purpose, application
  details, evaluation type in Services, and document upload on the status page.
  Retained the orange Start Application CTA and expanded progress indicators to four.
- Captured the actual Services screen after completing earlier wizard steps with
  fictional demo data. No application was submitted. The capture includes the three
  requested report types without applicant details.
- Replaced the office-selection illustration with the upload controls cropped
  from the owner's supplied screenshot. Application ID, URL, and uploaded-file
  records are excluded. Automated approval blocked reading the individual status
  record; the supplied screenshot is the source for this fourth-step image.
- Codex in-app browser: verified four titles and indicators, desktop third/fourth
  image switching at 1440px, loaded images and stacked third/fourth steps at 390px,
  and no page overflow at 1440/390/320px. The 320px CTA is 68px high and both
  process application links retain the requested destination.
- `pnpm typecheck` and `git diff --check` passed. Existing local server reused;
  no production build, commit, push, or deployment in this correction.
- Evidence under `output/playwright/`: `process-four-step-types-desktop.png`,
  `process-four-step-upload-desktop.png`, and `process-four-step-upload-mobile.png`.

### Process application screenshots and CTA — September 28, 2026 (superseded above)

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

### Header online application action — September 28, 2026

- Added an orange Online Application button at the desktop header's far right,
  linking to `https://app.americantranslationservice.com/credential-evaluation-application`.
  The same action appears below the navigation inside the mobile menu.
- Moved the compact-header breakpoint to 1200px to leave room for the new action;
  mobile still shows only the logo and hamburger in the closed header.
- Codex in-app browser: visually verified 1440px and 1201px desktop layouts and
  open mobile menus at 390px and 320px. Confirmed the application href, no overflow
  at the narrow desktop/mobile checks, and Escape closing the menu. No application
  was submitted. Typecheck and diff whitespace checks passed; no build or deployment.
- Screenshots: `output/playwright/header-application-desktop-2026-09-28.png`
  and `output/playwright/header-application-mobile-2026-09-28.png`.

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
- [x] Kept the homepage sections in the design-guide order. The four process
      stages cover selecting purpose, completing application details, choosing
      evaluation type, and uploading documents on the status page, using real UI captures.
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
