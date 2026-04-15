import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// SQLite database — persists to DATA_DIR/siep.db
// Drop-in replacement for the old JSON file database — same synchronous API

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'siep.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Run migrations on startup
function migrate(): void {
  const applied = new Set<string>();
  try {
    const rows = sqlite.prepare('SELECT name FROM _migrations').all() as { name: string }[];
    for (const r of rows) applied.add(r.name);
  } catch {
    // _migrations table doesn't exist yet — first run
  }

  const migrationDir = path.join(__dirname, '../../migrations');
  if (!fs.existsSync(migrationDir)) return;

  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith('_sqlite.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
    sqlite.exec(sql);
    sqlite.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
  }
}

migrate();

export function generateId(): string {
  return crypto.randomUUID();
}

// Convert JS values to SQLite-compatible values
function toSqlValue(val: unknown): unknown {
  if (val === true) return 1;
  if (val === false) return 0;
  if (val === undefined) return null;
  return val;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const db = {
  findAll<T = any>(table: string): T[] {
    return sqlite.prepare(`SELECT * FROM "${table}"`).all() as T[];
  },

  findWhere<T = any>(table: string, predicate: (item: T) => boolean): T[] {
    return this.findAll<T>(table).filter(predicate);
  },

  findOne<T = any>(table: string, predicate: (item: T) => boolean): T | undefined {
    return this.findAll<T>(table).find(predicate);
  },

  insert<T = any>(table: string, item: T): T {
    const obj = item as Record<string, unknown>;
    const keys = Object.keys(obj);
    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => toSqlValue(obj[k]));
    sqlite.prepare(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`).run(...values);
    return item;
  },

  update<T = any>(
    table: string,
    predicate: (item: T) => boolean,
    updates: Partial<T>
  ): T | undefined {
    const rows = this.findAll<T>(table);
    const target = rows.find(predicate);
    if (!target) return undefined;

    const id = (target as Record<string, unknown>).id;
    const updateObj = updates as Record<string, unknown>;
    const setClauses = Object.keys(updateObj).map(k => `"${k}" = ?`).join(', ');
    const values = Object.keys(updateObj).map(k => toSqlValue(updateObj[k]));
    sqlite.prepare(`UPDATE "${table}" SET ${setClauses} WHERE id = ?`).run(...values, id);
    return { ...target, ...updates };
  },

  delete<T = any>(table: string, predicate: (item: T) => boolean): number {
    const rows = this.findAll<T>(table);
    const toDelete = rows.filter(predicate);
    if (toDelete.length === 0) return 0;

    const ids = toDelete.map(r => (r as Record<string, unknown>).id);
    const placeholders = ids.map(() => '?').join(', ');
    sqlite.prepare(`DELETE FROM "${table}" WHERE id IN (${placeholders})`).run(...ids);
    return toDelete.length;
  },
};
