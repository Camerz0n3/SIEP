import { ParsedIntent, generateResponse } from '../services/claude';
import {
  createEvent,
  queryEvents,
  updateEvent,
  deleteEvent,
  findEvent,
  formatEventsForDisplay,
} from '../services/calendar';
import { createTask } from '../services/tasks';
import { DEFAULT_REMINDER_MINUTES_BEFORE } from '../config/constants';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { TIMEZONE } from '../config/constants';

export async function handleCalendarIntent(
  parsed: ParsedIntent
): Promise<string> {
  const p = parsed.params as Record<string, string | number | undefined>;

  switch (parsed.intent) {
    case 'add_event': {
      if (!p.title || !p.date || !p.time) {
        return parsed.response || "Need a title, date and time to add an event. What are we booking?";
      }

      const recurrence = p.recurrence
        ? [String(p.recurrence).startsWith('RRULE:') ? String(p.recurrence) : `RRULE:${p.recurrence}`]
        : undefined;

      const event = await createEvent({
        title: p.title as string,
        date: p.date as string,
        time: p.time as string,
        location: p.location as string | undefined,
        duration_minutes: p.duration_minutes as number | undefined,
        recurrence,
      });

      // Create a reminder task
      const reminderMinutes =
        (p.reminder_minutes_before as number) || DEFAULT_REMINDER_MINUTES_BEFORE;
      const eventStart = new TZDate(new Date(event.start), TIMEZONE);
      const reminderTime = new Date(
        eventStart.getTime() - reminderMinutes * 60 * 1000
      );

      await createTask({
        title: `Reminder: ${event.title}`,
        due_date: reminderTime.toISOString().split('T')[0],
        due_time: format(reminderTime, 'HH:mm'),
        category: 'personal',
      });

      // Always confirm exactly what was created so Cameron can catch errors
      const startTime = format(new TZDate(new Date(event.start), TIMEZONE), 'HH:mm');
      const endTime = format(new TZDate(new Date(event.end), TIMEZONE), 'HH:mm');
      const eventDate = format(new TZDate(new Date(event.start), TIMEZONE), 'EEEE d MMM');
      const loc = event.location ? ` at ${event.location}` : '';
      return `Done — *${event.title}* added:\n${eventDate}, ${startTime}-${endTime}${loc}\n\nThat look right?`;
    }

    case 'query_schedule': {
      const events = await queryEvents({
        date: p.date as string | undefined,
        range: p.range as 'today' | 'tomorrow' | 'week' | undefined,
      });

      const display = formatEventsForDisplay(events);
      const range = (p.range as string) || 'today';
      return await generateResponse(
        `Cameron asked about his ${range} schedule. Here are the ACTUAL events from Google Calendar — report ONLY these, do not invent or guess any events:\n\n${display}\n\nGive a brief Lloyd-style summary. If no events, say it's clear.`,
        ''
      );
    }

    case 'edit_event': {
      const existing = await findEvent(
        p.original_title as string,
        p.date as string | undefined
      );

      if (!existing || !existing.id) {
        return `Couldn't find an event matching "${p.original_title}". Can you be more specific?`;
      }

      await updateEvent({
        eventId: existing.id,
        title: p.new_title as string | undefined,
        time: p.new_time as string | undefined,
        location: p.new_location as string | undefined,
      });

      return parsed.response;
    }

    case 'cancel_event': {
      const toDelete = await findEvent(
        p.title as string,
        p.date as string | undefined
      );

      if (!toDelete || !toDelete.id) {
        return `Couldn't find an event matching "${p.title}". What's the exact name?`;
      }

      await deleteEvent(toDelete.id);
      return parsed.response;
    }

    default:
      return parsed.response;
  }
}
