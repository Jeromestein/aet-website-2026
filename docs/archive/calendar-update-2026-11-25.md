# Calendar update — November 25, 2026

Updated the main checkout's JSON calendar with the December 16 AACRAO/AICE forum,
UKENIC26 dates, GDN 2027 dates and the historical November 25 GDN webinar.
The remaining two leads are unchanged and excluded. Source captures and original
verification/recovery dates are documented in `data/aice/README.md` and its index.

Added optional `free_registration` evidence to four records: TAICEP November 12,
CHEA November 19, GDN November 25 and AACRAO/AICE December 16. A compact Free badge
appears in month, week, schedule and details. Details include the fee source and
verification date. Missing fee metadata never implies free admission.

## Verification

- `pnpm typecheck` passed; all six existing calendar tests passed.
- Data checks passed: 27 unique records, 26 dated events, two unchanged pending
  leads, four free confirmations and all 51 source checksums. Other original
  records are unchanged apart from the approved UKENIC dates and free metadata.
- Codex in-app browser at `http://localhost:3021/admin/calendar`: desktop November
  and December month views, the December 13–19 week, event details and 390px mobile
  Schedule/details passed visual inspection. Free badges remain readable without
  covering event text. UKENIC spans November 30–December 1.
- The December 16 forum shows 11:00–12:00 Pacific and December 17, 03:00–04:00 in
  Beijing. Browser console contained no errors or warnings.
- Initial dev startup hit Watchpack file-watcher exhaustion. A temporary
  `WATCHPACK_POLLING=true pnpm dev` server on port 3021 enabled verification;
  no repository configuration was changed. The server was stopped afterward.

No production build, database change, commit, push or deployment was performed.
