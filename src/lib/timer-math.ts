// Timer math helpers — pure functions, unit tested.
import type { Phase } from '../types/index.ts';
import { formatClock } from './date.ts';

export function remainingMs(endTimeMs: number, nowMs: number): number {
  return Math.max(0, endTimeMs - nowMs);
}

/** Apply elapsed wall-clock time to a stored paused timer (survives tab close/reopen). */
export function rehydrateRemaining(savedRemainingSeconds: number, elapsedMs: number): number {
  return Math.max(0, savedRemainingSeconds - elapsedMs / 1000);
}

export function phasePlannedSeconds(
  phase: Phase,
  workMinutes: number,
  shortBreakMinutes: number,
  longBreakMinutes: number,
): number {
  switch (phase) {
    case 'work':
      return workMinutes * 60;
    case 'shortBreak':
      return shortBreakMinutes * 60;
    case 'longBreak':
      return longBreakMinutes * 60;
  }
}

/**
 * Advance the cycle after `completedPhase`.
 * `cycleIndex` is the 0-based index of the current work session within its 4-session set.
 * Long break follows work at cycleIndex % 4 === 3 (docs/REQUIREMENTS.md derived rules).
 */
export function nextPhase(
  completedPhase: Phase,
  cycleIndex: number,
): { phase: Phase; cycleIndex: number } {
  if (completedPhase === 'work') {
    if (cycleIndex % 4 === 3) return { phase: 'longBreak', cycleIndex };
    return { phase: 'shortBreak', cycleIndex: cycleIndex + 1 };
  }
  if (completedPhase === 'longBreak') return { phase: 'work', cycleIndex: 0 };
  return { phase: 'work', cycleIndex };
}

/** True when the work session at `cycleIndex` leads into a long break. */
export function isLongBreakDue(cycleIndex: number): boolean {
  return cycleIndex % 4 === 3;
}

export { formatClock };
