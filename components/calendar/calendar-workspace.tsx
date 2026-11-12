'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar, { type CalendarRef, type DatesSetInfo } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import themePlugin from '@fullcalendar/react/themes/monarch';
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Globe2, Info, Search, SlidersHorizontal, X } from 'lucide-react';
import { calendarSpan, dateInZone, dateLabel, eventDateLabel, eventTime, isInPeriod, organizerColors, organizerGroup, organizerLabels, type CalendarEvent, type OrganizerGroup } from '@/lib/calendar/events';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/monarch/theme.css';
import '@fullcalendar/react/themes/monarch/palettes/blue.css';
import s from './calendar.module.css';

type View = 'dayGridMonth' | 'timeGridWeek' | 'listMonth';
type Category = 'all' | OrganizerGroup;
const zones = [
  { value: 'America/Los_Angeles', label: 'Pacific time' },
  { value: 'America/New_York', label: 'Eastern time' },
  { value: 'Asia/Shanghai', label: 'Beijing time' },
];
function EventDetails({ event, timeZone, savedOn, onClose }: { event: CalendarEvent | null; timeZone: string; savedOn: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!event || !element) return;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [event]);

  return <dialog ref={dialog} className={s.dialog} aria-labelledby="calendar-event-title" onClose={onClose}
    onClick={e => { if (e.target === e.currentTarget) { const bounds = e.currentTarget.getBoundingClientRect(); if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose(); } }}>
    {event && <>
      <div className={s.dialogTop}><span><CalendarDays size={17} /> Event details</span><button className={s.iconButton} onClick={onClose} aria-label="Close event details" autoFocus><X size={21} /></button></div>
      <div className={s.dialogBody}>
        <span className={`${s.badge} ${s[organizerGroup(event.organizer)]}`}><span className={s.dot} />{event.calendar?.presentation === 'series_start' ? 'Webinar series · first session shown' : event.calendar?.presentation === 'deadline' ? 'Submission deadline' : 'Event'}</span>
        <h2 id="calendar-event-title">{event.title}</h2>
        <p className={s.organizer}>{event.organizer}</p>
        <div className={s.eventFacts}>
          <div><CalendarDays size={19} /><div><strong>{eventDateLabel(event, timeZone)}</strong><span>{eventTime(event, timeZone)}</span>{event.calendar?.start && event.time && <small>Source time: {event.time}</small>}</div></div>
        </div>
        <dl className={s.detailList}><div><dt>Contact</dt><dd>{event.contact ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.contact) ? <a className={s.contactLink} href={`mailto:${event.contact}`}>{event.contact}</a> : event.contact) : 'Not published in the saved source'}</dd></div></dl>
        {event.notes && <section><p>{event.notes}</p></section>}
        <div className={s.sourceNote}><Info size={17} /><p>Saved {dateLabel(savedOn)} from public sources. Confirm current arrangements with the organizer.</p></div>
      </div>
      <div className={s.dialogFooter}><a className={s.primaryButton} href={event.event_url || event.source_url} target="_blank" rel="noopener noreferrer">{event.event_url ? 'View event page' : 'View source'}<ArrowUpRight size={18} /></a>{event.event_url && event.source_url !== event.event_url && <a className={s.secondaryButton} href={event.source_url} target="_blank" rel="noopener noreferrer">Original source <ExternalLink size={15} /></a>}</div>
    </>}
  </dialog>;
}

export default function CalendarWorkspace({ initialNow, events: sourceEvents, savedOn }: { initialNow: string; events: CalendarEvent[]; savedOn: string }) {
  const calendar = useRef<CalendarRef>(null);
  const [timeZone, setTimeZone] = useState('America/Los_Angeles');
  const [view, setView] = useState<View>('dayGridMonth');
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [period, setPeriod] = useState({ title: dateLabel(dateInZone(new Date(initialNow), timeZone), { day: undefined }), start: '', end: '' });
  const today = dateInZone(new Date(initialNow), timeZone);
  const closeDetails = useCallback(() => setSelected(null), []);

  const changeView = useCallback((next: View) => { calendar.current?.getApi().changeView(next); setView(next); }, []);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 760px)');
    const adapt = () => changeView(mobile.matches ? 'listMonth' : 'dayGridMonth');
    adapt();
    mobile.addEventListener('change', adapt);
    return () => mobile.removeEventListener('change', adapt);
  }, [changeView]);

  const filtered = useMemo(() => sourceEvents.filter(event =>
    (category === 'all' || organizerGroup(event.organizer) === category) &&
    `${event.title} ${event.organizer}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [sourceEvents, category, query]);
  const inPeriod = filtered.filter(event => isInPeriod(event, period.start, period.end, timeZone));
  const hasFilters = category !== 'all' || query !== '';
  const reset = () => { setCategory('all'); setQuery(''); };
  const calendarEvents = useMemo(() => filtered.map(event => ({
    id: event.id, title: event.title, ...calendarSpan(event),
    display: 'block', color: organizerColors[organizerGroup(event.organizer)],
    extendedProps: { reference: event },
  })), [filtered]);
  const onDatesSet = useCallback((info: DatesSetInfo) => {
    setPeriod({ title: info.view.title, start: dateInZone(info.view.currentStart, timeZone), end: dateInZone(info.view.currentEnd, timeZone) });
  }, [timeZone]);

  return <div className={s.workspace} lang="en">
    <a className={s.skipLink} href="#calendar-main">Skip to calendar</a>
    <header className={s.toolbar}>
      <div className={s.identity}><a href="/" className={s.iconButton} aria-label="Back to AET website"><ArrowLeft size={20} /></a><CalendarDays size={28} className={s.calendarIcon} /><h1>AICE Calendar</h1></div>
      <div className={s.periodControls}>
        <button className={s.todayButton} onClick={() => calendar.current?.getApi().today()}>Today</button>
        <div className={s.arrows}><button aria-label="Previous period" className={s.iconButton} onClick={() => calendar.current?.getApi().prev()}><ChevronLeft size={21} /></button><button aria-label="Next period" className={s.iconButton} onClick={() => calendar.current?.getApi().next()}><ChevronRight size={21} /></button></div>
        <h2 aria-live="polite">{period.title}</h2>
      </div>
      <div className={s.tools}>
        <label className={s.search} data-focus-ring><Search size={19} /><input aria-label="Search events" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}</label>
        <label className={s.selectWrap} data-focus-ring><select aria-label="Calendar view" value={view} onChange={e => changeView(e.target.value as View)}><option value="dayGridMonth">Month</option><option value="timeGridWeek">Week</option><option value="listMonth">Schedule</option></select></label>
      </div>
    </header>
    <main id="calendar-main" className={s.main}>
      <div className={s.utilityRow}>
        <details className={s.filterMenu}><summary><SlidersHorizontal size={16} /> Organizers{hasFilters && <span className={s.activeFilterDot} />}<ChevronDown size={14} /></summary><div className={s.filterPanel}>
          <fieldset><legend>Show events</legend>{(['all', 'aacrao', 'taicep', 'other'] as const).map(key => <label key={key} className={s.categoryOption}><input type="radio" name="calendar-collection" value={key} checked={category === key} onChange={() => setCategory(key)} />{key !== 'all' && <span className={`${s.dot} ${s[key]}`} />}<span>{key === 'all' ? 'All events' : organizerLabels[key]}</span></label>)}</fieldset>
          <p>Related industry events are included. See each event’s notes for its AICE connection.</p>{hasFilters && <button className={s.textButton} onClick={reset}>Clear filters</button>}
        </div></details>
        <div className={s.legend} aria-label="Calendar colors">{Object.entries(organizerLabels).map(([key, label]) => <span key={key}><span className={`${s.dot} ${s[key]}`} />{label}</span>)}</div>
        <label className={s.timeZone} data-focus-ring><Globe2 size={15} /><select aria-label="Display timezone" value={timeZone} onChange={e => setTimeZone(e.target.value)}>{zones.map(zone => <option key={zone.value} value={zone.value}>{zone.label}</option>)}</select></label>
      </div>
      <section className={`${s.calendarPanel} ${view === 'listMonth' ? s.scheduleView : view === 'timeGridWeek' ? s.weekView : s.monthView}`} aria-label="Event calendar">
        <div className={s.calendarScroll}>
              <FullCalendar ref={calendar} plugins={[themePlugin, dayGridPlugin, timeGridPlugin, listPlugin]}
                initialDate={today} initialView="dayGridMonth" timeZone={timeZone} locale="en" firstDay={0}
                headerToolbar={false} height={view === 'listMonth' ? 'auto' : '100%'} expandRows fixedWeekCount={false} dayMaxEvents={3}
                slotEventOverlap={false} moreLinkText={num => `${num} more`} moreLinkClass={s.moreLink} popoverClass={s.morePopover}
                events={calendarEvents} eventInteractive editable={false} selectable={false} displayEventEnd={false}
                nowIndicator allDayText="Date only" slotMinTime="00:00:00" slotMaxTime="24:00:00" slotDuration="00:30:00"
                scrollTime={timeZone === 'Asia/Shanghai' ? '21:00:00' : '06:00:00'}
                views={{ timeGridWeek: { titleFormat: { month: 'short', day: 'numeric', year: 'numeric' }, dayHeaderFormat: { weekday: 'short', day: 'numeric' } } }}
                eventTimeFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
                datesSet={onDatesSet} eventClick={info => setSelected(info.event.extendedProps.reference as CalendarEvent)}
                dayHeaderClass={s.dayHeader} dayHeaderFormat={{ weekday: 'short' }} dayCellTopClass={s.dayTop}
                dayCellTopContent={info => <span className={`${s.dayNumber} ${info.isToday ? s.todayNumber : ''}`}>{info.dayNumberText}</span>}
                dayCellClass={info => `${s.dayCell} ${info.isOther ? s.outsideMonth : ''}`}
                eventClass={info => `${s.calendarEvent} ${s[organizerGroup((info.event.extendedProps.reference as CalendarEvent).organizer)]} ${info.event.allDay ? s.dateEvent : s.timedEvent}`}
                eventInnerClass={s.calendarEventInner}
                listDayClass={s.listDay} listDayHeaderClass={s.listDayHeader} listItemEventBeforeClass={s.hideListDecoration}
                eventContent={info => {
                  const event = info.event.extendedProps.reference as CalendarEvent;
                  if (info.view.type === 'listMonth') return <div className={s.scheduleContent}><span className={s.eventDot} /><div><span className={s.eventTitle}>{event.title}</span><span className={s.eventMeta}>{eventTime(event, timeZone)} · {event.organizer}</span></div></div>;
                  const time = event.calendar?.start ? new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(event.calendar.start)).replace(':00', '').replace(' AM', 'am').replace(' PM', 'pm') : '';
                  return <div className={s.eventContent} title={`${event.title} · ${eventTime(event, timeZone)}`}>
                    {event.calendar?.start && <><span className={s.eventDot} /><span className={s.eventTime}>{time}</span></>}
                    <span className={s.eventTitle}>{event.title}</span>
                  </div>;
                }}
                noEventsContent={() => <div className={s.emptyCalendar}><CalendarDays size={34} strokeWidth={1.25} /><h3>No events in this period</h3><p>{hasFilters ? 'Try a different search or clear your filters.' : 'Try another month.'}</p>{hasFilters && <button className={s.secondaryButton} onClick={reset}>Clear filters</button>}</div>}
              />
            </div>
      </section>
      <footer className={s.calendarFooter}>
        <span aria-live="polite">{inPeriod.length} {inPeriod.length === 1 ? 'event' : 'events'}{hasFilters && <> · <button className={s.textButton} onClick={reset}>Clear filters</button></>}</span>
        <span className={s.referenceNote}>Saved {dateLabel(savedOn, { month: 'short' })} · Source times retained when timezone is unknown</span>
      </footer>
    </main>
    <EventDetails event={selected} timeZone={timeZone} savedOn={savedOn} onClose={closeDetails} />
  </div>;
}
