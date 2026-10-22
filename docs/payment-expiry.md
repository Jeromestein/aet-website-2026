# Formal application payment expiry

## Prepared production credentials (2026-10-22)

The owner authorized database-account preparation. The existing project now has
`aet_payment_expiry` with LOGIN, no administrative/bypass privileges, and a limit
of three connections. The existing pooler connection was verified with TLS.
Only four formal-application columns are readable; only `payment_status` is
updatable, fenced by RLS to eligible pending -> expired transitions. Existing
application policies and CRM permissions were preserved.

The private `.env.local` file is the single local source, grouped by service.
Use its Scheduled tasks section to configure Vercel Settings > Environment Variables,
scoped to **Production**:

| Variable | Value |
| --- | --- |
| `STATUS_EXPIRY_DATABASE_URL` | Copy the complete value from the private file |
| `CRON_SECRET` | Copy the generated value, or retain an existing strong Production secret shared by the project's Cron jobs |
| `STATUS_EXPIRY_ENABLED` | Set `true` in Vercel Production; keep `false` in `.env.local` |

The file is Git-ignored, has mode 0600, and is loaded by Next.js locally.
Restart the owner-run local development server after environment changes.
The local expiry switch remains false; moving credentials does not activate it. Do not add `NEXT_PUBLIC_`
prefixes or commit the values. No GitHub Actions secrets are required. Commit and
push the reviewed application code through the owner's normal release process,
then deploy to Production; Preview deployments will skip expiry. If these variables
are added after deployment, create a fresh Production deployment to use them.
Verify the job in Vercel's Cron Jobs page and its first real result after activation.

Preparation passed 24 checks: real restricted-role login, exact column privileges,
private-column and other-table denial, actual installed RLS pending -> expired,
denial of paid/fresh changes and duplicate mutation, and unchanged business-row
fingerprints. All synthetic rows and temporary administrator role membership
were rolled back. The read-only eligibility count was **77**; no sweep was run.
The generated preparation script reuses saved credentials on repeat runs and
refuses to rotate an existing role without its saved file.

Supabase's security advisor returned no finding for `fce_applications` or the new
role. It did report existing issues elsewhere, including
[RLS disabled on other exposed tables](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
and [mutable function search paths](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
Those existing objects were not changed; this is not a project-wide security sign-off.


## Rule and customer display

The legacy window is 48 elapsed hours after `fce_applications.submitted_at`,
not `created_at`. Missing/invalid submission timestamps do not get an invented
window. The customer deadline and SQL worker share `PAYMENT_DEADLINE_HOURS`.
Pending payments show the timer; at the deadline the timer stops and the page
asks the customer to contact the office. Persisted `expired` always shows the
expired notice, including when its timestamp is missing or lies in the future.
Paid, failed and refunded states do not receive a pending-payment countdown.

The saved payment status remains the database value. A lapsed window can therefore
coexist with `pending` until the scheduled sweep updates it, as in the legacy app.
Disconnected preview intakes still have no payment window or production payment
link. This change does not enable their checkout or payment reconciliation.

## Legacy scheduler observation (2026-10-22)

GitHub's workflow API reports `disabled_inactivity` for workflow `157598177`
in `MeiyuTech/AET-App`, path `.github/workflows/check-expired-applications.yml`.
The latest visible run was [26043669973](https://github.com/MeiyuTech/AET-App/actions/runs/26043669973),
a successful scheduled run at 2026-05-18 15:36 UTC. An October run query returned
zero records. The checked source schedules once daily at 12:00 UTC and posts to
`/api/supabase/check-expired`. No workflow was enabled or dispatched during this task.
This observation covers that GitHub task, not unknown external schedulers.

## Replacement worker and activation

`GET /api/internal/customer-status/expire` is registered for 12:00 UTC daily in
`vercel.json`. It requires a constant-time checked `Authorization: Bearer ...`
matching `CRON_SECRET` (at least 16 characters). It executes only with BOTH
`VERCEL_ENV=production` and `STATUS_EXPIRY_ENABLED=true`; local/Preview cannot drain
live records. It requires a dedicated `STATUS_EXPIRY_DATABASE_URL` and rejects the
CRM, preview and administrator identities. It returns counts only, never customer
records. Failures return 503 and do not claim success.

The worker changes only `pending` payments whose application status is `submitted`
or `cancelled` and whose `submitted_at` is more than 48 hours ago. It never cancels
an application. One atomic UPDATE rechecks eligibility while updating, protecting
payments changed after candidate selection. Paid/refunded/failed, completed or
processing records and missing submission timestamps are untouched. Repeated
execution is idempotent. A call handles at most 1,000 records; `batchFull: true`
requires follow-up/monitoring rather than assuming the backlog is drained.
Daily sweep timing means persistence can lag the visible deadline by up to a day
plus scheduling delay, just as with the original daily task.

The owner authorized the Production release on 2026-10-22. Commit `83357c3` is
deployed and the Vercel Cron entry is Enabled. The first dashboard-triggered run
returned 200 and expired 77 eligible records; read-only comparison found no
unexpected changes. Automatic scheduled delivery is not yet observed.
The cutover checklist below remains the operating procedure:

1. Keep the old GitHub workflow disabled and confirm no other scheduler owns this
   same work. Do not enable both schedulers: the legacy endpoint's two-step update
   does not provide the new worker's atomic recheck.
2. Review eligible counts before the first sweep, given the long scheduling gap.
3. Database provisioning is completed for the current project, as recorded above.
   For a different future target, run `scripts/customer-status/expiry-role.sql` and
   separately configure its credential. Do not substitute an administrator URL.
4. Configure `CRON_SECRET` and `STATUS_EXPIRY_ENABLED=true` on the designated
   production deployment only. Verify hosted Cron registration and first actual
   response/log, including `batchFull`. Do not treat local tests as hosted activation.
5. To stop this worker, set `STATUS_EXPIRY_ENABLED=false` and deploy that config.
   Existing expired rows are retained; this does not reset payments.

## Verification

Run with existing installed dependencies (never a production build):

```sh
pnpm exec vitest run tests/customer-status.test.ts tests/payment-expiry.test.ts tests/dropbox-paths.test.ts
pnpm exec tsc --noEmit --incremental false
node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/customer-status/verify-expiry.mts
```

The SQL check uses an isolated disposable schema, synthetic rows and a non-login
test role inside a rolled-back transaction. It verifies the 48-hour boundary,
submitted/cancelled selection, paid and other exclusions, idempotence, 1,000-row
batch bounds, private-column denial, and denial of setting a payment to paid even
under a permissive PUBLIC policy. No business table, customer row or lasting role
is changed. `STAFF_AUTH_DATABASE_URL` is used only by this administrative test.

Acceptance: 38 focused tests, TypeScript, 19 real SQL/permission assertions and
401/no-store authorization on the running local route passed. The owner's existing
3022 server showed the real historical application's submission time and expired
window warning in the in-app browser on desktop and 390px mobile. A live countdown's
boundary/paid/preview states were tested in unit tests; no fresh production test
application was created. No production expiry, scheduler activation, payment,
email, build, commit, push or deployment was performed.
