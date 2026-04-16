import { db, generateId } from './database';

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
  const date: ImportantDate = {
    id: generateId(),
    title: params.title,
    person_name: params.person_name,
    date_month: params.month,
    date_day: params.day,
    year: params.year,
    category: params.category || 'personal',
    reminder_days_before: 3,
  };

  return db.insert('important_dates', date);
}

export async function getUpcomingDates(daysAhead: number = 7): Promise<ImportantDate[]> {
  const dates: ImportantDate[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  for (let i = 0; i <= daysAhead; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    const month = checkDate.getMonth() + 1;
    const day = checkDate.getDate();

    const rows = db.findWhere<ImportantDate>(
      'important_dates',
      (d) => d.date_month === month && d.date_day === day &&
        (d.year == null || d.year === currentYear)
    );
    dates.push(...rows);
  }

  return dates;
}

export async function getAllDates(): Promise<ImportantDate[]> {
  return db.findAll<ImportantDate>('important_dates');
}

export async function getDatesByMonth(month: number): Promise<ImportantDate[]> {
  return db
    .findWhere<ImportantDate>('important_dates', (d) => d.date_month === month)
    .sort((a, b) => a.date_day - b.date_day);
}
