// @vitest-environment jsdom
// Regression: finishing a focus session must record exactly ONE session, add today's
// focus ONCE, and leave the "running at 00:00" state (no repeated adds until pause/skip).
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function boot() {
  vi.resetModules();
  localStorage.clear();
  globalThis.indexedDB = new IDBFactory();
  (globalThis as unknown as { HTMLMediaElement: { prototype: { play: () => Promise<void> } } })
    .HTMLMediaElement.prototype.play = () => Promise.resolve();
  const timer = await import("../src/hooks/useTimer.ts");
  const sessions = await import("../src/hooks/useSessions.ts");
  const settings = await import("../src/hooks/useSettings.ts");
  const { db } = await import("../src/lib/db.ts");
  await db.init();
  await settings.loadSettings();
  await sessions.loadSessions();
  await settings.updateSettings({ workMinutes: 1, soundEnabled: false });
  timer.restoreRuntimeState();
  return { timer: timer.useTimer(), sessions, db };
}

describe("focus session completion", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date("2026-11-18T10:00:00+07:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("records one session and stops running at 00:00", async () => {
    const { timer, sessions, db } = await boot();
    timer.start();
    await vi.advanceTimersByTimeAsync(61_000);
    await vi.advanceTimersByTimeAsync(10_000); // keep the clock going: must not add more
    const all = await db.getSessions();
    expect(all.filter((s) => s.type === "work")).toHaveLength(1);
    expect(sessions.useSessions().stats.value.todayFocusSeconds).toBe(60);
    expect(timer.phase.value).toBe("shortBreak");
    expect(timer.isRunning.value).toBe(false);
    const streaks = await db.getAllStreaks();
    expect(streaks).toHaveLength(1);
    expect(streaks[0]?.sessionsCount).toBe(1);
  });
});