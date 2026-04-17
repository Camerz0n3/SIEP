# SIEP — Claude Code Instructions

## Project
Personal AI assistant for Cameron. Telegram bot + Express API + PixiJS dashboard.
Stack: TypeScript, Express 5, better-sqlite3, Groq (Llama 3.3), Google APIs, PixiJS, React + Vite.
Deployed on Railway. Dashboard at siep-production.up.railway.app.

## Honesty Rules — Read This First
- If a feature doesn't actually work end-to-end, say so. Don't describe it as "done" or "working" in commit messages, handovers, or READMEs if it's stubbed, hardcoded, or untested.
- If you write a UI that depends on backend logic that doesn't exist yet, flag it explicitly: "Note: this UI element won't work until X is implemented."
- If you're not sure something works, say "untested" rather than implying it's verified.
- Don't add features to the README that aren't actually wired up.
- When something breaks or a design choice has tradeoffs, explain the downside. Don't paper over it.

## Code Quality
- Run `npx tsc --noEmit` before considering backend changes done.
- Run `cd dashboard && npx eslint .` before considering frontend changes done.
- When adding a new feature, verify the full path: intent parser -> handler -> service -> API -> dashboard. Don't leave gaps.
- Preserve existing event/task durations when editing — don't reset to defaults.
- All date/time logic must use TZDate with Europe/Zurich. Never compare raw date strings against ISO timestamps.

## Security
- Never commit secrets, tokens, or API keys. Check before every commit.
- oauth-setup.ts is gitignored — don't re-add it.
- CORS is restricted to Railway domain + localhost. Don't widen to *.
- Auth is Bearer token only. No query-string auth.

## Style
- Backend: TypeScript strict, no `any` types.
- Frontend: React functional components, no class components.
- Commit messages: short, honest, describe what actually changed.
- Keep responses concise — Cameron reads on mobile.
