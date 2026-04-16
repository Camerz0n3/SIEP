import { getDueReminders, markReminderSent } from '../services/tasks';
import { sendMessage } from '../services/telegram';
import { getEnv } from '../config/env';

export async function checkReminders(): Promise<number> {
  const env = getEnv();
  const dueReminders = await getDueReminders();

  let sent = 0;

  for (const task of dueReminders) {
    try {
      const message = task.title.startsWith('Reminder:')
        ? `Heads up boss — ${task.title.replace('Reminder: ', '')} is coming up.`
        : `Don't forget: ${task.title}`;

      await sendMessage(env.TELEGRAM_CHAT_ID, message);
      await markReminderSent(task.id);
      sent++;
    } catch (error) {
      console.error(`Failed to send reminder for task ${task.id}:`, error);
    }
  }

  return sent;
}
