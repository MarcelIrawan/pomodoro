# Pomodoro App — Requirements

## Assumptions (Explicit)

- **Platform**: Web-first (desktop + mobile browsers), no native wrapper at launch
- **Auth**: Optional anonymous mode + email/password accounts (no OAuth at v1)
- **Data persistence**: Local-first (IndexedDB) with optional cloud sync for logged-in users
- **Target users**: Knowledge workers, students, freelancers — anyone doing focused work blocks
- **Session model**: Classic 25/5 Pomodoro, but fully configurable per user
- **Tone**: Playful, encouraging, not corporate — micro-animations, sound cues, streak celebrations
- **Offline**: Fully functional offline; sync when online
- **Deployment**: Static SPA on Cloudflare Pages (like BagiRataAI), no backend at v1

---

## Functional Requirements

### Core Timer
| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | Start/pause/resume/skip/reset a Pomodoro session | Must |
| F2 | Configurable work duration (default 25 min), short break (5 min), long break (15 min) | Must |
| F3 | Auto-switch between work → short break → work → long break (every 4 cycles) | Must |
| F4 | Visual countdown (circular progress ring + digital) | Must |
| F5 | Audible tick (optional) + distinct completion sounds for work/break | Must |
| F6 | Keyboard shortcuts: Space (start/pause), R (reset), S (skip) | Should |
| F7 | "Focus mode" — hides UI chrome, shows only timer + minimal controls | Could |

### Session Tracking & History
| ID | Requirement | Priority |
|----|-------------|----------|
| F8 | Log each completed work session (duration, timestamp, tags/notes) | Must |
| F9 | Daily/weekly/monthly stats: total focus time, sessions completed, streak | Must |
| F10 | Tag sessions (e.g., "coding", "reading", "admin") with custom colors | Should |
| F11 | Export history as CSV/JSON | Could |

### Gamification / Delight
| ID | Requirement | Priority |
|----|-------------|----------|
| F12 | Streak counter (consecutive days with ≥1 session) | Must |
| F13 | Unlockable themes/characters at milestones (7-day, 30-day, 100 sessions) | Should |
| F14 | Confetti/particle burst on session complete | Should |
| F15 | Gentle nudge notification if timer idle > 10 min during work block | Could |

### Settings & Personalization
| ID | Requirement | Priority |
|----|-------------|----------|
| F16 | Light/dark/system theme + 3+ accent color palettes | Must |
| F17 | Sound volume + custom sound pack selection | Must |
| F18 | Auto-start breaks / auto-start work (toggle each) | Should |
| F19 | Daily focus goal (minutes) with progress ring on home screen | Should |
| F20 | Data export / import / clear all data | Must |

### Account & Sync (v1.1+)
| ID | Requirement | Priority |
|----|-------------|----------|
| F21 | Email/password signup + magic link login | Won't (v1) |
| F22 | Cloud backup/restore of history + settings | Won't (v1) |
| F23 | Multi-device sync | Won't (v1) |

---

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Initial load (cold) | < 2s on 3G, < 1s on broadband |
| | Timer tick precision | ±50ms drift over 25 min |
| | Bundle size (gzipped) | < 100 KB JS + CSS |
| **Reliability** | Timer survives tab background/foreground | Yes (Page Visibility API) |
| | Timer survives browser close/reopen | Yes (persist state to IndexedDB every 10s) |
| | Data loss on crash | Zero (IndexedDB transactions) |
| **Accessibility** | WCAG 2.1 AA | Pass |
| | Keyboard-only operable | Yes |
| | Screen reader announcements for phase changes | Yes |
| | Reduced motion respected | Yes |
| **Privacy** | No analytics/tracking by default | Opt-in only |
| | No third-party requests | Zero at v1 |
| **Browser Support** | Last 2 versions of Chrome, Firefox, Safari, Edge | Yes |
| | Mobile Safari/Chrome (iOS/Android) | Yes |
| **PWA** | Installable, offline-capable | Yes (service worker + manifest) |

---

## Data Model Outline (IndexedDB)

```
settings (keyval)
  - theme: 'light' | 'dark' | 'system'
  - accent: 'coral' | 'mint' | 'lavender' | 'sunset' | 'ocean'
  - workMinutes: number (default 25)
  - shortBreakMinutes: number (default 5)
  - longBreakMinutes: number (default 15)
  - autoStartBreaks: boolean
  - autoStartWork: boolean
  - dailyGoalMinutes: number (default 120)
  - soundPack: 'classic' | 'nature' | 'arcade' | 'lofi'
  - soundVolume: number (0–1)
  - tickSound: boolean
  - notificationsEnabled: boolean
  - reducedMotion: boolean
  - streakStartDate: ISODate (first session date)
  - lastActiveDate: ISODate (for streak calc)
  - unlockedThemes: string[] (earned theme IDs)
  - unlockedCharacters: string[] (earned character IDs)

sessions (object store, key: uuid)
  - id: string (uuid)
  - startedAt: ISODate
  - endedAt: ISODate | null
  - type: 'work' | 'shortBreak' | 'longBreak'
  - plannedDuration: number (minutes)
  - actualDuration: number (seconds)
  - completed: boolean
  - tags: string[] (user-defined)
  - notes: string (optional, max 500 chars)
  - cycleIndex: number (0-based within the 4-cycle set)

streaks (object store, key: dateString 'YYYY-MM-DD')
  - date: string
  - sessionsCount: number
  - totalFocusSeconds: number
  - goalMet: boolean

achievements (object store, key: achievementId)
  - id: string (e.g., 'first-session', 'week-streak', 'centurion')
  - unlockedAt: ISODate | null
  - progress: number (0–1, for multi-step achievements)

soundPacks (static, bundled)
  - classic: { workEnd, breakEnd, tick }
  - nature: { workEnd, breakEnd, tick }
  - arcade: { workEnd, breakEnd, tick }
  - lofi: { workEnd, breakEnd, tick }
```

### Derived/Computed (not stored)
- Current streak: consecutive days with `goalMet=true` ending at `lastActiveDate`
- Total focus time: sum of `actualDuration` for completed `work` sessions
- Sessions this week/month: filtered by `startedAt`
- Next long break at: `cycleIndex % 4 === 3`

---

## UI/UX Concept (High-Level)

### Screens
1. **Timer** — Full-screen circular progress, phase label, big digital time, start/pause/skip/reset, mini-stats bar (today's focus, streak)
2. **History** — Calendar heatmap + list view, filter by tag/date, CSV export button
3. **Stats** — Weekly/monthly charts (bar: focus time, line: sessions/day), streak badge, achievement gallery
4. **Settings** — Accordion sections: Timer, Sounds, Appearance, Data, Account (v1.1)

### Visual Language
- Rounded-2xl cards, soft shadows, 8px grid
- Accent color used for timer ring, primary buttons, active state
- Character mascot (changes with theme) reacts: sleeping during breaks, focused during work, celebrates on complete
- Micro-interactions: ring elastic snap on complete, button press ripple, toast slide-in
- Dark mode: deep charcoal base, not pure black

### Sound Design
- Work end: warm major chord (classic), bird call (nature), 8-bit fanfare (arcade), vinyl crackle + chord (lofi)
- Break end: softer variant
- Tick: subtle, configurable interval (1s / 10s / off)

---

## Milestones

| Milestone | Scope | Target |
|-----------|-------|--------|
| M1 | Core timer + IndexedDB persistence + basic settings + PWA | Week 2 |
| M2 | History + stats + streak + achievements + themes | Week 4 |
| M3 | Polish: animations, sound packs, keyboard shortcuts, accessibility audit | Week 5 |
| M4 | Deploy to Cloudflare Pages + custom domain + analytics opt-in | Week 6 |
| M5 (v1.1) | Auth + cloud sync + multi-device | Post-launch |

---

## Open Questions (for future)
- Pomodoro technique variations (52/17, 90/20, custom cycles)?
- Team/shared timers?
- Integration with calendars (Google/Outlook)?
- Focus music player (lofi radio, ambient)?
- Mobile push notifications for break reminders?