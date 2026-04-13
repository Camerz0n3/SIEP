import { db, generateId } from './database';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  notes?: string;
}

export async function findContact(name: string): Promise<Contact | null> {
  const query = name.toLowerCase();
  return db.findOne<Contact>('contacts', (c) => c.name.toLowerCase().includes(query)) || null;
}

export async function addContact(params: {
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  notes?: string;
}): Promise<Contact> {
  return db.insert('contacts', { id: generateId(), ...params });
}

export async function listContacts(): Promise<Contact[]> {
  return db.findAll<Contact>('contacts').sort((a, b) => a.name.localeCompare(b.name));
}
