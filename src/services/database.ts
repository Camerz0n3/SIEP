import fs from 'fs';
import path from 'path';

// Simple JSON file-based database — no native dependencies
// Each table is a JSON array stored in a separate file

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function getFilePath(table: string): string {
  ensureDir();
  return path.join(dataDir, `${table}.json`);
}

function readTable<T>(table: string): T[] {
  const fp = getFilePath(table);
  if (!fs.existsSync(fp)) return [];
  const raw = fs.readFileSync(fp, 'utf-8');
  return JSON.parse(raw) as T[];
}

function writeTable<T>(table: string, data: T[]): void {
  const fp = getFilePath(table);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Generic CRUD operations
/* eslint-disable @typescript-eslint/no-explicit-any */
export const db = {
  findAll<T = any>(table: string): T[] {
    return readTable<T>(table);
  },

  findWhere<T = any>(table: string, predicate: (item: T) => boolean): T[] {
    return readTable<T>(table).filter(predicate);
  },

  findOne<T = any>(table: string, predicate: (item: T) => boolean): T | undefined {
    return readTable<T>(table).find(predicate);
  },

  insert<T = any>(table: string, item: T): T {
    const rows = readTable<T>(table);
    rows.push(item);
    writeTable(table, rows);
    return item;
  },

  update<T = any>(
    table: string,
    predicate: (item: T) => boolean,
    updates: Partial<T>
  ): T | undefined {
    const rows = readTable<T>(table);
    const idx = rows.findIndex(predicate);
    if (idx === -1) return undefined;
    rows[idx] = { ...rows[idx], ...updates };
    writeTable(table, rows);
    return rows[idx];
  },

  delete<T = any>(table: string, predicate: (item: T) => boolean): number {
    const rows = readTable<T>(table);
    const filtered = rows.filter((item) => !predicate(item));
    const deleted = rows.length - filtered.length;
    writeTable(table, filtered);
    return deleted;
  },
};
