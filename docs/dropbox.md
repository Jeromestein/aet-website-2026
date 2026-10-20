# Dropbox integration

Source: the Dropbox utilities, API routes, file uploader/viewer, staff FileList,
and pre-evaluation diploma reader in the local `aet-app` repository.

## Behavior

- The existing dev `/status?applicationId={UUID}` page (including Chinese and
  Spanish routes) mounts the file manager inside its supporting-documents card.
  `/api/customer-status` signs access from the record it already loaded. The
  applicant does not re-enter an ID or email. The page retains saved service,
  delivery, payment, education, and confirmation-email details.
- `source=preview` selects the isolated intake database reader, not a different
  Dropbox root. FCE and pre-evaluation now share the write rule:
  `{account base}/{office}/{applicant full name} - {applicationId}/{file name}`.
  Status, CRM and the older local pilots resolve the same saved location. The
  application ID distinguishes repeat applications from the same person.
  Previously uploaded customer files are not moved, renamed or deleted.
- The default status source keeps the existing live/preview database selection.
  For live records, archive dates use `submitted_at`, with `created_at` as the
  fallback for historical records. Unknown IDs retain the existing error state.
- Only `submitted` and `processing` FCE applications can upload, matching the
  old status page. Other statuses can still list files. Both upload endpoints
  enforce the permission embedded in the server-issued token; the standalone
  email lookup applies the same rule. Permissions are a snapshot valid for the
  token's two-hour lifetime; refresh status to fetch current permissions.
- `/documents`, `/zh/documents`, `/es/documents` provide selection/drop,
  multiple files, sequential uploads, progress, cancellation, errors and a
  paginated, refreshable file list. Pages are noindex and omitted from the sitemap.
- PDF, JPG/JPEG, PNG, DOC and DOCX; 50 MiB per file and 20 files per queue.
  Files up to 3 MiB use a multipart upload. Larger files use sequential
  3 MiB chunks (base64 JSON), then a separate finish request.
- Miami, Los Angeles and San Francisco use `AET_App` and
  `/Team Files/WebsitesDev/{office}/{fullName} - {applicationId}`.
  Boston/New York use `AET_App_East` and
  `/WebsitesDev/{office}/{fullName} - {applicationId}`.
- Los Angeles also copies the committed file into
  `/Team Files/AET ALL Offices/AET Services/2-Foreign Credential Evaluation/{year}/{English month}/{fullName} - {applicationId}`.
  The date comes from the stored application submission date. The returned file
  ID and actual name are used, including after Dropbox renames a duplicate.
  A failed archive copy is a warning; the main upload remains saved.
- Dropbox add/autorename is retained. Different contents with the same name
  produce a renamed file. Identical contents can return the existing file.
  See the [Dropbox write-mode specification](https://github.com/dropbox/dropbox-api-spec/blob/main/files.stone).
- New pre-evaluation files use Miami and the application ID. For historical
  records, reads include both the ID folder and the old
  `{fullName} - {original stored email}` folder, preserving email spelling.
  New applications pin an ID-only location at creation, so a repeat application
  does not inherit another application's old email-folder access.
- `readDocument` reads only a file ID listed in this application's authorized
  folders. `readDiplomaImage` retains first-image retrieval across paginated
  historical and new listings. The native fetch adapter supports the legacy
  SDK's download response interface. This change does not enable AI processing.
- `FileManager` has a `showPreviewLink` option for a trusted staff host.
  Dropbox preview itself still requires the employee's Dropbox access.
  This option is not enabled by a customer-controlled query parameter.

## Saved locations and historical compatibility

`evaluation.document_locations` stores the office/account, canonical write path,
allowed read paths and optional LA archive path for each `(application ID, kind)`.
Cloud preview maps this table to `aet_preview_evaluation.document_locations`.
New applications pin their location in the creation transaction. Historical
records are registered on first document access; a live FCE office reassignment
also pins the existing location before changing an already assigned office.
Subsequent name/office edits never rebuild the saved paths. If an old record was
renamed before registration, its original path must be supplied from trustworthy
history; this does not discover arbitrary previous folder names.

The registry permits server-side SELECT/INSERT only, with RLS and no browser-role
access. Concurrent first access uses one saved location. Application authorization
still happens before resolution. No foreign key is used because the registry also
covers live legacy records that are not copied into preview application tables.
The registry contains references; file bytes remain in Dropbox.

Historical email folders are read-only fallback locations for this new code.
New writes always use the ID folder. Listings page through both locations; signed
continuation tokens bind to the application ID and kind, even when old email
folders were shared by repeat applications in the legacy system.

The older formal/pre-evaluation pilot keeps its stored per-file `dropbox_path`.
Existing `/Team Files/WebsitesDev/AET-PreEvaluation-Test/...` paths remain readable,
and retries reuse their recorded paths. New pilot files use the unified folder
with a UUID-prefixed filename to prevent overwrites; original names remain in
metadata. Formal pilot reports go under `_reports/`, which the customer document
list does not recurse into. Report release remains controlled by its existing
workflow. Status uploads retain their original names and Dropbox autorename.

## Serverless and access boundaries

Node route handlers proxy Dropbox requests. Browser bundles never receive
Dropbox credentials or raw upload session IDs. Upload context is authenticated
and encrypted with AES-GCM and expires with the two-hour access token. A key is
derived from each existing Dropbox app secret; no additional API key or service
is required. Upload progress does not depend on process-local maps. Only OAuth
refresh results are cached as an optimization.

The optional standalone documents access endpoint matches an existing UUID and contact email against
`fce_applications`, or `aet_core_applications` with purpose
`degree-equivalency`. It reads only the fields needed to derive the original
folder. It does not create or update business application records; document
operations can initialize the private location registry described above. This retains the
legacy application-ID access model with an additional email match for that
standalone form. The status endpoint deliberately accepts the UUID alone,
matching the old status-link flow requested by the owner. Neither is a login
or proof of mailbox ownership. Treat status links and application IDs as access
keys. The existing customer status response retains its authorized customer
fields; document access adds only an encrypted token and upload eligibility.
It does not expose database or Dropbox credentials.
Tokens stay in page memory, not URLs or browser storage; the legacy application
ID remains in the status URL for reloads and language switching.

Status/documents pages set no-referrer, private/no-store and noindex headers.
Next development overrides the page cache header to no-cache/must-revalidate;
API responses explicitly remain no-store.
Fresh visits do not load Google Analytics. Public-page analytics initialization
removes `applicationId` from its page URL and referrer (preserving campaign
parameters); the analytics opt-out flag is set while
on either private page. Do not add application IDs to analytics events.

Mutations require same-origin requests. Folder/account selection comes from
the server lookup, not browser-supplied office or name fields. Missing account
configuration fails closed without falling back to the other account.
Names, sizes, extensions, declared MIME, file signatures, chunk indexes and
byte counts are checked. Header checks are not malware scanning.

Append retries use Dropbox's acknowledged offset and verify the full Dropbox
content hash at finish. A mismatch is reported for office review and skips the
LA archive. It does not automatically delete the committed file: Dropbox may
return an already-existing identical file, and a client-supplied hash must not
be able to erase that file. The UI asks the applicant not to upload it again
until the office has checked it.
Only appends retry automatically; commits do not, because a lost response
could have saved a file. An uncertain commit prompts the applicant to refresh
the list before retrying. Cancellation closes an uncommitted session; the UI
disables cancellation while committing. Keep the page open: refresh/reload
resumption is not implemented.

## Scope relative to the old portal

The module is integrated into dev's existing application/status flow; it does
not replace dev's intake, payments, staff CRM, or pre-evaluation pipeline.
`/documents` remains an optional legacy UUID/email lookup. The compatibility
`/api/application-status` endpoint reads legacy records; the main status page
continues to use `/api/customer-status` and its explicit source selection.
The existing CRM Documents tab reads files through a staff-authenticated endpoint
that rechecks the selected application's office access on each request. Live and
intake records use the same folder resolver as Status. File links open Dropbox
preview, which requires the employee's Dropbox account. The server diploma reader
remains available for pre-evaluation consumers. Customer download/delete were TODOs in the source
and remain excluded. Existing API URLs are retained for upload/chunks/listing,
but their request contracts now require an application access token.

## Configuration and release

Copy both sets of the eight `DROPBOX_AET_App*` values from the existing
application environment into server-only hosting environment variables.
Use the original namespaces and access scopes. Also supply the existing
application project's URL and anon key for the optional legacy standalone lookup under
`AET_APPLICATIONS_SUPABASE_URL` and `AET_APPLICATIONS_SUPABASE_ANON_KEY`.
Dropbox calls do not need a Supabase service-role key. Location resolution uses
the existing restricted server database connection. Apply
`supabase/migrations/20261020230256_application_document_locations.sql` before
running this version. For the current private preview (or the configured local
pilot), run:

```sh
node --env-file=.env.local --import tsx scripts/dropbox/migrate-locations.mts
```

The script checks the configured target, maps the preview schema and verifies
RLS/browser-role denial. It was applied only to the private preview schema in this
run; it does not migrate customer data or change legacy business tables.

Set `DROPBOX_DOCUMENTS_ENABLED=true` only when configured. This flag now also gates
file upload/download in the older pilots; their payment, email-worker and AI
external-service guards are unchanged. Keep `PREEVAL_DROPBOX_ROOT` configured for
historical pilot-path compatibility. `.env.local` is ignored; Git does not publish
its values.

Each chunk request is roughly 4 MiB plus small JSON overhead. The server limits
it to 4 MiB + 32 KiB and ordinary multipart uploads to 3 MiB + 64 KiB.
Upload handlers declare a 60-second duration; Dropbox calls time out after
25 seconds and token refresh after 15 seconds. Verify the actual hosting
platform's body/time limits and both office accounts after deployment.
Restart a locally managed server after environment changes.

## Verification

### Unified paths — October 20, 2026

The current dev code passed 30 real integration assertions against synthetic
records/files: FCE and pre-evaluation uploads, byte-for-byte reads, historical
email/pilot paths, chunked pre-evaluation upload, repeat-application isolation,
cross-application read/cursor rejection, concurrent initialization, stable paths
across name/office changes, pilot metadata/retry deduplication, and report hiding.
Only generated fixtures were cleaned up, using recoverable Dropbox deletion.
No customer file was changed; no email, payment or AI call was made.

```sh
DROPBOX_LIVE_VERIFY=1 node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/dropbox/verify-locations.mts
```

This opt-in script requires the isolated cloud-preview database and a localhost
server. It creates uniquely identified synthetic folders, refuses to overwrite
existing fixture paths, and cleans up its own records/files.

The main Dropbox app passed actual uploads/downloads. The East app passed upload
and listing, but download returned a provider error for missing
`files.content.read`. Boston/New York download acceptance remains open until that
app has the scope and its authorization is renewed as required. No OAuth settings
were changed by this work.

The existing 3022 server also passed an in-app-browser Status upload, file-list
refresh and reload at 1280px and 390px. The uploaded bytes were verified through
`readDocument`, then the fixture was removed. Screenshots:
`output/playwright/dropbox-path-desktop.png` and
`output/playwright/dropbox-path-mobile.png`. TypeScript, 128 focused tests and
`node scripts/check-dropbox.cjs` passed. No build or deployment was run.

### Earlier module acceptance

`node scripts/check-dropbox.cjs` performs offline regression checks without
network access or local credentials. It covers account isolation, token
tampering/expiry, path/type/size validation, chunk order, lost-response replay,
cross-instance continuation, final hashes, cancellation offsets, pagination,
LA copies, application matching and HTTP boundaries.

Live synthetic testing on October 20, 2026 exercised both existing accounts,
regular uploads and listings, different-content duplicate renaming, LA copies,
three-chunk uploads and a repeated first chunk. The downloaded large file's
hash matched its source. All created test folders were removed through
Dropbox's recoverable delete API. No customer file was modified.

The initial module checks above ran before the worktree correction. The module
now lives in `aet-website-2026-dev` and the existing port 3022 is the verification
target. The main checkout was restored. Offline checks additionally verify
legacy folder parity, signed application binding, LA archive copies and status
capability derivation. See `status.md` for the transfer's actual browser evidence.
Subsequent October 20 hosted acceptance recorded live San Francisco document
reads and isolated Miami small/chunked uploads, reload persistence and CRM reads
at `58da862`. The later count/size fixes were verified locally, so recheck those
on the deployed dev commit. Hosted checks across both accounts and failure paths,
and real-applicant production acceptance, remain release tasks. See the current
[checklist](migration-checklist.md) and [progress analysis](status.md#2026-10-20--reconcile-dev-progress).
