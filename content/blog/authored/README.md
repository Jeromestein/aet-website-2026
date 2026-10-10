# Authored Blog articles

New articles live here, outside the legacy importer. `articles.json` supplies
index metadata; `lib/authored-blog-posts.ts` registers server-only article bodies.
The shared Blog route renders their introduction, AI links, sections, and inquiry.
Keep the catalog title and each localized `titles` entry identical to its body
title. Catalog `titles` declares which translated versions are indexable; register
the matching locale body before adding a title. Set `publishedAt` when adding a
new article for publication so date sorting places it correctly; reserve null for
drafts or unknown dates. A requirements-review date is a separate field.

## CSLB guide

Prepared October 8, 2026 at `/blog/cslb-foreign-credential-evaluation`, replacing
the earlier service-page draft, with a publication date of October 8, 2026.
The original JSON contains English; sibling
`.zh.json` and `.es.json` files contain full Chinese and Spanish translations.
Body copy, figures, AI prompts, contact actions, index titles, and sharing cards
follow the selected language. Each version has its own canonical URL, hreflang
alternates, sitemap entry, and BlogPosting language. Legacy articles are unchanged.
All three `/evaluation/cslb` variants redirect permanently, retaining queries;
the article retains the previous credit/documents/process/fees/faq/contact anchors.

The CSLB article includes a generated construction/document illustration and the
existing licensed consultation photograph. Figure data lives with the article;
the lead image also supplies BlogPosting imagery. See [asset provenance and the
generation prompt](../../../ASSETS.md). Captions distinguish illustrative imagery.

Official sources reviewed October 8, 2026:

- [Qualifying experience and education credit](https://www.cslb.ca.gov/Contractors/Applicants/Contractors_License/Exam_Application/Experience_For_Exam.aspx)
- [Original license application, Question 16](https://www.cslb.ca.gov/OnlineServices/WebApplication/InteractivePDFs/ApplicationForOriginalContractorsLicense.aspx)

The guide distinguishes optional education credit, practical experience, evaluator
copies, and official transcripts. AET acceptance and report type remain unconfirmed.
No AICE reference, endorsement, acceptance guarantee, or promised credit appears.
CTAs call the California office, open the localized Contact page, or link to the
existing credential-evaluation application. There are no direct email CTAs or
email templates. The website does not submit an inquiry or change the portal.

AI links use the public canonical article URL, never local previews or campaign
parameters. ChatGPT, Perplexity, and Google receive a query; Claude and Grok open
their entry pages with a visible copyable-question fallback. Platform sign-in and
prefill behavior still need interactive verification; the local browser check was
blocked. No AI response, indexing, or recommendation is promised.

`ArticleAction` queues `blog_contact_click`, `blog_ai_click`, and `blog_ai_copy`
in `dataLayer`, with article, locale, method, and placement only. Contact methods
are `phone`, `contact_page`, and `application`. The shared locale layout now loads
GA4 tag `G-7SF10M7GBE`. Phone and Contact-page buttons additionally send the
owner-provided `contact_us` event with those same non-personal fields. Application
and AI clicks remain queue-only. Same-tab web navigation waits for Google's event
callback or an independent two-second fallback; phone, modified and new-tab
clicks retain native behavior. Missing or failing analytics never blocks a link.
These events represent contact intent, not completed applications, qualified
leads or sales. GA4 receipt and Google Ads conversion import remain unverified.
