import { ParsedIntent } from '../services/claude';
import {
  createTask,
  listTasks,
  completeTask,
  formatTasksForDisplay,
} from '../services/tasks';

export async function handleTaskIntent(
  parsed: ParsedIntent
): Promise<string> {
  const p = parsed.params as Record<string, string | undefined>;

  switch (parsed.intent) {
    case 'add_task': {
      if (!p.title) {
        return "What's the task, boss?";
      }

      await createTask({
        title: p.title,
        due_date: p.due_date,
        due_time: p.due_time,
        priority: p.priority,
        category: p.category,
      });

      return parsed.response;
    }

    case 'list_tasks': {
      const tasks = await listTasks({
        filter: p.filter as 'all' | 'today' | 'overdue' | 'category' | undefined,
        category: p.category,
      });

      const display = formatTasksForDisplay(tasks);
      return `${parsed.response}\n\n${display}`;
    }

    case 'complete_task': {
      if (!p.title_query) {
        return "Which task did you finish?";
      }

      const completed = await completeTask(p.title_query);
      if (!completed) {
        return `Couldn't find a task matching "${p.title_query}". What's it called exactly?`;
      }

      return parsed.response;
    }

    default:
      return parsed.response;
  }
}
