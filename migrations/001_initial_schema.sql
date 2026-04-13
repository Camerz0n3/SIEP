-- Siep Database Schema
-- Run this in Supabase SQL Editor

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  due_time TIME,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'work', 'personal', 'koja')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Important dates
CREATE TABLE IF NOT EXISTS important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  person_name TEXT,
  date_month INT NOT NULL,
  date_day INT NOT NULL,
  year INT,
  category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'work', 'family')),
  reminder_days_before INT DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Local directory
CREATE TABLE IF NOT EXISTS local_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation context
CREATE TABLE IF NOT EXISTS conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Draft replies
CREATE TABLE IF NOT EXISTS draft_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  email_from TEXT,
  email_subject TEXT,
  email_snippet TEXT,
  email_account TEXT CHECK (email_account IN ('personal', 'koja')),
  draft_body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Briefing log
CREATE TABLE IF NOT EXISTS briefing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  content TEXT NOT NULL,
  data_snapshot TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(status, reminder_sent, due_date);
CREATE INDEX IF NOT EXISTS idx_context_timestamp ON conversation_context(timestamp);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON draft_replies(status);
CREATE INDEX IF NOT EXISTS idx_dates_month_day ON important_dates(date_month, date_day);
