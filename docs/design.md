# AET Website Design

Design baseline for the American Education and Translation Services homepage.
These are target rules; implementation and verification progress are tracked separately.

## 1. Brand and Content

AET should feel professional, clear, reliable, and approachable. Use generous
space, readable service information, and obvious application/contact actions.
The project rebuilds the homepage only; other services remain linked destinations.

Preserve existing AET wording, named services, testimonials, and factual claims.
Do not substitute aspirational slogans, invent metrics, or change fees, processing
times, membership dates, ratings, or acceptance statements during visual work.
Distinguish a preliminary assessment from a formal credential evaluation.

**Hero heading:** Professional Translation & Evaluation Services

**Hero description:** Professional translations and credential evaluations trusted
by USCIS, colleges, and government agencies nationwide.

**Hero actions:** Apply Now · Contact Us. Preserve these exact labels and show
BBB A+ Rating artwork below the actions. Adjust line breaks without changing words.

**Institution heading:** Trusted by Leading Institutions

**Institution description:** Our credential evaluation services are recognized and
accepted by educational institutions, government agencies, and professional
organizations across the United States.

**Below the logos:** Our evaluations are widely accepted by universities, employers,
and government agencies nationwide. Keep this sentence with **Explore all institutions**.

Use the existing service names: Foreign Credential Evaluation; Document by Document
Evaluation; Course by Course Evaluation; Expert Opinion Letters; Pre-Evaluation
Services; Certified Translation; Interpretation; Technical Translation;
General Translation; Notarization. Exclude Visa Services, Editing/Proofreading,
and China Consular Authentication from navigation, service cards, and footer
links, following the service scope in README.md.
Retain original supporting headings such as Why Choose Us, Other Services, and
What Our Clients Say where applicable. Preserve original descriptions and testimonial
attributions; shorten only when meaning and qualifications remain intact.

**Pre-evaluation:** preserve the complete legacy introduction, all three
“We provide:” items (Instant Assessment, Affordable Service, Professional Guidance),
and the closing explanation. Emphasize “Not sure what your foreign degree is
equivalent to in the U.S.?” as a separate prominent question and “We provide:”
as a bold subheading. Use pale blue for the question and an orange, text-only
Start Your Pre-Evaluation button without an arrow. Keep the wording unchanged
when adjusting the layout.

## 2. Logo and Color

### Logo

| Placement | Asset under `public/brand/` | Display rule |
| --- | --- | --- |
| Light header | `aet-logo-header.svg` | 300px wide on desktop, 202–220px on phones |
| Navy footer | `aet-logo-footer.svg` | Up to 280px wide, contained by its column |
| Standalone emblem | `aet-emblem.png` | Larger brand placements |
| Browser and application icons | `aet-icon-16/32/48/192/512.png` | Exported from `aet-browser-icon-source.png` |

Header/footer lockups use the refreshed emblem and outlined Poppins Semibold text,
with a 520:120 ratio. They contain a raster emblem and vector lettering, not fully
vector artwork. Transparent PNG exports are also available.
Preserve the complete legacy wordmark, including its company suffix, on two lines:
“American Education and” and “Translation Services,CORP (AET)”. Do not omit CORP
or the parenthesized AET from the logo; use the same full wording in its image alt text.

Browser icons use the owner-selected **full United States map, red A, and road**
on transparent square canvases, without a white tile. The favicon contains
16/32/48px frames. Preserve proportions and transparent margins. The separate
180px Apple touch icon retains its opaque white canvas for home-screen use.

Do not recolor, stretch, rotate, add shadows, or apply blend modes to AET logos.
Keep clear space of at least one quarter of the emblem height. Header/footer artwork
stays transparent without a white tile. Retain the original sources and masters.

### Palette

Shared tokens are defined once in `app/globals.css`.

| Token | Value | Role |
| --- | --- | --- |
| `--paper` | `#F8FBFE` | Cool-white page background |
| `--blue` | `#EAF4FC` | Hero, institution section, pale-blue surfaces |
| `--surface` | `#FFFFFF` | Cards and light text on dark surfaces |
| `--ink` | `#18334E` | Primary text, navy sections, blue-button hover |
| `--muted` | `#5B6D7E` | Secondary text on light surfaces |
| `--action-blue` | `#284F75` | Standard buttons, outlined actions, metrics |
| `--accent` | `#507FA6` | Supporting graphics and decorative accents |
| `--line` | `#D9E5EF` | Subtle borders and dividers |
| `--footer` | `#142E45` | Footer background |
| `--orange` | `#C7471D` | Apply Now and restrained action emphasis |
| `--orange-hover` | `#A93816` | Apply Now hover |

Let pale blue and cool white dominate; use navy sections for contrast and orange
for the application action. White text on the orange button has about 4.83:1 contrast.
Use shared tokens for flat surfaces, text, and controls; related blue tints may serve
gradients and overlays. Logo red/gold stay in the artwork; gold rating stars may remain.

## 3. Typography and Spacing

Use a generous editorial scale rather than preserving the current compact layout.
Host fonts locally with `font-display: swap`; keep licenses with the assets.
Sizes below are targets in CSS pixels at a default 16px root. Implement fluid sizes
with rem-based limits, without reducing the root font size.

| Role | Typeface / weight | Desktop | Mobile |
| --- | --- | --- | --- |
| Body and service descriptions | Poppins 400 | 16–19px; line height 1.7–1.8 | 16px |
| Navigation and buttons | Poppins 600 | 15–16px | 14–16px |
| Hero | Poppins 600 | 61–102px | 44–64px |
| Standard section headings | Poppins 600 | 34–72px | 32–48px |
| Process section heading | Poppins 600 | 45–86px | 40–55px |
| Process card headings | Poppins 500 | 24–34px | 24–28px |
| At-a-glance heading | Fraunces 600 | 51–101px | 42–59px; tablet 48–77px |
| Short figures: 15+, 100+ | Gaegu 700 | 144–240px | 128–192px |
| Wider figures: 2009 | Gaegu 700 | 101–160px | 88–136px |
| Fact labels | Poppins 600 | 19–26px | About 19px |
| Short section labels | Poppins 600 | 12–14px | 12px |

Use heading line heights around 1.0–1.15 and restrained negative tracking
(-0.035em to -0.045em). Fraunces uses about 0.98 and -0.055em; process card titles
use 1.18 and -0.025em. Gaegu uses 0.68–0.8 with -0.09em tracking and enough clearance
to avoid clipping. Leave 24–32px between figures and labels; explanations stay 16px.

Keep paragraphs around 45–65 characters wide. Reserve uppercase for short labels.
Use Arial/sans-serif, Georgia/serif, and cursive fallbacks respectively; future
non-Latin pages need suitable fallback fonts and independent layout checks.

| Layout element | Desktop | Mobile |
| --- | --- | --- |
| Main content | Maximum 1280px; about 56px side gutters | 20px gutters; 16px at very narrow widths |
| Section spacing | 96–120px vertically | 56–72px vertically |
| Header height | 86px | 76px |
| Card gaps / padding | 24–28px / 32–48px | 16–20px / 24–32px |
| Card / large panel corners | 24–30px / 30–40px | 22–26px / 24–30px |

Give headings 24–32px before supporting copy and sections 48–72px before their
main content; process introductions may use 64–104px. Hero copy can reach 680px
wide and its paragraph 620px. Let the fixed title wrap and the section grow rather
than reducing the scale. On mobile, leave 20–28px before the paragraph and 28–36px
before actions. Give large figures enough card width rather than shrinking them
to preserve a multi-column layout.

Use a compact Hero with three title lines on wide desktops and natural wrapping
on smaller screens. Keep the desktop paragraph within about 510px so it stays
clear of the portrait. The photo sits behind the Hero on every viewport, including
mobile; never place it as a separate block below the copy. Position the person
toward the right, with a pale-blue gradient strongest beneath text and actions.
Let content determine the height on mobile and when text is enlarged.

## 4. Homepage Composition

| Order | Section | Core requirement |
| --- | --- | --- |
| 1 | Hero | Fixed text, two actions, BBB artwork, professional photo on pale blue |
| 2 | Services | Foreign Credential Evaluation introduction, benefits, evaluation types, and other services immediately after Hero |
| 3 | AET at a glance | Fraunces heading, five organic fact panels for experience, language coverage, ATA membership, BBB A+, and five-star Google reviews |
| 4 | Institutions | Two logo rows after Why Choose Us, pale-blue background, supporting sentence and link |
| 5 | Process | Three numbered steps: choose an evaluation type, complete the application, submit documents to an office; prominent orange Start Application action below the introduction |
| 6 | Pre-evaluation | Graduation image, preliminary-assessment explanation and action |
| 7 | Questions | Native expandable questions and contact action |
| 8 | Client feedback | Five original testimonials and avatars in a manual carousel immediately after Questions and before the footer |
| 9 | Footer | Practical navigation and legal links |

Omit the standalone closing Start Application panel and the service-card footer
strip containing “Translation and evaluation services.” and Contact Us.

**Header:** full AET logo, a translucent cool-white/blue sticky bar, centered desktop
navigation, a separate language selector, and an orange Online Application button
at the far right linking to the existing credential-evaluation application.
Keep the legacy labels and order:
Home, Evaluation, Services, Contact, Payment, Blog. Services contains the six
retained service links listed in README.md; languages are English, 中文, and Español. Home stays on the
rebuilt homepage; other destinations retain the legacy paths.

At 1200px and below, show only the logo and one circular two-line menu button.
Open a navy panel filling the viewport below the 76px header, with numbered
navigation rows, an expandable Services list, an Online Application button below
the navigation, and language choices at the bottom.
The panel scrolls when content exceeds the viewport. With JavaScript, lock background
scrolling and focus while open; close on selection or Escape, restore trigger focus,
and clear open menus when crossing the desktop breakpoint. Native disclosures
preserve basic menu access without JavaScript. Desktop dropdowns close on Escape,
outside interaction, or moving keyboard focus away.

**Footer:** uses an IRFC-inspired navy layout with the AET logo and social links at
left, three navigation columns at right, and a thin divider above the legal row.
Preserve the legacy footer labels and destinations: Top Service, More Services,
Popular Links, Office, LinkedIn, Yelp, Facebook, Google, Blog, Terms of Use, and
Privacy Policy. Keep the original 2009 - Present copyright wording. On mobile,
place the brand and services above the two-column popular-links/office area; keep
all content visible in normal flow with at least 44px link targets. Show only Miami,
Boston, Los Angeles, and Beijing in the footer office list. Use recognizable brand
icons beside the social-link labels, and omit diagonal arrows throughout the footer.

**Actions:** orange Apply Now with edit icon; outlined blue Contact Us with phone icon.
Other actions use blue or text links; dark sections use pale buttons. Hero buttons
retain an 8px radius and 54px desktop / 50px mobile height. Provide at least 44px
interactive targets, visible focus/hover/active states, and real destinations.

**Images:** use education, office, and document-review scenes. Retain the selected
graduation image and its resolution. Keep faces and documents in consultation crops;
avoid prominent unrelated school logos. Stock people are illustrative, not identified
as AET staff or clients. Use natural color, subtle blue overlays, explicit image sizes,
responsive sources, and meaningful alt text. Never stretch a thumbnail into a large panel.

The process section uses actual screenshots of the online application: Service Type,
Client Information, and Office selection. Keep screenshots proportional and fully
visible on a white surface, without photographic overlays or cropped form controls.

**Surfaces:** soft shadows, rounded cards, generous space; subtle circles and organic
shapes belong mainly to facts. Keep decorative artwork out of the reading path.

## 5. Mobile and Motion

**Mobile card rails with scroll snapping:** at 760px and below, convert groups
of peer content cards into horizontally swipeable card rails instead of stacking
all cards vertically. This applies to supporting services, testimonials, and
at-a-glance facts, including desktop grids or expanded card arrangements.

- Show one complete card with part of the next visible as a swipe cue. Use about
  85–90% of the rail width per card, a 16px gap, and enough end padding to reveal
  the last card fully. Keep the featured evaluation card full-width above its rail.
- Use native horizontal overflow, `scroll-snap-type: x proximity`, and
  `scroll-snap-align: start`. Do not autoplay content rails or capture vertical gestures.
- Keep cards in logical DOM order with all text and actions accessible. Support
  keyboard scrolling, visible focus, and labeled controls when needed; focused
  links must scroll into view. Do not make swiping the only way to access content.
- Under reduced motion, retain manual scrolling and disable smooth transitions.
  Rails must work without JavaScript. Allow taller cards for long copy; never
  truncate text to force every card to the same height.
- Keep process steps, FAQs, Hero copy, forms, and footer information in normal
  vertical reading flow. The two-row institution carousel follows its own rules.

- **Institution carousel:** 16 logos, two rows of eight, both moving left to right.
  Use seamless linear cycles around 72/80 seconds. No white tiles, borders, shadows,
  or visible pause button. Pause on hover/focus; hide duplicate groups from assistive
  tools. At reduced motion, remove auto-movement and allow native horizontal scrolling.
  Use compact logo slots: 232 x 112px on desktop and 156 x 88px below 600px;
  contain images without cropping. Limit square emblems to 80px / 64px so they
  balance the wider wordmarks. Use 72px / 40px section padding, 32px / 24px from
  introduction to logos, and 12px / 8px between rows. On mobile, keep supporting
  copy at 16px with 1.6 line height and place the footer link on its own line with
  a minimum 44px target height.
- **Client feedback carousel:** show two cards on desktop and one 88%-width card
  with a next-card cue at 760px and below. Preserve all five legacy reviews,
  using the second original paragraph as the owner-requested xiao h excerpt,
  and keep avatars proportional. All cards share the tallest natural card height
  at each viewport, without changing height between slides or truncating text.
  Highlight the verified Google 5.0 rating beside the heading and link to the
  owner-provided Google search for more reviews.
  Keep previous/next controls and the visible range above the cards; buttons wrap
  at either end. Use native horizontal scrolling without autoplay, and disable
  smooth movement under reduced motion. Omit undated relative timestamps.
- **Facts:** above 850px, a sticky composition may change facts with scroll and labeled
  selectors. Allocate 65vh of scrolling per fact plus one viewport for the scene
  (425vh for five facts), with the inner panel below the header. Map switching to
  the actual sticky travel distance in equal intervals so the final fact has a
  full reading interval before the scene exits. At 760px and
  below, use the manual card rail. At 761–850px, use an unpinned layout. Reduced motion
  or unavailable JavaScript must disable sticky fact switching and expose all facts;
  preserve the manual rail on mobile.
- **Fact background:** pale-blue spheres with restrained gold accents drift slowly
  and shift with vertical scrolling or mobile card swipes. Keep them behind content,
  non-interactive, and hidden from assistive technology. Reduced motion freezes them.
- **Process:** desktop uses sticky imagery and numbered cards; transitions take
  550–700ms. At 850px and below, stack each image above its description. Do not put
  required steps, FAQs, Hero copy, or footer information into swipe-only rails.
- **Reveals:** one-time fades with 16–25px movement, around 400–650ms. Buttons use
  150–250ms transitions; card hover elevation stays within 3px. Decorative motion is slow.
- **Reduced motion:** stop continuous movement, pinned fact changes, and smooth scrolling.
  Keep content visible without enhancement; never make animation necessary to read it.
- **Responsive behavior:** use the compact header at 1200px and below and mobile Hero below 760px; preserve about 110px
  anchor clearance. Permit taller sections, wrapping, and stacked layouts at 200% zoom.
  Only designated rails may overflow horizontally; the page itself must not.

## 6. Design Acceptance

These are reusable acceptance criteria, not a completion log.

- AET identity, full-map icon, palette, exact Hero copy, and BBB artwork are correct.
- Fonts, enlarged hierarchy, spacing, and four-digit figures follow the specified roles.
- Homepage order and both institution rows match the composition rules.
- Original service copy, qualifications, testimonials, and destinations remain accurate.
- Photography is sharp, appropriately cropped, and clearly attributed where necessary.
- Mobile peer-card groups use manual horizontal rails with snap alignment and a
  visible next-card cue; every card/action is reachable and essential steps stay vertical.
- Keyboard access, focus, contrast, alt text, disclosures, reduced motion, and no-JavaScript
  fallbacks are checked; target WCAG 2.2 AA without claiming certification from this document.
- Check 320/390/760/850/1440px and 200% zoom: no clipped content, unintended horizontal
  overflow, broken media, or inaccessible controls.
