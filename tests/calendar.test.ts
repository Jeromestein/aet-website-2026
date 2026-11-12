import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import archive from '../data/aice/events.json';
import { calendarSpan, datedEvents, eventDate, eventTime, isInPeriod } from '../lib/calendar/events';

const events = datedEvents(archive.events);
const event = (id: string) => events.find(item => item.id === id)!;

describe('saved public calendar', () => {
  it('keeps undated announcements out and retains source evidence', () => {
    expect(events).toHaveLength(20);
    expect(new Set(events.map(item => item.id)).size).toBe(20);
    for (const item of archive.events) {
      for (const source of item.source_files) {
        expect(existsSync(fileURLToPath(new URL('../data/aice/' + source, import.meta.url)))).toBe(true);
      }
    }
  });
  it('includes the final day of a conference across a month boundary', () => {
    const workshop = event('aacrao-workshop-20261031');
    expect(calendarSpan(workshop)).toEqual({ start: '2026-10-31', end: '2026-11-02', allDay: true });
    expect(isInPeriod(workshop, '2026-11-01', '2026-12-01', 'America/Los_Angeles')).toBe(true);
    expect(isInPeriod(workshop, '2026-11-02', '2026-11-03', 'America/Los_Angeles')).toBe(false);
  });
  it('preserves unknown timezones without inventing a timed event', () => {
    const conference = event('aacrao-sem-20261101');
    expect(calendarSpan(conference).allDay).toBe(true);
    expect(eventDate(conference, 'Asia/Shanghai')).toBe('2026-11-01');
    expect(eventTime(conference, 'Asia/Shanghai')).toBe(conference.time || 'Time not published');
  });
  it('converts published offsets and handles midnight date changes', () => {
    const showcase = event('taicep-showcase-20261112');
    expect(eventTime(showcase, 'America/Los_Angeles')).toContain('7:00');
    expect(eventTime(showcase, 'Asia/Shanghai')).toContain('11:00');
    const nearMidnight = { ...showcase, calendar: { start: '2026-11-12T23:00:00-08:00' } };
    expect(eventDate(nearMidnight, 'Asia/Shanghai')).toBe('2026-11-13');
  });
  it('shows the first series session without inventing April recurrence', () => {
    const series = event('taicep-spring-20270304');
    expect(isInPeriod(series, '2027-03-01', '2027-04-01', 'America/Los_Angeles')).toBe(true);
    expect(isInPeriod(series, '2027-04-01', '2027-05-01', 'America/Los_Angeles')).toBe(false);
    expect(series.end_date).toBe('2027-05-13');
  });
});
