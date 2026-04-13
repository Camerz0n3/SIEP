import { ParsedIntent } from '../services/claude';
import { addImportantDate } from '../services/dates';

export async function handleDateIntent(
  parsed: ParsedIntent
): Promise<string> {
  const p = parsed.params as Record<string, string | number | undefined>;

  if (!p.title || !p.month || !p.day) {
    return "I need at least a title, month, and day. What's the date?";
  }

  await addImportantDate({
    title: p.title as string,
    person_name: p.person_name as string | undefined,
    month: p.month as number,
    day: p.day as number,
    year: p.year as number | undefined,
    category: p.category as string | undefined,
  });

  return parsed.response;
}
