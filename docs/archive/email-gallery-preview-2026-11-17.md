# Staff email gallery — main Preview acceptance

Date: November 17, 2026 (America/Los_Angeles).

## Scope

- Added `/admin/email-preview`, reachable through CRM Tools → Email Templates.
- Eight categories reuse the actual application email renderers; additional-information
  requests have pre-evaluation/formal variants and fee updates have confirmed/pending states.
- Fixtures are fictional, with application destinations on `preview.example.invalid`.
  No customer record reads, notification queues, mail sends or payment actions are part
  of gallery rendering. Staff authentication still checks active membership.
- The page is dynamic, staff-protected and excluded from indexing. The iframe is
  sandboxed without scripts and email links are disabled. Desktop/mobile widths are available.
- The former local API gallery redirects to this protected page during development;
  hosted builds keep that API unavailable.

## Validation

- TypeScript: `pnpm exec tsc --noEmit --incremental false` passed.
- Vitest: 38 tests passed across `email-preview`, `email-assets`, `formal-email`
  and `staff-page-recovery` suites. Included absent/nonstaff membership rejection,
  recoverable membership outage, eight fixture renderers and both conditional variants.
- Local in-app browser: authenticated gallery, formal report desktop/mobile, both
  information-request variants and pending quote passed. At 390px viewport, document
  width was 390px; frame links had `aria-disabled=true` and `tabIndex=-1`.
- Hosted in-app browser: existing staff password login succeeded; CRM Tools link opened
  the gallery. All eight categories rendered; formal information and pending quote
  variants passed. Desktop and 390px mobile layouts were visually checked.
- Anonymous hosted GET redirected to `/admin/login` with private/no-store caching.
  The old `/api/email-template-preview` returned 404.
- Final deployment additionally fixes spacing in the mobile preview-only notice;
  its desktop and mobile gallery were rechecked after the alias update.
- No local production build was run. Vercel performed the cloud Preview build.

## Deployment boundary

Stable URL: https://aet-main-preview-meiyutechs-projects.vercel.app/admin/email-preview

Final Preview: `dpl_FSDPM8spAEp6ZfR7KQ5dA99oYdbw` (Ready),
https://aet-website-2026-i52x2jx7y-meiyutechs-projects.vercel.app

The source upload used a disposable directory populated only with Git-tracked and
nonignored source files, excluding `.local`, `output`, `.env.local` and retired-worktree
backups. No environment variables, service configuration or staff permissions changed.

Production remained `dpl_8x3XBe6fNvZBCbU1QLLw71r9GkJn`, checked before and after
Preview deployment. No main push or Production promotion was performed.
The owner subsequently requested a separate commit and push; the Preview acceptance
above does not authorize a Production cutover.
