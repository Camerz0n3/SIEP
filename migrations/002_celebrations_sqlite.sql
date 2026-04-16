-- Expand important_dates category to include 'celebration'
-- SQLite can't ALTER CHECK constraints, so recreate the table

CREATE TABLE IF NOT EXISTS important_dates_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  person_name TEXT,
  date_month INTEGER NOT NULL,
  date_day INTEGER NOT NULL,
  year INTEGER,
  category TEXT DEFAULT 'personal' CHECK (category IN ('personal', 'work', 'family', 'celebration')),
  reminder_days_before INTEGER DEFAULT 3,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO important_dates_new SELECT * FROM important_dates;
DROP TABLE IF EXISTS important_dates;
ALTER TABLE important_dates_new RENAME TO important_dates;
CREATE INDEX IF NOT EXISTS idx_dates_month_day ON important_dates(date_month, date_day);
CREATE INDEX IF NOT EXISTS idx_dates_category ON important_dates(category);

-- =============================================
-- UK CELEBRATIONS (Fixed dates — year NULL = every year)
-- =============================================

INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('uk-new-years-day',    'New Year''s Day',    NULL, 1,  1,  NULL, 'celebration', 1, 'UK public holiday'),
  ('uk-burns-night',      'Burns Night',        NULL, 1,  25, NULL, 'celebration', 3, 'Scottish celebration — haggis, whisky, poetry'),
  ('uk-valentines-day',   'Valentine''s Day',   NULL, 2,  14, NULL, 'celebration', 7, 'Don''t forget Lola'),
  ('uk-st-patricks-day',  'St Patrick''s Day',  NULL, 3,  17, NULL, 'celebration', 3, 'Irish celebration'),
  ('uk-bonfire-night',    'Bonfire Night',       NULL, 11, 5,  NULL, 'celebration', 3, 'Guy Fawkes — fireworks night'),
  ('uk-remembrance-day',  'Remembrance Day',     NULL, 11, 11, NULL, 'celebration', 3, 'Lest we forget — poppies, 11am silence'),
  ('uk-christmas-day',    'Christmas Day',       NULL, 12, 25, NULL, 'celebration', 14, 'UK public holiday — plan gifts early'),
  ('uk-boxing-day',       'Boxing Day',          NULL, 12, 26, NULL, 'celebration', 1, 'UK public holiday'),
  ('uk-new-years-eve',    'New Year''s Eve',     NULL, 12, 31, NULL, 'celebration', 7, 'Plan the party');

-- =============================================
-- UK CELEBRATIONS (Variable dates — stored per year)
-- =============================================

-- 2026: Easter Sunday = April 5
INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('uk-mothering-sun-2026',  'Mothering Sunday',  NULL, 3,  15, 2026, 'celebration', 7, 'UK Mother''s Day — 3 weeks before Easter'),
  ('uk-good-friday-2026',    'Good Friday',       NULL, 4,  3,  2026, 'celebration', 3, 'UK public holiday'),
  ('uk-easter-sunday-2026',  'Easter Sunday',     NULL, 4,  5,  2026, 'celebration', 7, 'Easter eggs'),
  ('uk-easter-monday-2026',  'Easter Monday',     NULL, 4,  6,  2026, 'celebration', 1, 'UK + Valais public holiday'),
  ('uk-fathers-day-2026',    'Father''s Day',     NULL, 6,  21, 2026, 'celebration', 7, '3rd Sunday of June');

-- 2027: Easter Sunday = March 28
INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('uk-mothering-sun-2027',  'Mothering Sunday',  NULL, 3,  7,  2027, 'celebration', 7, 'UK Mother''s Day — 3 weeks before Easter'),
  ('uk-good-friday-2027',    'Good Friday',       NULL, 3,  26, 2027, 'celebration', 3, 'UK public holiday'),
  ('uk-easter-sunday-2027',  'Easter Sunday',     NULL, 3,  28, 2027, 'celebration', 7, 'Easter eggs'),
  ('uk-easter-monday-2027',  'Easter Monday',     NULL, 3,  29, 2027, 'celebration', 1, 'UK + Valais public holiday'),
  ('uk-fathers-day-2027',    'Father''s Day',     NULL, 6,  20, 2027, 'celebration', 7, '3rd Sunday of June');

-- =============================================
-- SWISS CELEBRATIONS (Fixed dates)
-- =============================================

INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('ch-national-day',      'Swiss National Day',   NULL, 8,  1,  NULL, 'celebration', 3, 'Public holiday — fireworks, bonfires, Verbier celebrations'),
  ('ch-fete-musique',      'Fête de la Musique',   NULL, 6,  21, NULL, 'celebration', 7, 'Free concerts across Switzerland');

-- =============================================
-- SWISS CELEBRATIONS (Variable dates — Valais public holidays)
-- =============================================

-- 2026: Ascension = May 14 (Easter+39), Whit Monday = May 25 (Easter+50)
-- Easter Monday 2026 already covered in UK section (noted as UK + Valais)
INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('ch-ascension-2026',      'Ascension Day',    NULL, 5,  14, 2026, 'celebration', 3, 'Valais public holiday — long weekend potential'),
  ('ch-whit-monday-2026',    'Whit Monday',      NULL, 5,  25, 2026, 'celebration', 3, 'Valais public holiday');

-- 2027: Ascension = May 6, Whit Monday = May 17
-- Easter Monday 2027 already covered in UK section (noted as UK + Valais)
INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('ch-ascension-2027',      'Ascension Day',    NULL, 5,  6,  2027, 'celebration', 3, 'Valais public holiday — long weekend potential'),
  ('ch-whit-monday-2027',    'Whit Monday',      NULL, 5,  17, 2027, 'celebration', 3, 'Valais public holiday');

-- =============================================
-- PERSONAL DATES (recurring every year)
-- =============================================

INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category, reminder_days_before, notes) VALUES
  ('personal-cameron-bday',    'Cameron''s Birthday',         'Cameron', 9, 8,  NULL, 'personal', 7,  'The boss''s birthday'),
  ('personal-moray-bday',      'Moray''s Birthday',           'Moray',   7, 9,  NULL, 'family',   7,  'Cameron''s brother'),
  ('personal-lola-bday',       'Lola''s Birthday',            'Lola',    7, 14, NULL, 'personal', 14, 'Don''t forget — plan something special'),
  ('personal-mum-bday',        'Mum''s Birthday',             NULL,      3, 22, NULL, 'family',   7,  'Cameron''s mother'),
  ('personal-dad-bday',        'Dad''s Birthday',             NULL,      2, 3,  NULL, 'family',   7,  'Cameron''s father'),
  ('personal-anniversary',     'Cameron & Lola Anniversary',  'Lola',    7, 7,  NULL, 'personal', 14, 'Dating anniversary — make it count');
