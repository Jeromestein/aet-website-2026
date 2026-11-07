# Pre-evaluation convergence: physical retirement acceptance

Date: November 6, 2026. Branch: `dev`, based on `cce76d4`.
Scope: new synthetic applications in an owned disposable PostgreSQL cluster.
No hosted database, deployment, environment setting or provider data changed.

## Result and counting boundary

The converged pre-evaluation runtime uses exactly 13 physical tables in private
`aet`: five business records and eight operational records. The suite asserts
this inventory, validated foreign keys, and absence of old pre-evaluation tables
and replacement views. This does **not** mean the hosted 32-table schema was
reduced to 13 today. Formal fixtures and the real historical cohort are separate.

| Business | Operational |
| --- | --- |
| `aet_core_applications` | `aet_uploads` |
| `aet_education` | `aet_ai_runs` |
| `aet_service_detail` | `aet_emails` |
| `aet_documents` | `aet_payment_events` |
| `aet_payments` | `aet_access_tokens`, `aet_sessions`, `aet_audit`, `aet_rate_limits` |

The script moves the existing file-attempt, AI, mail, event, token, session,
audit and limit tables rather than retaining a second operational copy. Shared
and dedicated upload attempts now use the same upload table. Completed-file
identity comes only from `aet_documents`; payment truth comes only from
`aet_payments`; current results come only from `aet_service_detail.result`.
AI queue/lease/input-version state lives in the current AI run, not a second
application profile. API response shapes are projections in code, not stored
compatibility views. Existing legacy code remains for the unchanged hosted runtime.

Seven empty physical tables are dropped, without `CASCADE`:

- `preeval.applications`, `preeval.educations`, `preeval.payments`
- `preeval.document_uploads` (merged into the shared upload contract)
- `public.aet_core_applications`, `public.aet_core_educations`, `public.aet_core_payments`

The eight remaining original `preeval` tables are moved/renamed into `aet`.
Operational application FKs are retargeted before removing the old parent.
All original `preeval` table names are therefore absent during acceptance.
No historical records are deleted: retirement rejects any populated source or
core table, and a test proves rejection occurs before DDL takes effect.

## Verification

Twenty post-deletion tests pass in `tests/application-core-convergence.test.ts`:

- Schema inventory, absence of retired tables/views, valid FKs and denied client
  schema access; rejected activation against the wrong database.
- Actual submission with concurrent retries, changed-input conflict detection,
  immutable submission snapshot and no persisted business locale.
- Ordinary, chunked and shared uploads; File-ID reads, duplicate finish,
  failed-file replacement, stale callback fencing and ambiguous-folder rejection.
- AI reads canonical education; retryable failure recovery; a new upload fences
  an in-flight provider response; competing workers perform one effective run.
- AI output persists when publication fails. A real SQL trigger rejects release;
  authorized reads recover publication after the fault is removed, without
  another AI call or duplicate result email.
- Direct canonical payment writes, concurrent Checkout, refund-before-completion,
  stale paid replay, frozen-amount mismatch rejection and preserved timestamps.
- Actual webhook handler validates a synthetic Stripe signature, rejects unsigned
  input and handles duplicate callbacks without duplicate effective payment/mail.
- One-use access links and sessions; actual lookup/Status handlers enforce
  application scope and retain localized lookup URLs.
- CRM, admin queue, Status and English mail use the same canonical records;
  office scoping, private notes, education stale-write checks and transaction rollback.
- Failed email transport retries the same delivery ID and payload; unpaid
  cancellation remains effective.

Combined regression: **329 tests across 19 files, all passed, none skipped**.
This includes the previous core, cohort, hosted-schema simulation, upload fencing,
publication, information-request, AI, Stripe, CRM and email suites.
TypeScript: `pnpm exec tsc --noEmit --incremental false` passes.
No production build was run. No browser UI was changed or browser acceptance
performed; the route handlers were exercised directly in the test process.

## Isolation and remaining work

Each database suite creates a temporary cluster listening only on its own Unix
socket; no `.env.local` or hosted database URL is loaded. Teardown stops the
cluster and removes its data. Dropbox, Stripe API calls, AI and mail transport
are simulated; signature verification uses the actual Stripe SDK. No real charge,
provider delivery or hosted-browser outcome is claimed.

The local retirement SQL is kept under `scripts/database`, outside automatic
Supabase migrations. Runtime activation is an explicit connection-scoped function
that verifies database identity and source retirement; no hosted flag exists.

Next: reconcile a populated historical copy, migrate all its operational history
and rerun the same physical-drop checks. Then unify formal/translation writers
and shared operational semantics, preserving staff access and legacy callbacks.
Only after those gates can the total hosted business/runtime scope reach 13.
Current Preview, Production and all hosted historical/legacy tables remain intact.
