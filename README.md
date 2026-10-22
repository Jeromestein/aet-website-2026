# AET Website 2026

The public website and new application workspace for American Education and
Translation Services. Built with Next.js App Router, TypeScript and shared
English, Chinese and Spanish customer pages; staff pages are English-only.
The new system does not use Payload CMS.

**The AET App replacement is still in progress.** The dedicated pre-evaluation
flow has recorded local end-to-end acceptance, including Stripe Sandbox payment.
The unified formal-evaluation application saves submissions and supports Status
and documents; its staff-processing, payment and report-release journey is not
complete. CRM Live uses existing business records. See the dated status below
before treating any capability as deployed or ready for production.

## Start here

| Need | Read |
| --- | --- |
| Understand the current stage | [Current status](docs/status.md) |
| Decide what to do next | [Active migration checklist](docs/migration-checklist.md) |
| Find a module or historical record | [Documentation index](docs/README.md) |
| Understand the old and new systems | [Migration architecture — two English diagrams](docs/migration-architecture.md) |
| Configure or maintain the project | [Development and configuration](docs/development.md) |

## Local development

Requires Node.js 20.9 or newer and pnpm 9.7.1.

```sh
pnpm install --frozen-lockfile
```

Open the intended checkout in VS Code and run its server from your terminal:

| Checkout | Branch | Command | Preview |
| --- | --- | --- | --- |
| `/Users/plusone/Desktop/Code/aet-website-2026` | `main` | `pnpm dev` | `http://localhost:3021` |
| `/Users/plusone/Desktop/Code/aet-website-2026-dev` | `dev` | `pnpm exec next dev --port 3022` | `http://localhost:3022` |

`pnpm dev` explicitly selects port 3021 in either checkout. Reuse the owner's
existing server. Each worktree has its own ignored `.env.local`, based on
[.env.example](.env.example); worktrees do not isolate external services.
See [worktree setup](docs/development.md#main-and-dev-worktrees) and
[environment configuration](docs/development.md#environment-configuration)
before enabling application, payment, email or AI integrations.

## Main entry points

| Entry | Purpose |
| --- | --- |
| `/` and localized service pages | Public website, prices and service information |
| `/application` | Unified application; formal-evaluation submission is connected |
| `/status?applicationId=ID` | Formal application lookup and documents |
| `/degree-equivalency-tool` and `/status-check` | Dedicated pre-evaluation application and lookup |
| `/admin/login` and `/admin/CRM` | Staff authentication and office-scoped CRM |
| `/payment` | Standalone website payment; not a new-intake payment integration |

Customer routes use English at `/`, Chinese at `/zh` and Spanish at `/es`.
Staff routes have no language prefix. The existing app-domain address must remain
compatible during the separately authorized migration; see
[domain planning](docs/development.md#application-domains-and-staff-urls) and
[legacy URL compatibility](docs/app-url-compatibility.md).

## Working rules

- Follow [AGENTS.md](AGENTS.md), including checkout isolation and the no-build rule.
- Read [the design guide](docs/design/README.md) before UI or copy changes; use the
  [service template](docs/service-page-template.md) for new service pages.
- Keep shared fees in `lib/pricing.ts` and office details in `lib/contact.ts`.
  See [maintenance instructions](docs/development.md#shared-pricing).
- Keep content provenance beside its source in `content/*/README.md`, and asset
  attribution in [ASSETS.md](ASSETS.md).
- Update the affected status/checklist item after verification. Keep detailed
  dated evidence in `docs/archive/`; do not append full session logs to this README.
- Never commit secrets. Push, deployment, domain changes and production cutover
  require the owner's explicit instruction.

## Checks

```sh
pnpm check:i18n
pnpm typecheck
```

Run the relevant module checks described in its guide. Frontend changes also need
desktop/mobile browser verification. Do not run `pnpm build` or another local
production-build alias. See [validation and deployment](docs/development.md#validation-and-deployment)
for additional checks and environment boundaries.
