// Evaluate the checked-in renderer for HTTP parity checks without a Next build.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();

function load(filename) {
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const requirePackage = createRequire(filename);
  const requireSource = specifier => {
    // Contact formatting does not use Next's browser navigation dependency.
    // Fail if that changes, rather than emulate routing in this offline check.
    if (specifier === '@/i18n/navigation') return {
      getPathname() { throw new Error('Unexpected navigation dependency in article HTML formatting'); },
    };
    if (!specifier.startsWith('@/') && !specifier.startsWith('.')) return requirePackage(specifier);
    const target = specifier.startsWith('@/')
      ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
    return load(fs.existsSync(target) ? target : target + '.ts');
  };
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  vm.compileFunction(outputText, ['require', 'module', 'exports'], { filename })(requireSource, module, module.exports);
  return module.exports;
}

const { renderContactReferences } = load(path.join(root, 'lib/contact-html.ts'));
const posts = path.join(root, 'content/blog/posts');
const rendered = Object.fromEntries(fs.readdirSync(posts).filter(name => name.endsWith('.json')).map(name => {
  const post = JSON.parse(fs.readFileSync(path.join(posts, name), 'utf8'));
  return [name.slice(0, -5), renderContactReferences(post.html, 'en', 'en')];
}));
process.stdout.write(JSON.stringify(rendered));
