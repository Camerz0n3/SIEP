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

function reasonOf(result: PromiseSettledResult<unknown>): string {
  if (result.status === 'fulfilled') return '';
  const r = result.reason as unknown;
  if (r instanceof Error) return r.message;
  return String(r);
}

export async function generateDailyBriefing(): Promise<string> {
  const now = new TZDate(new Date(), TIMEZONE);
  const dateStr = format(now, 'EEEE, d MMMM yyyy');

  // Fetch all data in parallel
  const [todayEvents, todayTasks, overdueTasks, emails, upcomingDates, weather] =
    await Promise.allSettled([
      queryEvents({ range: 'today' }),
      listTasks({ filter: 'today' }),
      getOverdueTasks(),
      scanAllEmails(24),
      getUpcomingDates(7),
      getWeather(),
    ]);

  // Track infrastructure failures so the briefing can name them honestly
  // instead of letting Groq narrate around a silent outage.
  const brokenSystems: string[] = [];

  const eventsDisplay =
    todayEvents.status === 'fulfilled'
      ? formatEventsForDisplay(todayEvents.value)
      : '[BROKEN] Calendar unreachable.';
  if (todayEvents.status === 'rejected') {
    brokenSystems.push(`Calendar (${reasonOf(todayEvents)})`);
  }

  const allTasks = [
    ...(overdueTasks.status === 'fulfilled' ? overdueTasks.value : []),
    ...(todayTasks.status === 'fulfilled' ? todayTasks.value : []),
  ];
  const tasksDisplay = formatTasksForDisplay(allTasks);
  if (todayTasks.status === 'rejected' || overdueTasks.status === 'rejected') {
    brokenSystems.push('Task store');
  }

  const emailsBroken = emails.status === 'rejected';
  const emailData = emails.status === 'fulfilled' ? emails.value : [];
  const emailsDisplay = emailsBroken
    ? '[BROKEN] Gmail unreachable.'
    : emailData.length > 0
    ? emailData.map((e) => `[${e.account}] ${e.from}: ${e.subject} — ${e.snippet}`).join('\n')
    : 'No important emails.';
  if (emailsBroken) {
    brokenSystems.push(`Gmail (${reasonOf(emails)})`);
  }

  const datesData =
    upcomingDates.status === 'fulfilled' ? upcomingDates.value : [];

  const weatherDisplay =
    weather.status === 'fulfilled'
      ? formatWeatherForDisplay(weather.value)
      : '[BROKEN] Weather feed unreachable.';
  if (weather.status === 'rejected') {
    brokenSystems.push('Weather');
  }

  // Build the briefing using Groq for the editorial touch
  const briefingData = `
Date: ${dateStr}

SCHEDULE:
${eventsDisplay}

TASKS:
${tasksDisplay}

EMAILS (last 24h):
${emailsDisplay}

UPCOMING DATES (next 7 days):
${datesData.length > 0 ? datesData.map((d) => `${d.title} — ${d.date_day}/${d.date_month}`).join('\n') : 'No upcoming dates.'}

WEATHER (Verbier):
${weatherDisplay}

BROKEN SYSTEMS:
${brokenSystems.length > 0 ? brokenSystems.map((s) => `- ${s}`).join('\n') : 'None.'}
`;

  const briefing = await generateResponse(
    `Generate Cameron's morning briefing. Use this exact structure but add your Lloyd-from-Entourage personality. Keep it concise for Telegram. Use Markdown formatting (*bold*, _italic_).

CRITICAL HONESTY RULE: Any section that contains "[BROKEN]" or that appears in the BROKEN SYSTEMS list is genuinely broken — Cameron's data source is offline. Do NOT soften this, do NOT promise to "try again", do NOT make excuses on Siep's behalf, do NOT pretend the absence of data means "all clear". Report it plainly in the relevant section, e.g. "Calendar's offline boss — can't see today's schedule." If multiple systems are broken, end the briefing with a short "Heads up boss, [systems] need fixing" line in Siep's Notes.

If everything is working, ignore the BROKEN SYSTEMS section entirely.

Add a "Siep's Notes" section at the end with any genuine observations.

Data:
${briefingData}`,
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
