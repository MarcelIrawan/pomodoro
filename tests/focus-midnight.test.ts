// @vitest-environment jsdom
// Regression: sessions use a UTC ISO `startedAt`, but "today" is a LOCAL calendar day.
// In UTC+7 (e.g. Pontianak) anything done between 00:00 and 07:00 local was missing from
// "today focus". Timezone is pinned so this test is meaningful on any machine.
process.env.TZ = "Asia/Pontianak";

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("today focus around local midnight (UTC+7)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date("2026-11-18T00:30:00+07:00"));
  });
  afterEach(() => vi.useRealTimers());

  it("counts a session started at 00:30 local as today", async () => {
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
    const t = timer.useTimer();
    t.start();
    await vi.advanceTimersByTimeAsync(61_000);
    await db.getSessions(); // let pending IndexedDB writes settle before asserting
    await vi.advanceTimersByTimeAsync(1_000);
    expect(sessions.useSessions().stats.value.todayFocusSeconds).toBe(60);
  });
});