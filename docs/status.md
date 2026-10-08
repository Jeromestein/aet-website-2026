# AET Implementation Status

Progress and verification evidence only. The design baseline lives in [design.md](design.md).

### Payment Zelle priority — October 8, 2026

- Kept Card Payment first and moved Zelle instructions, all six steps, the office
  selector and Zelle note ahead of the retained Deposit / Check details. Renamed
  the alternatives heading to list Zelle first and the bank panel to Zelle Bank
  Information, with equivalent Chinese and Spanish copy. Added a Deposit / Check
  subheading to distinguish the later bank/check details.
- Aligned the processing table with Card, Zelle, Bank Transfer/Deposit, Check.
  Verified all other localized payment copy is preserved; recipients, amounts,
  payment validation and handoff behavior were not changed.
- Typecheck, i18n and whitespace checks passed. Codex in-app browser verified
  English desktop at 1440px (including Boston office switching), and Chinese
  and Spanish mobile at 390px with no horizontal page overflow. Screenshots:
  `output/playwright/payment-zelle-{desktop,zh-mobile,es-mobile}-2026-10-08.png`.
- Port 3021 was not running. Started `pnpm dev`; sandbox file-watcher failures
  required restarting that process outside the sandbox. The preview server
  remains running at `http://localhost:3021`. No build, payment, push or deployment.

### San Francisco visit policy and Evaluation promise — October 1, 2026

- Updated the shared San Francisco phone to the Los Angeles office number,
  +1 949-954-7996. Added a prominent reservation-required note to its Contact
  card in English, Chinese and Spanish, and clarified the general visit copy
  so the no-appointment statement excludes San Francisco.
- Replaced the Chinese and Spanish AET promise's NACES affiliation wording
  with a general description of experienced credential evaluation professionals.
  The English promise already uses this wording and remains unchanged.
- Passed typecheck, all three language message checks and diff whitespace checks.
  Local HTTP checks passed the reservation text, telephone link and Evaluation
  promise on all six localized Contact/Evaluation pages.
- Codex in-app browser passed English Contact's San Francisco card and Chinese
  Evaluation's promise at 1440px desktop and 390px mobile. The mobile office
  anchor reaches the correct card; the Chinese Evaluation page has no horizontal
  page overflow. Screenshots: `output/playwright/sf-contact-{desktop,mobile}-2026-10-01.png`
  and `output/playwright/evaluation-promise-{desktop,mobile}-2026-10-01.png`.
- Verification used the existing development server on port 3021; no production
  build was run. The owner subsequently requested committing and pushing these
  changes. Hosted deployment status is not verified by these local checks.

### Release-readiness spot check — October 1, 2026

- User authorized a local commit. Push, deployment and domain/DNS changes were
  not performed. Latest local fixes still require a hosted release.
- Live read-only checks: the Vercel homepage returned 200 without the new
  noindex header; the official www homepage still redirected to Apache
  `/home.php`; the existing credential-application entry page returned 200 on
  Vercel. Entry-page availability is not payment/application workflow acceptance.
- DNS lookup: the apex resolved to the old server, www aliased the apex, and
  the app subdomain had its own Vercel CNAME. Preserve application and email DNS
  records when preparing the marketing-site cutover.
- Release gates: deploy the latest commit and verify it; confirm production
  payment configuration/recipients and authorized transaction acceptance; prepare
  Vercel domain binding, DNS rollback and active Search Console verification.
  After cutover, verify TLS, redirects, crawl controls and submit the new sitemap.
  Deferred unmigrated content/PDFs are not part of these gates.
- Pre-commit typecheck, three-language messages, fragment regression tests,
  static Blog and body-link checks passed. No local production build was run.

### Owner scope decision — October 1, 2026

- Defer all currently unmigrated legacy content and PDF review for possible future
  pages. The 71 content URLs and nine PDFs are no longer current tasks, owner
  decisions or release blockers. This supersedes earlier launch-gate wording for
  that material; acceptance of the currently retained site still applies.
- Preserve source files and the URL inventory. No content was migrated, deleted
  or marked permanently retired; no route, redirect, HTTP behavior or deployment
  was changed. Updated checklists and inventory generation to retain this scope
  decision on future regenerations.

### Hosted audit and local corrections — October 1, 2026

- Audited `https://aet-website-2026.vercel.app`. The stable Vercel production
  alias lacked a noindex directive. Added host-specific `X-Robots-Tag` protection
  for every `*.vercel.app` alias, retaining the official canonical origin and
  indexing behavior. The local regression check passed 42 host/path cases,
  including official domains, language pages, assets, robots/sitemap and 404s.
- Fixed 15 encoded legacy URLs in Evaluation's AI-summary links (five per
  language). They now refer to each language's canonical Evaluation page.
  Extended the body-link checker to inspect encoded external query text; it
  reproduced the old-link failure before the edit and passed after the fix.
- Corrected the earlier report of three invalid blog fragments: parsing bare
  date-led fragments with libxml invented paragraph wrappers absent from the
  source and real article container. The checker now uses a block container;
  regression cases still detect genuine invalid nesting. No article prose was
  modified. HTTP parity also now uses the existing contact renderer so reviewed
  office updates do not trigger false failures; original prose hashes remain
  independently checked. Three fragment regression tests passed.
- Hosted baseline checks passed 299 page variants, 4,861 local links, 318 unique
  targets, 133 SEO/share-image cases and 277 redirects. The later legacy-404
  checks triggered HTTP 403 with `X-Vercel-Mitigated: challenge`. Hosted crawling
  stopped; subsequent hosted Blog/schema checks were blocked, not counted as
  passes. Those responses were Vercel security checkpoints, not application 500s.
- Local checks on the existing owner-run port 3021 passed: 782 source HTML links,
  all 299 page variants, 240 Blog routes, 95 article images, 157 Blog redirects,
  133 SEO/schema pages, all 277 redirects and 162 unmapped legacy 404s. The current
  blocked-term scan found no unreviewed member-company matches; 14 articles with
  NACES biography terms remain covered by the existing reviewed exception list.
- Codex in-app browser: hosted desktop/mobile navigation; local institution
  search, empty/reset/category states; combined Blog search/topic filters;
  payment required-field attributes and office switching; Chinese-to-Spanish
  language switching with the route/fragment retained. Evaluation's corrected
  links were inspected at desktop and 390px; Spanish Evaluation had no page
  overflow or broken images at 320px. No browser warning/error was captured.
  Viewport override reset. Screenshot:
  `output/playwright/hosted-audit-ai-links-mobile-2026-10-01.jpg`.
- Typecheck, 259 messages per locale and whitespace checks passed. No production
  build, server restart, real form submission, payment, push or deployment was
  performed. These corrections are local; hosted post-deployment verification
  and payment-provider acceptance remain outstanding.

### Body-link cleanup — October 1, 2026

- Reproduced 246 old-host body links on 13 page families across English, Chinese
  and Spanish (39 rendered pages). The same 299-page crawl now finds zero.
  Of those 246 references, 42 now resolve directly to local destinations;
  204 references to ten held article targets retain their text without links.
- Updated the imported HTML itself, including contact links already rewritten
  by the old renderer: 145 source references normalized and 96 held references
  unlinked. Source counts differ from rendered counts because shared content and
  English-only articles appear across locales. No article was approved, added,
  retired or redirected by this cleanup.
- Added one shared HTML link localizer for services, application instructions,
  careers and blog bodies, including Evaluation's separately rendered pricing
  headings. Locale changes preserve query strings and section fragments;
  downloads, legal pages, external references and the application portal retain
  their intended destinations. Fixed the misspelled San Francisco office URL
  to the existing Contact office section. Legacy production files are untouched.
- `scripts/check-content-links.py` passed on the owner's existing port 3021:
  782 source HTML links, 299 rendered page variants, 4,861 local links and 318
  unique page/file targets. Every local target returned directly, all fragments
  existed and page links retained their locale. Body text on all 299 pages was
  identical to the pre-edit crawl. Existing Blog checks passed for 79 imported
  bodies, including source prose hashes, markup, images and contents anchors.
- Typecheck, all 259 messages per locale and whitespace checks passed. Direct
  localizer checks covered query/fragment retention, repeat rendering, locale
  switching, and external/file/legal exclusions. No production build was run.
- Codex in-app browser: desktop Chinese Evaluation pricing links and the actual
  jump to Chinese Expert Opinion Letters passed. At 390 x 844, the cleaned
  Chinese Evaluation related-article list and the linked education article
  rendered correctly, with document width 390 and Chinese navigation preserved.
  The related article's existing new-tab action did not open a tab in the in-app
  browser; its inspected href was opened directly for the target-page check.
  Viewport override was reset. Screenshots: `output/playwright/content-links-desktop-2026-10-01.png`
  and `output/playwright/content-links-mobile-2026-10-01.png`.
- The ten article targets below remain held for content/disposition review.
  Their removed hyperlinks do not resolve the broader SEO launch gates:
  - `/Indian-degree-evaluation-in-USA.html`
  - `/best-education-credential-evaluation-agencies.html`
  - `/credential-evaluation-for-emloyment.html`
  - `/diploma-translation-and-evaluation.html`
  - `/education-credential-evaluation-purposes.html`
  - `/education-evaluation-h1b.html`
  - `/foreign-credential-evaluation-for-immigration.html`
  - `/how-to-avoid-delays-with-foreign-credential-evaluation.html`
  - `/how-to-get-an-international-evaluation.html`
  - `/international-transcript-evaluation.html`
- No server restart, commit, push or deployment was performed.

### SEO local implementation and final acceptance — September 30, 2026

- Completed the local SEO checklist implementation for the approved 133-page
  catalog: 80 BlogPosting entities, 130 BreadcrumbList entities and 133 localized
  static sharing cards. Article dates preserve the source catalog (46 dated,
  34 undated). Sixty-four articles use existing inline images; sixteen omit
  image rather than promote archived reports/reviews/certificates or logo artwork.
  No author or modification date was invented.
- Replaced clipped service descriptions with complete localized sentences.
  Open Graph and Twitter metadata use the same canonical page and image.
  Cards reuse the original logo, palette and actual page titles; system fonts
  are rasterized into PNGs and are not redistributed. Total PNG size is 7.1 MB.
- Reconciled all 208 old sitemap entries and related source/alias inventories
  into 448 unique paths. Added 27 redirects, bringing the application total to
  277. Chinese service/office aliases and known PDF relative-path aliases now
  resolve. Each mapping retains its query and required destination anchor.
- Added reusable `scripts/check-seo.py`, `scripts/inventory-legacy-seo.py`, and
  `scripts/generate-share-images.py`; expanded the structured-data checker for
  multi-script graphs, Article/Breadcrumb coverage and article-image visibility.
- Passed typecheck, all 259 translation messages per locale, whitespace checks,
  133 canonical/sitemap/hreflang/OG/Twitter/image checks, 277 redirect checks,
  eight untranslated fallbacks, two payment-result noindex checks, and genuine
  404 responses for 162 unmapped old paths. Passing 404 behavior does not approve
  retiring the held content. No production build was run.
- Schema.org hosted code validation reported zero errors and warnings for
  representative Boston Article/Breadcrumb, Expert Opinion Service/Offers, and
  Contact/six-office graphs. The full catalog also passed the official-vocabulary
  checker. These checks parse rendered markup, not a deployed production crawl.
- Google Rich Results Test code mode confirmed valid supported items:
  [Boston article](https://search.google.com/test/rich-results/result?id=BA_XXuvnjHlki1_QBLxF0g)
  and [Contact directory](https://search.google.com/test/rich-results/result?id=2P3h8Wk5hISMr42OuJl9jQ).
  No critical errors. The Boston source has optional missing author/image warnings;
  business entities also have non-critical recommendations. Missing verified facts
  were not fabricated to remove optional warnings. Results can expire.
- Codex in-app browser verified the English article desktop layout and Chinese
  Pricing desktop view. Its viewport override did not take effect (still 1280px),
  so the required mobile check used the prescribed Playwright CLI fallback.
  Both Chinese Pricing and the English Boston article passed at 390 × 844 with
  document width 390 and no horizontal overflow. Browser screenshots are in
  `output/playwright/seo-pricing-mobile.png`, `seo-article-mobile.png`, and
  `seo-google-results.jpg`. No UI copy/layout was changed by the schema additions.
- Local verification used a fresh isolated source copy on port 3035 to load the
  complete redirect table. The temporary server and Playwright session are now
  stopped. The owner's port-3021 server remains untouched and
  needs a restart to pick up redirect imports. Deployment, push and Search Console
  submission remain owner actions.
- Remaining launch gates: disposition of 71 content URLs (including 30 previously
  held article families and other standalone/Chinese sources), nine legacy PDFs,
  one Search Console verification file, hosted preview noindex and production
  domain/redirect/crawl checks. See `docs/seo-legacy-urls.md`; none is represented
  as completed by this local acceptance.

### Organization, office and service structured data — September 30, 2026

- Added safely serialized, server-rendered JSON-LD to 38 pages: homepage/About
  Organization graphs, six Contact-directory branches and four office-detail
  templates as LocalBusiness, and seven service types across 17 translated pages.
  Preserved legacy organization/office entity IDs on the confirmed production host.
  Untranslated Spanish service fallbacks omit duplicate schema.
- Postal fields now generate both the existing English address strings and office
  JSON-LD. Verified all six display addresses against the prior catalog. Phone,
  email and hours remain shared; no Beijing hours/postcode were invented. Social
  links come from the footer's existing public list; Boston Yelp belongs to its
  branch, and the Google search link is excluded from sameAs.
- Offers use the visible shared pricing records, including the estimated-price
  label, starting prices, ranges, units, turnaround and interpretation conditions.
  Quoted services have no numeric price. Expert Opinion Letters uses Service and
  valid Offer/UnitPriceSpecification records ($620/$700/$800), not the legacy
  Product/invalid USD type or hardcoded $100 price.
- Passed TypeScript, i18n, whitespace and the reusable
  `scripts/check-structured-data.py` checks on the owner's existing port 3021.
  Checked all 133 sitemap pages, 38 JSON-LD graphs, four untranslated fallbacks,
  logo availability, official Schema.org vocabulary domains/object ranges,
  graph references and visible contact/price facts. A direct serializer test also
  confirmed script-closing input is escaped while Unicode/JSON values round-trip.
- Closed the prior local redirect acceptance gap using an isolated temporary
  source copy on port 3035: all 28 new permanent redirects retained query strings
  and target anchors, and all 133 sitemap routes plus eight fallback and two
  payment-result routes passed metadata/indexing checks. The temporary webpack
  preview initially had a corrupt generated prerender manifest; clearing only its
  generated cache and warming routes sequentially resolved the problem.
- Codex in-app browser passed the contact directory on port 3021, old English
  homepage entry with a saved Chinese preference on 3035, and 390px Chinese
  Beijing-office/Spanish expert-price states. The three expert-price tiers matched
  JSON-LD. Mobile pages had no horizontal overflow; final browser logs had no
  errors/warnings. Temporary viewport overrides were reset.
- Temporary command: `WATCHPACK_POLLING=true pnpm exec next dev --webpack --port 3035`.
  That process is stopped. The owner's 3021 process was not restarted and still
  needs a restart for its imported redirect table; page/component changes were
  verified through its existing hot reload.
- Updated the SEO checklist. Article/Breadcrumb markup, sharing images and full
  remaining legacy URL reconciliation are still pending, as are hosted Rich
  Results Test/Search Console/deployment checks. No build, commit, push or deployment.

### SEO foundation — September 30, 2026

- Created `docs/seo-checklist.md` with staged acceptance criteria. The owner
  confirmed `https://www.americantranslationservice.com` as the production origin.
- Added shared URL/metadata helpers, canonical and Open Graph URLs across public
  pages, and HTML hreflang for actual translations. Removed generic middleware
  alternates that advertised untranslated/noindex pages or the preview host.
  English-only blog/career variants and Spanish service fallbacks canonicalize
  to English and use noindex; legal routing and payment-result noindex remain.
- Added robots.txt and a sitemap containing 133 canonical pages, including 80
  English articles. Omitted speculative modification dates. Vercel previews have
  noindex metadata; hosted preview behavior still requires deployment verification.
- Added 28 historical entry-point redirects, including the legacy HTML sitemap.
  English homepage aliases use `/en` to override a saved non-English preference
  before the existing locale middleware resolves to `/`. Full legacy URL/host
  migration remains open; this is not a complete redirect inventory.
- Passed TypeScript, i18n and whitespace checks. HTTP verification passed for all
  133 sitemap pages: successful direct responses, self-canonical URLs, matching
  metadata/sitemap alternates, Open Graph URLs, and no unintended noindex. Eight
  untranslated variants and two payment-result routes passed their indexing checks.
- Codex in-app browser inspected the English desktop homepage and 390px Chinese
  homepage/article states. Canonical and language metadata matched expectations;
  mobile pages had no horizontal overflow. The Chinese legacy homepage preserved
  its query string. Final new redirect acceptance awaits the owner's restart of
  port 3021: the running process still caches the earlier imported redirect table.
- Organization, office, service and article JSON-LD remain next in the checklist.
  No production build, commit, push, deployment or Search Console action performed.

### Complete institution directory — September 30, 2026

- Added `/institutions`, `/zh/institutions` and `/es/institutions` through one
  shared template. All 28 entries, four original categories/anchors, descriptions
  and complete timing notes are preserved; Chinese and Spanish prose is localized.
  Added search, category filters, result counts, a reset/empty state and native
  note disclosures. The homepage carousel now links to the active locale.
- Preserved 17 original image files byte-for-byte. Corrected the source's WCUI
  artwork pairing to Smith Chason College; WCU uses a text placeholder. Source
  descriptions, dates and relationship claims remain subject to publication
  review in `content/institutions/README.md`.
- Passed TypeScript, existing i18n checks, whitespace checks and an additional
  directory-content audit: English source equality for every entry/section;
  matching three-locale IDs, names and record counts; 28 server-rendered entries
  per route; complete notes; four anchors; unique IDs; all 17 logo responses and
  source checksums. The legacy PHP URL returns 308 and retains its query string;
  the browser confirmed the licensing/government fragment reaches the new page.
- Codex in-app browser passed English desktop search (including whitespace and
  multiword queries), empty/reset states, category filtering and note expansion;
  Chinese mobile keyword search and keyboard expansion; Spanish narrow-screen
  filters; homepage-to-directory navigation and Chinese-to-Spanish switching.
  Inspected 1440, 850, 760, 390 and 320px states without horizontal page overflow.
  Final page logs contained no errors or warnings. Screenshots:
  `output/playwright/institutions-desktop.jpg` and `institutions-mobile.jpg`.
- The owner's 3021 server initially returned 500. Early verification used a
  temporary copy on 3034 with polling/webpack. The owner server subsequently
  recovered, and final desktop/mobile, logo, link, locale and redirect checks
  ran against the actual project on 3021. The temporary 3034 server was stopped;
  the owner's server was not manually restarted. Viewport override was reset.
- No production build, commit, push or deployment. No-JavaScript HTML includes
  all entries and native disclosures; a separate JavaScript-disabled browser
  run was not completed because the supplemental Playwright CLI could not write
  its session cache within the sandbox. Native 200% zoom and a full accessibility
  audit were not performed.

### About AET migration — September 30, 2026

- Added `/about`, `/zh/about`, and `/es/about` through one shared localized page.
  Retained 11 dated history entries, 10 in-scope highlights, 11 archival photos,
  the original client collection and testimonial/career destinations. Added
  source notes in `content/about/README.md`; no new business claims were invented.
- Reused the shared header/footer and service-page shell, with a desktop timeline
  and card grids, native mobile rails, original photo links and legacy section IDs.
  Footer About links stay localized. Five legacy About URLs redirect permanently.
- Passed TypeScript, i18n and whitespace checks. HTTP checks passed for all three
  languages, one H1 per page, unique IDs, anchor targets, footer/career links and
  all 12 image files. Five 308 redirects preserved query parameters.
- Codex in-app browser checked 1440px desktop, 850/760px tablet, 390px Chinese and
  320px Spanish layouts without page overflow. Checked photo/section navigation,
  mobile highlight/photo controls, keyboard access to the last photo (11/11),
  Spanish-to-English switching and footer About navigation. Screenshots are
  `output/playwright/about-*.jpg`. Native 200% zoom and a full accessibility audit
  were not performed.
- The initial port-3021 preview encountered watcher errors and stopped; a
  separate server also became unavailable during checks. Remaining verification
  used an isolated temporary copy on port 3033 with
  `WATCHPACK_POLLING=true pnpm exec next dev --webpack --port 3033`.
  That temporary server was stopped after verification. Other concurrent edits
  were preserved. No production build, commit, push or deployment was performed.

Updated September 25, 2026 after the homepage design pass. This records local
implementation and checks, not production deployment or accessibility certification.

### Shared office pages and contact catalog — September 30, 2026

- Added local Miami, Boston, Los Angeles and Beijing detail pages in English,
  Chinese and Spanish. Footer and Contact detail links use these routes;
  legacy office PHP/HTML URLs redirect to them. Invalid slugs return 404.
- Extracted `OfficeCard` for Contact and office details. Public phone/email/address,
  messaging channels and structured business hours live in `lib/contact.ts`.
  Maps derive from that address; Beijing's phone link uses +86. Payment recipient
  mailing addresses reference the catalog, while payment account identities stay
  separate. Imported service/article contact literals use immutable source aliases
  resolved against the catalog; historical image files remain unchanged.
- Passed TypeScript, all three locale message checks, 12 office route checks,
  12 PHP redirects and unknown-office 404. An in-memory catalog mutation verified
  propagation to article text, phone/email links, hours, map queries and payment
  addresses without changing actual business data.
- In-app browser inspected all four English desktop pages (1440px), representative
  Chinese/Spanish office pages at 390px, footer navigation, locale switching,
  Contact detail links and contact cards, the Los Angeles article contact section,
  and Payment recipient addresses. Mobile pages had no document overflow.
  Screenshots: `output/playwright/office-*-desktop.jpg`, `office-*-mobile.jpg`,
  and `office-blog-contact-regression.jpg`.
- The original 3021 server returned empty responses after file-watcher errors.
  Verification used a temporary source copy with polling/webpack on 3022, then
  stopped that temporary server. The owner's 3021 server later recovered; its
  actual Chinese Miami page was also opened in-app successfully. A rapid
  pre-hydration language-menu interaction emitted a shared-navigation hydration
  warning; subsequent page navigation and office content rendered correctly.
  No build, commit, push, deployment, message or payment submission was performed.

### Career page — September 30, 2026

- Added `/career`, `/zh/career` and `/es/career` using the shared site shell and
  the complete English legacy Career source. All 10 full-time and 6 part-time
  roles, benefits, application instructions and closing copy remain unchanged.
- Source and rendered-body comparisons passed on all three routes: 27,358
  normalized characters, including all collapsed descriptions. Original address
  capitalization is preserved independently of shared dynamic contact formatting.
- Footer Career links now stay local. `/e-careers.php?from=legacy` returns 308 to
  `/career?from=legacy`. The original Google Forms URL remains unchanged.
- In-app browser passed desktop and 390px job expand/collapse, keyboard access to
  the application link, section jumps and mobile benefit-card navigation. At
  320px and 390px there was no page-level horizontal overflow. Final desktop
  and mobile screenshots are `output/playwright/career-desktop.jpg` and
  `output/playwright/career-mobile.jpg`; the viewport override was reset.
- The existing preview stopped during configuration reload, with file-watcher
  errors recorded. Verification used a temporary polling/webpack server on 3021;
  that temporary server was stopped after verification.
- TypeScript and i18n checks passed after refreshing generated Next route types.
  No production build, commit, push or deployment. Current vacancies and external
  application submission were not verified.

### Newest-first blog ordering — September 30, 2026

- Replaced pilot/topic pinning within article lists with descending original
  publication dates. The credential-evaluation default and featured guide remain.
- Generated lightweight date metadata for all 80 articles: 46 source dates and
  34 null dates. Undated articles follow dated articles; ties retain inventory order.
  Dates come only from leading source dates/bylines, including legacy spacing.
- Passed source reproducibility and TypeScript checks. In-app browser verified
  `/zh/blog` default evaluation order, all-topic order, expert filtering and search;
  mobile 390px evaluation list has the same order and no horizontal overflow.
  Saved desktop/mobile `blog-newest-first-*.jpg` in `output/playwright/`.
  Viewport reset; no build, commit, push or deployment.

### Two restored standalone English articles — September 30, 2026

- Completed the two remaining restored English standalone sources after the 18-blog
  batch: `best-credential-evaluation-services` and `e-credential-evaluation-for-uscis`.
  Both appear in the blog, with English bodies across locales and root-URL redirects.
- Final catalog: **80 local articles** (78 of the original 109 blogs + 2 standalone).
  Topics: 28 evaluation, 42 translation, 7 interpretation, 3 expert opinion.
  Source body headings are retained: the USA list is now titled 10 Best Credential
  Evaluation Services (2026) in the supplied local source, not the older 15-item title.
- Added explicit standalone source handling and reviewed source hashes. Preserved
  16 additional image placements and 11 tables. Numeric source anchors are retained;
  one duplicate q2 anchor becomes q2-2. Removed the old duplicated footer/map iframe
  from the H1B page, retaining article prose and written contact information.
- Final generated collection: 79 bodies plus the separate pilot; 191 image placements,
  93 unique image files and 32 tables. The two missing A2Z placements remain recorded.
- Final verification passed: 240 locale routes, 95 image URLs, invalid-slug 404s,
  reproducible source/prose checks, TypeScript and i18n. All 157 redirects passed
  308/query checks on temporary port 3022; that server is stopped. Port 3021 still
  requires a restart for new redirect configuration (article routes already work).
- In-app browser verified USA article at desktop width, H1B guide at 390px (one
  footer, no duplicate IDs, no page overflow), default evaluation (28), all topics
  (80), and USA-title search (one result). Saved `blog-restored-usa-desktop.jpg` and
  `blog-restored-uscis-mobile.jpg` under `output/playwright/`. Viewport reset.
- No build, commit, push or deployment. Thirty other blog findings and one visa
  topic remain unresolved; publication acceptance is separate from local migration.

### Restored 18 blog articles — September 30, 2026

- Migrated all 18 restored candidates (16 evaluation + 2 expert opinion), bringing
  the local total to 78: 26 evaluation, 42 translation, 7 interpretation, 3 expert.
  The 30 other findings, one visa topic and two standalone English candidates
  remain separate. No Chinese article-body variants were added.
- Retained all source prose, author/date text, biography mentions and NACES links.
  `biography-review.json` records reviewed source hashes; the importer permits
  those specific biography matches and stops on changed/unreviewed sources.
- The new batch retains 75 image placements and 18 substantive tables. Across
  77 imported bodies plus the separate pilot, generated bodies contain 175 image
  placements from 83 unique files and 21 substantive tables. New asset descriptions
  were checked visually against source contact sheets; dated captures use disclosures.
- Missing source `/images/A2Z.png` affects California and San Francisco agency lists.
  Local source is absent; the old-site URL returns homepage HTML, not an image.
  Omitted only those two broken placements, retained all organization prose/links,
  and recorded the issue in `migration-report.json` and the checklist.
- Repaired eight `#q1.html` links to existing `#q1` targets. Fixed legacy relative
  service/contact/application-PDF URLs and the malformed `link to https://` citation.
  Verified all ten local destinations linked by the new batch, including fragments.
  Decorative dash separators are omitted; article prose remains unchanged.
- Verification passed: importer reproducibility/prose checks, 234 locale/article
  routes (H1, English body parity, noindex, IDs/anchors), 85 image paths, invalid
  slugs, TypeScript, i18n and whitespace. Full route/image checks use port 3021.
- All 155 legacy redirects (36 new) passed 308/query-preservation checks using a
  temporary port-3022 server because the existing preview retained startup config.
  Started `pnpm exec next dev --webpack --port 3022` in an isolated temporary
  checkout after symlink/Turbopack and sandbox watcher failures; it is now stopped.
  Port 3021 was not restarted and still needs to reload the new redirect config.
- In-app browser passed Georgia desktop/390px, China guide at 320px, mobile expert
  contents expansion, table keyboard scrolling without page overflow, Georgia
  search (one result), all topics (78), expert (3) and default evaluation (26).
  Screenshots: `output/playwright/blog-restored-georgia-desktop.jpg` and
  `blog-restored-georgia-mobile.jpg`. Viewport override reset; Georgia preview retained.
- No production build, commit, push or deployment. AICE-reference publication
  review and dated-claim review remain tracked separately.

### Blog biography exclusion reassessment — September 30, 2026

- Owner correction: past employment at a NACES agency does not exclude an article.
  Rechecked all 48 previously excluded article families (entry/include/root/shared
  sources) and seven standalone sources. Restored 18 blog candidates, leaving 30
  with other historical findings for a separate decision and one visa topic held.
- Inventory at reassessment (before the subsequent migration above):
  60 migrated locally + 18 awaiting migration + 30 pending review
  + 1 visa held = 109. Two English standalone candidates are also restored; three
  Chinese variants have biography exclusions lifted but are source/URL references,
  and two standalone sources retain other findings. Standalone counts are separate.
- Corrected Georgia's unsupported AES-comment attribution; its section describes FCE.
  Five restored blog families currently have biography hits only in the older root copy.
- Updated screening evidence, inventory and main checklist. AICE references in the
  restored California/Los Angeles/Georgia lists and standalone USA list are tracked
  separately against application page 13 if the application is under review.
- Documentation/source review only: no article import, frontend change, membership
  status verification, browser check, commit or deployment. The importer/catalog
  at that point implemented the original 60-article scope; the migration above expands it.

### Payment source-copy restoration — September 30, 2026

- Restored the legacy card restrictions and introduction, Miami/Boston public
  deposit details, Boston check instructions, six Zelle steps, all four office
  selections and the participating-bank link. Public masked account values,
  routing/SWIFT details and addresses are copied exactly from the source.
- Restored all nine processing/security rows, the $500 note, all six shipping
  methods with source headings and the domestic/international lost-package
  policies. Preserved both original $250/$500 statements and the original Zelle
  initial Chase display versus Bank of America after office selection.
- English copy follows `e-pay-content.html`, checked against the live old page.
  Chinese and Spanish include the same full content. The existing disabled
  legacy captcha remains omitted; no backend/payment-handoff changes were made.
- In-app browser verified English desktop, all four Zelle office selections,
  Chinese mobile at 390px, Spanish mobile at 320px and shipping expansion.
  Neither mobile width had page overflow. Screenshots are under
  `output/playwright/payment-content-restored-*.jpg`.
- Normalized source-to-rendered comparison covers 147 of 148 legacy text
  segments; only the intentionally omitted Verify Code control label differs.
  All three locales have six Zelle steps, nine processing rows, six shipping
  methods and both amount statements. Typecheck, i18n and whitespace checks
  passed. Reused the existing server; no build, payment submission or deployment.

### Remaining 59 blog articles — September 30, 2026

- Completed local migration of the other 59 retained English articles: 9
  evaluation, 42 translation, 7 interpretation and 1 expert opinion. Together
  with the original Boston pilot, all 60 bodies now open locally; 0 remain to
  import in the original scope. The later biography reassessment above restores
  18 of the original 48 exclusions; the other 30 require review and visa stays held.
- Added a shared article renderer, semantic contents navigation, responsive
  tables, preserved dates and images, localized internal links, and body-heading
  display titles. The legacy H1B title mismatch is resolved in favor of its body
  heading (2026); source metadata remains recorded. No author/date was invented.
- Preserved normalized prose for every imported body, plus 100 image placements
  from 57 source files and three substantive tables. Assets were copied
  byte-for-byte and visually classified; historical figures use disclosures.
  Fixed legacy image-only paragraph handling and nested image-link/disclosure
  markup after comparing image counts and inspecting the rendered articles.
- Removed duplicate legacy contents/share controls and inline behavior/styling.
  Thirteen links to excluded articles become plain text, without importing any
  excluded content. The offline importer rechecks all retained PHP/includes/root
  copies against the documented exclusion aliases and records source hashes.
- All 60 index links now use local article routes. Added 119 PHP/root-HTML permanent
  redirects. HTTP verification passed for 180 article/locale routes (body parity,
  H1, noindex and fragments), 59 image paths, 119 redirects with query preservation,
  and unknown/excluded/held article 404s. Source integrity, safe HTML, image/table
  counts and contents targets passed. Typecheck and i18n checks passed.
- In-app browser verified evaluation, translation, interpretation and expert
  articles on desktop and 390px mobile: default 10 evaluation entries, all 60
  local links, search, mobile contents, image disclosure and table scrolling.
  Wide comparison tables were adjusted after mobile inspection to prevent
  words being squeezed into narrow columns; the page itself does not overflow.
  Screenshots include `output/playwright/blog-migration-evaluation-desktop.jpg`,
  `blog-migration-table-mobile.jpg` and `blog-migration-interpretation-mobile.jpg`.
- Updated the main checklist and all 60 inventory entries to distinguish local
  migration completion from publication acceptance. Source-claim accuracy review
  and production cutover remain open; no publishing or deployment was performed.
- The previous port-3021 server was stopped. Started `pnpm dev` for verification;
  sandbox file-watcher errors required restarting that process outside the sandbox.
  The replacement preview server remains running at `http://localhost:3021`.

### Privacy and Terms — September 30, 2026

- Added `/privacy` and `/terms` with a shared restrained reading layout,
  desktop section index and native mobile directory disclosure. Per the owner's
  follow-up, only English documents remain; Spanish copies and the Chinese
  fallback notice were removed. All 12 Privacy and 13 Terms sections retain
  the original text, anchors, lists and emphasis. No effective date was invented.
- All footer and Payment legal links point to the English routes. Former
  Chinese/Spanish routes and old English PHP/HTML and Spanish/Chinese PHP
  aliases redirect there. Legal pages ignore language detection without changing
  the saved site-language cookie or advertising alternate-language documents.
- HTTP checks covered both documents through unprefixed, English, Chinese and
  Spanish paths under all three language preferences: all resolve to English,
  preserve full text and query parameters, and leave the locale cookie unchanged.
  Localized Contact/Payment pages and their legal links passed regression checks.
- In-app browser checked desktop Privacy, mobile Terms at 390px without overflow,
  and redirects from Chinese Privacy and Spanish Terms to the English pages.
  Initial connection timeouts were resolved using a fresh tab. Typecheck, i18n
  and whitespace checks passed. Evidence: `output/playwright/legal-english-only.png`.
- Reused the existing development server and its automatic configuration reload.
  No manual server restart, production build, commit, push or deployment here.
  Owner review of actual payment, analytics, retention and security practices
  remains before launch; see `content/legal/README.md`.

### Payment landing-flow parity — September 30, 2026

- Restored the legacy empty `item_name` in the PayPal handoff. The previous
  service-name prefill bypassed the Purchase details step. Required-field
  validation, office selection, USD amount, and localized return URLs remain.
- Used the existing port-3021 server and synthetic $1 preview information to
  obtain the updated API's handoff HTML. Opened that HTML through a temporary
  local preview in the Codex in-app browser; PayPal reached
  `/webapps/shoppingcart#/checkout/openButton` with Description, $1.00, quantity
  1, and Continue. Verified desktop and 390px mobile views. No Continue click,
  login, card entry, or payment completion; downstream guest checkout unverified.
- Local checks passed for all 12 office/locale combinations, Other Services,
  six invalid submissions, TypeScript, and i18n. Removed the temporary preview.
  Screenshots: `output/playwright/payment-open-button-desktop.jpg` and
  `output/playwright/payment-open-button-mobile.jpg`. No build or deployment.

### Blog priority and first article pilot — September 30, 2026

- Made credential evaluation the Blog headline, introduction, featured guide and
  default list (10 articles). Other topics live in a secondary selector; all 60
  entries remain accessible, with evaluation sorted first. Reset returns to
  evaluation. This supersedes the initial all-topics default below.
- Added `/blog/boston-foreign-credential-evaluation-services` and corresponding
  localized routes. The featured and list cards link to this local article;
  the other 59 bodies remain on legacy URLs. English prose was preserved in full
  and verified against the source, with semantic sections and report-type lists.
- Added desktop contents, native mobile contents, the two original images,
  evaluation-service and Boston-contact actions. Corrected image descriptions:
  the sources show a historical evaluation report and archived reviews, not
  office photos. Historical details are labeled; reviews are collapsed by default.
  No publication date or author was invented. Article bodies are English-only by
  owner decision, without language-availability notices; Chinese/Spanish article
  routes remain noindexed because they duplicate the English body.
- Both legacy article paths return 308 to the new route with query preservation.
  All six index/article locale routes and both images return 200; section IDs
  are unique. Full source prose and image-byte comparisons passed. Rechecked
  the pilot entry/include/root copy against exclusion terms; none matched.
- The in-app browser's old error tab was blocked as a data URL; it was not used.
  The valid HTTP preview tab subsequently timed out on selection/screenshot.
  Used the prescribed Playwright CLI fallback: desktop index/article at 1440px,
  mobile screenshots at 390px, and all six routes at 320px without page overflow.
  Topic selection (42 translation / 60 all), empty search, reset to 10 evaluation,
  local article navigation, mobile contents links and archived-image expansion
  passed. Both article images loaded successfully.
- Typecheck, i18n and whitespace checks passed. Screenshots:
  `output/playwright/blog-evaluation-desktop.png`, `blog-evaluation-mobile.png`,
  `blog-article-desktop.png` and `blog-article-mobile.png`.
- Reused the existing server; redirect configuration reloaded automatically.
  No build, production mutation or deployment. Owner feedback, content-claim
  review remain open before extending this pilot or publishing.
  The inventory's article completion checkbox intentionally remains unchecked.

### Blog English-only content — September 30, 2026

- Removed article translation-availability banners and the index language notice
  from all locale variants. Blog bodies are English-only by owner decision; shared
  navigation and index controls remain localized. Updated the migration checklist
  and source/design notes so blog translations are no longer a pending task.
- Verified the Chinese blog index and pilot article visually in the in-app browser:
  both notices are absent, the article starts directly with its English prose,
  and the index still defaults to 10 credential-evaluation articles.
  Typecheck, i18n and whitespace checks passed. Screenshot:
  `output/playwright/blog-english-only.jpg`.

### Blog index — September 30, 2026

- Built `/blog`, `/zh/blog`, and `/es/blog` with the shared header/footer,
  localized interface, 60 English article titles, topic filters, title/city search,
  result counts and an empty-state reset. All entries render on the server and
  remain readable without JavaScript. Excluded and held articles are absent.
- Header/footer Blog links now use the active locale. `/blog/` and
  `/blog/index.php` return 308 redirects; the PHP alias preserves query parameters.
- Verified all 60 legacy destinations with GET: 58 root HTML articles and two
  PHP articles return 200 without falling back to the homepage. The other 58
  PHP paths fall back to `/home.php`, so explicit working paths are stored in
  the catalog. Article bodies remain on the old site and are not marked migrated.
- In-app browser checks passed for English desktop (1440px), English mobile
  (390px), and Chinese/Spanish narrow mobile (320px), with no page overflow.
  Combined evaluation/Boston filtering returns two articles; unmatched search
  returns zero and Clear filters restores 60; Chinese expert filtering returns
  one. Header/footer Chinese Blog links resolve to `/zh/blog`.
- Typecheck, existing locale validation and whitespace checks passed. Catalog
  validation confirms exactly the inventory's 60 unique candidate slugs and
  corresponding local source files. Screenshot: `output/playwright/blog-desktop.jpg`.
  Reused the running server. No build, deployment or production mutation.
- Before launch: complete article accuracy review and content migration
  or provide a separate legacy host before switching the production domain.

### Payment page draft — September 29, 2026

- Built English, Chinese and Spanish `/payment` pages with the shared service
  shell, the source form fields and four existing payment-office choices.
  The form ports the old PHP processor to a local PayPal HTML-form handoff,
  with server-side office routing and validation; no REST API credential or new
  merchant choice was added. Local ignored merchant configuration was copied
  from the legacy source.
- Optional mailing address is collapsible. Terms and privacy links remain
  available. Secondary methods direct users to confirm current instructions
  with their office rather than republishing unverified bank information.
  Shipping tables reuse the shared Pricing records.
- The header and footer link to the localized route, and `/e-pay.php` redirects
  to `/payment`. A real or sandbox payment was not submitted. Before launch,
  verify office recipients, payment return/cancel behavior, and reconciliation. The legacy
  IPN success handler did not record transactions; a browser return is not
  proof of payment. Deployment needs the payment environment values.
- Local handoff checks generated PayPal forms for all four offices with the
  expected amount, USD currency and localized return URL; malformed office,
  amount and terms submissions returned 400. No PayPal form was submitted.
  The Chinese payment form and cancel-return page rendered in the in-app
  browser. Typecheck, i18n and whitespace checks passed; no build or deploy.
- Navigation follow-up: header Payment, footer popular Payment, and the
  homepage online-payment text now resolve to the active locale. The in-app
  browser checked Chinese and Spanish links and the homepage payment link;
  `/e-pay.php?ref=demo` returned 308 to `/payment?ref=demo` locally.
  Typecheck and i18n checks passed. No payment was submitted.

### Contact — September 29, 2026

- Built localized English, Chinese and Spanish Contact pages with the legacy
  email/visit instructions, six offices, phone/email actions, directions links,
  secondary contact channels and Other Contact details. Los Angeles uses the
  owner-selected `17802 Sky Park Cir` address in every locale.
- Reused the service-page shell and mobile card rail. Remapped sitewide Contact
  links and reviewed service-copy links to the localized page; legacy Contact
  PHP URLs return 308. The footer's Los Angeles link points to the new card so
  it does not lead to the conflicting address on the old office-detail page.
- Moved the six office jump links into the left page index on desktop. At
  1000px and below, the compact page index stays above the content and the
  office jump links remain in a horizontal row above the office cards.
- Local browser verified six office anchors, the LA address and contact actions,
  mobile horizontal card navigation, `#sf` positioning and no 390px page
  overflow. Typecheck, i18n and whitespace checks passed. No build or deploy.
- Office contact information, hours and service availability still need owner
  review before launch. The four footer office-detail pages were subsequently migrated; see the September 30 office entry.

### Remaining five service pages — September 29, 2026

- Added Technical Translation, Interpretation, Expert Opinion Letters, General
  Translation, and Notarization with the shared service shell. English and Chinese
  follow their legacy content files; Expert also uses its Spanish source. The
  other Spanish routes visibly label their English fallback and are noindexed.
- Connected navigation, homepage cards, footer and 11 existing legacy PHP paths
  to localized routes. Current shared rates replace conflicting Interpretation,
  Expert and General Translation source prices; Expert shipping also reuses the
  shared catalog. Source-specific applications and the Expert PDF remain intact.
- Expert partners use the homepage institution carousel. Its legacy Why Choose
  infographic is omitted because of unverified absolute acceptance/review claims.
  The excluded China authentication referral is removed from Notarization.
- In-app browser: all five Chinese pages and Expert Spanish render at 320px
  without page overflow, duplicate IDs or failed images. Spanish fallback notice
  renders. Selected English legacy redirects return 308. Typecheck, locale checks
  and whitespace checks passed. Reused the running server; no build or deployment.
- Remaining before launch: source-claim/business review (especially coverage,
  client logos, notary fees and legal/process copy), Spanish translations for four
  pages if required, and broader contact/related-page migration.

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

## 2026-10-08 — Boston address update

- Updated the shared Boston postal address to `6 Pleasant Street, #419, Malden, MA 02148`.
  Office cards, directions, structured data, payment recipient addresses, and mapped
  legacy article references derive their current address from this catalog.
- Verified rendered HTML for the English, Chinese, and Spanish Boston office pages,
  Contact, Payment, and the Boston translation-company article: each includes the new
  address and excludes the former suite number.
- Codex in-app browser checks passed for the Chinese Boston contact section at desktop
  and 390px mobile widths; the address wraps correctly and the directions URL uses #419.
- Used a temporary local preview on port 3021 with Watchpack polling because native
  file watching exceeded the environment limit. No production build or deployment.
