# AET Interior Page Template Analysis

Local-source review: September 29, 2026.

## Recommendation

Use eight layout families and two purpose-specific pages, assembled from shared
content blocks. This is a design and content recommendation, not an instruction
to build ten independent frameworks. Start with the service family; extract
further abstractions only when the next real page needs them.

The scope is the 20 P0 destinations in the [migration checklist](migration-checklist.md),
the 109 blog article entry points, and supporting content identified by that
checklist. English, Chinese, and Spanish use the same templates. Article retention,
merges, and final routes remain decisions to make during migration.

## Layout families and page coverage

| Family | Legacy pages | Content and layout requirements |
| --- | --- | --- |
| Service detail | `e-evaluation.php`, `e-notarized.php`, `e-tech-translation.php`, `e-interpretation.php`, `e-expert-opinion-letter.php`, `e-translation.php`, `e-nus.php` | Compact introduction and service-specific action; optional section navigation, service/type cards, requirements, process, fees and timing, delivery, samples, language/industry lists, FAQ, related articles, and office contacts. Blocks and order vary by service. |
| Office detail | `e-office-miami.php`, `e-office-boston.php`, `e-office-los-angeles.php`, `e-office-beijing.php` | City introduction, address, hours and time zone, phone/email/messaging channels, directions/map, photographs, local services, and contact action. The four sources already share nearly the same structure. |
| Article detail | Retained editorial content from `/blog/*.php` and standalone English/Chinese articles | Readable article column, optional author/date, section navigation, headings, lists, images/captions, comparison tables, FAQ, source links, and related service actions. Preserve actual authorship and dates; do not invent them for older pages. |
| Article index | `/blog`, `/blog/`, `/blog/index.php`; retained material from `c-articles.html` | One localized index with titles, summaries, and links. Topic grouping and pagination are useful for this inventory; interactive search is optional, not a migration requirement. |
| Company information | `e-aboutus.php`, `e-careers.php` | Shared information-page shell. About uses history, credentials, photographs, clients, and testimonials. Careers uses full-time/part-time groups, role descriptions, location/requirements, and application actions. These are block variants, not identical bodies. |
| Legal document | `e-terms-of-use.php`, `e-privacy-policy.php` | Restrained reading layout with stable section anchors and complete text. No sales-card treatment or mandatory marketing CTA. Preserve source version/date information only where supplied. |
| Institution directory | `e-credential-evaluation-partners.php` | Category navigation, logo/name/description entries, supporting links, and tables where needed. Preserve the distinctions between featured universities, partners, state campuses, and licensing/government/military references. |
| Service fees | `e-fee.php` | Service-group navigation, comparable prices and processing times, rush options, delivery charges, and qualifications. Reuse the same approved fee records and table components as service pages. |

The P0 count is 7 service + 4 office + 1 index + 2 company + 2 legal +
1 institution + 1 fee + Contact + Payment = **20 destinations**. Article detail
is an additional shared template for P1 content, not an additional P0 destination.

## Two purpose-specific pages

- **Contact (`e-contact.php`)**: compose office summaries, a location/anchor index,
  service-request instructions, and contact actions. The source asks customers to
  contact only one office and includes six offices plus other contacts. The four
  footer office links do not establish closure of the other offices. Reuse the
  office data from office detail pages and preserve applicable old anchors.
  The inspected content has no contact form; do not introduce a form workflow
  merely to reproduce this page.
- **Payment (`e-pay.php`)**: payment methods, payer/service/office/amount fields,
  terms consent, validation, and the approved payment handoff. The source posts
  to `pay/process.php`; a new visual form alone is not a working migration.
  Payment integration needs a separate implementation decision and test-mode
  verification. Do not copy private payment configuration into website content.

## What the legacy content shows

### Service pages need flexible blocks

- Evaluation includes four report/service types, requirements, application and
  pre-evaluation actions, fee tables, shipping, report PDFs, and related articles.
  Its old three-step instructions must be reconciled with the new homepage's
  four-step application flow.
- Certified Translation includes document formats, purposes, a document-price
  table, office/email/payment instructions, shipping, geographic/language coverage,
  sample PDFs, and FAQ. Its request flow must remain distinct from credential
  evaluation unless an approved shared flow is established.
- Expert Opinion Letters includes purpose, evidence requirements, fields,
  processing/price tiers, shipping, and related evaluation reading. Do not present
  its old requirements as newly verified guidance.
- Interpretation has its own scenario/rate table, minimum hours, transportation
  qualifications, office routing, booking steps, and customer feedback. It is not
  just an introduction page.
- Technical Translation emphasizes industries, document types, language pairs,
  quality levels, and a quote request. General Translation is shorter, with
  language coverage and pricing instructions. Notarization organizes services by
  act, required materials, locality, and charges.

One service template can cover these differences if sections are optional and
the action destination is a content field, rather than a hardcoded evaluation CTA.
Do not add empty price, sample, or FAQ sections where a source has none.

### Article URLs do not all represent the same editorial format

The local scan resolved included content for all 109 article PHP entry points.
48 contain HTML tables; 108 contain image elements (including supporting imagery,
not necessarily a dedicated cover image); none contain an HTML form. The final
retained article count is not yet determined.

64 filenames begin with Boston, Miami, Los Angeles, New York, or San Francisco
(including one misspelled San Francisco prefix). This is a filename observation,
not a decision to retain 64 independent city landing pages. One is the excluded
Boston visa topic. Representative content shows these useful variants:

- Educational guides, country equivalencies, and licensing topics fit Article.
- Agency comparisons fit Article with reusable comparison tables/cards.
- Short city/service introductions can use the Service layout with local contact
  blocks, or remain Article when the content is genuinely editorial. Do not equate
  a city-service page with an actual office page or invent a local office.
- Chinese interpretation cases can use Article with case sections and imagery;
  a separate case-study template is unnecessary for the first batch.

Course-by-course explanatory content can use the service family or be merged into
Evaluation. Pre-evaluation explanations and additional testimonials can be
consolidated into existing pages as the checklist permits; neither automatically
requires a new template. Root HTML/PHP duplicates need comparison and URL mapping,
not duplicate layouts.

### Shared data will prevent visible contradictions

These examples describe the source, not approved current prices:

- Certified Translation lists a degree certificate starting at $75 / 3 business
  days; Service Fee lists $70 / 5 business days for degree certificates.
- Interpretation's benefits copy says the basic rate starts at $75/hour, while
  its on-site individual-client table starts at $100/hour.
- The fee page still includes China Visa; Notarization links to excluded China
  Consular Authentication; office content also contains removed-service mentions.
- Careers mixes an external Google Form link with position-specific email
  instructions. Confirm active roles and the intended application destination.
- The institutions page contains qualifications about usage and admissions
  requirements. A logo grid alone would lose that meaning.

Maintain approved shared records for fees/timing/delivery, office contact details,
service request destinations, and downloads. Keep localized presentation separate
from common business facts while supporting real service/language differences.

## First template trial

Build **Certified Translation** first. Its real content exercises most service
blocks: introduction, document/use cards, section navigation, a price table,
application steps, delivery, sample downloads, languages, and FAQ.

Suggested composition:

1. Existing navigation, breadcrumb, compact title/intro, and quote/contact action.
2. Section navigation; optional desktop side rail and a compact mobile disclosure.
3. Service explanation and document/use sections.
4. Estimated fees and processing times with the original qualifications.
5. Service-specific application steps and delivery options.
6. Samples, language/area coverage, FAQ, and final contact action.
7. Existing footer.

Use **General Translation** immediately afterward to test that the same template
also works for a short page. Then migrate Evaluation, testing its application
handoff and report comparisons. This tests reuse before expanding to all services.

Suggested next sequence: Office + Contact; Article + Index; company/legal/
institutions/fees. Resolve the payment integration choice in parallel with design
planning; it remains a launch dependency regardless of the page-building order.

Reuse the homepage's palette, typography, buttons, navigation, and footer, with
smaller interior-page headings and tighter reading spacing. Long articles and
legal text should not inherit the homepage's large promotional section scale.
The current navigation/footer components are reusable, but are rendered by the
homepage rather than by the locale layout; establish one consistent shared shell
when adding interior routes. Give each page its own localized metadata.

## Evidence and verification boundary

- [Migration scope](migration-checklist.md) and [blog inventory](migration-blog-inventory.md).
- [Design baseline](design.md), [status](status.md), and [project scope](../README.md).
- Local legacy source: `server-54.213.58.23/americantranslationservice.com/`,
  including the 20 P0 entry points and their content includes.
- Structural scan of all 109 blog includes, plus representative editorial,
  comparison, country, licensing, and city-service content and supporting pages.
- New [homepage](../app/[locale]/page.tsx), [locale layout](../app/[locale]/layout.tsx),
  and shared component inventory.

This review classifies local content and proposes layouts. It does not verify
live website availability, current business facts, legal accuracy, every article's
full factual content, or external application/payment flows. No UI was changed;
no development server, browser verification, production build, push, or deployment
was needed or performed. No migration checklist items were marked complete.
