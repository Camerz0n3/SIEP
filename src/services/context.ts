import { db, generateId } from './database';
import { CONTEXT_WINDOW_MESSAGES, CONTEXT_TIMEOUT_HOURS } from '../config/constants';

interface ContextRow {
  id: string;
  role: string;
  content: string;
  intent?: string;
  timestamp: string;
}

export async function getConversationContext(): Promise<string> {
  const cutoff = new Date(
    Date.now() - CONTEXT_TIMEOUT_HOURS * 60 * 60 * 1000
  ).toISOString();

  const rows = db
    .findWhere<ContextRow>('conversation_context', (r) => r.timestamp >= cutoff)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-CONTEXT_WINDOW_MESSAGES);

  if (rows.length === 0) return '';

  return rows
    .map((msg) => `${msg.role === 'user' ? 'Cameron' : 'Siep'}: ${msg.content}`)
    .join('\n');
}

export async function saveMessage(
  role: 'user' | 'assistant',
  content: string,
  intent?: string
): Promise<void> {
  db.insert('conversation_context', {
    id: generateId(),
    role,
    content,
    intent: intent || null,
    timestamp: new Date().toISOString(),
  });
}

export async function clearOldContext(): Promise<void> {
  const cutoff = new Date(
    Date.now() - CONTEXT_TIMEOUT_HOURS * 60 * 60 * 1000
  ).toISOString();

  db.delete<ContextRow>('conversation_context', (r) => r.timestamp < cutoff);
}
