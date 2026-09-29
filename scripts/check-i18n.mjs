import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createTranslator } from "next-intl";

const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const english = await read("../messages/en.json");
function flatten(messages, prefix = "") {
  return Object.fromEntries(Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [[path, value]] : Object.entries(flatten(value, path));
  }));
}
const base = flatten(english);
const argumentsFor = (message) => [...message.matchAll(/\{([\w]+)\}/g)].map((match) => match[1]).sort();
for (const locale of ["en", "zh", "es"]) {
  const messages = await read(`../messages/${locale}.json`);
  const flat = flatten(messages);
  assert.deepEqual(Object.keys(flat).sort(), Object.keys(base).sort(), `${locale}: translation keys differ`);
  const t = createTranslator({ locale, messages, onError(error) { throw error; } });
  for (const [key, value] of Object.entries(flat)) {
    assert.ok(value.trim(), `${locale}.${key}: empty translation`);
    assert.deepEqual(argumentsFor(value), argumentsFor(base[key]), `${locale}.${key}: interpolation arguments differ`);
    const values = Object.fromEntries(argumentsFor(value).map((name) => [name, "test"]));
    assert.ok(t(key, values).length, `${locale}.${key}: invalid message`);
  }
  console.log(`${locale}: ${Object.keys(flat).length} complete, valid messages`);
}
const reviews = await read("../components/testimonials.json");
reviews.forEach((review, index) => {
  assert.equal(english.home.testimonials.reviews[index], review.paragraphs.join("\n\n"), `Review ${index}: original English changed`);
});
console.log("Original English reviews preserved.");
