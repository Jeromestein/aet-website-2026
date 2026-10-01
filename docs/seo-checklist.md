# AET SEO and Structured Data Checklist

Started September 30, 2026. Work through the stages in order. Check an item only
after its stated verification passes; local completion does not imply deployment.

## Current checkpoint — October 1, 2026

**Stage: local SEO implementation and verification completed for the approved
catalog; hosted baseline audited; latest fixes and production cutover pending.**
This update reconciles repository state with the recorded October 1 checks.
It does not establish Google's current indexed URLs or Search Console traffic.

### 1. Completed

- [x] Inventory 448 old paths and configure 277 permanent redirects to retained
  destinations. These are 308 redirects; do not convert them solely for SEO.
- [x] Implement canonical URLs, language alternates, robots/sitemap and structured
  data for the approved catalog of 133 indexable pages, including 80 articles.
- [x] Verify locally: 299 page variants and 4,861 local links; 240 Blog routes;
  133 SEO/schema pages; 277 redirects; 162 unmapped old paths returning real 404s.
  A passing 404 test does not approve retiring a held page.
- [x] Audit the hosted Vercel baseline. Later automated checks encountered a
  Vercel security checkpoint; that blocked portion is not a hosted pass.
- [x] Prepare and locally verify the latest fixes: 15 embedded old AI-summary
  URLs, host-specific noindex for Vercel aliases, and Blog checker false positives.
  These corrections have passed local checks; hosted release remains pending.

### Deferred by owner — October 1, 2026

Unmigrated legacy content and PDFs are outside the current release scope. The
71 content URLs and nine PDF entries remain in the inventory for possible future
pages; they require no decision now and do not block this release. Preserve the
source files and existing URL records. This deferral does not mark them migrated
or permanently retired; no routes, redirects or responses are changed by it.

### 2. Next actions, in order

- [ ] **Release the prepared fixes:** after push/deployment authorization, publish
  through the owner's deployment workflow. Verify Vercel noindex and corrected
  links on the actual deployment. Resume only permitted hosted checks; do not
  bypass the security checkpoint or count blocked requests as application errors.
- [ ] **Prepare cutover:** preserve Search Console ownership verification, confirm
  retained business content and payment acceptance, and record the deployment
  owner, cutover window and rollback plan. Keep the old site until these gates close.
- [ ] **Verify the official domain after cutover:** HTTPS/www routing, permanent
  redirects directly to final destinations, final-page 200 responses, canonical,
  hreflang, sitemap, assets and crawl controls. Indexable official pages must not
  inherit preview noindex; intentional fallback/result noindex remains in place.
- [ ] **Submit and inspect:** submit the new official-domain sitemap in Search
  Console and inspect representative service, Blog and translated URLs. Record
  Google's chosen canonical and crawl/indexing results separately from code tests.
  Same-domain path changes do not require the Change of Address tool.
- [ ] **Monitor after launch:** review indexing, unexpected 404/5xx responses,
  redirect errors and search clicks/impressions against the pre-cutover baseline.
  Keep permanent redirects at least one year, preferably indefinitely. Record
  follow-up results; no scheduled monitoring has been created by this checklist.

### 3. Decisions and actions required from the owner

| Item | Decision/action needed | Suggested approach | Blocks |
| --- | --- | --- | --- |
| Retained business content | Approve unresolved dated fees/timing, office facts, membership/acceptance wording and other publication claims listed in the migration checklist | Review factual content against current business records; technical migration is not factual approval | Publication acceptance |
| Search Console | Provide access or perform the export/submission steps; confirm the existing ownership-verification method | Export old URL performance/link data before cutover and preserve active verification | Traffic-based prioritization and Google-side verification |
| Payment and application acceptance | Confirm all four payment recipients and arrange authorized end-to-end acceptance of payment/application handoffs | Use the agreed test workflow; actual payment completion remains with the owner | Transaction launch acceptance |
| Release and cutover | Authorize push/deployment or publish personally, and choose the formal-domain cutover window | Release tested fixes first; switch the official domain only after the content and transaction gates close | Hosted fixes and formal launch |

Already settled: the production origin remains
`https://www.americantranslationservice.com`; pages share Next.js i18n templates;
English-only Blog bodies do not require separate Chinese/Spanish rebuilds. The
recorded founder/director biography exception to NACES screening remains in force.
None of these decisions is reopened by this update.

Detailed URL decisions: [legacy inventory](seo-legacy-urls.md).
Page/content/payment acceptance: [migration checklist](migration-checklist.md).
Verification evidence and boundaries: [status](status.md#hosted-audit-and-local-corrections--october-1-2026).

## Scope and sources

- New site: `aet-website-2026`, existing local preview on port 3021.
- Legacy AET site: `https://www.americantranslationservice.com/` and the sibling
  `server-54.213.58.23/americantranslationservice.com` checkout.
- The September 30 audit found a different homepage at `https://aet21.com/`. Do not assume it is
  the new canonical host. The owner confirmed the production origin as
  `https://www.americantranslationservice.com` on September 30, 2026.
- Preserve the service scope in README.md. Public contacts come from
  `lib/contact.ts`; fees come from `lib/pricing.ts`.
- No production build, deployment, domain changes, or Search Console submission
  is included in local implementation.

## Audit outcome

| Area | Legacy / initial new-site gap | Implemented new-site behavior |
| --- | --- | --- |
| Canonical origin | Legacy aliases and missing per-page canonical setup in new app | One confirmed www origin; self-canonical translated pages |
| Language indexing | English-only bodies accessible under three locales | Real translations only in hreflang/sitemap; duplicate bodies noindexed |
| Business entities | Legacy contact/schema facts could drift during migration | Shared contact catalog, stable Organization and six office IDs |
| Service pricing | Legacy expert service used Product/invalid USD offer data | Service with verified $620/$700/$800 offers and visible qualifications |
| Articles | Retained bodies had no Article markup | 80 BlogPosting entities with original dates and suitable source imagery |
| Page hierarchy | Visible hierarchy lacked structured breadcrumbs | 130 BreadcrumbList entities aligned with retained pages |
| Sharing | No complete page-specific sharing-image coverage | 133 localized 1200 × 630 cards and matching Open Graph/Twitter metadata |
| Old links | Partial redirect coverage and unreconciled legacy entries | 448-row inventory, 277 permanent redirects, explicit held content/assets |

## 1. Legacy entry points and production origin

- [x] Audit legacy homepage, evaluation and certified-translation JSON-LD against
  the new source and sampled server-rendered HTML.
- [x] Confirm the production origin, including HTTPS and www preference.
- [x] Restore verified homepage and historical HTML aliases for retained pages.
  Acceptance: permanent redirects, retained query strings, correct language and
  section destinations, no loops, and successful final pages.
- [x] Reconcile all 208 legacy sitemap URLs plus root pages, blog entries and
  Apache aliases: 448 rows in [the complete inventory](seo-legacy-urls.md).
- Deferred: the 71 unmigrated content URLs and nine PDFs may become future pages;
  owner review is postponed and is not a current launch gate.
- [ ] Confirm and preserve the active Search Console ownership-verification method.
- [ ] Check host-level redirects on the production deployment after cutover.

## 2. Canonical URLs and indexing

- [x] Introduce one validated production-origin configuration and URL helper.
- [x] Add absolute canonical URLs to every indexable page, including all genuine
  language variants. Do not inherit the homepage canonical on child pages.
- [x] Resolve English-only blog and career variants: align canonical, robots,
  sitemap and hreflang behavior; do not label English bodies as translations.
- [x] Preserve English-only legal routing and payment-result noindex behavior.
- [x] Generate sitemap.xml from retained routes and content catalogs. Include
  canonical indexable URLs only; use real dates rather than the current build date.
- [x] Add robots.txt with the canonical sitemap URL and Vercel preview noindex.
- [ ] Verify preview indexing controls on actual hosted preview deployments.
  October 1: the stable `aet-website-2026.vercel.app` alias lacked noindex. A
  host-specific header fix passed 42 local host/path cases; deployment and
  hosted verification of that fix remain pending.
- [x] Resolve the legacy /sitemap.html destination.
- [x] Remove old-host body links (October 1): 246 → 0 across the 13 affected
  page families in three locales. Held article references retain text without
  hyperlinks. All 299 page variants, 4,861 local links and 318 unique page/file
  targets passed direct-response, locale and fragment checks.
  A later audit also fixed 15 encoded old URLs in external AI-summary links;
  the checker now covers query text as well as direct link destinations.
- [x] Verify served metadata, language alternates, sitemap URLs and status codes.

The September 30 checks used an isolated preview on port 3035 because the owner's
port-3021 process then retained an earlier redirect table. This blocker is
superseded: on October 1, all 277 redirects and 133 SEO pages passed on the owner's
existing port 3021, without an agent-started server or restart.

## 3. Organization and offices

- [x] Add shared, safely serialized JSON-LD and stable entity IDs.
- [x] Add Organization data on the homepage/about page: verified name, founding
  year, logo, URL and public contact details. Review official sameAs destinations.
- [x] Add office LocalBusiness entities with structured postal addresses,
  contact details, business hours and parent organization references.
- [x] Reuse the contact catalog; do not revive extra legacy phone numbers,
  mailboxes, visa or consular-service descriptions without review.
- [x] Check all entity references and logo/image URLs; parse rendered JSON-LD.

## 4. Services and prices

- [x] Add Service entities for evaluation and the retained service pages, with
  localized names, descriptions, URLs and the shared provider ID.
- [x] Replace the legacy expert-opinion Product/invalid USD offer markup with
  appropriate service data. Only include prices supported by the shared catalog
  and visible page; preserve starting, quoted, range and unit qualifications.
- [x] Verify schema facts match the visible page in each supported language.

Implementation notes for stages 3–4:

- Organization and office IDs preserve the legacy identifiers on the confirmed host.
- Six office postal records generate the existing English display addresses and
  JSON-LD; all six addresses were checked for exact preservation. Localized Beijing
  display addresses remain available. No unverified Beijing hours/postcode added.
- Existing footer social URLs are shared with schema. LinkedIn/Facebook identify
  the organization; Yelp identifies the Boston office. Excluded the generic Google
  search URL from sameAs. External account ownership was not re-authenticated.
- Seventeen translated service pages have Service markup, with visible prices
  represented as Offer/UnitPriceSpecification. Estimates, starting prices, ranges,
  units, processing times and interpretation minimums retain their qualifications.
  Quoted services have no invented numeric price. Technical translation and
  notarization have no offers because no shared price table is displayed there.
- At completion of stages 3–4, JSON-LD covered 38 pages; stage 5 expanded coverage
  to the full 133-page indexable catalog. Four untranslated Spanish service pages omit duplicate
  markup. Validation uses the served HTML and the official Schema.org vocabulary;
  this is separate from Google's hosted Rich Results Test.
- Repeat local checks with `python3 scripts/check-structured-data.py` while port
  3021 is running, or supply `--base-url` and an optional cached `--vocabulary` file.

## 5. Articles, hierarchy and sharing

- [x] Add Article/BlogPosting to retained blog articles, using verified dates,
  headline, publisher, language and relevant images. Do not invent author names
  or modification dates.
- [x] Add BreadcrumbList where it represents a meaningful page hierarchy.
- [x] Add page-specific Open Graph URLs/images and appropriate Twitter cards.
- [x] Fix career sharing metadata inherited from the homepage and review clipped
  service descriptions.
- [x] Treat FAQ markup as optional semantic data, not a Google rich-result target.
  Google retired FAQ rich results in May 2026.

Stage 5 acceptance:

- 80 English BlogPosting entities: 46 verified publication dates, 34 undated.
  No author or modification dates invented. 64 articles reference an existing
  inline content image; historical reports/reviews/certificates are excluded.
  Sixteen articles omit the optional image field where no suitable image exists.
- 130 BreadcrumbList entities (all indexable pages except the three homepages).
  Untranslated fallback pages emit no duplicate Article/Breadcrumb data.
- 133 static 1200 × 630 sharing cards use each page's own localized title and the
  unchanged logo. Open Graph and Twitter summary-large-image metadata match.
  These title cards are not substituted for article content images.
- Service descriptions now end as complete sentences; career metadata is specific.
  FAQ markup is intentionally omitted; no FAQ rich-result promise is made.

## 6. Validation and launch

- [x] Run TypeScript, i18n and focused redirect/metadata/JSON-LD checks.
- [x] Inspect affected desktop/mobile pages in the Codex in-app browser.
- [x] Run Schema.org validation and Google Rich Results Test for supported types.
- [ ] After owner deployment: verify live origin, redirects, crawl directives,
  assets, sitemap, canonical and hreflang URLs.
- [ ] After owner authorization: submit the sitemap and inspect representative
  URLs in Search Console; record results separately from local checks.

Latest local acceptance (October 1, existing port 3021): all 133 canonical pages and image URLs, all 277 configured
permanent redirects (queries and destination anchors preserved), eight fallback
pages, two payment results and 162 genuine unmapped-legacy 404s passed.
All 133 sitemap pages passed the Schema.org vocabulary checker.

Hosted code tests (not deployment/crawl tests): Schema.org reported zero errors
and warnings for Boston Article/Breadcrumb, Expert Opinion Service/Offers, and
Contact/six-office graphs. Google confirmed valid Articles, Breadcrumbs,
Organization and LocalBusiness items. Optional missing author/image and business
fields remain where verified data is unavailable. See [status](status.md) for links.

## References

- [Google site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Google permanent redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
- [Search Console Change of Address scope](https://support.google.com/webmasters/answer/9370220?hl=en)
- [Migration inventory](migration-checklist.md)
- [Implementation evidence](status.md)
- [Google organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google local business markup](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Google article markup](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google language alternates](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google FAQ retirement](https://developers.google.com/search/updates#may-2026)
