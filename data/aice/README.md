# Saved AICE event research

A local JSON archive recovered on November 12, 2026 from the existing
[research chat](codex://threads/01a11367-a7b9-7462-81ad-51943513b56c) and its temporary
crawl files. This recovery did not fetch current websites or establish current
registration availability. No database or scheduled ingestion is connected.

## Files

- `events.json`: 22 records supported by recovered page captures, including
  historical events, a proposal deadline and a webinar series. Twenty records
  have explicit dates; nine include published contact emails. These include
  related industry events and are not all hosted by AICE.
- `leads.json`: six follow-up announcements preserved in prior research messages,
  whose original announcement captures were not recovered. Keep these separate
  from confirmed calendar entries until checked. Reported dates remain qualified.
- `research-notes.json`: 19 recovered public-event research messages from October
  18 to November 12. They retain additional historical announcements, conflicting
  times and provenance. This is secondary evidence, not raw webpage content.
  Unrelated China conference research and personal attendance research are excluded.
- `sources/`: 44 original JSON page captures, one selected capture per source URL,
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

The two undated official announcements are UKENIC26 and TACRAO 2026. Their captured
pages establish the events but do not contain the dates reported in the older
chat. Those dates remain in notes rather than being silently promoted to primary
source facts. In particular, TACRAO's 2027 footer is not its 2026 conference date.

## Calendar integration

`/admin/calendar` reads `events.json` through `lib/calendar/load-events.ts`.
Only its 20 explicitly dated records are passed to the calendar. `leads.json`,
the two undated announcements, research messages and raw captures are not loaded
by the page. The former preview feed and artificial busy-day mode were removed.

Calendar timestamps are provided only when the saved source specifies a time and
timezone: the November 12 TAICEP showcase, December 10 UNESCO roundtable and
March 4 opening session of the TAICEP series. Other records keep their source date
and original time wording instead of inventing a timezone or a start time.
Multi-day conferences include their final date; the series appears only on its
announced opening date, with the complete series range in details. Individual
sessions are not generated. The December 15 proposal deadline is labeled as a
deadline, with no invented cutoff time.

Details retain the title, organizer, published contact, event/source links and
notes from this archive. Missing contacts remain explicitly unpublished. To update
the local calendar, edit this JSON; database and automatic ingestion remain deferred.
