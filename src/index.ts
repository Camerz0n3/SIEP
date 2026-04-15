import express, { Request, Response } from 'express';
import path from 'path';
import { getEnv } from './config/env';
import { whatsappRouter } from './webhook/whatsapp';
import { generateDailyBriefing } from './briefing/daily';
import { generateWeeklyWrapUp } from './briefing/weekly';
import { checkReminders } from './cron/reminders';
import { sendWhatsApp } from './services/twilio';
import { clearOldContext } from './services/context';

const app = express();

// CORS for dashboard (allow any origin in dev, restrict in prod later)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Parse URL-encoded bodies (Twilio webhooks)
app.use(express.urlencoded({ extended: false }));
// Parse JSON bodies (API + dashboard)
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'siep', timestamp: new Date().toISOString() });
});

// WhatsApp webhook
app.use(whatsappRouter);

// === Cron endpoints (called by Railway cron or internal scheduler) ===

app.post('/cron/daily-briefing', async (_req, res) => {
  try {
    const env = getEnv();
    const briefing = await generateDailyBriefing();
    await sendWhatsApp(env.CAMERON_PHONE_NUMBER, briefing);
    res.json({ status: 'sent' });
  } catch (error) {
    console.error('Daily briefing error:', error);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

app.post('/cron/weekly-wrapup', async (_req, res) => {
  try {
    const env = getEnv();
    const wrapup = await generateWeeklyWrapUp();
    await sendWhatsApp(env.CAMERON_PHONE_NUMBER, wrapup);
    res.json({ status: 'sent' });
  } catch (error) {
    console.error('Weekly wrap-up error:', error);
    res.status(500).json({ error: 'Failed to generate wrap-up' });
  }
});

app.post('/cron/check-reminders', async (_req, res) => {
  try {
    const sent = await checkReminders();
    await clearOldContext();
    res.json({ status: 'ok', reminders_sent: sent });
  } catch (error) {
    console.error('Reminder check error:', error);
    res.status(500).json({ error: 'Failed to check reminders' });
  }
});

// === Chat endpoint (dashboard comms panel) ===

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const { parseIntent } = await import('./services/claude');
    const { getConversationContext, saveMessage } = await import('./services/context');
    const { routeIntent } = await import('./intents/router');

    await saveMessage('user', message);
    const context = await getConversationContext();
    const parsed = await parseIntent(message, context);
    const response = await routeIntent(parsed);
    await saveMessage('assistant', response, parsed.intent);

    res.json({ response, intent: parsed.intent, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Hit a snag boss. Try again in a sec.' });
  }
});

// === Dashboard API endpoints ===

app.get('/api/tasks', async (_req, res) => {
  try {
    const { listTasks } = await import('./services/tasks');
    const tasks = await listTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.get('/api/tasks/overdue', async (_req, res) => {
  try {
    const { getOverdueTasks } = await import('./services/tasks');
    const tasks = await getOverdueTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { createTask } = await import('./services/tasks');
    const task = await createTask(req.body);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const { db } = await import('./services/database');
    const updated = db.update<any>('tasks', (t: any) => t.id === req.params.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

app.get('/api/calendar/today', async (_req, res) => {
  try {
    const { queryEvents } = await import('./services/calendar');
    const events = await queryEvents({ range: 'today' });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

app.get('/api/calendar/week', async (_req, res) => {
  try {
    const { queryEvents } = await import('./services/calendar');
    const events = await queryEvents({ range: 'week' });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

app.get('/api/emails', async (_req, res) => {
  try {
    const { scanAllEmails } = await import('./services/gmail');
    const emails = await scanAllEmails(24);
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

app.get('/api/briefings', async (_req, res) => {
  try {
    const { db } = await import('./services/database');
    const briefings = db.findAll<{ sent_at: string }>('briefing_log')
      .sort((a, b) => b.sent_at.localeCompare(a.sent_at))
      .slice(0, 10);
    res.json(briefings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch briefings' });
  }
});

app.get('/api/weather', async (_req, res) => {
  try {
    const { getWeather } = await import('./services/weather');
    const weather = await getWeather();
    res.json(weather);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// Bulk seed contacts
app.post('/api/contacts/bulk', async (req, res) => {
  try {
    const { db, generateId } = await import('./services/database');
    const contacts = req.body.contacts as { name: string; phone?: string; email?: string }[];
    let count = 0;
    for (const c of contacts) {
      db.insert('contacts', { id: generateId(), name: c.name, phone: c.phone || null, email: c.email || null });
      count++;
    }
    res.json({ inserted: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed contacts' });
  }
});

// Serve dashboard static files
app.use(express.static(path.join(__dirname, '../dashboard/dist')));

// SPA fallback — serve dashboard for any non-API route
app.get('/{*path}', (_req, res) => {
  const dashboardPath = path.join(__dirname, '../dashboard/dist/index.html');
  res.sendFile(dashboardPath, (err) => {
    if (err) {
      res.json({ status: 'ok', service: 'siep', note: 'Dashboard not built yet. Run: cd dashboard && npm run build' });
    }
  });
});

// Start server
const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, () => {
  console.log(`\n🤵 Siep is online — port ${port}`);
  console.log(`   Health: http://localhost:${port}/health`);
  console.log(`   Dashboard: http://localhost:${port}/`);
  console.log(`   Webhook: POST http://localhost:${port}/webhook/whatsapp\n`);
});
