# Staff authentication and Payload migration

Updated October 15, 2026. This is the implementation and rollout record for
`/Users/plusone/Desktop/Code/aet-website-2026-dev`, previewed at
`http://localhost:3022`. The older `aet-app` checkout is a legacy reference only.

## Decision and current boundary

Use the existing Next.js application with Supabase Auth and a private staff
roster. This repository has no Payload package or runtime to remove. Its former
staff login used emailed access links, and is retained at `/admin/email-login`
until the explicit staff cutover. Customer access links remain independent.

The new `/admin/login` uses email and password. No registration, invitation,
or routine email verification step is offered. Administrators prepare membership
and office access; an employee enters the same email and password when the
migration is enabled. A password that does not meet the provider's rules is an
individual exception: verify the current password, then ask for a replacement.

Cloud authentication is connected directly to the existing Supabase project
`qrxztgdemfodemlcabcq` (`jhaccounting.org & AET`). It does not need Docker.
Business workflows now use a restricted cloud `PREEVAL_DATABASE_URL` and
private preview schemas in that same project. The frontend remains local on
3022; this is an isolated integration environment, not a production cutover.
No existing customer records were copied into it.

Both `.env.local` switches remain **false**:

- `STAFF_LEGACY_MIGRATION_ENABLED`: permits first-login creation of an approved,
  pending legacy identity and retirement of that account's old password hash.
- `STAFF_AUTH_CUTOVER_ENABLED`: disables the former staff email-login endpoint,
  creation/consumption of staff access links and old staff sessions. Customer
  links/sessions remain valid. Merely adding the new page does not revoke them.

Do not enable employee migration in a local preview while the employee still
needs the production Payload login. Already mapped, active Supabase staff can
sign in while migration is disabled. Unmapped employees receive a temporary
unavailability message; their existing credentials are not changed.

## Independent administrators without employee migration

New website-only administrators can sign in while both migration/cutover switches
remain false. They need a confirmed Supabase Auth identity with a password and an
explicit active private staff membership. An Auth identity alone grants no staff
access. No public registration, invitation or employee migration is required.

The owner created `errplusone@gmail.com` in the Supabase dashboard and entered its
password there, with Auto confirm enabled. The separately approved membership is
`admin`, all five offices, including unassigned records. It has no legacy user ID;
no Payload user was created. Application provisioning sent no email and did not
read, change or store the owner's plaintext password.

For an explicitly approved future independent administrator, create and confirm
the Auth identity and set its password in the dashboard first. Then run this
server-only command, which defaults to validation without writing:

```sh
node --conditions=react-server --env-file=.env.local --import tsx \
  scripts/staff/add-native-admin.mts administrator@example.com
# After approving administrator access to all five offices and unassigned records:
node --conditions=react-server --env-file=.env.local --import tsx \
  scripts/staff/add-native-admin.mts administrator@example.com --apply
```

This command refuses legacy users, missing/unconfirmed Auth identities, missing
passwords and conflicting memberships. Repeating the same approved provisioning
is idempotent. It does not create Auth users, reset passwords or send invitations.
Use a separately reviewed permission change for a narrower office scope.

`scripts/staff/sql/202610150004_native_staff.sql` was explicitly applied to the
cloud private tables. The existing UUID `migration_id` is now the stable staff
primary key; `legacy_user_id` is optional but retains its uniqueness and foreign
key. Recovery tokens reference the stable staff UUID, with compatibility for old
legacy-linked tokens. Browser database roles still cannot read the private tables.
The complete legacy user table and all three original employee credential/scope
fingerprints compared unchanged after setup and real account provisioning.

`scripts/staff/verify-native-cloud.mts` exercises independent membership, password
login, dashboard access, all-office permissions, single-use recovery, password
reset, deactivation and logout with a disposable `.invalid` identity. It issues
test recovery nonces directly and sends no mail. Require
`STAFF_AUTH_SYNTHETIC_TEST=true` and keep both employee switches false. The current
pass completed 20 cloud/cleanup checks and removed its synthetic identity. Browser
verification reached the original CRM and signed out using that test account;
the owner's real password login remains for the owner to perform.

## Payload dependency inventory

The inventory below distinguishes the legacy source from this destination.
Earlier edits made in the wrong `aet-app` checkout were restored; that checkout
was verified clean. No removal change was deployed or pushed.

| Area | Legacy dependency | Destination and disposition |
| --- | --- | --- |
| Users and passwords | `Users` collection has `auth: true`; Payload 3.12 uses the legacy `public.users` password fields | Small Node verifier plus Supabase Auth; preserve integer legacy user IDs and map to Auth UUIDs |
| Admin shell and sessions | Payload admin catchall, generated import map, `payload.auth()`, `payload-token`, `/api/users/me` | Existing Next.js staff shell, verified Supabase sessions and server-side membership checks |
| Permissions | CRM hard-codes three email-based office groups | Owner-approved office arrays in `aet_private.staff_accounts`; enforce in list/detail/mutation/file paths |
| Database adapter | Payload Postgres adapter registers CMS and business tables through schema hooks | Preserve business schemas/IDs; reviewed explicit SQL, never destructive schema synchronization |
| Email | Legacy `getPayload()` / `payload.sendEmail()` wrappers | This repository already uses Resend; staff recovery sends only to the requester |
| CMS/content/media | Pages, Posts, Categories, Header, Footer, media/S3, Lexical and SEO/search/redirect/form plugins | These do not become dependencies of the new login. Preserve any active legacy URLs/media until each consumer is accounted for |
| REST/GraphQL/preview | Payload-generated API catchall, GraphQL, preview and seed tooling | Retire only after caller inventory and full legacy feature replacement; never invoke seed tooling during migration |
| Build/tooling | `withPayload`, `@payload-config`, generated types and import-map scripts | Absent from this destination; no Payload package removal is necessary here |

Legacy packages include `payload`, `payload-admin-bar`, and `@payloadcms/`
`db-postgres`, `email-resend`, `live-preview-react`, `next`, `payload-cloud`,
`plugin-form-builder`, `plugin-nested-docs`, `plugin-redirects`, `plugin-search`,
`plugin-seo`, `richtext-lexical`, `storage-s3`, and `ui`. Retiring that old
application is a separate final step after all active business tools are covered;
a new login does not replace its payment, degree-equivalency, order-import,
webhook, email, Dropbox, or AI integrations by itself.

## Approved roster and preparation

| Email | Role | Offices | Unassigned records |
| --- | --- | --- | --- |
| tech@meiyugroup.org | admin | Boston, New York, Miami, San Francisco, Los Angeles | Allowed |
| ca@aet21.com | staff | Miami, San Francisco, Los Angeles | Allowed |
| edzhaotalk@hotmail.com | staff | Boston, New York | Allowed |

All three were confirmed by the owner. They remain active and **pending**, with
no Auth UUID assigned and the original password hash/salt intact. Office grants
are private database records, not user-editable metadata or email-domain rules.

Two preparation statements were already applied to the cloud project earlier in
this task. Their reviewed source is archived in `scripts/staff/sql/`:

1. `202610150001_protect_legacy_staff.sql`: deny `anon`, `authenticated` and
   `PUBLIC` access to `public.users`, and enable RLS. The server database owner
   used by Payload retains access; no employee password is changed by this DDL.
2. `202610150002_staff_auth.sql`: create the private roster, persistent attempt
   counters and recovery nonce table; seed exactly the approved three entries.
   Existing rows are not overwritten on a rerun.

These are records of cloud preparation, not automatic local workflow migrations.
Do not put them into the normal Supabase migration directory or run them as part
of application startup. No business table, business row, storage object or Auth
project-wide signup setting was changed by this preparation. The shared project's
remaining business Data API grants/policies still require coordinated review
before production cutover; application-side office filters alone do not fix
legacy direct-API exposure.

An encrypted pre-change database backup exists outside this checkout. It was not
copied here with the approved connection configuration. No credentials or backup
material belong in version control. A full restore rehearsal remains a rollout
prerequisite; archive integrity checking alone is not a restore test.

## Password preservation and failure behavior

The inspected legacy algorithm is PBKDF2-SHA256 with 25,000 iterations and a
512-byte result, stored as 1,024 hexadecimal characters. The salt is the stored
64-character hex **string**, not decoded salt bytes. Password whitespace and
Unicode are preserved; comparison is constant-time.

The migration uses verified first login rather than treating a PBKDF2 value as a
Supabase password hash. Supabase documents first-login migration from another
provider as an approach in its [migration guide](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth).

1. Normalize only the email and apply persistent attempt limits. Require an
   active, explicitly pending roster entry and honor the legacy lockout.
2. Lock that staff row and verify the submitted password against the old hash.
3. Use server-only `auth.admin.createUser` with the verified password,
   `email_confirm: true` and an immutable migration marker. This method does not
   send a confirmation email; see the [Admin API reference](https://supabase.com/docs/reference/javascript/auth-admin-createuser).
   Never call signup or invitation APIs.
4. Save the Auth UUID and completed state, then clear only this employee's legacy
   password/reset material. Sign in normally with Supabase and issue an HttpOnly,
   SameSite=Lax cookie, Secure on HTTPS.
5. Subsequent logins use Supabase credentials exclusively. A password reset must
   never make the retired old password valid again.

Concurrent first logins share a database row lock. If Auth creation succeeded but
its response or database commit was lost, retry reconciles only an identity with
the matching immutable marker. A same-email identity with any other marker is
blocked for manual reconciliation; its password is never overwritten.

Recovery uses a random single-use nonce stored only as a digest with a 30-minute
expiry, delivered by Resend after a user request. The token is in the URL fragment
and removed from browser history after hydration. A verified recovery may create
a pending identity only while migration is enabled. Tokens are consumed before
password changes; a provider failure requires a fresh link. Recovery responses
are generic, including mail delivery failures. Tests do not send recovery mail.
Project-level security-notification delivery/hooks were not changed or fully
validated; verify them before rollout rather than promising all emails are muted.

## Configuration

Keep these in the correct checkout's ignored `.env.local`:

```dotenv
SUPABASE_URL=https://qrxztgdemfodemlcabcq.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STAFF_AUTH_DATABASE_URL=
STAFF_LEGACY_MIGRATION_ENABLED=false
STAFF_AUTH_CUTOVER_ENABLED=false
PREEVAL_ORIGIN=http://localhost:3022
```

The URL/public key, service credential and staff database connection must all
identify the same project. The database connection is server-only and privileged;
never prefix it or the service credential with `NEXT_PUBLIC_`. Auth helpers use a
separate pool from business data, with connection/query timeouts. Roster tables
are inaccessible to browser roles. Authorization checks use Auth `getUser()` and
current database membership, not an unverified session object.

The owner approved copying only this same project's database/public connection
configuration from the old local config. The service key already present here was
preserved, and no backup or business data was copied. The owner restarted 3022.
No further server restart was performed by Codex.

## Verification and reproducibility

- Unit checks: password compatibility, collisions, interrupted-creation
  reconciliation, migration pause, lockout, weak-password exceptions, office
  authorization, HTTP origins, request size, rate limiting, membership and
  generic recovery responses.
- `scripts/staff/verify-cloud.mts` uses only a uniquely named synthetic account
  with a negative legacy ID and `.invalid` email in the explicit cloud project.
  It temporarily enables migration **inside that CLI process only**, checks
  concurrent migration, original-password login, refresh, 3022 cookies and CRM
  page access, recovery/reset, inactive-account denial and logout. It cleans up
  fixture Auth/legacy/private records and checks real staff records are unchanged.
- The test does not invoke the application's recovery mail sender. It does not
  read customer rows, upload files, create payments or migrate real employees.
- Run the standalone cloud script with Node 22+ (native WebSocket required by
  the installed Supabase SDK). The existing Next server on Node 20 passed the
  HTTP acceptance checks; the bare Node 20 CLI fails before fixture creation.

```sh
pnpm exec tsc --noEmit --incremental false
pnpm exec vitest run
# Only for a deliberately authorized synthetic acceptance pass against this project:
STAFF_AUTH_SYNTHETIC_TEST=true node --conditions=react-server \
  --env-file=.env.local --import tsx scripts/staff/verify-cloud.mts
```

Use the owner's running 3022 server. No Docker or production build is needed for
these Auth checks. Results and visual evidence are recorded in `docs/status.md`.
The separate business acceptance below exercises actual HTTP operations and
database transitions. External payment, file-storage, email and AI delivery
remain outside that acceptance scope.

## Cloud business preview

The owner-run 3022 server connects directly to cloud project
`qrxztgdemfodemlcabcq` with `PREEVAL_DATABASE_MODE=cloud-preview`. No Docker,
second Supabase project or local database is required for this mode.

| Logical tables | Private cloud destination |
| --- | --- |
| Five existing `public.aet_core_*` / `public.fce_*` business tables | `aet_preview_legacy` |
| `preeval` workflow, outbox, sessions and audit | `aet_preview_preeval` |
| `evaluation` workflow, files, payments and audit | `aet_preview_evaluation` |

`businessTableName()` selects these fixed identifiers, quoted by the Postgres
client. HTTP input cannot select schemas. Configuration requires the exact cloud
project, restricted role, localhost:3022 and both staff switches set to `false`.
A privileged remote business URL is rejected. The optional local mode retains
its original table names.

The server business login `aet_preview_runtime` can read/write these preview
tables only; it cannot read `public.users`, `auth.users`, `aet_private` or the
production business tables, or update production applications. It has no role,
database creation or RLS-bypass privilege. Preview tables have RLS enabled and
server-role policies; `anon` and `authenticated` have no schema access. This
separates server database access from staff office authorization, which is
checked on every protected HTTP operation. See the official
[Postgres roles guidance](https://supabase.com/docs/guides/database/postgres/roles).
The separate Auth pool still needs the privileged connection for the legacy
migration and membership checks; do not confuse it with the restricted business
connection.

`scripts/staff/setup-cloud-business.mts` prepared 23 tables across three schemas.
It copied the five legacy table **definitions**, check/index constraints and
three internal foreign keys, with no customer rows. Workflow triggers target
only the preview schemas. It never changes production business policies or
triggers. Rerunning does not rotate an existing role password and refuses a
partial schema setup. Its configuration output contains no secrets. This is
explicit setup tooling, never an application-startup migration.

Cloud-preview external service behavior is deliberately bounded:

- Confirmation messages are queued and deduplicated, but the mail worker makes
  no delivery attempt. Staff recovery is separate and was not invoked in this
  acceptance pass.
- Stripe and Dropbox calls are blocked before network access; authorized file
  downloads return service unavailable. A forbidden office fails authorization
  first. File metadata and report release can still be tested with fixtures.
- AI processing and the worker entry point are disabled. Synthetic payment and
  result transitions test the database bridge without charging or assessing a
  real customer.

Run the cloud business acceptance only against this explicit preview:

```sh
STAFF_AUTH_SYNTHETIC_TEST=true node --conditions=react-server \
  --env-file=.env.local --import tsx scripts/staff/verify-business-cloud.mts
```

It uses Node 22+ and the existing 3022 server. It creates three disposable staff
identities with the approved office scopes and six cases per workflow (five
named offices plus unassigned). Negative legacy user IDs and `.invalid` emails
identify the synthetic staff. Confirmed Admin API creation does not call signup
or invitations. Cleanup removes the test Auth identities, private staff rows and
business records, and compares hashes of the real staff credential/membership
snapshot and production table-policy/trigger catalog before and after.

Checks cover scoped lists, details, notes, file denial, report release, customer
access links, unassigned grants, immediate deactivation, customer isolation,
optimistic concurrency, idempotent submissions, exact prices and legacy field
bridges. Formal queue office labels and access filters both use the authoritative
legacy record, including a null office, even if a workflow JSON snapshot differs.
Boston/New York formal cases are seeded legacy fixtures; the current public
formal application form still offers its existing three office choices.

For one bounded browser pass, `--keep-for-browser` retains only these synthetic
fixtures and writes their credentials to a mode-0600 temporary manifest outside
the repository. Finish with the same command plus `--cleanup`. Never commit that
manifest or include its contents in logs. Do not run the older local fixture,
worker, Stripe-listener or database-setup scripts in cloud-preview mode.

Read-only policy inspection found legacy production business access broader than
the new office rules: for example `public.aet_core_applications` has RLS disabled,
and other legacy tables have permissive policies. Those settings were left
unchanged to preserve current app behavior. Coordinated caller inventory and
policy remediation remain required before production cutover; this private
preview does not claim to secure old direct Data API paths.

## Remaining rollout sequence

1. Promote the verified preview design through a reviewed production migration.
   Production still needs auxiliary workflow backfill/compatibility, existing
   customer receipt/access links, all old app tools and deployment configuration.
   Do not repoint the preview role or remove its containment guard to go live.
2. Preserve the tested allowed/denied office matrix in production configuration.
   Review direct Data API policies alongside existing legacy callers. Finish
   external customer/payment/webhook, Dropbox and worker/email acceptance; the
   cloud business pass uses synthetic payment and file metadata only.
3. Rehearse backup restoration, confirm mail sender/recovery origins and shared
   Auth settings, and prepare a release rollback that keeps Supabase login for
   already migrated staff. Deploy through the owner-managed release process.
4. At the approved production switch, enable migration and staff cutover together.
   Employees enter their usual email/password; the first successful login creates
   their Auth identity silently. Resolve any password-policy or preexisting Auth
   collision individually. No bulk invitations or forced re-registration.
5. After all three mappings are verified, close the migration switch and remove
   the temporary legacy verifier in a later reviewed cleanup. Retain legacy user
   IDs while foreign-key relationships need them. Retire the old Payload app only
   when all active consumers have replacements.

Before any employee migrates, reverting the new login page/config is reversible.
After migration, restoring an old hash would re-enable a superseded password and
is not a safe rollback. Keep authentication on Supabase while rolling back other
UI/business changes. This pass did not deploy, push, enable employee migration,
or disable production Payload access.
