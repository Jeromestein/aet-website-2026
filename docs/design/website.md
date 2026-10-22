# Website Design Patterns

Read the [shared design guide](README.md) first. This reference owns public-site
composition, fixed copy and responsive behavior. Use the [service template](../service-page-template.md)
for interior pages and [Blog requirements](../blog-requirements.md) for writing.
Application and CRM rules belong in [business UI](business-ui.md).

## Homepage composition and copy

| Order | Section | Requirement |
| --- | --- | --- |
| 1 | Hero | Fixed copy, two service-specific actions, professional photo on pale blue |
| 2 | Services | Foreign Credential Evaluation introduction, benefits, types and other services immediately after Hero |
| 3 | AET at a glance / Why Choose Us | Five facts: experience, language coverage, ATA membership, BBB A+ and five-star Google reviews |
| 4 | Institutions | Two logo rows on pale blue, supporting sentence and directory link |
| 5 | Process | Four numbered online steps, Online/Email methods and prominent orange application action |
| 6 | Pre-evaluation | Graduation image, complete preliminary-assessment explanation and action |
| 7 | Questions | Native disclosures and contact action |
| 8 | Client feedback | Five original testimonials/avatars in a manual carousel |
| 9 | Footer | Practical navigation and legal links; no extra closing application panel |

Preserve the approved English wording; localized pages use corresponding translations:

| Element | Approved copy |
| --- | --- |
| Hero heading | Professional Translation & Evaluation Services |
| Hero description | Professional translations and credential evaluations trusted by USCIS, colleges, and government agencies nationwide. |
| Hero primary | Apply for Credential Evaluation — orange, links to `#process` |
| Hero secondary | Contact for Translation & Other services — navy with white text, localized Contact link |
| Institution heading | Trusted by Leading Institutions |
| Institution introduction | Our credential evaluation services are recognized and accepted by educational institutions, government agencies, and professional organizations across the United States. |
| Below institution logos | Our evaluations are widely accepted by universities, employers, and government agencies nationwide. |
| Directory action | Explore all institutions |

The primary Hero action is “学历评估申请” in Chinese. These service-specific Hero
labels supersede the earlier generic Apply Now / Contact Us pair. The header's
separate Apply Now label remains. Preserve supporting headings such as Why Choose
Us, Other Services and What Our Clients Say, and original testimonial attributions.

End service cards with a compact trust row: transparent BBB A+ artwork left,
Contact Us right and a fine divider. Wrap only when needed on mobile. Do not put
BBB beneath Hero actions or restore a separate badge card/generic closing sentence.

The pre-evaluation homepage section retains its complete legacy introduction,
Instant Assessment / Affordable Service / Professional Guidance items and closing
explanation. Emphasize “Not sure what your foreign degree is equivalent to in the U.S.?”
in pale blue and “We provide:” in bold. Use an orange, text-only
Start Your Pre-Evaluation action without an arrow.

## Header and footer

- Use the full logo, translucent cool-white/blue sticky header, centered desktop
  navigation, separate language selector and orange Apply Now at the far right.
  Its destination is the localized homepage `#process` (Steps for Credential Evaluation).
- Navigation order: Home, Evaluation, Translation, Other Services, Contact, Payment,
  Blog. Translation contains Certified Translation, Technical Translation,
  Interpretation, General Translation. Other Services contains Expert Opinion
  Letters, Notarization, Visa Services, Pricing. Mirror groups on mobile.
- Languages are English, 简体中文 and Español; display EN/中文/ES with a globe and
  selected-language state. Home/logo links stay on the active localized homepage.
  Use maintained destinations; see [routing](../development.md#application-domains-and-staff-urls)
  and [compatibility](../app-url-compatibility.md), not historical link assumptions.
- Use compact desktop spacing at 1201–1392px. At ≤1200px, show the proportional
  logo, compact language selector and circular two-line menu with 44px targets.
  Open a navy viewport panel below the 76px header: numbered rows, expandable
  service groups, Apply Now below navigation, languages at the bottom.
- Let long menus scroll. With JavaScript, lock background scroll/focus; close on
  selection/Escape, restore trigger focus and clear open menus across breakpoints.
  Desktop dropdowns also close on outside interaction or focus leaving them.
  Native disclosures preserve basic access without JavaScript.
- Footer: navy, logo/socials left, three navigation columns right, divider above legal.
  Preserve Top Service, More Services, Popular Links, Office, LinkedIn, Yelp,
  Facebook, Google, Blog, Terms of Use, Privacy Policy and “2009 - Present”.
  On phones, put brand/services above the two-column popular-links/office area;
  all content remains in normal flow with 44px targets. Footer office links are
  Miami, Boston, Los Angeles and Beijing; form office eligibility is a separate rule.
  Use recognizable social-brand icons and omit diagonal arrows throughout the footer.

## Display typography

These extend the shared Poppins body/navigation/heading scale. Use local fonts,
Georgia/serif fallback for Fraunces and cursive fallback for Gaegu.

| Role | Font / weight | Desktop | Mobile |
| --- | --- | --- | --- |
| Process heading | Poppins 600 | 45–86px | 40–55px |
| Process card heading | Poppins 500 | 24–34px | 24–28px |
| At-a-glance heading | Fraunces 600 | 51–101px | 42–59px; tablet 48–77px |
| Short figures (15+, 100+) | Gaegu 700 | 144–240px | 128–192px |
| Four-digit figures (2009) | Gaegu 700 | 101–160px | 88–136px |
| Fact labels | Poppins 600 | 19–26px | About 19px |

Fraunces line height/tracking: 0.98 / -0.055em; process card headings:
1.18 / -0.025em; Gaegu: 0.68–0.8 / -0.09em. Prevent clipping, leave 24–32px
between figures/labels and keep explanations 16px. Widen cards instead of shrinking figures.

## Hero, imagery and service components

- Hero: three heading lines on wide desktops, natural smaller-screen wrapping;
  Chinese uses two balanced lines. Copy may span 680px, supporting text 620px,
  with the desktop paragraph around 510px to avoid the portrait. Grow the section
  instead of shrinking text. Give process introductions 64–104px before content.
- Keep the photo behind Hero copy on every viewport, person toward the right and
  pale-blue gradient strongest behind text/actions. On phones, allow 72px above
  copy and 88px below actions; 20–28px before the paragraph and 28–36px before
  buttons. No fixed mobile height or separate photo block beneath the copy.
- Hero buttons: 8px radius, 54px desktop / 50px mobile height; allow long translated
  text to wrap. Standard promotional Apply Now uses orange/edit icon and Contact
  Us uses outlined blue/phone icon; the service-specific Hero pair follows its
  own navy-secondary rule above. Other actions use blue/text, pale on dark sections.
- Images: education, office and document-review scenes with natural color/subtle
  blue overlays. Keep selected graduation imagery at useful resolution, faces and
  documents in consultation crops, and unrelated school logos unobtrusive. Stock
  people are illustrative, not named staff/clients. Use explicit sizes, responsive
  sources and accurate alt text; never enlarge a thumbnail into a feature image.
- Homepage facts and Evaluation benefits share `BenefitCard`: animated story on
  homepage, compact static cards on Evaluation. Put comparisons in localized tables
  and standalone promises in cards without duplicating source prose.
- Homepage/Evaluation share Online/Email tabs, Online selected. Online explains
  purpose → client information → evaluation type in Services → Status-page upload;
  Email keeps three legacy steps, form PDF and office links. These four explanatory
  steps are distinct from the unified application's three form steps.
  Support keyboard selection and expose both methods without JavaScript.
- Use actual purpose, client, Services and Status-uploader screenshots, proportional
  and fully visible on white; no cropped controls/photo overlays. Distinguish purpose
  (USCIS/employment/education) from evaluation type. Put Start Online Application
  below the introduction, using the currently approved destination.

## Mobile and motion

The shared guide owns focus, touch targets and reduced-motion requirements.
Use about 110px anchor clearance; compact header at ≤1200px and mobile Hero at ≤760px.

- **Peer-card rails at ≤760px:** Services, facts, testimonials, Online steps, report
  types and benefits: 85–90% card width, 16px gap, next-card cue and enough end padding.
  Featured evaluation card stays full width. Native horizontal overflow, `x proximity`
  snap, start alignment, DOM order, keyboard access and labeled controls. Never autoplay
  or capture vertical gestures. No truncation; focused actions scroll into view.

- **Vertical reading:** Hero, forms, document requirements, FAQs, footer and Email
  instructions stay vertical. Online process cards use the numbered manual rail with
  previous/next controls; swiping is never the sole access method.

- **Institution directory:** Four source categories/anchors, search/filter, contained
  logos, names, descriptions and native disclosures for full application/timing notes.
  Use vertical phone results, with complete catalog/links available without JavaScript.
  Inclusion does not guarantee acceptance.

- **Institution carousel:** Shared 16-logo selection from `lib/institutions.ts`, two
  rows of eight moving left-to-right, 72/80-second linear cycles. Evaluation uses its
  own heading/compact layout. No white tiles, borders, shadows or visible pause button;
  pause on hover/focus and hide duplicate groups from assistive tools. Reduced motion
  uses native horizontal scrolling.

- **Carousel dimensions:** Slots 232×112px desktop / 156×88px below 600px; square
  emblems max 80/64px. Contain without cropping. Section padding 72/40px; introduction
  gap 32/24px; row gap 12/8px. Mobile copy 16px/1.6; directory link on its own 44px-high
  line.

- **Client feedback:** Two desktop cards; one 88%-width mobile card plus cue at ≤760px.
  Preserve five reviews/avatars and the second original paragraph for xiao h. Equal
  tallest natural height per viewport, no truncation/slide height jump. Verified Google
  5.0 beside heading links to the owner's Google search. Previous/next and visible range
  above cards, wrapping at either end; no autoplay or undated relative timestamps.

- **Facts:** Above 850px, sticky panel below header with labeled selectors: 65vh per
  fact + one viewport (425vh total), equal intervals over actual sticky travel so the
  last fact has reading time. At 761–850px, unpinned; at ≤760px, manual rail. Reduced
  motion/no JavaScript exposes all facts without pinning.

- **Fact background:** Pale-blue spheres, restrained gold accents, slow drift/scroll or
  swipe response behind content; decorative and non-interactive. Freeze under reduced
  motion.

- **Process:** Desktop sticky imagery and numbered cards, 550–700ms transitions; at
  ≤850px place each image above its description. At ≤760px apply the accessible Online-
  step rail rule.

- **Other motion:** One-time fades: 16–25px / 400–650ms. Buttons: 150–250ms. Card lift:
  ≤3px. Reduced motion removes smooth/continuous movement; content remains readable
  without effects.

## Blog

Specific uses, countries, licensing scenarios and explanatory guides belong in Blog;
core offerings with distinct delivery needs remain service pages. Link related
articles instead of making a service subpage per use case.

Credential evaluation leads the headline, introduction, featured guide and default
list. Translation/interpretation/expert opinions use a quieter secondary selector;
this does not change sitewide service scope. Sort by original publication date,
newest first in every filter, with undated entries last.

Use a readable column, semantic sections, desktop contents and native mobile
contents disclosure. Preserve prose, authorship and dates. Retained legacy bodies
remain English-only without availability notices; the approved CSLB guide has
EN/ZH/ES content. Index translated bodies only with matching canonicals,
alternates and structured data; shared controls stay localized. Describe images
accurately and never present historical reports/reviews as current contacts or ratings.
