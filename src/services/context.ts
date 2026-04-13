import { getDb, generateId } from './database';
import { CONTEXT_WINDOW_MESSAGES, CONTEXT_TIMEOUT_HOURS } from '../config/constants';

export async function getConversationContext(): Promise<string> {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - CONTEXT_TIMEOUT_HOURS * 60 * 60 * 1000
  ).toISOString();

  const rows = db
    .prepare(
      `SELECT role, content FROM conversation_context
       WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT ?`
    )
    .all(cutoff, CONTEXT_WINDOW_MESSAGES) as { role: string; content: string }[];

  if (rows.length === 0) return '';

  return rows
    .reverse()
    .map((msg) => `${msg.role === 'user' ? 'Cameron' : 'Siep'}: ${msg.content}`)
    .join('\n');
}

export async function saveMessage(
  role: 'user' | 'assistant',
  content: string,
  intent?: string
): Promise<void> {
  const db = getDb();
  db.prepare(
    `INSERT INTO conversation_context (id, role, content, intent) VALUES (?, ?, ?, ?)`
  ).run(generateId(), role, content, intent || null);
}

export async function clearOldContext(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - CONTEXT_TIMEOUT_HOURS * 60 * 60 * 1000
  ).toISOString();

  db.prepare(`DELETE FROM conversation_context WHERE timestamp < ?`).run(cutoff);
}
