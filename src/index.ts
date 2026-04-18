import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { getEnv } from './config/env';
import { telegramRouter } from './webhook/telegram';
import { generateDailyBriefing } from './briefing/daily';
import { generateWeeklyWrapUp } from './briefing/weekly';
import { checkReminders } from './cron/reminders';
import { sendMessage, registerWebhook } from './services/telegram';
import { clearOldContext } from './services/context';

const app = express();

// CORS for dashboard
const ALLOWED_ORIGINS = [
  'https://siep-production.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Parse JSON bodies (API + dashboard + Telegram webhook)
app.use(express.json());

// API auth middleware — protects /api/* and /cron/* routes
// Public routes: /health, /webhook/telegram, static dashboard files
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const env = getEnv();
  if (!env.API_SECRET) { next(); return; } // No secret set = open (dev mode)

  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (token === env.API_SECRET) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'siep', timestamp: new Date().toISOString() });
});

// Telegram webhook (public — Telegram needs to reach it)
app.use(telegramRouter);

// === Cron endpoints (protected) ===

app.post('/cron/daily-briefing', requireAuth, async (_req, res) => {
  try {
    const env = getEnv();
    const briefing = await generateDailyBriefing();
    await sendMessage(env.TELEGRAM_CHAT_ID, briefing);
    res.json({ status: 'sent' });
  } catch (error) {
    console.error('Daily briefing error:', error);
    res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

app.post('/cron/weekly-wrapup', requireAuth, async (_req, res) => {
  try {
    const env = getEnv();
    const wrapup = await generateWeeklyWrapUp();
    await sendMessage(env.TELEGRAM_CHAT_ID, wrapup);
    res.json({ status: 'sent' });
  } catch (error) {
    console.error('Weekly wrap-up error:', error);
    res.status(500).json({ error: 'Failed to generate wrap-up' });
  }
});

app.post('/cron/check-reminders', requireAuth, async (_req, res) => {
  try {
    const sent = await checkReminders();
    await clearOldContext();
    res.json({ status: 'ok', reminders_sent: sent });
  } catch (error) {
    console.error('Reminder check error:', error);
    res.status(500).json({ error: 'Failed to check reminders' });
  }
});

// === Protected API routes ===
// All /api/* routes require auth when API_SECRET is set
app.use('/api', requireAuth);

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
    const tasks = await listTasks({ includeCompleted: true });
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

// Direct calendar event creation (bypasses LLM)
app.post('/api/calendar/create', async (req, res) => {
  try {
    const { createEvent } = await import('./services/calendar');
    const event = await createEvent(req.body);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Delete calendar event by ID
app.delete('/api/calendar/:id', async (req, res) => {
  try {
    const { deleteEvent } = await import('./services/calendar');
    await deleteEvent(req.params.id);
    res.json({ deleted: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Important dates
app.get('/api/dates', async (_req, res) => {
  try {
    const { getAllDates } = await import('./services/dates');
    const dates = await getAllDates();
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

app.get('/api/dates/upcoming', async (req, res) => {
  try {
    const { getUpcomingDates } = await import('./services/dates');
    const days = parseInt(req.query.days as string) || 30;
    const dates = await getUpcomingDates(days);
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming dates' });
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
  console.log(`   Webhook: POST http://localhost:${port}/webhook/telegram\n`);

  // Register Telegram webhook in production
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.WEBHOOK_DOMAIN;
  if (domain) {
    registerWebhook(`https://${domain}/webhook/telegram`)
      .catch(err => console.error('Failed to register Telegram webhook:', err));
  } else if (process.env.NODE_ENV === 'production') {
    // Fallback: use known Railway URL
    registerWebhook('https://siep-production.up.railway.app/webhook/telegram')
      .catch(err => console.error('Failed to register Telegram webhook:', err));
  }
});
