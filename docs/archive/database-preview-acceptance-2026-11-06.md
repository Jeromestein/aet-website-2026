# Dev Preview shared-database acceptance — November 6, 2026

## Authorization and deployment

The owner authorized the new structure only in isolated dev Preview, a real
pre-evaluation journey, and retention of Production and all old tables.
Isolation is by private schemas and a restricted runtime login in the existing
Supabase project `qrxztgdemfodemlcabcq`, not a separate Supabase project.

- Core activation: `6423e55`; chunked-upload indexing fix: `b003139`.
- Accepted dev deployment: `dpl_9CErCogfTCmRHUbR38t3KHJGwfdF`, Ready.
- Stable entry: https://aet-website-2026-git-dev-meiyutechs-projects.vercel.app
- Deployment: https://vercel.com/meiyutechs-projects/aet-website-2026/9CErCogfTCmRHUbR38t3KHJGwfdF
- Production stayed at `fc1ab0d36236dd8d0bb5120d6ea775306dbe5832`,
  deployment `dpl_3NCtp1ZJBRYxi2puGVLg2eCuQJZR`.
- Only Preview/dev gained `APPLICATION_CORE_MODE=preview` and the verified
  `APPLICATION_CORE_PROVIDER_ACCOUNT` configuration. Existing provider credentials
  and permanent direct Stripe test webhook were reused. No relay was introduced.
- Both configured Git remote dev branches received the code. Main and Production
  environment settings, deployment and aliases were not changed.

## Schema and authority

Applied `20261106230843_preview_application_core.sql` as the guarded
`preview_application_core` migration. It creates only `aet_preview_core` with:

| Table | Responsibility for new pre-evaluation applications |
| --- | --- |
| `aet_core_applications` | Canonical application identity, contact, applicant and status |
| `aet_education` | Canonical education records |
| `aet_service_detail` | Service amount, workflow projection and released result |
| `aet_documents` | File index using storage connection plus Dropbox File ID |
| `aet_payments` | Atomic projection of the retained operational payment ledger |

All five tables have RLS enabled; anonymous access is denied. The runtime login
`aet_preview_runtime` is neither superuser nor BYPASSRLS and has no DML/TRUNCATE
access to production tables in `public`, `preeval`, `evaluation` or `aet`.
Connection guards verify this before accepting core operations.

The existing `aet_preview_preeval` workflow, uploads/attempts, AI, payment/events,
email, session/token and audit tables remain in use. Old application paths retain
`aet_preview_legacy` and `aet_preview_evaluation`. They are not safe to delete.
New applications do not create old business/education compatibility rows.

Before and after this run, old Preview pre-evaluation compatibility records stayed
at 4 and formal compatibility/workflow records stayed at 4. The new core contains
one application, education, service, document and payment. The pre-evaluation
operational application count changed from 4 to 5 as intended. CRM Test shows all
9 applications without double-counting the new workflow projection. No historical
backfill or old-record deletion was performed.

## Real-provider synthetic journey

Application: `da55e841-6cf1-47cd-a4ec-760b8fd46e1d`.
Applicant: `AET Core Preview 20261106 Test`; synthetic contact only. Mail delivery
used the existing controlled Preview recipient, not a customer address.

| Check | Observed result |
| --- | --- |
| Submission | Hosted API creates one canonical application and education; old business projections remain absent |
| File upload | Real customer-UI chunked start/append/finish protocol uploads a 1,410-byte synthetic PDF to Dropbox |
| File identity/download | One File ID index row; authenticated download returns 200 and matching SHA-256 bytes |
| Analysis | One real OpenAI run completes; explicit synthetic credential returns “Unable to determine” as expected |
| Unpaid visibility | Result remains hidden before payment |
| Payment | Browser Stripe Sandbox Checkout pays USD 19.88 with test card; `livemode=false` |
| Webhook | Permanent direct test endpoint processes `checkout.session.completed`; no temporary relay |
| Publication | Payment becomes paid, application completed, saved result released without another AI run |
| Emails | Confirmation and result each have one send attempt; both Resend receipts report `delivered`; subjects are English |
| Customer view | In-app browser shows paid/completed and the published result |
| CRM Test | New row and education/document/payment details agree; all old records remain visible |
| Old customer view | Earlier paid application `1f90291e-f413-4911-95e6-9e5ba8ee8bef` still displays its original result |
| Access boundaries | Unauthenticated protected API access returns 401; unsigned webhook returns 400 |

Payment references:

- Checkout: `cs_test_a1cpOxdxuiP41yjMTaucuov24hdZCgB1MnKJkmutfoGQ31KGILf75woa9s`.
- Event: `evt_1UYwOdJMcR2XIhyn3blZt2Vp`; pending webhook deliveries: 0.
- Core payment mode: `test`, amount: 1,988 cents.
- Payment created: `2026-11-06 23:17:26.514596 UTC`.
- Paid/updated and Stripe audit: `2026-11-06 23:18:11.796381 UTC`.
- Result released: `2026-11-06 23:18:14.712666 UTC`.
- Confirmation receipt: `01a1b326-87e9-7132-ae7c-c2c6947e754e`.
- Result receipt: `01a1b327-de5a-7dd3-b92c-72066e08ef60`.

Visual evidence was captured for customer results, CRM list/payment detail and the
unchanged Production deployment. The customer completed a normal browser return;
this run does not claim close-browser callback recovery coverage.

## Regression and implementation correction

The actual UI sends even small files through the chunked upload route. The first
core implementation indexed ordinary/shared-finish uploads but omitted that path.
Commit `b003139` records the Dropbox File ID after verified chunk completion in the
same transaction as readiness, and resolves core retry paths through File ID.
This correction was deployed before creating the accepted cloud application.

- 160 tests across 12 focused files passed with disposable PostgreSQL fixtures.
- Coverage includes backfill, scoped reads, mixed old/new cohorts, runtime authority,
  chunked finish/replay, upload fencing, publication/refunds and configuration guards.
- TypeScript and whitespace checks passed. No local production build was run.
- Provider mocks in regression tests are distinct from the real hosted acceptance above.

## Follow-up evidence

The later [hosted recovery acceptance](preview-recovery-acceptance-2026-11-06.md)
verifies upload replacement and paid-result publication recovery on the same
`b003139` deployment. Its synthetic application brings CRM Test to 10 records.
The original run's limits and counts below remain its historical scope.

## Remaining boundaries and rollback

Historical reconciliation/backfill, formal/translation core writers, general
`/application` pre-evaluation integration, uncertain-folder confirmation UI and old
table retirement remain open. Hosted failure injection, cancellation/refunds and
mobile recovery were not repeated here; isolated regression covers the relevant
recovery paths. Synthetic AI success does not establish academic assessment accuracy.
Production activation, real charging and real-customer mail routing were not tested
or authorized by this run.

After creating canonical applications, do not disable the core flag or roll back
to an old-only reader: that would hide those applications. Preserve the compatible
reader and core data; if needed, pause new intake and deploy a compatible fix.
See [activation and rollback guidance](../database-rehearsal.md).
