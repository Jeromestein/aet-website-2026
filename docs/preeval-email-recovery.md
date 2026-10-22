# Pre-evaluation outbox recovery (F5)

> **Deferred by owner — October 22, 2026.** Retain the existing implementation
> as a reference. Do not perform further design, implementation or scheduler
> activation now. Reconsider only after a substantial unsent backlog or recurring
> delivery failures are observed; see the [active decision](migration-checklist.md#deferred-by-owner).
> The configuration procedure below is conditional, not an instruction to enable it.

## Behavior and scope

`GET /api/internal/pre-evaluation/email-recovery` recovers saved mail independently
of AI eligibility, enabled AI processing, customer visits and open browser tabs.
It never invokes AI or creates replacement delivery records. No migration is
required; it uses the existing delivery columns.

Each invocation selects at most three explicitly allowed applications from
`preeval.emails` (mapped to the restricted preview schema in cloud-preview mode).
For each application it parks at most five terminal records, releases at most five
stale leases, and claims at most five eligible deliveries. Provider work is awaited.
All queries are pinned to the configured recipient. Existing atomic
`FOR UPDATE SKIP LOCKED` claims and lease-checked writes arbitrate overlapping
Cron, worker and customer requests. Only aggregate counts leave the endpoint.

Cloud-preview sends still require the existing email opt-in and a valid UUID
application scope. The normal database-role, origin, dev-branch and employee
cutover checks remain active. Recovery additionally pins the recipient and origin,
so changing either requires explicit operator review of the recovery settings.
Old recipients are neither redirected nor silently selected.

## Deployment configuration (off until explicitly enabled)

Set these server-side values only for the approved isolated environment:

```dotenv
PREEVAL_EMAIL_ENABLED=true
PREEVAL_EMAIL_RECOVERY_ENABLED=true
PREEVAL_EMAIL_RECOVERY_APPLICATION_IDS=<comma-separated approved UUIDs, maximum 20>
PREEVAL_EMAIL_RECOVERY_RECIPIENT=<exact APPLICATION_TEST_EMAIL value, lowercase>
PREEVAL_EMAIL_RECOVERY_ORIGIN=<exact canonical APP_ORIGIN>
CRON_SECRET=<at least 16 characters, supplied securely>
```

Omitting either opt-in skips recovery. An empty/invalid/oversized application
allowlist or a changed recipient/origin fails closed before queue access. The
allowlist is deployment configuration, not a URL parameter. Review it when adding
pilot applications; applications not on it retain their existing request-driven
behavior. The provider key/from configuration is unchanged.

### Scheduling the approved Preview target

Vercel Cron targets production deployments, not Preview deployments. Hobby Cron
is limited to daily invocation; a daily schedule cannot guarantee a retry inside
23 hours. Consequently this change does not add a misleading Preview Cron entry
or alter the existing AI and payment-expiry entries in `vercel.json`.

Use an existing approved scheduler to invoke the independent endpoint every five
minutes. The one-shot caller is `scripts/email/recover.mjs`; it reads its process
environment, allows only an explicit HTTPS `*.vercel.app` origin, rejects
redirects and times out after five minutes. It does not access a database or AI.
For a scheduler that securely injects the caller's environment, the command is:

```sh
/absolute/path/to/node /absolute/path/to/aet-website-2026-dev/scripts/email/recover.mjs
```

Configure its five-minute schedule and supply `PREEVAL_EMAIL_RECOVERY_ORIGIN` and
`CRON_SECRET` matching the server through that scheduler's secret configuration.
Plain cron does not automatically load shell or project environment files; its
launcher must provide these values. Do not create a second service-specific
secret file in this worktree. An explicitly authorized manual local invocation
can use `node --env-file=.env.local scripts/email/recover.mjs` after adding the
caller settings to the existing private file; it still targets the approved
HTTPS Preview origin, not localhost. If Vercel deployment protection is enabled,
provide its separately authorized `VERCEL_AUTOMATION_BYPASS_SECRET` to the caller;
it is sent only as the protection-bypass header and does not replace Cron auth.
The caller exits 1 for a failed/disabled invocation, 2 for newly parked review
items, and 0 otherwise; logs contain only aggregate counts or a generic failure.
Capture these failures/review counts in the scheduler's existing alerting. An
empty later batch is not evidence that previously parked rows were resolved.

No external timer, credentials, deployment protection setting or deployment is
created/changed by this implementation. The owner must separately activate and
verify the approved target and cadence. Local unit/SQL verification does not prove
that any hosted timer is operating.

References: [Vercel Cron deployment behavior](https://vercel.com/docs/cron-jobs),
[Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Uncertain delivery and manual reconciliation

The provider request keeps the original delivery UUID as its idempotency key and
has a 15-second timeout. The sender persists a content digest before dispatch and
rechecks its lease and the retry window after rendering. Failed delivery waits at
least 60 seconds; each record has at most five attempts. The original
`first_attempt_at`, UUID and digest are never reset by recovery.

A timeout, disconnect, process interruption, or failure to save a provider receipt
can mean the provider accepted the mail. Within the 23-hour local window, a retry
uses the same key and identical payload. The existing digest rejects changed
sender/content/CC, and result-version/payment/status checks reject withheld or
superseded results before contacting the provider. Resend retains idempotency
keys for [24 hours](https://resend.com/changelog/idempotency-keys); the application
retains the stricter 23-hour limit, including a final check before dispatch.

Once that window ends, or attempts are exhausted, recovery sets `state='failed'`
and `available_at='infinity'`, preserving references, hashes and any receipt.
Expired rows receive `delivery_window_expired_review`; previously exhausted rows
receive `delivery_retry_exhausted_review`. A fifth failed send is parked immediately
with `delivery_failed`. Template/business-reference failures retain their specific
reason. None of these rows are automatically sent again.

An authorized operator should inspect failed rows with `available_at='infinity'`
in the matching isolated schema and application/recipient scope, then:

1. Correlate the original delivery UUID/idempotency key, any provider receipt and
   provider logs. A local `failed` record alone is not proof of non-delivery.
2. If acceptance is confirmed, reconcile that original record to the confirmed
   provider receipt/sent state with an audited, authorized operation; do not send
   another message.
3. If the outcome remains uncertain, keep the record parked and escalate for
   manual customer/support handling. Do not clear the digest, reset the clock,
   extend the window or mint a new key merely to retry.
4. Only if non-delivery is established and the current business result, content,
   recipient and environment are approved may an operator authorize a distinct
   replacement notification. Preserve the original record and record that
   decision; this endpoint deliberately provides no automatic replacement API.

Changed recipients/removed allowlist entries must also be reviewed explicitly;
the scheduler cannot mutate or redirect messages outside its authorized scope.

## Formal intake boundary

`evaluation.intake_emails` uses a different application-specific sender
(`sendIntakeEmail`) and a fixed test recipient plus office CC. It shares digest,
lease and 23-hour concepts but does not share `preeval.emails`, its opt-in or its
claim implementation. Its sender also lacks the pre-evaluation five-attempt cap.
`evaluation.emails` is another queue whose worker remains disabled in cloud
preview. Neither is silently enrolled in this pre-evaluation-only recovery route;
a formal-intake scheduler/retry-policy change needs its own scope and acceptance.

## Regression verification

Run the standard mock suite:

```sh
pnpm exec vitest run tests/preeval-email-recovery.test.ts tests/preeval-email-recovery-caller.test.ts tests/email-delivery.test.ts tests/preeval-ai-scheduler.test.ts tests/cloud-database.test.ts tests/formal-email.test.ts tests/email-office-routing.test.ts
pnpm typecheck
```

`tests/preeval-email-recovery-postgres.test.ts` additionally exercises actual SQL
claims, SKIP LOCKED, scope, terminal parking and retry state in a disposable local
PostgreSQL database with mocked providers. It is skipped unless
`PREEVAL_EMAIL_TEST_DATABASE_URL` explicitly points to `127.0.0.1` and a database
named `aet_email_recovery_test_<unique suffix>`. It refuses an existing `preeval`
schema, never reads `.env.local` or the business database URL, and must be run
against a newly created disposable database:

```sh
PREEVAL_EMAIL_TEST_DATABASE_URL=postgres://email_test@127.0.0.1:55439/aet_email_recovery_test_run pnpm exec vitest run tests/preeval-email-recovery-postgres.test.ts
```

No production build, real email, payment, AI request or live business mutation is
part of these tests. The temporary PostgreSQL service should be stopped afterward.
