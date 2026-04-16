# S.I.E.P — Super Intelligent Executive Partner

A personal AI assistant that manages calendar, email, tasks, and daily briefings through a Telegram bot, backed by a gamified pixel-art dashboard.

**Live:** [siep-production.up.railway.app](https://siep-production.up.railway.app)
**Bot:** [@Siep_pa_bot](https://t.me/Siep_pa_bot) on Telegram

---

## What It Does

Talk to Siep on Telegram like you'd talk to a PA. He parses your intent, hits the right API, and responds in character.

```
You:  "Add rugby training Wednesday 19:30 at Vollèges, recurring until August"
Siep: Done — Rugby Training added:
      Wednesday 22 Apr, 19:30-21:00 at Vollèges
      That look right?

You:  "What's on this week?"
Siep: Busy one, boss. Here's the rundown:
      Thursday 16 Apr:
        10:30-12:30 — Driving lesson at Martigny
      Sunday 19 Apr:
        10:30-12:00 — Rugby Training at Vollèges
      ...

You:  /brief
Siep: [Full morning briefing — schedule, tasks, emails, weather, upcoming dates]
```

### Features

- **Calendar** — CRUD via Google Calendar API. Recurring events (RRULE). Multi-event parsing (describe several events in one message, they're created separately). Confirmation with exact details after creation.
- **Email** — Scans Gmail (personal + work accounts), summarises and flags items needing action.
- **Morning Briefing** — Auto-generated daily at 7:30 AM via GitHub Actions cron. Combines schedule, tasks, emails, weather, upcoming dates. On-demand via `/brief`.
- **Weekly Wrap-up** — Sunday evening summary of the week + preview of next week.
- **Task Tracking** — Create, list, complete tasks with due dates and priorities. Reminder checks every 15 minutes.
- **Weather** — Verbier conditions via Open-Meteo (free, no key).
- **Important Dates** — 31 seeded celebrations (UK + Swiss holidays, personal birthdays/anniversaries). Surfaced in briefings when upcoming.
- **Contacts** — 905 contacts loaded from VCF. Contact lookup for context.

---

## Architecture

```
Telegram ──webhook──> Express ──intent parser──> Groq (Llama 3.3 70B)
                        │                              │
                        │                        ParsedIntent
                        │                              │
                        ▼                              ▼
                   Route to handler ◄──────────── Intent Router
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
         Google     Google     SQLite      Open-Meteo
        Calendar    Gmail      (local)      Weather
              │         │         │            │
              └─────────┼─────────┘            │
                        ▼                      │
                   Format response ◄───────────┘
                        │
                        ▼
                 Telegram Bot API
                   (send reply)
```

### Intent Flow

1. Message arrives at `/webhook/telegram`
2. Whitelist check (chat ID)
3. Message + conversation context sent to Groq for intent parsing
4. Intent router dispatches to handler (calendar, task, email, weather, date, etc.)
5. Handler calls external API, formats result
6. Response sent back via Telegram Bot API

Multi-action messages (e.g. "add X at 9:30 and Y at 13:30") return an `actions[]` array — each action is routed independently.

### Dashboard

A React + PixiJS frontend served from the same Express server. Isometric pixel-art mansion with animated characters, room-based navigation, and live data polling.

- **20 AI-generated sprites** — characters, backdrop, room-specific poses
- **19 animations** — idle bobs, cigarette smoke, speech bubbles, fountain, fireplace
- **5 rooms** — Office (calendar), Board Room (events), Tasks, Mail, Reading Room (briefings)
- **Comms panel** — chat with Siep from the dashboard
- **Mobile responsive** — bottom tab bar, PixiJS hidden on small screens
- **PWA installable** — manifest + Apple meta tags

---

## Tech Stack

### Backend
| Tech | Purpose |
|------|---------|
| TypeScript + Express 5 | API server |
| Groq SDK (Llama 3.3 70B) | Intent parsing + response generation |
| Google APIs (OAuth2) | Calendar CRUD, Gmail scanning |
| better-sqlite3 | Local database (WAL mode) |
| date-fns + @date-fns/tz | Timezone-safe date handling (Europe/Zurich) |
| zod | Environment variable validation |

### Frontend
| Tech | Purpose |
|------|---------|
| React 19 + Vite | SPA framework |
| PixiJS 8 | Isometric mansion scene + sprite animations |
| Zustand | State management |
| CSS Modules | Scoped styling with time-of-day palette shifts |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Railway | Hosting (Express + static dashboard) |
| GitHub Actions | Scheduled crons (briefing, wrapup, reminders) |
| Telegram Bot API | Primary chat interface (zero dependencies, native fetch) |

---

## Project Structure

```
├── src/
│   ├── index.ts                 # Express server, routes, middleware
│   ├── config/
│   │   ├── env.ts               # Zod-validated environment schema
│   │   └── constants.ts         # Timezone, defaults, limits
│   ├── services/
│   │   ├── telegram.ts          # Bot API: sendMessage, splitMessage, registerWebhook
│   │   ├── claude.ts            # Groq LLM: parseIntent, generateResponse (3x retry)
│   │   ├── calendar.ts          # Google Calendar: CRUD, recurring events, search
│   │   ├── gmail.ts             # Gmail scanning (personal + work accounts)
│   │   ├── database.ts          # SQLite wrapper (drop-in replacement for JSON files)
│   │   ├── tasks.ts             # Task CRUD, reminders, overdue detection
│   │   ├── dates.ts             # Important dates: upcoming, by month
│   │   ├── weather.ts           # Open-Meteo API for Verbier
│   │   └── context.ts           # Conversation context window
│   ├── webhook/
│   │   └── telegram.ts          # Webhook handler: /start, /brief, intent pipeline
│   ├── intents/
│   │   ├── router.ts            # Intent dispatcher
│   │   ├── calendar.handler.ts  # Calendar operations
│   │   ├── task.handler.ts      # Task operations
│   │   ├── email.handler.ts     # Email summarisation
│   │   ├── date.handler.ts      # Important dates
│   │   ├── weather.handler.ts   # Weather lookup
│   │   └── relay.handler.ts     # Message relay (deprecated)
│   ├── briefing/
│   │   ├── daily.ts             # Morning briefing generator
│   │   └── weekly.ts            # Weekly wrap-up generator
│   └── cron/
│       └── reminders.ts         # Due task reminder checker
├── dashboard/
│   ├── src/
│   │   ├── pixi/                # PixiJS mansion scene, characters, animations
│   │   ├── components/          # TopBar, LeftPanel, CommsPanel, NotificationStack
│   │   ├── rooms/               # Office, Calendar, Tasks, Emails, Briefings
│   │   ├── hooks/               # useApi, useAutoRefresh, useTimeOfDay
│   │   ├── audio/               # Web Audio API synthesised SFX
│   │   └── store.ts             # Zustand state
│   └── public/assets/sprites/   # 21 AI-generated PNGs
├── migrations/
│   ├── 001_initial_schema_sqlite.sql
│   └── 002_celebrations_sqlite.sql    # 31 seeded dates
└── .github/workflows/
    └── crons.yml                # Scheduled briefing, wrapup, reminders
```

---

## API Endpoints

All `/api/*` and `/cron/*` routes are protected by bearer token auth when `API_SECRET` is set.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check (public) |
| POST | `/webhook/telegram` | Telegram webhook (public) |
| POST | `/api/chat` | Chat with Siep |
| GET | `/api/tasks` | List pending tasks |
| GET | `/api/tasks/overdue` | List overdue tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id/complete` | Complete task |
| GET | `/api/calendar/today` | Today's events |
| GET | `/api/calendar/week` | This week's events |
| POST | `/api/calendar/create` | Create event (supports recurrence) |
| DELETE | `/api/calendar/:id` | Delete event |
| GET | `/api/emails` | Last 24h emails |
| GET | `/api/briefings` | Last 10 briefings |
| GET | `/api/weather` | Verbier weather |
| GET | `/api/dates` | All important dates |
| GET | `/api/dates/upcoming?days=N` | Upcoming dates |
| POST | `/api/contacts/bulk` | Bulk insert contacts |
| POST | `/cron/daily-briefing` | Trigger morning briefing |
| POST | `/cron/weekly-wrapup` | Trigger weekly summary |
| POST | `/cron/check-reminders` | Check and send due reminders |

---

## Setup

### Prerequisites
- Node.js 22+
- Google Cloud project with Calendar + Gmail APIs enabled
- Telegram bot token (from @BotFather)
- Groq API key (free tier)

### Environment Variables
```bash
# Telegram
TELEGRAM_BOT_TOKEN=         # From @BotFather
TELEGRAM_CHAT_ID=           # Your numeric chat ID

# Google OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_PERSONAL_REFRESH_TOKEN=
GOOGLE_KOJA_REFRESH_TOKEN=  # Optional: work email

# LLM
GROQ_API_KEY=               # Free at console.groq.com

# App
API_SECRET=                 # Optional: protects API routes
NODE_ENV=production
PORT=3000
TIMEZONE=Europe/Zurich
```

### Run Locally
```bash
npm install
npm run dev                  # Backend on :3000

cd dashboard
npm install
npm run dev                  # Dashboard on :5173 (proxies API)
```

### Deploy
```bash
git push origin main         # Railway auto-deploys from GitHub
```

---

## Design Decisions

**Telegram over WhatsApp** — Twilio's WhatsApp sandbox expires every 72 hours. Telegram Bot API is free, permanent, and uses the same Markdown formatting. Zero npm dependencies — native `fetch` only.

**Groq over OpenAI** — Free tier with Llama 3.3 70B. Fast inference. Trade-off: less reliable than Claude/GPT on complex parsing, mitigated with retry logic and structured prompts.

**SQLite over Postgres** — Single-file database, zero config, WAL mode for concurrent reads. Migrations run idempotently on startup. Trade-off: resets on Railway redeploy without persistent volumes ($5/month upgrade).

**PixiJS over CSS** — The dashboard is deliberately over-the-top. It's a pixel-art mansion with animated characters, not a productivity SaaS. The aesthetic is the point — it makes the PA feel like a companion, not a tool.

**Intent parsing over function calling** — The LLM receives a structured prompt with parameter schemas and returns JSON. Multi-action messages return an `actions[]` array. Each action is routed independently. Confirmation is shown after every calendar mutation.

---

## What's Next

- Persistent storage (Railway volumes or external DB)
- Voice note transcription (Whisper)
- Smarter recurring event handling via chat
- Dashboard: contacts page, task/event creation forms
- Multi-user architecture

---

*Built with Claude Code + a lot of late nights in Verbier.*
