# Evaluation content provenance

Imported September 29, 2026 from the local legacy website:

- `en.json`: `americantranslationservice.com/e-evaluation-content.html`
- `zh.json`: `americantranslationservice.com/e-evaluation-content-zh.html`
- `es.json`: `americantranslationservice.com/e-evaluation-content-es.html`

Descriptions come from the corresponding PHP wrappers. Whitespace and markup
were normalized; prose, headings, report descriptions,
related article labels, sample labels, and locale-specific claims were retained
as requested. Application instructions use the homepage’s shared `ProcessStory`
module with Online and Email tabs. Online contains the current four-step flow;
Email retains the source three-step list in `content/application-methods.json`.
Acceptance reminders appear within the selected method. Required documents and
pre-evaluation notes remain in `applicationNotesHtml`. Chinese and Spanish retain
the source WES/ECE comparison, and shipping-policy wording differs. These are
preserved source claims, not newly verified facts or translations of the current
English page. On October 1, 2026, the owner requested replacing the NACES
affiliation wording in the Chinese and Spanish AET promise with a general
description of experienced credential evaluation professionals, consistent with
the existing English wording.

HTML fields contain only reviewed static paragraphs, links, emphasis, lists,
line breaks, and subordinate headings. Bootstrap classes, inline styles,
layout containers, icons, scripts, and event attributes were removed. Do not
place untrusted runtime or user-submitted HTML in these fields.

Evaluation and shipping tables use `PricingTable` and `lib/pricing.ts`; their
amounts are not duplicated here. The legacy pre-evaluation and extra-copy ranges
also live in that shared catalog. `{{documentPrice}}`, `{{extraCopyPrice}}`,
`{{standardDays}}`, and `{{cutoff}}` interpolate shared facts into legacy copy.
Price labels and formatting follow the new Pricing module. Competitor figures
in localized comparison text are not AET catalog rates.

Retained internal links use current local routes and the active interface locale.
References to held articles retain their text without a hyperlink; their content
review remains open. Original external AI-summary links remain supplied.
The application form, two sample reports, and FCE client image were copied unchanged
into `public/` at their existing paths. The client montage is retained only as a
source asset; the owner marked it outdated and requested the homepage
institution selection and shared carousel instead. This import does not reconcile historical
claims or establish that external legacy pages will survive the domain migration.
