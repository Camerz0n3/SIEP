import { Router, Request, Response } from 'express';
import { getEnv } from '../config/env';
import { sendMessage } from '../services/telegram';
import { parseIntent } from '../services/claude';
import { getConversationContext, saveMessage } from '../services/context';
import { routeIntent } from '../intents/router';
import { generateDailyBriefing } from '../briefing/daily';

export const telegramRouter = Router();

telegramRouter.post('/webhook/telegram', async (req: Request, res: Response) => {
  try {
    const env = getEnv();
    const message = req.body?.message;

    if (!message) {
      res.status(200).json({ ok: true });
      return;
    }

    const chatId = message.chat?.id?.toString();

    // Chat ID whitelist — only Cameron
    if (chatId !== env.TELEGRAM_CHAT_ID) {
      console.warn(`Message from unauthorized chat: ${chatId}`);
      res.status(200).json({ ok: true });
      return;
    }

    const messageText = message.text || '';

    // /start command — echoes chat ID for setup
    if (messageText === '/start') {
      await sendMessage(chatId, `Siep online, boss. Your chat ID is: \`${chatId}\``);
      res.status(200).json({ ok: true });
      return;
    }

    // /brief command — on-demand morning briefing
    if (messageText === '/brief' || messageText.toLowerCase() === 'brief me') {
      await sendMessage(chatId, 'Pulling your briefing now, one sec...');
      const briefing = await generateDailyBriefing();
      await sendMessage(chatId, briefing);
      res.status(200).json({ ok: true });
      return;
    }

    // Voice notes — not supported yet
    if (message.voice && !messageText.trim()) {
      await sendMessage(
        chatId,
        "Can't do voice notes yet boss — text me instead. Voice support coming soon."
      );
      res.status(200).json({ ok: true });
      return;
    }

    if (!messageText.trim()) {
      res.status(200).json({ ok: true });
      return;
    }

    // Save incoming message
    await saveMessage('user', messageText);

    // Get conversation context
    const context = await getConversationContext();

    // Parse intent
    const parsed = await parseIntent(messageText, context);

    // Handle multi-action intents (e.g. "add X at 9:30 and Y at 13:30")
    if (parsed.actions && parsed.actions.length > 1) {
      const results: string[] = [];
      for (const action of parsed.actions) {
        const actionIntent = { ...parsed, intent: action.intent, params: action.params };
        const result = await routeIntent(actionIntent);
        results.push(result);
      }
      const response = results.join('\n\n');
      await saveMessage('assistant', response, 'add_event');
      await sendMessage(chatId, response);
    } else {
      // Single action
      const response = await routeIntent(parsed);
      await saveMessage('assistant', response, parsed.intent);
      await sendMessage(chatId, response);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(200).json({ ok: true });

    // Try to send an error message
    try {
      const env = getEnv();
      await sendMessage(
        env.TELEGRAM_CHAT_ID,
        "Give me a sec boss, brain's a bit slow this morning. I'll get back to you."
      );
    } catch {
      // Swallow — don't fail the webhook
    }
  }
});
