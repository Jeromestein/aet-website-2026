import 'server-only';
import archive from '@/data/aice/events.json';
import { datedEvents } from './events';

// Only this archive enters the page. Leads, research notes and UI fixtures are excluded.
export const calendarEvents = datedEvents(archive.events);
export const archiveSavedOn = archive.saved_on;
