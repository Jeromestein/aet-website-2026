# About AET provenance

- `/about`, `/zh/about`, and `/es/about` use one shared page template and typed
  content in `lib/about-content.ts`. English and Chinese derive from the local
  legacy `americantranslationservice.com/e-aboutus-content.html` and
  `e-aboutus-content-zh.html`. Spanish is a new translation of the English source.
- Retained all 11 dated history entries, the 10 in-scope highlights, client-logo
  collection, photo captions, and testimonial/career entry points. Section titles
  and dates preserve the source; short highlight labels organize its original copy.
  The founder introduction repeats the source highlight without asserting that
  AET is a NACES member. Historical approvals remain dated source statements.
- Removed the China Visa/consular-authentication highlight and visa application
  image to follow the established new-site service scope. Omitted the duplicate
  page heading and decorative credential logos; their organization links remain
  in the timeline. No new business metrics, memberships, or endorsements were added.
- `public/images/about/` contains 11 unchanged archival photos and `clients.png`.
  Nine photos come from the legacy translation site's `images/` directory;
  `visit09.jpg` and `news17.jpg` come from the server checkout's root `images/`
  directory (the legacy AET21 assets). `clients.png` comes from
  `americantranslationservice.com/images/homepage/clients.png`.
  The full-resolution Alaska photo replaces its small `case1.jpg` preview.
  All photos use contained, proportional display and link to the local original.
- Office photos and certificates are archival; the page links to Contact for
  current visiting information. Source membership, approval, translation-count,
  client, and office-availability claims have not been independently recertified.
  Production publication review remains separate from this migration.
- The footer links to the localized About route. Legacy `e-aboutus.php`,
  `e-aboutus-zh.php`, `e-aboutus-es.php`, `e_aboutus.html`, and `c_aboutus.html`
  permanently redirect to the matching locale; source section IDs are retained.
  Testimonials link to the localized homepage's existing review section;
  careers link to the new localized `/career` route.
