import { describe, expect, it } from 'vitest';

import {
  isLongBreakDue,
  nextPhase,
  phasePlannedSeconds,
  rehydrateRemaining,
  remainingMs,
} from '../src/lib/timer-math.ts';

describe('timer-math', () => {
  describe('remainingMs', () => {
    it('returns the exact difference when time is left', () => {
      expect(remainingMs(10_000, 3_000)).toBe(7_000);
    });
    it('clamps to zero when expired', () => {
      expect(remainingMs(10_000, 10_000)).toBe(0);
      expect(remainingMs(10_000, 15_000)).toBe(0);
    });
  });

  describe('rehydrateRemaining', () => {
    it('subtracts elapsed wall-clock seconds', () => {
      expect(rehydrateRemaining(100, 30_000)).toBe(70);
    });
    it('clamps at zero for long closures', () => {
      expect(rehydrateRemaining(60, 3600_000)).toBe(0);
    });
  });

  describe('phasePlannedSeconds', () => {
    it('maps minutes to seconds per phase', () => {
      expect(phasePlannedSeconds('work', 25, 5, 15)).toBe(1500);
      expect(phasePlannedSeconds('shortBreak', 25, 5, 15)).toBe(300);
      expect(phasePlannedSeconds('longBreak', 25, 5, 15)).toBe(900);
    });
  });

  describe('nextPhase', () => {
    it('work -> short break and advances the cycle for 0-2', () => {
      expect(nextPhase('work', 0)).toEqual({ phase: 'shortBreak', cycleIndex: 1 });
      expect(nextPhase('work', 1)).toEqual({ phase: 'shortBreak', cycleIndex: 2 });
      expect(nextPhase('work', 2)).toEqual({ phase: 'shortBreak', cycleIndex: 3 });
    });
    it('4th work session leads to a long break', () => {
      expect(nextPhase('work', 3)).toEqual({ phase: 'longBreak', cycleIndex: 3 });
    });
    it('long break -> work with the cycle reset', () => {
      expect(nextPhase('longBreak', 3)).toEqual({ phase: 'work', cycleIndex: 0 });
    });
    it('short break -> work without advancing the cycle', () => {
      expect(nextPhase('shortBreak', 2)).toEqual({ phase: 'work', cycleIndex: 2 });
    });
  });

  describe('isLongBreakDue', () => {
    it('is true only on the 4th session of a set', () => {
      expect(isLongBreakDue(0)).toBe(false);
      expect(isLongBreakDue(1)).toBe(false);
      expect(isLongBreakDue(2)).toBe(false);
      expect(isLongBreakDue(3)).toBe(true);
      expect(isLongBreakDue(7)).toBe(true);
    });
  });
});
