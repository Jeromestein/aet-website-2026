// Exercise payment boundaries with synthetic data and mocked Stripe responses.
// This script reads no local secrets and makes no network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const env = {
  NODE_ENV: 'development', STRIPE_PAYMENT_MODE: 'test', STRIPE_LIVE_SECRET_KEY: 'sk_live_fixture', STRIPE_TEST_SECRET_KEY: 'sk_test_fixture',
  STRIPE_TEST_SECRET_KEY_BOS: 'rk_test_bosfixture',
  STRIPE_LIVE_SECRET_KEY_BOS: 'rk_live_bosfixture',
  PAYMENT_SITE_URL: 'https://aet.example',
  ...Object.fromEntries(['MIAMI', 'BOSTON', 'CALIFORNIA', 'NYC'].map(office => [`PAYPAL_BUSINESS_${office}`, `${office.toLowerCase()}@example.test`])),
};
const calls = [];
const session = {
  id: 'cs_test_fixture', url: 'https://checkout.stripe.com/c/pay/cs_test_fixture',
  livemode: false, mode: 'payment', status: 'complete', payment_status: 'paid',
  metadata: { source: 'aet-website-2026-payment-test', office: 'california' },
};
let response = session;
let fail = false;
const fakeFetch = async (url, options) => {
  calls.push({ url, options });
  if (fail) throw new Error('Synthetic network failure');
  return Response.json(response);
};
function load(relative, dependencies = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
  });
  const module = { exports: {} };
  vm.compileFunction(outputText, ['require', 'module', 'exports', 'process', 'fetch'], { filename })(
    name => name === 'server-only' ? {} : (dependencies[name] ?? require(name)),
    module, module.exports, { env }, fakeFetch,
  );
  return module.exports;
}
const stripe = load('lib/stripe.ts');
const { POST } = load('app/api/payment/prepare/route.ts', {
  '@/lib/payment': { paymentOffices: ['miami', 'boston', 'california', 'nyc'] },
  '@/lib/stripe': stripe,
});
function post(overrides = {}) {
  return POST(new Request('http://localhost:3021/api/payment/prepare', {
    method: 'POST', body: new URLSearchParams({
      provider: 'stripe', amount: '0.50', email: 'test@example.test', custname: 'Test Customer',
      office: 'california', service: '翻译公证', terms: '1', locale: 'zh',
      payment_mode: 'test', checkout_token: '8329bd0f-bcf5-4e56-94ec-b2ff420ca0e8', ...overrides,
    }),
  }));
}

async function main() {
  for (const [amount, expected] of [['0.50', 50], ['1.01', 101], ['19.99', 1999], ['999999.99', 99999999]]) {
    assert.equal(stripe.stripeAmount(amount), expected);
  }
  for (const amount of ['0', '0.49', '-1', '1.001', 'NaN', '1e3', '1000000', '1,000', '']) {
    assert.equal(stripe.stripeAmount(amount), null);
  }
  for (const overrides of [{ provider: 'unknown' }, { office: 'unknown' }, { service: 'unknown' }, { terms: '' }, { email: 'invalid' }, { custname: '' }]) {
    assert.equal((await post(overrides)).status, 400);
  }
  assert.equal((await POST(new Request('http://localhost:3021/api/payment/prepare', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  }))).status, 415);
  assert.equal((await POST(new Request('http://localhost:3021/api/payment/prepare', {
    method: 'POST', headers: { 'Content-Type': 'multipart/form-data' }, body: 'malformed',
  }))).status, 400);
  assert.match((await post({ amount: '0.49' })).headers.get('location'), /invalid-amount$/);
  assert.match((await post({ amount: '1000000' })).headers.get('location'), /invalid-amount$/);
  assert.equal(calls.length, 0);

  for (const key of ['', 'sk_live_fixture']) {
    env.STRIPE_TEST_SECRET_KEY = key;
    assert.equal(stripe.stripeAvailable('california'), false);
    assert.match((await post()).headers.get('location'), /unavailable$/);
    assert.equal(calls.length, 0, 'Missing/live credentials must never reach Stripe');
  }
  env.STRIPE_TEST_SECRET_KEY = 'sk_test_fixture';
  for (const locale of ['en', 'zh', 'es']) {
    const result = await post({ locale, amount: '19.99', success_url: 'https://attacker.example', currency: 'eur' });
    assert.equal(result.status, 303, 'Stripe redirect must switch the POST to GET');
    assert.equal(result.headers.get('location'), session.url);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    const { url, options } = calls.at(-1);
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.body.get('line_items[0][price_data][unit_amount]'), '1999');
    assert.equal(options.body.get('line_items[0][price_data][currency]'), 'usd');
    assert.equal(options.body.get('metadata[office]'), 'california');
    assert.equal(options.body.get('allowed_payment_method_types[0]'), 'card');
    assert.equal(options.body.has('payment_method_types[0]'), false, 'Do not send the removed static-method parameter');
    assert.equal(options.headers['Stripe-Version'], '2026-09-30.endive');
    const prefix = locale === 'en' ? '' : `/${locale}`;
    assert.equal(options.body.get('success_url'), `http://localhost:3021${prefix}/payment/result?provider=stripe&office=california&session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(options.body.get('cancel_url'), `http://localhost:3021${prefix}/payment/result?provider=stripe&office=california&state=cancelled`);
    assert.equal(options.body.get('locale'), locale);
  }
  for (const office of ['miami', 'california', 'boston', 'nyc']) {
    const isBoston = office === 'boston' || office === 'nyc';
    assert.equal(stripe.stripeAvailable(office), true);
    await post({ office, mode: 'live', account: 'original', api_key: 'sk_live_injected' });
    const { options } = calls.at(-1);
    assert.equal(options.headers.Authorization, `Bearer ${isBoston ? env.STRIPE_TEST_SECRET_KEY_BOS : env.STRIPE_TEST_SECRET_KEY}`);
    assert.equal(options.body.get('metadata[office]'), office);
    assert.equal(new URL(options.body.get('success_url')).searchParams.get('office'), office);
    response = { ...session, metadata: { ...session.metadata, office } };
    assert.equal(await stripe.stripeResult(session.id, office), 'paid');
    assert.equal(calls.at(-1).options.headers.Authorization, options.headers.Authorization, 'Return verification must use the same account');
    assert.equal(calls.at(-1).options.headers['Stripe-Version'], options.headers['Stripe-Version']);
  }
  for (const key of ['', 'sk_live_fixture', 'rk_live_fixture', 'pk_test_fixture']) {
    env.STRIPE_TEST_SECRET_KEY_BOS = key;
    const before = calls.length;
    for (const office of ['boston', 'nyc']) {
      assert.equal(stripe.stripeAvailable(office), false);
      assert.match((await post({ office })).headers.get('location'), /unavailable$/);
      assert.equal(await stripe.stripeResult(session.id, office), 'unverified');
    }
    assert.equal(calls.length, before, 'Boston and NYC must never fall back to original/live keys');
    assert.equal(stripe.stripeAvailable('california'), true);
  }
  env.STRIPE_TEST_SECRET_KEY_BOS = 'rk_test_bosfixture';
  env.STRIPE_TEST_SECRET_KEY = '';
  assert.equal(stripe.stripeAvailable(), true, 'A Boston-only configuration enables test Checkout');
  assert.equal(stripe.stripeAvailable('miami'), false);
  const beforeUnavailable = calls.length;
  assert.match((await post({ office: 'miami' })).headers.get('location'), /unavailable$/);
  assert.equal(calls.length, beforeUnavailable, 'Original offices must not fall back to Boston');
  env.STRIPE_TEST_SECRET_KEY = 'sk_test_fixture';
  const beforeInvalidOffice = calls.length;
  for (const office of [undefined, '', 'unknown', '__proto__']) {
    assert.equal(await stripe.stripeResult(session.id, office), 'unverified');
  }
  assert.equal(calls.length, beforeInvalidOffice, 'Missing/unknown offices must not reach Stripe');
  response = { ...session, metadata: { ...session.metadata, office: 'boston' } };
  assert.equal(await stripe.stripeResult(session.id, 'nyc'), 'unverified', 'Even shared-account offices must match session metadata');
  assert.equal(await stripe.stripeResult(session.id, 'california'), 'unverified');
  response = session;
  env.NODE_ENV = 'production';
  await post();
  assert.match(calls.at(-1).options.body.get('success_url'), /^https:\/\/aet\.example\/zh\//);
  env.STRIPE_TEST_SITE_URL = 'https://preview.example';
  await post();
  assert.match(calls.at(-1).options.body.get('success_url'), /^https:\/\/preview\.example\/zh\//);
  for (const url of ['http://unsafe.example', 'https://user:password@aet.example', 'https://aet.example?next=bad']) {
    env.STRIPE_TEST_SITE_URL = url;
    const before = calls.length;
    assert.match((await post()).headers.get('location'), /unavailable$/);
    assert.equal(calls.length, before);
  }
  delete env.STRIPE_TEST_SITE_URL;

  for (const change of [{ livemode: true }, { id: 'cs_live_fixture' }, { url: 'https://attacker.example/pay' }, { url: null }]) {
    response = { ...session, ...change };
    assert.match((await post()).headers.get('location'), /unavailable$/);
  }
  response = session;
  assert.equal(await stripe.stripeResult(session.id, 'california'), 'paid');
  for (const change of [{ status: 'open' }, { payment_status: 'unpaid' }]) {
    response = { ...session, ...change };
    assert.equal(await stripe.stripeResult(session.id, 'california'), 'unpaid');
  }
  for (const change of [{ livemode: true }, { mode: 'setup' }, { metadata: {} }, { id: 'cs_test_other' }]) {
    response = { ...session, ...change };
    assert.equal(await stripe.stripeResult(session.id, 'california'), 'unverified');
  }
  const before = calls.length;
  for (const id of [undefined, 'cs_live_fixture', 'paid', 'cs_test_../account']) {
    assert.equal(await stripe.stripeResult(id, 'california'), 'unverified');
  }
  assert.equal(calls.length, before);
  response = session;
  await post();
  const firstKey = calls.at(-1).options.headers['Idempotency-Key'];
  await post();
  assert.equal(calls.at(-1).options.headers['Idempotency-Key'], firstKey);
  await post({ amount: '0.51' });
  assert.notEqual(calls.at(-1).options.headers['Idempotency-Key'], firstKey);
  assert.equal(calls.at(-1).options.body.get('metadata[customer_name]'), 'Test Customer');
  for (const overrides of [{ payment_mode: 'live' }, { payment_mode: '' }, { checkout_token: '' }, { service2: 'a'.repeat(501) }]) {
    const before = calls.length;
    assert.match((await post(overrides)).headers.get('location'), /unavailable$/);
    assert.equal(calls.length, before);
  }

  env.STRIPE_PAYMENT_MODE = 'live';
  const liveSession = { ...session, id: 'cs_live_fixture', url: 'https://checkout.stripe.com/c/pay/cs_live_fixture', livemode: true,
    metadata: { source: 'aet-website-2026-payment', office: 'california' } };
  response = liveSession;
  const beforeStale = calls.length;
  assert.match((await post()).headers.get('location'), /unavailable$/, 'A stale test form must not create a live checkout');
  assert.equal(await stripe.stripeResult(session.id, 'california'), 'unverified');
  assert.equal(calls.length, beforeStale);
  for (const office of ['miami', 'california', 'boston', 'nyc']) {
    assert.equal(stripe.stripeAvailable(office), true);
    const result = await post({ payment_mode: 'live', office, service2: 'Quote fixture' });
    assert.equal(result.headers.get('location'), liveSession.url);
    const { options } = calls.at(-1);
    assert.equal(options.headers.Authorization, `Bearer ${['boston', 'nyc'].includes(office) ? env.STRIPE_LIVE_SECRET_KEY_BOS : env.STRIPE_LIVE_SECRET_KEY}`);
    assert.equal(options.body.get('line_items[0][price_data][product_data][name]'), 'AET services');
    assert.equal(options.body.get('metadata[service_details]'), 'Quote fixture');
    assert.equal(options.body.get('payment_intent_data[metadata][customer_name]'), 'Test Customer');
    assert.match(options.body.get('success_url'), /^https:\/\/aet\.example\//);
    response = { ...liveSession, metadata: { ...liveSession.metadata, office } };
    assert.equal(await stripe.stripeResult(liveSession.id, office), 'paid');
  }
  for (const field of ['STRIPE_LIVE_SECRET_KEY', 'STRIPE_LIVE_SECRET_KEY_BOS']) {
    const original = env[field];
    for (const value of ['', 'sk_test_fixture', 'pk_live_fixture']) {
      env[field] = value;
      const before = calls.length;
      const office = field.endsWith('_BOS') ? 'boston' : 'california';
      assert.equal(stripe.stripeAvailable(office), false);
      assert.match((await post({ payment_mode: 'live', office })).headers.get('location'), /unavailable$/);
      assert.equal(calls.length, before, 'Live mode must not fall back to another account or test key');
    }
    env[field] = original;
  }
  response = session;
  assert.match((await post({ payment_mode: 'live' })).headers.get('location'), /unavailable$/, 'Reject test sessions in live mode');
  assert.equal(await stripe.stripeResult(liveSession.id, 'california'), 'unverified');
  response = { ...liveSession, payment_status: 'unpaid' };
  assert.equal(await stripe.stripeResult(liveSession.id, 'california'), 'unpaid');
  response = { ...liveSession, metadata: { ...liveSession.metadata, office: 'boston' } };
  assert.equal(await stripe.stripeResult(liveSession.id, 'nyc'), 'unverified');
  for (const url of ['http://localhost:3021', 'https://localhost:3021', 'http://unsafe.example', 'https://aet.example/path']) {
    env.PAYMENT_SITE_URL = url;
    const before = calls.length;
    assert.match((await post({ payment_mode: 'live' })).headers.get('location'), /unavailable$/);
    assert.equal(calls.length, before);
  }
  env.PAYMENT_SITE_URL = 'https://aet.example';
  for (const mode of ['', 'disabled', 'invalid']) {
    env.STRIPE_PAYMENT_MODE = mode;
    assert.equal(stripe.stripePaymentMode(), 'disabled', 'Production has no implicit test/live mode');
    const before = calls.length;
    assert.match((await post({ payment_mode: mode })).headers.get('location'), /unavailable$/);
    assert.equal(calls.length, before);
  }
  env.STRIPE_PAYMENT_MODE = 'test';
  fail = true;
  assert.equal(await stripe.stripeResult(session.id, 'california'), 'unverified');
  assert.match((await post()).headers.get('location'), /unavailable$/);

  const beforePayPal = calls.length;
  for (const office of ['miami', 'boston', 'california', 'nyc']) {
    const result = await post({ provider: 'paypal', office });
    assert.equal(result.status, 200);
    const html = await result.text();
    assert.ok(html.includes(`name="business" value="${office}@example.test"`));
    assert.ok(html.includes('name="item_name" value=""'));
    assert.ok(html.includes('https://www.paypal.com/cgi-bin/webscr'));
    assert.ok(html.includes('https://aet.example/zh/payment/result?state=returned'));
  }
  assert.equal((await post({ provider: '' })).status, 200, 'Legacy form submissions still use PayPal');
  assert.equal(calls.length, beforePayPal, 'PayPal must not call Stripe');
  console.log('PASS: amount validation, test/live mode guards, redirects, office account isolation, stale-form rejection, idempotency, verified results, failures and PayPal compatibility');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
