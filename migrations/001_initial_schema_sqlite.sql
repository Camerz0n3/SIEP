-- Siep Database Schema (SQLite)

-- Migration tracking
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT DEFAULT (datetime('now'))
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  due_time TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'work', 'personal', 'koja')),
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  reminder_sent INTEGER DEFAULT 0,
  notes TEXT
);

-- Important dates
CREATE TABLE IF NOT EXISTS important_dates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  person_name TEXT,
  date_month INTEGER NOT NULL,
  date_day INTEGER NOT NULL,
  year INTEGER,
  category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'work', 'family')),
  reminder_days_before INTEGER DEFAULT 3,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Local directory
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

-- Conversation context
CREATE TABLE IF NOT EXISTS conversation_context (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Draft replies
CREATE TABLE IF NOT EXISTS draft_replies (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL,
  email_from TEXT,
  email_subject TEXT,
  email_snippet TEXT,
  email_account TEXT CHECK (email_account IN ('personal', 'koja')),
  draft_body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'skipped')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Briefing log
CREATE TABLE IF NOT EXISTS briefing_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  content TEXT NOT NULL,
  data_snapshot TEXT,
  sent_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(status, reminder_sent, due_date);
CREATE INDEX IF NOT EXISTS idx_context_timestamp ON conversation_context(timestamp);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON draft_replies(status);
CREATE INDEX IF NOT EXISTS idx_dates_month_day ON important_dates(date_month, date_day);
