<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AET Project Guidance

- Before visual, copy, or interaction changes, read [docs/design.md](docs/design.md).
  It defines the design targets; it does not imply that every target is implemented.
- Read [docs/status.md](docs/status.md) to identify outstanding work. Update only
  affected items after implementation or verification, recording what was actually checked.
- Before writing or editing Blog articles, read [docs/blog-requirements.md](docs/blog-requirements.md)
  for article structure, question headings, and AI links.
- Use [README.md](README.md) for setup, routing scope, and delivery instructions;
  use [ASSETS.md](ASSETS.md) for asset sources and licenses.
- Keep stable design decisions in the design guide and completion evidence in the
  status file. Do not duplicate progress logs or external reference histories in the guide.
- Use pnpm. Do not run `pnpm build` or its production-build aliases locally.
- Prefer the owner's existing development server on port 3021. Start or restart it
  only when explicitly requested or when verification is blocked without one.
- After frontend changes, verify affected desktop/mobile states in the Codex in-app
  browser; use Playwright as a fallback. Report verification scope and any blocker.
- Deployment remains with the owner. Do not deploy or push without an explicit request.
