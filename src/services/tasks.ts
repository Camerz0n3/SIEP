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

export async function listTasks(filter?: {
  filter?: 'all' | 'today' | 'overdue' | 'category';
  category?: string;
}): Promise<Task[]> {
  const now = new Date().toISOString();
  let tasks = db.findWhere<Task>('tasks', (t) => t.status === 'pending');

  if (filter?.filter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    tasks = tasks.filter((t) => t.due_date && t.due_date.startsWith(today));
  } else if (filter?.filter === 'overdue') {
    tasks = tasks.filter((t) => t.due_date && t.due_date < now);
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
  const now = new Date().toISOString();
  return db.findWhere<Task>(
    'tasks',
    (t) => t.status === 'pending' && !t.reminder_sent && !!t.due_date && t.due_date <= now
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
      const overdue = t.due_date && new Date(t.due_date) < now ? '[Overdue] ' : '';
      const due = t.due_date
        ? ` — due ${format(new TZDate(new Date(t.due_date), TIMEZONE), 'EEE d MMM')}`
        : '';
      const priority = t.priority === 'high' || t.priority === 'urgent' ? ' ⚡' : '';
      return `• ${overdue}${t.title}${due}${priority}`;
    })
    .join('\n');
}
