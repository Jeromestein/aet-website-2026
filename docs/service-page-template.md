# Service Page Template

Use Evaluation as the implementation reference and Certified Translation as the
second service. This is a composition guide, not a requirement to copy every section.
[Design](design.md) owns visual rules; [status](status.md) records completed checks.
[Migration checklist](migration-checklist.md) owns route and launch scope.

## Source and content authority

- Read each locale's legacy content and wrapper before implementation. Preserve
  source prose, qualifications, samples, and real differences between locales.
- Shared `lib/pricing.ts` records own AET prices, turnaround, and shipping. Do not
  copy stale prices into content JSON. Record replaced values in provenance notes.
- User-approved replacements override legacy content: Evaluation's institution
  montage is replaced by the homepage's shared institution selection.
- Document historical claims as source claims, not newly verified business facts.
  Remove legacy scripts, inline styles, layout markup, and commented-out workflows.
- Static HTML must be reviewed and restricted to allowed semantic markup. Never
  insert user-submitted HTML through the legacy-copy renderer.

## Page composition

Required: localized metadata and H1, shared navigation/footer, breadcrumb, service
introduction, relevant service action, and readable content. Add a section index
for long pages. Preserve useful legacy anchor IDs.

Optional blocks, selected and ordered by actual service content:

1. Definition, formats, uses, and requirements.
2. Service/type cards or benefits.
3. Shared pricing and turnaround with source qualifications.
4. Service-specific application instructions.
5. Shipping disclosure, downloads/samples, coverage/languages, FAQ.
6. Institutions only where relevant and approved.

Do not add empty blocks or turn every paragraph into a card. Do not attach the
credential-evaluation application to translation or interpretation pages.
Certified Translation uses the source office/email/payment steps; its commented
online application link is not an active workflow.

## Reusable implementation

| Module | Usage |
| --- | --- |
| `components/service/service-page.tsx` | Shared service header, breadcrumb, section index, navigation/footer and reviewed copy renderer |
| `components/service/service-page.module.css` | Interior-page layout, cards, disclosures, content and responsive styles |
| `components/card-rail.tsx` | Peer cards with native scrolling, position and previous/next buttons |
| `components/benefit-card.tsx` | Homepage/story and compact service benefits |
| `components/pricing/pricing-table.tsx` | Price and shipping presentation from shared catalog records |
| `components/scroll-stories.tsx` / `ProcessStory` | Credential Evaluation's Online/Email methods only |
| `components/institution-carousel.tsx` | Shared institution presentation and configured selection |

Keep locale content in `content/<service>/{en,zh,es}.json` with a provenance README.
Prefer optional components over a large configuration engine. Extract only when
actual pages share behavior; keep business workflows service-specific.
When a legacy locale does not exist, use a visibly labeled source-language
fallback and exclude that route from indexing until translated; do not invent
legacy-localized prose.

## Mobile requirements

At 760px and below, multiple peer cards in a section use `CardRail`, including
online steps, report types, benefits, and translation application cards. Show
about 88% card width plus the next-card cue. Preserve numbered order; provide
44px controls, a counter, native touch/keyboard scroll and reduced-motion support.
A single card stays full width. Do not truncate copy or hide the final action.

Continuous explanations, document requirements, and Email instruction lists can
remain vertical. Price/shipping tables retain their existing responsive treatment;
comparison tables scroll within their container. FAQ uses native disclosure.
No page-wide horizontal overflow. Desktop layouts remain independent of rails.

## Verification and delivery

- Compare imported text with all three sources; explicitly document exceptions.
- Verify shared prices, destinations, downloads, legacy redirects and anchors.
- Check desktop and 390px mobile in the in-app browser; check long locales at
  320px. Exercise first/next/last cards, disabled end controls and tab switching.
- Open shipping and FAQ; test language changes retain the page; inspect images.
- Regress affected shared components on Evaluation/homepage as appropriate.
- Run `pnpm typecheck`, `pnpm check:i18n`, and `git diff --check`. No production build.
- Reuse port 3021. Follow repository rules for restarts; don't stop the owner's server.
- Update status and provenance with actual evidence. Commit/push only when asked.
