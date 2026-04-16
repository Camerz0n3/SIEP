import { Router, Request, Response } from 'express';
import { getEnv } from '../config/env';
import { sendMessage } from '../services/telegram';
import { parseIntent } from '../services/claude';
import { getConversationContext, saveMessage } from '../services/context';
import { routeIntent } from '../intents/router';

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

    // /start command — echoes chat ID for setup
    const messageText = message.text || '';
    if (messageText === '/start') {
      await sendMessage(chatId, `Siep online, boss. Your chat ID is: \`${chatId}\``);
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

    // Route to handler
    const response = await routeIntent(parsed);

    // Save response
    await saveMessage('assistant', response, parsed.intent);

    // Send reply
    await sendMessage(chatId, response);

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
