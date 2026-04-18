-- Cache for email importance classifications.
-- Avoids re-calling Groq for the same email on every dashboard refresh.
CREATE TABLE IF NOT EXISTS email_classifications (
  email_id TEXT PRIMARY KEY,
  needs_action INTEGER NOT NULL DEFAULT 0,
  classified_at TEXT DEFAULT (datetime('now'))
);
