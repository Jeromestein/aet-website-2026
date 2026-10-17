/* Run with: node scripts/check-eval.cjs. Uses synthetic data only. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(relative) {
  const file = path.resolve(__dirname, "..", relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (name) =>
    name === "server-only"
      ? {}
      : name.startsWith(".")
        ? load(
            path.relative(
              path.resolve(__dirname, ".."),
              path.resolve(path.dirname(file), name + ".ts"),
            ),
          )
        : require(name);
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, {
    filename: file,
  })(localRequire, module, module.exports);
  return module.exports;
}
const { calculateStats } = load("lib/eval/gpa.ts");
const { buildSampleData } = load("lib/eval/report-data.ts");
const { applyChanges, changeParts } = load("lib/eval/changes.ts");
const { SaveSchema } = load("lib/eval/validation.ts");
const { signatureUrl } = load("lib/eval/assets.ts");
const { guard } = load("lib/eval/server.ts");
const { convertToSampleData } = load("lib/eval/pdf-parser.ts");
const { createReportEdits } = load("lib/eval/report-editing.ts");
let checks = 0;
function test(name, run) {
  run();
  checks++;
  console.log(`PASS ${name}`);
}
const course = (usGrade, usCredits, id = 1) => ({
  id,
  year: "2026",
  name: "Synthetic course",
  level: "LD",
  credits: usCredits,
  grade: usGrade,
  usGrade,
  usCredits,
});
test("weighted GPA, pass credits, and the inherited A+ scale", () => {
  assert.deepEqual(
    calculateStats([course("A", "3"), course("B", "1"), course("Pass", "2")]),
    { gpa: "3.75", totalCredits: "6.00" },
  );
  assert.deepEqual(calculateStats([course("A+", "1")]), {
    gpa: "4.35",
    totalCredits: "1.00",
  });
});
test("parenthesized credits count toward GPA only; invalid values are ignored", () => {
  assert.deepEqual(
    calculateStats([
      course("A", "(3)"),
      course("B", "3"),
      course("A", "Infinity"),
      course("F", "-3"),
    ]),
    { gpa: "3.50", totalCredits: "3.00" },
  );
});
test("AI proposals cannot edit signatures, verification flags, unknown objects, or invalid indexes", () => {
  const data = buildSampleData();
  data.credentials[0].courses = [course("B", "3")];
  for (const field of [
    "__proto__.polluted",
    "evaluatorSignature",
    "credentials[9].program",
    "credentials[0].courses[0].conversionSource",
    "credentials[0].courses[9].name",
  ])
    assert.equal(changeParts(data, field), null);
  const before = JSON.stringify(data);
  const next = applyChanges(data, [
    { path: "credentials[0].courses[0].usGrade", value: "A", reason: "test" },
  ]);
  assert.equal(JSON.stringify(data), before);
  assert.equal(next.credentials[0].gpa, "4.00");
  assert.equal(next.credentials[0].courses[0].conversionSource, "AI_INFERRED");
});
test("AI note edits preserve manually reviewed totals", () => {
  const data = buildSampleData();
  data.credentials[0].gpa = "3.17";
  data.credentials[0].totalCredits = "109.50";
  const next = applyChanges(data, [
    { path: "evaluationNotes", value: "Synthetic note", reason: "test" },
  ]);
  assert.equal(next.evaluationNotes, "Synthetic note");
  assert.equal(next.credentials[0].gpa, "3.17");
  assert.equal(next.credentials[0].totalCredits, "109.50");
});
test("save validation rejects invalid identity and empty credential lists", () => {
  const input = {
    id: "56bb6c94-c28b-48af-beb6-0859c9e24519",
    name: "Synthetic test",
    content: buildSampleData(),
    expectedUpdatedAt: null,
  };
  assert.ok(SaveSchema.safeParse(input).success);
  assert.ok(!SaveSchema.safeParse({ ...input, id: "../secret" }).success);
  assert.ok(
    !SaveSchema.safeParse({
      ...input,
      content: { ...input.content, credentials: [] },
    }).success,
  );
});
test("signature URLs cannot load arbitrary files or external resources", () => {
  assert.equal(signatureUrl("https://example.com/signature.png"), "");
  assert.equal(signatureUrl("/../../.env.local"), "");
  assert.equal(
    signatureUrl("/luguan-yan-signature.png"),
    "/api/admin/eval/assets/luguan-yan-signature.png",
  );
});
test("legacy courses without original grade fields remain editable without inventing values", () => {
  const content = buildSampleData();
  content.credentials[0].courses = [
    {
      id: 1,
      year: "2026",
      name: "Synthetic legacy course",
      usGrade: "A",
      usCredits: "3",
    },
  ];
  const saved = SaveSchema.parse({
    id: "56bb6c94-c28b-48af-beb6-0859c9e24519",
    name: "Legacy fixture",
    content,
    expectedUpdatedAt: null,
  });
  assert.equal(saved.content.credentials[0].courses[0].grade, "");
  assert.equal(saved.content.credentials[0].courses[0].usGrade, "A");
});
test("PDF conversion preserves original grades and cannot claim human verification", () => {
  const data = convertToSampleData({
    credentials: [
      {
        courses: [
          {
            name: "Synthetic course",
            credits: "4",
            grade: "85",
            usCredits: "2.74",
            usGrade: "A",
            conversionSource: "USER_VERIFIED",
          },
        ],
      },
    ],
  });
  const row = data.credentials[0].courses[0];
  assert.equal(row.credits, "4");
  assert.equal(row.grade, "85");
  assert.equal(row.usCredits, "2.50");
  assert.equal(row.conversionSource, "AI_INFERRED");
});
test("local access guard rejects production, disabled mode, public hosts, and cross-origin writes", () => {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    EVAL_LOCAL_ENABLED: process.env.EVAL_LOCAL_ENABLED,
  };
  const req = (origin = "http://127.0.0.1:3023", host = "127.0.0.1:3023") =>
    new Request("http://localhost:3023/api/admin/eval/reports", {
      method: "POST",
      headers: { host, origin },
    });
  try {
    process.env.NODE_ENV = "development";
    process.env.EVAL_LOCAL_ENABLED = "true";
    guard(req());
    assert.throws(
      () => guard(req("https://evil.example")),
      (e) => e.status === 403,
    );
    assert.throws(
      () => guard(req("http://public.example", "public.example")),
      (e) => e.status === 404,
    );
    process.env.NODE_ENV = "production";
    assert.throws(
      () => guard(req()),
      (e) => e.status === 404,
    );
    process.env.NODE_ENV = "development";
    process.env.EVAL_LOCAL_ENABLED = "false";
    assert.throws(
      () => guard(req()),
      (e) => e.status === 404,
    );
  } finally {
    for (const [key, value] of Object.entries(prev))
      value === undefined
        ? delete process.env[key]
        : (process.env[key] = value);
  }
});

test("inline edits preserve reviewed totals until grades or credits change", () => {
  const data = buildSampleData();
  data.credentials[0] = {
    ...data.credentials[0],
    gpa: "reviewed",
    totalCredits: "reviewed",
    courses: [course("A", "3"), course("B", "3", 2)],
  };
  let draft = data;
  createReportEdits(data, (value) => (draft = value)).updateCourse(
    0,
    1,
    "name",
    "A multi\nline title",
  );
  assert.equal(draft.credentials[0].gpa, "reviewed");
  assert.equal(data.credentials[0].courses[0].name, "Synthetic course");
  createReportEdits(draft, (value) => (draft = value)).updateCourse(
    0,
    2,
    "usGrade",
    "A",
  );
  assert.equal(draft.credentials[0].gpa, "4.00");
  assert.equal(
    draft.credentials[0].courses[1].conversionSource,
    "USER_VERIFIED",
  );
});
test("batched evaluator edits retain both name and signature", () => {
  let draft = buildSampleData();
  const edits = createReportEdits(draft, (value) => (draft = value));
  edits.updateDataField("evaluatorName", "Synthetic Evaluator");
  edits.updateDataField("evaluatorSignature", "/tong-liu-signature.png");
  assert.equal(draft.evaluatorName, "Synthetic Evaluator");
  assert.equal(draft.evaluatorSignature, "/tong-liu-signature.png");
});

console.log(`${checks} checks passed.`);
