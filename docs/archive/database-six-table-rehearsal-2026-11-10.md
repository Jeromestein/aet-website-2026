# Six-table pre-evaluation acceptance

Date: November 10, 2026. Branch: `dev`.
Scope: disposable local PostgreSQL only. Hosted Preview and Production databases,
configuration and deployments are unchanged. No commit or push is included.

## Accepted scope

Remove `aet_audit` and `aet_rate_limits`, following the previous payment-event
retirement. The target contains five business tables and one AI execution table:
`aet_core_applications`, `aet_education`, `aet_service_detail`, `aet_documents`,
`aet_payments` and `aet_ai_runs`.

The six-table runtime records no operation/actor history and applies no request-
frequency quota. No replacement history array, counter table or external limiter
is introduced. Current notes, material requests, result versions, notification
state and confirmed test exemptions remain on service records. Authentication,
office/customer authorization, input/file limits and Stripe signature, ownership,
amount, duplicate and refund checks remain intact. Existing failed-upload and
payment/result/notification recovery paths are retained.

## Migration and boundaries

[simplify-preeval-six.ts](../../scripts/database/simplify-preeval-six.ts) accepts
only the exact eight-table source in owned `aet_core_rehearsal`, with session role
`core_rehearsal` over a local Unix socket. A serializable transaction locks the
source tables, rejects other service types, captures old audit/counter rows for
an external migration archive, and drops both tables without CASCADE or views.
The full-copy harness saves this archive privately outside Git. It is historical
migration evidence, not a replacement runtime log.

`activateSixTableRehearsal` separately checks the exact six-table inventory before
activating the runtime. No environment flag or HTTP endpoint enables this mode.
Legacy and hosted adapters retain their existing behavior pending a separately
verified hosted cutover.

The full-copy run reuses the previously captured November 10 Preview snapshot and
provider evidence; it does not capture a newer copy or call real providers.

| Stage | Complete isolated copy | Shared pre-evaluation tables |
| --- | ---: | ---: |
| Restored snapshot | 32 | Existing separated schemas |
| Initial convergence | 25 | 13 |
| Compact workflow | 21 | 9 |
| Payment-event retirement | 20 | 8 |
| Operation-history/counter retirement | **18** | **6** |

The remaining twelve tables are ten formal-evaluation workflow tables and two
legacy formal tables. Four formal applications remain unchanged. Six pre-evaluation
applications retain their IDs, CRM visibility, payments and published results.
Staff auth, CMS and unrelated public/system tables are outside this count. Hosted
Preview remains at the last verified 32-table state; zero hosted tables were
removed. Production was not queried.

## Verification

**389 tests across 22 files pass**, with all selected local PostgreSQL fixtures
enabled. `pnpm exec tsc --noEmit --incremental false` passes. No build was run.

- [Six-table runtime suite](../../tests/application-core-six.test.ts): 29 cases,
  using real local PostgreSQL and simulated providers after physical retirement.
  Includes 35 repeated lookups beyond the old request quota, staff edits without
  actor history, empty staff history responses, and rejection of retired-table
  lookups. Existing invalid-input, access, upload, payment, refund and result/mail
  recovery cases remain enabled.
- [Full-snapshot suite](../../tests/application-core-full-snapshot.test.ts): 17
  cases, including rollback when the second DROP fails, reconciliation of archived
  rows, the 18-table inventory, CRM/payment/service/formal-row parity and signed
  callback replay without audit dependencies. The no-charge fixture cannot create
  Checkout; repeated callbacks do not rewrite effective payment/release state or
  resend notifications.
- Combined focused migration/runtime run: 46 cases across these two files pass.
  The broader 389-case run also exercises the earlier migration stages and legacy
  adapters. Local fixtures block unplanned provider fetches and clean up clusters.
- Planned Mermaid source and regenerated SVG contain six entities. Legacy/current
  diagrams remain historical. Viewer dimensions match the regenerated SVG.

Private verification logs: `/private/tmp/aet-six-regression.log` and
`/private/tmp/aet-six-types.log`. The default rehearsal runner selects the six-table
suite. Full-copy verification additionally requires the private snapshot path.

No application UI was changed or browser-tested in this backend-only change.
Staff reads return `audit: []`; existing staff screens may still show an empty
history section or old explanatory copy until the hosted UI cutover. Removing
that presentation is separate from disabling history collection.

## Remaining work

Before hosted activation, take a fresh consistent snapshot and recoverable backup,
verify roles and old links, and run the real Preview customer/staff/provider journey.
Converge formal evaluation and translation before retiring their remaining twelve
tables. Operation history and request limiting are not launch requirements; revisit
only if a concrete business need arises. No cron, tracking dashboard or replacement
logging/limiting service was added.
