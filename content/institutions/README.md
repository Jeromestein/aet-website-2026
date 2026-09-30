# Institution directory provenance

Source: `server-54.213.58.23/americantranslationservice.com/e-credential-evaluation-partners-content.html`,
read September 30, 2026. Its PHP wrapper is the legacy entry point.

`en.json` retains all 28 source entries (2 featured universities, 18 partner
institutions, 3 state campuses and 5 licensing/government/military references),
including the original English names, descriptions, timing notes, section
descriptions, introduction and closing text. Whitespace is normalized. The four
source section IDs remain unchanged. `zh.json` and `es.json` translate the prose
while retaining institution names, source ordering and record IDs. These files
are rendered through one shared route and directory component.

The page uses a shorter display headline and retains the source title in metadata.
Native disclosures preserve the complete timing notes. All entries render on the
server; search and category controls appear after hydration. Without JavaScript,
the full list, section links and disclosures remain usable.

## Assets

All 17 source image files are copied unchanged into
`public/images/institutions/directory/`. `assets.json` records the legacy path,
local path and SHA-256 digest. Text placeholders are retained where the source
provided no image. No new logos or institutional relationships were invented.

One source pairing is corrected based on the visible artwork: `WCUI.png` says
“Smith Chason College / WCUI School of Medical Imaging,” but the source placed it
under “West Coast University (WCU).” The directory displays that unchanged artwork
under Smith Chason College and uses a WCU text placeholder for West Coast University.
The source institution names and prose are otherwise unchanged.

## Publication review

This is a complete migration of AET's reference page, not an independently
verified directory of current acceptance policies or formal partnerships. Keep
the source qualifications and the explicit requirement to confirm the report type
with the receiving institution. Before publication, review relationship claims,
the NYU/Columbia and CSU admissions dates, licensing/recruitment notes and the
ambiguous Miami Shores description with the owner and authoritative institutions.
No application, contact message or payment was submitted during verification.
