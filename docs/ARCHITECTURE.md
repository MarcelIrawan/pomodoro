# Pomodoro App — Architecture

## Overview

Single-page application (SPA) deployed as a static site on **Cloudflare Pages**. Local-first with **IndexedDB** persistence, fully functional offline. Progressive Web App (installable, service worker). No backend at v1.

Target: **< 100 KB gzipped JS+CSS**, cold load < 2s on 3G, timer drift ±50 ms over 25 min.

---

## Major Decisions (ADRs)

### ADR-001: Framework — Preact + TypeScript + Vite

**Status**: Accepted

**Context**: Need a lightweight framework for a bundle < 100 KB gzipped. Must support TypeScript, PWA, animations, and IndexedDB.

**Options considered**:
| Option | Runtime (gz) | DX | Animations | PWA | Verdict |
|--------|--------------|----|------------|-----|---------|
| Vanilla TS + Vite | ~0 KB | Low (boilerplate) | Manual | Manual | Too much boilerplate |
| **Preact + Vite** | **~3 KB** | High (React-like) | CSS + Signals | `@preact/pwa` | ✅ Best balance |
| SolidJS + Vite | ~7 KB | High | Fine-grained | Community | Great, smaller ecosystem |
| Svelte + Vite | ~2 KB | High | Built-in | `@sveltejs/adapter-static` | Strong contender |
| Lit + Vite | ~5 KB | Medium | Manual | Manual | Web components overhead |

**Decision**: **Preact + TypeScript + Vite**.

**Consequences**:
- Tiny runtime (~3 KB gzipped) leaves budget for features
- React-compatible mental model; team familiarity
- `preact/compat` allows React ecosystem libraries if needed
- Signals (`@preact/signals`) for fine-grained reactivity without virtual DOM diff overhead
- Official Vite plugin (`@preact/preset-vite`) + PWA plugin (`vite-plugin-pwa`)

---

### ADR-002: Styling — Plain CSS + CSS Custom Properties (No Framework)

**Status**: Accepted

**Context**: Bundle budget is tight. Tailwind (even with JIT) adds ~10–15 KB. UnoCSS adds ~3–5 KB but introduces build complexity.

**Decision**: **Plain CSS with CSS custom properties for theming**, organized with BEM-ish naming. Use `:root` for design tokens (colors, spacing, radii, transitions). Dark mode via `prefers-color-scheme` + class override.

**Consequences**:
- Zero runtime CSS cost
- Full control over animations/transitions (critical for "playful" feel)
- Theming: swap `--accent`, `--bg`, `--fg`, `--card` via data-attribute on `<html>`
- No purging/configuration maintenance

---

### ADR-003: State Management — Preact Signals + idb (IndexedDB Wrapper)

**Status**: Accepted

**Context**: Need reactive UI state (timer, settings) + persistent storage (IndexedDB). Redux/Zustand add ~1–2 KB; overkill for this scope.

**Decision**:
- **UI state**: `@preact/signals` — fine-grained reactivity, no provider boilerplate
- **Persistence**: `idb` (~1.5 KB) — Promise-based IndexedDB wrapper, type-safe
- **Sync strategy**: Write-through — every mutation updates signal + persists to IndexedDB (debounced 10 s for timer tick, immediate for settings/sessions)

**Consequences**:
- Minimal bundle impact (~4.5 KB combined)
- Type-safe schema via TypeScript interfaces matching `docs/REQUIREMENTS.md` data model
- Timer survives tab background/close via Page Visibility API + `beforeunload` persist

---

### ADR-004: Routing — Wouter (Preact)

**Status**: Accepted

**Context**: 4 screens (Timer, History, Stats, Settings). Need hash/history routing, < 1 KB.

**Decision**: **Wouter** (~1 KB) — minimal hook-based router for Preact/React.

**Consequences**:
- No route-based code splitting needed (all screens load upfront; total JS < 100 KB)
- Simple `useLocation`, `useRoute`, `Link` API

---

### ADR-005: Charts — Custom SVG (No Library)

**Status**: Accepted

**Context**: Chart.js (~45 KB), uCharts (~15 KB) — too heavy. Only need: weekly bar chart (focus time), monthly line chart (sessions/day), streak badge.

**Decision**: **Hand-rolled SVG charts** using `<svg>`, `<rect>`, `<path>`, `<text>`. ~2 KB utility module.

**Consequences**:
- Full control over styling (accent colors, dark mode, animations)
- Zero dependencies
- Accessible: `<title>`, `<desc>`, ARIA labels

---

### ADR-006: Icons — Inline SVG (Lucide Subset)

**Status**: Accepted

**Context**: Need ~15 icons. Lucide as npm package tree-shakes but still ~8 KB.

**Decision**: **Copy required Lucide SVGs inline** as Preact components (`IconPlay`, `IconPause`, etc.). ~500 bytes each, only what we use.

**Consequences**:
- Zero runtime dependency
- Styleable via `currentColor` (inherits accent/text color)
- No font/icon-font FOIT

---

### ADR-007: Audio — HTMLAudioElement + Web Audio API (Hybrid)

**Status**: Accepted

**Context**: Need tick (repeating), completion sounds (distinct per phase), volume control, sound packs.

**Decision**:
- **Completion sounds**: `HTMLAudioElement` — simple, low latency, supports MP3/OGG
- **Tick**: `AudioContext` + `OscillatorNode` (synthetic) or short audio buffer — precise timing, no network load
- **Sound packs**: 4 packs × 3 sounds = 12 small audio files (~20 KB total), bundled as `public/sounds/`

**Consequences**:
- No external audio library
- Volume via `gainNode` (Web Audio) or `.volume` (HTMLAudioElement)
- Preload on settings change; respect `reducedMotion`/`prefers-reduced-motion` for tick

---

### ADR-008: PWA — Vite Plugin PWA + Workbox (GenerateSW)

**Status**: Accepted

**Context**: Must be installable, offline-capable, cache-first for static assets, stale-while-revalidate for IndexedDB sync (future).

**Decision**: **`vite-plugin-pwa` with `workbox: generateSW`** — generates service worker at build time.

**Configuration**:
- `manifest.webmanifest`: name, icons, theme_color, display: standalone
- Cache strategy: `CacheFirst` for `public/` assets, `NetworkFirst` for future API
- `skipWaiting: true`, `clientsClaim: true` for instant updates
- Offline fallback: `/offline.html` (minimal timer screen)

---

### ADR-009: Hosting — Cloudflare Pages (Static SPA)

**Status**: Accepted (per requirements)

**Context**: Requirements explicitly state Cloudflare Pages like BagiRataAI.

**Decision**: **Cloudflare Pages** with:
- Build command: `npm run build` (outputs to `dist/`)
- Output directory: `dist`
- `_routes.json` for SPA fallback: `/* /index.html 200`
- `_headers` for cache control, CSP, permissions-policy
- Custom domain via CNAME (post-launch)
- No Functions needed at v1 (static only)

**Consequences**:
- Zero cost, global CDN, automatic HTTPS
- Instant cache purge on deploy
- Analytics via Cloudflare Web Analytics (opt-in, privacy-friendly)

---

### ADR-010: Project Layout — Feature-Based (Scalable)

**Status**: Accepted

**Structure**:
```
pomodoro/
├── public/                 # Static assets copied to dist/
│   ├── sounds/             # Sound packs (classic/, nature/, arcade/, lofi/)
│   ├── icons/              # PWA icons (192, 512, maskable)
│   ├── manifest.webmanifest
│   ├── offline.html        # Offline fallback
│   ├── _headers            # Cloudflare Pages headers
│   ├── _routes.json        # SPA fallback
│   └── 404.html            # Required for real 404s (cf. BagiRataAI)
├── src/
│   ├── main.tsx            # App entry, register SW, mount root
│   ├── app.tsx             # Root component, providers, routing
│   ├── styles/
│   │   ├── tokens.css      # CSS custom properties (design system)
│   │   ├── reset.css       # Normalize + base
│   │   ├── components.css  # Shared component styles
│   │   └── screens.css     # Screen-specific styles
│   ├── components/
│   │   ├── ui/             # Primitive: Button, Card, Input, Toast, Icon*
│   │   ├── timer/          # TimerRing, TimerDigital, PhaseBadge, Controls
│   │   ├── history/        # CalendarHeatmap, SessionList, ExportButton
│   │   ├── stats/          # WeeklyBarChart, MonthlyLineChart, StreakBadge, AchievementGallery
│   │   └── settings/       # Accordion, ThemePicker, SoundPackPicker, DataActions
│   ├── hooks/
│   │   ├── useTimer.ts     # Timer logic (signals, persistence, visibility)
│   │   ├── useSettings.ts  # Settings signal + persistence
│   │   ├── useSessions.ts  # Sessions CRUD + derived stats
│   │   ├── useStreaks.ts   # Streak calculation
│   │   ├── useAchievements.ts
│   │   ├── useAudio.ts     # AudioContext, sound packs, volume
│   │   └── usePWA.ts       # Install prompt, update notification
│   ├── lib/
│   │   ├── db.ts           # idb schema, migrations, repositories
│   │   ├── charts.ts       # SVG chart utilities
│   │   ├── date.ts         # Date helpers (ISO, week/month bounds)
│   │   ├── uuid.ts         # crypto.randomUUID wrapper
│   │   └── storage.ts      # Keyval helpers for settings
│   ├── types/
│   │   └── index.ts        # All TypeScript interfaces (matches REQUIREMENTS.md)
│   ├── screens/
│   │   ├── TimerScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── utils/
│       └── cn.ts           # className helper (clsx-like, tiny)
├── index.html              # Entry HTML (preload fonts, manifest, theme script)
├── vite.config.ts          # Vite + Preact + PWA + TypeScript config
├── tsconfig.json
├── package.json
├── .gitignore
└── README.md
```

**Rationale**:
- Colocation: components/hooks/types near their feature
- `lib/` for pure logic (testable, no Preact deps)
- `screens/` for route-level composition
- Flat `components/ui/` for true primitives
- Mirrors BagiRataAI's `public/` + `src/` separation

---

### ADR-011: Build & Tooling — Vite + TypeScript (Strict) + Biome

**Status**: Accepted

**Decision**:
- **Bundler**: Vite 5+ (esbuild + Rollup)
- **TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- **Lint/Format**: **Biome** (replaces ESLint + Prettier) — fast, zero-config, built-in formatter
- **Test**: `vitest` (unit) + `@playwright/test` (e2e, optional for v1)
- **CI**: GitHub Actions → Cloudflare Pages deploy on push to `main`

**Consequences**:
- Single toolchain for lint/format/check
- TypeScript strictness catches IndexedDB schema drift
- Biome CI runs in < 5s

---

### ADR-012: Accessibility — Built-In, Not Bolted On

**Status**: Accepted

**Decision**: Implement WCAG 2.1 AA from start:
- Semantic HTML (`<main>`, `<section>`, `<button>`, `<dialog>`)
- ARIA live regions for phase announcements (`aria-live="polite"`)
- Focus management: visible focus rings, trap in modals
- `prefers-reduced-motion` disables confetti, ring animation, tick
- `prefers-contrast` increases border weights
- Color contrast: tokens tested against APCA
- Keyboard shortcuts documented in Settings, `kbd` tags

**Consequences**:
- No post-hoc audit needed
- Screen reader tested with NVDA/VoiceOver during dev

---

### ADR-013: Privacy — Zero Telemetry by Default

**Status**: Accepted

**Decision**:
- No analytics, no error tracking, no third-party requests at v1
- Cloudflare Web Analytics added at M4 **opt-in** (settings toggle)
- Service worker only caches first-party assets
- No CDN for fonts/icons (self-hosted)

**Consequences**:
- Trustworthy for privacy-conscious users
- Simpler CSP (`default-src 'self'`)

---

## Data Flow Summary

```
User Action (click, key, timer tick)
       │
       ▼
Preact Signal Mutation (useTimer, useSettings, etc.)
       │
       ├──▶ UI Re-renders (fine-grained, only affected components)
       │
       └──▶ Debounced Persist (idb) ──▶ IndexedDB
                     │
                     ▼
            Service Worker (cache static assets)
                     │
                     ▼
            Cloudflare Pages (static deploy)
```

---

## Non-Goals (v1)

- Backend / API / auth / cloud sync (v1.1+)
- Team features, calendar integration, focus music
- Native wrappers (Capacitor/Tauri)
- Internationalization (English only at launch)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bundle > 100 KB | `vite-bundle-analyzer` in CI; budget alerts |
| Timer drift | `requestAnimationFrame` + `performance.now()` correction; persist every 10s |
| IndexedDB quota | Estimate: ~50 KB/user/year; well under 50 MB default |
| iOS PWA limits | Test `display: standalone`; no push notifications at v1 |
| Sound autoplay policy | User gesture required first; unlock AudioContext on first interaction |

---

## Milestone Mapping

| Milestone | Architecture Deliverables |
|-----------|---------------------------|
| M1 | Project scaffold, timer core, IndexedDB schema, PWA manifest/SW, TimerScreen, SettingsScreen (timer/sounds/appearance) |
| M2 | HistoryScreen, StatsScreen (charts), streak/achievement logic, theme/character unlocks |
| M3 | Animations, sound packs, keyboard shortcuts, accessibility audit, Biome CI |
| M4 | Cloudflare Pages deploy, `_headers`/`_routes.json`, custom domain, opt-in analytics |
| M5 | Auth, cloud sync, multi-device (separate spec) |