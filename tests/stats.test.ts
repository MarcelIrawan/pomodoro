import { describe, expect, it } from 'vitest';

import {
  buildHeatmap,
  completedWorkSessions,
  experiencedLongBreak,
  focusSecondsByDay,
  focusSecondsOnDate,
  hasNightOwlSession,
  sessionsOnDate,
  totalCompletedWorkSessions,
  totalFocusSeconds,
} from '../src/lib/stats.ts';
import type { Session } from '../src/types/index.ts';

let seq = 0;
function makeSession(overrides: Partial<Session> = {}): Session {
  seq += 1;
  return {
    id: `session-${seq}`,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    type: 'work',
    plannedDuration: 25,
    actualDuration: 1500,
    completed: true,
    tags: [],
    notes: null,
    cycleIndex: 0,
    ...overrides,
  };
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

describe('stats', () => {
  it('completedWorkSessions keeps only completed work sessions', () => {
    const list = [
      makeSession({ type: 'work', completed: true }),
      makeSession({ type: 'work', completed: false }),
      makeSession({ type: 'shortBreak', completed: true }),
    ];
    expect(completedWorkSessions(list)).toHaveLength(1);
  });

  it('totalFocusSeconds sums completed work sessions only', () => {
    const list = [
      makeSession({ type: 'work', actualDuration: 100 }),
      makeSession({ type: 'work', actualDuration: 250 }),
      makeSession({ type: 'work', actualDuration: 999, completed: false }),
      makeSession({ type: 'longBreak', actualDuration: 900 }),
    ];
    expect(totalFocusSeconds(list)).toBe(350);
  });

  it('sessionsOnDate and focusSecondsOnDate filter by day', () => {
    const day = '2026-11-01';
    const list = [
      makeSession({ startedAt: `${day}T09:00:00.000Z`, actualDuration: 120 }),
      makeSession({ startedAt: `${day}T12:00:00.000Z`, actualDuration: 80, completed: false }),
      makeSession({ startedAt: '2026-10-31T09:00:00.000Z', actualDuration: 999 }),
    ];
    expect(sessionsOnDate(list, day)).toHaveLength(2);
    expect(focusSecondsOnDate(list, day)).toBe(120); // skipped session excluded
  });

  it('totalCompletedWorkSessions counts only completed work', () => {
    const list = [
      makeSession({ completed: true }),
      makeSession({ completed: false }),
      makeSession({ type: 'shortBreak', completed: true }),
    ];
    expect(totalCompletedWorkSessions(list)).toBe(1);
  });

  it('experiencedLongBreak requires a completed long break', () => {
    expect(experiencedLongBreak([makeSession({ type: 'longBreak', completed: true })])).toBe(true);
    expect(experiencedLongBreak([makeSession({ type: 'longBreak', completed: false })])).toBe(false);
    expect(experiencedLongBreak([])).toBe(false);
  });

  it('hasNightOwlSession detects sessions starting at 8 PM or later', () => {
    const evening = new Date();
    evening.setHours(21, 30, 0, 0);
    const morning = makeSession({ startedAt: new Date().toISOString() });
    morning.startedAt = new Date(new Date().setHours(9, 0, 0, 0)).toISOString();
    expect(hasNightOwlSession([...[morning], makeSession({ startedAt: evening.toISOString() })])).toBe(true);
    expect(hasNightOwlSession([morning])).toBe(false);
  });

  it('focusSecondsByDay returns an entry for every day in the window', () => {
    const histogram = focusSecondsByDay([], 7, iso);
    expect(Object.keys(histogram)).toHaveLength(7);
    expect(Object.values(histogram).every((v) => v === 0)).toBe(true);
  });

  it('buildHeatmap returns weeks x 7 cells with monotonic dates', () => {
    const grid = buildHeatmap([], 4, iso, (d) => d.getDay());
    expect(grid).toHaveLength(4);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    const dates = grid.flat().map((c) => c.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});
