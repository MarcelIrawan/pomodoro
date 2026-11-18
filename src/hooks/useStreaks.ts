// Streak calculation (F12, docs/REQUIREMENTS.md derived rules).
// Current streak = consecutive goalMet days ending at the last active date.

import { computed, signal } from "@preact/signals";
import { daysBetween, todayISODate } from "../lib/date.ts";
import { db } from "../lib/db.ts";
import type { StreakRecord } from "../types/index.ts";
import { settings, updateSettings } from "./useSettings.ts";

const streaksState = signal<StreakRecord[]>([]);
const loaded = signal(false);

export async function loadStreaks(): Promise<StreakRecord[]> {
  const records = await db.getAllStreaks();
  streaksState.value = records;
  loaded.value = true;
  return records;
}

export async function recordFocusForToday(focusSeconds: number): Promise<void> {
  const today = todayISODate();
  const existing = (await db.getStreak(today)) as StreakRecord | undefined;
  const sessionsCount = (existing?.sessionsCount ?? 0) + 1;
  const totalFocusSeconds = (existing?.totalFocusSeconds ?? 0) + focusSeconds;
  const goalSeconds = Math.max(0, settings.value.dailyGoalMinutes) * 60;
  const record: StreakRecord = {
    date: today,
    sessionsCount,
    totalFocusSeconds,
    goalMet: goalSeconds > 0 && totalFocusSeconds >= goalSeconds,
  };
  await db.upsertStreak(record);
  await updateSettings({
    streakStartDate: settings.value.streakStartDate ?? today,
    lastActiveDate: today,
  });
  streaksState.value = await db.getAllStreaks();
}

/** Current streak: consecutive goalMet days ending at lastActiveDate (or today). */
function computeCurrentStreak(records: StreakRecord[]): number {
  const byDate = new Map(records.map((r) => [r.date, r] as const));
  const today = todayISODate();
  let cursor = Date.parse(`${today}T12:00:00`);
  let streak = 0;
  const todayRecord = byDate.get(today);
  if (todayRecord && !todayRecord.goalMet) {
    // Today hasn't met the goal yet — streak still runs through yesterday.
    cursor -= 86_400_000;
  }
  for (let i = 0; i < 10_000; i += 1) {
    const d = new Date(cursor);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const record = byDate.get(key);
    if (!record?.goalMet) break;
    streak += 1;
    cursor -= 86_400_000;
  }
  return streak;
}

/** Best streak ever, from raw records sorted by date. */
function computeBestStreak(records: StreakRecord[]): number {
  const dates = records
    .filter((r) => r.goalMet)
    .map((r) => r.date)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of dates) {
    if (prev && daysBetween(date, prev) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export async function refreshStreaks(): Promise<void> {
  await loadStreaks();
}

export const currentStreak = computed(() => computeCurrentStreak(streaksState.value));
export const bestStreak = computed(() => computeBestStreak(streaksState.value));
export const todayStreak = computed<StreakRecord | undefined>(() =>
  streaksState.value.find((r) => r.date === todayISODate()),
);

export function useStreaks() {
  return {
    streaks: streaksState,
    ready: computed(() => loaded.value),
    currentStreak,
    bestStreak,
    todayStreak,
  };
}
