import { google, calendar_v3 } from 'googleapis';
import { getEnv } from '../config/env';
import { TIMEZONE, DEFAULT_EVENT_DURATION_MINUTES } from '../config/constants';
import { TZDate } from '@date-fns/tz';
import { addMinutes, startOfDay, endOfDay, addDays, format } from 'date-fns';

function getAuth() {
  const env = getEnv();
  const oauth2 = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: env.GOOGLE_PERSONAL_REFRESH_TOKEN });
  return oauth2;
}

function getCalendar() {
  return google.calendar({ version: 'v3', auth: getAuth() });
}

export interface CalendarEvent {
  id?: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  location?: string;
  description?: string;
}

export async function createEvent(params: {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location?: string;
  duration_minutes?: number;
  recurrence?: string[]; // RRULE strings, e.g. ['RRULE:FREQ=WEEKLY;UNTIL=20260831T235959Z']
}): Promise<CalendarEvent> {
  const cal = getCalendar();
  const duration = params.duration_minutes || DEFAULT_EVENT_DURATION_MINUTES;

  // Parse as local time in Zurich — use component constructor to avoid UTC interpretation
  const [year, month, day] = params.date.split('-').map(Number);
  const [hour, minute] = params.time.split(':').map(Number);
  const startDate = new TZDate(year, month - 1, day, hour, minute, 0, TIMEZONE);
  const endDate = addMinutes(startDate, duration);

  const event: calendar_v3.Schema$Event = {
    summary: params.title,
    location: params.location,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: TIMEZONE,
    },
    recurrence: params.recurrence,
  };

  const res = await cal.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return {
    id: res.data.id || undefined,
    title: res.data.summary || params.title,
    start: res.data.start?.dateTime || startDate.toISOString(),
    end: res.data.end?.dateTime || endDate.toISOString(),
    location: res.data.location || undefined,
  };
}

export async function queryEvents(params: {
  date?: string; // YYYY-MM-DD
  range?: 'today' | 'tomorrow' | 'week';
}): Promise<CalendarEvent[]> {
  const cal = getCalendar();
  const now = new TZDate(new Date(), TIMEZONE);

  let timeMin: Date;
  let timeMax: Date;

  if (params.range === 'tomorrow') {
    const tomorrow = addDays(now, 1);
    timeMin = startOfDay(tomorrow);
    timeMax = endOfDay(tomorrow);
  } else if (params.range === 'week') {
    timeMin = startOfDay(now);
    timeMax = endOfDay(addDays(now, 7));
  } else if (params.date) {
    const target = new TZDate(new Date(params.date), TIMEZONE);
    timeMin = startOfDay(target);
    timeMax = endOfDay(target);
  } else {
    // Default: today
    timeMin = startOfDay(now);
    timeMax = endOfDay(now);
  }

  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    timeZone: TIMEZONE,
  });

  return (res.data.items || []).map((e) => ({
    id: e.id || undefined,
    title: e.summary || 'Untitled',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    location: e.location || undefined,
    description: e.description || undefined,
  }));
}

export async function updateEvent(params: {
  eventId: string;
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  duration_minutes?: number;
}): Promise<CalendarEvent> {
  const cal = getCalendar();

  const existing = await cal.events.get({
    calendarId: 'primary',
    eventId: params.eventId,
  });

  const update: calendar_v3.Schema$Event = {
    summary: params.title || existing.data.summary,
    location: params.location || existing.data.location,
    start: existing.data.start,
    end: existing.data.end,
  };

  if (params.date || params.time) {
    const existingStart = new Date(
      existing.data.start?.dateTime || existing.data.start?.date || ''
    );
    const newDate = params.date || format(existingStart, 'yyyy-MM-dd');
    const newTime = params.time || format(existingStart, 'HH:mm');
    const duration = params.duration_minutes || DEFAULT_EVENT_DURATION_MINUTES;

    const startDate = new TZDate(
      new Date(`${newDate}T${newTime}:00`),
      TIMEZONE
    );
    const endDate = addMinutes(startDate, duration);

    update.start = { dateTime: startDate.toISOString(), timeZone: TIMEZONE };
    update.end = { dateTime: endDate.toISOString(), timeZone: TIMEZONE };
  }

  const res = await cal.events.update({
    calendarId: 'primary',
    eventId: params.eventId,
    requestBody: update,
  });

  return {
    id: res.data.id || undefined,
    title: res.data.summary || '',
    start: res.data.start?.dateTime || '',
    end: res.data.end?.dateTime || '',
    location: res.data.location || undefined,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  const cal = getCalendar();
  await cal.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

export async function findEvent(
  titleQuery: string,
  date?: string
): Promise<CalendarEvent | null> {
  // Search this week first, then expand to 30 days if not found
  const weekEvents = await queryEvents({
    date,
    range: date ? undefined : 'week',
  });
  const query = titleQuery.toLowerCase();
  const found = weekEvents.find((e) => e.title.toLowerCase().includes(query));
  if (found) return found;

  // Expand search to 30 days
  const cal = getCalendar();
  const now = new TZDate(new Date(), TIMEZONE);
  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: startOfDay(now).toISOString(),
    timeMax: endOfDay(addDays(now, 30)).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    q: titleQuery,
    timeZone: TIMEZONE,
  });

  const matches = (res.data.items || []).map((e) => ({
    id: e.id || undefined,
    title: e.summary || 'Untitled',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    location: e.location || undefined,
  }));

  return matches[0] || null;
}

export function formatEventsForDisplay(events: CalendarEvent[]): string {
  if (events.length === 0) return 'Clear day — no events scheduled.';

  // Group events by date so the LLM doesn't conflate different days
  const grouped: Record<string, string[]> = {};
  for (const e of events) {
    const dateKey = e.start
      ? format(new TZDate(new Date(e.start), TIMEZONE), 'EEEE d MMM')
      : 'Unknown';
    const time = e.start
      ? format(new TZDate(new Date(e.start), TIMEZONE), 'HH:mm')
      : 'All day';
    const endTime = e.end
      ? format(new TZDate(new Date(e.end), TIMEZONE), 'HH:mm')
      : '';
    const timeRange = endTime ? `${time}-${endTime}` : time;
    const loc = e.location ? ` at ${e.location}` : '';
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(`  • ${timeRange} — ${e.title}${loc}`);
  }

  return Object.entries(grouped)
    .map(([date, items]) => `${date}:\n${items.join('\n')}`)
    .join('\n\n');
}
