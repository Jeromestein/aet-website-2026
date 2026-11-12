export type SavedEvent = {
  id: string;
  title: string;
  organizer: string;
  contact: string | null;
  event_url: string | null;
  date: string | null;
  end_date: string | null;
  time: string | null;
  source_url: string;
  notes: string | null;
  calendar?: { start?: string; end?: string; presentation?: string };
};

export type CalendarEvent = SavedEvent & { date: string };
export type OrganizerGroup = 'aacrao' | 'taicep' | 'other';
export const organizerLabels = { aacrao: 'AACRAO', taicep: 'TAICEP', other: 'Other organizers' };
export const organizerColors = { aacrao: '#7953a1', taicep: '#398249', other: '#1967d2' };

export function organizerGroup(organizer: string): OrganizerGroup {
  if (organizer.includes('AACRAO')) return 'aacrao';
  if (organizer.includes('TAICEP')) return 'taicep';
  return 'other';
}

export function datedEvents(events: readonly SavedEvent[]): CalendarEvent[] {
  return events.filter((event): event is CalendarEvent => event.date !== null);
}

export function dateInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function eventDate(event: CalendarEvent, timeZone: string): string {
  return event.calendar?.start ? dateInZone(new Date(event.calendar.start), timeZone) : event.date;
}

function nextDate(date: string): string {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export function calendarSpan(event: CalendarEvent) {
  if (event.calendar?.start) {
    return { start: event.calendar.start, end: event.calendar.end, allDay: false };
  }
  // FullCalendar's end is exclusive; the archive's multi-day end is inclusive.
  const lastDay = event.calendar?.presentation === 'series_start' ? event.date : (event.end_date || event.date);
  return { start: event.date, end: nextDate(lastDay), allDay: true };
}

export function isInPeriod(event: CalendarEvent, start: string, end: string, timeZone: string): boolean {
  const firstDay = eventDate(event, timeZone);
  const lastDay = event.calendar?.start
    ? (event.calendar.end ? dateInZone(new Date(new Date(event.calendar.end).getTime() - 1), timeZone) : firstDay)
    : (event.calendar?.presentation === 'series_start' ? event.date : (event.end_date || event.date));
  return firstDay < end && lastDay >= start;
}

export function eventTime(event: CalendarEvent, timeZone: string): string {
  if (!event.calendar?.start) return event.time || 'Time not published';
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  const start = new Date(event.calendar.start);
  const time = event.calendar.end ? formatter.formatRange(start, new Date(event.calendar.end)) : formatter.format(start);
  return event.calendar.presentation === 'series_start' ? `First session: ${time}` : time;
}

export function dateLabel(date: string, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function eventDateLabel(event: CalendarEvent, timeZone: string): string {
  if (event.end_date) return `${dateLabel(event.date)} – ${dateLabel(event.end_date)}`;
  return dateLabel(eventDate(event, timeZone));
}
