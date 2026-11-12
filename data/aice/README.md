# Saved calendar events

Selected from dev `9eccb44` for the Design and Calendar release on November 12,
2026. `events.json` is unchanged: 22 archived public records, of which 20 have
explicit dates and appear on `/admin/calendar`. These saved references do not
establish current registration availability.

The 23 captures referenced by `source_files` are retained under `sources/`.
Unverified leads, unrelated research notes and unused captures remain on dev.
The page reads only dated events through `lib/calendar/load-events.ts`; raw
captures are provenance, not a live feed. No database or scheduled ingestion runs.

Keep unknown contacts/times as null. Preserve source time wording when no timezone
is published. Conference end dates are inclusive; a series appears only on its
announced opening date, with the full range retained in details. Never generate
unconfirmed dates, timezones or recurring sessions.
