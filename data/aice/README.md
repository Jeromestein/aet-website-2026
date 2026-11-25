# Saved AICE event research

A local JSON archive recovered on November 12, 2026 from the existing
[research chat](codex://threads/01a11367-a7b9-7462-81ad-51943513b56c) and its temporary
crawl files. The initial recovery did not establish current registration availability.
The November 25 update adds the December AICE forum, confirms UKENIC26 and GDN 2027 dates, and recovers verified evidence for the November 25 GDN webinar. No database or scheduled ingestion is connected.

## Files

- `events.json`: 27 records supported by recovered page captures, including
  historical events, a proposal deadline and a webinar series. Twenty-six records
  have explicit dates; nine include published contact emails. These include
  related industry events and are not all hosted by AICE.
- `leads.json`: two follow-up announcements preserved in prior research messages,
  whose original announcement captures were not recovered. Keep these separate
  from confirmed calendar entries until checked. Reported dates remain qualified.
- `research-notes.json`: 19 recovered public-event research messages from October
  18 to November 12. They retain additional historical announcements, conflicting
  times and provenance. This is secondary evidence, not raw webpage content.
  Unrelated China conference research and personal attendance research are excluded.
- `sources/`: 44 original JSON page captures, two November 16 evidence files and five November 25 evidence files,
  with original `url`, `text` and `links` data preserved byte for byte. The index
  records capture dates from the original folder names and SHA-256 checksums.
  These include overview, event, membership and contact pages; some are access/login
  pages and must not be interpreted as a successful retrieval of event details.

## Simple record structure

| Field | Meaning |
| --- | --- |
| `title` | Event title, or an explicitly qualified research label for a lead |
| `organizer` | Organization(s) or person; does not imply a separate entity database |
| `contact` | Published email or other contact text; `null` if absent or unsuitable |
| `event_url` | Known event, registration or event-announcement page; not necessarily a meeting/join link |
| `date`, `end_date` | ISO start date and optional inclusive end date; `null` when unconfirmed |
| `time` | Source time wording, including timezone or uncertainty; no assumed offsets |
| `free_registration` | Optional confirmation of free registration with `verified_on`, `source_url` and `source_files`; absence means no confirmed free label, not a paid event |
| `calendar` | Optional display metadata: source-supported `start`/`end` timestamps with offsets and a `presentation` of `series_start` or `deadline` where needed |
| `source_url`, `source_files` | Original source URL and local evidence paths, relative to this directory |
| `notes` | Missing details, conflicts, contact scope and AICE relationship qualifications |
| `id` | Stable local identifier for matching future updates |

Unknown values stay `null`, not a guessed email, midnight, current date or an
invented registration URL. AACRAO's `membership@aacrao.org` is described as login
support in the captured pages; it is not reused as a generic event contact.
General organizer contacts such as GDN's office are identified as such in notes.
An end date denotes the inclusive event/series range, not a continuous meeting.
A series is one record; individual recurring sessions are not generated.

TACRAO 2026 remains the only undated official announcement. Its 2027 footer is not
its 2026 conference date. UKENIC26 now has official November 30–December 1 dates.

## Calendar integration

`/admin/calendar` reads `events.json` through `lib/calendar/load-events.ts`.
Only its 26 explicitly dated records are passed to the calendar. `leads.json`,
the undated announcement, research messages and raw captures are not loaded
by the page. The former preview feed and artificial busy-day mode were removed.

Calendar timestamps are provided only when the saved source specifies a time and
timezone: the November 12 TAICEP showcase, December 10 UNESCO roundtable and
March 4 opening session of the TAICEP series, plus the November 19 CHEA, November 25 GDN and December 16 AACRAO/AICE webinars.
The November 17 Montreal invitation specifies local time; its offset is resolved
from the venue and date using America/Toronto. Other records keep their source date
and original time wording instead of inventing a timezone or a start time.
Multi-day conferences include their final date; the series appears only on its
announced opening date, with the complete series range in details. Individual
sessions are not generated. The December 15 proposal deadline is labeled as a
deadline, with no invented cutoff time.

Confirmed free registration appears as a compact **Free** badge in month, week,
schedule and details views. Details link to the fee source and show the original
verification date. Four records qualify: TAICEP November 12, CHEA November 19,
GDN November 25 and AACRAO/AICE December 16. No other event is assumed free.

Details retain the title, organizer, published contact, event/source links and
notes from this archive. Missing contacts remain explicitly unpublished. To update
the local calendar, edit this JSON; database and automatic ingestion remain deferred.

## November 16 update

Promoted `chea-aim-20261119-lead` and `montreal-recognition-20261117-lead` to
`events.json`; each new record retains its old ID in `promoted_from` and has
`verified_on: 2026-11-16`. The four remaining leads and all 22 original archive
records are unchanged. The calendar now displays 22 dated records, including
11 in November; two undated records remain excluded.

- CHEA: official title/date and registration destination checked against its
  event page; public Zoom invitation/configuration confirms 14:00 Eastern
  (11:00 Pacific), free registration and joining information by email. Saved
  evidence contains only public invitation, timezone, fee and login settings.
  No event end time, deadline, eligibility or contact email is invented.
- Montreal: CICIC's public repost reproduces the author's invitation for
  November 17, 18:00–20:00 local (15:00–17:00 Pacific), at Le Port de tête.
  The English title is descriptive. Neither record asserts AICE hosting or attendance.

`saved_on` is the archive modification date, not a claim that every record was
reverified. Original source captures remain untouched; the source index includes
checksums for both added evidence files. The page heading and browser title now
use Calendar. Time formatting normalizes ICU whitespace so server and browser
renders agree for the new time range.

Validation: source hashes, preservation of original records and pending leads,
November counts, Pacific times and Beijing date rollovers passed. TypeScript
passed. Local in-app desktop/month/details and 390px phone Schedule checks passed;
a fresh reload has no hydration warnings. Supplemental browser verification
confirmed pending leads are absent from the page and saved screenshots under
`output/playwright/calendar-updated-20261116.png` and
`output/playwright/calendar-mobile-20261116.png`. Changes are local only; no push
or hosted deployment was performed. The temporary verification server was stopped.

## November 25 update

- Add the December 16 AACRAO/AICE forum, 14:00–15:00 Eastern / 11:00–12:00 Pacific,
  with an official event-page capture and sanitized public Zoom invitation/fee data.
- Fill UKENIC26's dates from the official announcement; retain its original capture.
- Promote GDN 2027 to October 26–28 in Whistler. Registration and fees remain unknown.
- Promote the November 25 GDN webinar as a historical event using the November 18
  public Zoom output recovered from the research chat. Its source index preserves
  the original capture date and separately records the November 25 recovery date.
  The current Zoom page no longer displays event details.
- Preserve the November AICE Forum and December 9 GDN/EQAR leads unchanged.
- Add free-registration metadata only where the saved sources explicitly confirm it.

There are 27 records, 26 dated calendar entries, two pending leads and 51 indexed
evidence files. See [verification](../../docs/archive/calendar-update-2026-11-25.md).
