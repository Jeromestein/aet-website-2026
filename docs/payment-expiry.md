# Formal application payment expiry

## Production task

`GET /api/internal/customer-status/expire` runs daily at 12:00 UTC through
Vercel Cron. On Hobby, execution occurs within the scheduled hour. A daily sweep
can persist expiry up to a day after the 48-hour customer payment window.

The worker changes only `payment_status` from `pending` to `expired` for formal
applications with status `submitted` or `cancelled` and `submitted_at` more than
48 elapsed hours ago. It does not cancel applications or change paid, refunded,
failed, processing or completed records. Missing timestamps are excluded.
One atomic update rechecks eligibility and processes at most 1,000 rows. Repeat
runs are idempotent. `batchFull: true` means another run may be needed.

## Configuration

Use the prepared values from the private, Git-ignored `.env.local`. In the
`aet-website-2026` Vercel project, configure **Production only**:

- `STATUS_EXPIRY_DATABASE_URL`: Secret, dedicated `aet_payment_expiry` login.
- `CRON_SECRET`: Secret, a random value with at least 16 characters. Vercel sends
  it as a Bearer token on scheduled and dashboard-triggered requests.
- `STATUS_EXPIRY_ENABLED=true`: Config. Keep this `false` locally.

The worker also requires `VERCEL_ENV=production`; Preview and local execution
skip writes. The prepared role can read only id/status/payment_status/submitted_at
and update only payment_status, with RLS limiting eligible transitions. Never
substitute an administrator or CRM connection. No credentials belong in Git.

The old MeiyuTech/AET-App GitHub expiry workflow remains disabled. Do not run
both schedulers. This release adds only the independent expiry worker to the
existing marketing-site main branch; the dev application system and its
pre-evaluation scheduler are outside this release.

## Release checks

Run `pnpm exec vitest run tests/payment-expiry.test.ts`,
`pnpm exec tsc --noEmit --incremental false` and `git diff --check`.
Do not run a local production build. Vercel performs the production build.
After deployment, confirm the Cron entry is enabled, unauthenticated requests
return 401, and a dashboard Run produces HTTP 200 plus a count-only completion
log. Check eligible rows before and after, and repeat once to check idempotence.
A manual successful run verifies the hosted execution path; a later scheduled
log is required to establish automatic delivery at the scheduled time.

To pause expiry, set `STATUS_EXPIRY_ENABLED=false` in Production and redeploy.
Existing expired rows are retained. Environment changes need a new deployment.
