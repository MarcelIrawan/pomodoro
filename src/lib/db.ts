/**
 * IndexedDB schema for Pomodoro App
 * Stores (per ADR-003 and REQUIREMENTS.md data model):
 *   - settings: keyval store for user preferences
 *   - sessions: objectStore keyed by uuid, tracks completed Pomodoro sessions
 *   - streaks: objectStore keyed by 'YYYY-MM-DD', tracks daily streak stats
 *   - achievements: objectStore keyed by achievementId, tracks unlocked achievements
 *
 * Migration strategy: on first run (v1), create all stores.
 * Subsequent version bumps handle schema additions/changes.
 * Interface types live in src/types/index.ts; keep them in sync with docs/DATABASE.md.
 */

import { type IDBPDatabase, openDB } from "idb";

import {
  type Achievement,
  DEFAULT_SETTINGS,
  DEFAULT_SETTINGS_KEY,
  type Session,
  type Settings,
  type StreakRecord,
} from "../types/index.ts";

// Schema versions
export const DB_VERSION = 1;
export const DB_NAME = "pomodoro-db";

// Store names
export const STORES = {
  SETTINGS: "settings",
  SESSIONS: "sessions",
  STREAKS: "streaks",
  ACHIEVEMENTS: "achievements",
  SOUND_PACKS: "soundPacks",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

interface DatabaseSchema {
  [STORES.SETTINGS]: { key: string; value: Settings };
  [STORES.SESSIONS]: {
    key: string;
    value: Session;
    indexes: {
      "by-type": string;
      "by-startedAt": string;
      // Boolean is not a valid IDB key: index is created per docs/DATABASE.md
      // but callers filter `completed` in memory.
      "by-completed": never;
    };
  };
  [STORES.STREAKS]: { key: string; value: StreakRecord };
  [STORES.ACHIEVEMENTS]: {
    key: string;
    value: Achievement;
    indexes: { "by-unlockedAt": string };
  };
  [STORES.SOUND_PACKS]: { key: string; value: unknown };
}

export class POMDatabase {
  private db: IDBPDatabase<DatabaseSchema> | null = null;

  async init(): Promise<IDBPDatabase<DatabaseSchema>> {
    if (this.db) return this.db;
    this.db = await this.#open();
    return this.db;
  }

  #open(): Promise<IDBPDatabase<DatabaseSchema>> {
    return openDB<DatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade: (db, oldVersion) => {
        // v1: initial schema — create all object stores
        if (oldVersion < 1) {
          POMDatabase.#createStores(db);
        }
        // Future migrations would go here as version bumps
      },
    });
  }

  static #createStores(db: IDBPDatabase<DatabaseSchema>) {
    // Settings: keyval store (no autoKey)
    db.createObjectStore(STORES.SETTINGS);

    // Sessions: objectStore keyed by uuid
    const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: "id" });
    sessionsStore.createIndex("by-type", "type", { unique: false });
    sessionsStore.createIndex("by-startedAt", "startedAt", { unique: false });
    sessionsStore.createIndex("by-completed", "completed", { unique: false });

    // Streaks: objectStore keyed by dateString 'YYYY-MM-DD'
    db.createObjectStore(STORES.STREAKS, { keyPath: "date" });

    // Achievements: objectStore keyed by achievementId
    const achievementsStore = db.createObjectStore(STORES.ACHIEVEMENTS, { keyPath: "id" });
    achievementsStore.createIndex("by-unlockedAt", "unlockedAt", { unique: false });

    // Sound packs: static bundled data (no user mutations needed at v1)
    db.createObjectStore(STORES.SOUND_PACKS);
  }

  private async requireDb(): Promise<IDBPDatabase<DatabaseSchema>> {
    return this.db ?? this.init();
  }

  // Settings API
  async getSettings(): Promise<Settings> {
    const db = await this.requireDb();
    const stored = await db.get(STORES.SETTINGS, DEFAULT_SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };
    // Merge stored over defaults so new fields appear without a migration.
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async updateSettings(partial: Partial<Settings>): Promise<void> {
    const db = await this.requireDb();
    const current = await this.getSettings();
    await db.put(STORES.SETTINGS, { ...current, ...partial }, DEFAULT_SETTINGS_KEY);
  }

  // Sessions API
  async addSession(session: Omit<Session, "id">): Promise<Session> {
    const db = await this.requireDb();
    const id = crypto.randomUUID();
    const record: Session = { ...session, id };
    await db.add(STORES.SESSIONS, record);
    return record;
  }

  async getSessions(includeCompleted?: boolean): Promise<Session[]> {
    const db = await this.requireDb();
    const all = await db.getAll(STORES.SESSIONS);
    if (includeCompleted === undefined) return all;
    return all.filter((s) => s.completed === includeCompleted);
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.requireDb();
    await db.delete(STORES.SESSIONS, id);
  }

  async getCompletedWorkSessions(): Promise<Session[]> {
    const db = await this.requireDb();
    const sessions = await db.getAllFromIndex(STORES.SESSIONS, "by-type", "work");
    return sessions.filter((s) => s.completed);
  }

  // Streaks API
  async getStreak(date: string): Promise<StreakRecord | undefined>;
  async getStreak(date?: undefined): Promise<StreakRecord[]>;
  async getStreak(date?: string): Promise<StreakRecord | StreakRecord[] | undefined> {
    const db = await this.requireDb();
    if (date) return db.get(STORES.STREAKS, date);
    return db.getAll(STORES.STREAKS);
  }

  async getAllStreaks(): Promise<StreakRecord[]> {
    const db = await this.requireDb();
    return db.getAll(STORES.STREAKS);
  }

  /** Atomically add focus seconds to today's streak record. Returns the updated record. */
  async addFocusToToday(focusSeconds: number, goalSeconds: number): Promise<StreakRecord> {
    const db = await this.requireDb();
    const today = new Date().toISOString().slice(0, 10);
    const tx = db.transaction(STORES.STREAKS, "readwrite");
    const store = tx.objectStore(STORES.STREAKS);
    const existing = (await store.get(today)) as StreakRecord | undefined;
    const sessionsCount = (existing?.sessionsCount ?? 0) + 1;
    const totalFocusSeconds = (existing?.totalFocusSeconds ?? 0) + focusSeconds;
    const record: StreakRecord = {
      date: today,
      sessionsCount,
      totalFocusSeconds,
      goalMet: goalSeconds > 0 && totalFocusSeconds >= goalSeconds,
    };
    await store.put(record, today);
    await tx.done;
    return record;
  }

  async upsertStreak(record: StreakRecord): Promise<void> {
    const db = await this.requireDb();
    await db.put(STORES.STREAKS, record, record.date);
  }

  // Achievements API
  async getAchievement(id: string): Promise<Achievement | undefined> {
    const db = await this.requireDb();
    return db.get(STORES.ACHIEVEMENTS, id);
  }

  async unlockAchievement(id: string, progress: number = 1): Promise<void> {
    const db = await this.requireDb();
    const existing = await db.get(STORES.ACHIEVEMENTS, id);
    const delta = Math.min(1, Math.max(0, progress));
    const nextProgress = Math.min(1, (existing?.progress ?? 0) + delta);
    // unlockedAt only stamped once progress actually reaches 1.
    const unlockedAt =
      existing?.unlockedAt ?? (nextProgress >= 1 ? new Date().toISOString() : null);
    await db.put(STORES.ACHIEVEMENTS, { id, unlockedAt, progress: nextProgress }, id);
  }

  async getAllAchievements(): Promise<Achievement[]> {
    const db = await this.requireDb();
    return db.getAll(STORES.ACHIEVEMENTS);
  }

  // Data management (F20: export / import / clear all)
  async exportAll(): Promise<{
    settings: Settings;
    sessions: Session[];
    streaks: StreakRecord[];
    achievements: Achievement[];
  }> {
    const db = await this.requireDb();
    const settings = await this.getSettings();
    const [sessions, streaks, achievements] = await Promise.all([
      db.getAll(STORES.SESSIONS),
      db.getAll(STORES.STREAKS),
      db.getAll(STORES.ACHIEVEMENTS),
    ]);
    return { settings, sessions, streaks, achievements };
  }

  async importAll(payload: {
    settings?: Settings;
    sessions?: Session[];
    streaks?: StreakRecord[];
    achievements?: Achievement[];
  }): Promise<void> {
    const db = await this.requireDb();
    const tx = db.transaction(
      [STORES.SETTINGS, STORES.SESSIONS, STORES.STREAKS, STORES.ACHIEVEMENTS],
      "readwrite",
    );
    if (payload.settings) {
      await tx.objectStore(STORES.SETTINGS).put({ ...payload.settings }, DEFAULT_SETTINGS_KEY);
    }
    if (payload.sessions) {
      for (const session of payload.sessions) {
        await tx.objectStore(STORES.SESSIONS).put(session);
      }
    }
    if (payload.streaks) {
      for (const streak of payload.streaks) {
        await tx.objectStore(STORES.STREAKS).put(streak);
      }
    }
    if (payload.achievements) {
      for (const achievement of payload.achievements) {
        await tx.objectStore(STORES.ACHIEVEMENTS).put(achievement);
      }
    }
    await tx.done;
  }

  async clearAll(): Promise<void> {
    const db = await this.requireDb();
    const tx = db.transaction(
      [STORES.SETTINGS, STORES.SESSIONS, STORES.STREAKS, STORES.ACHIEVEMENTS],
      "readwrite",
    );
    await Promise.all([
      tx.objectStore(STORES.SETTINGS).clear(),
      tx.objectStore(STORES.SESSIONS).clear(),
      tx.objectStore(STORES.STREAKS).clear(),
      tx.objectStore(STORES.ACHIEVEMENTS).clear(),
    ]);
    await tx.done;
  }
}

// Export a singleton instance — consumers import this and call .init()
export const db = new POMDatabase();
