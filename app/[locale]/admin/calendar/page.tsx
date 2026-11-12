import type { Metadata } from 'next';
import CalendarWorkspace from '@/components/calendar/calendar-workspace';
import { archiveSavedOn, calendarEvents } from '@/lib/calendar/load-events';

export const metadata: Metadata = {
  title: 'Events Calendar — AET Workspace',
  description: 'AICE and international credential evaluation events from saved public sources.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function CalendarPage() {
  // This owner-requested link-only calendar contains public reference data only.
  return <CalendarWorkspace initialNow={new Date().toISOString()} events={calendarEvents} savedOn={archiveSavedOn} />;
}
