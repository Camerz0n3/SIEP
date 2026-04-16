import { ParsedIntent, generateResponse } from '../services/claude';
import { scanAllEmails } from '../services/gmail';
import { db, generateId } from '../services/database';

interface DraftReply {
  id: string;
  email_id: string;
  email_from: string;
  email_subject: string;
  email_snippet: string;
  email_account: string;
  draft_body: string;
  status: string;
  created_at: string;
}

export async function handleEmailIntent(parsed: ParsedIntent): Promise<string> {
  switch (parsed.intent) {
    case 'check_emails': {
      const emails = await scanAllEmails(12);
      if (emails.length === 0) {
        return "Inbox is quiet — nothing important in the last 12 hours. Enjoy the peace.";
      }
      return await generateResponse(
        `Summarise these emails for Cameron. Group by account (personal/koja). Flag anything that needs action. Be concise — this is Telegram.\n\nEmails:\n${JSON.stringify(emails, null, 2)}`,
        ''
      );
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
      db.insert<DraftReply>('draft_replies', {
        id: generateId(),
        email_id: target.id,
        email_from: target.from,
        email_subject: target.subject,
        email_snippet: target.snippet,
        email_account: target.account,
        draft_body: draft,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      return `*Reply to ${target.from}:*\n_Re: ${target.subject}_\n\n${draft}\n\n👆 Say "send it" to approve, "make it shorter/more formal/etc" to revise, or "skip" to move on.`;
    }

    case 'send_reply': {
      const draft = db
        .findWhere<DraftReply>('draft_replies', (d) => d.status === 'pending')
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

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
      db.update<DraftReply>('draft_replies', (d) => d.id === draft.id, { status: 'sent' });
      return `Sent ✅ — reply fired off to ${draft.email_from}.`;
    }

    default:
      return parsed.response;
  }
}
