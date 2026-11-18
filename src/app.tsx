// Root component (ADR-010): app shell, routing, initial data load.
import { useEffect, useMemo } from 'preact/hooks';
import { Link, Route, Router, useLocation } from 'wouter-preact';

import { TimerScreen } from './screens/TimerScreen.tsx';
import { HistoryScreen } from './screens/HistoryScreen.tsx';
import { StatsScreen } from './screens/StatsScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { IconTimer, IconCalendar, IconChart, IconSettings, IconFlame, IconDownload } from './components/ui/Icons.tsx';
import { loadSettings } from './hooks/useSettings.ts';
import { loadSessions } from './hooks/useSessions.ts';
import { loadStreaks } from './hooks/useStreaks.ts';
import { loadAchievements } from './hooks/useAchievements.ts';
import { usePWA } from './hooks/usePWA.ts';
import { focusMode } from './lib/focus.ts';
import { cn } from './utils/cn.ts';

const NAV_ITEMS = [
  { path: '/', label: 'Timer', Icon: IconTimer },
  { path: '/history', label: 'History', Icon: IconCalendar },
  { path: '/stats', label: 'Stats', Icon: IconChart },
  { path: '/settings', label: 'Settings', Icon: IconSettings },
] as const;

function NotFound() {
  return (
    <main class="screen">
      <div class="screen__inner" style={{ textAlign: 'center' }}>
        <h2 class="screen__title">404 — Nothing here</h2>
        <p class="screen__subtitle">That page does not exist.</p>
        <Link href="/" class="btn btn--primary btn--md" style={{ margin: '0 auto' }}>
          Back to the timer
        </Link>
      </div>
    </main>
  );
}

function AppShell() {
  const [location] = useLocation();
  const { canInstall, installed, install } = usePWA();
  const chromeHidden = focusMode.value;

  const nav = useMemo(
    () =>
      NAV_ITEMS.map(({ path, label, Icon }) => {
        const active = path === '/' ? location === '/' : location.startsWith(path);
        return (
          <Link
            key={path}
            href={path}
            class={cn('app-nav__item', active && 'app-nav__item--active')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      }),
    [location],
  );

  return (
    <div class="app-shell">
      {!chromeHidden && (
        <header class="app-header">
          <div class="app-header__brand">
            <span class="app-header__brand-icon" aria-hidden="true"><IconFlame size={22} /></span>
            Pomodoro
          </div>
          {canInstall.value && !installed.value && (
            <button class="btn btn--ghost btn--md" onClick={() => void install()}>
              <IconDownload size={16} />
              <span>Install app</span>
            </button>
          )}
        </header>
      )}
      <div class="app-main">
        {!chromeHidden && <nav class="app-nav" aria-label="Main navigation">{nav}</nav>}
        <Router>
          <Route path="/" component={TimerScreen} />
          <Route path="/history" component={HistoryScreen} />
          <Route path="/stats" component={StatsScreen} />
          <Route path="/settings" component={SettingsScreen} />
          <Route component={NotFound} />
        </Router>
      </div>
    </div>
  );
}

export function App() {
  useEffect(() => {
    // Warm every store on boot; screens read from signals so they paint instantly.
    void Promise.all([loadSettings(), loadSessions(), loadStreaks(), loadAchievements()]).catch((error) => {
      console.error('Failed to load local data', error);
    });
  }, []);

  return <AppShell />;
}
