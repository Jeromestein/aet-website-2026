# Blog content and migration

All **80 retained English article bodies are local** as of September 30, 2026:
the original 60, 18 restored blogs and two standalone English pages. Thirty other
findings require a separate decision and one visa topic remains held. The two standalone
pages are outside the original 109-blog inventory. See the
[revised inventory](../../docs/migration-blog-inventory.md).

The index defaults to the 28 credential-evaluation articles. The secondary topic
selector exposes 42 translation, 7 interpretation and 3 expert-opinion articles.
Every card opens a local `/blog/[slug]` route, with localized navigation and index
controls. Article bodies remain English-only, without translation notices.
Chinese and Spanish article routes are noindexed because they share the English
body. No author or publication date is invented.

Article lists sort by original publication date, newest first, across all topics,
filters and searches. `dates.json` stores ISO dates extracted by the importer from
leading source dates/bylines; 46 articles have dates and 34 are undated. Undated
articles follow dated articles, with inventory order preserved for ties. The
featured guide remains an independent editorial selection.

## Source authority

`articles.json` retains the original inventory titles, slugs, classifications and
previously verified legacy paths. Each PHP entry's actual HTML include is the
body authority. For the two rows marked `sourceType: standalone`, the root HTML
file is the body authority; no PHP entry is invented. The include, PHP entry and existing same-stem root HTML are
rescanned against the documented selection aliases before import. Reviewed
biography occurrences are allowed only against matching source hashes in
`biography-review.json`; their prose and associated NACES links remain intact. Root copies
are not silently merged into an include that has different content.

`posts/*.json` holds the 79 imported bodies as sanitized semantic HTML and contents
entries. The Boston pilot remains in
`boston-foreign-credential-evaluation-services.en.json`, with its original layout.
`titles.json` supplies body-heading titles to cards, consistent with the article
H1; original PHP metadata is not substituted for a newer body heading. In
particular, H1B metadata says 2025 while the source heading and displayed date say
2026. The body heading is used without inventing a new publication date.

`migration-report.json` records each imported source, SHA-256 digest, normalized
prose digest, image/table counts, removed page controls and title discrepancies.
All source prose remains in order, including dates, emphasis, lists and tables.
Formatting changes split legacy line-break paragraphs, promote title-like lines
in older unstructured articles, and replace old styling with the shared template.
The old duplicate contents tables, AI sharing controls, spacer elements, scripts,
styles and decorative separator lines are not article prose and are omitted.

## Assets and links

The 79 imported articles retain **191 image placements from 93 source files** in
`public/images/blog/legacy/`, copied byte-for-byte. The pilot retains its existing
two image paths. Image descriptions were checked against source-image contact
sheets; generic legacy “Office” labels were corrected for reports, certificates,
event photographs, promotional illustrations and review screenshots.

Historical reports, certificates, ratings and promotional captures are available
through native disclosures. Their captions distinguish historical information
from current figures. Normal article images remain inline. Source image links
remain usable without enclosing the disclosure control in an interactive link.
Tables scroll within their container on narrow screens.

Known service and office links now target the appropriate local service or
Contact section, preserving the active interface locale. References to held or
excluded articles retain their text without a hyperlink; no excluded article
content is imported or merged. The October 1 follow-up removes the remaining
old-host body links and uses the shared `lib/content-links.ts` renderer. External
reference links and the separate application portal keep their destinations.
Run `python3 scripts/check-content-links.py --url http://localhost:3021` after
imports to detect old URLs, wrong-language destinations or broken fragments.

`redirects.json` maps 78 PHP entries, their 77 root HTML aliases and two standalone
root HTML sources to 80 local article routes: **157 permanent redirects**, preserving query strings
and source fragments where present. These redirects only affect the new app;
the old production source files are unchanged. `/blog/` and `/blog/index.php`
continue to normalize to `/blog`.

The missing legacy `/images/A2Z.png` appears in the California and San Francisco
lists. Its local file is absent and its old-site URL returned homepage HTML during
migration. Those two image placements are omitted, with prose and links preserved;
`migration-report.json` records the missing asset. Ten malformed `#q1.html`
fragments were repaired to existing `#q1` anchors. One duplicate `q2` ID in the
standalone H1B guide became `q2-2`, preserving the original first anchor. Relative contact, translation
and application-PDF links now resolve to known destinations.

## Repeatable verification

The offline importer requires Python with `beautifulsoup4`, `lxml` and `Pillow`.
It reads the sibling legacy checkout and never executes PHP or downloads assets.

```sh
python3 scripts/migrate-blog.py --check
python3 scripts/check-blog.py --url http://localhost:3021
pnpm typecheck
pnpm check:i18n
```

Without `--check`, the importer regenerates the 79 post files, image copies,
server-only import registry, display titles, redirect map and provenance report.
Review source changes before rerunning it; it deliberately stops on unreviewed source
matches, lost prose/images/tables or broken source fragments. The independent
checker validates the generated HTML, source-prose digests, image/table counts,
IDs, fragments and file paths. HTTP verification covers all 240 locale/article
routes, 95 image paths, all 157 redirects and unknown/excluded/held slug 404s.

On September 30, the existing port-3021 preview had stale redirect startup config.
Route/image checks passed there with `--skip-redirects`; all 157 redirects were
verified separately on a freshly started temporary port-3022 server, now stopped.
Restart the normal preview to load its expanded redirect configuration. Separate
HTTP reports are under `output/playwright/blog-*verification.json`.

Visual checks cover the shared desktop and mobile layouts, all four topics,
contents navigation, local card links, historical image disclosures and wide-table
scrolling. Results and screenshots are recorded in `docs/status.md`.

## Publication review still open

The migration preserves the owner's existing source wording; it does not certify
that dated fees, processing times, office facts, memberships, ratings or
immigration-related statements are current. These remain publication-review
items in the main checklist. No production build, deployment or payment action
is part of this migration.
