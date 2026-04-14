# S.I.E.P MANSION DASHBOARD — Handover V3
## Session Date: 14 April 2026
## Status: PHASES 1-8 COMPLETE — SPRITES WIRED, ANIMATIONS LIVE, DEPLOYED

---

## WHAT WAS BUILT THIS SESSION

### Sprite Integration (Priority 1 from V2)
- **20 AI-generated PNG sprites** wired into PixiJS scene replacing all programmatic pixel art
- **Black background removal pipeline** in `characters.ts` — processes each PNG at load time (threshold 4, auto-trim)
- **Two-layer backdrop**: `background.png` (full estate with grounds, car, trees, city) + `mansion.png` (interior detail overlay at 85% opacity)
- **Percentage-based character positioning** — characters placed as % of backdrop image (not isometric grid), stays aligned regardless of scaling

### Character Sprites (all in `dashboard/public/assets/sprites/`)
| File | Character | Source |
|------|-----------|--------|
| `cameron.png` | Cameron standing | Copilot |
| `cameron-sitting.png` | Cameron in boss chair (DEFAULT) | Meta AI |
| `lola.png` | Lola seated, red dress (Monday) | Copilot |
| `lola-tue.png` | Lola black dress | Copilot |
| `lola-wed.png` | Lola white dress | Copilot |
| `lola-thu.png` | Lola burgundy dress | Copilot |
| `lola-fri.png` | Lola gold dress | Copilot |
| `lola-sat.png` | Lola blue dress | Copilot |
| `lola-sun.png` | Lola evening gown | Copilot |
| `lola-standing.png` | Lola standing (hug animation) | Meta AI |
| `siep.png` | Siep idle | Copilot |
| `siep-walk-right.png` | Siep 4-frame walk cycle | Copilot |
| `siep-office.png` | Siep holding clipboard | Meta AI |
| `siep-board.png` | Siep holding pointer | Meta AI |
| `siep-cork.png` | Siep holding duster | Meta AI |
| `siep-mail.png` | Siep holding mail tray | Meta AI |
| `siep-reading.png` | Siep holding newspaper | Meta AI |
| `guard.png` | Two guards (cropped to one) | Copilot |
| `guard-left.png` | Guard looking left | Meta AI |
| `mansion.png` | Isometric mansion interior | Copilot |
| `background.png` | Full estate aerial view | Copilot |

### Character Positions (percentage of backdrop image)
| Character | X% | Y% | Notes |
|-----------|-----|-----|-------|
| Cameron | 44% | 30% | Boss chair behind desk in board room |
| Lola | 42% | 35% | Desk edge, in front of Cameron |
| Siep | 50% | 50% | Center hallway, checkered floor |
| Guard 1 | 42% | 82% | Left of entrance |
| Guard 2 | 48% | 82% | Right of entrance |

### Animations (19 total)
| Animation | Character | Type | Trigger |
|-----------|-----------|------|---------|
| Idle bob | All | Sine wave position | Always |
| Seated sway | Lola | Gentle position oscillation | Always |
| Leg dangle | Lola | Sprite rotation | Always |
| Cigarette drags | Lola | Smoke particles, 2s puff | Every 8-15s |
| Phone check | Lola | Sprite tilt | Every 12-25s |
| Hair fix | Lola | Sprite tilt (opposite) | Every 12-25s |
| Blow kiss | Lola | Heart particles float up | Click on Lola |
| Hug walk | Lola | Stands, walks to Cameron, hearts, walks back | Every 4-6 min |
| 7-day wardrobe | Lola | Different dress per day of week | On load |
| Cigar smoke | Cameron | Constant particle emitter | Always |
| Cigar tip glow | Cameron | Pulsing orange overlay | Always |
| LED chest pulse | Siep | Pulsing blue overlay | Always |
| Room poses | Siep | Clipboard/pointer/duster/mail/newspaper | On room arrival |
| Speech bubbles | Siep | Text above head, click to dismiss | Notifications + greeting |
| Stumble | Siep | Rotation wobble on arrival | 1-in-30 chance |
| Guard sway | Guards | Subtle lean/shift | Always |
| Guard head turn | Guard 1 | Swap to left-looking sprite | Every 8-15s |
| Fountain | Environment | Water droplets rise/fall | Always |
| Fireplace | Environment | Orange flicker particles | Always (Reading Room) |

### Phase 5: Notifications
- `Notification` type in `types.ts` — `email | task | event | briefing | system`
- Zustand store: `addNotification()`, `dismissNotification()`, `clearNotifications()`
- `useNotifications` hook — watches API data, detects new emails/tasks/events/briefings
- `NotificationStack` component — toast stack top-right, type-colored borders, 6s auto-dismiss, click to navigate
- PixiJS: room border pulse glow + Siep speech bubble on notifications

### Phase 6: Audio
- Pure Web Audio API engine (`src/audio/engine.ts`) — zero dependencies
- 8 synthesized SFX: notification chime, typewriter ding, cash register, door swoosh, click, footstep, send/receive message
- Wired into store: room enter/exit → door, task complete → cash register, comms → send/receive
- Ambient background ticks
- Mute toggle (🔊/🔇) in TopBar, persists to localStorage

### Phase 7: Mobile + PWA
- Responsive at 768px: PixiJS hidden, vertical room cards, compact top bar
- Fixed bottom tab bar: HQ, BOARD, TASKS, MAIL, NEWS
- Left panel + comms panel hidden on mobile
- PWA manifest (`public/manifest.json`) + Apple meta tags
- Installable on iOS (Add to Home Screen) and Android

### Backend Changes
- `POST /api/chat` endpoint — processes messages through intent router, returns JSON
- CORS middleware for dashboard access
- All deployed to Railway via `git push`

---

## CURRENT STATE

### What Works
| Feature | Status |
|---------|--------|
| Full AI-generated pixel art estate with 20 sprites | ✅ |
| Two-layer backdrop (estate + mansion interior) | ✅ |
| Percentage-based character positioning | ✅ |
| 19 character/environment animations | ✅ |
| 7-day Lola wardrobe rotation | ✅ |
| Siep room-specific poses (5 rooms) | ✅ |
| Notification toasts + room glow + speech bubbles | ✅ |
| Synthesized audio SFX + mute toggle | ✅ |
| Mobile responsive + bottom tab bar | ✅ |
| PWA installable | ✅ |
| 5 room views with live API data (60s polling) | ✅ |
| Comms panel (chat with Siep) | ✅ |
| Time-of-day palette shifts | ✅ |
| Production build passes clean | ✅ |
| Deployed on Railway | ✅ |

### Known Issues / Needs Attention
1. **Character holes** — Threshold at 4, might still have minor artifacts on JPEG-sourced sprites. If still visible, try threshold 2 or use PNG source images instead of JPEG
2. **Cameron position** — May need fine-tuning (currently 44%, 30%). User wants him exactly in the boss chair behind the desk
3. **Siep walk animation disabled** — Walk frame cycling was causing visual glitches. Currently slides smoothly instead. Walk sprite sheet exists (`siep-walk-right.png`) but needs better frame alignment to re-enable
4. **Siep pathfinding uses old grid system** — `walkSiepTo()` still uses isometric grid coordinates + `WALK_PATHS`. Works for movement but path doesn't align with backdrop rooms. Could be reworked to use percentage waypoints
5. **Room click areas use old grid** — `drawRooms()` creates invisible hit areas at grid coordinates. Room clicking still works but click regions don't perfectly match visual rooms in backdrop
6. **Comms panel** — `/api/chat` endpoint deployed but may show "can't reach server" if Railway hasn't processed the latest deploy
7. **Weather API** — Returns 500 on Railway (server-side config, not dashboard code)
8. **Room glow outlines disabled** — Were misaligned with backdrop. Could be re-implemented using percentage-based coordinates

---

## FILE STRUCTURE

```
dashboard/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── favicon.svg
│   └── assets/sprites/            # 21 AI-generated PNGs
│       ├── cameron.png, cameron-sitting.png
│       ├── lola.png, lola-tue/wed/thu/fri/sat/sun.png, lola-standing.png
│       ├── siep.png, siep-walk-right.png, siep-office/board/cork/mail/reading.png
│       ├── guard.png, guard-left.png
│       ├── mansion.png, background.png
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # Layout + MobileTabBar + NotificationStack
│   ├── types.ts                   # Task, Email, CalendarEvent, Briefing, Notification, etc.
│   ├── store.ts                   # Zustand — rooms, comms, notifications + audio triggers
│   ├── audio/
│   │   └── engine.ts              # Web Audio API synth SFX + ambient + mute
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── useAutoRefresh.ts      # 60s polling
│   │   ├── useTimeOfDay.ts
│   │   └── useNotifications.ts    # Watches data, fires notifications on changes
│   ├── pixi/
│   │   ├── characters.ts          # PNG loading, black removal, wardrobe, room poses, walk frames
│   │   ├── MansionScene.ts        # Main scene: backdrop, characters, animations, particles
│   │   ├── spriteGen.ts           # Legacy pixel grid renderer (still used by furniture)
│   │   ├── iso.ts                 # Isometric helpers (toIso, TILE_W, TILE_H)
│   │   ├── colors.ts              # Colour palette
│   │   ├── textures.ts            # Floor/wall textures (legacy, not rendered)
│   │   └── furniture.ts           # Furniture sprites (legacy, not rendered)
│   ├── components/
│   │   ├── TopBar.tsx + .module.css
│   │   ├── LeftPanel.tsx + .module.css
│   │   ├── MansionOverview.tsx + .module.css
│   │   ├── MansionCanvas.tsx + .module.css
│   │   ├── CommsPanel.tsx + .module.css
│   │   ├── RoomHeader.tsx + .module.css
│   │   └── NotificationStack.tsx + .module.css
│   ├── rooms/
│   │   ├── Office.tsx, Calendar.tsx, Tasks.tsx, Emails.tsx, Briefings.tsx
│   └── styles/
│       ├── global.css              # Design system + time-of-day palette
│       └── App.module.css          # Layout grids + mobile responsive
```

---

## HOW TO RUN

```bash
# Dev (proxies API to Railway)
cd dashboard && npm run dev

# Build
cd dashboard && npm run build

# Live URL
https://siep-production.up.railway.app
```

---

## KEY ARCHITECTURE DECISIONS

### Percentage-Based Positioning
Characters are placed as `(pctX, pctY)` of the backdrop image, not isometric grid coords. This was changed mid-session because the AI-generated backdrop images don't align with the original isometric grid. The `placeChar()` and `pctToPos()` methods handle conversion.

### Black Background Removal
All AI-generated sprites have solid black backgrounds. `processSprite()` in `characters.ts` removes pixels with R+G+B < threshold (currently 4) and auto-trims to tight bounding box. JPEG-sourced sprites (from Meta AI, saved as `.png.jpeg`) have compression artifacts that require a low threshold.

### Two Backdrop Layers
1. `background.png` — full estate aerial (grounds, car, trees, fountain, city skyline)
2. `mansion.png` — interior rooms detail overlay at 85% opacity
Both are positioned relative to the isometric grid center and scaled to cover ~18-22 tiles.

### Siep Walk System
`walkSiepTo(roomId)` uses grid-based pathfinding (`WALK_PATHS`) that doesn't match the backdrop. Walk frame animation is disabled (was causing visual glitches). Siep slides smoothly between positions. To fix: convert `WALK_PATHS` to percentage-based waypoints.

---

## WHAT TO DO NEXT

### Immediate Fixes
1. Fine-tune Cameron's position if not perfectly in the chair (adjust the 0.44, 0.30 values)
2. If character holes persist, lower threshold to 2 in `characters.ts`
3. Re-enable Siep walk frames with better frame consistency

### Future Enhancements
1. **Rework room click areas** to use percentage-based hit regions matching the backdrop
2. **Re-enable room glow outlines** using percentage coordinates
3. **Convert Siep pathfinding** from grid to percentage waypoints
4. **Add more animations**: cat wandering garden, helicopter flyover, car arrival for events
5. **Real audio files** — replace synthesized SFX with proper sound effects + jazz background loop
6. **WebAuthn** — biometric login with gate opening animation
7. **Service worker** — offline caching for true PWA experience

---

## PROMPTS FOR GENERATING MORE SPRITES

### Sitting Cameron (already done, for reference)
> Same pixel art character — young man, dark brown hair, black suit, red tie, gold watch, cigar. SITTING in leather office chair, leaning back slightly, confident boss pose. Solid black background, clean pixel edges.

### Guard Looking Right (not yet generated)
> Same bodyguard — black suit, sunglasses, earpiece, arms crossed. HEAD TURNED TO THE RIGHT. Solid black background, pixel art.

### Pixel Cat (for garden animation)
> Pixel art small cat sprite, 32-bit retro style. Orange tabby cat, sitting or walking. About 15 pixels tall. Solid black background, clean pixel edges.

---

*The mansion is deployed and running at https://siep-production.up.railway.app. 20 sprites loaded, 19 animations running, notifications + audio + mobile all working. Main remaining work is fine-tuning character positions and converting the grid-based systems (pathfinding, room clicks) to percentage-based coordinates that match the AI-generated backdrop.*
