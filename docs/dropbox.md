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
  Dropbox root. Status uploads and CRM reads use the same legacy folder rule:
  `{account base}/{office}/{fullName} - {applicationId}`. LA archive copies also
  follow the legacy rule. Previously uploaded files are not automatically moved.
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
- Pre-evaluation uses Miami and the original stored email as the folder key,
  preserving spelling for the legacy standalone lookup. This does not replace
  dev's existing isolated pre-evaluation pipeline. `readDiplomaImage` retains server-side retrieval of the
  first image, including paginated listings. The native fetch adapter supports
  the legacy SDK's download response interface.
- `FileManager` has a `showPreviewLink` option for a trusted staff host.
  Dropbox preview itself still requires the employee's Dropbox access.
  This option is not enabled by a customer-controlled query parameter.

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
folder. It does not create or update application records. This retains the
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
No service-role key or database/RLS changes are needed. Set
`DROPBOX_DOCUMENTS_ENABLED=true` only when configured. `.env.local` is ignored;
Git does not publish its values.

Each chunk request is roughly 4 MiB plus small JSON overhead. The server limits
it to 4 MiB + 32 KiB and ordinary multipart uploads to 3 MiB + 64 KiB.
Upload handlers declare a 60-second duration; Dropbox calls time out after
25 seconds and token refresh after 15 seconds. Verify the actual hosting
platform's body/time limits and both office accounts after deployment.
Restart a locally managed server after environment changes.

## Verification

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
Hosted verification and real-applicant acceptance remain release tasks.
