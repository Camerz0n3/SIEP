import { db, generateId } from './database';
import { TIMEZONE } from '../config/constants';
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

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
  reminder_sent: boolean;
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
  const task: Task = {
    id: generateId(),
    title: params.title,
    description: params.description,
    due_date: params.due_date || undefined,
    due_time: params.due_time || undefined,
    priority: params.priority || 'normal',
    status: 'pending',
    category: params.category || 'general',
    created_at: new Date().toISOString(),
    reminder_sent: false,
  };

  return db.insert('tasks', task);
}

function taskDeadline(t: Task): Date {
  const [year, month, day] = (t.due_date || '').split('-').map(Number);
  if (t.due_time) {
    const [hour, minute] = t.due_time.split(':').map(Number);
    return new TZDate(year, month - 1, day, hour, minute, 0, TIMEZONE);
  }
  // No due_time — deadline is end of the due date
  return new TZDate(year, month - 1, day, 23, 59, 59, TIMEZONE);
}

export async function listTasks(filter?: {
  filter?: 'all' | 'today' | 'overdue' | 'category';
  category?: string;
  includeCompleted?: boolean;
}): Promise<Task[]> {
  const now = new TZDate(new Date(), TIMEZONE);
  let tasks = filter?.includeCompleted
    ? db.findAll<Task>('tasks')
    : db.findWhere<Task>('tasks', (t) => t.status === 'pending');

  if (filter?.filter === 'today') {
    const today = format(now, 'yyyy-MM-dd');
    tasks = tasks.filter((t) => t.due_date && t.due_date === today);
  } else if (filter?.filter === 'overdue') {
    tasks = tasks.filter((t) => t.status === 'pending' && t.due_date && taskDeadline(t) < now);
  } else if (filter?.filter === 'category' && filter.category) {
    tasks = tasks.filter((t) => t.category === filter.category);
  }

  return tasks.sort((a, b) => (a.due_date || 'z').localeCompare(b.due_date || 'z'));
}

export async function completeTask(titleQuery: string): Promise<Task | null> {
  const query = titleQuery.toLowerCase();
  const task = db.findOne<Task>(
    'tasks',
    (t) => t.status === 'pending' && t.title.toLowerCase().includes(query)
  );

  if (!task) return null;

  const updated = db.update<Task>('tasks', (t) => t.id === task.id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  return updated || null;
}

export async function getOverdueTasks(): Promise<Task[]> {
  return listTasks({ filter: 'overdue' });
}

export async function getDueReminders(): Promise<Task[]> {
  const now = new TZDate(new Date(), TIMEZONE);
  return db.findWhere<Task>(
    'tasks',
    (t) => t.status === 'pending' && !t.reminder_sent && !!t.due_date && taskDeadline(t) <= now
  );
}

export async function markReminderSent(taskId: string): Promise<void> {
  db.update<Task>('tasks', (t) => t.id === taskId, { reminder_sent: true });
}

export function formatTasksForDisplay(tasks: Task[]): string {
  if (tasks.length === 0) return 'No tasks. Living the dream.';

  const now = new TZDate(new Date(), TIMEZONE);

  return tasks
    .map((t) => {
      const overdue = t.due_date && taskDeadline(t) < now ? '[Overdue] ' : '';
      const due = t.due_date
        ? ` — due ${format(new TZDate(new Date(t.due_date), TIMEZONE), 'EEE d MMM')}`
        : '';
      const priority = t.priority === 'high' || t.priority === 'urgent' ? ' ⚡' : '';
      return `• ${overdue}${t.title}${due}${priority}`;
    })
    .join('\n');
}
