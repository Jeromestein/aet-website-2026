# Customer access cleanup — November 17, 2026

## Scope

Owner-authorized local cleanup on `main`; commit separately, do not push.
No hosted database writes, schema migrations, deployment or provider changes.
Historical migration SQL and archived data are retained. Employee authentication,
office access, file ownership, signed Stripe callbacks and paid/published-result
checks remain required.

Removed customer Cookie creation/reading, one-use token exchange, 24-hour access
claims, the old four-step formal form and obsolete session-based test runners.
The former formal form redirects to the unified intake after its release gate.
Retired exchange/submission APIs return 410 when the release gate is open; closed
release gates still take precedence. Old token-only pages clear the fragment and
point customers to the relevant status lookup or AET support.

The six-table runtime continues using reusable application-ID links. These links
are access credentials, not identity verification. Legacy noncompact customer
routes fail closed instead of becoming unauthenticated during cleanup. Employee
access to legacy records remains subject to existing office permissions. Staff
sign-out buttons call only the employee logout endpoint; the obsolete secondary
customer logout call and dead customer logout branch are removed.

## Verification

- TypeScript and all three locale checks passed (593 messages per locale).
- Broad regression with disposable local PostgreSQL: 799 tests passed, 174 skipped;
  four failures in the existing `application-core-six-preview.test.ts` fixture.
  Calendar and the release-boundary file were excluded from this broader rerun
  after their unrelated failures were identified below.
- Release-boundary rerun excluding only the stale email-template route expectation:
  27 passed, one skipped. Employee auth and application release protection remain.
- Final focused retirement/staff regression: 56 tests passed. Checks verify
  ignored old Cookies, reusable links, denied
  staff operations, office scope, missing applications and 410 responses without
  Cookie issuance or database writes.
- Seven targeted database suites cover six-table/formal flows, preservation of
  historical data, uploads, payments and result publication: 121 cases passed
  across runs. The Production-runtime fixture explicitly opens its synthetic
  local release gate; it does not configure hosted Production.
- In-app browser: desktop formal recovery page and its status link; 390 px
  pre-evaluation recovery page and its status link; cleared old token fragment;
  old formal form redirects to the unified evaluation choice. Passed.
- Local visual server used disabled providers and an unused local database URL.
  Turbopack returned 404 for the local route; the temporary webpack dev server
  rendered the pages correctly and was stopped after verification.

Provider calls were mocked in automated tests. No fresh hosted upload, charge,
email or authenticated CRM browser session was run. Optional snapshot/provider
suites remain skipped when their explicit fixtures are absent. This is local
cleanup acceptance, not a Production launch or a completely green full suite.

## Existing test issues outside this commit

- `tests/calendar.test.ts`: expects 20 events, current calendar has 22.
- `tests/application-release.test.ts`: includes `email-template-preview` in the
  old 503 application-gate expectation; that separately gated route returns 404.
- `tests/application-core-six-preview.test.ts`: still rejects `main` and supplies
  an old Preview configuration. Four assertions fail before runtime activation
  with `Core runtime requires the restricted configured Preview` (and outdated
  expected error text). The activation logic is unchanged by this cleanup.

Do not restore customer sessions to address these fixtures. Update them separately
against current Calendar, email-gallery and configured main Preview behavior.
