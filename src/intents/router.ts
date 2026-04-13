import { ParsedIntent } from '../services/claude';
import { handleCalendarIntent } from './calendar.handler';
import { handleTaskIntent } from './task.handler';
import { handleEmailIntent } from './email.handler';
import { handleRelayIntent } from './relay.handler';
import { handleWeatherIntent } from './weather.handler';
import { handleDateIntent } from './date.handler';

export async function routeIntent(parsed: ParsedIntent): Promise<string> {
  try {
    switch (parsed.intent) {
      case 'add_event':
      case 'query_schedule':
      case 'edit_event':
      case 'cancel_event':
        return await handleCalendarIntent(parsed);

      case 'add_task':
      case 'list_tasks':
      case 'complete_task':
        return await handleTaskIntent(parsed);

      case 'check_emails':
      case 'draft_reply':
      case 'send_reply':
        return await handleEmailIntent(parsed);

      case 'relay_message':
        return await handleRelayIntent(parsed);

      case 'weather':
        return await handleWeatherIntent();

      case 'add_date':
        return await handleDateIntent(parsed);

      case 'book_something':
        return parsed.response || "I'll look into that for you. What's the name of the place?";

      case 'general_chat':
      default:
        return parsed.response;
    }
  } catch (error) {
    console.error(`Intent handler error [${parsed.intent}]:`, error);
    return parsed.response || "Hit a snag there, boss. Give me a sec and try again.";
  }
}
