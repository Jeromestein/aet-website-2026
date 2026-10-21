# Historical pre-evaluation benchmark

The owner supplied four completed FCE cases as a private development regression
set. **Only the US degree equivalency is the expected pre-evaluation result**:
degree level, field, and concentration when specified. GPA, credits and individual
course evaluation are not labels and do not affect scoring.

## Local corpus

The dataset lives in `.local/preeval-benchmark/fce-v1/`, which is Git-ignored.
Do not commit applicant documents, names, application IDs, reports or model outputs.
The private README lists the cases and their reference answers.

- `manifest.json`: hashes, file sizes, page counts, reference locations, and mappings
  from prepared PDF pages to original pages.
- `model-inputs.json`: explicit input allowlist and empty academic form fields.
  Original submitted form values were not supplied; never reconstruct them from
  the reference reports.
- `cases/FCE-00*/originals/`: byte-exact copies of applicant uploads.
- `cases/FCE-00*/inputs/`: five prepared PDFs containing all 23 source pages.
  The 11-page case is split into 10 + 1 pages to respect the current per-file limit.
- `cases/FCE-00*/references/`: unchanged owner-provided evaluation reports.
  Reports can contain GPA and courses; those are retained only within the original
  reference documents, not extracted into expected labels.
- `cases/FCE-00*/expected.json`: expected equivalency and a verbatim report excerpt
  with a one-based DOCX paragraph location.
- `source-inventory.json`: original local paths and hashes, for private traceability.

Never recursively upload this directory. The benchmark runner reads only
`model-inputs.json` and its registered input files when constructing requests.
Load expected answers separately, after inference, for comparison. The runner never opens expected labels or reference reports. Input PDFs may
contain transcript grades; keep those original documents intact.

## Offline validation

From the dev worktree, run with Python and `pypdf` installed:

```sh
python3 scripts/preeval/validate-benchmark.py
```

The validator checks hashes, reference excerpts, input/reference separation,
source-page coverage, document limits, and the request allowlist. It makes no API,
Dropbox, database, email or payment calls and does not start a server.

For later inference, use the existing direct-file `analyzeDocuments` path, preserving
all prepared PDFs for each case in the same request. Compare the model's result
and reasoning with the reference degree. Allow equivalent wording; a short result
may express a concentration in the reasoning. Record each scored dimension as
match, mismatch or uncertain, with human review. Record execution/schema errors
separately; do not report exact-string matches as semantic accuracy.

## Timed live run

Use the configured model and unchanged production prompt through
`lib/preeval/openai.ts::analyzeDocuments`. The runner defaults to offline preflight;
`--live` explicitly permits paid API calls with these private applicant materials.

```sh
node --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/run-benchmark.mts
node --env-file=.env.local --import ./scripts/register-server-only.mjs --import tsx scripts/preeval/run-benchmark.mts --live
```

Outputs are saved under the corpus's ignored `runs/<UTC timestamp>/` directory.
The runner validates every input before making a request, makes one sequential
attempt per case, and retains failures without hidden retries. It records the
configured/returned model, prompt version and hash, input hashes, raw provider
responses, parsed results, response/request IDs and token usage. API keys are not
written to logs or run artifacts. Expected-answer comparison is a separate review.

`preparationMs` measures local file reading, hashing and PDF validation.
`analysisMs` measures the production analysis call including request encoding,
network transfer, provider latency, response reading and schema validation.
`inferenceWallMs` includes all sequential calls and per-case result writes;
`batchWallMs` additionally includes preparation and run setup. These are local
wall-clock measurements, not provider-only compute time or a browser-to-result SLA.
Dropbox transfer, upload, job queues, payment, database and email are outside this
benchmark. No dev server restart or deployed environment is required.

## Degree and evidence refinement (v3)

`preeval-direct-pages-v3` separates the source qualification from structured US
level, degree name, field and concentration. The server assembles the complete
customer title within the existing 200-character limit. It keeps integrated
degree names and explicit inability to determine; no ten-word truncation or
case-specific answer mapping is used.

Each original PDF is copied into single-page PDF inputs in memory using `pdf-lib`.
Page geometry, rotation and content are preserved, including certification covers.
Original Dropbox files are not modified. Each input has a server-issued page ID
and an adjacent document/page label; images remain one page. The provider returns
only page IDs and supporting excerpts. The server resolves these IDs to original
document/page positions, rejecting unknown IDs instead of trusting numeric page
locations supplied by the model. Raw provider output and the generated page map
are retained in private benchmark runs; normalized evidence remains compatible
with the existing CRM fields.

This guarantees reference identity and range, not semantic truth of a quote.
Excerpts and claim support still require source review. One-page inputs eliminate
multi-page counting ambiguity but do not constitute independent verification or
OCR. The same five-document, ten-page-per-original, twenty-total-page and 30 MB
limits apply, with an additional 30 MB bound on prepared inputs.

Before the second live run, 113 focused tests, all 464 unit tests and TypeScript passed; all 23
prepared single pages rendered pixel-identically to their original source pages
at the verification resolution. The four labels and input hashes are unchanged.
The updated prompt and page transport are the experimental changes; model,
reasoning effort, sequential execution and timing boundaries remain the same.

## Scope and current evidence

All four reference conclusions are bachelor-level. This small development set
cannot establish performance on other degree levels or serve as an independent
holdout after prompt tuning. Source-material legibility and conflicting evidence
still matter; do not force agreement by copying report conclusions into inputs.

The corpus was constructed and validated before any inference. The owner then
authorized a baseline on October 21, 2026: four sequential completed calls with
`gpt-6.1-sol`, unchanged prompt `preeval-direct-files-v2`, and no retries. Total
batch time was 72.64 seconds; mean analysis time was 18.11 seconds. Usage was
85,051 tokens. Assistant review found degree-level agreement in 4/4, full reference
equivalency in 3/4 and one partial US field/concentration mapping. One case had
three incorrect evidence page locations despite the correct degree conclusion.

The private run report is at
`.local/preeval-benchmark/fce-v1/runs/2026-10-21T17-20-49-805Z/report.md`.
The report includes exact outputs, timings, token counts, comparison rationale,
visual citation findings and proposals. Production prompt changes have not been
applied. Repeatability, broader degree coverage and staff review remain open.
