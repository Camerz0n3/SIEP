import { getEnv } from '../config/env';
import { MESSAGE_MAX_LENGTH } from '../config/constants';

const API_BASE = 'https://api.telegram.org/bot';

export async function sendMessage(chatId: string, text: string): Promise<void> {
  const env = getEnv();
  const chunks = splitMessage(text);

  for (const chunk of chunks) {
    // Try with Markdown first, fall back to plain text if parsing fails
    let res = await fetch(`${API_BASE}${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: 'Markdown' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Bad Request from Markdown parsing — retry without parse_mode
      if (res.status === 400) {
        res = await fetch(`${API_BASE}${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: chunk }),
        });
        if (!res.ok) {
          const retryErr = await res.json().catch(() => ({}));
          throw new Error(`Telegram send failed: ${(retryErr as any).description || res.statusText}`);
        }
      } else {
        throw new Error(`Telegram send failed: ${(err as any).description || res.statusText}`);
      }
    }
  }
}

export function splitMessage(text: string): string[] {
  if (text.length <= MESSAGE_MAX_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MESSAGE_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }

    let splitAt = remaining.lastIndexOf('\n', MESSAGE_MAX_LENGTH);
    if (splitAt < MESSAGE_MAX_LENGTH * 0.5) {
      splitAt = remaining.lastIndexOf(' ', MESSAGE_MAX_LENGTH);
    }
    if (splitAt < MESSAGE_MAX_LENGTH * 0.5) {
      splitAt = MESSAGE_MAX_LENGTH;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

export async function registerWebhook(webhookUrl: string): Promise<void> {
  const env = getEnv();
  const res = await fetch(`${API_BASE}${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const data = await res.json() as { ok: boolean; description?: string };
  if (data.ok) {
    console.log(`Telegram webhook registered: ${webhookUrl}`);
  } else {
    console.error(`Telegram webhook registration failed: ${data.description}`);
  }
}
