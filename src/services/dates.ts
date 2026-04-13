import { getDb, generateId } from './database';

export interface ImportantDate {
  id: string;
  title: string;
  person_name?: string;
  date_month: number;
  date_day: number;
  year?: number;
  category: string;
  reminder_days_before: number;
  notes?: string;
}

export async function addImportantDate(params: {
  title: string;
  person_name?: string;
  month: number;
  day: number;
  year?: number;
  category?: string;
}): Promise<ImportantDate> {
  const db = getDb();
  const id = generateId();

  db.prepare(
    `INSERT INTO important_dates (id, title, person_name, date_month, date_day, year, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, params.title, params.person_name || null, params.month, params.day, params.year || null, params.category || 'personal');

  return db.prepare(`SELECT * FROM important_dates WHERE id = ?`).get(id) as ImportantDate;
}

export async function getUpcomingDates(daysAhead: number = 7): Promise<ImportantDate[]> {
  const db = getDb();
  const dates: ImportantDate[] = [];
  const now = new Date();

  for (let i = 0; i <= daysAhead; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    const month = checkDate.getMonth() + 1;
    const day = checkDate.getDate();

    const rows = db
      .prepare(`SELECT * FROM important_dates WHERE date_month = ? AND date_day = ?`)
      .all(month, day) as ImportantDate[];

    dates.push(...rows);
  }

  return dates;
}

export async function getDatesByMonth(month: number): Promise<ImportantDate[]> {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM important_dates WHERE date_month = ? ORDER BY date_day ASC`)
    .all(month) as ImportantDate[];
}
