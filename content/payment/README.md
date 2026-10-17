# Payment provenance and integration boundary

- Form field names, required fields, service values, and the four payment-office
  choices follow the legacy `e-pay-content.html`. Its service, bank and processing
  copy is retained; form guidance now includes the optional Stripe Checkout method.
  Chinese and Spanish translate the content for the shared route.
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

- October 8, 2026: prioritize Zelle immediately after Card Payment. The alternative
  methods heading lists Zelle first; its instructions, office selector and
  explicitly named Zelle Bank Information precede the retained Deposit / Check
  details. Apply the same method order in the processing table and all three
  locales. This presentation update does not change recipients or payment terms.

## Stripe Checkout (October 15, 2026)

The standalone Payment page supports hosted Checkout in test or live mode. It
collects the customer's quoted USD amount; this is not an application checkout or
an automatic service-order system. Offices must reconcile paid transactions in
the correct Stripe Dashboard and match them to their service requests.

### Mode and account configuration

- `STRIPE_PAYMENT_MODE=test` uses test keys and visibly labels the form, product
  and result as tests. `live` uses live keys and customer-facing payment copy.
  Any other value disables Stripe. An absent value defaults to test only in
  development; production requires an explicit value.
- California and Miami use `STRIPE_TEST_SECRET_KEY` or `STRIPE_LIVE_SECRET_KEY`.
  Boston and NYC use the corresponding `_BOS` key. Missing/invalid credentials
  never fall back to another office account or another mode. A selected office
  only offers Stripe when its matching credential is configured.
- Both standard secret keys (`sk_`) and restricted keys (`rk_`) are supported.
  Checkout Sessions write permission (including read) is sufficient. Boston's
  dedicated restricted keys use this permission. The original account's existing
  live credential was reused after matching its account ID to the existing test
  credential; no permissions or other applications' credentials were changed.
- Store credentials in ignored `.env.local` or the hosting provider's server-side
  environment. `.env.example` has blank placeholders, never real credentials.
  Hosted Checkout does not use publishable keys. Do not use `NEXT_PUBLIC_` for
  secret keys. Local environment values are not uploaded by a Git push.
- Live mode requires `PAYMENT_SITE_URL` to be the deployed public HTTPS origin,
  without a path, credentials, query or fragment. Local test mode returns to
  localhost automatically. `STRIPE_TEST_SITE_URL` overrides test return URLs only.
- Configuration is read at request time. Restart the owner's development process
  if environment changes are not picked up; configure and redeploy hosted
  environments separately. The current local configuration remains `test`.

### Checkout and verification

- Select an office, then PayPal or Stripe. PayPal remains the default. Changing
  the office or provider resets the agreement. Stripe's live form uses the
  service terms; its test form requires a test acknowledgment.
- The server validates the amount as integer USD cents ($0.50–$999,999.99), office,
  service, name, email and agreement. An old test form cannot submit a live
  payment after a configuration change: its mode must match the server's mode.
- API requests pin `Stripe-Version: 2026-09-30.endive` and use
  `allowed_payment_method_types[0]=card`. Cards must be enabled and eligible in
  each account. Stripe may offer card-backed wallets alongside the card form.
- A per-form token and payload hash provide Stripe request idempotency. Identical
  retries reuse the session; changed form details produce a different key. This
  is request-level protection, not persistent order-level deduplication.
- Customer name, office, service and optional service details are attached to
  Checkout Session and PaymentIntent metadata for manual reconciliation. Email
  goes to Checkout. Optional postal-address/phone fields are not stored by this
  website; Stripe collects its own billing information.
- A 303 redirect opens hosted Checkout. The server validates the returned host,
  session prefix and live/test flag. Results retrieve the session with the same
  office account, verify source/office/mode, and require both `complete` and
  `paid` before showing success. A URL parameter alone cannot confirm payment.
- A return-page visit is not required for the money to reach Stripe. Offices must
  check their Dashboard even if the customer closes the tab. Unverified/cancelled
  pages tell customers to check before paying again.
- There is no webhook receiver, application status update or custom receipt email
  in this website. The legacy test webhook secret is unused. Manage Stripe's
  payment notifications and receipt settings in each account. Before automated
  fulfillment, add server-owned order amounts/IDs, durable state, verified webhook
  processing and order-level idempotency.

### Launch configuration

In the production hosting environment, configure:

```dotenv
STRIPE_PAYMENT_MODE=live
STRIPE_LIVE_SECRET_KEY=<original account live credential>
STRIPE_LIVE_SECRET_KEY_BOS=<Boston account live credential>
PAYMENT_SITE_URL=https://www.americantranslationservice.com
```

The domain above must actually serve this deployed version and its result route.
Use test keys and `STRIPE_PAYMENT_MODE=test` in local/preview environments. Keep
existing PayPal environment variables for PayPal. Deployment remains with the
owner; the environment and deployment must be verified before directing clients
there. Account activation, payouts, receipt delivery and a genuine payment are
separate from code validation and creating an unpaid live Checkout Session.

### Verification

Run `node scripts/check-payment.cjs` for isolated checks without credentials or
network calls. It covers amount validation, account/mode isolation, old-form
rejection, return verification, idempotency, failures and legacy PayPal behavior.

For test payments, use synthetic contact details and Stripe's official
`4242 4242 4242 4242` card, a future expiry and any three-digit CVC. Verify the
Checkout shows test mode before paying. Never use test cards in live mode.

References: [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions/create),
[Stripe API keys](https://docs.stripe.com/keys),
[Manual and automated fulfillment](https://docs.stripe.com/checkout/fulfillment).
