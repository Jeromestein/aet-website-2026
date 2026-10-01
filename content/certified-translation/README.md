# Certified Translation content provenance

Imported September 29, 2026 from the local legacy website at
`server-54.213.58.23/americantranslationservice.com/`:

- `en.json`: `e-notarized-content.html` and `e-notarized.php` metadata.
- `zh.json`: `e-notarized-content-zh.html` and `e-notarized-zh.php` metadata.
- `es.json`: `e-notarized-content-es.html` and `e-notarized-es.php` metadata.

Definitions, formats, uses, benefits, application instructions, coverage, languages,
and all four FAQ answers retain each source's wording after whitespace and markup
normalization. Source statements about acceptance, notarization, PDF/paper formats,
ATA membership, experience and office coverage are retained historical claims,
not newly verified business or legal guidance. Retained internal links use current local routes
and the active interface locale. The source's commented online application is omitted;
the page uses its active choose-office, email-documents, and payment instructions.

## Shared catalog exceptions

Pricing and shipping use `PricingTable` and `lib/pricing.ts`, matching the new
Pricing page. No AET amounts or turnaround values are duplicated in this content.
The older degree $75, transcript $100, birth $90 and marriage $90 estimates are
replaced by shared starting rates $70, $80, $80 and $80. The shared catalog also
includes the PDF copy row. Source quote qualifications, extra-copy mailing-fee
exclusion, general-translation link and shipping policy are retained outside tables.

## Static markup and assets

Allowed markup: paragraphs, links, bold/emphasis, line breaks, h3, lists and images.
Removed Bootstrap/layout wrappers, inline styles, event attributes, scripts and
comments. Link targets use localized internal routes, external references or local downloads. Blank-target
links use noopener/noreferrer; images have dimensions, alternative text and lazy
loading. This renderer must never accept user-submitted HTML.

Three sample PDFs are unchanged copies in `public/down/`:
`BachelorDegreeCertificate.pdf`, `MarriageCertificate.pdf`, `BirthCertificate.pdf`.
`public/images/USAMAP.png` is copied unchanged; legacy `images/ata.jpg` is copied
as `public/images/certified-ata.jpg` to preserve the existing homepage image.
All five local served files were checked against the originals byte-for-byte.
