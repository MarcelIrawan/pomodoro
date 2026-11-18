# Pomodoro Focus Timer

A local-first Pomodoro timer web app with sessions, streaks, achievements, and PWA support. Built with Preact, TypeScript, and Vite. Deployed to Cloudflare Pages.

[![CI](https://github.com/MarcelIrawan/pomodoro/actions/workflows/ci.yml/badge.svg)](https://github.com/MarcelIrawan/pomodoro/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/Cloudflare%20Pages-Deployed-38B2AC?logo=cloudflare)](https://pomodoro.pages.dev)

## Features

| Feature | Description |
|---------|-------------|
| **Timer** | Work / Short break / Long break phases, configurable durations, keyboard shortcuts (`Space` = play/pause, `R` = reset, `S` = skip) |
| **History** | Calendar heatmap, session list with CSV export |
| **Stats** | Weekly bar chart, monthly line chart, streak badge, achievement gallery |
| **Settings** | Theme (light/dark/system), sound packs (Classic, Nature, Arcade, Lo-Fi), focus mode, data import/export |
| **PWA** | Installable, offline-first (service worker + IndexedDB), background sync |
| **Privacy** | Zero telemetry, no backend, no third-party requests |

## Tech Stack

- **Framework**: [Preact](https://preactjs.com/) + TypeScript + Vite (~3 KB gzipped runtime)
- **State**: [@preact/signals](https://preactjs.com/guide/v10/signals/) (fine-grained reactivity) + [idb](https://github.com/jakearchibald/idb) (IndexedDB)
- **Routing**: [Wouter](https://github.com/molefrog/wouter) (~1 KB)
- **Styling**: Plain CSS with custom properties (zero runtime cost)
- **Charts**: Hand-rolled SVG (no library)
- **Icons**: Inline Lucide subset (~500 bytes each)
- **Audio**: HTMLAudioElement + Web Audio API (hybrid)
- **PWA**: `vite-plugin-pwa` + Workbox GenerateSW
- **Hosting**: Cloudflare Pages (static SPA)
- **Lint/Format**: [Biome](https://biomejs.dev/) (replaces ESLint + Prettier)
- **Test**: [Vitest](https://vitest.dev/)
- **CI/CD**: GitHub Actions → Cloudflare Pages

## Quick Start

```bash
# Clone & install
git clone https://github.com/MarcelIrawan/pomodoro.git
cd pomodoro
npm ci

# Development server (hot reload)
npm run dev

# Run all checks (lint, typecheck, test, build)
npm run lint && npm run typecheck && npm run test && npm run build
```

## Project Structure

```
pomodoro/
├── public/                 # Static assets → dist/
│   ├── sounds/             # Sound packs (classic/, nature/, arcade/, lofi/)
│   ├── icons/              # PWA icons (192, 512, maskable)
│   ├── manifest.webmanifest
│   ├── offline.html        # Offline fallback
│   ├── _headers            # Cloudflare Pages headers
│   ├── _routes.json        # SPA fallback
│   └── 404.html            # Required for real 404s
├── src/
│   ├── main.tsx            # App entry, register SW, mount root
│   ├── app.tsx             # Root component, providers, routing
│   ├── styles/             # CSS tokens, reset, components, screens
│   ├── components/         # Feature-based components
│   │   ├── ui/             # Primitives (Button, Card, Input, Toast, Icons)
│   │   ├── timer/          # TimerRing, TimerDigital, PhaseBadge, Controls
│   │   ├── history/        # CalendarHeatmap, SessionList, ExportButton
│   │   ├── stats/          # WeeklyBarChart, MonthlyLineChart, StreakBadge, AchievementGallery
│   │   └── settings/       # Accordion, ThemePicker, SoundPackPicker, DataActions
│   ├── hooks/              # Feature hooks (useTimer, useSettings, useSessions, etc.)
│   ├── lib/                # Pure logic (db, charts, date, uuid, storage)
│   ├── types/              # TypeScript interfaces
│   ├── screens/            # Route-level screens (Timer, History, Stats, Settings)
│   └── utils/              # Helpers (cn for className)
├── index.html              # Entry HTML (theme script, manifest, fonts)
├── vite.config.ts          # Vite + Preact + PWA + TS config
├── tsconfig.json
├── package.json
├── biome.json              # Biome lint/format config
└── README.md
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest unit tests |
| `npm run typecheck` | TypeScript strict check (`tsc --noEmit`) |
| `npm run lint` | Biome lint + format check |

## Deployment

### Prerequisites

- Cloudflare account with Pages project named `pomodoro`
- `CLOUDFLARE_API_TOKEN` (Pages:Edit permission)
- `CLOUDFLARE_ACCOUNT_ID`
- Node.js 22+

### Manual Deploy

```bash
npm run build
./scripts/deploy-pages.sh
```

### CI/CD

Push to `main` branch triggers GitHub Actions workflow:
1. Lint → Typecheck → Test → Build
2. Deploy to Cloudflare Pages (on `main` only)

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:
- 13 Architecture Decision Records (ADR-001 to ADR-013)
- Data flow diagram
- Non-goals (v1)
- Risk mitigation
- Milestone mapping

## Deployment Guide

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step deployment, verification, and troubleshooting.

## Requirements

See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) for the full product specification.

## License

MIT — free to use, modify, and distribute.