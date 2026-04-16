import { queryEvents, formatEventsForDisplay } from '../services/calendar';
import { listTasks, getOverdueTasks, formatTasksForDisplay } from '../services/tasks';
import { scanAllEmails } from '../services/gmail';
import { getUpcomingDates } from '../services/dates';
import { getWeather, formatWeatherForDisplay } from '../services/weather';
import { generateResponse } from '../services/claude';
import { db, generateId } from '../services/database';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { TIMEZONE } from '../config/constants';

export async function generateDailyBriefing(): Promise<string> {
  const now = new TZDate(new Date(), TIMEZONE);
  const dateStr = format(now, 'EEEE, d MMMM yyyy');

  // Fetch all data in parallel
  const [todayEvents, todayTasks, overdueTasks, emails, upcomingDates, weather] =
    await Promise.allSettled([
      queryEvents({ range: 'today' }),
      listTasks({ filter: 'today' }),
      getOverdueTasks(),
      scanAllEmails(24).catch(() => []),
      getUpcomingDates(7),
      getWeather(),
    ]);

  const eventsDisplay =
    todayEvents.status === 'fulfilled'
      ? formatEventsForDisplay(todayEvents.value)
      : 'Couldn\'t check the calendar — will try again shortly.';

  const allTasks = [
    ...(overdueTasks.status === 'fulfilled' ? overdueTasks.value : []),
    ...(todayTasks.status === 'fulfilled' ? todayTasks.value : []),
  ];
  const tasksDisplay = formatTasksForDisplay(allTasks);

  const emailData =
    emails.status === 'fulfilled' ? emails.value : [];

  const datesData =
    upcomingDates.status === 'fulfilled' ? upcomingDates.value : [];

  const weatherDisplay =
    weather.status === 'fulfilled'
      ? formatWeatherForDisplay(weather.value)
      : 'Weather data unavailable.';

  // Build the briefing using Claude for the editorial touch
  const briefingData = `
Date: ${dateStr}

SCHEDULE:
${eventsDisplay}

TASKS:
${tasksDisplay}

EMAILS (last 24h):
${emailData.length > 0 ? emailData.map((e) => `[${e.account}] ${e.from}: ${e.subject} — ${e.snippet}`).join('\n') : 'No important emails.'}

UPCOMING DATES (next 7 days):
${datesData.length > 0 ? datesData.map((d) => `${d.title} — ${d.date_day}/${d.date_month}`).join('\n') : 'No upcoming dates.'}

WEATHER (Verbier):
${weatherDisplay}
`;

  const briefing = await generateResponse(
    `Generate Cameron's morning briefing. Use this exact structure but add your Lloyd-from-Entourage personality. Keep it concise for Telegram. Use Markdown formatting (*bold*, _italic_). Add a "Siep's Notes" section at the end with any observations or reminders.\n\nData:\n${briefingData}`,
    ''
  );

  // Log the briefing
  db.insert('briefing_log', {
    id: generateId(),
    type: 'daily',
    content: briefing,
    data_snapshot: briefingData,
    sent_at: new Date().toISOString(),
  });

  return briefing;
}
