# Credential evaluation application

Updated November 17, 2026. New applications use the three-step `/application`
entry. The former `/credential-evaluation-application` form redirects to
`/application?service=evaluation` after the existing release gate.
Public Production links still lead to the old portal; this cleanup does not
activate the new workflow. See [status](status.md), [checklist](migration-checklist.md)
and [intake testing](credential-intake-testing.md).

## Current customer access

The accepted six-table Preview uses the saved application ID and reusable
confirmation link. It does not issue a customer session cookie or require an
email-token exchange. The ID/link grants customer access to that application;
it is not proof of the holder's identity and should be shared only with the applicant.

Do not restore the former 24-hour Cookie, same-browser requirement, single-use
link, or session/token tables. The [design policy](design/business-ui.md#customer-access-policy)
applies to both evaluation services. Employee authentication is separate.

`/access` and `/evaluation-access` retain localized recovery instructions for old
bookmarks. They clear obsolete token fragments and link to Status/contact; they
cannot infer an application ID from an old token. Saved ID-based Status/result
links remain supported. Token consumption and the old customer logout API return
410 without changing employee sessions. The old formal submission API also
returns 410; use the unified intake instead. Existing release gates take priority.

## Retained workflow and permission checks

- Staff login and office scope protect reviews, quotes, report upload/publication
  and management operations. A customer application link never grants staff access.
- Customers see only the selected application's supporting files and released
  report. Unpublished PDFs and staff notes remain private.
- Payment amount, signature, ownership, replay handling and paid/published-result
  checks are unchanged. Stripe Checkout sessions are not customer login sessions.
- Legacy non-six-table customer access fails closed. Retained legacy business
  readers and historical migration fixtures do not recreate customer authentication.
- All existing databases and migrations remain unchanged. Old Production business
  tables must remain intact. Supabase employee authentication tables are retained.

## Validation

Run the six-table formal workflow on a disposable local PostgreSQL instance:

```sh
APPLICATION_CORE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin pnpm test:evaluation:integration
```

Use your installed PostgreSQL bin directory. The runner refuses missing toolchains
instead of silently skipping integration tests. `test:evaluation:workflow` runs
the same current suite; `test:preeval:integration` runs the current pre-evaluation
suite. Providers are mocked and temporary databases are removed by the tests.

The earlier local multi-table integration, lifecycle, browser-fixture and AI-live
runners that depended on customer sessions have been retired. Their historical
results remain in Git history and dated acceptance records; do not run those
commands or reinstate their authentication fixtures in the application runtime.

The [November 12 hosted acceptance](archive/unified-credential-preview-2026-11-12.md)
records the complete synthetic customer/staff/payment/report journey before this
cleanup. Later local regression checks do not constitute fresh hosted acceptance.
No deployment, public opening, live payment or database change is implied.
