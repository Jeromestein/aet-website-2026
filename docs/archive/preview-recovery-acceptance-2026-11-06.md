# Hosted pre-evaluation recovery acceptance — November 6, 2026

## Scope and result

Both owner-requested failure-recovery cases passed against the existing dev Preview
at `b003139`, deployment `dpl_9CErCogfTCmRHUbR38t3KHJGwfdF`.
No application-code change, redeployment, cron or provider-setting change was needed.
This follows the [core activation acceptance](database-preview-acceptance-2026-11-06.md).

Test application: `3e32dd48-4c94-4050-84e9-f88f8500c9f7`,
`AET Recovery Preview 20261106 Test`. All applicant/material data are synthetic.
The hosted API, Dropbox, OpenAI, Resend and Stripe Sandbox were real services;
no real payment was charged. Emails used the existing controlled Preview recipient.

[Customer result](https://aet-website-2026-git-dev-meiyutechs-projects.vercel.app/zh/degree-equivalency-tool/application/success?applicationId=3e32dd48-4c94-4050-84e9-f88f8500c9f7)

## 1. Upload failure and replacement

1. Submit with uploads pending; use the real chunked upload start/append/finish
   endpoints with a deliberately incorrect expected content hash.
2. Dropbox receives the synthetic PDF, but finish verification returns HTTP 502.
   Cancel the unfinished capability using the normal upload protocol, persisting
   a failed slot. `uploads-complete` rejects the incomplete batch; no AI starts.
3. Open the customer page in the in-app browser. The persisted failure appears as
   `failed-original.pdf`, with the recovery control and disabled completion action.
4. Click **Abandon upload** in the browser. The audit records `upload.abandoned`
   at `23:29:22.331494 UTC`. A delayed finish using the old capability returns 409.
5. Select `replacement-credential.pdf` through the file chooser and upload from
   the customer UI. The 1,408-byte replacement succeeds at `23:29:46.585858 UTC`;
   the upload batch closes, and exactly one AI run completes.
6. Download the new file: HTTP 200, exact SHA-256 match with the synthetic PDF.

The failed slot is absent, the replacement is the sole ready workflow file and
has its core File ID record. Its record ID is
`296b0519-639e-4946-a30f-a0732a15a9e9`. Abandonment does not delete provider files;
any synthetic bytes already saved during the intentionally failed finish are
retained in the isolated test storage path.

This reproduces a failed completion/integrity check and persisted failed-attempt
recovery, not an actual Dropbox-wide network outage or the 15-minute stale timer.

## 2. Paid result publication failure and recovery

A temporary `SECURITY INVOKER` trigger in `aet_preview_preeval` rejects only the
selected synthetic application's transition to `completed`. Target selection
requires exactly one matching synthetic applicant and its core record. The probe
has a 20-minute expiry, an explicit search path and no PUBLIC/anon/authenticated
function grants. It does not intercept other applications or Production schemas.

- Installed probe: `20261106232958_preview_recovery_probe_install_20261106`.
- Removed probe: `20261106233249_preview_recovery_probe_cleanup_20261106`.
- Function/trigger: `recovery_probe_20261106`.
- Expected error marker: `synthetic_preview_publication_outage_20261106`.

These are paired hosted test operations recorded in the migration ledger, not
permanent application migrations. The final schema has neither probe object.
Do not deploy the fault installer as a normal application migration.

The browser completed USD 19.88 Stripe Sandbox Checkout with standard test-card
information and **Link saving disabled**. The permanent direct test webhook
committed payment at `23:31:18.179806 UTC`, but publication then failed as intended.
The browser showed paid/completed analysis with a service-unavailable notice and
no released result. Three concurrent authenticated reads returned usable paid
application data while withholding the result, rather than losing payment or
rerunning AI. Core service result remained `draft`, with `released_at=null`.

After recording this state, browser polling was stopped by navigating away. The
probe was removed and the database was checked before the next request: payment
was still paid, the same saved result was present, and publication was still pending.
Three normal concurrent authorized GETs then all returned the released version 1.
No manual result/status edit, AI retry, new payment or scheduled job was used.
Publication time: `2026-11-06 23:32:52.205012 UTC`.

The customer result page and CRM Test both show completed/paid. The explicit test
credential returns “Unable to determine”; this is expected and does not measure
academic evaluation accuracy. CRM Test retains all 10 applications: 6 completed,
4 needing attention, with the new recovery application counted only once.

## 3. Deduplication and receipts

| Evidence | Observed result |
| --- | --- |
| AI run | Exactly one: `97298241-c33e-4017-86b5-9d4991c0a9e5`, input version 5 |
| Saved result | Version 1; content checksum unchanged before/after recovery: `1d701fc41b283091717382a0653fac76` |
| Payment | One core payment and one operational payment, paid, 1,988 cents, test mode |
| Confirmation mail | One attempt, delivered; `01a1b330-4d44-7e0d-9ce5-0a6bb947bb82` |
| Result mail | One attempt, delivered; `01a1b335-4d4b-77ea-9b8c-514a7b7caa11` |
| Access mail | One explicit access request during verification, delivered; `01a1b331-219f-73fb-9614-e3562f9ef2e2`; separate from recovery notifications |
| Reconciliation | Normal authorized reconciliation succeeds after fault removal without another payment or AI run |
| Direct webhook replay | Same Stripe event redelivered to the existing dev endpoint; pending deliveries become 0, counts unchanged |

Checkout: `cs_test_a11JCnKk3DhbRZ54WfxXAt6zhr0PGgduw3b3gI0kuiSVZ6tGMCbLQE7Y0m`.
Event: `evt_1UYwbJJMcR2XIhyn8UHfdSqS`.
Existing endpoint: `we_1UTTP2JMcR2XIhynZXyFcdYa`, verified as enabled, test-only,
and pointing exactly to the dev Preview webhook. The official Stripe CLI resent
this event; no endpoint secret or temporary forwarding listener was introduced.

## 4. Cleanup and verification boundaries

Both temporary database probe objects are absent. The restricted Preview runtime
still has zero INSERT/UPDATE/DELETE/TRUNCATE grants on production tables. Security
advisors show no core/probe-specific notice. Production remains Ready at `fc1ab0d`,
deployment `dpl_3NCtp1ZJBRYxi2puGVLg2eCuQJZR`. Main, Production settings, existing
business records and old tables were not modified. Synthetic acceptance records
remain available for inspection. Temporary local session/upload capability state
was removed after verification.

Screenshots capture upload failure, upload recovery, blocked publication, released
result, CRM and the Production baseline. No runtime code changed, so the earlier
160-test/12-file and TypeScript result remains the code regression baseline; it was
not rerun for this verification/documentation-only task. Documentation whitespace
and new relative-link destinations were checked.

Remaining coverage: hosted mobile recovery, cancellation/refund visibility, broader
provider outages/timeouts, historical migration, and Production activation. Recovery
is request-driven after the cause clears; this run does not establish unattended
recovery with no incoming reads/webhook retries. Email scheduling remains deferred.
