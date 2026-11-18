// Timer screen (F1–F6): ring, digital time, phase badge, controls, mini stats, focus mode.
import { useEffect, useRef, useState } from 'preact/hooks';

import { Controls } from '../components/timer/Controls.tsx';
import { PhaseBadge, phaseLabel } from '../components/timer/PhaseBadge.tsx';
import { TimerRing } from '../components/timer/TimerRing.tsx';
import { TimerDigital } from '../components/timer/TimerDigital.tsx';
import { Button } from '../components/ui/Button.tsx';
import { ConfettiBurst, ToastHost, showToast } from '../components/ui/Toast.tsx';
import { IconFocus } from '../components/ui/Icons.tsx';
import { maybeTick } from '../hooks/useAudio.ts';
import { useSessions } from '../hooks/useSessions.ts';
import { useSettings } from '../hooks/useSettings.ts';
import { currentStreak, todayStreak } from '../hooks/useStreaks.ts';
import {
  handleBeforeUnload,
  handleVisibilityChange,
  restoreRuntimeState,
  toggle,
  skip,
  reset,
  useTimer,
} from '../hooks/useTimer.ts';
import { focusMode } from '../lib/focus.ts';
import { ACHIEVEMENT_DEFS } from '../lib/achievements.ts';
import { formatDuration } from '../lib/date.ts';

let restored = false;

export function TimerScreen() {
  const { settings } = useSettings();
  const { stats, ready } = useSessions();
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const notifiedPhaseRef = useRef<string | null>(null);
  const lastTickRef = useRef<number>(-1);
  const timer = useTimer();
  const { phase, isRunning, remainingSeconds, cycleIndex, sessionStartedAt, completedPhase, recentUnlocks, progress } = timer;

  useEffect(() => {
    if (!restored) {
      restoreRuntimeState();
      restored = true;
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Keyboard shortcuts (F6): Space toggle, R reset, S skip — never while typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        toggle();
      } else if (event.key.toLowerCase() === 'r') {
        reset();
      } else if (event.key.toLowerCase() === 's') {
        skip();
      } else if (event.key.toLowerCase() === 'f') {
        focusMode.value = !focusMode.value;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Tick once per second while running (F5).
  useEffect(() => {
    const second = Math.ceil(remainingSeconds.value);
    if (second !== lastTickRef.current) {
      lastTickRef.current = second;
      if (isRunning.value) maybeTick(second);
    }
  }, [remainingSeconds.value]);

  // Confetti + toast on natural phase completion.
  useEffect(() => {
    const off = completedPhase.subscribe((finished) => {
      if (!finished) return;
      if (!settings.value.reducedMotion) setConfettiTrigger((n) => n + 1);
      if (finished === 'work') {
        showToast(`Focus complete! Now ${phaseLabel(phase.value) === 'Focus' ? 'take a breath' : 'back to work'} 🎉`, 'success');
      } else {
        showToast('Break over — back to focus 🍅', 'info');
      }
    });
    return off;
  }, [settings.value.reducedMotion]);

  // Toast for newly unlocked achievements.
  useEffect(() => {
    const off = recentUnlocks.subscribe((ids) => {
      for (const id of ids) {
        const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
        if (def) showToast(`Achievement unlocked: ${def.title} 🏆`, 'achievement');
      }
    });
    return off;
  }, []);

  // Gentle nudge when idle > 10 min during a work block (F15).
  useEffect(() => {
    if (phase.value !== 'work' || isRunning.value || !sessionStartedAt.value) return;
    if (!settings.value.notificationsEnabled) return;
    const start = new Date(sessionStartedAt.value).getTime();
    const key = `${sessionStartedAt.value}`;
    if (notifiedPhaseRef.current === key) return;
    if (Date.now() - start < 10 * 60 * 1000) return;
    notifiedPhaseRef.current = key;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro nudge', {
        body: 'Still there? Press Space to start your focus block.',
        tag: 'pomodoro-idle-nudge',
      });
    }
  });

  const size = focusMode.value ? 300 : 320;
  const label = phaseLabel(phase.value);
  const cycleLabel = `Pomodoro ${(cycleIndex.value % 4) + 1} of 4`;
  const goalSeconds = Math.max(1, settings.value.dailyGoalMinutes) * 60;
  const todayFocus = stats.value.todayFocusSeconds;
  const goalRatio = Math.min(1, todayFocus / goalSeconds);

  return (
    <main class={`screen screen--timer${focusMode.value ? ' screen--focus' : ''}`}>
      <ToastHost />
      <ConfettiBurst trigger={confettiTrigger} />
      <div class="screen__inner timer-layout">
        <PhaseBadge phase={phase.value} cycleIndex={cycleIndex.value} isRunning={isRunning.value} />
        <TimerRing
          size={size}
          progress={progress.value}
          remainingSeconds={remainingSeconds.value}
          phaseLabel={label}
          cycleLabel={cycleLabel}
        />
        <TimerDigital remainingSeconds={remainingSeconds.value} label={label} />
        <Controls isRunning={isRunning.value} onToggle={toggle} onSkip={skip} onReset={reset} />

        <div class="mini-stats" aria-label="Today focus stats">
          <div class="mini-stats__item">
            <span class="mini-stats__value">{formatDuration(todayFocus)}</span>
            <span class="mini-stats__label">today focus</span>
          </div>
          <div class="mini-stats__divider" aria-hidden="true" />
          <div class="mini-stats__item">
            <span class="mini-stats__value">{currentStreak.value}🔥</span>
            <span class="mini-stats__label">day streak</span>
          </div>
          <div class="mini-stats__divider" aria-hidden="true" />
          <div class="mini-stats__item">
            <span class="mini-stats__value">{Math.round(goalRatio * 100)}%</span>
            <span class="mini-stats__label">goal {settings.value.dailyGoalMinutes}m</span>
          </div>
        </div>

        <div
          class="goal-progress"
          role="progressbar"
          aria-valuenow={Math.min(100, Math.round(goalRatio * 100))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily focus goal progress"
        >
          <div class="goal-progress__fill" style={{ width: `${goalRatio * 100}%` }} />
        </div>

        {!focusMode.value && (
          <div class="timer-layout__focus-toggle">
            <Button variant="quiet" onClick={() => { focusMode.value = true; }} aria-label="Enter focus mode (F)">
              <IconFocus size={16} />
              <span>Focus mode</span>
            </Button>
          </div>
        )}
        {focusMode.value && (
          <button class="focus-exit" onClick={() => { focusMode.value = false; }}>
            Exit focus mode (F)
          </button>
        )}
        {ready.value === false && <p class="sr-only">Loading history…</p>}
        {todayStreak.value && todayStreak.value.goalMet && (
          <p class="goal-met" role="status">Goal met for today 🎯</p>
        )}
      </div>
    </main>
  );
}
