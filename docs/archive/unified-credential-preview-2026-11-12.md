# Unified credential evaluation — main Preview acceptance

Date: November 12, 2026 (America/Los_Angeles).
Scope: complete the new credential intake on the existing six-table Preview.
No Production activation, configuration change, main push or database migration.

## Delivered behavior

- `/application?service=evaluation` saves the original education/service/delivery
  snapshot and language. Receipt, payment return and email links use the saved
  localized Status page.
- Authorized CRM Test staff can review, request missing materials, confirm an
  additional quote, verify payment, upload a private PDF draft and publish it.
- Customer Status shows the current fee, supplement request, Sandbox Checkout,
  paid state and released report download. Staff notes and draft reports stay private.
- Confirmation, information request, fee update, payment and report notifications
  retain compact receipts in existing service details. Preview sends only to the
  controlled recipient, with no office CC; no extra tables or scheduler were added.
- Existing version, payment, input-version and file-access checks remain in place.
  Shared Dropbox final commits serialize with staff updates/publication. A late
  upload cannot commit after completion; changed inputs invalidate old drafts.

## Hosted synthetic journey

Application: `7f51e3ea-76ea-4fec-a3e4-fe273d7a1147`.

[Customer Status](https://aet-main-preview-meiyutechs-projects.vercel.app/zh/status?source=preview&applicationId=7f51e3ea-76ea-4fec-a3e4-fe273d7a1147)
uses the isolated Preview data source. Search the same ID in
[CRM Test](https://aet-main-preview-meiyutechs-projects.vercel.app/admin/CRM?source=preview).

1. Submitted the Chinese three-step form in the in-app browser. Saved contact,
   Los Angeles office, identity, fictional degree, course evaluation, translation,
   PDF/paper report, USPS delivery and a clearly fictional “DO NOT MAIL” address.
2. Uploaded a synthetic credential. Staff requested a synthetic transcript;
   customer Status displayed that request and accepted the supplementary file.
3. Processing before payment returned the expected rejection. Staff confirmed
   USD 210 catalog evaluation/delivery fees plus USD 35 synthetic translation.
4. Completed USD 245 Stripe Sandbox Checkout with a test card. The existing direct
   signed webhook updated payment without a relay or manual database write.
   One payment row, one completed event and zero pending webhooks were observed.
5. Staff set Processing and uploaded `synthetic-report.pdf`. Anonymous customer
   download of the unpublished file returned 403. Explicit release completed the
   application and exposed its report link.
6. The in-app browser downloaded the published PDF. An independent download
   returned 200 and matched the uploaded file's SHA-256. Supporting files remained
   separate from the private report folder; completed application uploads closed.
7. Resend confirmed `delivered` for all five notification kinds, each attempted
   once, to the controlled recipient and with empty CC.

Provider evidence:

| Item | Identifier |
| --- | --- |
| Stripe completed event | `evt_1Ub896JMcR2XIhynXxTYKBLq` |
| Released report | `3b8aac46-05d7-4532-b26b-bb5b39563a4c` |
| Confirmation email | `01a1d234-9e43-73d2-88f3-2b0ade43f51c` |
| Information request | `01a1d239-7972-7136-9580-fa0256e76f23` |
| Fee update | `01a1d239-ee62-744f-b058-d19bc254343f` |
| Payment receipt | `01a1d242-33f9-792f-8b6d-2c455495bb1f` |
| Report notification | `01a1d245-c9fc-77de-a845-03579335dd89` |

## Source and checks

Source base: `ed0bae8`, with uncommitted scoped implementation changes.
The full journey ran on Preview deployment `dpl_9svESPCRSnozkRfkur8S871zQS3r`.
Final display/concurrency fixes use source archive fingerprint
`8152f3b94000f5e287f3bb59efc911409b5d38a548106353a212ab48151ecef0`.
Final deployment `dpl_7MzvWddKJpY1M6nXAFavAu6RxzVE` is READY and now owns the
stable main Preview alias. Rechecked the paid/completed customer and CRM views,
report hash, all five delivery receipts and anonymous admin rejection on this
version. Archives exclude all environment files; deployment is Preview only.

- 140 focused intake/workflow/email/status/release/CRM tests passed.
- 10 formal integration tests passed against disposable PostgreSQL, including
  fresh v2 submission, scoped mail, quote/payment/replay, draft/release/reopen,
  shared upload serialization and rejection after completion.
- 66 additional pre-evaluation/Dropbox regression tests passed.
- 54 upload-fencing/publication integration cases passed with disposable PostgreSQL
  and provider doubles (explicitly enabled after the ordinary run skipped them).
- TypeScript, EN/ZH/ES locale validation and diff whitespace checks passed.
- In-app desktop and 390px customer payment/report views passed. The mobile
  document width was 390px with no horizontal overflow. Confirmed quotes no longer
  display “awaiting quote.” Authenticated Chrome CRM shows USD 245, Paid, Completed,
  two supporting documents and the released report. Screenshots are retained in
  `/private/tmp/aet-formal-preview-20261112/evidence/`.
- Production remained at `dpl_2u8V3HsNDMb3A8iFotkS6EkfCcZY` / `69ffa5c`;
  before/after Production environment fingerprints matched. Its application URL
  still redirects to the legacy portal (307), Calendar returns 200, and the new
  Preview admin application API rejects anonymous reads (401).
- No local production build was run. The temporary `pnpm dev` on port 3021 exited:
  six-preview requires the configured hosted Preview. Its guard was preserved and
  UI acceptance used hosted Preview. No temporary development server remains.
- Chrome extension file upload lacked local-file permission; the report was
  selected through the native system file picker without changing permissions.

## Release boundary

This proves the synthetic Preview journey, not Production readiness or the
accuracy of a professional evaluation. No real credentials, live charge, actual
academic assessment, postal dispatch or refund was performed.

Remaining: credential Production runtime and applicant recipients; joint release
configuration/office-owner review; separately authorized live acceptance for both
services. Staff prepare PDFs and mail paper copies manually. Refunds stay in Stripe
Dashboard. Translation intake, automatic formal report generation, advanced
tracking and scheduled recovery remain deferred. Preserve all old Production tables.
