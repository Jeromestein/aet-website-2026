# Legacy SEO URL Reconciliation

Local source audit, September 30, 2026. Includes all 208 sitemap entries (deduplicated by path), root HTML/PHP files, blog PHP entries, Apache aliases/targets and new application redirects. Static image directories are not crawl-page inventory. No old PHP is executed.

## Disposition and deferred scope

- `redirect`, `normalize`, and `retained asset` have implemented destinations.
- `removed scope`, `archive`, `internal source`, and `retired endpoint` are intentionally absent from the new public page catalog. They return a genuine 404 unless mapped above. Do not redirect them to the homepage.
- Owner decision, October 1, 2026: `review content` and `review asset` are deferred for possible future pages. They are not current tasks or release blockers. Preserve sources and inventory; no migration, permanent retirement or deletion is approved by this deferral.
- The existing blog review lists 30 held article families plus one visa family. Chinese source-only variants and other standalone findings also remain explicit below.
- `owner verification` requires the owner to confirm Search Console verification. No token is copied or account access changed by this audit.
- Root PDF samples differ from the already retained `/down/` versions. They are not treated as byte-identical aliases.

| Status | URLs |
| --- | ---: |
| archive | 2 |
| internal source | 54 |
| normalize | 1 |
| owner verification | 1 |
| redirect | 277 |
| removed scope | 24 |
| retained asset | 6 |
| retained page | 1 |
| retired endpoint | 2 |
| review asset | 9 |
| review content | 71 |

## Complete inventory

| Old path | Status | Destination | Evidence / reason |
| --- | --- | --- | --- |
| `/BachelorDegreeCertificate.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/BirthCertificate.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/GCSE-equivalent-in-the-USA.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/Indian-degree-evaluation-in-USA.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/MarriageCertificate.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/Moroccan-high-school-diploma-equivalent-in-USA.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/Pakistani-degree-equivalency-in-USA.html` | redirect | `/blog/Pakistani-degree-equivalency-in-USA` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/Philippine-high-school-diploma-equivalent-in-USA.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/Sample_NewYork.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/Sample_cer.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/academic_paper.pdf` | removed scope | — | sitemap. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/apply.php` | retired endpoint | — | source file. Legacy application backend; the new site links to the existing application portal |
| `/ata-certified-translation-services.html` | redirect | `/blog/ata-certified-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/backup-best-education-credential-evaluation-agencies.html` | archive | — | source file. Historical backup; excluded from index and migration |
| `/best-credential-evaluation-services.html` | redirect | `/blog/best-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog` | retained page | — | Apache target. Canonical blog index |
| `/blog/` | normalize | `/blog` | sitemap. Framework trailing-slash normalization |
| `/blog/GCSE-equivalent-in-the-USA.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/Indian-degree-evaluation-in-USA.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/Moroccan-high-school-diploma-equivalent-in-USA.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/Pakistani-degree-equivalency-in-USA.php` | redirect | `/blog/Pakistani-degree-equivalency-in-USA` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/Philippine-high-school-diploma-equivalent-in-USA.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/ata-certified-translation-services.php` | redirect | `/blog/ata-certified-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/best-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/best-places-to-get-your-foreign-degree-evaluated-for-us-employment.php` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/boston-affordable-cheap-translation-services.php` | redirect | `/blog/boston-affordable-cheap-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-ata-certified-translation-and-interpretation.php` | redirect | `/blog/boston-ata-certified-translation-and-interpretation` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-best-certified-translation-services-companies.php` | redirect | `/blog/boston-best-certified-translation-services-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-certified-and-notarized-translation-services.php` | redirect | `/blog/boston-certified-and-notarized-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-certified-chinese-translation-service.php` | redirect | `/blog/boston-certified-chinese-translation-service` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-certified-spanish-translation-services.php` | redirect | `/blog/boston-certified-spanish-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-foreign-credential-evaluation-services.php` | redirect | `/blog/boston-foreign-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-foreign-language-interpreter-agency.php` | redirect | `/blog/boston-foreign-language-interpreter-agency` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-international-credential-evaluation-services.php` | redirect | `/blog/boston-international-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-interpreting-agencies-companies.php` | redirect | `/blog/boston-interpreting-agencies-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-professional-translation-services-agency.php` | redirect | `/blog/boston-professional-translation-services-agency` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-technical-translation-services-company.php` | redirect | `/blog/boston-technical-translation-services-company` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-top-certified-translation-companies.php` | redirect | `/blog/boston-top-certified-translation-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-uscis-certified-translation-services.php` | redirect | `/blog/boston-uscis-certified-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/boston-visa-application-process-services.php` | removed scope | — | source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/blog/california-barbercosmo-credential-evaluation-and-translations.php` | redirect | `/blog/california-barbercosmo-credential-evaluation-and-translations` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/california-best-education-credential-evaluation-services.php` | redirect | `/blog/california-best-education-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/cheap-credential-evaluation-services.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/credential-evaluation-for-education.php` | redirect | `/blog/credential-evaluation-for-education` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/credential-evaluation-for-emloyment.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/dallas-best-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/diploma-translation-and-evaluation.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/down/applicationform.pdf` | redirect | `/down/applicationform.pdf` | app redirect, sitemap. Retained equivalent page or section |
| `/blog/e-aet-expert-opinion-letter.php` | redirect | `/blog/e-aet-expert-opinion-letter` | app redirect, source file. Retained equivalent page or section |
| `/blog/eb-2-niw-credential-evaluation.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/eb-2-niw-expert-opinion-letters.php` | redirect | `/blog/eb-2-niw-expert-opinion-letters` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/education-credential-evaluation-purposes.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/education-evaluation-h1b-for-india.php` | redirect | `/blog/education-evaluation-h1b-for-india` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/education-evaluation-h1b.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/evaluation_report.pdf` | redirect | `/evaluation_report.pdf` | app redirect, sitemap. Retained equivalent page or section |
| `/blog/fastest-uscis-ready-credential-evaluation-services-2026.php` | redirect | `/blog/fastest-uscis-ready-credential-evaluation-services-2026` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/florida-credential-evaluation-services.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/foreign-credential-evaluation-for-immigration.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/foreign-credential-evaluation-in-usa-China.php` | redirect | `/blog/foreign-credential-evaluation-in-usa-China` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/foreign-credential-evaluation-in-usa-csec.php` | redirect | `/blog/foreign-credential-evaluation-in-usa-csec` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/foreign-credential-evaluation-in-usa-gce.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/foreign-credential-evaluation-in-usa-latin-america.php` | redirect | `/blog/foreign-credential-evaluation-in-usa-latin-america` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/foreign-credential-evaluation-in-usa-waec.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/foreign-high-school-diploma-evaluation-in-usa.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/georgia-best-education-credential-evaluation-agencies.php` | redirect | `/blog/georgia-best-education-credential-evaluation-agencies` | app redirect, source file. Retained equivalent page or section |
| `/blog/h1b-expert-opinion-letters.php` | redirect | `/blog/h1b-expert-opinion-letters` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/houston-best-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/how-to-avoid-delays-with-foreign-credential-evaluation.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/how-to-find-translation-services-online.php` | redirect | `/blog/how-to-find-translation-services-online` | app redirect, source file. Retained equivalent page or section |
| `/blog/how-to-get-an-international-evaluation.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/i-140-education-evaluation.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/illinois-best-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/illinois-credential-evaluation-and-translations.php` | redirect | `/blog/illinois-credential-evaluation-and-translations` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/index.php` | redirect | `/blog` | app redirect, source file. Retained equivalent page or section |
| `/blog/international-transcript-evaluation.php` | review content | — | Apache target, sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/los-angeles-affordable-cheap-translation-services.php` | redirect | `/blog/los-angeles-affordable-cheap-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-ata-certified-translation-and-interpretation.php` | redirect | `/blog/los-angeles-ata-certified-translation-and-interpretation` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-best-certified-translation-services-companies.php` | redirect | `/blog/los-angeles-best-certified-translation-services-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-best-education-credential-evaluation-agencies.php` | redirect | `/blog/los-angeles-best-education-credential-evaluation-agencies` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-certified-and-notorized-translation.php` | redirect | `/blog/los-angeles-certified-and-notorized-translation` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-certified-chinese-translation-service.php` | redirect | `/blog/los-angeles-certified-chinese-translation-service` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-certified-spanish-translation-services.php` | redirect | `/blog/los-angeles-certified-spanish-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-credential-evaluation-and-translations.php` | redirect | `/blog/los-angeles-credential-evaluation-and-translations` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/los-angeles-foreign-credential-evaluation-services.php` | redirect | `/blog/los-angeles-foreign-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-foreign-language-interpreter-agency.php` | redirect | `/blog/los-angeles-foreign-language-interpreter-agency` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-international-credential-evaluation-services.php` | redirect | `/blog/los-angeles-international-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/los-angeles-uscis-certified-translation-services.php` | redirect | `/blog/los-angeles-uscis-certified-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-affordable-cheap-translation-services.php` | redirect | `/blog/miami-affordable-cheap-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-ata-certified-translation-and-interpretation.php` | redirect | `/blog/miami-ata-certified-translation-and-interpretation` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-best-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/miami-certified-and-notorized-translation.php` | redirect | `/blog/miami-certified-and-notorized-translation` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-certified-chinese-translation-service.php` | redirect | `/blog/miami-certified-chinese-translation-service` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-certified-spanish-translation-services.php` | redirect | `/blog/miami-certified-spanish-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-credential-evaluation-and-translations.php` | redirect | `/blog/miami-credential-evaluation-and-translations` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/miami-foreign-credential-evaluation-services.php` | redirect | `/blog/miami-foreign-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-international-credential-evaluation-services.php` | redirect | `/blog/miami-international-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-interpreting-agencies-companies.php` | redirect | `/blog/miami-interpreting-agencies-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-language-translation-services.php` | redirect | `/blog/miami-language-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/miami-uscis-certified-translation-services.php` | redirect | `/blog/miami-uscis-certified-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-affordable-cheap-translation-services.php` | redirect | `/blog/new-york-affordable-cheap-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-ata-certified-translation-and-interpretation.php` | redirect | `/blog/new-york-ata-certified-translation-and-interpretation` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-best-certified-translation-services-companies.php` | redirect | `/blog/new-york-best-certified-translation-services-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-certified-and-notarized-translation-services.php` | redirect | `/blog/new-york-certified-and-notarized-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-certified-chinese-translation-service.php` | redirect | `/blog/new-york-certified-chinese-translation-service` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-certified-spanish-translation-services.php` | redirect | `/blog/new-york-certified-spanish-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-foreign-credential-evaluation-services.php` | redirect | `/blog/new-york-foreign-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-foreign-language-interpreter-agency.php` | redirect | `/blog/new-york-foreign-language-interpreter-agency` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-international-credential-evaluation-services.php` | redirect | `/blog/new-york-international-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-interpreting-agencies-companies.php` | redirect | `/blog/new-york-interpreting-agencies-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-professional-translation-services-agency.php` | redirect | `/blog/new-york-professional-translation-services-agency` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-technical-translation-services-company.php` | redirect | `/blog/new-york-technical-translation-services-company` | app redirect, source file. Retained equivalent page or section |
| `/blog/new-york-uscis-certified-translation-services.php` | redirect | `/blog/new-york-uscis-certified-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-affordable-cheap-translation-services.php` | redirect | `/blog/san-francisco-affordable-cheap-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-ata-certified-translation-and-interpretation.php` | redirect | `/blog/san-francisco-ata-certified-translation-and-interpretation` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-best-education-credential-evaluation-agencies.php` | redirect | `/blog/san-francisco-best-education-credential-evaluation-agencies` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-certified-chinese-translation-service.php` | redirect | `/blog/san-francisco-certified-chinese-translation-service` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-certified-spanish-translation-services.php` | redirect | `/blog/san-francisco-certified-spanish-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-credential-evaluation-and-translations.php` | redirect | `/blog/san-francisco-credential-evaluation-and-translations` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/blog/san-francisco-foreign-credential-evaluation-services.php` | redirect | `/blog/san-francisco-foreign-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-international-credential-evaluation-services.php` | redirect | `/blog/san-francisco-international-credential-evaluation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-interpreting-agencies-companies.php` | redirect | `/blog/san-francisco-interpreting-agencies-companies` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-professional-translation-services-agency.php` | redirect | `/blog/san-francisco-professional-translation-services-agency` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-francisco-uscis-certified-translation-services.php` | redirect | `/blog/san-francisco-uscis-certified-translation-services` | app redirect, source file. Retained equivalent page or section |
| `/blog/san-fransico-certified-and-notorized-translation.php` | redirect | `/blog/san-fransico-certified-and-notorized-translation` | app redirect, source file. Retained equivalent page or section |
| `/blog/texas-best-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/transcript-evaluation-service.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/washington-state-education-credential-evaluation-agencies.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/where-to-evaluate-international-degree-in-usa.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/blog/where-to-get-evaluation-for-uscis.php` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/body.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/boston-affordable-cheap-translation-services.html` | redirect | `/blog/boston-affordable-cheap-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-ata-certified-translation-and-interpretation.html` | redirect | `/blog/boston-ata-certified-translation-and-interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-best-certified-translation-services-companies.html` | redirect | `/blog/boston-best-certified-translation-services-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-certified-and-notarized-translation-services.html` | redirect | `/blog/boston-certified-and-notarized-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-certified-chinese-translation-service.html` | redirect | `/blog/boston-certified-chinese-translation-service` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-certified-spanish-translation-services.html` | redirect | `/blog/boston-certified-spanish-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-foreign-credential-evaluation-services.html` | redirect | `/blog/boston-foreign-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-foreign-language-interpreter-agency.html` | redirect | `/blog/boston-foreign-language-interpreter-agency` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-international-credential-evaluation-services.html` | redirect | `/blog/boston-international-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-interpreting-agencies-companies.html` | redirect | `/blog/boston-interpreting-agencies-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-professional-translation-services-agency.html` | redirect | `/blog/boston-professional-translation-services-agency` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-technical-translation-services-company.html` | redirect | `/blog/boston-technical-translation-services-company` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-top-certified-translation-companies.html` | redirect | `/blog/boston-top-certified-translation-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-uscis-certified-translation-services.html` | redirect | `/blog/boston-uscis-certified-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/boston-visa-application-process-services.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/boston2_en.html` | redirect | `/offices/boston` | app redirect, source file. Retained equivalent page or section |
| `/c-944-article.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-articles.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-authentication-article.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c-authentication-article2.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c-california-barbercosmo-credential-evaluation-and-translations.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-chinese-authentication-article.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c-eb-2-niw-credential-evaluation.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-education-evaluation-for-h1b.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-how-to-avoid-delays-with-foreign-credential-evaluation.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-i-140-education-evaluation.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-la-interpretation.html` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-sandiego-interpretation.html` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c-schengen-visa-article.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c_aboutus.html` | redirect | `/zh/about` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_careers.html` | redirect | `/career` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_chinavisaservice.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c_contact.html` | redirect | `/zh/contact` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_evaluation.html` | redirect | `/zh/evaluation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_fee.html` | redirect | `/zh/pricing` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_interpretation.html` | redirect | `/zh/interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_interpretation_case.html` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c_medical.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/c_notarized.html` | redirect | `/zh/certified-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_nus.html` | redirect | `/zh/notarization` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_office_la.html` | redirect | `/zh/offices/los-angeles` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_office_miami.html` | redirect | `/zh/offices/miami` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_office_sf.html` | redirect | `/zh/contact#sf` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_offices.html` | redirect | `/zh/contact` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_paper.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c_pay.html` | redirect | `/zh/payment` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_techtranslation.html` | redirect | `/zh/technical-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_threecertification.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c_translation.html` | redirect | `/zh/general-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/c_visaservice.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/c_writing.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/california-barbercosmo-credential-evaluation-and-translations.html` | redirect | `/blog/california-barbercosmo-credential-evaluation-and-translations` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/california-best-education-credential-evaluation-services.html` | redirect | `/blog/california-best-education-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/cbcevaluation_report.pdf` | retained asset | — | sitemap. Served at the original URL |
| `/cheap-credential-evaluation-services.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/chinese.html` | redirect | `/zh` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/credential-evaluation-for-education.html` | redirect | `/blog/credential-evaluation-for-education` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/credential-evaluation-for-emloyment.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/dallas-best-education-credential-evaluation-agencies.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/diploma-translation-and-evaluation.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/down/BachelorDegreeCertificate.pdf` | retained asset | — | sitemap. Served at the original URL |
| `/down/BirthCertificate.pdf` | retained asset | — | sitemap. Served at the original URL |
| `/down/MarriageCertificate.pdf` | retained asset | — | sitemap. Served at the original URL |
| `/down/applicationform.pdf` | retained asset | — | sitemap. Served at the original URL |
| `/down/evaluation_report.pdf` | redirect | `/evaluation_report.pdf` | app redirect, sitemap. Retained equivalent page or section |
| `/e-aboutus-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-aboutus-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-aboutus-es.php` | redirect | `/es/about` | app redirect. Retained equivalent page or section |
| `/e-aboutus-zh.php` | redirect | `/zh/about` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-aboutus.php` | redirect | `/about` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-aet-expert-opinion-letter.html` | redirect | `/blog/e-aet-expert-opinion-letter` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-authentication-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-authentication-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-authentication-zh.php` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e-authentication.php` | removed scope | — | Apache target, sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e-blog.html` | redirect | `/blog` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e-careers-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-careers.php` | redirect | `/career` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-contact-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-contact-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-contact-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-contact-es.php` | redirect | `/es/contact` | app redirect, source file. Retained equivalent page or section |
| `/e-contact-zh.php` | redirect | `/zh/contact` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-contact.php` | redirect | `/contact` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-course-by-course-evaluation.html` | redirect | `/evaluation#service` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-credential-evaluation-for-uscis.html` | redirect | `/blog/e-credential-evaluation-for-uscis` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-credential-evaluation-partners-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-credential-evaluation-partners.php` | redirect | `/institutions` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-evaluation-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-evaluation-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-evaluation-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-evaluation-es.php` | redirect | `/es/evaluation` | app redirect, source file. Retained equivalent page or section |
| `/e-evaluation-zh.php` | redirect | `/zh/evaluation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-evaluation.php` | redirect | `/evaluation` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-expert-opinion-letter-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-expert-opinion-letter-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-expert-opinion-letter-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-expert-opinion-letter-es.php` | redirect | `/es/expert-opinion-letters` | app redirect, source file. Retained equivalent page or section |
| `/e-expert-opinion-letter-zh.php` | redirect | `/zh/expert-opinion-letters` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-expert-opinion-letter.html` | redirect | `/expert-opinion-letters` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e-expert-opinion-letter.php` | redirect | `/expert-opinion-letters` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-fee-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-fee.php` | redirect | `/pricing` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-interpretation-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-interpretation-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-interpretation-zh.php` | redirect | `/zh/interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-interpretation.php` | redirect | `/interpretation` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-notarized-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-notarized-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-notarized-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-notarized-es.php` | redirect | `/es/certified-translation` | app redirect, source file. Retained equivalent page or section |
| `/e-notarized-zh.php` | redirect | `/zh/certified-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-notarized.php` | redirect | `/certified-translation` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-nus-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-nus-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-nus-zh.php` | redirect | `/zh/notarization` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-nus.php` | redirect | `/notarization` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-office-beijing-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-office-beijing-es.html` | redirect | `/es/offices/beijing` | app redirect. Retained equivalent page or section |
| `/e-office-beijing-es.php` | redirect | `/es/offices/beijing` | app redirect. Retained equivalent page or section |
| `/e-office-beijing-zh.html` | redirect | `/zh/offices/beijing` | app redirect. Retained equivalent page or section |
| `/e-office-beijing-zh.php` | redirect | `/zh/offices/beijing` | app redirect. Retained equivalent page or section |
| `/e-office-beijing.html` | redirect | `/offices/beijing` | app redirect. Retained equivalent page or section |
| `/e-office-beijing.php` | redirect | `/offices/beijing` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-office-boston-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-office-boston-es.html` | redirect | `/es/offices/boston` | app redirect. Retained equivalent page or section |
| `/e-office-boston-es.php` | redirect | `/es/offices/boston` | app redirect. Retained equivalent page or section |
| `/e-office-boston-zh.html` | redirect | `/zh/offices/boston` | app redirect. Retained equivalent page or section |
| `/e-office-boston-zh.php` | redirect | `/zh/offices/boston` | app redirect. Retained equivalent page or section |
| `/e-office-boston.html` | redirect | `/offices/boston` | app redirect. Retained equivalent page or section |
| `/e-office-boston.php` | redirect | `/offices/boston` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-office-los-angeles-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-office-los-angeles-es.html` | redirect | `/es/offices/los-angeles` | app redirect. Retained equivalent page or section |
| `/e-office-los-angeles-es.php` | redirect | `/es/offices/los-angeles` | app redirect. Retained equivalent page or section |
| `/e-office-los-angeles-zh.html` | redirect | `/zh/offices/los-angeles` | app redirect. Retained equivalent page or section |
| `/e-office-los-angeles-zh.php` | redirect | `/zh/offices/los-angeles` | app redirect. Retained equivalent page or section |
| `/e-office-los-angeles.html` | redirect | `/offices/los-angeles` | app redirect. Retained equivalent page or section |
| `/e-office-los-angeles.php` | redirect | `/offices/los-angeles` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-office-miami-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-office-miami-es.html` | redirect | `/es/offices/miami` | app redirect. Retained equivalent page or section |
| `/e-office-miami-es.php` | redirect | `/es/offices/miami` | app redirect. Retained equivalent page or section |
| `/e-office-miami-zh.html` | redirect | `/zh/offices/miami` | app redirect. Retained equivalent page or section |
| `/e-office-miami-zh.php` | redirect | `/zh/offices/miami` | app redirect. Retained equivalent page or section |
| `/e-office-miami.html` | redirect | `/offices/miami` | app redirect. Retained equivalent page or section |
| `/e-office-miami.php` | redirect | `/offices/miami` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-office-nyc-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-office-nyc.php` | redirect | `/contact#nyc` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-office-san-francisco-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-office-san-francisco.php` | redirect | `/contact#sf` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-pay-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-pay.php` | redirect | `/payment` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-pre-evaluation.html` | redirect | `/#pre-evaluation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-privacy-policy-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-privacy-policy-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-privacy-policy-es.php` | redirect | `/privacy` | app redirect, source file. Retained equivalent page or section |
| `/e-privacy-policy-zh.php` | redirect | `/privacy` | app redirect. Retained equivalent page or section |
| `/e-privacy-policy.html` | redirect | `/privacy` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e-privacy-policy.php` | redirect | `/privacy` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-tech-translation-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-tech-translation-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-tech-translation-zh.php` | redirect | `/zh/technical-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-tech-translation.php` | redirect | `/technical-translation` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-terms-of-use-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-terms-of-use-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-terms-of-use-es.php` | redirect | `/terms` | app redirect, source file. Retained equivalent page or section |
| `/e-terms-of-use-zh.php` | redirect | `/terms` | app redirect. Retained equivalent page or section |
| `/e-terms-of-use.html` | redirect | `/terms` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e-terms-of-use.php` | redirect | `/terms` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-translation-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-translation-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-translation-zh.php` | redirect | `/zh/general-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-translation.php` | redirect | `/general-translation` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/e-visaservice-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-visaservice-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-visaservice-zh.php` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e-visaservice.php` | removed scope | — | Apache target, sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e-writing-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-writing-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e-writing-zh.php` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e-writing.php` | removed scope | — | Apache target, sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e_aboutus.html` | redirect | `/about` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_authentication.html` | removed scope | — | Apache alias, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e_boston.html` | redirect | `/offices/boston` | app redirect, source file. Retained equivalent page or section |
| `/e_careers.html` | redirect | `/career` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_chinavisaservice.html` | removed scope | — | sitemap, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e_contact.html` | redirect | `/contact` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_evaluation-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e_evaluation.html` | redirect | `/evaluation` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_fee.html` | redirect | `/pricing` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_interpretation.html` | redirect | `/interpretation` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_notarized-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/e_notarized.html` | redirect | `/certified-translation` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_nus.html` | redirect | `/notarization` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_office_boston.html` | redirect | `/offices/boston` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_office_nyc.html` | redirect | `/contact#nyc` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_offices.html` | redirect | `/contact` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e_pay.html` | redirect | `/payment` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_pre_evaluation.html` | redirect | `/#pre-evaluation` | app redirect, source file. Retained equivalent page or section |
| `/e_techtranslation.html` | redirect | `/technical-translation` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_testimonials.html` | redirect | `/#stories` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/e_translation.html` | redirect | `/general-translation` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/e_visaservice.html` | removed scope | — | Apache alias, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/e_writing.html` | removed scope | — | Apache alias, source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/eb-2-niw-credential-evaluation.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/eb-2-niw-expert-opinion-letters.html` | redirect | `/blog/eb-2-niw-expert-opinion-letters` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/education-credential-evaluation-purposes.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/education-evaluation-h1b-for-india.html` | redirect | `/blog/education-evaluation-h1b-for-india` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/education-evaluation-h1b.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/english.html` | redirect | `/en` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/es-evaluation.html` | redirect | `/es/evaluation` | app redirect, source file. Retained equivalent page or section |
| `/es/privacy` | redirect | `/privacy` | app redirect. Retained equivalent page or section |
| `/es/terms` | redirect | `/terms` | app redirect. Retained equivalent page or section |
| `/evaluation_report.pdf` | retained asset | — | sitemap. Served at the original URL |
| `/expert-opinion-letter-h1b.html` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/florida-credential-evaluation-services.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/footer-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/footer-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/footer.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/foreign-credential-evaluation-for-immigration.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/foreign-credential-evaluation-in-usa-China.html` | redirect | `/blog/foreign-credential-evaluation-in-usa-China` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/foreign-credential-evaluation-in-usa-csec.html` | redirect | `/blog/foreign-credential-evaluation-in-usa-csec` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/foreign-credential-evaluation-in-usa-gce.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/foreign-credential-evaluation-in-usa-latin-america.html` | redirect | `/blog/foreign-credential-evaluation-in-usa-latin-america` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/foreign-credential-evaluation-in-usa-waec.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/foreign-high-school-diploma-evaluation-in-usa.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/georgia-best-education-credential-evaluation-agencies.html` | redirect | `/blog/georgia-best-education-credential-evaluation-agencies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/google204a3ce937510196.html` | owner verification | — | source file. Legacy Search Console verification file; retain only if owner confirms the property still uses this token |
| `/h1b-expert-opinion-letters.html` | redirect | `/blog/h1b-expert-opinion-letters` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/header-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/header-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/header.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/home-content-es.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/home-content-zh.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/home-content.html` | internal source | — | source file. PHP include/partial; not a standalone migration target |
| `/home-es.php` | redirect | `/es` | app redirect, source file. Retained equivalent page or section |
| `/home-zh.php` | redirect | `/zh` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/home.php` | redirect | `/en` | Apache target, app redirect, sitemap, source file. Retained equivalent page or section |
| `/houston-best-education-credential-evaluation-agencies.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/how-to-avoid-delays-with-foreign-credential-evaluation.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/how-to-find-translation-services-online.html` | redirect | `/blog/how-to-find-translation-services-online` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/how-to-get-an-international-evaluation.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/i-140-education-evaluation.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/illinois-best-education-credential-evaluation-agencies.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/illinois-credential-evaluation-and-translations.html` | redirect | `/blog/illinois-credential-evaluation-and-translations` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/index.php` | redirect | `/` | app redirect, source file. Retained equivalent page or section |
| `/international-transcript-evaluation.html` | review content | — | Apache alias, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/job_employment.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/location/boston/index.html` | redirect | `/zh/offices/boston` | app redirect, sitemap. Retained equivalent page or section |
| `/los-angeles-affordable-cheap-translation-services.html` | redirect | `/blog/los-angeles-affordable-cheap-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-ata-certified-translation-and-interpretation.html` | redirect | `/blog/los-angeles-ata-certified-translation-and-interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-best-certified-translation-services-companies.html` | redirect | `/blog/los-angeles-best-certified-translation-services-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-best-education-credential-evaluation-agencies.html` | redirect | `/blog/los-angeles-best-education-credential-evaluation-agencies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-certified-and-notorized-translation.html` | redirect | `/blog/los-angeles-certified-and-notorized-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-certified-chinese-translation-service.html` | redirect | `/blog/los-angeles-certified-chinese-translation-service` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-certified-spanish-translation-services.html` | redirect | `/blog/los-angeles-certified-spanish-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-credential-evaluation-and-translations.html` | redirect | `/blog/los-angeles-credential-evaluation-and-translations` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/los-angeles-foreign-credential-evaluation-services.html` | redirect | `/blog/los-angeles-foreign-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-foreign-language-interpreter-agency.html` | redirect | `/blog/los-angeles-foreign-language-interpreter-agency` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-international-credential-evaluation-services.html` | redirect | `/blog/los-angeles-international-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/los-angeles-office.html` | redirect | `/offices/los-angeles` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/los-angeles-uscis-certified-translation-services.html` | redirect | `/blog/los-angeles-uscis-certified-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-affordable-cheap-translation-services.html` | redirect | `/blog/miami-affordable-cheap-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-ata-certified-translation-and-interpretation.html` | redirect | `/blog/miami-ata-certified-translation-and-interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-best-education-credential-evaluation-agencies.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/miami-certified-and-notorized-translation.html` | redirect | `/blog/miami-certified-and-notorized-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-certified-chinese-translation-service.html` | redirect | `/blog/miami-certified-chinese-translation-service` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-certified-spanish-translation-services.html` | redirect | `/blog/miami-certified-spanish-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-credential-evaluation-and-translations.html` | redirect | `/blog/miami-credential-evaluation-and-translations` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/miami-foreign-credential-evaluation-services.html` | redirect | `/blog/miami-foreign-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-international-credential-evaluation-services.html` | redirect | `/blog/miami-international-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-interpreting-agencies-companies.html` | redirect | `/blog/miami-interpreting-agencies-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-language-translation-services.html` | redirect | `/blog/miami-language-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/miami-office.html` | redirect | `/offices/miami` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/miami-uscis-certified-translation-services.html` | redirect | `/blog/miami-uscis-certified-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-affordable-cheap-translation-services.html` | redirect | `/blog/new-york-affordable-cheap-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-ata-certified-translation-and-interpretation.html` | redirect | `/blog/new-york-ata-certified-translation-and-interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-best-certified-translation-services-companies.html` | redirect | `/blog/new-york-best-certified-translation-services-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-certified-and-notarized-translation-services.html` | redirect | `/blog/new-york-certified-and-notarized-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-certified-chinese-translation-service.html` | redirect | `/blog/new-york-certified-chinese-translation-service` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-certified-spanish-translation-services.html` | redirect | `/blog/new-york-certified-spanish-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-foreign-credential-evaluation-services.html` | redirect | `/blog/new-york-foreign-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-foreign-language-interpreter-agency.html` | redirect | `/blog/new-york-foreign-language-interpreter-agency` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-international-credential-evaluation-services.html` | redirect | `/blog/new-york-international-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-interpreting-agencies-companies.html` | redirect | `/blog/new-york-interpreting-agencies-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-professional-translation-services-agency.html` | redirect | `/blog/new-york-professional-translation-services-agency` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-technical-translation-services-company.html` | redirect | `/blog/new-york-technical-translation-services-company` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-uscis-certified-translation-services.html` | redirect | `/blog/new-york-uscis-certified-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/new-york-visa-application-process-services.html` | removed scope | — | source file. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/office-locations.html` | redirect | `/contact` | Apache alias, app redirect. Retained equivalent page or section |
| `/office-locations.php` | redirect | `/contact` | Apache target, app redirect. Retained equivalent page or section |
| `/old-index.html` | archive | — | source file. Historical backup; excluded from index and migration |
| `/san-francisco-affordable-cheap-translation-services.html` | redirect | `/blog/san-francisco-affordable-cheap-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-ata-certified-translation-and-interpretation.html` | redirect | `/blog/san-francisco-ata-certified-translation-and-interpretation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-best-education-credential-evaluation-agencies.html` | redirect | `/blog/san-francisco-best-education-credential-evaluation-agencies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-certified-chinese-translation-service.html` | redirect | `/blog/san-francisco-certified-chinese-translation-service` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-certified-spanish-translation-services.html` | redirect | `/blog/san-francisco-certified-spanish-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-credential-evaluation-and-translations.html` | redirect | `/blog/san-francisco-credential-evaluation-and-translations` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/san-francisco-foreign-credential-evaluation-services.html` | redirect | `/blog/san-francisco-foreign-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-foreign-language-interpreter-agency.html` | review content | — | source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/san-francisco-international-credential-evaluation-services.html` | redirect | `/blog/san-francisco-international-credential-evaluation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-interpreting-agencies-companies.html` | redirect | `/blog/san-francisco-interpreting-agencies-companies` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-office.html` | redirect | `/contact#sf` | Apache alias, app redirect, source file. Retained equivalent page or section |
| `/san-francisco-professional-translation-services-agency.html` | redirect | `/blog/san-francisco-professional-translation-services-agency` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-francisco-uscis-certified-translation-services.html` | redirect | `/blog/san-francisco-uscis-certified-translation-services` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/san-fransico-certified-and-notorized-translation.html` | redirect | `/blog/san-fransico-certified-and-notorized-translation` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/sitemap.html` | redirect | `/sitemap.xml` | app redirect, sitemap, source file. Retained equivalent page or section |
| `/texas-best-education-credential-evaluation-agencies.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/transcript-evaluation-service.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/usmle.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/visaapplication.pdf` | removed scope | — | sitemap. Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect |
| `/washington-state-education-credential-evaluation-agencies.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/what_we_can_do.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/where-to-evaluate-international-degree-in-usa.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/where-to-get-evaluation-for-uscis.html` | review content | — | sitemap, source file. Deferred by owner on October 1, 2026; possible future page, not a current release blocker |
| `/yz.php` | retired endpoint | — | source file. Legacy application backend; the new site links to the existing application portal |
| `/zglgrzsqb.pdf` | review asset | — | sitemap. Deferred by owner on October 1, 2026; preserve PDF source for future review, not a current release blocker |
| `/zh/privacy` | redirect | `/privacy` | app redirect. Retained equivalent page or section |
| `/zh/terms` | redirect | `/terms` | app redirect. Retained equivalent page or section |
