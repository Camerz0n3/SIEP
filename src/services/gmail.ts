import { google } from 'googleapis';
import { getEnv } from '../config/env';

function getAuth(account: 'personal' | 'koja') {
  const env = getEnv();
  const oauth2 = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET
  );
  const token =
    account === 'personal'
      ? env.GOOGLE_PERSONAL_REFRESH_TOKEN
      : env.GOOGLE_KOJA_REFRESH_TOKEN;
  oauth2.setCredentials({ refresh_token: token });
  return oauth2;
}

function getGmail(account: 'personal' | 'koja') {
  return google.gmail({ version: 'v1', auth: getAuth(account) });
}

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  account: 'personal' | 'koja';
  needsAction: boolean;
}

export async function scanEmails(
  account: 'personal' | 'koja',
  hoursBack: number = 24
): Promise<EmailSummary[]> {
  const gmail = getGmail(account);
  const after = Math.floor(Date.now() / 1000 - hoursBack * 3600);

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `after:${after} -category:promotions -category:social`,
    maxResults: 20,
  });

  if (!res.data.messages) return [];

  const emails: EmailSummary[] = [];

  for (const msg of res.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });

    const headers = detail.data.payload?.headers || [];
    const from =
      headers.find((h) => h.name === 'From')?.value || 'Unknown';
    const subject =
      headers.find((h) => h.name === 'Subject')?.value || 'No subject';
    const date = headers.find((h) => h.name === 'Date')?.value || '';

    emails.push({
      id: msg.id!,
      from,
      subject,
      snippet: detail.data.snippet || '',
      date,
      account,
      needsAction: false, // Will be classified by Claude
    });
  }

  return emails;
}

export async function scanAllEmails(
  hoursBack: number = 24
): Promise<EmailSummary[]> {
  const env = getEnv();
  const results: EmailSummary[] = [];

  try {
    const personal = await scanEmails('personal', hoursBack);
    results.push(...personal);
  } catch (e) {
    console.error('Failed to scan personal Gmail:', e);
  }

  if (env.GOOGLE_KOJA_REFRESH_TOKEN) {
    try {
      const koja = await scanEmails('koja', hoursBack);
      results.push(...koja);
    } catch (e) {
      console.error('Failed to scan Koja Gmail:', e);
    }
  }

  return results;
}

export async function sendEmail(
  account: 'personal' | 'koja',
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const gmail = getGmail(account);

  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
}
