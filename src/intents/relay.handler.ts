import { ParsedIntent } from '../services/claude';
import { findContact, Contact } from '../services/contacts';
import { sendSMS } from '../services/twilio';
import { db } from '../services/database';

export async function handleRelayIntent(parsed: ParsedIntent): Promise<string> {
  const p = parsed.params as Record<string, string | undefined>;

  if (!p.recipient || !p.message) {
    return "Who should I message, and what should I say?";
  }

  const contact = await findContact(p.recipient);

  if (!contact || !contact.phone) {
    return `I don't have ${p.recipient}'s number. Can you give it to me and I'll save it?`;
  }

  const isFirstTime = !contact.notes?.includes('relay_introduced');

  const messageBody = isFirstTime
    ? `Hi ${contact.name}, it's Cameron's assistant. He says: ${p.message}`
    : p.message;

  await sendSMS(contact.phone, messageBody);

  if (isFirstTime) {
    db.update<Contact>('contacts', (c) => c.id === contact.id, {
      notes: `${contact.notes || ''} relay_introduced`.trim(),
    });
  }

  return `Done — told ${contact.name}: "${p.message}"`;
}
