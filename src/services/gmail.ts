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

interface EmailClassificationRow {
  email_id: string;
  needs_action: number;
}

export async function classifyEmails(emails: EmailSummary[]): Promise<EmailSummary[]> {
  if (emails.length === 0) return emails;

  const { db } = await import('./database');

  // Load cached classifications for this batch
  const cached = db.findWhere<EmailClassificationRow>(
    'email_classifications',
    (row) => emails.some((e) => e.id === row.email_id)
  );
  const cacheById = new Map(cached.map((c) => [c.email_id, c.needs_action === 1]));

  const uncached: EmailSummary[] = [];
  for (const email of emails) {
    const hit = cacheById.get(email.id);
    if (hit !== undefined) {
      email.needsAction = hit;
    } else {
      uncached.push(email);
    }
  }

  if (uncached.length === 0) return emails;

  // Classify only the uncached ones, using the cheaper/faster model
  // to conserve daily token budget on the main briefing model.
  try {
    const { generateResponse, GROQ_MODEL_FAST } = await import('./claude');
    const summaries = uncached
      .map((e, i) => `[${i}] From: ${e.from} | Subject: ${e.subject} | Snippet: ${e.snippet}`)
      .join('\n');
    const result = await generateResponse(
      `Classify which of these emails need Cameron's action (reply, decision, or follow-up). Return ONLY a JSON array of the index numbers that need action, e.g. [0, 3, 5]. If none need action, return []. Be selective — newsletters, notifications, and automated emails do NOT need action.\n\nEmails:\n${summaries}`,
      '',
      GROQ_MODEL_FAST
    );

    const match = result.match(/\[[\d,\s]*\]/);
    const flagged = new Set<number>();
    if (match) {
      const indices: number[] = JSON.parse(match[0]);
      for (const idx of indices) {
        if (idx >= 0 && idx < uncached.length) {
          uncached[idx].needsAction = true;
          flagged.add(idx);
        }
      }
    }

    // Cache all newly-classified emails (whether flagged or not).
    // Swallow PK collisions — a concurrent classifier may have inserted first.
    for (let i = 0; i < uncached.length; i++) {
      try {
        db.insert('email_classifications', {
          email_id: uncached[i].id,
          needs_action: flagged.has(i) ? 1 : 0,
          classified_at: new Date().toISOString(),
        });
      } catch {
        // already cached — nothing to do
      }
    }
  } catch (e) {
    console.error('Email classification failed (non-fatal):', e);
  }

  return emails;
}

export class GmailUnavailableError extends Error {
  constructor(public failures: { account: 'personal' | 'koja'; reason: string }[]) {
    const summary = failures
      .map((f) => `${f.account}: ${f.reason}`)
      .join('; ');
    super(`All configured Gmail accounts failed (${summary}). Most likely cause: expired refresh token — re-run the OAuth flow and update Railway env.`);
    this.name = 'GmailUnavailableError';
  }
}

export async function scanAllEmails(
  hoursBack: number = 24
): Promise<EmailSummary[]> {
  const env = getEnv();
  const results: EmailSummary[] = [];
  const failures: { account: 'personal' | 'koja'; reason: string }[] = [];
  let attempted = 0;

  attempted++;
  try {
    const personal = await scanEmails('personal', hoursBack);
    results.push(...personal);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error('Failed to scan personal Gmail:', e);
    failures.push({ account: 'personal', reason });
  }

  if (env.GOOGLE_KOJA_REFRESH_TOKEN) {
    attempted++;
    try {
      const koja = await scanEmails('koja', hoursBack);
      results.push(...koja);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error('Failed to scan Koja Gmail:', e);
      failures.push({ account: 'koja', reason });
    }
  }

  // If every attempted account failed, surface the error instead of silently
  // returning an empty list. Partial failures (one account working) keep
  // returning what we have so a temporary issue doesn't blank the dashboard.
  if (failures.length === attempted) {
    throw new GmailUnavailableError(failures);
  }

  return classifyEmails(results);
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
