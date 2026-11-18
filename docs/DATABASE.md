# Database Schema — Pomodoro App

## Overview

The app uses **IndexedDB** (via the `idb` library) for local-first persistence. There is **no backend** at v1; all data is stored in the browser and persists across sessions via the Service Worker cache. The schema is defined in `src/db/index.ts` and migrated automatically on first run.

---

## Stores

| Store | Key Path | Purpose | Indices |
|-------|----------|---------|---------|
| **settings** | `key = 'default'` (single record, keyval) | User preferences (theme, accent, timers, sounds, streaks flags) | None (single row) |
| **sessions** | `id` (UUID string) | Completed Pomodoro sessions | `by-type` (type: work/shortBreak/longBreak), `by-startedAt` (ISO date), `by-completed` (boolean) |
| **streaks** | `date` (ISO date string `YYYY-MM-DD`) | Daily streak statistics | None (single record per date) |
| **achievements** | `id` (e.g. `'first-session'`, `'week-streak'`, `'centurion'`) | Unlocked achievements & progress | `by-unlockedAt` (ISO date) |
| **soundPacks** | n/a (static, bundled) | Pre-configured sound packs (classic / nature / arcade / lofi) | None (read-only) |

---

## Settings Record

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | UI theme |
| `accent` | `'coral' \| 'mint' \| 'lavender' \| 'sunset' \| 'ocean'` | `'coral'` | Accent color for UI |
| `workMinutes` | `number` | `25` | Default work block duration |
| `shortBreakMinutes` | `number` | `5` | Default short break duration |
| `longBreakMinutes` | `number` | `15` | Default long break duration (every 4 cycles) |
| `autoStartBreaks` | `boolean` | `false` | Auto-start breaks after work |
| `autoStartWork` | `boolean` | `false` | Auto-start work after breaks |
| `dailyGoalMinutes` | `number` | `120` | Daily focus goal in minutes |
| `soundPack` | `'classic' \| 'nature' \| 'arcade' \| 'lofi'` | `'classic'` | Current sound pack |
| `soundVolume` | `number` (0–1) | `0.5` | Playback volume |
| `tickSound` | `boolean` | `true` | Enable tick sound |
| `notificationsEnabled` | `boolean` | `true` | Enable browser notifications |
| `reducedMotion` | `boolean` | `false` | Respect `prefers-reduced-motion` |
| `streakStartDate` | `ISODate \| null` | `null` | First session date (for streak calc) |
| `lastActiveDate` | `ISODate \| null` | `null` | Last session date (for streak calc) |
| `unlockedThemes` | `string[]` | `[]` | Earned theme IDs |
| `unlockedCharacters` | `string[]` | `[]` | Earned character IDs |

---

## Session Record

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Primary key |
| `startedAt` | `string` (ISO 8601) | Session start timestamp |
| `endedAt` | `string \| null` | Session end timestamp (null = running) |
| `type` | `'work' \| 'shortBreak' \| 'longBreak'` | Session phase |
| `plannedDuration` | `number` (minutes) | Planned duration at start |
| `actualDuration` | `number` (seconds) | Actual duration when completed |
| `completed` | `boolean` | Whether session ended naturally |
| `tags` | `string[]` | User-defined tags (e.g. `['coding', 'admin']`) |
| `notes` | `string \| null` | Optional notes (max 500 chars) |
| `cycleIndex` | `number` (0-based) | Position within the 4-cycle set |

**Indices:**
- `by-type`: filter sessions by phase
- `by-startedAt`: chronological queries
- `by-completed`: get only completed sessions

---

## Streak Record

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` (`YYYY-MM-DD`) | Primary key, calendar date |
| `sessionsCount` | `number` | Number of completed work sessions that day |
| `totalFocusSeconds` | `number` | Sum of `actualDuration` for completed work sessions |
| `goalMet` | `boolean` | Whether `dailyGoalMinutes` was reached |

---

## Achievement Record

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique achievement identifier |
| `unlockedAt` | `string \| null` (ISO 8601) | When the achievement was unlocked |
| `progress` | `number` (0–1) | For multi-step achievements (e.g. 0.5 = halfway) |

**Pre-defined achievement IDs** (defined in `src/lib/achievements.ts`):
- `first-session` — first completed work session
- `week-streak` — 7 consecutive days with `goalMet=true`
- `centurion` — 100 total completed sessions
- `long-break` — experienced a long break
- `night-owl` — session started after 8 PM

---

## Migration Strategy

| Version | Change |
|---------|--------|
| **v1** (initial) | Create all 5 object stores with their keys/indices (see above). This runs on first app launch via `onupgradeneeded`. |
| **v2** (future) | Add new stores or fields; bump `DB_VERSION` and handle in the `upgrade` callback. No data loss since existing records are preserved. |
| **v3+** | Further evolutions — follow the same pattern. |

**Migration code** lives in `src/db/index.ts` `#createStores()` called during `openDB` upgrade. Since this is a fresh app (v1), there is **no prior schema to migrate from** — all stores are created fresh.

---

## API Surface (src/db/index.ts)

| Method | Description |
|--------|-------------|
| `db.init()` | Open the database (idempotent; returns cached handle). |
| `db.getSettings()` | Read the current settings record. |
| `db.updateSettings(partial)` | Merge-deep update of settings; persists immediately. |
| `db.addSession(session)` | Add a new session record (generates UUID). |
| `db.getSessions(filter)` | Read sessions; `filter` can be `true`/`false` for `completed` only or `undefined` for all. |
| `db.getCompletedWorkSessions()` | Convenience: completed work sessions only. |
| `db.getStreak(date?)` | Read streak for a specific date or all streaks. |
| `db.upsertStreak(record)` | Write/merge a streak record keyed by date. |
| `db.getAchievement(id)` | Read a specific achievement. |
| `db.unlockAchievement(id, progress)` | Mark an achievement as unlocked, incrementing progress. |

---

## Development Notes

- **Bundle impact**: The `idb` library is ~1.5 KB gzipped (per ADR-003).
- **Schema drift**: TypeScript interfaces (`Settings`, `Session`, `StreakRecord`, `Achievement`) in `src/types/` must stay in sync with this schema. The Biome CI check catches mismatches.
- **Offline-first**: All mutations go through `db` methods; the Service Worker caches the `index.db` blob for offline read access.
- **Reset**: To reset the database, delete `pomodoro-db` from `indexedDB` in browser dev tools (or clear `application` storage).
- **Cloud sync (v1.1+)**: Planned — would replace IndexedDB with a cloud-backed store or add a merge layer on top. Not implemented at v1.