import Twilio from 'twilio';
import { getEnv } from '../config/env';
import { WHATSAPP_MAX_LENGTH } from '../config/constants';

let _client: Twilio.Twilio | null = null;

function getClient(): Twilio.Twilio {
  if (_client) return _client;
  const env = getEnv();
  _client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return _client;
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const env = getEnv();
  const client = getClient();
  const chunks = splitMessage(body);

  for (const chunk of chunks) {
    await client.messages.create({
      from: env.TWILIO_WHATSAPP_NUMBER,
      to,
      body: chunk,
    });
  }
}

export async function sendSMS(to: string, body: string): Promise<void> {
  const env = getEnv();
  const client = getClient();
  // Strip 'whatsapp:' prefix for SMS
  const smsFrom = env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', '');
  const smsTo = to.replace('whatsapp:', '');

  await client.messages.create({
    from: smsFrom,
    to: smsTo,
    body,
  });
}

export function splitMessage(text: string): string[] {
  if (text.length <= WHATSAPP_MAX_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= WHATSAPP_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find a good split point (newline or space)
    let splitAt = remaining.lastIndexOf('\n', WHATSAPP_MAX_LENGTH);
    if (splitAt < WHATSAPP_MAX_LENGTH * 0.5) {
      splitAt = remaining.lastIndexOf(' ', WHATSAPP_MAX_LENGTH);
    }
    if (splitAt < WHATSAPP_MAX_LENGTH * 0.5) {
      splitAt = WHATSAPP_MAX_LENGTH;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const env = getEnv();
  return Twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}
