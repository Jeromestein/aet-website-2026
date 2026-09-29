# Asset and content provenance

Source: `/Users/plusone/Desktop/Code/server-54.213.58.23/americantranslationservice.com/` (existing AET website).

Evaluation additions (September 29, 2026): `public/down/applicationform.pdf`,
`public/evaluation_report.pdf`, `public/cbcevaluation_report.pdf`, and
`public/images/FCE-Clients.jpg` are unchanged copies of the same legacy paths.
The client image retains its 948 × 810 dimensions and artwork. Source checksums
match all four files served locally. Institution references remain source claims,
not new endorsements. Text provenance is in
[content/evaluation/README.md](content/evaluation/README.md).

| New asset                   | Original asset                 |
| --------------------------- | ------------------------------ |
| public/images/aet-logo.png  | images/e_logo.png              |
| public/images/hero.webp     | images/asian_women_lgtm.webp   |
| public/images/graduates.jpg | images/Graduation-Students.jpg |
| public/images/ata.jpg       | images/ata2.jpg                |
| public/images/bbb.jpg       | images/BBB2.jpg                |

Service descriptions and FAQs are adapted from the existing homepage and its linked service descriptions. All five client testimonials come from `home-content.html`; at the owner’s request, xiao h uses only the second original paragraph as an excerpt, while the other four reviews remain complete. Undated relative timestamps are omitted. Experience, language coverage, ATA membership and BBB imagery originate from the existing site; they have not been independently recertified. No new institutional endorsements or review counts are introduced.

The hero photograph is used illustratively; no identity or employment relationship is asserted. All photos remain local. Interface icons use lucide-react (ISC license).

## Licensed stock photography

- `public/images/document-consultation.jpg`: "Two Women Looking at Files in the Office" by Mizuno K, [Pexels photo 12903274](https://www.pexels.com/photo/two-women-looking-at-files-in-the-office-12903274/). Downloaded September 23, 2026 at 1600 px width under the [Pexels License](https://www.pexels.com/license/). Former process illustration, retained as an unused asset after replacement with application screenshots. The people are not identified as AET employees or clients.
- The existing `graduates.jpg` remains in use at the user's request.

## Online application screenshots — September 28, 2026

Captured directly in the Codex in-app browser from
https://app.americantranslationservice.com/credential-evaluation-application.
The PNGs under `public/images/application/` are cropped screenshots, with no
recreated interface or altered form content:

- `application-purpose.png`: expanded purpose menu (labeled Service Type in the
  source app) and sample-report links. Renamed from `evaluation-type.png` to
  distinguish purpose from report type.
- `client-information.png`: application title, progress stages, and empty client form.
- `service-selection.png`: live Services-step screenshot showing Document-by-Document,
  Course-by-Course, and Expert Opinion Letter. Reached with fictional demo data;
  no application was submitted. The screenshot contains no applicant details.
- `document-upload.png`: cropped from the owner's supplied September 28 status-page
  screenshot. Includes only the file chooser, drop area, upload guidance, and Upload
  Files button; excludes the browser URL, application ID, and existing file list.
- `office-selection.png`: retained unused; office selection is not document submission.

No real personal data was entered, no files were uploaded, and no application was
submitted. Placeholder examples belong to the live form. Automated approval blocked
further reading of the individual status record, so the upload image uses the
owner-supplied screenshot instead of a new capture of that record.

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

## Hero BBB artwork refinement — September 28, 2026

`public/images/bbb-hero-transparent.png` is a transparent 2172 x 724 PNG edited
from `public/images/bbb.jpg` with the built-in imagegen tool. The original remains
unchanged and is still available elsewhere on the page. The Hero derivative removes
the white tile and filled badge background, retaining the BBB torch/lettering and
“A+ Rating” in a compact navy lockup. This is an AI-edited presentation derivative,
not newly supplied official BBB artwork or an independent verification of the rating.
CSS frames the transparent margins without changing the saved pixels.

Prompt: Edit the existing BBB A+ Rating badge into a transparent horizontal trust
mark for a pale-blue Hero. Preserve the BBB torch, lettering, SM and proportions;
remove the surrounding border and white/navy backplates. Place the exact text
“A+ Rating” in navy beside a thin separator. No additional words, stars, shields,
certification claims, shadows, gradients, or mockup background.

## Client testimonial carousel — September 28, 2026

The five avatars in `public/images/testimonials/` are unchanged copies of the
legacy `images/testimonials/` files: `xiao_h.png`,
`North-American-Economic-Herald.png`, `Andrew-Ryan.png`, `Nicole Truong.png`
(renamed `Nicole-Truong.png`), and `Niva-E.png`. Names, five-star ratings, and
review text in `components/testimonials.json` come from the same
legacy homepage. These are existing reviews, not a newly fetched review feed.

Google rating checked September 28, 2026 in the owner-provided Google search:
[American Education and Translation Services (AET), Florida](https://www.google.com/search?q=american+education+and+translation+services+%28aet%29+florida).
The business panel displayed 5.0 out of 5 (209 reviews at the time of checking).
The section displays the score without a hard-coded review count and links to
that search with tracking parameters removed. This rating is a verified snapshot,
not an automatically updating feed.

## Footer social icons — September 28, 2026

`components/social-icon.tsx` contains the LinkedIn, Yelp, Facebook, and Google
brand outlines from the legacy site's `font-awesome-4.7.0/fonts/fontawesome-webfont.svg`
(glyphs F08C, F1E9, F082, F1A0). Font Awesome 4.7 font artwork is by Dave Gandy
and licensed under SIL OFL 1.1: https://fontawesome.com/v4/license/. The outlines
are rendered as monochrome SVGs beside the existing platform labels. Brand names
and marks remain the property of their owners.

## Transparent browser icons — September 28, 2026

`public/brand/aet-browser-icon-transparent.png` is a background-removal derivative
of the owner-selected `aet-browser-icon-source.png`, produced with built-in imagegen.
Prompt: Remove only the white background, including enclosed white gaps; preserve
the full blue United States silhouette, red A, navy/gold road, outlines, colors,
and proportions. Use genuine transparent alpha, no shadow or new content.

The original source is retained. Proportional exports with transparent square
canvases replace `app/icon.png`, the 16/32/48px frames in `app/favicon.ico`, and
`public/brand/aet-icon-{16,32,48,192,512}.png`. The separate Apple touch icon retains
its white background. This supersedes the browser/manifest white-canvas export
described above; header/footer lockups are unchanged.

## Restored legacy logo wording — September 28, 2026

Header/footer SVG wordmarks now reproduce the owner-provided legacy logo text:
“American Education and” / “Translation Services,CORP (AET)”. The original
embedded emblem, 520:120 canvas, transparent background, and light/dark colors
are retained. Poppins Semibold glyphs are exported as vector outlines from the
local licensed font; matching PNG exports remain 1560 x 360. No AI regeneration
was used for this text correction. Image alternative text includes the full name.

Logo readability follow-up: enlarged the outlined wordmark by 7.5%, moved its
start from x=158 to x=132, and proportionally reduced the embedded emblem to
120 x 88 within the unchanged 520 x 120 canvas. Full wording and colors remain
unchanged; synchronized the transparent 1560 x 360 PNG exports.

## Certified Translation additions — September 29, 2026

Unchanged files copied from the local legacy site: `down/BachelorDegreeCertificate.pdf`,
`down/MarriageCertificate.pdf`, `down/BirthCertificate.pdf`, and `images/USAMAP.png`,
under the same `public/` paths. Legacy `images/ata.jpg` is saved as
`public/images/certified-ata.jpg`; the existing homepage ATA asset is unchanged.
All five served files match their source bytes. Source map and ATA links remain.
See `content/certified-translation/README.md` for content provenance.
