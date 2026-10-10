// Exercise the real React click handler with local analytics and navigation fakes.
// No browser, network calls or production analytics events are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../components/blog/article-action.tsx');
const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  fileName: filename,
});
const tracking = {
  event: 'blog_contact_click', article_slug: 'cslb-foreign-credential-evaluation',
  article_locale: 'en', method: 'contact_page', placement: 'intro',
};

function click({ data = {}, attributes = {}, input = {}, behavior = 'queued' } = {}) {
  const calls = [], navigations = [], timers = new Map();
  let nextTimer = 0;
  const browser = {
    dataLayer: [],
    location: { assign: (url) => navigations.push(url) },
    setTimeout: (callback, delay) => { assert.equal(delay, 2000); timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: (id) => timers.delete(id),
  };
  if (behavior !== 'missing') browser.gtag = (...args) => {
    calls.push(args);
    if (behavior === 'throws') throw new Error('Analytics blocked');
    if (behavior === 'immediate') args[2].event_callback?.();
  };
  const module = { exports: {} };
  vm.compileFunction(outputText, ['require', 'module', 'exports', 'window'], { filename })(require, module, module.exports, browser);
  const props = { href: 'https://example.test/contact#la', ...attributes, tracking: { ...tracking, ...data } };
  const url = new URL(props.href);
  const event = {
    button: 0, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
    currentTarget: { href: url.href, protocol: url.protocol, target: props.target || '', hasAttribute: (name) => props[name] !== undefined },
    ...input,
  };
  module.exports.ArticleAction(props).props.onClick(event);
  return { calls, navigations, timers, event, browser };
}

for (const locale of ['en', 'zh', 'es']) {
  for (const placement of ['intro', 'closing']) {
    const result = click({ data: { article_locale: locale, placement } });
    assert.equal(result.calls.length, 1);
    const [command, name, parameters] = result.calls[0];
    assert.equal(command, 'event');
    assert.equal(name, 'contact_us');
    assert.equal(parameters.article_locale, locale);
    assert.equal(parameters.placement, placement);
    assert.equal(parameters.method, 'contact_page');
    assert.equal(parameters.article_slug, tracking.article_slug);
    assert.equal(parameters.event_timeout, 2000);
    assert.equal(result.browser.dataLayer.length, 1);
    assert.equal(result.event.defaultPrevented, true);
    assert.equal(result.navigations.length, 0);
    const fallback = [...result.timers.values()][0];
    parameters.event_callback();
    parameters.event_callback();
    fallback();
    assert.deepEqual(result.navigations, ['https://example.test/contact#la']);
    assert.equal(result.timers.size, 0);
  }
}

const blocked = click();
[...blocked.timers.values()][0]();
blocked.calls[0][2].event_callback();
assert.equal(blocked.navigations.length, 1, 'Blocked loader must release navigation once');
assert.equal(click({ behavior: 'immediate' }).navigations.length, 1);

for (const behavior of ['missing', 'throws']) {
  const result = click({ behavior });
  assert.equal(result.event.defaultPrevented, false);
  assert.equal(result.timers.size, 0);
  result.calls[0]?.[2].event_callback();
  assert.equal(result.navigations.length, 0, 'Failed analytics must leave native navigation in control');
}

for (const options of [
  { data: { method: 'phone' }, attributes: { href: 'tel:9499547996' } },
  { attributes: { target: '_blank' } },
  { attributes: { download: '' } },
  ...['metaKey', 'ctrlKey', 'shiftKey', 'altKey'].map(key => ({ input: { [key]: true } })),
  { input: { button: 1 } },
]) {
  const result = click(options);
  assert.equal(result.calls.length, 1);
  assert.equal(result.event.defaultPrevented, false);
  assert.equal(result.calls[0][2].event_callback, undefined);
  assert.equal(result.timers.size, 0);
}

for (const data of [{ method: 'application' }, { event: 'blog_ai_click', method: 'chatgpt' }]) {
  const result = click({ data });
  assert.equal(result.calls.length, 0);
  assert.equal(result.browser.dataLayer.length, 1);
  assert.equal(result.event.defaultPrevented, false);
}
const cancelled = click({ attributes: { onClick: event => event.preventDefault() } });
assert.equal(cancelled.calls.length, 0);
assert.equal(cancelled.browser.dataLayer.length, 0);
console.log('PASS: localized contact events, callback/timeout fallback, native link behavior, event scope');
