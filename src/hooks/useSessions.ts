// Sessions CRUD + derived histogram stats (F8, F9, F10).
// Signals mirror IndexedDB; stats are computed, never stored (docs/DATABASE.md).

import { computed, signal } from "@preact/signals";
import { todayISODate, toISODate } from "../lib/date.ts";
import { db } from "../lib/db.ts";
import { completedWorkSessions, focusSecondsByDay, totalFocusSeconds } from "../lib/stats.ts";
import type { Session } from "../types/index.ts";

const sessionsState = signal<Session[]>([]);
const loaded = signal(false);

export async function loadSessions(): Promise<Session[]> {
  const sessions = await db.getSessions();
  // Newest first so screens can slice freely.
  sessions.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  sessionsState.value = sessions;
  loaded.value = true;
  return sessions;
}

export async function addSession(input: Omit<Session, "id">): Promise<Session> {
  const record = await db.addSession(input);
  sessionsState.value = [record, ...sessionsState.value].sort((a, b) =>
    a.startedAt < b.startedAt ? 1 : -1,
  );
  return record;
}

export async function deleteSession(id: string): Promise<void> {
  await db.deleteSession(id);
  sessionsState.value = sessionsState.value.filter((s) => s.id !== id);
}

export interface StatsSnapshot {
  totalFocusSeconds: number;
  totalCompletedWork: number;
  todayFocusSeconds: number;
  thisWeek: { day: string; focusSeconds: number }[];
  sessionsThisWeek: number;
}

const STAT_WINDOW_DAYS = 7;

function weekHistogram(sessions: Session[]): { day: string; focusSeconds: number }[] {
  const histogram = focusSecondsByDay(sessions, STAT_WINDOW_DAYS, toISODate);
  return Object.entries(histogram).map(([day, focusSeconds]) => ({ day, focusSeconds }));
}

const statsSnapshot = computed<StatsSnapshot>(() => {
  const sessions = sessionsState.value;
  const todayKey = todayISODate();
  const completedWork = completedWorkSessions(sessions);
  const todayFocus = completedWork
    .filter((s) => s.startedAt.slice(0, 10) === todayKey)
    .reduce((sum, s) => sum + s.actualDuration, 0);
  const histogram = weekHistogram(sessions);
  const weekSessions = sessions.filter((s) =>
    histogram.some((h) => h.day === s.startedAt.slice(0, 10)),
  ).length;
  return {
    totalFocusSeconds: totalFocusSeconds(sessions),
    totalCompletedWork: completedWork.length,
    todayFocusSeconds: todayFocus,
    thisWeek: histogram,
    sessionsThisWeek: weekSessions,
  };
});

const monthHistogram = computed<{ day: string; sessions: number }[]>(() => {
  const sessions = sessionsState.value;
  const histogram = focusSecondsByDay(sessions, 30, toISODate);
  return Object.keys(histogram).map((day) => {
    const count = sessions.filter((s) => s.startedAt.slice(0, 10) === day).length;
    return { day, sessions: count };
  });
});

export function allTags(): string[] {
  const tags = new Set<string>();
  for (const session of sessionsState.value) {
    for (const tag of session.tags) tags.add(tag);
  }
  return [...tags].sort();
}

/** Re-read sessions from IndexedDB (after bulk import or clear). */
export async function reloadSessions(): Promise<void> {
  await loadSessions();
}

export function useSessions() {
  return {
    sessions: sessionsState,
    ready: computed(() => loaded.value),
    stats: statsSnapshot,
    monthHistogram,
    tags: computed(() => allTags()),
    workCount: computed(() => completedWorkSessions(sessionsState.value).length),
    workSessions: computed(() => completedWorkSessions(sessionsState.value)),
  };
}

export const sessions = sessionsState;
