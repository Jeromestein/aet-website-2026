// Standalone server-side checks need the server-only marker, but not the global
// react-server condition: React Email renders HTML through react-dom/server.
import { createRequire, register, Module } from "node:module";
const require = createRequire(import.meta.url);
const marker = require.resolve("server-only");
const empty = new Module(marker);
empty.filename = marker;
empty.loaded = true;
empty.exports = {};
require.cache[marker] = empty;
register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    return nextResolve(specifier, context);
  }
`), import.meta.url);
