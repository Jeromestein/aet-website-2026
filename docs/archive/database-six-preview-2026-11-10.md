# Six-table dev Preview cutover acceptance

Prepared November 10; activated and accepted November 11, 2026 (Pacific time).

## Scope and current state

The owner authorized six-table dev Preview activation and a complete real-provider
pre-evaluation journey. Production must remain unchanged. The owner subsequently
pointed to the authenticated Chrome AET profile; Vercel is accessible there despite
an expired local CLI token and unauthenticated in-app browser.

The deployed Production view still identifies commit `fc1ab0d` and deployment
`3NCtp1ZJBRYxi2puGVLg2eCuQJZR`. No Production environment or deployment was edited.
Supabase project `qrxztgdemfodemlcabcq` contains separate private Preview schemas;
its `aet_preview_runtime` role has neither superuser/BYPASSRLS nor write permissions
on Production business tables.

A fresh consistent snapshot was captured at 2026-11-11 01:01 UTC. It contains
32 tables, six pre-evaluations and four formal cases. Provider evidence was refreshed:
six Dropbox files (File ID, revision and byte hash), five Stripe Sandbox payments
and thirteen Resend receipts match. No real customer submission or provider send
was made during these checks.

The Preview-only database archive was restored into disposable PostgreSQL; all
32 tables restored successfully. Private backups live in the ignored directory
`.local/backups/six-preview-20261110/`; no rows or credentials are committed.
The prepared six-table artifact preserves six applications, six education/service/
document/AI records and five payment records. Its one confirmed no-charge test
application has no fabricated payment.

## Implementation

- `APPLICATION_CORE_MODE=six-preview` is accepted only for Vercel dev Preview.
  Next.js startup verifies the restricted role, absence of Production write grants,
  exact six-table inventory, RLS and client access restrictions before serving.
  Until startup verification completes, the six-table path fails closed.
- Core SQL uses the selected private schema rather than a hardcoded local schema.
  Existing local, thirteen/nine/eight-table and five-core Preview paths remain
  compatible when the new opt-in is absent.
- `prepare-six-preview.mts` transforms the full snapshot only in an owned temporary
  local cluster, preserving the existing migration guards. It exports schema/data
  artifacts privately and makes no hosted writes.
- `import-six-preview.mts` requires the exact project, exact six-table artifact,
  unchanged source rows under locks, an empty target and frozen old writers.
  It imports rows transactionally and compares every row before commit.
- Migration `preview_six_table_core` creates only six empty private tables in
  `aet_preview_shared`. It has been applied through Supabase. All six have RLS,
  no anonymous/authenticated table access, and scoped server-role permissions.

## Hosted activation and retirement — November 11

- Runtime commit: `3128a83`, pushed to both configured dev remotes.
- Vercel deployment: `G2XntQqf6NKy2vV2Fqd9nq9mdf6D`, **Ready** in 56 seconds.
- Only the existing Preview/dev `APPLICATION_CORE_MODE` changed to `six-preview`.
- All 32 source tables still matched the original snapshot after the owner's
  Vercel identity verification. The approved maintenance window froze old writers
  before deployment; the new shared writer is now active.
- Historical import preserved six applications and six education, service,
  document and AI records, plus five Stripe payments. The no-charge test fixture
  remains explicitly waived, with no fabricated payment.
- After hosted acceptance and explicit owner deletion confirmation, migration
  `retire_verified_preview_preeval_tables` removed **20 old Preview tables**:
  five in `aet_preview_core`, twelve in `aet_preview_preeval`, and three legacy
  `aet_core_*` tables in `aet_preview_legacy`.
- The exact retirement SQL passed a restored-backup rehearsal first. It locks and
  fingerprints each frozen source, checks migrated application/file/payment IDs,
  uses no CASCADE and requires exactly eighteen retained tables. Timestamp values
  retain microsecond precision; fingerprint ordering uses explicit C collation.
- Actual hosted inventory is now **18 = 6 shared + 10 evaluation + 2 legacy formal**.
  This is 32 original tables plus six replacements minus twenty retired tables.
  Empty old schemas/functions are not tables. Staff auth, legacy CMS, Supabase
  internals and unrelated/Production tables are outside this inventory.

## Real-provider acceptance

Synthetic application: `4701a119-18ca-4c38-8135-a4c8eb40c614`.

| Check | Observed result |
| --- | --- |
| Submit and retry | One application; identical request retries preserve its ID |
| Dropbox | Chunked PDF upload; saved File ID; downloaded SHA-256 matches input |
| AI | One completed real analysis; synthetic document correctly returns Unable to determine |
| Customer payment gate | Unauthenticated customer API hides result before payment and shows it afterward |
| Stripe | Sandbox Checkout USD 19.88; permanent direct webhook; paid state and released result |
| English mail | Confirmation and result both confirmed delivered by Resend to the controlled test recipient |
| Browser | AET Chrome shows paid/completed customer page and matching CRM Test row; no UI changes |
| Old links | All six migrated historical pre-evaluation links remain readable, including the waived test fixture |
| Replay | Stripe CLI resends the actual test event to the existing endpoint; no duplicate payment, AI, result version or mail |

These checks were repeated after retirement where applicable. A second synthetic
application (`e9dedcd0-a89a-4a32-835f-b02286328974`) verified fresh submission and
cancellation after the old tables were absent. Repeated submission of the first
case still resolves to its original ID. All twelve retained formal Preview tables
remain row-for-row equal to the original snapshot. The runtime still has no
Production-table write permissions.

The full flow used HTTP for submission/upload and Chrome for Stripe Sandbox
payment plus customer/CRM visual checks. The Chrome profile is staff-authenticated;
customer-only result visibility was therefore separately verified through requests
without staff cookies. No real credential or real charge was used.

A locally signed replay was rejected with `invalid_signature`: the local signing
secret differs from the configured hosted endpoint. No secrets were changed.
The successful official Stripe resend verifies the actual hosted integration.

## Verification, artifacts and boundaries

Fresh-copy reconciliation: 17 tests. Broader regression: 392 tests across 23 files;
the expanded hosted-role suite subsequently passes four cases, including actual
restricted-role submit/read. TypeScript and whitespace checks pass. No local
production build was run. Security advisors reported no finding for the six-table
schema; pre-existing Production/public findings are outside this cutover.

Private evidence lives under ignored `.local/six-preview-20261111/`; the restored
backup and reconciled source artifacts remain under
`.local/backups/six-preview-20261110/`. No credentials or source rows are committed.

Production deployment/settings/data remain unchanged. Formal/translation
convergence, real business-history migration and Production activation still need
separate implementation and acceptance. Broader mobile/refund/provider-timeout
checks and deferred monitoring are not established by this successful journey.
