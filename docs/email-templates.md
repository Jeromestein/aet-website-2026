# Business email templates

All seven categories use code-owned React Email templates and the 2026 website
palette, complete AET logo, structured content and linked footer. Render from
current application/business records when sending; never store subject or HTML.
The development-only gallery is `/api/email-template-preview` on port 3022.

| Preview kind | Business email | Legacy equivalent | Source/trigger |
| --- | --- | --- | --- |
| `intake` | Formal application confirmation | ApplicationConfirmation | Saved intake application and submitted quote snapshot |
| `payment` | Payment confirmation | PaymentConfirmation | Validated formal pilot payment transition to paid |
| `fee_update` | Service fee update | DueAmountChange | Saved formal pilot staff quote and audit reference |
| `confirmation` | Pre-evaluation application confirmation | DEApplicationConfirmation | Saved pre-evaluation application |
| `result` | Preliminary assessment | DEResultsConfirmation | Paid, currently releasable referenced result version |
| `information` | Additional information request | New workflow notification | Referenced staff request, not the latest arbitrary message |
| `access` | Customer application lookup | New workflow notification | Customer application ID and lookup link |

Legacy templates were checked in `aet-app/src/app/(frontend)/(aet-app)/components/Email/templates`.
Thanksgiving/Christmas promotional templates are excluded at the owner's request.
Staff email-link login and password recovery remain removed.

## Visual design

Business emails use the blue-gradient design approved on 2026-10-20.

- Use the full transparent logo at 286px desktop/254px mobile within a compact
  white header and a 600px letter. Keep Poppins 400/600/700 and Arial/Helvetica
  fallbacks. Image/font URLs use the shared public HTTPS asset origin.
- Lead with a navy-to-blue gradient, subtle light at the top right, a short white
  Title Case heading, one explanatory sentence and one orange pill-shaped action.
  Keep a solid navy fallback. Headings/actions remain real HTML text, not artwork.
- Place the greeting, readable application reference, service/education details,
  compact ruled amount section, next steps and signoff in the white body. Retain
  confirmed-payment details, fee ranges, quote-pending states and result caveats.
- Use a light, quiet footer with company identity and Website, Application status,
  Contact and Privacy links. Keep pilot disclosures outside the letter.
- Share this structure across all seven business templates. Use tables and inline
  styles; responsive padding targets generated table cells. Keep pale-blue panels
  for assessment results and information requests. Promotional and staff login
  emails remain excluded. Never invent payment dates or completion estimates.

## Public email assets

All seven templates default to `EMAIL_ASSET_ORIGIN`, independently of application
and status-link origins. The fallback and example configuration are
`https://www.americantranslationservice.com`. This public host already serves the
exact header PNG and Poppins files from this repository. Localhost, HTTP, IP-based
and malformed asset-origin configuration is rejected before rendering.

The dev gallery uses this same public asset origin, so a local preview no longer
hides a localhost image URL in outgoing mail. Templates retain an explicit asset
origin override for controlled rendering, but senders use the shared public default.
Deployments should keep the logo and font paths publicly accessible without sign-in.
Changing sender domains does not change image hosting. Previously delivered email
HTML is immutable; a new send is required to verify the corrected image URL.
Application/status links remain local in the isolated pilot; this is not a payment
or application-origin cutover. Web-font support still depends on the mail client.

## Sender and office copies

Use `AET <info@americantranslationservice.com>` through the sender environment
variables. The dev worktree's local configuration and `.env.example` use these
values; production configuration has not been changed.

Formal intake confirmations, payment receipts and fee updates resolve CC from
saved application data at send time, preserving the legacy office mapping:

| Office | CC |
| --- | --- |
| Miami | `info@americantranslationservice.com` |
| Los Angeles | `ca2@aet21.com` |
| San Francisco | `ca@aet21.com` |
| Boston | `boston@aet21.com`, `boston@americantranslationservice.com` |
| New York | `nyc@aet21.com`, `nyc@americantranslationservice.com` |

The current evaluation form offers Miami, Los Angeles and San Francisco. Routing
supports both saved office IDs and legacy names, excludes duplicate To recipients,
and blocks unknown offices rather than copying an unrelated team. CC is included
in the delivery digest, so changed routing requires review before retrying.
Pre-evaluation records currently have no office field, so no office is inferred
for those notifications. All email flows share the sender environment settings.

## Payment and fee delivery

`evaluation.emails` contains the application ID, payment or quote-audit ID,
recipient, dedupe key and delivery/retry metadata. Payment confirmation is queued
atomically with the first successful payment transition. Replayed webhooks and
reconciliation do not create a second receipt. The recorded confirmation timestamp
is labeled **Confirmed on**; historical payment dates are not backfilled or guessed.
No estimated completion date is displayed unless explicitly supplied.

Fee delivery reads the saved confirmed quote and verifies that it matches the
referenced quote audit. A later quote, cancellation or payment invalidates the old
pending notice. The template also supports an unconfirmed quote presentation;
`scenario=pending` previews this state, but the current staff quote action only
queues confirmed quotes. A refunded payment invalidates an unsent receipt.

The worker uses stable delivery IDs, bounded retries, leases and a content digest.
Changed content on retry pauses delivery for review; no rendered body is retained.
Apply `20261020173355_formal_email_delivery_records.sql` after the existing formal
workflow and metadata migrations. The guarded migration helper can target only a
local database or the isolated preview schemas.

## Current rollout boundary

These additions are connected to the existing optional formal pilot workflow.
The cloud-preview worker remains paused; the isolated test recipient restriction
is unchanged for the To recipient; formal emails now also copy the assigned
office as requested by the owner. Latest intake-version-2 payment actions remain read-only, and the
live CRM adapter does not send these notifications. Production payment/email
cutover is separate from this template work. Owner-authorized TEST intake
confirmations verified the new sender, Miami CC and public logo; no live
payment processing was enabled. The original delivery receipt was preserved and
the additional send has metadata-only audit history.

For a safe repeatable integration check, run `pnpm test:email:formal` with the
isolated preview environment. It creates synthetic records, tests quote/payment
references and replay protection, verifies browser-role denial, and removes its
fixtures. It does not call Resend or Stripe.

Browser previews verify layout, not Gmail/Outlook inbox rendering. The synthetic
preview uses public logo assets and deliberately nonfunctional application links.
