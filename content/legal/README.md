# Legal document provenance

Imported September 30, 2026 from the local legacy checkout:
`server-54.213.58.23/americantranslationservice.com/`.

| Route | English source |
| --- | --- |
| `/privacy` | `e-privacy-policy-content.html` |
| `/terms` | `e-terms-of-use-content.html` |

The PHP entry points include these content files. The migration preserves all
12 Privacy sections and 13 Terms sections in their original order, with their
IDs, paragraphs, lists, emphasis and contact email. Only legacy layout wrappers,
inline styles and classes were removed; subsection headings became semantic h3
elements beneath h2 section headings. Whitespace was normalized. No effective
date was supplied by these sources, so none was added.

Per owner direction on September 30, 2026, only English documents are retained.
The imported Spanish copies and Chinese fallback notice were removed; the legacy
source checkout is unchanged. English text remains unmodified.

The shared footer and Payment consent links point to `/privacy` and `/terms`
in every site language. Former Chinese/Spanish routes, English PHP/HTML aliases,
Spanish PHP aliases and the previously broken Chinese PHP links redirect to those
English pages. Legal requests ignore locale detection without changing the saved
site-language cookie, and do not advertise alternate-language versions. The source
section IDs remain valid.

## Review before launch

This migration preserves policy text; it does not certify operational compliance.
The following source statements need owner review against the deployed services:

- Both documents mention PayPal and Stripe. The new website Payment form uses
  the existing PayPal handoff; Stripe use elsewhere has not been verified.
- The source describes five-year document retention, physical archives, cloud
  storage, encryption and security monitoring. The application portal is a
  separate system; its actual controls and retention were not audited here.
- Privacy describes usage collection, service providers and marketing choices.
  Reconcile these with the actual analytics, hosting and email configuration at
  launch, including the website's existing `AET_LOCALE` preference cookie.
- Contact currently provides email/office links rather than an intake form.
  Online application and upload references concern the separate portal.

No policy commitments, refund rules, consent requirements or jurisdiction terms
were rewritten, and no application or payment was submitted during verification.
