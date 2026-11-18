// Core timer: Preact signals + drift-corrected wall clock + persistence (ADR-003, F1–F4).
import { computed, signal } from "@preact/signals";
import { nowISO } from "../lib/date.ts";
import { db } from "../lib/db.ts";
import {
  experiencedLongBreak,
  hasNightOwlSession,
  totalCompletedWorkSessions,
} from "../lib/stats.ts";
import {
  clearRuntimeTimerState,
  readRuntimeTimerState,
  writeRuntimeTimerState,
} from "../lib/storage.ts";
import { nextPhase, phasePlannedSeconds, remainingMs } from "../lib/timer-math.ts";
import type { Phase } from "../types/index.ts";
import { evaluateAchievements } from "./useAchievements.ts";
import { playCompletionSound } from "./useAudio.ts";
import { addSession } from "./useSessions.ts";
import { settings } from "./useSettings.ts";
import { currentStreak, recordFocusForToday } from "./useStreaks.ts";

const phase = signal<Phase>("work");
const isRunning = signal(false);
const plannedSeconds = signal(settings.value.workMinutes * 60);
const remainingSeconds = signal(plannedSeconds.value);
const cycleIndex = signal(0);
const sessionStartedAt = signal<string | null>(null);
/** Phase just completed (for confetti/toast); consumers null it. */
const completedPhase = signal<Phase | null>(null);
/** Def ids unlocked in the latest completion. */
const recentUnlocks = signal<string[]>([]);

let endTimeMs: number | null = null;
let _phaseStartMs: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let lastPersistMs = 0;
let isCompleting = false;

function currentPlannedSeconds(target: Phase): number {
  const s = settings.value;
  return phasePlannedSeconds(target, s.workMinutes, s.shortBreakMinutes, s.longBreakMinutes);
}

function persistNow(): void {
  writeRuntimeTimerState({
    phase: phase.value,
    isRunning: isRunning.value,
    remainingSeconds: remainingSeconds.value,
    plannedSeconds: plannedSeconds.value,
    cycleIndex: cycleIndex.value,
    sessionStartedAt: sessionStartedAt.value,
  });
}

function stopInterval(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function startInterval(): void {
  stopInterval();
  intervalId = setInterval(() => {
    if (!isRunning.value || endTimeMs === null) return;
    // Drift-corrected: always derive remaining from the absolute end timestamp,
    // never by decrementing — background throttling cannot accumulate drift.
    remainingSeconds.value = Math.ceil(remainingMs(endTimeMs, Date.now()) / 1000);
    if (remainingSeconds.value <= 0) {
      void completePhase(true, true);
    } else if (Date.now() - lastPersistMs > 10_000) {
      persistNow();
      lastPersistMs = Date.now();
    }
  }, 250);
}

function enterPhase(target: Phase, planned: number): void {
  phase.value = target;
  plannedSeconds.value = planned;
  remainingSeconds.value = planned;
  isRunning.value = false;
  endTimeMs = null;
  _phaseStartMs = null;
  sessionStartedAt.value = null; // set when the user actually presses start for work
}

function actualElapsedSeconds(): number {
  if (sessionStartedAt.value) {
    return Math.max(
      0,
      Math.floor((Date.now() - new Date(sessionStartedAt.value).getTime()) / 1000),
    );
  }
  return Math.max(0, plannedSeconds.value - remainingSeconds.value);
}

/** Completes the current phase: logs session, streaks, achievements, sound, auto-switch. */
async function completePhase(natural: boolean, playSound: boolean): Promise<void> {
  if (isCompleting) return;
  isCompleting = true;
  try {
    const finishedPhase = phase.value;
    const actual = actualElapsedSeconds();
    const elapsed =
      actual > 0 ? Math.min(plannedSeconds.value, actual) : natural ? plannedSeconds.value : 1;
    const wasLongBreak = finishedPhase === "longBreak";
    const { phase: next, cycleIndex: nextCycle } = nextPhase(finishedPhase, cycleIndex.value);

    // Log every phase per data model (work and breaks alike).
    if (natural || elapsed > 0) {
      await addSession({
        startedAt: sessionStartedAt.value ?? nowISO(),
        endedAt: nowISO(),
        type: finishedPhase,
        plannedDuration: Math.round(plannedSeconds.value / 60),
        actualDuration: elapsed,
        completed: natural,
        tags: [],
        notes: null,
        cycleIndex: cycleIndex.value,
      });
      if (finishedPhase === "work" && natural) {
        await recordFocusForToday(elapsed);
        const sessionsList = await db.getSessions();
        const unlocks = await evaluateAchievements({
          completedWorkSessions: totalCompletedWorkSessions(sessionsList),
          currentStreak: currentStreak.value,
          experiencedLongBreak: wasLongBreak || experiencedLongBreak(sessionsList),
          nightOwlSession: hasNightOwlSession(sessionsList),
        });
        if (unlocks.length > 0) recentUnlocks.value = unlocks.map((u) => u.id);
      }
    }

    completedPhase.value = finishedPhase;
    if (playSound) playCompletionSound(finishedPhase);
    stopInterval();
    isRunning.value = false;
    endTimeMs = null;
    if (next === "work" && finishedPhase === "longBreak") cycleIndex.value = 0;
    else if (finishedPhase === "work") cycleIndex.value = nextCycle;

    const autoStart =
      (finishedPhase === "work" && settings.value.autoStartBreaks) ||
      (finishedPhase !== "work" && settings.value.autoStartWork);
    enterPhase(next, currentPlannedSeconds(next));
    clearRuntimeTimerState();
    persistNow();
    if (autoStart) start();
  } finally {
    isCompleting = false;
  }
}

async function silentExpiredComplete(): Promise<void> {
  // Timer expired while the tab was closed: count it, without sound/confetti.
  await completePhase(true, false);
}

export function start(): void {
  if (isRunning.value) return;
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    settings.value.notificationsEnabled
  ) {
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }
  const now = Date.now();
  if (phase.value === "work" && !sessionStartedAt.value) {
    sessionStartedAt.value = new Date(now).toISOString();
  }
  _phaseStartMs = now;
  endTimeMs = now + remainingSeconds.value * 1000;
  isRunning.value = true;
  lastPersistMs = now;
  startInterval();
  persistNow();
}

export function pause(): void {
  if (!isRunning.value) return;
  isRunning.value = false;
  endTimeMs = null;
  stopInterval();
  persistNow();
}

export function toggle(): void {
  if (isRunning.value) pause();
  else start();
}

export function skip(): void {
  void completePhase(false, false);
}

export function reset(): void {
  if (!isRunning.value) {
    remainingSeconds.value = plannedSeconds.value;
    sessionStartedAt.value = null;
    clearRuntimeTimerState();
    persistNow();
    return;
  }
  isRunning.value = false;
  stopInterval();
  remainingSeconds.value = plannedSeconds.value;
  sessionStartedAt.value = null;
  endTimeMs = null;
  clearRuntimeTimerState();
  persistNow();
}

/** Rehydrate runtime state saved before the tab was closed (call once on mount). */
export function restoreRuntimeState(): void {
  const saved = readRuntimeTimerState();
  if (!saved) {
    enterPhase("work", currentPlannedSeconds("work"));
    return;
  }
  phase.value = saved.phase;
  plannedSeconds.value = saved.plannedSeconds;
  cycleIndex.value = saved.cycleIndex;
  sessionStartedAt.value = saved.sessionStartedAt;
  if (saved.isRunning) {
    const elapsedMs = Date.now() - saved.savedAt;
    const remaining = saved.remainingSeconds - elapsedMs / 1000;
    if (remaining <= 0) {
      remainingSeconds.value = 0;
      void silentExpiredComplete();
    } else {
      remainingSeconds.value = Math.ceil(remaining);
      endTimeMs = Date.now() + remainingSeconds.value * 1000;
      isRunning.value = true;
      _phaseStartMs = Date.now();
      startInterval();
    }
  } else {
    remainingSeconds.value = saved.remainingSeconds;
  }
}

export function handleVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "hidden") {
    persistNow();
    return;
  }
  // Drift correction when the tab becomes visible again (F-Reliability).
  if (isRunning.value && endTimeMs !== null) {
    remainingSeconds.value = Math.ceil(remainingMs(endTimeMs, Date.now()) / 1000);
  }
}

export function handleBeforeUnload(): void {
  persistNow();
}

export const timerPhase = computed(() => phase.value);
export const progress = computed(() =>
  plannedSeconds.value <= 0 ? 0 : 1 - remainingSeconds.value / plannedSeconds.value,
);
export const sessionsCompletedInSet = computed(() => cycleIndex.value);

export function useTimer() {
  return {
    phase,
    isRunning,
    remainingSeconds,
    plannedSeconds,
    cycleIndex,
    sessionStartedAt,
    completedPhase,
    recentUnlocks,
    progress,
    start,
    pause,
    toggle,
    skip,
    reset,
    restoreRuntimeState,
  };
}
