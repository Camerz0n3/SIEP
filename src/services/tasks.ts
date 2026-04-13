import { getDb, generateId } from './database';
import { TIMEZONE } from '../config/constants';
import { TZDate } from '@date-fns/tz';
import { format, startOfDay, endOfDay } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: string;
  status: string;
  category: string;
  created_at: string;
  completed_at?: string;
  reminder_sent: number;
  notes?: string;
}

export async function createTask(params: {
  title: string;
  due_date?: string;
  due_time?: string;
  priority?: string;
  category?: string;
  description?: string;
}): Promise<Task> {
  const db = getDb();
  const id = generateId();

  db.prepare(
    `INSERT INTO tasks (id, title, description, due_date, due_time, priority, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.title,
    params.description || null,
    params.due_date || null,
    params.due_time || null,
    params.priority || 'normal',
    params.category || 'general'
  );

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task;
}

export async function listTasks(filter?: {
  filter?: 'all' | 'today' | 'overdue' | 'category';
  category?: string;
}): Promise<Task[]> {
  const db = getDb();
  const now = new TZDate(new Date(), TIMEZONE);

  if (filter?.filter === 'today') {
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();
    return db
      .prepare(
        `SELECT * FROM tasks WHERE status = 'pending' AND due_date >= ? AND due_date <= ? ORDER BY due_date ASC`
      )
      .all(todayStart, todayEnd) as Task[];
  }

  if (filter?.filter === 'overdue') {
    return db
      .prepare(
        `SELECT * FROM tasks WHERE status = 'pending' AND due_date < ? AND due_date IS NOT NULL ORDER BY due_date ASC`
      )
      .all(now.toISOString()) as Task[];
  }

  if (filter?.filter === 'category' && filter.category) {
    return db
      .prepare(
        `SELECT * FROM tasks WHERE status = 'pending' AND category = ? ORDER BY due_date ASC`
      )
      .all(filter.category) as Task[];
  }

  return db
    .prepare(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY due_date ASC`)
    .all() as Task[];
}

export async function completeTask(titleQuery: string): Promise<Task | null> {
  const db = getDb();

  const task = db
    .prepare(
      `SELECT * FROM tasks WHERE status = 'pending' AND title LIKE ? LIMIT 1`
    )
    .get(`%${titleQuery}%`) as Task | undefined;

  if (!task) return null;

  db.prepare(
    `UPDATE tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ?`
  ).run(task.id);

  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as Task;
}

export async function getOverdueTasks(): Promise<Task[]> {
  return listTasks({ filter: 'overdue' });
}

export async function getDueReminders(): Promise<Task[]> {
  const db = getDb();
  const now = new Date().toISOString();

  return db
    .prepare(
      `SELECT * FROM tasks WHERE status = 'pending' AND reminder_sent = 0 AND due_date IS NOT NULL AND due_date <= ?`
    )
    .all(now) as Task[];
}

export async function markReminderSent(taskId: string): Promise<void> {
  const db = getDb();
  db.prepare(`UPDATE tasks SET reminder_sent = 1 WHERE id = ?`).run(taskId);
}

export function formatTasksForDisplay(tasks: Task[]): string {
  if (tasks.length === 0) return 'No tasks. Living the dream.';

  const now = new TZDate(new Date(), TIMEZONE);

  return tasks
    .map((t) => {
      const overdue =
        t.due_date && new Date(t.due_date) < now ? '[Overdue] ' : '';
      const due = t.due_date
        ? ` — due ${format(new TZDate(new Date(t.due_date), TIMEZONE), 'EEE d MMM')}`
        : '';
      const priority =
        t.priority === 'high' || t.priority === 'urgent' ? ' ⚡' : '';
      return `• ${overdue}${t.title}${due}${priority}`;
    })
    .join('\n');
}
