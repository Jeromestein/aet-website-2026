# Payment provenance and integration boundary

- Form field names, required fields, service values, and the four payment-office
  choices follow the legacy `e-pay-content.html`. Its public business copy is
  retained in full; Chinese and Spanish translate that content for the shared route.
  The source's visible text was also compared with the live `e-pay.php` on
  September 30, 2026, with no missing source text on the live page.
- The form posts to the local `/api/payment/prepare` route. This ports the old
  PHP processor's PayPal Payments Standard HTML-form handoff to Next.js. It
  selects a merchant account by office on the server, validates the required
  fields, and submits the quoted amount in USD to PayPal. It requires no PayPal
  REST API client ID or secret.
- Keep `item_name` empty, matching the legacy processor: PayPal first displays
  its open-button Purchase details screen, where the buyer enters a description
  before continuing. Prefilling this field with the selected service skips that
  screen. Do not link to a captured shoppingcart session URL. This preserves the
  first landing step, not a guarantee of guest-card availability downstream.
- The four merchant account addresses come from the legacy
  `pay/includes/config.inc.php` and are configured through the server-only
  `PAYPAL_BUSINESS_*` values in `.env.local` or the deployment environment.
  `PAYMENT_SITE_URL` sets the return/cancel base URL. The local ignored
  `.env.local` was seeded from the old config; deployed environments need their
  own configuration and merchant review. Restart the dev server after changing
  these values.
- The old verification image is not reproduced: its check is inactive in the
  reviewed PHP processor, and a captcha from a different origin would not
  validate a submission on this page.
- At the owner's request, restore the full public deposit/check instructions,
  masked account numbers, routing/SWIFT details, addresses, Zelle steps and
  office selector. `bank-details.json` copies only the public legacy page's
  values; it does not contain PayPal environment configuration or unmasked
  account numbers. Keep source inconsistencies intact until the owner changes
  them: the Zelle panel initially shows Chase but all office clicks show Bank
  of America; the card introduction mentions $250 and the processing note $500.
- Restore all nine payment-processing rows and both lost-package policies.
  Shipping keeps all six source methods, times, fees and tracking indicators;
  numeric rates still come from the shared Pricing catalog. Shipping expands
  through a native disclosure. The source's processing/security claims are
  copied as content, not independently verified or evidence of new capabilities.
- A PayPal return is not proof of completed payment. The legacy IPN success
  handler and former application-storage include were empty/disabled, so this
  port does not claim automatic payment confirmation or fulfillment. The office
  must confirm receipt in PayPal. Do not publish this route as the public
  payment destination until the four payees, return/cancel states, and payment
  reconciliation have been reviewed and tested in a safe payment environment.
