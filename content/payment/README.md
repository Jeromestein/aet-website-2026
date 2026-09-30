# Payment provenance and integration boundary

- Form field names, required fields, service values, and the four payment-office
  choices follow the legacy `e-pay-content.html`. English wording is adapted
  from that source; Chinese and Spanish are translations for the shared route.
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
- No payment, bank-account, or routing details are embedded in frontend code.
  The other-methods section directs visitors to confirm current instructions
  with their office. The shared Pricing shipping records replace duplicate
  legacy amounts on this page.
- A PayPal return is not proof of completed payment. The legacy IPN success
  handler and former application-storage include were empty/disabled, so this
  port does not claim automatic payment confirmation or fulfillment. The office
  must confirm receipt in PayPal. Do not publish this route as the public
  payment destination until the four payees, return/cancel states, and payment
  reconciliation have been reviewed and tested in a safe payment environment.
