# Visa Service provenance

Imported on October 10, 2026 from the sibling `server-54.213.58.23` checkout:

- English: `americantranslationservice.com/e-visaservice-content.html`, included
  by `e-visaservice.php` (the complete page previewed with the owner).
- Chinese: `americantranslationservice.com/e-visaservice-content-zh.html`, included
  by `e-visaservice-zh.php`.

The owner requested the same text with the new website design and a shared Visa
pricing catalog. All nine source sections, headings, requirements, qualifications,
turnaround wording, office text and contact details are preserved. Whitespace,
layout wrappers, inline styles and the old sidebar are not content authority.
The body deliberately does not run through the office-reference replacement
renderer: the explicit verbatim-copy request takes priority over its default
contact updates. In particular, the imported Boston suite is 418; the rest of the
new site's current office catalog uses #419. Source statements are retained copy,
not independently revalidated claims.

The English photo promotion image used by both source locales is transcribed as
accessible text. Its price now reads the same catalog as the photo table.
The China-details link keeps its original destination, made absolute so it does
not become a broken relative link in the new application. That dedicated page
has not been migrated by this change. All telephone targets are retained.

## Prices

`lib/pricing.ts` owns `visaFees`, `visaServiceRates`, `visaExternalRates`, and
`visaPhotoRates`. Content JSON contains named numeric placeholders only; the
renderer preserves the source's currency and per-person wording around them.
`VisaPricing` is reused on the service page and the global Pricing page.
Service structured offers use the same AET rates; government and shipping fees
are not presented as AET service offers.

The source's introductory China price ($75 starting) and Q2/L price ($99 starting)
are intentionally distinct records and labeled separately in the table. This
migration does not reconcile them. Canada's combined $256 charge derives from
its $180 application/biometric fee plus $76 shipping; its AET service fee is
separate. External fees retain the source's USD presentation.

Spanish has translated interface/table labels and a labeled English body fallback,
with noindex and the English canonical until an actual translation is supplied.
English and Chinese are included in the sitemap and have sharing images.

## Verification

`python3 scripts/check-visa.py` checks normalized rendered text against all nine
legacy sections in each locale, the 21 pricing rows on both page types, anchor
integrity, fallback metadata, structured JSON and the four legacy redirects.
Requires BeautifulSoup and an existing preview on port 3021.
