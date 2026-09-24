# Asset and content provenance

Source: `/Users/plusone/Desktop/Code/server-54.213.58.23/americantranslationservice.com/` (existing AET website).

| New asset                   | Original asset                 |
| --------------------------- | ------------------------------ |
| public/images/aet-logo.png  | images/e_logo.png              |
| public/images/hero.webp     | images/asian_women_lgtm.webp   |
| public/images/graduates.jpg | images/Graduation-Students.jpg |
| public/images/ata.jpg       | images/ata2.jpg                |
| public/images/bbb.jpg       | images/BBB2.jpg                |

Service descriptions and FAQs are adapted from the existing homepage and its linked service descriptions. Nicole Truong and Niva E testimonials are reproduced from `home-content.html` with typographic punctuation changes. Experience, language coverage, ATA membership and BBB imagery originate from the existing site; they have not been independently recertified. No new institutional endorsements or review counts are introduced.

The hero photograph is used illustratively; no identity or employment relationship is asserted. All photos remain local. Interface icons use lucide-react (ISC license).

## Licensed stock photography

- `public/images/document-consultation.jpg`: "Two Women Looking at Files in the Office" by Mizuno K, [Pexels photo 12903274](https://www.pexels.com/photo/two-women-looking-at-files-in-the-office-12903274/). Downloaded September 23, 2026 at 1600 px width. Used in the document submission step under the [Pexels License](https://www.pexels.com/license/). Illustrative stock photography; the people are not identified as AET employees or clients.
- The existing `graduates.jpg` remains in use at the user's request.

## Typography

Poppins (400, 500, 600, 700), Fraunces (600, 700), and Gaegu (700) match the IRFC theme font families. Latin WOFF2 subsets are hosted in `public/fonts/`, sourced from Google Fonts on September 23, 2026. SIL Open Font License texts are included alongside the fonts. The page no longer relies on a remote CSS import to load fonts.

## Institution carousel

The 16 logos in `public/images/institutions/` are copied unchanged from the legacy homepage section in `home-content.html`, preserving its institution names and recognition copy. They are displayed in two rows of eight. This reuse does not independently verify or expand the legacy relationship claims.

| Local filename | Legacy source |
| --- | --- |
| SNU.png | `/images/SNU.png` |
| OHSBE.png | `/images/OHSBE.png` |
| NIH-logo.jpg.webp | `/images/NIH-logo.jpg.webp` |
| uoalegal.jpeg | `/images/trusted_by_institutions/uoalegal.jpeg` |
| California-state-board-of-PHARMACY.png | `/images/partner-logo/California-state-board-of-PHARMACY.png` |
| Angelo-State-University.png | `/images/partner-logo/Angelo-State-University.png` |
| GCU.png | `/images/partner-logo/GCU.png` |
| FLORIDA-LEGAL-GROUP.png | `/images/partner-logo/FLORIDA-LEGAL-GROUP.png` |
| NYC-FIRE-DEPARTMENT.png | `/images/partner-logo/NYC-FIRE-DEPARTMENT.png` |
| ISBE.png | `/images/trusted_by_institutions/ISBE.png` |
| USC.png | `/images/partner-logo/USC.png` |
| NMPED.png | `/images/trusted_by_institutions/NMPED.png` |
| ALEX-LAW.png | `/images/partner-logo/ALEX-LAW.png` |
| COLLIER-SHERIFF.png | `/images/partner-logo/COLLIER-SHERIFF.png` |
| Universal_Technical_Institute_Logo.jpg | `/images/Universal_Technical_Institute_Logo.jpg` |
| SCC-WCUI.png | `/images/SCC-WCUI.png` |

## AET logo family

Created September 23, 2026 from the owner-supplied `aet-app/public/web-app-manifest-512x512.png`. The original file is unchanged. The full emblem and compact monogram were generated with the built-in imagegen tool, then exported at web sizes. Horizontal lockups pair the emblem with outlined Poppins Semibold lettering. SVG files embed the raster emblem; they are not fully vector. PNG exports retain transparency.

Assets live in `public/brand/`. Next.js icon files are `app/favicon.ico`, `app/icon.png`, and `app/apple-icon.png`; `public/site.webmanifest` declares the 192px and 512px icons. Prompt specifications are retained in `public/brand/GENERATION.md`.

Browser and application icon update (September 23, 2026): the owner selected the full-map artwork supplied as `codex-clipboard-6c35dfb9-f79d-4d2f-98e6-5e2140b2c6fd.png`. An unchanged copy is stored as `public/brand/aet-browser-icon-source.png`. All active favicon, Apple touch, and manifest icons are proportional exports of this artwork on a square white canvas. The generated compact monogram is retained only as an unused source asset. Header and footer artwork is unchanged.
