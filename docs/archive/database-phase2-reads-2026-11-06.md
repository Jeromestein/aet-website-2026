# Phase-two shared reads — November 6, 2026

Starting point: `dev` at `9b8a8be`. Scope is the dedicated pre-evaluation cohort
already mapped in phase 1. Hosted databases, runtime data sources and routes are
unchanged. No new SQL migration, credentials, policies or provider calls.

## Implementation

- [Core shadow reader](../../lib/application-core/reader.ts): explicit database
  injection, disposable-database guard, read-only repeatable-read transactions,
  customer application binding, staff office/unassigned scope and explicit output
  allowlists. The caller must supply a previously authenticated server context;
  this module is not an authentication endpoint.
- [Shared CRM engine](../../lib/crm/workspace-server.ts): both record sources use
  the same scoping/filter/search/pagination/statistics/export query. The existing
  entry still supplies legacy/workflow records. No live switch or environment flag
  enables new tables remotely.
- [Comparison](../../lib/application-core/compare.ts): compare already-authorized
  primary responses; return field paths only, never customer values. Do not call
  the old Status reader from shadow code: it can retry publication or enqueue mail.
- Core reads use normalized names, education, files and payment ledgers. Existing
  operational AI/upload/current-payment/current-result versions remain release
  guards. A stale result or changed office fails closed before backfill catches up.
- Comparison found timestamp precision loss in the phase-one JavaScript round trip.
  Backfill now transports original PostgreSQL timestamp text with explicit text
  casts, preserving microseconds for application/submission/payment timestamps.

## Acceptance

106 tests passed across eight files; TypeScript and diff whitespace checks passed.
The new integration case uses 26 synthetic applications, with 24 assigned to Boston,
plus Los Angeles and unassigned controls. It exercises second-page reads and
out-of-range page clamping, all workspace views, attention/completed filters,
name/date sorting, escaped search, CSV export data, aggregate counts and office
permissions. Existing upload/publication/refund tests remain enabled.

Status comparison covers identity, education, payment/AI/upload state, document
issue flag, eligible result/version, application timestamps and file identity/name/
MIME/size/state. UI locale is intentionally absent from the target. File creation
metadata is excluded because source upload-attempt timestamps are not reliable
file creation times; unknown target creation times remain NULL. This is an
explicit compatibility boundary, not a complete wire-format replacement.

The suite verifies customer cross-application denial, unassigned-office access,
empty office grants, immediate denial after an office change, private-field
omission, stale-input result suppression and no additional audit/email/AI records
from shadow reads. Database transactions enforce read-only behavior.

Commands:

```sh
APPLICATION_CORE_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
PREEVAL_PUBLICATION_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
PREEVAL_F4_TEST_PG_BIN=/opt/homebrew/opt/postgresql@15/bin \
pnpm exec vitest run tests/application-core-rehearsal.test.ts \
  tests/preeval-publication.test.ts tests/preeval-upload-fencing.test.ts \
  tests/preeval.test.ts tests/crm-workspace.test.ts tests/customer-status.test.ts \
  tests/crm-identity.test.ts tests/crm-details.test.ts
pnpm exec tsc --noEmit --incremental false
```

All databases are owned temporary PostgreSQL clusters; Stripe/Dropbox/AI/email
use synthetic responses. No browser flow or real provider acceptance is claimed.
No UI, route or deployed data source was changed; no development server was started.

## Resolved education-date discrepancy and remaining gates

Initial comparison found that CRM used workflow study dates after legacy staff
edits, while Status preferred edited legacy dates. The CRM pre-evaluation projection
now uses the matching legacy education's start/end dates, exactly as Status does,
and falls back to workflow values only when the matching record is absent.

The final isolated rerun passed all **106 tests across eight files**, TypeScript
and whitespace checks. Regression assertions cover edited start and end dates,
CRM/Status/core-read equality, searching either new date, export data, unchanged
workflow values and fallback after removing the synthetic legacy education.
This fixes the discrepancy rather than excluding dates from comparison. No hosted
database was accessed or changed, and the temporary test clusters were removed.

Formal/translation backfill and customer projections are not implemented here;
the core CRM reader deliberately includes pre-evaluation only. Mixed-source full
CRM cutover, historical prices/accounts, File ID reconciliation, unknown file
creation times and all office-role deployment policies remain later gates. Do not
claim parity for unbackfilled cohorts. Phase 3 may move one verified pre-evaluation
cohort only after these applicable differences and write ownership are resolved.
