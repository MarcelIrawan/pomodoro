// Keyval helpers for settings + runtime timer state in localStorage.
// Used to prevent theme flash and to survive tab close/reopen (F-Reliability).

export const SETTINGS_THEME_KEY = "pomodoro.settings.theme";
export const RUNTIME_STATE_KEY = "pomodoro.runtime.timer";

export interface RuntimeTimerState {
  phase: "work" | "shortBreak" | "longBreak";
  isRunning: boolean;
  remainingSeconds: number;
  plannedSeconds: number;
  cycleIndex: number;
  sessionStartedAt: string | null; // ISO, used for nudge + actualDuration calc
  savedAt: number; // epoch ms
}

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / private mode — non-fatal, timer still runs in memory.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readRuntimeTimerState(): RuntimeTimerState | null {
  const state = readJSON<RuntimeTimerState>(RUNTIME_STATE_KEY);
  if (!state) return null;
  if (typeof state.remainingSeconds !== "number" || typeof state.savedAt !== "number") {
    return null;
  }
  return state;
}

export function writeRuntimeTimerState(state: Omit<RuntimeTimerState, "savedAt">): void {
  writeJSON(RUNTIME_STATE_KEY, { ...state, savedAt: Date.now() });
}

export function clearRuntimeTimerState(): void {
  removeKey(RUNTIME_STATE_KEY);
}

export function writeThemeCache(theme: string, accent: string): void {
  writeJSON(SETTINGS_THEME_KEY, { theme, accent });
}
