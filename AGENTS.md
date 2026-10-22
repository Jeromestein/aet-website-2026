<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AET Project Guidance

- Before visual, copy, or interaction changes, read [docs/design/README.md](docs/design/README.md).
  Then read only the relevant website/business UI pattern linked there. These
  define design targets; they do not imply that every target is implemented.
- Read [docs/status.md](docs/status.md) for current progress and
  [docs/migration-checklist.md](docs/migration-checklist.md) for active or deferred work.
  Update affected items in place after verification; link detailed dated evidence
  under `docs/archive/` instead of appending full session logs to current status.
- Before writing or editing Blog articles, read [docs/blog-requirements.md](docs/blog-requirements.md)
  for article structure, question headings, and AI links.
- Start at [README.md](README.md) and [docs/README.md](docs/README.md). Use
  [docs/development.md](docs/development.md) for detailed setup and delivery,
  and [ASSETS.md](ASSETS.md) for asset sources and licenses.
- Keep stable design decisions in the design guide, current capability in status,
  tasks in the checklist and detailed evidence in dated archives. Do not duplicate
  progress logs or external reference histories across these documents.
- Use pnpm. Do not run `pnpm build` or its production-build aliases locally.
- Prefer the owner's existing development server for the checkout being edited:
  main uses port 3021; the sibling dev worktree uses port 3022. See README.md for
  the worktree paths and dev command. Start or restart a server only when explicitly
  requested or when verification is blocked without one.
- After frontend changes, verify affected desktop/mobile states in the Codex in-app
  browser; use Playwright as a fallback. Report verification scope and any blocker.
- Deployment remains with the owner. Do not deploy or push without an explicit request.

## Parallel Development and New Conversations

- At the start of each new conversation for this project, and before creating
  another project conversation, ask the owner whether to use an independent Git
  worktree and feature branch. Recommend this for parallel work. Wait for the
  answer before creating the worktree or editing project files; read-only
  inspection may continue. If the owner has already explicitly made this choice
  for that conversation, honor it without asking again.
- When the owner chooses isolation, create or reuse a worktree dedicated to that
  task, with its own `x/<feature-name>` branch based on `dev`. Keep source files,
  `.next` output and any development-server port separate from other active
  worktrees. Follow the existing owner-managed dev-server guidance.
- When the owner chooses the shared checkout, keep edits scoped to the assigned
  feature and preserve other conversations' changes. A separate conversation
  alone does not isolate files, Git staging or generated caches.
- Once the feature is complete and its applicable checks pass, merge the feature
  branch back into `dev`. Integrate one feature at a time, resolve conflicts and
  rerun the relevant checks on the combined result. Do not overwrite or include
  unrelated uncommitted work in the merge. Report the integration result.
- `dev` is the integration target. Do not merge into `main`, push or deploy unless
  the owner explicitly requests that action.
