# Pre-evaluation Production Configuration Plan

Prepared November 11, 2026, against dev `ec57042`. **Plan only: nothing in
Production has been changed.** This document records the proposed settings and
release order; it is not an executable environment file or deployment approval.

**Scope update:** the owner now requires pre-evaluation and credential evaluation
to launch together through `/application`. The manifest below covers the existing
pre-evaluation runtime only. It must be extended for credential intake, payment,
applicant mail and report delivery after dev implementation; it is not sufficient
for the joint launch. See the [active checklist](migration-checklist.md).

## First-release decisions

- Launch both evaluation services for new orders through `/application` after
  joint acceptance. Preserve existing customer links; translation and historical
  AET App business keep their existing paths.
- Retain the old Production tables and their data long-term after the new system
  launches. There is no scheduled deletion date. Launch, history copying or
  eventual old-app shutdown never authorizes dropping, truncating, renaming or
  overwriting those tables. Any future destructive cleanup needs a separate,
  explicit owner decision. A backup is not a substitute for retaining the tables.
- Reuse the existing Vercel project, Supabase project, Stripe, Dropbox and Resend.
  Use separate new-order business data, credentials and document locations.
- Refunds are handled manually in the Stripe Dashboard. Keep the existing refund
  webhook reader; add no refund UI, refund API, automation or tracking module.
- Accept the current mobile result/status checks for this release. Another full
  mobile payment run is not a launch blocker by the owner's decision. This does
  not turn an unperformed test into a passed test.
- Keep cron/email recovery, additional analytics and historical migration deferred.

## Proposed origin and customer links

Propose `https://www.americantranslationservice.com` as `APP_ORIGIN` for the first
release, subject to checking its existing Vercel binding before activation:

| Purpose | Proposed path on that origin |
| --- | --- |
| Apply | `/application` once both service paths are connected and accepted |
| Existing dedicated pre-evaluation links | `/degree-equivalency-tool/application` (retain compatibility) |
| Result | `/degree-equivalency-tool/application/success?applicationId=ID` |
| Retrieve an application | `/status-check` |
| New-order staff workspace | `/admin/CRM` |
| Stripe live event destination | `/api/pre-evaluation/stripe-webhook` |

Customer pages also support `/zh` and `/es`; the API and staff paths are unprefixed.
Use the same canonical origin for Checkout returns and customer mail links. Do not
redirect webhook POSTs through another hostname or a language prefix.

Leave `app.americantranslationservice.com`, its existing CRM and old customer links
on the old system during this first release. The previously agreed long-term
[app-domain arrangement](development.md#application-domains-and-staff-urls)
remains a later cutover; this proposal does not retire or rebind that domain.
If `www` cannot serve the new flow without an unapproved website/domain cutover,
resolve that before release rather than silently moving `app` or weakening the
approved-origin guard. The current code does not accept arbitrary new subdomains.

## Vercel configuration manifest — pre-evaluation only

Apply these only to the **Production** environment of the existing project during
the separately authorized release. Keep dev Preview's values intact. Resolve
secret values from their owner/provider; never paste the local `.env.local` into
Vercel or store filled values in this document.

| Setting | Proposed value or required source |
| --- | --- |
| `APP_ENV` | `production` |
| `APP_ORIGIN` | `https://www.americantranslationservice.com`, once the origin is confirmed |
| `APPLICATION_DATABASE_MODE` | `production` |
| `APPLICATION_CORE_MODE` | `six-production` |
| `APPLICATION_DATABASE_URL` | New restricted `aet_runtime` connection for project `qrxztgdemfodemlcabcq`; private schema `aet` |
| `APPLICATION_CORE_PROVIDER_ACCOUNT` | Verified `acct_...` for the actual live merchant account used by the next row |
| `PREEVAL_STRIPE_MODE` | `live` |
| `STRIPE_LIVE_SECRET_KEY` | Existing authorized live merchant key or a scoped replacement; verify its actual account and permissions |
| `PREEVAL_STRIPE_LIVE_WEBHOOK_SECRET` | New secret belonging to the exact live destination above; never the test/CLI secret |
| `PREEVAL_STRIPE_TEST_ENABLED` | `false` |
| `PREEVAL_AI_ENABLED` | `true` |
| `OPENAI_API_KEY` | Authorized server-only key with access to the accepted model |
| `PREEVAL_OPENAI_MODEL` | Preserve the accepted dev model, currently `gpt-6.1-sol`; no model/prompt change in this release |
| `PREEVAL_EMAIL_ENABLED` | `true` |
| `RESEND_API_KEY` | Authorized server-only key for the verified sending domain |
| `RESEND_DEFAULT_FROM_ADDRESS` | Proposed existing sender `info@americantranslationservice.com`; confirm provider verification |
| `RESEND_DEFAULT_FROM_NAME` | `AET` |
| `EMAIL_ASSET_ORIGIN` | Public HTTPS origin serving the existing email assets; proposed `https://www.americantranslationservice.com` |
| `DROPBOX_DOCUMENTS_ENABLED` | `true` |
| `DROPBOX_AET_App_KEY`, `DROPBOX_AET_App_SECRET`, `DROPBOX_AET_App_REFRESH_TOKEN`, `DROPBOX_AET_App_NAMESPACE_ID` | Existing original-account credentials; verify access to the new folder |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Existing staff Auth project settings; verify the intended project |
| `STAFF_AUTH_DATABASE_URL` | Existing restricted staff-membership connection, separate from business data credentials |
| `STAFF_LEGACY_MIGRATION_ENABLED`, `STAFF_AUTH_CUTOVER_ENABLED` | Both explicitly `false` |
| `CRM_DATA_SOURCE` | `preview` — the current adapter selector; `six-production` directs it to real new-order data |
| `PREEVAL_AI_DAILY_RECOVERY_ENABLED`, `PREEVAL_EMAIL_RECOVERY_ENABLED` | `false`; no scheduled recovery activation |

`VERCEL=1`, `VERCEL_ENV=production` and `VERCEL_GIT_COMMIT_REF=main` must be genuine
Vercel system values, not hand-written overrides. Confirm system variables are
available and the release actually comes from `main`. Use the validated Preview
Node major, with Node 22 or newer for the pinned Supabase libraries; confirm that
the plan/runtime supports the route's existing 300-second limit.

Production uses the persisted applicant email for both mail and Checkout.
`APPLICATION_TEST_EMAIL` is a Preview override, not a Production recipient switch.
No Stripe Product/Price creation or publishable key is required by this server-side
Checkout implementation: it creates a USD 19.88 line item (19.00 + 0.88).
Verify card and Alipay availability in the live merchant account before enabling
Checkout; both are currently requested by the code.

Do not bulk-overwrite shared settings: `STRIPE_LIVE_SECRET_KEY` also has existing
callers; standalone-payment `STRIPE_PAYMENT_MODE`/`PAYMENT_SITE_URL`, legacy CRM
connections, East Dropbox credentials and independent expiry jobs retain their
existing configuration. `STATUS_EXPIRY_ENABLED` is not a pre-evaluation dependency;
do not enable it for this release or disable an independently operating workflow.
The cron entries already present in `vercel.json` are not a request to add a job.
[Vercel environment changes apply to new deployments](https://vercel.com/docs/environment-variables),
so set the reviewed configuration before deploying the release.

## Supabase and documents

Prepare an empty private `aet` schema for these six tables only:
`aet_core_applications`, `aet_education`, `aet_service_detail`, `aet_documents`,
`aet_payments`, `aet_ai_runs`. Include the accepted indexes, constraints, triggers,
functions and role-specific RLS policies; copying column names alone is insufficient.
Reuse the current accepted Preview structure; do not design a second business
model. Fields, relations, indexes and constraints should match after normalizing
schema/role names. The present `tests/preeval-production.test.ts` fixture reuses
`supabase/migrations/20261111010750_preview_six_table_core.sql`. Preview subsequently
expanded two status constraints to accept `reviewing` in
`supabase/migrations/20261111180424_preview_formal_six_table_support.sql`. The release
baseline must include that accepted constraint change too; passing the earlier
fixture alone does not prove current schema parity or enable formal fulfillment.

Prepare a **separately reviewed, additive release migration** for the new target
and compare its schema to the current Preview contract before applying it. Do not
execute the historical Preview migration chain or its retirement scripts against
Production. No release SQL is generated or applied by this plan.

| Boundary | Existing Preview | Proposed new Production |
| --- | --- | --- |
| Supabase project | Existing project | Same project; no new Supabase project required |
| Private business schema | `aet_preview_shared` | `aet`, subject to target inventory |
| Runtime role | `aet_preview_runtime` | `aet_runtime` with separate credentials |
| Business model | Six accepted tables | The same six-table contract |
| Initial rows | Existing synthetic/test applications | Empty; accepts new real applications after launch |
| Providers | Sandbox payments, controlled test mail, `WebsitesDev` documents | Live payments, applicant mail, `AET2026` documents |

Provider modes and folders are environment configuration differences, not new
business tables. Keep Preview available for future testing. Old Production tables,
Preview tables and new Production tables coexist; **six is the new system's table
count, not the total number of tables in the Supabase project**. Staff Auth and
provider/system tables are outside that six-table count. No automatic dual-write,
historical import or deletion of original tables is part of this first release.

Before provisioning, inventory and back up the target. If `aet` or `aet_runtime`
already exists, reconcile it explicitly; never drop/overwrite it to make the
startup checks pass. The runtime role must not be superuser or bypass RLS, and
must have no writes to legacy/public/Preview business tables. The six private
tables must not be granted to `anon`/`authenticated` or exposed through the Data API.
Verify business access and the separate staff Auth permissions using their actual
restricted credentials. Keep a tested recovery copy; do not import test records.

For Vercel, use the project's verified transaction-pooler endpoint with TLS and
username `aet_runtime.qrxztgdemfodemlcabcq`, rather than guessing a host or using
`postgres`. The existing client disables prepared statements in hosted modes, as
required by [Supabase transaction pooling](https://supabase.com/docs/guides/database/connecting-to-postgres).

New dedicated applications currently have no assigned office. Their document
routing falls back to Miami in the original account:
`/Team Files/AET2026/Miami/<applicant name> - <application ID>`.
Ensure the operating staff member has the explicit unassigned-record permission.
The East account's `/AET2026` root is supported but is not needed for the default
new dedicated intake. Retain private File ID downloads and current file limits;
no public file sharing or historical folder migration is needed.

## Stripe destination and manual refund procedure

Configure a **live, own-account, snapshot-event** HTTPS destination matching the
SDK/accepted event format, not a thin-event payload. Use the existing SDK's
compatible API version; do not upgrade the account-wide API version for this launch.
Subscribe only to the events already handled:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

Keep the existing Sandbox endpoint. Configure and verify the dedicated live
signing secret before accepting payments. Snapshot payloads and per-destination
secrets are described in [Stripe's webhook guide](https://docs.stripe.com/webhooks).

For a refund, the operator checks the correct live account, applicant, amount and
application/session/payment reference, then opens that payment in Stripe Dashboard
and uses **Refund payment**. Record the reason in Stripe and use an existing
internal note/customer reply when necessary. Do not create a second refund if one
is pending; use Stripe's current refund status as the authority. Stripe supports
full and partial Dashboard refunds. [Stripe refund instructions](https://docs.stripe.com/refunds)

The existing `charge.refunded` handler records the refunded amount and updates the
customer/CRM payment state. **Current behavior hides the result after either a
full or a partial refund.** This plan preserves that behavior; it does not promise
continued access after a partial refund or a new automatic refund email. Previously
sent result emails cannot be recalled. Check Stripe delivery and refresh the
application after a refund; if delivery failed, resend the event to this destination
and verify the state rather than editing payment amounts in the database.

## Release order and stop conditions

All actions below are future work, after explicit authorization. First complete
both workflows on dev Preview and extend this pre-evaluation configuration plan
for credential evaluation; the current manifest cannot enable that service.

1. Confirm the canonical origin, live merchant account and operating staff owner.
   Snapshot existing Production configuration/deployment; confirm old app links
   and unfinished service entry points will remain on the old system.
2. Review/rehearse the empty six-table provisioning migration, verify backup and
   restricted-role isolation and Preview schema parity, then provision only the
   approved new target. Keep old Production tables/data intact. Verify
   sender, original Dropbox access and AI model access without customer records.
3. Prepare the Production-only manifest and dedicated live webhook configuration.
   Review the full `dev`/`main` release diff, not just the last runtime commit.
   Do not merge `main` while deployment prerequisites remain incomplete.
4. Deploy the reviewed main release in the agreed window; verify startup, HTTPS
   origin, staff login/unassigned access, email assets and webhook routing. Do not
   advertise the new intake until controlled acceptance passes.
5. With separate authorization for the payment, run one controlled USD 19.88 live
   application/upload/payment/result/email journey. Confirm the applicant receives
   both emails and the operator sees the same order/documents in CRM. Check a
   manual refund and existing refund-state synchronization; this is acceptance
   of existing behavior, not new refund development. Stop on any mode/account,
   recipient, storage, authorization or payment-state mismatch.
6. Complete the separately authorized credential journey as well, including
   application-linked payment, staff review, PDF publication and customer mail.
   Point both evaluation entry links to `/application` only after both pass.
   Record the release and operating contact. Existing mobile checks are accepted; no additional mobile
   suite or optional tracking project is required for this first release.

Before taking new orders, rollback may restore the recorded prior deployment and
configuration. After a live order exists, do not blindly restore code that cannot
serve its UUID or webhook: stop new intake/Checkout using a reviewed operational
pause or compatible release, preserve payment/result access and fix forward or
replay failed events. Removing a public link alone does not disable direct access.
Do not drop tables, delete documents or assume old AET App can read new orders.
A compatible pause/rollback method must be confirmed in the release review; this
plan introduces no new kill-switch setting.

## Preparation status

Prepared: configuration names/values, proposed origin, six-table/credential
boundaries, webhook event list, manual refund procedure, release and rollback
sequence for pre-evaluation. Pending: credential runtime/configuration support,
joint acceptance, actual Production configuration inventory, confirmed host and
merchant ID, reviewed provisioning SQL, provider permission checks and authorized
activation/live acceptance. No secret values, Production mutations, deployment,
refund, commit or push were performed while preparing this document.
