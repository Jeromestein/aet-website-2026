# Blog index content

The September 30, 2026 index lists exactly the 60 candidates from
`docs/migration-blog-inventory.md`. The 48 excluded articles, the held visa
article and the seven standalone exclusions are not included. The default list
shows the 10 credential-evaluation articles. Other topics and all 60 entries
remain available through the secondary topic selector. Credential evaluation
drives the hero, featured guide and ordering.

`articles.json` preserves inventory titles and slugs. Topic and city labels are
editorial index classifications. Titles and destination articles remain English;
the surrounding interface is localized into English, Chinese and Spanish.
No author or publication date is invented. The featured guide's short editorial
summary describes only the report types and purposes covered in its source.

All 60 destination URLs were checked with HTTP GET on September 30, 2026:
58 root HTML URLs and two PHP URLs returned 200 without the legacy homepage
fallback. The corresponding 58 `/blog/*.php` URLs redirected to `/home.php`;
the index therefore uses their available root HTML copies. The two working PHP
destinations are `fastest-uscis-ready-credential-evaluation-services-2026` and
`h1b-expert-opinion-letters`. Each record stores the verified path explicitly.
Availability does not establish content accuracy or publication approval.

## First article pilot

`boston-foreign-credential-evaluation-services.en.json` contains the complete
normalized English prose from the legacy PHP include
`americantranslationservice.com/blog/boston-foreign-credential-evaluation-services-content.html`.
The title comes from its H1. Original prose order and wording are unchanged;
inline headings and report-type labels become semantic headings. Source and root
HTML copy were rechecked against the documented exclusion rule.

The local route is `/blog/boston-foreign-credential-evaluation-services`.
The featured card and list card use the current locale's route. The legacy root
HTML and blog PHP paths have local permanent redirects with query preservation.
Article bodies are intentionally English-only across all locales, without
language-availability notices or planned translations. Shared navigation and index
controls remain localized. Chinese and Spanish article routes remain noindexed
because they duplicate the English body. Business-claim review and owner acceptance
are still pending.
This is one local pilot, with 59 article bodies still on the old site.

Both original images are retained byte-for-byte under `public/images/blog/`:

- `Boston13.jpg` becomes `boston-evaluation-sample.jpg`: an anonymized historical
  report, not an office photograph. The caption identifies historical addresses.
- `Boston11.jpg` becomes `boston-reviews-archive.jpg`: a historical review capture,
  shown behind a disclosure with an explicit historical-rating notice.

No current rating, processing time, author or publication date is inferred.
Report-type wording and promotional claims are preserved for the owner's content
review; this pilot does not establish their current accuracy. Contact actions
point to the current Boston contact card and evaluation service page.

Before the production domain is replaced, migrate retained article bodies and
change these links, or retain the legacy host separately. The current absolute
links alone will not preserve articles after a domain replacement.
