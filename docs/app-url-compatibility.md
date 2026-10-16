# Legacy AET App URL compatibility

Recorded October 16, 2026 from the October 15 source comparison and local HTTP
checks. **The 2026 application does not yet preserve every legacy URL.** The
three public pre-evaluation URLs are retained; formal status, checkout and four
standalone staff-tool URLs still need compatibility work.

## Scope and evidence

Compared the sibling `aet-app` source with `aet-website-2026-dev`, then checked 23
GET requests on the owner's existing `http://localhost:3022` server: 15 application
routes, three public-website aliases and five Chinese-language cases. Requests
used a synthetic Application ID and payment-session placeholder; no applications,
payments, emails or production settings were changed during this audit.

The results below establish route handling, not historical record availability,
authenticated workflow completion or production hostname configuration. No legacy
customer data was migrated. The raw local report was saved at
`/tmp/aet-url-audit-2026-10-15.json`; this document retains its findings because
temporary files are not durable project evidence.

The legacy application host is `https://app.americantranslationservice.com`.
Paths in the table omit the hostname. `ID` and `SESSION` stand for existing query
values, which compatibility routes must preserve.

## Application route mapping

These results use English requests. A redirect to staff login is expected for an
unauthenticated request; it does not verify the authenticated dashboard.

| Legacy path or current comparison route | 2026 local result | Compatibility status |
| --- | --- | --- |
| `/degree-equivalency-tool` | 200 at the same path | Pre-evaluation start retained |
| `/degree-equivalency-tool/application` | 200 at the same path | Pre-evaluation form retained |
| `/degree-equivalency-tool/application/success?applicationId=ID` | 200; query preserved | Pre-evaluation result entry retained |
| `/credential-evaluation-application` | 200 at the same path | Formal application entry retained |
| `/status?applicationId=ID` | 404 | Legacy formal status entry missing |
| `/status-check?applicationId=ID` (2026 comparison route) | 200 | New pre-evaluation lookup; not a replacement for legacy formal status |
| `/checkout?applicationId=ID` | 404 | Legacy checkout entry missing |
| `/checkout/return?session_id=SESSION` | 404 | Legacy payment-return entry missing |
| `/checkout/success?applicationId=ID` | 404 | Legacy checkout confirmation entry missing |
| `/admin/CRM` | 307 to `/admin/login`, then 200 | Staff entry retained, without a locale prefix |
| `/admin/login` | 200 at the same path | Staff login entry retained |
| `/admin/CRM/create-payment-link` | 404 | Legacy standalone tool URL missing |
| `/admin/CRM/import-order` | 404 | Legacy standalone tool URL missing |
| `/admin/CRM/gpa-calculator` | 404 | Legacy standalone tool URL missing |
| `/admin/CRM/degree-equivalency-tool` | 404 | Legacy standalone tool URL missing |

A missing standalone tool URL does not prove the feature is entirely absent.
For example, GPA is available inside the new CRM. Each old URL needs an explicit
mapping to the relevant workspace state or a documented replacement workflow.

## Formal status is a separate compatibility gap

The legacy formal application form navigates to `/status?applicationId=ID`, and
its confirmation email includes that address. The old status component looks up
a formal evaluation application. The 2026 `/status-check` page calls the
pre-evaluation lookup instead. Redirecting all old status links there would send
formal applicants to the wrong lookup.

The new formal receipt is `/credential-evaluation-application/success?id=ID`.
Both its path and query parameter differ from the old entry. A compatibility
adapter must preserve the incoming Application ID, resolve the intended
application type and retain the destination's access checks. A page returning
200 alone is insufficient: existing records, email links and session-expiry
behavior must also be verified. This adapter has not been implemented.

Legacy checkout links likewise need purpose-specific handling. In particular,
the payment-return route consumes `session_id`; it must not become a generic
redirect that discards the payment/application context.

## Language and hostname behavior

Customer pages use English without a prefix, with `/zh` and `/es` for Chinese
and Spanish. The legacy app used no locale prefix. In five Chinese-cookie checks,
the three unprefixed pre-evaluation URLs redirected with 307 to `/zh/...`, then
returned 200; the result URL kept `applicationId`. `/status-check` also redirected
and returned 200, while `/status` redirected and still returned 404.

Staff pages remain English-only at `/admin/*`, including the canonical
case-sensitive `/admin/CRM`. Language-prefixed staff links normalize to the
unprefixed URLs, as verified in the separate staff-routing acceptance.

Keeping the full production address
`https://app.americantranslationservice.com/admin/CRM` also requires domain and
hostname routing. The proposed deployment uses one Vercel project with public
website and app domains; this audit did not implement or verify that setup.
See [the deployment proposal](../README.md#application-domains-and-staff-urls).

## Public website aliases are a different inventory

Three sampled aliases passed: `/e-evaluation.php` redirected with 308 to
`/evaluation`, `/e-pre-evaluation.html` to `/#pre-evaluation`, and `/e-pay.php`
to `/payment`; each destination returned 200. The homepage fragment is retained
in the redirect, but these HTTP checks do not verify scrolling.

These samples do not establish complete public-site parity. The existing
[448-path website inventory](seo-legacy-urls.md) covers public website migration;
it must not be used as evidence that application and staff URLs are all retained.
Internal API paths have also changed. This audit did not verify externally
configured Stripe webhooks, email callbacks or other integration endpoints.

## Remaining work before app-domain cutover

- [ ] Restore `/status?applicationId=ID` with correct formal-application handling.
- [ ] Map all three legacy checkout paths and preserve their query context.
- [ ] Map the four standalone staff-tool URLs to their intended destinations.
- [ ] Test reusable old email URLs with representative authorized records and
  expired/no-session access, not only synthetic route requests.
- [ ] Verify configured integration callbacks and webhook destinations.
- [ ] Implement and test app/public hostname routing, then verify the real domains
  during an authorized cutover. Keep deployment and data migration separate.

## Source references

Legacy paths are relative to the sibling `aet-app` repository:

- `src/app/(frontend)/(aet-app)/components/FCEApplicationForm/index.tsx`:
  formal submission redirects to `/status?applicationId=...`.
- `src/app/(frontend)/(aet-app)/components/Email/templates/ApplicationConfirmation/ApplicationConfirmationEmail.tsx`:
  formal confirmation link.
- `src/app/(frontend)/(aet-app)/components/Email/templates/DEApplicationConfirmation/DEApplicationConfirmationEmail.tsx`:
  pre-evaluation result link.
- `src/app/(frontend)/(aet-app)/components/StatusCheck/index.tsx` and
  `src/app/(frontend)/(aet-app)/checkout/return/route.ts`: formal lookup and
  payment-return behavior.
- `src/app/(payload)/admin/CRM/page.tsx`: the four standalone tool links.
- `middleware.ts`: legacy locale-prefix behavior.

Current implementation references:

- `app/[locale]/status-check/page.tsx` and
  `app/api/pre-evaluation/lookup/route.ts`: pre-evaluation-only lookup.
- `app/[locale]/credential-evaluation-application/success/page.tsx`:
  formal receipt with the `id` parameter.
- `i18n/routing.ts` and `proxy.ts`: customer locale and staff URL handling.
- `lib/legacy-redirects.ts`: public website redirects.
