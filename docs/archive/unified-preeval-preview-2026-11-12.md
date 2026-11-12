# Unified pre-evaluation — main Preview acceptance

Verified November 12, 2026, from main source commit `67a9cf1`. This accepts the
unified pre-evaluation journey in Preview, not credential fulfillment or Production.

## Deployment

- [Ready Preview deployment](https://vercel.com/meiyutechs-projects/aet-website-2026/BFBKZSh8NUDAB298o4LJc7aTanpy):
  `dpl_BFBKZSh8NUDAB298o4LJc7aTanpy`, target null, environment Preview.
- [Unified application](https://aet-main-preview-meiyutechs-projects.vercel.app/zh/application?service=pre-evaluation).
- Deployed an archive of the committed source; no local production build or Git
  push. Only the existing `aet-main-preview` test alias was reassigned. Existing
  Preview configuration, test Stripe webhook and six-table schema were reused.

## Completed customer journey

Synthetic application: `4cc65e14-00e6-42a5-b177-4f487269d7da`.

1. In-app browser: filled all three unified form steps in Chinese with fictional
   organization, contact details, evaluee and education; selected Los Angeles.
   Review showed USD 19.00 plus USD 0.88, total **USD 19.88**.
2. Submitted once and reached the saved application's document section. Contact,
   phone, office, pronouns and applicant notes persisted in existing canonical
   fields; the source is `unified-application`. No new tables or migrations.
3. Uploaded one PDF explicitly labelled as a synthetic document, not a real
   credential. Dropbox saved it; downloading it matched the original SHA-256.
   Upload completion started analysis. The unpaid response withheld the result.
4. Completed Stripe Sandbox Checkout with a standard test card, with saved-payment
   information disabled. Stripe verifies `livemode: false`, paid USD 19.88 and
   metadata referencing this exact application. No real charge occurred.
5. Returned automatically to the Chinese customer page with paid/completed status
   and a released result. AI correctly returned “Unable to determine” because the
   supplied document is fictional; this verifies the workflow, not equivalency
   accuracy for a real qualification. One completed AI run and one payment exist.
6. Resend reports both English confirmation and result emails as **delivered** to
   the configured controlled recipient. The fictional applicant email was not used.
7. Existing authenticated Chrome CRM Test view found the application by ID. Its
   row showed Los Angeles, Mx., the matching qualification, USD 19.88 paid,
   completed status and one document. Details matched organization, phone and
   applicant notes. No CRM Live records or staff permissions were changed.

## Webhook, compatibility and Production boundary

- Checkout event `evt_1Ub7epJMcR2XIhynHL5dTpSQ` has zero pending webhooks. Existing
  test endpoint `we_1UTTP2JMcR2XIhynZXyFcdYa` is enabled and points directly to
  the main Preview webhook. No relay, secret rotation or new endpoint was used.
  This pass did not manually replay the event; earlier replay acceptance remains
  documented separately.
- Old Chinese dedicated form returns 307 to `/zh/application?service=pre-evaluation`;
  `/zh/apply` returns 307 to the evaluation choice. Saved result URLs remain usable.
- Production remained on `dpl_2u8V3HsNDMb3A8iFotkS6EkfCcZY` (`69ffa5c`). Before/after
  environment-record fingerprints match. Production `/zh/application` still
  redirects to the legacy portal; public `/admin/calendar` returns 200.
- No Production configuration, live Stripe, schema/grants, existing business data
  or staff access was modified. Test application/file/email records are retained.

## Evidence and limits

- Local sanitized verification: `/private/tmp/aet-unified-preview-20261112/evidence/`;
  includes provider/database checks, deployment comparison and result screenshot.
- Prior local checks: 111 focused tests, 31 six-table integration cases, TypeScript,
  locale checks and desktop/390px form checks passed.
- This hosted browser journey used desktop/default viewport. A full mobile payment
  run, optional no-document hosted submission, failure injection, manual refund
  and live Production acceptance were not repeated.
- Credential staff review, linked payment and final report publication remain open;
  both services must be ready before the owner's joint launch.
