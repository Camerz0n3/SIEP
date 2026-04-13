import { getDb, generateId } from './database';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  notes?: string;
}

export async function findContact(name: string): Promise<Contact | null> {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM contacts WHERE name LIKE ? LIMIT 1`)
    .get(`%${name}%`) as Contact | undefined;

  return row || null;
}

export async function addContact(params: {
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  notes?: string;
}): Promise<Contact> {
  const db = getDb();
  const id = generateId();

  db.prepare(
    `INSERT INTO contacts (id, name, phone, email, relationship, notes) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, params.name, params.phone || null, params.email || null, params.relationship || null, params.notes || null);

  return db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(id) as Contact;
}

export async function listContacts(): Promise<Contact[]> {
  const db = getDb();
  return db.prepare(`SELECT * FROM contacts ORDER BY name ASC`).all() as Contact[];
}
