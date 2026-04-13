import { Router, Request, Response } from 'express';
import { getEnv } from '../config/env';
import { validateTwilioSignature, sendWhatsApp } from '../services/twilio';
import { parseIntent } from '../services/claude';
import { getConversationContext, saveMessage } from '../services/context';
import { routeIntent } from '../intents/router';

export const whatsappRouter = Router();

whatsappRouter.post('/webhook/whatsapp', async (req: Request, res: Response) => {
  try {
    const env = getEnv();

    // Validate Twilio signature in production
    if (env.NODE_ENV === 'production') {
      const signature = req.headers['x-twilio-signature'] as string;
      // Use x-forwarded-proto and host headers for correct URL behind Railway's proxy
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const url = `${protocol}://${host}${req.originalUrl}`;

      if (!signature || !validateTwilioSignature(url, req.body, signature)) {
        console.warn(`Invalid Twilio signature — rejecting (url: ${url})`);
        res.status(403).send('Forbidden');
        return;
      }
    }

    // Phone number whitelist
    const from = req.body.From;
    if (from !== env.CAMERON_PHONE_NUMBER) {
      console.warn(`Message from unauthorized number: ${from}`);
      res.status(200).send('<Response></Response>');
      return;
    }

    let messageText = req.body.Body || '';
    const numMedia = parseInt(req.body.NumMedia || '0', 10);

    // Voice notes — not supported yet, tell Cameron
    if (numMedia > 0 && !messageText.trim()) {
      const mediaType = req.body.MediaContentType0 || '';
      if (mediaType.startsWith('audio/')) {
        await sendWhatsApp(
          env.CAMERON_PHONE_NUMBER,
          "Can't do voice notes yet boss — text me instead. Voice support coming soon."
        );
        res.status(200).send('<Response></Response>');
        return;
      }
    }

    if (!messageText.trim()) {
      res.status(200).send('<Response></Response>');
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
    await sendWhatsApp(env.CAMERON_PHONE_NUMBER, response);

    // Respond to Twilio (empty TwiML — we send the reply separately)
    res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('<Response></Response>');

    // Try to send an error message
    try {
      const env = getEnv();
      await sendWhatsApp(
        env.CAMERON_PHONE_NUMBER,
        "Give me a sec boss, brain's a bit slow this morning. I'll get back to you."
      );
    } catch {
      // Swallow — don't fail the webhook
    }
  }
});
