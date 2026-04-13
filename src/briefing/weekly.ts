import { queryEvents } from '../services/calendar';
import { getDb, generateId } from '../services/database';
import { getUpcomingDates } from '../services/dates';
import { generateResponse } from '../services/claude';
import { format, subDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { TIMEZONE } from '../config/constants';

export async function generateWeeklyWrapUp(): Promise<string> {
  const now = new TZDate(new Date(), TIMEZONE);
  const weekAgo = subDays(now, 7);
  const db = getDb();

  const completedTasks = db
    .prepare(`SELECT * FROM tasks WHERE status = 'completed' AND completed_at >= ?`)
    .all(weekAgo.toISOString()) as { title: string }[];

  const pendingTasks = db
    .prepare(`SELECT * FROM tasks WHERE status = 'pending'`)
    .all() as { title: string }[];

  const [pastEvents, upcomingDates] = await Promise.allSettled([
    queryEvents({ date: format(weekAgo, 'yyyy-MM-dd'), range: 'week' }),
    getUpcomingDates(7),
  ]);

  const wrapUpData = `
Week ending: ${format(now, 'EEEE, d MMMM yyyy')}

STATS:
- Tasks completed this week: ${completedTasks.length}
- Tasks still pending: ${pendingTasks.length}
- Events this week: ${pastEvents.status === 'fulfilled' ? pastEvents.value.length : 'unknown'}

PENDING TASKS:
${pendingTasks.map((t) => `• ${t.title}`).join('\n') || 'None.'}

UPCOMING DATES (next 7 days):
${upcomingDates.status === 'fulfilled' ? upcomingDates.value.map((d) => `• ${d.title} — ${d.date_day}/${d.date_month}`).join('\n') : 'None.'}
`;

  const wrapUp = await generateResponse(
    `Generate Cameron's weekly wrap-up. Summarise the week, carry forward outstanding tasks, preview the week ahead. Add Lloyd-from-Entourage editorial commentary. WhatsApp format.\n\nData:\n${wrapUpData}`,
    ''
  );

  db.prepare(
    `INSERT INTO briefing_log (id, type, content, data_snapshot) VALUES (?, ?, ?, ?)`
  ).run(generateId(), 'weekly', wrapUp, wrapUpData);

  return wrapUp;
}
