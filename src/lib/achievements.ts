// Pre-defined achievements (docs/DATABASE.md) and their pure progress evaluators.
import type { Achievement, AchievementContext, AchievementDef } from '../types/index.ts';

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  { id: 'first-session', title: 'First Focus', description: 'Complete your first work session.' },
  { id: 'week-streak', title: 'Week Streak', description: '7 consecutive days meeting your daily goal.' },
  { id: 'centurion', title: 'Centurion', description: '100 total completed work sessions.' },
  { id: 'long-break', title: 'Long Break', description: 'Take your first long break.' },
  { id: 'night-owl', title: 'Night Owl', description: 'Start a session after 8 PM.' },
] as const;

export const ACHIEVEMENT_IDS = ACHIEVEMENT_DEFS.map((def) => def.id);

export interface AchievementStatus {
  def: AchievementDef;
  unlockedAt: string | null;
  progress: number;
}

/** Pure evaluator — safe to unit test without a database. */
export function computeProgress(id: string, ctx: AchievementContext): number {
  switch (id) {
    case 'first-session':
      return ctx.completedWorkSessions >= 1 ? 1 : 0;
    case 'week-streak':
      return ctx.currentStreak >= 7 ? 1 : Math.min(1, Math.max(0, ctx.currentStreak / 7));
    case 'centurion':
      return ctx.completedWorkSessions >= 100 ? 1 : ctx.completedWorkSessions / 100;
    case 'long-break':
      return ctx.experiencedLongBreak ? 1 : 0;
    case 'night-owl':
      return ctx.nightOwlSession ? 1 : 0;
    default:
      return 0;
  }
}

/** Merge stored achievement rows with the static defs for gallery display. */
export function mergeAchievements(stored: Achievement[]): AchievementStatus[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const row = stored.find((a) => a.id === def.id);
    return {
      def,
      unlockedAt: row?.unlockedAt ?? null,
      progress: row?.progress ?? 0,
    };
  });
}
