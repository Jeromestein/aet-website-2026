# AICE calendar frontend — November 12, 2026

## Scope

Implemented locally in `aet-website-2026-dev`, branch `dev`, at `/admin/calendar`.
The owner requested a frontend preview, followed by a Google Calendar-inspired
redesign using their screenshot. Database design and automated updates are deferred.
No commit, push or deployment was performed.

The page uses FullCalendar React 7.1.5, the Temporal polyfill, and scoped CSS.
It provides Month, Week and Schedule views, previous/next/Today navigation,
organizer filtering, title/organizer search, Pacific/Eastern/Beijing
timezones, event details and official source links. Phones default to Schedule.
The owner chose link-only access: no login gate or global navigation entry. Metadata
requests no indexing; the page contains public saved references, not private data.

## Saved JSON integration

The page now reads `data/aice/events.json` through the server-only loader in
`lib/calendar/load-events.ts`. Of 22 archived records, 20 have explicit source
dates and enter the calendar. The six unverified announcements in `leads.json`
and two undated records are excluded. The former preview data module and
`?demo=busy-day` behavior were removed; that query now shows the ordinary feed.

Details show the archived title, organizer, published contact, original event and
source links, source time, saved date and notes. Organizer colors replace the old
inferred-relationship categories. Missing contacts and times remain unknown.
The November 12 TAICEP showcase, December 10 UNESCO roundtable and March 4 opening
session have source-supported timestamps. All other entries retain source dates
and time text without timezone inference. Conference end dates are inclusive;
the spring series appears on its first announced session only, with the complete
series range in details. The proposal deadline is explicitly labeled.

Verification after integration:

- `pnpm typecheck`, `pnpm check:i18n` and `git diff --check` passed. The first type
  check encountered a stale generated reference to another chat's removed local
  focus-check route; starting the dev server refreshed generated route types and
  the check then passed without editing that unrelated route or its source.
- Data-boundary assertions passed: 22 archived / 20 dated records, nine November
  events including the October 31–November 1 workshop, five December events,
  inclusive conference endings, correct Pacific/Beijing conversions, unchanged
  dates for unknown timezones, and one March opening session with no invented
  April recurrence.
- Codex in-app browser passed: November and December month grids, two entries on
  December 15, Week's date-only/timed separation, contact and source links,
  missing-contact wording, original unzoned time retention, Pacific 7 AM to
  Beijing 11 PM, Escape closing, organizer filtering, phone Schedule and series
  details with its full date range. Temporary viewport overrides were reset.
- Supplemental Playwright CLI passed: no page errors on fresh load, nine/five
  November/December records, correct mailto target, removed demo behavior and
  no horizontal document overflow at 390px or 320px. Current screenshots are
  `output/playwright/calendar-json-month.png`, `calendar-json-detail.png`,
  `calendar-json-december.png` and `calendar-json-mobile.png`.
- No production build, database, new ingestion, commit, push or deployment.
  The owned temporary verification server and supplemental browser were stopped.

## Initial prototype data (superseded)

The former `lib/calendar/preview-events.ts` held nine dated references and one undated AICE
watch item from the November 10 research. Saved references are not live availability.
Unverified times remain date-only; the next AICE forum is not presented as announced.
The public reference feed is separate from `?demo=busy-day`, which creates eight
explicitly illustrative events on the current Pacific date, including three
simultaneous sessions. No database, provider credentials, OpenAI request or cron
job is connected. The endpoint's query parameter changes only frontend fixtures.

## Initial prototype verification

- TypeScript and locale validation passed; `git diff --check` passed. No production
  build was run, following repository instructions.
- Codex in-app browser: desktop month and expanded eight-event popover; three
  simultaneous Week entries and opening their details; phone Schedule with all eight
  complete titles/times; relationship filtering (eight to three), search empty state
  and clearing; Pacific 7:00 AM to Beijing 11:00 PM with matching details; Escape
  closing the dialog. Original reference data and month navigation were also checked.
- FullCalendar places its more-events popover outside the workspace. Styling now
  explicitly covers that portal so the event colors and text stay consistent.
- Density verification caught and fixed list-view color specificity (a date-only
  title became white on white), missing visible list times, duplicate dots and excess
  phone date-column space. Schedule now renders full titles and explicit time text.
- The three simultaneous Week events occupy separate narrow columns. Long titles
  can be clipped in these blocks; their tooltip, detail dialog and Schedule retain
  the complete title. Month entries deliberately truncate to one line.
- Fresh-reload Playwright checks found all eight phone events, no horizontal
  document overflow at 390px or 320px, and no page errors after the final reload.
- Supplemental Playwright CLI screenshots are stored in ignored
  `output/playwright/calendar-google-month.png`, `calendar-busy-day.png` and
  `calendar-busy-mobile.png`. These capture the normal month, expanded dense day,
  and phone schedule respectively.

The temporary verification server used
`WATCHPACK_POLLING=true pnpm exec next dev --webpack --port 3022` at
`http://localhost:3022/admin/calendar`. Polling avoided this environment's watcher
limit. Development CSS hot replacement produced two Next.js stylesheet-removal
errors during editing; verification used a fresh reload after the final edits.
The owned server and supplemental browser session are stopped after verification.
