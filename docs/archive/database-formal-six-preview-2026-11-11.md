# Formal evaluation convergence: six-table dev Preview acceptance

Accepted November 11, 2026 (Pacific time). Scope: dev Preview only. Production
settings, deployments and business tables were not changed.

## Result

Both Preview evaluation families now use `aet_preview_shared`:

| Table | Responsibility |
| --- | --- |
| `aet_core_applications` | Application identity, contact/evaluee, office, current state |
| `aet_education` | Application education records |
| `aet_service_detail` | Service requirements, price, notes, result and current notification state |
| `aet_documents` | Files, Dropbox File IDs and current upload state |
| `aet_payments` | Actual payment state and provider identifiers |
| `aet_ai_runs` | AI work and saved analysis |

The last twelve old Preview tables were physically deleted. Combined with the
previous twenty-table retirement, all 32 original Preview source tables are gone.
Final row counts: 14 applications, 17 educations, 14 service details, 14 documents,
6 payments and 10 AI runs. These include the two new synthetic acceptance cases.

The actual Preview business/runtime inventory is **six**, not eighteen. Staff auth,
legacy CMS, Supabase internals and Production public tables are outside this count.

## Data and backup

A fresh repeatable-read snapshot was captured at **2026-11-11T18:03:38.884Z**.
It contained all eighteen remaining Preview tables and twelve applications:
eight pre-evaluations and four formal evaluations. PostgreSQL custom-format backup
restoration was verified before import and again before the exact DROP migration.
Private artifacts are under ignored `.local/backups/formal-six-preview-20261111/`.
Snapshots, provider evidence and credentials are not committed.

The formal import preserves:

- Four application IDs and original intake/quote snapshots.
- Five education IDs, schools, degrees and study dates.
- Four Dropbox files discovered from the historical folders, indexed by File ID.
  The old `evaluation.files` table was empty; dropping it without reconciling the
  existing folder metadata would not have accounted for those files.
- Four sent confirmation states/provider references; no historical mail was resent.
- Zero formal payment rows: none existed in this cohort; none were fabricated.
- All existing shared pre-evaluation rows, including the explicit waived case.

Old source rows were frozen and matched the snapshot during the import. Import
uses a serializable transaction and typed row comparisons. Retirement repeats
fingerprint, migrated-entity, writer-freeze and exact-inventory guards. No CASCADE,
replacement view, session/event/audit table or Production mutation was used.

## Code and deployment

- `1e186b6`: shared formal storage, upload/payment/notification adapters, CRM and
  Status compatibility, local converter, guarded hosted importer and tests.
  Vercel deployment `Bb1pecLCx2HxDVRRz8s42WUesJzF` succeeded.
- `02542de`: keep review/missing-information uploads available in six-table mode.
  Vercel deployment `8i57K9BxMD55ANfM2KSLimW5TcJE` succeeded.
- The existing Preview/dev-only `APPLICATION_CORE_MODE=six-preview` remains.
- `preview_formal_six_table_support` allows the formal review status in the shared
  application/service constraints. `freeze_preview_formal_writers` prevented old
  version writes while records were imported and the deployment switched.
- `retire_preview_formal_tables` removed the twelve verified sources. Supabase
  returned success; a subsequent catalog query returned exactly six shared tables
  and `production_write=false` for the restricted runtime role.

Deleted tables:

```text
aet_preview_evaluation.access_tokens
aet_preview_evaluation.applications
aet_preview_evaluation.audit
aet_preview_evaluation.document_locations
aet_preview_evaluation.emails
aet_preview_evaluation.files
aet_preview_evaluation.intake_emails
aet_preview_evaluation.payment_events
aet_preview_evaluation.payments
aet_preview_evaluation.sessions
aet_preview_legacy.fce_applications
aet_preview_legacy.fce_educations
```

## Verification

Full regression: **730 passed, 174 skipped; 55 test files passed, 6 skipped**.
Skipped cases require their optional integration environments; they are not
claimed as executed. TypeScript passed. The eight formal integration cases ran
against the fresh full-copy fixture with all twelve source tables physically
removed. Payment concurrency/refunds, report release, stale versions, failed upload
retry, File ID ownership/revision changes, education/quote parity and notification
deduplication passed. External providers were doubled in that isolated suite.

Hosted checks used real Dropbox, Resend and Stripe Sandbox services:

| Check | Result |
| --- | --- |
| Four old formal Status links | Names, education counts and original quotes agree; historical folders list 2/0/2/0 files |
| New formal intake before retirement | `0b6bb152-bd7a-4934-bc96-189baacd2d30`; repeat submission returns the same ID |
| File upload and continued upload | Two synthetic PDFs saved/indexed by File ID; refreshing review status still permits another upload |
| New formal intake after retirement | `c854b2bc-189a-4ab9-9fdf-eb4179070655`; duplicate protection, upload and delivered English confirmation pass |
| CRM Test | All 14 applications visible after the two new tests; old formal records and new file counts remain readable |
| Customer browser | Chrome AET profile, Chinese Status page shows quote, two educations, two uploaded files and enabled file selection |
| Existing paid pre-evaluation | USD 19.88 Sandbox payment, file byte hash, saved result, one completed AI run and two delivered English mails still agree |
| Six old pre-evaluation links | All remain readable, including the explicit waived test |
| Official Stripe test-event replay after DROP | Delivery completed; payment/AI counts, result version and notification state unchanged |

The final Stripe replay took longer than the helper's initial three-second poll;
that early pending count was not treated as delivery failure. A later provider
read confirmed zero pending webhooks, and current business state matched the
pre-cutover snapshot. No additional replay was sent to work around that wait.

The diagram viewer received text-only scope/date corrections. Markdown links and
viewer text were checked locally; its file-URL visual check was blocked by browser
policy. No local Next.js server was running on port 3022; application visual checks
used the deployed dev Preview in the owner-selected Chrome AET profile.

## Boundaries and rollback

This is a database convergence acceptance, **not** completion of the unified v2
formal payment/staff/report-release product journey. Its existing payment UI stays
disabled and staff fulfillment still requires explicit integration. Formal payment
and report actions were exercised in isolated tests, not claimed as a new hosted
customer checkout. Translation submission also remains open. No live charge ran.

Do not simply redeploy an old writer: its tables no longer exist. A rollback
requires a Preview maintenance window, restore into an isolated schema/database,
reconciliation of new shared-table writes since the snapshot, verified mapping
back to the selected runtime, then an explicit Preview deployment switch. Keep
Production out of this procedure. Prefer forward fixes for remaining Preview issues.
