# S.I.E.P — Handover Document
## What's Been Built & What's Next

---

## STATUS: BUILT (Phases 1-5)

### Backend (Node.js + TypeScript + Express)
All core services are implemented and compile clean:

| Service | File | Status |
|---------|------|--------|
| Express server + health check | `src/index.ts` | ✅ Built |
| Env validation (Zod) | `src/config/env.ts` | ✅ Built |
| Constants | `src/config/constants.ts` | ✅ Built |
| WhatsApp webhook (Twilio) | `src/webhook/whatsapp.ts` | ✅ Built |
| Claude intent parsing | `src/services/claude.ts` | ✅ Built |
| Voice note transcription (Whisper) | `src/services/whisper.ts` | ✅ Built |
| Google Calendar CRUD | `src/services/calendar.ts` | ✅ Built |
| Gmail scanning + sending | `src/services/gmail.ts` | ✅ Built |
| Task management (Supabase) | `src/services/tasks.ts` | ✅ Built |
| Important dates | `src/services/dates.ts` | ✅ Built |
| Contacts (message relay) | `src/services/contacts.ts` | ✅ Built |
| Weather (Open-Meteo) | `src/services/weather.ts` | ✅ Built |
| Conversation context | `src/services/context.ts` | ✅ Built |
| Twilio send + SMS relay | `src/services/twilio.ts` | ✅ Built |
| Daily briefing generator | `src/briefing/daily.ts` | ✅ Built |
| Weekly wrap-up generator | `src/briefing/weekly.ts` | ✅ Built |
| Reminder polling | `src/cron/reminders.ts` | ✅ Built |
| Intent router | `src/intents/router.ts` | ✅ Built |
| Calendar intent handler | `src/intents/calendar.handler.ts` | ✅ Built |
| Task intent handler | `src/intents/task.handler.ts` | ✅ Built |
| Email intent handler | `src/intents/email.handler.ts` | ✅ Built |
| Relay intent handler | `src/intents/relay.handler.ts` | ✅ Built |
| Weather intent handler | `src/intents/weather.handler.ts` | ✅ Built |
| Date intent handler | `src/intents/date.handler.ts` | ✅ Built |
| Supabase SQL migration | `migrations/001_initial_schema.sql` | ✅ Built |

### Dashboard (React + Vite PWA)
Pixel Mafia Boss themed dashboard — dark theme, Press Start 2P font, CRT scanlines, pixel borders.

| Page | File | Features |
|------|------|----------|
| HQ (Home) | `dashboard/src/pages/HQ.tsx` | Stats, weather, today's events, active tasks |
| Calendar | `dashboard/src/pages/Calendar.tsx` | Today/week view toggle |
| Tasks | `dashboard/src/pages/Tasks.tsx` | All/today/overdue filters, complete tasks |
| Emails | `dashboard/src/pages/Emails.tsx` | Last 24h emails from both accounts |
| Briefings | `dashboard/src/pages/Briefings.tsx` | Past briefings (daily + weekly) |

### API Endpoints
The Express server exposes these REST endpoints for the dashboard:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/webhook/whatsapp` | POST | Twilio webhook |
| `/cron/daily-briefing` | POST | Trigger daily briefing |
| `/cron/weekly-wrapup` | POST | Trigger weekly wrap-up |
| `/cron/check-reminders` | POST | Check + send due reminders |
| `/api/tasks` | GET | List pending tasks |
| `/api/tasks` | POST | Create a task |
| `/api/tasks/overdue` | GET | List overdue tasks |
| `/api/tasks/:id/complete` | PATCH | Mark task complete |
| `/api/calendar/today` | GET | Today's events |
| `/api/calendar/week` | GET | This week's events |
| `/api/emails` | GET | Scan last 24h emails |
| `/api/briefings` | GET | Last 10 briefings |
| `/api/weather` | GET | Current Verbier weather |

---

## SETUP GUIDE — Getting Siep Live

### Step 1: Supabase
1. Go to [supabase.com](https://supabase.com), create a new project (name: "siep")
2. Go to **SQL Editor** and paste the contents of `migrations/001_initial_schema.sql`, then run it
3. Go to **Settings > API** and copy:
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Anthropic (Claude API)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key → `ANTHROPIC_API_KEY`
3. Ensure you have credits loaded (Siep uses claude-sonnet-4-20250514)

### Step 3: OpenAI (Whisper)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key → `OPENAI_API_KEY`
3. This is only used for voice note transcription

### Step 4: Twilio (WhatsApp)
1. Go to [twilio.com](https://twilio.com), create an account
2. **For testing:** Go to **Messaging > Try it out > Send a WhatsApp message** — follow the sandbox setup
3. **For production:** Buy a phone number and apply for WhatsApp Business API
4. Copy your Account SID → `TWILIO_ACCOUNT_SID`
5. Copy your Auth Token → `TWILIO_AUTH_TOKEN`
6. Your WhatsApp number (with prefix) → `TWILIO_WHATSAPP_NUMBER` (e.g., `whatsapp:+14155238886`)
7. Your personal WhatsApp number → `CAMERON_PHONE_NUMBER` (e.g., `whatsapp:+41791234567`)
8. Set the webhook URL to `https://your-railway-url/webhook/whatsapp`

### Step 5: Google APIs (Calendar + Gmail)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (name: "Siep")
3. Enable: **Google Calendar API** and **Gmail API**
4. Go to **Credentials > Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Desktop app**
   - Download the JSON
5. Copy Client ID → `GOOGLE_CLIENT_ID`
6. Copy Client Secret → `GOOGLE_CLIENT_SECRET`
7. **Get refresh tokens:** You'll need to run a one-time OAuth consent flow. Create a small script:

```javascript
// oauth-setup.js — run this locally with: node oauth-setup.js
const { google } = require('googleapis');
const readline = require('readline');

const oauth2 = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],
});

console.log('Open this URL in your browser:\n', url);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('\nPaste the authorization code: ', async (code) => {
  const { tokens } = await oauth2.getToken(code);
  console.log('\nRefresh token:', tokens.refresh_token);
  console.log('\nSave this as GOOGLE_PERSONAL_REFRESH_TOKEN (or GOOGLE_KOJA_REFRESH_TOKEN)');
  rl.close();
});
```

8. Run this for your personal Gmail → `GOOGLE_PERSONAL_REFRESH_TOKEN`
9. Run this again for your Koja Gmail → `GOOGLE_KOJA_REFRESH_TOKEN`

### Step 6: Create .env file
```bash
cp .env.example .env
# Fill in all the values from steps 1-5
```

### Step 7: Test Locally
```bash
# Start the backend
npm run dev

# In another terminal, start the dashboard dev server
cd dashboard && npm run dev
```

- Backend: http://localhost:3000/health
- Dashboard: http://localhost:5173

### Step 8: Deploy to Railway
1. Go to [railway.app](https://railway.app), create a new project
2. Connect your GitHub repo (or deploy from CLI)
3. Add all environment variables from your `.env` file
4. Railway will auto-detect the `railway.toml` config
5. The build command handles both backend + dashboard compilation
6. Cron jobs are configured in `railway.toml`

---

## WHAT'S LEFT TO BUILD (Phases 6-8)

### Phase 6: Polish & Hardening
- [ ] Retry logic with exponential backoff on all API calls (Claude, Gmail, Twilio)
- [ ] Rate limiting on webhook endpoint
- [ ] Structured logging (consider pino or winston)
- [ ] Error alerting (if something critical fails, Siep tells Cameron)
- [ ] Supabase RLS policies (currently using service role key which bypasses RLS)

### Phase 7: Dashboard Enhancements
- [ ] PWA manifest + service worker (for "install as app" on phone)
- [ ] Add task creation form in dashboard
- [ ] Add calendar event creation in dashboard
- [ ] Add contacts management page
- [ ] Add local directory management page (Verbier restaurants/services)
- [ ] Real-time updates (polling or WebSocket)
- [ ] Authentication on dashboard (currently open — add a simple PIN or password)

### Phase 8: Advanced Features
- [ ] Booking assistance (local directory lookup, Google Places API)
- [ ] Proactive intelligence ("You haven't replied to X in 3 days")
- [ ] Expense tracking (receipt scanning)
- [ ] Travel mode (detect location, adjust weather/local info)
- [ ] Voice replies via TTS
- [ ] WhatsApp relay (instead of SMS, for contacts who opt in)

---

## Architecture Notes

### How Intent Parsing Works
1. Cameron sends a WhatsApp message (text or voice note)
2. Voice notes → OpenAI Whisper → transcribed text
3. Text + last 20 messages of context → Claude API
4. Claude returns structured JSON: `{ intent, params, response }`
5. Intent router dispatches to the correct handler
6. Handler executes the action (Calendar/Tasks/Email/etc.)
7. Siep's response is sent back via Twilio WhatsApp API

### Security Model
- Twilio webhook signature validation (production only)
- Phone number whitelist — only Cameron's number is processed
- All secrets in environment variables
- Supabase service role key (full access) — RLS policies should be added for production

### Timezone Handling
- All database timestamps: UTC
- All display/parsing: Europe/Zurich (CET/CEST)
- Uses `@date-fns/tz` with `TZDate` for timezone-aware dates
- Railway cron is UTC — the briefing cron (`50 4 * * *`) fires at ~06:50 CET summer / ~05:50 CET winter

### Conversation Context
- Last 20 messages stored in Supabase `conversation_context` table
- Auto-cleared after 4 hours of inactivity
- Enables follow-up messages: "Move it to 8pm" (Siep knows "it" = the dinner just discussed)

---

## File Tree

```
S.I.E.P/
├── src/
│   ├── index.ts                       # Express server + all API routes
│   ├── config/
│   │   ├── env.ts                     # Zod-validated environment variables
│   │   └── constants.ts               # Timezone, coordinates, model config
│   ├── webhook/
│   │   └── whatsapp.ts                # Twilio webhook handler
│   ├── services/
│   │   ├── claude.ts                  # Intent parsing + response generation
│   │   ├── whisper.ts                 # Voice note transcription
│   │   ├── calendar.ts                # Google Calendar CRUD
│   │   ├── gmail.ts                   # Gmail scanning + sending
│   │   ├── tasks.ts                   # Supabase task CRUD
│   │   ├── dates.ts                   # Important dates management
│   │   ├── contacts.ts                # Contact lookup for relay
│   │   ├── weather.ts                 # Open-Meteo weather
│   │   ├── twilio.ts                  # WhatsApp/SMS sending
│   │   ├── context.ts                 # Conversation context
│   │   └── supabase.ts                # Supabase client
│   ├── briefing/
│   │   ├── daily.ts                   # Morning briefing generator
│   │   └── weekly.ts                  # Sunday wrap-up generator
│   ├── cron/
│   │   └── reminders.ts               # Reminder polling
│   └── intents/
│       ├── router.ts                  # Intent → handler routing
│       ├── calendar.handler.ts        # Calendar actions
│       ├── task.handler.ts            # Task actions
│       ├── email.handler.ts           # Email actions
│       ├── relay.handler.ts           # Message relay
│       ├── weather.handler.ts         # Weather lookup
│       └── date.handler.ts            # Important dates
├── dashboard/
│   ├── src/
│   │   ├── App.tsx                    # Router + sidebar layout
│   │   ├── index.css                  # Pixel Mafia Boss theme
│   │   ├── hooks/useApi.ts            # Data fetching hook
│   │   └── pages/
│   │       ├── HQ.tsx                 # Home — stats, weather, events, tasks
│   │       ├── Calendar.tsx           # Today/week calendar view
│   │       ├── Tasks.tsx              # Task list with filters
│   │       ├── Emails.tsx             # Email scanner
│   │       └── Briefings.tsx          # Past briefings
│   └── vite.config.ts
├── migrations/
│   └── 001_initial_schema.sql         # All Supabase tables + indexes
├── .env.example
├── railway.toml
├── package.json
└── tsconfig.json
```

---

*Ready to deploy. Set up the API keys, run the migration, and Siep is live.* 🤵
