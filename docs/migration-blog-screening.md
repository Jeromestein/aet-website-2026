# AET Blog Migration — NACES Exclusion Scan

Scan date: September 29, 2026. Scope: local source files, not a live-site crawl.

## Decision

**Do not migrate any blog article that mentions NACES or a current NACES member.**
This applies even to neutral mentions or an AET biography describing past work at a
NACES agency. Keep the excluded source articles intact on the old site; this task
only changes the migration plan. Do not salvage them into new articles or bypass
the decision by importing a different copy. Old-URL handling is a separate task.

Of 109 blog articles: **48 excluded**, **60 remaining candidates**, and **1 visa
article still held for the existing service-scope decision**. In addition, **7
standalone article/landing-page sources** are excluded below. These seven are
outside the 109 count. No former-member-only blog match was found.

## Screening basis and method

- User-provided screenshot: the 17 listed member organizations, including the
  TEC/SpanTran name change and WES, ECE, IEE, and IERF abbreviations.
- [Official NACES member directory](https://naces.org/members/), checked September 29,
  2026: 18 current members. This adds Center for Educational Documentation to the
  screenshot list. Current and former members were kept distinct.
- Scanned all 109 PHP article entry points, their actual HTML includes, shared
  header/footer includes, and 106 same-stem root HTML copies: **326 distinct files**.
- Also scanned all **238 root HTML files** to catch standalone and Chinese articles.
  Findings on non-article service/office/homepage files are noted separately and
  do not automatically expand the blog exclusion to those pages.
- Matched normalized, case-insensitive names; recognized abbreviations; member
  domains; SpanTran/TEC; JS&A; and the legacy spelling Worldwide Education Services.
  Inspected text, links, image names/alt text, metadata, and HTML comments.
- Preserved comment-only and old-copy-only findings as exclusions to prevent
  importing dormant/older content. Evidence labels distinguish these from visible text.
- Reviewed abbreviation context: **GCE meaning General Certificate of Education is
  not a Global Credential Evaluators match**. Searched that company by full name
  and domain instead. No ambiguous GCE hit was used to exclude an article.
- An independent raw-source keyword pass found no additional rule hits among the
  61 articles not blocked by the NACES/member rule.
- Source locations below identify the start of the matched text/attribute/comment
  block; a long commented block can contain the quoted match on a later line.
- No-match results describe this local snapshot; rescan revised content before import.

## Organizations and aliases checked

| Organization | Additional identifiers checked |
| --- | --- |
| NACES | National Association of Credential Evaluation Services; naces.org |
| Academic Evaluation Services | AES; aes-edu.org |
| Center for Educational Documentation | CED; cedevaluations.com |
| Center for Applied Research, Evaluation & Education | CAREE; iescaree.com |
| Educational Credential Evaluators | ECE; ece.org |
| Educational Perspectives | edperspective.org |
| Educational Records Evaluation Service | ERES; eres.com |
| Foreign Academic Credential Service | FACS; facsusa.com |
| Foundation for International Services | FIS; fis-web.com |
| Global Credential Evaluators | gceus.com; generic GCE excluded after context review |
| Globe Language Services | globelanguage.com |
| Institute of Foreign Credential Services | IFCS; ifcsevals.com |
| International Consultants of Delaware | ICD; icdeval.com |
| International Education Evaluations | IEE; myiee.org; iee123.com |
| International Education Research Foundation | IERF; ierf.org |
| Josef Silny & Associates | JS&A; jsilny.com; jsilny.org |
| The Evaluation Company | TEC; SpanTran; evalcompany.com; spantran.com |
| Transcript Research | transcriptresearch.com |
| World Education Services | WES; Worldwide Education Services; wes.org |

Former-member names were scanned separately using the official directory. Their
presence alone was not treated as proof of current membership; every affected
blog in this scan already has a NACES/current-member exclusion.

## Excluded blog articles — 48

### GCSE-equivalent-in-the-USA

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [GCSE-equivalent-in-the-USA.html:233](../../server-54.213.58.23/americantranslationservice.com/GCSE-equivalent-in-the-USA.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [GCSE-equivalent-in-the-USA.html:234](../../server-54.213.58.23/americantranslationservice.com/GCSE-equivalent-in-the-USA.html) | href: `https://www.jsilny.org/` |
| NACES | [GCSE-equivalent-in-the-USA.html:293](../../server-54.213.58.23/americantranslationservice.com/GCSE-equivalent-in-the-USA.html) | href: `https://www.naces.org/index` |

### Indian-degree-evaluation-in-USA

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [Indian-degree-evaluation-in-USA.html:353](../../server-54.213.58.23/americantranslationservice.com/Indian-degree-evaluation-in-USA.html) | href: `https://www.naces.org/index` |
| World Education Services | [blog/Indian-degree-evaluation-in-USA-content.html:158](../../server-54.213.58.23/americantranslationservice.com/blog/Indian-degree-evaluation-in-USA-content.html) | href: `https://www.wes.org/advisor-blog/3-year-indian-bachelors-degree/` |

### Moroccan-high-school-diploma-equivalent-in-USA

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [Moroccan-high-school-diploma-equivalent-in-USA.html:236](../../server-54.213.58.23/americantranslationservice.com/Moroccan-high-school-diploma-equivalent-in-USA.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [Moroccan-high-school-diploma-equivalent-in-USA.html:237](../../server-54.213.58.23/americantranslationservice.com/Moroccan-high-school-diploma-equivalent-in-USA.html) | href: `https://www.jsilny.org/` |

### Pakistani-degree-equivalency-in-USA

**DO NOT MIGRATE.** Match location: Root HTML copy only.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [Pakistani-degree-equivalency-in-USA.html:305](../../server-54.213.58.23/americantranslationservice.com/Pakistani-degree-equivalency-in-USA.html) | href: `https://www.naces.org/index` |

### Philippine-high-school-diploma-equivalent-in-USA

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [Philippine-high-school-diploma-equivalent-in-USA.html:246](../../server-54.213.58.23/americantranslationservice.com/Philippine-high-school-diploma-equivalent-in-USA.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [Philippine-high-school-diploma-equivalent-in-USA.html:247](../../server-54.213.58.23/americantranslationservice.com/Philippine-high-school-diploma-equivalent-in-USA.html) | href: `https://www.jsilny.org/` |

### best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [blog/best-education-credential-evaluation-agencies-content.html:51](../../server-54.213.58.23/americantranslationservice.com/blog/best-education-credential-evaluation-agencies-content.html) | text: `Educational Credential Evaluators (ECE)` |
| Foundation for International Services | [blog/best-education-credential-evaluation-agencies-content.html:52](../../server-54.213.58.23/americantranslationservice.com/blog/best-education-credential-evaluation-agencies-content.html) | text: `Foundation for International Services, Inc.` |
| Globe Language Services | [blog/best-education-credential-evaluation-agencies-content.html:559](../../server-54.213.58.23/americantranslationservice.com/blog/best-education-credential-evaluation-agencies-content.html) | text: `10. Globe Language Services` |
| NACES | [blog/best-education-credential-evaluation-agencies-content.html:130](../../server-54.213.58.23/americantranslationservice.com/blog/best-education-credential-evaluation-agencies-content.html) | text: `Director of Evaluation worked for a prominent NACES agency` |
| The Evaluation Company / SpanTran | [blog/best-education-credential-evaluation-agencies-content.html:59](../../server-54.213.58.23/americantranslationservice.com/blog/best-education-credential-evaluation-agencies-content.html) | text: `SpanTran: The Evaluation Company` |
| World Education Services | [blog/best-education-credential-evaluation-agencies-content.html:61](../../server-54.213.58.23/americantranslationservice.com/blog/best-education-credential-evaluation-agencies-content.html) | text: `World Education Services (WES)` |

### best-places-to-get-your-foreign-degree-evaluated-for-us-employment

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/best-places-to-get-your-foreign-degree-evaluated-for-us-employment.html:235](../../server-54.213.58.23/americantranslationservice.com/blog/best-places-to-get-your-foreign-degree-evaluated-for-us-employment.html) | text: `Prefer AICE or NACES membership (many states/employers require one of these).` |

### california-barbercosmo-credential-evaluation-and-translations

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/california-barbercosmo-credential-evaluation-and-translations-content.html:180](../../server-54.213.58.23/americantranslationservice.com/blog/california-barbercosmo-credential-evaluation-and-translations-content.html) | text: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director.` |

### california-best-education-credential-evaluation-services

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/california-best-education-credential-evaluation-services-content.html:78](../../server-54.213.58.23/americantranslationservice.com/blog/california-best-education-credential-evaluation-services-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |

### cheap-credential-evaluation-services

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [blog/cheap-credential-evaluation-services-content.html:111](../../server-54.213.58.23/americantranslationservice.com/blog/cheap-credential-evaluation-services-content.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [blog/cheap-credential-evaluation-services-content.html:139](../../server-54.213.58.23/americantranslationservice.com/blog/cheap-credential-evaluation-services-content.html) | href: `https://www.jsilny.org/` |
| The Evaluation Company / SpanTran | [blog/cheap-credential-evaluation-services-content.html:153](../../server-54.213.58.23/americantranslationservice.com/blog/cheap-credential-evaluation-services-content.html) | href: `https://spantran.com/web/` |
| Transcript Research | [blog/cheap-credential-evaluation-services-content.html:146](../../server-54.213.58.23/americantranslationservice.com/blog/cheap-credential-evaluation-services-content.html) | href: `https://transcriptresearch.com/` |

### credential-evaluation-for-education

**DO NOT MIGRATE.** Match location: Root HTML copy only.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [credential-evaluation-for-education.html:275](../../server-54.213.58.23/americantranslationservice.com/credential-evaluation-for-education.html) | href: `https://www.naces.org/index` |

### credential-evaluation-for-emloyment

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [credential-evaluation-for-emloyment.html:271](../../server-54.213.58.23/americantranslationservice.com/credential-evaluation-for-emloyment.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [credential-evaluation-for-emloyment.html:272](../../server-54.213.58.23/americantranslationservice.com/credential-evaluation-for-emloyment.html) | href: `https://www.jsilny.org/` |
| NACES | [credential-evaluation-for-emloyment.html:290](../../server-54.213.58.23/americantranslationservice.com/credential-evaluation-for-emloyment.html) | href: `https://www.naces.org/index` |

### dallas-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/dallas-best-education-credential-evaluation-agencies-content.html:75](../../server-54.213.58.23/americantranslationservice.com/blog/dallas-best-education-credential-evaluation-agencies-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |
| Transcript Research | [blog/dallas-best-education-credential-evaluation-agencies-content.html:85](../../server-54.213.58.23/americantranslationservice.com/blog/dallas-best-education-credential-evaluation-agencies-content.html) | text: `2. Transcript Research` |

### diploma-translation-and-evaluation

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [blog/diploma-translation-and-evaluation-content.html:280](../../server-54.213.58.23/americantranslationservice.com/blog/diploma-translation-and-evaluation-content.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [blog/diploma-translation-and-evaluation-content.html:296](../../server-54.213.58.23/americantranslationservice.com/blog/diploma-translation-and-evaluation-content.html) | href: `https://www.jsilny.org/` |
| NACES | [blog/diploma-translation-and-evaluation-content.html:363](../../server-54.213.58.23/americantranslationservice.com/blog/diploma-translation-and-evaluation-content.html) | text: `Jeremy Yan, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He was just like you, coming to the US from a foreign co` |
| The Evaluation Company / SpanTran | [blog/diploma-translation-and-evaluation-content.html:304](../../server-54.213.58.23/americantranslationservice.com/blog/diploma-translation-and-evaluation-content.html) | href: `https://spantran.com/web/` |
| Transcript Research | [blog/diploma-translation-and-evaluation-content.html:300](../../server-54.213.58.23/americantranslationservice.com/blog/diploma-translation-and-evaluation-content.html) | href: `https://transcriptresearch.com/` |

### e-aet-expert-opinion-letter

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/e-aet-expert-opinion-letter-content.html:169](../../server-54.213.58.23/americantranslationservice.com/blog/e-aet-expert-opinion-letter-content.html) | text: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director.` |

### eb-2-niw-credential-evaluation

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [eb-2-niw-credential-evaluation.html:236](../../server-54.213.58.23/americantranslationservice.com/eb-2-niw-credential-evaluation.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [eb-2-niw-credential-evaluation.html:237](../../server-54.213.58.23/americantranslationservice.com/eb-2-niw-credential-evaluation.html) | href: `https://www.jsilny.org/` |
| NACES | [eb-2-niw-credential-evaluation.html:346](../../server-54.213.58.23/americantranslationservice.com/eb-2-niw-credential-evaluation.html) | href: `https://www.naces.org/index` |
| World Education Services | [eb-2-niw-credential-evaluation.html:235](../../server-54.213.58.23/americantranslationservice.com/eb-2-niw-credential-evaluation.html) | href: `https://www.wes.org/` |

### eb-2-niw-expert-opinion-letters

**DO NOT MIGRATE.** Match location: Root HTML copy only.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [eb-2-niw-expert-opinion-letters.html:372](../../server-54.213.58.23/americantranslationservice.com/eb-2-niw-expert-opinion-letters.html) | href: `https://www.naces.org/index` |

### education-credential-evaluation-purposes

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [education-credential-evaluation-purposes.html:272](../../server-54.213.58.23/americantranslationservice.com/education-credential-evaluation-purposes.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [education-credential-evaluation-purposes.html:273](../../server-54.213.58.23/americantranslationservice.com/education-credential-evaluation-purposes.html) | href: `https://www.jsilny.org/` |
| NACES | [education-credential-evaluation-purposes.html:296](../../server-54.213.58.23/americantranslationservice.com/education-credential-evaluation-purposes.html) | text: `t like you, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He was just like you, coming to the US from a foreign co` |
| World Education Services | [education-credential-evaluation-purposes.html:271](../../server-54.213.58.23/americantranslationservice.com/education-credential-evaluation-purposes.html) | href: `https://www.wes.org/` |

### education-evaluation-h1b-for-india

**DO NOT MIGRATE.** Match location: Root HTML copy only.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [education-evaluation-h1b-for-india.html:361](../../server-54.213.58.23/americantranslationservice.com/education-evaluation-h1b-for-india.html) | href: `https://www.naces.org/index` |

### education-evaluation-h1b

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [education-evaluation-h1b.html:227](../../server-54.213.58.23/americantranslationservice.com/education-evaluation-h1b.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [education-evaluation-h1b.html:228](../../server-54.213.58.23/americantranslationservice.com/education-evaluation-h1b.html) | href: `https://www.jsilny.org/` |
| NACES | [education-evaluation-h1b.html:338](../../server-54.213.58.23/americantranslationservice.com/education-evaluation-h1b.html) | href: `https://www.naces.org/index` |
| World Education Services | [education-evaluation-h1b.html:226](../../server-54.213.58.23/americantranslationservice.com/education-evaluation-h1b.html) | href: `https://www.wes.org/` |

### florida-credential-evaluation-services

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Academic Evaluation Services | [blog/florida-credential-evaluation-services-content.html:243](../../server-54.213.58.23/americantranslationservice.com/blog/florida-credential-evaluation-services-content.html) | text: `5. Academic Evaluation Services, Inc.` |
| Josef Silny & Associates | [blog/florida-credential-evaluation-services-content.html:92](../../server-54.213.58.23/americantranslationservice.com/blog/florida-credential-evaluation-services-content.html) | text: `2. Josef Silny & Associates, Inc. (JS&A)` |
| NACES | [blog/florida-credential-evaluation-services-content.html:82](../../server-54.213.58.23/americantranslationservice.com/blog/florida-credential-evaluation-services-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |
| The Evaluation Company / SpanTran | [blog/florida-credential-evaluation-services-content.html:193](../../server-54.213.58.23/americantranslationservice.com/blog/florida-credential-evaluation-services-content.html) | text: `4. SpanTran: The Evaluation Company` |

### foreign-credential-evaluation-for-immigration

**DO NOT MIGRATE.** Match location: Blog source comments; also inspect legacy copies.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [foreign-credential-evaluation-for-immigration.html:367](../../server-54.213.58.23/americantranslationservice.com/foreign-credential-evaluation-for-immigration.html) | text: `https://www.ece.org/ECE/Individuals/Immigration-Reports` |
| NACES | [foreign-credential-evaluation-for-immigration.html:360](../../server-54.213.58.23/americantranslationservice.com/foreign-credential-evaluation-for-immigration.html) | href: `https://www.naces.org/index` |

### foreign-credential-evaluation-in-usa-China

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/foreign-credential-evaluation-in-usa-China-content.html:225](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-China-content.html) | text: `Jeremy Yan, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He emigrated from China to fulfill his American Dream. H` |

### foreign-credential-evaluation-in-usa-csec

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/foreign-credential-evaluation-in-usa-csec-content.html:262](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-csec-content.html) | text: `Jeremy Yan, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He was just like you, coming to the US from a foreign co` |

### foreign-credential-evaluation-in-usa-gce

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/foreign-credential-evaluation-in-usa-gce-content.html:323](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-gce-content.html) | text: `Jeremy Yan, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He was just like you, coming to the US from a foreign co` |
| World Education Services | [blog/foreign-credential-evaluation-in-usa-gce-content.html:171](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-gce-content.html) | href: `https://wenr.wes.org/2014/02/a-guide-to-the-gce-a-level` |

### foreign-credential-evaluation-in-usa-latin-america

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/foreign-credential-evaluation-in-usa-latin-america-content.html:233](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-latin-america-content.html) | text: `er a decade experience and was a Senior Associate Director at a well-known NACES agency.` |

### foreign-credential-evaluation-in-usa-waec

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/foreign-credential-evaluation-in-usa-waec-content.html:252](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-waec-content.html) | text: `Jeremy Yan, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He was just like you, coming to the US from a foreign co` |
| The Evaluation Company / SpanTran | [blog/foreign-credential-evaluation-in-usa-waec-content.html:160](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-credential-evaluation-in-usa-waec-content.html) | href: `https://spantran.com/web/services/verifications` |

### foreign-high-school-diploma-evaluation-in-usa

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [foreign-high-school-diploma-evaluation-in-usa.html:359](../../server-54.213.58.23/americantranslationservice.com/foreign-high-school-diploma-evaluation-in-usa.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [foreign-high-school-diploma-evaluation-in-usa.html:360](../../server-54.213.58.23/americantranslationservice.com/foreign-high-school-diploma-evaluation-in-usa.html) | href: `https://www.jsilny.org/` |
| NACES | [blog/foreign-high-school-diploma-evaluation-in-usa-content.html:354](../../server-54.213.58.23/americantranslationservice.com/blog/foreign-high-school-diploma-evaluation-in-usa-content.html) | text: `Jeremy Yan, who is also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. He was just like you, coming to the US from a foreign co` |

### georgia-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Academic Evaluation Services | [blog/georgia-best-education-credential-evaluation-agencies-content.html:32](../../server-54.213.58.23/americantranslationservice.com/blog/georgia-best-education-credential-evaluation-agencies-content.html) | HTML comment: `AES` |
| NACES | [blog/georgia-best-education-credential-evaluation-agencies-content.html:123](../../server-54.213.58.23/americantranslationservice.com/blog/georgia-best-education-credential-evaluation-agencies-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |

### houston-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/houston-best-education-credential-evaluation-agencies-content.html:70](../../server-54.213.58.23/americantranslationservice.com/blog/houston-best-education-credential-evaluation-agencies-content.html) | text: `the National Association of Credential Evaluation Services (NACES).` |
| The Evaluation Company / SpanTran | [blog/houston-best-education-credential-evaluation-agencies-content.html:33](../../server-54.213.58.23/americantranslationservice.com/blog/houston-best-education-credential-evaluation-agencies-content.html) | text: `1. SpanTran: The Evaluation Company` |

### how-to-avoid-delays-with-foreign-credential-evaluation

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/how-to-avoid-delays-with-foreign-credential-evaluation-content.html:181](../../server-54.213.58.23/americantranslationservice.com/blog/how-to-avoid-delays-with-foreign-credential-evaluation-content.html) | text: `n the beginning. To be fair, it’s understandable because the big guys from NACES are busy, and sometimes they just don’t see you as that important.` |
| World Education Services | [blog/how-to-avoid-delays-with-foreign-credential-evaluation-content.html:235](../../server-54.213.58.23/americantranslationservice.com/blog/how-to-avoid-delays-with-foreign-credential-evaluation-content.html) | href: `daimmigrants.quora.com/How-to-avoid-a-delay-in-credentials-evaluation-with-WES` |

### how-to-get-an-international-evaluation

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [how-to-get-an-international-evaluation.html:198](../../server-54.213.58.23/americantranslationservice.com/how-to-get-an-international-evaluation.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [how-to-get-an-international-evaluation.html:199](../../server-54.213.58.23/americantranslationservice.com/how-to-get-an-international-evaluation.html) | href: `https://www.jsilny.org/` |
| NACES | [blog/how-to-get-an-international-evaluation-content.html:206](../../server-54.213.58.23/americantranslationservice.com/blog/how-to-get-an-international-evaluation-content.html) | text: `Director of Evaluation worked for a prominent NACES agency for 10+ years as a senior associate director.` |
| World Education Services | [how-to-get-an-international-evaluation.html:284](../../server-54.213.58.23/americantranslationservice.com/how-to-get-an-international-evaluation.html) | href: `https://www.wes.org/` |

### i-140-education-evaluation

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [i-140-education-evaluation.html:222](../../server-54.213.58.23/americantranslationservice.com/i-140-education-evaluation.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [i-140-education-evaluation.html:223](../../server-54.213.58.23/americantranslationservice.com/i-140-education-evaluation.html) | href: `https://www.jsilny.org/` |
| NACES | [blog/i-140-education-evaluation-content.html:262](../../server-54.213.58.23/americantranslationservice.com/blog/i-140-education-evaluation-content.html) | text: `er a decade experience and was a Senior Associate Director at a well-known NACES agency.` |
| World Education Services | [i-140-education-evaluation.html:221](../../server-54.213.58.23/americantranslationservice.com/i-140-education-evaluation.html) | href: `https://www.wes.org/` |

### illinois-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Academic Evaluation Services | [blog/illinois-best-education-credential-evaluation-agencies-content.html:65](../../server-54.213.58.23/americantranslationservice.com/blog/illinois-best-education-credential-evaluation-agencies-content.html) | text: `About AES:` |
| Educational Perspectives | [blog/illinois-best-education-credential-evaluation-agencies-content.html:75](../../server-54.213.58.23/americantranslationservice.com/blog/illinois-best-education-credential-evaluation-agencies-content.html) | text: `2. Educational Perspectives` |
| Foreign Academic Credential Service | [blog/illinois-best-education-credential-evaluation-agencies-content.html:120](../../server-54.213.58.23/americantranslationservice.com/blog/illinois-best-education-credential-evaluation-agencies-content.html) | text: `3. Foreign Academic Credentials Service` |
| NACES | [blog/illinois-best-education-credential-evaluation-agencies-content.html:112](../../server-54.213.58.23/americantranslationservice.com/blog/illinois-best-education-credential-evaluation-agencies-content.html) | text: `20+ years of experience, a corporate member of NACES, AACRAO, and ATA.` |

### illinois-credential-evaluation-and-translations

**DO NOT MIGRATE.** Match location: Root HTML copy only.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [illinois-credential-evaluation-and-translations.html:199](../../server-54.213.58.23/americantranslationservice.com/illinois-credential-evaluation-and-translations.html) | text: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director.` |

### international-transcript-evaluation

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [international-transcript-evaluation.html:290](../../server-54.213.58.23/americantranslationservice.com/international-transcript-evaluation.html) | href: `https://www.ece.org/` |
| NACES | [blog/international-transcript-evaluation-content.html:287](../../server-54.213.58.23/americantranslationservice.com/blog/international-transcript-evaluation-content.html) | text: `er a decade experience and was a Senior Associate Director at a well-known NACES agency.` |
| World Education Services | [international-transcript-evaluation.html:289](../../server-54.213.58.23/americantranslationservice.com/international-transcript-evaluation.html) | href: `https://www.wes.org/` |

### los-angeles-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/los-angeles-best-education-credential-evaluation-agencies-content.html:71](../../server-54.213.58.23/americantranslationservice.com/blog/los-angeles-best-education-credential-evaluation-agencies-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |

### los-angeles-credential-evaluation-and-translations

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/los-angeles-credential-evaluation-and-translations-content.html:223](../../server-54.213.58.23/americantranslationservice.com/blog/los-angeles-credential-evaluation-and-translations-content.html) | text: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director.` |

### miami-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Josef Silny & Associates | [blog/miami-best-education-credential-evaluation-agencies-content.html:83](../../server-54.213.58.23/americantranslationservice.com/blog/miami-best-education-credential-evaluation-agencies-content.html) | text: `2. Josef Silny & Associates, Inc. (JS&A)` |
| NACES | [blog/miami-best-education-credential-evaluation-agencies-content.html:72](../../server-54.213.58.23/americantranslationservice.com/blog/miami-best-education-credential-evaluation-agencies-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |
| The Evaluation Company / SpanTran | [blog/miami-best-education-credential-evaluation-agencies-content.html:184](../../server-54.213.58.23/americantranslationservice.com/blog/miami-best-education-credential-evaluation-agencies-content.html) | text: `4. SpanTran: The Evaluation Company` |

### miami-credential-evaluation-and-translations

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/miami-credential-evaluation-and-translations-content.html:223](../../server-54.213.58.23/americantranslationservice.com/blog/miami-credential-evaluation-and-translations-content.html) | text: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director.` |

### miami-foreign-credential-evaluation-services

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/miami-foreign-credential-evaluation-services-content.html:29](../../server-54.213.58.23/americantranslationservice.com/blog/miami-foreign-credential-evaluation-services-content.html) | text: `er a decade experience and was a Senior Associate Director at a well-known NACES agency.` |

### san-francisco-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/san-francisco-best-education-credential-evaluation-agencies-content.html:68](../../server-54.213.58.23/americantranslationservice.com/blog/san-francisco-best-education-credential-evaluation-agencies-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |

### san-francisco-credential-evaluation-and-translations

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/san-francisco-credential-evaluation-and-translations-content.html:231](../../server-54.213.58.23/americantranslationservice.com/blog/san-francisco-credential-evaluation-and-translations-content.html) | text: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director.` |

### texas-best-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/texas-best-education-credential-evaluation-agencies-content.html:75](../../server-54.213.58.23/americantranslationservice.com/blog/texas-best-education-credential-evaluation-agencies-content.html) | text: `Founder worked at an NACES agency for 10+ years as senior associate director` |
| The Evaluation Company / SpanTran | [blog/texas-best-education-credential-evaluation-agencies-content.html:179](../../server-54.213.58.23/americantranslationservice.com/blog/texas-best-education-credential-evaluation-agencies-content.html) | text: `4. SpanTran: The Evaluation Company` |
| Transcript Research | [blog/texas-best-education-credential-evaluation-agencies-content.html:86](../../server-54.213.58.23/americantranslationservice.com/blog/texas-best-education-credential-evaluation-agencies-content.html) | text: `2. Transcript Research` |

### transcript-evaluation-service

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [blog/transcript-evaluation-service-content.html:193](../../server-54.213.58.23/americantranslationservice.com/blog/transcript-evaluation-service-content.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [blog/transcript-evaluation-service-content.html:221](../../server-54.213.58.23/americantranslationservice.com/blog/transcript-evaluation-service-content.html) | href: `https://www.jsilny.org/` |
| The Evaluation Company / SpanTran | [blog/transcript-evaluation-service-content.html:235](../../server-54.213.58.23/americantranslationservice.com/blog/transcript-evaluation-service-content.html) | href: `https://spantran.com/web/` |
| Transcript Research | [blog/transcript-evaluation-service-content.html:228](../../server-54.213.58.23/americantranslationservice.com/blog/transcript-evaluation-service-content.html) | href: `https://transcriptresearch.com/` |

### washington-state-education-credential-evaluation-agencies

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Academic Evaluation Services | [blog/washington-state-education-credential-evaluation-agencies-content.html:32](../../server-54.213.58.23/americantranslationservice.com/blog/washington-state-education-credential-evaluation-agencies-content.html) | HTML comment: `AES` |
| Foundation for International Services | [blog/washington-state-education-credential-evaluation-agencies-content.html:33](../../server-54.213.58.23/americantranslationservice.com/blog/washington-state-education-credential-evaluation-agencies-content.html) | text: `Foundation for International Services, Inc.` |
| NACES | [blog/washington-state-education-credential-evaluation-agencies-content.html:71](../../server-54.213.58.23/americantranslationservice.com/blog/washington-state-education-credential-evaluation-agencies-content.html) | text: `National Association of Credential Evaluation Services (NACES).` |

### where-to-evaluate-international-degree-in-usa

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [blog/where-to-evaluate-international-degree-in-usa-content.html:71](../../server-54.213.58.23/americantranslationservice.com/blog/where-to-evaluate-international-degree-in-usa-content.html) | text: `NACES` |
| World Education Services | [blog/where-to-evaluate-international-degree-in-usa-content.html:224](../../server-54.213.58.23/americantranslationservice.com/blog/where-to-evaluate-international-degree-in-usa-content.html) | href: `daimmigrants.quora.com/How-to-avoid-a-delay-in-credentials-evaluation-with-WES` |

### where-to-get-evaluation-for-uscis

**DO NOT MIGRATE.** Match location: Article content/metadata/assets.

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [blog/where-to-get-evaluation-for-uscis-content.html:166](../../server-54.213.58.23/americantranslationservice.com/blog/where-to-get-evaluation-for-uscis-content.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [blog/where-to-get-evaluation-for-uscis-content.html:194](../../server-54.213.58.23/americantranslationservice.com/blog/where-to-get-evaluation-for-uscis-content.html) | href: `https://www.jsilny.org/` |
| The Evaluation Company / SpanTran | [blog/where-to-get-evaluation-for-uscis-content.html:208](../../server-54.213.58.23/americantranslationservice.com/blog/where-to-get-evaluation-for-uscis-content.html) | href: `https://spantran.com/web/` |
| Transcript Research | [blog/where-to-get-evaluation-for-uscis-content.html:201](../../server-54.213.58.23/americantranslationservice.com/blog/where-to-get-evaluation-for-uscis-content.html) | href: `https://transcriptresearch.com/` |

## Additional excluded article/landing-page sources — 7

These sources were listed separately in the main checklist. They must not be
migrated or merged into retained content.

### best-credential-evaluation-services.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [best-credential-evaluation-services.html:771](../../server-54.213.58.23/americantranslationservice.com/best-credential-evaluation-services.html) | text: `erience, including 10+ years as a senior associate director at a prominent NACES agency.` |

### c-california-barbercosmo-credential-evaluation-and-translations.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [c-california-barbercosmo-credential-evaluation-and-translations.html:184](../../server-54.213.58.23/americantranslationservice.com/c-california-barbercosmo-credential-evaluation-and-translations.html) | text: `的创始人兼学历认证业务主管, 严先生, 也和你一样为了自己的美国在这里打拼, 并且曾在一家知名的 NACES 认证机构担任资深副主任超过十年。` |

### c-eb-2-niw-credential-evaluation.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [c-eb-2-niw-credential-evaluation.html:131](../../server-54.213.58.23/americantranslationservice.com/c-eb-2-niw-credential-evaluation.html) | href: `https://www.ece.org/` |
| NACES | [c-eb-2-niw-credential-evaluation.html:193](../../server-54.213.58.23/americantranslationservice.com/c-eb-2-niw-credential-evaluation.html) | HTML comment: `, Mr. Yan had worked for over 10 years in a prominent <a href="https://www.naces.org/index">NACES</a> (National Association of Credential Evaluation Services) company as a senior associate d` |
| World Education Services | [c-eb-2-niw-credential-evaluation.html:130](../../server-54.213.58.23/americantranslationservice.com/c-eb-2-niw-credential-evaluation.html) | href: `https://www.wes.org/` |

### c-how-to-avoid-delays-with-foreign-credential-evaluation.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [c-how-to-avoid-delays-with-foreign-credential-evaluation.html:162](../../server-54.213.58.23/americantranslationservice.com/c-how-to-avoid-delays-with-foreign-credential-evaluation.html) | HTML comment: `, Mr. Yan had worked for over 10 years in a prominent <a href="https://www.naces.org/index">NACES</a> (National Association of Credential Evaluation Services) company as a senior associate d` |

### c-i-140-education-evaluation.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [c-i-140-education-evaluation.html:176](../../server-54.213.58.23/americantranslationservice.com/c-i-140-education-evaluation.html) | HTML comment: `, Mr. Yan had worked for over 10 years in a prominent <a href="https://www.naces.org/index">NACES</a> (National Association of Credential Evaluation Services) company as a senior associate d` |

### e-credential-evaluation-for-uscis.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| NACES | [e-credential-evaluation-for-uscis.html:223](../../server-54.213.58.23/americantranslationservice.com/e-credential-evaluation-for-uscis.html) | HTML comment: `s an immigrant and also the Director of Evaluation, worked for a prominent NACES agency for 10+ years as a senior associate director. <br><br>He was just like you, coming to the US from a fo` |

### expert-opinion-letter-h1b.html

**DO NOT MIGRATE.**

| Matched organization | Source block | Evidence |
| --- | --- | --- |
| Educational Credential Evaluators | [expert-opinion-letter-h1b.html:217](../../server-54.213.58.23/americantranslationservice.com/expert-opinion-letter-h1b.html) | href: `https://www.ece.org/` |
| Josef Silny & Associates | [expert-opinion-letter-h1b.html:218](../../server-54.213.58.23/americantranslationservice.com/expert-opinion-letter-h1b.html) | href: `https://www.jsilny.org/` |
| World Education Services | [expert-opinion-letter-h1b.html:216](../../server-54.213.58.23/americantranslationservice.com/expert-opinion-letter-h1b.html) | href: `https://www.wes.org/` |

## Supplemental findings outside the article scope

The broad root-file scan also found matches in the following sources. They are
listed for visibility, not treated as additional blog articles or an instruction
to delete/rebuild unrelated pages. The blog exclusion does not by itself change
the P0 service/office migration scope.

- `backup-best-education-credential-evaluation-agencies.html`: Educational Credential Evaluators; Foundation for International Services; Globe Language Services; NACES; The Evaluation Company / SpanTran; World Education Services.
- `body.html`: Educational Credential Evaluators; Josef Silny & Associates; NACES; World Education Services.
- `c_aboutus.html`: NACES.
- `c_evaluation.html`: NACES; World Education Services.
- `e-evaluation-content-es.html`: Educational Credential Evaluators; NACES; World Education Services.
- `e-evaluation-content-zh.html`: Educational Credential Evaluators; NACES; World Education Services.
- `e-office-boston-content.html`: NACES.
- `e-office-los-angeles-content.html`: NACES.
- `e-office-miami-content.html`: NACES.
- `e-office-nyc-content.html`: NACES.
- `e-office-san-francisco-content.html`: NACES.
- `e_aboutus.html`: NACES.
- `e_evaluation-content.html`: Educational Credential Evaluators; NACES; World Education Services.
- `e_evaluation.html`: Educational Credential Evaluators; NACES; World Education Services.
- `es-evaluation.html`: Educational Credential Evaluators; NACES; World Education Services.
- `home-content-es.html`: NACES.

## Verification

- All 109 original article entries are retained exactly once in the inventory.
- The 48 blocked articles have no migration checkbox; the 60 candidates and one
  visa-scope item remain unchecked. No migration has been marked complete.
- The seven additional exclusions are removed from the main checklist's retained
  article/landing-page lists and explicitly recorded as excluded.
- Original website files, frontend behavior, and production settings were not changed.
