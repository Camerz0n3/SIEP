import { queryEvents } from '../services/calendar';
import { db, generateId } from '../services/database';
import { getUpcomingDates } from '../services/dates';
import { generateResponse } from '../services/claude';
import { Task } from '../services/tasks';
import { format, subDays } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { TIMEZONE } from '../config/constants';

export async function generateWeeklyWrapUp(): Promise<string> {
  const now = new TZDate(new Date(), TIMEZONE);
  const weekAgo = subDays(now, 7);

  const completedTasks = db.findWhere<Task>(
    'tasks',
    (t) => t.status === 'completed' && !!t.completed_at && t.completed_at >= weekAgo.toISOString()
  );

  const pendingTasks = db.findWhere<Task>('tasks', (t) => t.status === 'pending');

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
    `Generate Cameron's weekly wrap-up. Summarise the week, carry forward outstanding tasks, preview the week ahead. Add Lloyd-from-Entourage editorial commentary. Telegram Markdown format.\n\nData:\n${wrapUpData}`,
    ''
  );

  db.insert('briefing_log', {
    id: generateId(),
    type: 'weekly',
    content: wrapUp,
    data_snapshot: wrapUpData,
    sent_at: new Date().toISOString(),
  });

  return wrapUp;
}
