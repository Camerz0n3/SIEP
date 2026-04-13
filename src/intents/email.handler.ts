import { ParsedIntent, generateResponse } from '../services/claude';
import { scanAllEmails } from '../services/gmail';
import { getDb, generateId } from '../services/database';

export async function handleEmailIntent(
  parsed: ParsedIntent
): Promise<string> {
  switch (parsed.intent) {
    case 'check_emails': {
      const emails = await scanAllEmails(12);

      if (emails.length === 0) {
        return "Inbox is quiet — nothing important in the last 12 hours. Enjoy the peace.";
      }

      const summary = await generateResponse(
        `Summarise these emails for Cameron. Group by account (personal/koja). Flag anything that needs action. Be concise — this is WhatsApp.\n\nEmails:\n${JSON.stringify(emails, null, 2)}`,
        ''
      );

      return summary;
    }

    case 'draft_reply': {
      const p = parsed.params as Record<string, string | undefined>;
      const emails = await scanAllEmails(24);
      const target = emails.find(
        (e) =>
          e.from.toLowerCase().includes((p.from || '').toLowerCase()) ||
          e.subject.toLowerCase().includes((p.subject || '').toLowerCase())
      );

      if (!target) {
        return "Couldn't find that email. Can you tell me who it's from or what the subject is?";
      }

      const draft = await generateResponse(
        `Draft a professional reply to this email for Cameron. Tone: professional, natural British English. Keep it concise.\n\nFrom: ${target.from}\nSubject: ${target.subject}\nSnippet: ${target.snippet}`,
        ''
      );

      const db = getDb();
      db.prepare(
        `INSERT INTO draft_replies (id, email_id, email_from, email_subject, email_snippet, email_account, draft_body)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(generateId(), target.id, target.from, target.subject, target.snippet, target.account, draft);

      return `*Reply to ${target.from}:*\n_Re: ${target.subject}_\n\n${draft}\n\n👆 Say "send it" to approve, "make it shorter/more formal/etc" to revise, or "skip" to move on.`;
    }

    case 'send_reply': {
      const db = getDb();
      const draft = db
        .prepare(`SELECT * FROM draft_replies WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1`)
        .get() as { id: string; email_account: string; email_from: string; email_subject: string; draft_body: string } | undefined;

      if (!draft) {
        return "No drafts waiting for approval. Want me to check your emails?";
      }

      const { sendEmail } = await import('../services/gmail');
      await sendEmail(
        draft.email_account as 'personal' | 'koja',
        draft.email_from,
        `Re: ${draft.email_subject}`,
        draft.draft_body
      );

      db.prepare(`UPDATE draft_replies SET status = 'sent' WHERE id = ?`).run(draft.id);

      return `Sent ✅ — reply fired off to ${draft.email_from}.`;
    }

    default:
      return parsed.response;
  }
}
