# Documentation

Use the first three documents for day-to-day work. Open a module guide only when
working on that area. Historical evidence and content inventories are references,
not additional active task lists.

## Start here

| Document | Owns |
| --- | --- |
| [Project README](../README.md) | What the project is, quick start and key entry points |
| [Current status](status.md) | Current capability, verified boundary and next milestone |
| [Migration checklist](migration-checklist.md) | Active tasks, acceptance gates and explicitly deferred work |
| [Migration architecture](migration-architecture.md) | The two maintained English Mermaid diagrams |
| [Development and configuration](development.md) | Worktrees, environment names, deployment boundaries and shared website data |

## Applications and business operations

| Document | Scope |
| --- | --- |
| [Pre-evaluation](pre-evaluation-local.md) | Current setup and execution; dated acceptance is below the setup sections |
| [Credential intake acceptance](credential-intake-testing.md) | New `/application` persistence, Status and confirmation email |
| [Formal evaluation pilot](evaluation-application.md) | Earlier separate local workflow; not proof of v2 intake fulfillment |
| [Staff authentication and CRM](staff-auth.md) | Password login, office grants, live records and migration switches |
| [Dropbox](dropbox.md) | Folder rules, historical compatibility, uploads and access boundaries |
| [Email templates](email-templates.md) | Email visual design, recipient rules and metadata-only delivery history |
| [Payment configuration](../content/payment/README.md) | Standalone Payment, merchant routing and test/live boundaries |
| [Payment expiry](payment-expiry.md) | Separate formal 48-hour expiry worker and recorded activation |
| [Refund ordering](payment-refund-ordering.md) | Payment-event ordering and regression procedure |
| [Email recovery implementation](preeval-email-recovery.md) | Existing F5 code; further work and scheduling are deferred |
| [Pre-evaluation benchmark](preeval-benchmark.md) | Corpus procedure, accepted baseline and recorded limitations |

## Migration and compatibility references

| Document | Scope |
| --- | --- |
| [App URL compatibility](app-url-compatibility.md) | Customer/staff old-link mappings and dated verification |
| [Legacy form compatibility](legacy-form-compatibility.md) | Original field/table contracts and earlier local fixture |
| [SEO launch checklist](seo-checklist.md) | Detailed SEO checks linked from the main migration checklist |
| [Legacy SEO URL inventory](seo-legacy-urls.md) | Full retained/deferred URL disposition; not an active task per row |
| [Blog migration inventory](migration-blog-inventory.md) | Article-by-article migration and disposition |
| [Blog source screening](migration-blog-screening.md) | Source decisions, biography reassessment and publication caveats |

## Website design and content

| Document | Scope |
| --- | --- |
| [Core design guide](design/README.md) | Required starting point: brand, tokens, type, spacing and shared interaction |
| [Website patterns](design/website.md) | Homepage copy/layout, navigation, responsive components and Blog |
| [Business UI patterns](design/business-ui.md) | Application fields, Status, pre-evaluation and CRM |
| [Service page template](service-page-template.md) | Reusable layout and source authority for service pages |
| [Page-template analysis](page-template-analysis.md) | Background rationale and original page coverage |
| [Blog writing requirements](blog-requirements.md) | Structure for new or edited articles |
| [Asset sources](../ASSETS.md) | Asset provenance and licenses |
| [Generated brand assets](../public/brand/GENERATION.md) | Generation provenance for brand artwork |

Keep source-specific READMEs beside their content. Use the relevant one:

- Services: [Evaluation](../content/evaluation/README.md),
  [Certified Translation](../content/certified-translation/README.md),
  [Technical Translation](../content/technical-translation/README.md),
  [General Translation](../content/general-translation/README.md),
  [Interpretation](../content/interpretation/README.md),
  [Expert Opinion Letters](../content/expert-opinion-letters/README.md),
  [Notarization](../content/notarization/README.md), [Visa](../content/visa-service/README.md).
- Site content: [About](../content/about/README.md), [Contact](../content/contact/README.md),
  [Institutions](../content/institutions/README.md), [Career](../content/career/README.md),
  [Legal](../content/legal/README.md).
- Articles: [Blog sources](../content/blog/README.md) and
  [authored articles](../content/blog/authored/README.md).

## Historical evidence

These snapshots preserve decisions and verification without crowding current
status. Old instructions, counts, unchecked boxes and provider states are dated;
follow the current checklist and module guide before acting on them.

| Record | Contents |
| --- | --- |
| [Implementation log through October 22](archive/status-through-2026-10-22.md) | Original implementation history, verification scopes and integration evidence |
| [Migration checklist snapshot](archive/migration-checklist-2026-10-22.md) | Earlier checkpoints, complete page inventory and original decisions |
| [October 22 code review](archive/dev-code-review-2026-10-22.md) | Baseline findings, original diagrams and subsequent F1–F5 dispositions |

The maintained diagrams live only in [migration architecture](migration-architecture.md).
Diagrams inside the archived review are historical snapshots.

## How to maintain these documents

- **Current state:** edit `status.md` in place; keep it short and link evidence.
- **Next action or acceptance gate:** update `migration-checklist.md`. Detailed
  SEO checks remain in its linked specialist checklist instead of being copied.
- **Stable behavior or setup:** update the existing module guide or
  `development.md`; do not add a new guide for each small feature or fix.
- **Detailed dated verification:** add to an appropriately dated log under
  `archive/`, then link the relevant section from current status. Preserve the
  recorded environment, commit, test scope and limitations. Avoid one file per
  routine session and do not rewrite frozen snapshots as current instructions.
- **Content/asset provenance:** keep it beside the source; do not move it into a
  generic progress log. Agent rules remain in [AGENTS.md](../AGENTS.md), referenced
  by [CLAUDE.md](../CLAUDE.md).
- Update relative links and heading anchors when moving documents. Documentation
  cleanup alone does not establish fresh runtime or production verification.
