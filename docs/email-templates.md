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
is unchanged. Latest intake-version-2 payment actions remain read-only, and the
live CRM adapter does not send these notifications. Production payment/email
cutover is separate from this template work. No live sending or payment processing
was enabled or verified.

For a safe repeatable integration check, run `pnpm test:email:formal` with the
isolated preview environment. It creates synthetic records, tests quote/payment
references and replay protection, verifies browser-role denial, and removes its
fixtures. It does not call Resend or Stripe.

Browser previews verify layout, not Gmail/Outlook inbox rendering. The synthetic
preview uses local logo assets and deliberately nonfunctional application links.
