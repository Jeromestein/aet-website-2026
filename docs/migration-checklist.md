# AET 2026 Website Migration Checklist

Inventory date: September 28, 2026. Source: the local legacy website and the
current 2026 design, navigation, footer, and homepage code.

## Scope and current status

The destination is `aet-website-2026`; the content source is
`server-54.213.58.23/americantranslationservice.com`. Other company websites
(Meiyu Group, Jiahua, immigration, and cryonics) are outside this AET migration.

The new project currently rebuilds homepage content; its service and supporting
links still lead to **20 distinct pages/sections** on the legacy domain. The 20
include the blog index, not individual articles. There are also **109 blog article
PHP entry points** in the local copy. These are source counts, not verified live
or already migrated pages.

Build each destination once using the project's Next.js i18n architecture:
shared page templates under `app/[locale]/`, with `en`/`zh`/`es` localized content.
Chinese and Spanish are language variants of those same pages, not separate page
rebuilds or additional migration counts. Legacy translated files are content
references and old URLs to map, not additional implementation tasks.

The shared homepage is at `app/[locale]/page.tsx`; message files and locale routing
are configured for `/`, `/zh`, and `/es`. This confirms the source structure, not
browser acceptance. The service links still use English legacy destinations in
all locales and need locale-aware destinations as the shared pages are migrated.

An unchecked item means work remains. Mark a page complete only after its content,
assets, links, required functionality, and desktop/mobile presentation are verified.
Existing homepage implementation is not evidence of a completed site migration.

P0 below is the first implementation batch because these destinations are already
exposed by the new homepage. P1 content may follow during development, but every
retained old URL needs a working destination before the old host is retired.
No new route naming convention for migrated detail pages is established here:
retain old URLs or record an explicit old-to-new redirect when a destination is
implemented. Follow the existing locale routing for all shared page templates.

## Already present in the new homepage

- [x] Homepage structure is implemented, now in `app/[locale]/page.tsx`.
- [x] A localized homepage scaffold and English/Chinese/Spanish message files
  exist in the working tree; their content parity and browser acceptance remain open.
- [x] Navigation retains Evaluation and six Services: Certified Translation,
  Technical Translation, Interpretation, Expert Opinion Letters, General
  Translation, and Notarization.
- [x] Homepage contains evaluation types, company facts, institution logos,
  application steps, pre-evaluation, FAQs, and client reviews.
- [ ] Recheck the homepage after replacing legacy destinations with migrated routes.

The checked items above were confirmed from source code in this inventory.
Previous visual checks are recorded in [status.md](status.md); they were not rerun
for this documentation task.

## P0 — 20 shared destination pages/sections linked by the new homepage

Paths below are relative to `https://www.americantranslationservice.com`.
For a PHP page, migrate its included `*-content.html` plus relevant metadata and
assets; the PHP wrapper and content fragment are not two separate pages.
The English legacy paths identify the content source. Each checklist item covers
one shared page and its i18n content, not three independently implemented pages.

### Evaluation and the six retained services — 7 pages

- [ ] **Foreign Credential Evaluation** — `/e-evaluation.php` → Evaluation page.
  Preserve the introduction, document-by-document and course-by-course options,
  requirements, fees, processing times, sample reports, delivery information,
  institution references, and application/pre-evaluation actions. Align its
  online application instructions with the new homepage's four steps and retain
  the source form-based instructions under Email.
  Local implementation: `/evaluation`, `/zh/evaluation`, and `/es/evaluation`
  now preserve legacy text and reuse the new Pricing module (September 29).
  The application section reuses the homepage Online / Email module: four online
  steps and three source form-based steps, with Online selected by default.
  See [status.md](status.md) for checks;
  final content reconciliation and launch acceptance remain open.
- [ ] **Certified Translation** — `/e-notarized.php` → Certified Translation page.
  Preserve document types, languages, quote/application instructions, pricing,
  sample PDFs, delivery options, and FAQs. Review the old `/apply` portal link;
  do not assume a translation request uses the credential-evaluation form.
  Local implementation: `/certified-translation` and its `/zh` and `/es` variants
  now use the shared service shell, pricing, mobile rails, native FAQ/shipping
  disclosures, and source samples. The old online link was commented out; active
  application instructions are office/email/payment. See [status.md](status.md).
  Final source-claim reconciliation and launch acceptance remain open.
- [ ] **Technical Translation** — `/e-tech-translation.php` → Technical Translation
  page. Preserve the scientific, industrial, medical, business, legal, and
  education content and its contact action.
  Local implementation: `/technical-translation`, English and Chinese source
  copy, image assets, quote email and localized navigation. Spanish has a
  clearly labeled English fallback. See provenance README and [status.md](status.md).
- [ ] **Interpretation** — `/e-interpretation.php` → Interpretation page.
  Preserve supported scenarios, languages, service coverage, and booking/contact
  instructions; carry regional content into relevant supporting pages.
  Local implementation: `/interpretation`, source booking and coverage copy,
  shared prices, peer-use cards and source images. Spanish has a labeled English
  fallback. Regional supporting pages and claim review remain open.
- [ ] **Expert Opinion Letters** — `/e-expert-opinion-letter.php` → Expert Opinion
  Letters page. Preserve purposes, fields, document requirements, fees/timing,
  FAQs, and related evaluation articles.
  Local implementation: `/expert-opinion-letters` in all three source languages,
  with shared price/shipping tables, local form PDF, article links and current
  institution carousel. The legacy page has no FAQ block to migrate.
- [ ] **General Translation** — `/e-translation.php` → General Translation page.
  Preserve language coverage and quote instructions; retain the distinction from
  Certified Translation.
  Local implementation: `/general-translation`, English and Chinese source
  explanations, shared Chinese/English rates and localized Certified link.
  Spanish has a labeled English fallback.
- [ ] **Notarization** — `/e-nus.php` → Notarization page. Preserve retained service
  content; resolve its link to the excluded China Consular Authentication service.
  Do not equate all notarization/apostille content with the excluded service.
  Local implementation: `/notarization`, English and Chinese source sections and
  fees; excluded-service referral removed. Spanish has a labeled English
  fallback. Fee and legal/process review remain open.

### Contact, payment, and company information — 5 pages

- [ ] **Contact** — `/e-contact.php` → Contact page. Verify office details, phone,
  email, QR codes, maps, and contact actions against approved business information.
  Preserve or remap anchors including `#miami`, `#boston`, `#la`, `#sf`, `#nyc`,
  and `#bj` where retained pages link to them.
  - Local implementation (September 29, 2026): English, Chinese and Spanish
    Contact routes now contain all six office anchors, source contact options,
    click-to-call/email links, directions links, and the Other Contact section.
    The owner selected `17802 Sky Park Cir` for Los Angeles across locales.
    Legacy Contact URLs redirect to the localized routes, and existing site
    Contact links point to them. The source Contact pages have no QR code, form,
    or embedded map to migrate. Business verification of office facts and
    remaining office-detail pages is still required before launch.
- [ ] **Payment** — `/e-pay.php` → Payment page with a functioning payment path.
  The local form posts to `pay/process.php`, which uses the old PHP payment flow.
  Choose a maintained backend or approved replacement and verify it in test mode;
  copying the visible form is insufficient. Preserve approved payment instructions
  and terms links without copying private payment configuration into frontend code.
- [x] **Service Fee** — `/e-fee.php` → localized `/pricing` page, implemented
  September 29, 2026 from the owner-updated legacy fee page. Fees, turnaround,
  shipping and expert-opinion rates use shared records and reusable tables.
  China Visa is excluded; proofreading and English writing are included in
  Other Services with shared pricing and localized notes. Local verification is recorded in `status.md`; production
  deployment and remaining service-page migrations are still open.
- [ ] **About AET** — `/e-aboutus.php` → About AET page. Preserve supported company
  history, credentials, and brand information; reuse the new visual system.
- [ ] **Career** — `/e-careers.php` → Career page. Confirm which roles remain open
  and verify the existing application destination before publishing listings.

### Offices shown in the new footer — 4 pages

- [ ] **Miami** — `/e-office-miami.php` → Miami office page.
- [ ] **Boston** — `/e-office-boston.php` → Boston office page.
- [ ] **Los Angeles** — `/e-office-los-angeles.php` → Los Angeles office page.
- [ ] **Beijing** — `/e-office-beijing.php` → Beijing office page.

For each office: verify address, hours, contact details, directions, images,
service availability, and links from Contact. The design specifies four footer
links; it does not establish that other offices have closed.

### Trust, legal, and publishing — 4 pages/sections

- [ ] **Institutions** — `/e-credential-evaluation-partners.php` → Institutions page.
  Required by the homepage's “Explore all institutions” link. Preserve the full
  relevant list, supporting information, logos, and section anchors; keep factual
  acceptance/relationship wording within its source qualifications.
- [ ] **Terms of Use** — `/e-terms-of-use.php` → Terms of Use page.
- [ ] **Privacy Policy** — `/e-privacy-policy.php` → Privacy Policy page.
  For both legal pages, carry the existing text into the new layout and review any
  changes needed for the actual new payment, contact, analytics, or data handling.
- [ ] **Blog index** — `/blog`, `/blog/`, `/blog/index.php` → Blog index.
  Provide working links to retained articles; normalize these three entry points
  to one destination. Article migration is tracked separately below.

## Shared i18n acceptance — part of each page migration

The site uses Next.js with `next-intl`. These checks apply to the same shared
pages listed above; there is no separate Chinese or Spanish page-building phase.

- [ ] Implement each page's layout and behavior once under the existing locale
  routing, with localized text in the project's message/content structure.
- [ ] Review useful legacy Chinese/Spanish wording and incorporate it into the
  corresponding shared page's localized content. Resolve differences in fees,
  addresses, service scope, and instructions against the approved common content.
- [ ] Replace hardcoded English legacy links with locale-aware links as each
  destination is migrated. Switching language should retain the equivalent page.
- [ ] Map old language URLs to the appropriate locale of the shared page,
  including `/home-zh.php` → `/zh` and `/home-es.php` → `/es`.
- [ ] Supply reviewed translations or an explicit fallback for missing localized
  content. A missing old PHP file does not require recreating a PHP page.
- [ ] Verify language switching, translated content, metadata, `lang`, language
  alternates, fonts, and desktop/mobile presentation. Apply service exclusions
  consistently in all three locales.

### Legacy translation references and redirect sources

This table is reference data, not an additional page checklist. A dash means
there is no current PHP translation source in this inventory.

| Shared page | Chinese legacy source | Spanish legacy source |
| --- | --- | --- |
| Homepage | `/home-zh.php` | `/home-es.php` |
| Evaluation | `/e-evaluation-zh.php` | `/e-evaluation-es.php` |
| Certified Translation | `/e-notarized-zh.php` | `/e-notarized-es.php` |
| Technical Translation | `/e-tech-translation-zh.php` | — |
| Interpretation | `/e-interpretation-zh.php` | — |
| Expert Opinion Letters | `/e-expert-opinion-letter-zh.php` | `/e-expert-opinion-letter-es.php` |
| General Translation | `/e-translation-zh.php` | — |
| Notarization | `/e-nus-zh.php` | — |
| Contact | `/e-contact-zh.php` | `/e-contact-es.php` |
| About AET | `/e-aboutus-zh.php` | — |
| Service Fee | `/c_fee.html` | — |
| Terms of Use | — | `/e-terms-of-use-es.php` |
| Privacy Policy | — | `/e-privacy-policy-es.php` |

The old Chinese footer links to missing local files `e-terms-of-use-zh.php` and
`e-privacy-policy-zh.php`. The old Spanish header also links to missing local files
`e-tech-translation-es.php`, `e-interpretation-es.php`, `e-translation-es.php`,
`e-nus-es.php`, and `e-aboutus-es.php`. Resolve their URLs through the shared page's
locale routing and content policy. Missing-file observations refer to the local
checkout, not a live HTTP audit.

## P1 — Blog, search landing pages, and supporting content

- [ ] Review and migrate the **109 article entry points** in the
  [article checklist](migration-blog-inventory.md). Preserve useful evaluation,
  translation, interpretation, country, state, and city content. Refresh dated
  factual claims before publication and decide explicitly which pages to merge.
- [ ] Reconcile root-level HTML articles with their corresponding `/blog/*.php`
  pages. **106 of the 109** have same-stem root HTML files locally; file-name
  matching is a duplication candidate, not proof of identical content. Select one
  canonical destination per article and preserve inbound old URLs with redirects.
- [ ] Review these additional English pages outside that 109-entry inventory:
  `/best-credential-evaluation-services.html`,
  `/san-francisco-foreign-language-interpreter-agency.html`,
  `/expert-opinion-letter-h1b.html`, and
  `/e-credential-evaluation-for-uscis.html`. Migrate distinct useful content or
  merge into the closest evaluation/interpretation article with a specific redirect.
- [ ] Preserve **Course by Course Evaluation** content from
  `/e-course-by-course-evaluation.html`: keep a detail page or merge the complete
  useful content into Evaluation and map the old URL. Document by Document can
  remain a section of Evaluation; a separate page is not required by the design.
- [ ] Review `/e-pre-evaluation.html` and `/e_pre_evaluation.html`; consolidate
  useful explanatory content into the homepage/evaluation page and keep the
  existing pre-evaluation tool action. A second tool implementation is unnecessary.
- [ ] Review `/e_testimonials.html`; migrate any additional relevant testimonials
  or consolidate into the homepage/About page with an appropriate old-URL mapping.
- [ ] Preserve the retained Chinese article/landing content:
  `/c-eb-2-niw-credential-evaluation.html`,
  `/c-how-to-avoid-delays-with-foreign-credential-evaluation.html`,
  `/c-i-140-education-evaluation.html`,
  `/c-education-evaluation-for-h1b.html`,
  `/c-california-barbercosmo-credential-evaluation-and-translations.html`,
  `/c-la-interpretation.html`, `/c-sandiego-interpretation.html`,
  `/c_medical.html`, and `/c_interpretation_case.html`.
  Remove excluded-service promotions from mixed-topic pages while preserving
  retained evaluation, medical translation, and interpretation content. Match
  translated equivalents to one content entry with localized fields; only distinct
  topics need distinct content entries, all using shared page/article templates.
- [ ] Review `/c-articles.html` as a Chinese article index; update its retained
  links. Review the dated `/c-944-article.html` separately before deciding to
  retain, rewrite, or retire it; do not copy it as current guidance.
- [ ] Reconcile older `c_*.html`, `e_*.html`, `/es-evaluation.html`, and other
  historical aliases against the current PHP pages and the old sitemap. Reuse
  unique relevant content; do not create a second page for every legacy filename.

## Pages requiring a disposition, not automatic rebuilding

- [ ] **Visa Services** — keep out of the rebuilt navigation/cards/footer.
  Decide how to handle `/e-visaservice.php`, `/e-visaservice-zh.php`, older
  `e_visaservice.html`, `c_visaservice.html`, `e_chinavisaservice.html`,
  `c_chinavisaservice.html`, `/c-schengen-visa-article.html`,
  `/new-york-visa-application-process-services.html`, and the Boston visa article
  identified in the article checklist.
- [ ] **Editing/Proofreading** — keep out of the rebuilt service scope.
  Resolve `/e-writing.php`, `/e-writing-zh.php`, their older HTML aliases, and
  `/c_paper.html`.
- [ ] **China Consular Authentication** — keep out of the rebuilt service scope.
  Resolve `/e-authentication.php`, `/e-authentication-zh.php`, their older aliases,
  `/c_threecertification.html`, `/c-authentication-article.html`,
  `/c-authentication-article2.html`, and `/c-chinese-authentication-article.html`.
- [ ] **San Francisco and New York office pages** — review
  `/e-office-san-francisco.php` and `/e-office-nyc.php`. Retain an accessible page
  or consolidate verified information into Contact. Keep the new footer limited
  to its specified four offices; do not infer closure from that design decision.
- [ ] **Other language sites** — review `/french/`, `/german/`, `/korean/`,
  `/russian/`, and the older `/spanish/` pages. These are outside the new language
  selector, not automatically approved for deletion. Decide on retention,
  language-appropriate consolidation, or retirement before replacing the domain.
- [ ] Exclude backup/test files, raw content fragments, old standalone headers/
  footers, database libraries, and admin/payment implementation files from the
  public page migration. Preserve required backend behavior separately.

The service removal recorded on September 28 applies to the rebuilt homepage's
service presentation. It does not authorize deleting old production content.
For retired URLs, select a genuinely relevant replacement or an intentional
retirement response; do not redirect every removed URL to the homepage.

## Preserve the existing application portal

- [ ] Keep **Apply Now / Online Application / Start Application** linked to
  `https://app.americantranslationservice.com/credential-evaluation-application`.
- [ ] Keep **Start Your Pre-Evaluation** linked to
  `https://app.americantranslationservice.com/degree-equivalency-tool`.
- [ ] Verify the handoff to existing application/status/upload and checkout flows
  after the website changes. These remain in `aet-app`; they are not marketing
  pages to copy into the new website.
- [ ] Review older application links encountered during content migration,
  particularly the Certified Translation page's app `/apply` link, against the
  intended service flow. Do not redirect all service applications to one form.

## Shared assets, design, and launch completion

- [ ] Reuse the new header/footer, logo assets, typography, colors, page widths,
  spacing, buttons, and mobile navigation across migrated pages. Use suitable
  service, article, office, and policy layouts rather than copying old page CSS.
- [ ] Preserve approved wording, testimonial attribution, and the distinction
  between preliminary assessment and formal evaluation. Review conflicting or
  outdated prices, timing, addresses, acceptance claims, and memberships before
  carrying them into production.
- [ ] Migrate linked assets, especially `/down/applicationform.pdf`,
  `/evaluation_report.pdf`, `/cbcevaluation_report.pdf`, translation sample PDFs,
  office images/maps, and institution logos. Check downloads after route changes.
- [ ] Create an explicit redirect inventory from the legacy `.htaccess`, current
  public routes, old sitemap, and linked historical pages. Include `/`,
  `/index.php`, `/home.php`, `/english.html`, `/chinese.html`, old underscored
  service URLs, office aliases, and root HTML article URLs. Preserve case/spelling
  where incoming links rely on it, including `credential-evaluation-for-emloyment`.
- [ ] Resolve the existing `/office-locations.html` redirect: its target
  `/office-locations.php` is missing locally. Avoid carrying over that broken
  target or the old homepage-as-404 fallback. Provide a real not-found page.
- [ ] Rebuild `sitemap.xml` (and map `/sitemap.html`), canonical URLs, page titles,
  descriptions, language alternates, and appropriate structured data around the
  final destinations. Preserve only relevant verified site-ownership/analytics
  configuration. The local old sitemap has 208 entries and is not a complete
  or validated list of current pages.
- [ ] Verify every new navigation, language, footer, in-page, download, blog,
  contact, and application link. Test redirects for loops, chains, and missing
  destinations. Review desktop/mobile pages in the Codex in-app browser, including
  long tables, FAQs, language text, and office/contact states.
- [ ] Before switching the production domain, ensure all retained paths are served
  by the new site or a deliberately retained legacy host. Keeping an absolute URL
  to the same replaced domain does not keep the old page alive.
- [ ] Complete owner-managed deployment and live checks of final routes, payment
  handoff, forms, downloads, and redirects before marking the migration complete.

## Evidence and verification boundary

- [New project scope and exclusions](../README.md)
- [2026 design baseline](design.md) and [implementation status](status.md)
- [Current navigation](../components/navigation.tsx),
  [footer](../components/site-footer.tsx),
  [institution link](../components/institution-carousel.tsx), and
  [homepage](../app/[locale]/page.tsx), and [locale routing](../i18n/routing.ts)
- [Legacy source directory](../../server-54.213.58.23/americantranslationservice.com/),
  [redirect rules](../../server-54.213.58.23/americantranslationservice.com/.htaccess),
  and [sitemap](../../server-54.213.58.23/americantranslationservice.com/sitemap.xml)

All 20 legacy destinations still linked by the new homepage and the 2 legacy
language homepages have corresponding local files/directories. All 109 blog
article PHP files have their referenced local includes. These checks establish
source availability, not live route behavior. This documentation task changed no
website UI, server, payment configuration, or deployment; concurrent localization
edits belong to separate work and were not modified here.
The local preview on port 3021 was unavailable; no server was started because
this task changes documentation only. No production build was run.
