# Main Preview configuration and verification

Verified November 12, 2026. This is a Preview setup and smoke check, not a
Production release or a new complete payment/fulfillment acceptance run.

## Deployment

- Source: merged main `4d5e896`, plus dedicated Preview-origin fix `eac0b3c`.
- [Ready deployment](https://vercel.com/meiyutechs-projects/aet-website-2026/GgEPHqytrDmRdJYFuBzcdnQLpWPG):
  `dpl_GgEPHqytrDmRdJYFuBzcdnQLpWPG`, environment Preview, target null.
- [Stable test site](https://aet-main-preview-meiyutechs-projects.vercel.app/zh/application).
- Uploaded from a clean temporary main checkout; unrelated evaluation-feed
  changes in the main working directory were excluded and preserved.
- The origin fix is now fast-forwarded into local main. It was not pushed.
- No local production build was run. Targeted origin/release/environment tests:
  **76 passed**. TypeScript passed. Vercel's hosted build reached Ready.

## Configuration boundary

Vercel disallows a Preview variable override for the Production branch main.
43 dev-specific Preview entries were moved in place to default Preview scope;
four identical shared Preview/Production entries and their dev overrides were
left unchanged. Added `APPLICATION_PREVIEW_ALIAS` for the dedicated test hostname.
The four application/payment origin settings now use that hostname. Sensitive
values were retained within Vercel rather than exported or rewritten.

Default Preview settings also apply to future Preview branches. Existing Git
fork protection is retained. The stable test alias has the same public access as
the former dev alias; CRM still requires employee authentication and authorization.
Unique deployment URLs retain Vercel authentication. Production SSO settings were
not changed. The former dev deployment remains available, but future testing
should use main Preview.

Application data remains in the existing six-table Preview schema. Staff identity
and CRM Live retain their existing separate connections. CRM Live is real legacy
data, so a Preview deployment must not be treated as a sandbox for Live edits.
No schema, grants, staff memberships or legacy tables were changed.

Existing **test-only** Stripe endpoint `we_1UTTP2JMcR2XIhynZXyFcdYa` now targets
`https://aet-main-preview-meiyutechs-projects.vercel.app/api/pre-evaluation/stripe-webhook`.
Its signing secret and event subscriptions are unchanged. Live Stripe was not
used or modified. There is no temporary relay or new temporary signing secret.

## Verified behavior

- `/application`, its Chinese evaluation page, the dedicated pre-evaluation
  landing page and public `/admin/calendar`: HTTP 200.
- In-app browser: synthetic contact and education details progress through all
  three credential form steps. Paper delivery requires address fields and blocks
  review when missing. Course-by-course Same Day costs US$450, with the local
  13:00 cutoff visible; PDF delivery adds US$10 for a US$460 review total.
- No formal submission was sent: the existing pilot would email the controlled
  recipient and copy the selected office. No new confirmation mail was tested.
- Anonymous `/admin/CRM`: 307 to `/admin/login`; `/api/staff-workspace`: 401.
  Owner completed staff login in Chrome. Live Applications and Test lists loaded.
  Test view displayed six synthetic formal applications for this account.
  Searching exact ID `c854b2bc-189a-4ab9-9fdf-eb4179070655` returned one record;
  choosing Los Angeles excluded that Miami record, and Miami restored it.
  Its Education, Service, Documents, Payment and Activity sections loaded:
  two qualifications, a US$150 total, one synthetic PDF, unpaid status and an
  existing sent confirmation record. No record edit, export, upload, resend,
  payment or permission change was performed. Browser console captured no errors.
- Current staff UI offers San Francisco, Los Angeles and Miami, without an
  Unassigned option. Live Pre-evaluation displays zero records. Source inspection
  confirms legacy pre-evaluation tables have no office column and are read only
  when `include_unassigned` is granted. The empty list is consistent with this
  access boundary; broader pre-evaluation visibility was not bypassed or tested.
  Decide the intended grant separately before using this account for that queue.
- Empty formal intake returns `400 invalid_request`, rather than configuration
  unavailable. A wrong webhook signature returns `400 invalid_signature`.
- Existing synthetic pre-evaluation `02983bc3-b19d-487e-95ac-e2a5c1e75197`:
  lookup returns 200 and the new site's customer page shows paid/completed,
  the saved result and its supporting file. Download returns a valid 1,190-byte PDF.
- Stripe CLI re-delivered existing test event `evt_1UajZkJMcR2XIhynqjM4cagN`.
  Vercel request logs show Stripe's POST to the new alias returned **200** at
  `2026-11-12T22:25:31.575Z`; Stripe subsequently reports zero pending webhooks.
  This validates the existing signing secret on the new URL, not a fresh charge.

## Production preservation

After setup, API comparison confirmed:

- Production remains `dpl_CZMUpnHKQXtaa3vUMPKjPKify72Y`.
- The complete Production environment-variable metadata fingerprint is unchanged.
- `americantranslationservice.com`, `www.americantranslationservice.com`, and
  the `aet-website-2026-git-main-meiyutechs-projects.vercel.app` alias still point
  to that Production deployment.
- No main Git push, Production deployment, live payment, database migration or
  new scheduler was performed.

## Remaining scope

Use main plus explicit Preview deployment for ongoing development. Pushing main
still triggers the existing Production automation; this task did not change it.
See [deployment instructions](../development.md#vercel-preview).

Authenticated CRM read-only verification is complete within the current account's
scope. Unassigned pre-evaluation access remains an owner decision. Unified
pre-evaluation submission and credential payment/staff/report fulfillment remain
unfinished product work. A new complete application/upload/payment/mail journey
was not repeated here; prior dedicated pre-evaluation acceptance is historical
evidence, not proof that those unfinished unified features now work.
