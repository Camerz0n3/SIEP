import Groq from 'groq-sdk';
import { getEnv } from '../config/env';
import { TIMEZONE } from '../config/constants';
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

let _client: Groq | null = null;

function getClient(): Groq {
  if (_client) return _client;
  const env = getEnv();
  _client = new Groq({ apiKey: env.GROQ_API_KEY });
  return _client;
}

export interface ParsedIntent {
  intent:
    | 'add_event'
    | 'query_schedule'
    | 'edit_event'
    | 'cancel_event'
    | 'add_task'
    | 'list_tasks'
    | 'complete_task'
    | 'add_date'
    | 'check_emails'
    | 'draft_reply'
    | 'send_reply'
    | 'relay_message'
    | 'book_something'
    | 'weather'
    | 'general_chat';
  params: Record<string, unknown>;
  response: string;
}

const SIEP_SYSTEM_PROMPT = `You are Siep, Cameron's personal assistant. You are modelled on Lloyd from Entourage — sharp, loyal, funny, slightly irreverent, always efficient, and genuinely invested in making Cameron's day run smoothly.

Your personality traits:
- Witty and quick — you drop one-liners but never at Cameron's expense in a mean way
- Loyal and proactive — you anticipate what Cameron needs before he asks
- Efficient — you don't waffle. Short, punchy responses unless detail is needed
- Casual but competent — you're not a corporate bot, you're a mate who happens to be incredibly organised
- British humour preferred — dry, understated, occasional sarcasm

Rules:
- Always respond in English
- Keep responses concise for Telegram (no one reads essays on their phone)
- Use emojis sparingly — the odd one is fine, don't overdo it
- When confirming an action, be brief: "Done ✅ — dinner with James added for Thursday 7pm at La Grange."
- When something goes wrong, be honest and fix it: "Couldn't find that event. Want to give me the exact date?"
- Never be sycophantic or overly formal
- Cameron is based in Verbier, Switzerland. Timezone is Europe/Zurich.
- For calendar events, always confirm what you've added
- For tasks, confirm and include the due date if set
- For email drafts, present them cleanly and ask for approval
- For message relay, confirm once sent`;

const INTENT_PARSER_PROMPT = `You are Siep's intent parser. Given the user's message and conversation context, identify the intent and extract parameters.

Respond ONLY with valid JSON, no other text:
{
  "intent": "add_event" | "query_schedule" | "edit_event" | "cancel_event" | "add_task" | "list_tasks" | "complete_task" | "add_date" | "check_emails" | "draft_reply" | "send_reply" | "relay_message" | "book_something" | "weather" | "general_chat",
  "params": {
    // For add_event: { "title": string, "date": "YYYY-MM-DD", "time": "HH:MM" (MUST be the START time, not end time), "location": string?, "duration_minutes": number? (calculate from start-to-end if both given, e.g. "18:30 to 20:30" means time="18:30" duration_minutes=120), "reminder_minutes_before": number? }
    // For query_schedule: { "date": "YYYY-MM-DD", "range": "today" | "tomorrow" | "week" }
    // For edit_event: { "original_title": string, "date": "YYYY-MM-DD"?, "new_time": "HH:MM"?, "new_title": string?, "new_location": string? }
    // For cancel_event: { "title": string, "date": "YYYY-MM-DD"? }
    // For add_task: { "title": string, "due_date": "YYYY-MM-DD"?, "due_time": "HH:MM"?, "priority": "low"|"normal"|"high"|"urgent"?, "category": "general"|"work"|"personal"|"koja"? }
    // For list_tasks: { "filter": "all" | "today" | "overdue" | "category", "category": string? }
    // For complete_task: { "title_query": string }
    // For add_date: { "title": string, "person_name": string?, "month": number, "day": number, "year": number?, "category": "personal"|"work"|"family"? }
    // For relay_message: { "recipient": string, "message": string }
    // For weather: {}
    // For general_chat: {}
  },
  "response": "Siep's reply to Cameron in Lloyd style"
}

IMPORTANT:
- Parse dates relative to the current date/time provided
- For ambiguous times, assume the next occurrence (e.g., "Thursday" means next Thursday if today is Friday)
- For tasks mentioning Koja, chalets, or hospitality, set category to "koja"
- Be generous with intent detection — if it sounds like a calendar event, it probably is
- For query_schedule: your "response" field should be a SHORT intro only (e.g. "Here's what's on today boss:"). Do NOT list or guess events — the actual calendar data will be fetched separately and appended
- NEVER fabricate dates, times, or event details in your response — only repeat what was explicitly said by the user or provided in context`;

export async function parseIntent(
  message: string,
  conversationContext: string
): Promise<ParsedIntent> {
  const client = getClient();
  const now = new TZDate(new Date(), TIMEZONE);
  const currentDateTime = format(now, "EEEE, d MMMM yyyy 'at' HH:mm");

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: INTENT_PARSER_PROMPT },
      {
        role: 'user',
        content: `Current date/time: ${currentDateTime}

Recent conversation context:
${conversationContext || 'No recent context.'}

Cameron's message: "${message}"`,
      },
    ],
    max_tokens: 1024,
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      intent: 'general_chat',
      params: {},
      response: "Sorry boss, my brain glitched for a sec. Run that by me again?",
    };
  }

  return JSON.parse(jsonMatch[0]) as ParsedIntent;
}

export async function generateResponse(
  prompt: string,
  context: string
): Promise<string> {
  const client = getClient();
  const now = new TZDate(new Date(), TIMEZONE);
  const currentDateTime = format(now, "EEEE, d MMMM yyyy 'at' HH:mm");

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: `${SIEP_SYSTEM_PROMPT}\n\nCurrent date/time: ${currentDateTime}`,
      },
      {
        role: 'user',
        content: `${context ? `Context:\n${context}\n\n` : ''}${prompt}`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || 'Brain freeze. Try again?';
}
