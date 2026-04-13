import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Store in a data directory (persists on Railway with a volume)
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, 'siep.db');
  _db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  _db.pragma('journal_mode = WAL');

  // Run migrations
  migrate(_db);

  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      due_time TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      reminder_sent INTEGER DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS important_dates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      person_name TEXT,
      date_month INTEGER NOT NULL,
      date_day INTEGER NOT NULL,
      year INTEGER,
      category TEXT DEFAULT 'personal',
      reminder_days_before INTEGER DEFAULT 3,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      relationship TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS local_directory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversation_context (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      intent TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS draft_replies (
      id TEXT PRIMARY KEY,
      email_id TEXT NOT NULL,
      email_from TEXT,
      email_subject TEXT,
      email_snippet TEXT,
      email_account TEXT,
      draft_body TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS briefing_log (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      data_snapshot TEXT,
      sent_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(status, reminder_sent, due_date);
    CREATE INDEX IF NOT EXISTS idx_context_timestamp ON conversation_context(timestamp);
    CREATE INDEX IF NOT EXISTS idx_drafts_status ON draft_replies(status);
    CREATE INDEX IF NOT EXISTS idx_dates_month_day ON important_dates(date_month, date_day);
  `);
}

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}
