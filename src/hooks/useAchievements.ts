// Achievement loading + unlock evaluation (docs/DATABASE.md achievement IDs).
import { computed, signal } from '@preact/signals';

import { db } from '../lib/db.ts';
import { ACHIEVEMENT_DEFS, computeProgress, mergeAchievements } from '../lib/achievements.ts';
import type { Achievement, AchievementContext, AchievementDef } from '../types/index.ts';

const achievementsState = signal<Achievement[]>([]);
const loaded = signal(false);

export async function loadAchievements(): Promise<Achievement[]> {
  const stored = await db.getAllAchievements();
  achievementsState.value = stored;
  loaded.value = true;
  return stored;
}

/**
 * Evaluate all achievements against the current context.
 * Returns defs that became fully unlocked by this evaluation (for toasts).
 */
export async function evaluateAchievements(ctx: AchievementContext): Promise<AchievementDef[]> {
  const stored = await db.getAllAchievements();
  const byId = new Map(stored.map((a) => [a.id, a] as const));
  const newlyUnlocked: AchievementDef[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    const target = computeProgress(def.id, ctx);
    const row = byId.get(def.id);
    const current = row?.progress ?? 0;
    const wasUnlocked = (row?.progress ?? 0) >= 1 && row?.unlockedAt != null;

    if (target >= 1 && !wasUnlocked) {
      await db.unlockAchievement(def.id, target - current);
      newlyUnlocked.push(def);
    } else if (target > current) {
      await db.unlockAchievement(def.id, target - current);
    }
  }

  achievementsState.value = await db.getAllAchievements();
  return newlyUnlocked;
}

export async function refreshAchievements(): Promise<void> {
  await loadAchievements();
}

export const mergedAchievements = computed(() => mergeAchievements(achievementsState.value));

export function useAchievements() {
  return {
    achievements: achievementsState,
    merged: mergedAchievements,
    ready: computed(() => loaded.value),
  };
}
