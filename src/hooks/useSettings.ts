// Settings signal + persistence (ADR-003, F16/F18/F20).
// Applies theme/accent/reduced-motion to the document as a side effect of every update.

import { computed, signal } from '@preact/signals';

import { db } from '../lib/db.ts';
import { writeThemeCache } from '../lib/storage.ts';
import { ACCENT_PALETTES, DEFAULT_SETTINGS, type Settings } from '../types/index.ts';

const settingsState = signal<Settings>({ ...DEFAULT_SETTINGS });
const isReady = signal(false);

const ACCENT_HEX: Record<string, string> = Object.fromEntries(
  ACCENT_PALETTES.map((a) => [a.id, a.swatch]),
);

export function resolveTheme(theme: Settings['theme']): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function applyToDocument(settings: Settings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(settings.theme);
  root.dataset.accent = settings.accent;
  root.classList.toggle('reduced-motion', settings.reducedMotion);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', ACCENT_HEX[settings.accent] ?? '#2b211f');
  }
}

export async function loadSettings(): Promise<Settings> {
  const stored = await db.getSettings();
  settingsState.value = stored;
  applyToDocument(stored);
  writeThemeCache(stored.theme, stored.accent);
  isReady.value = true;
  return stored;
}

export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const next = { ...settingsState.value, ...partial };
  // Optimistic UI — persist after; IndexedDB write failures surface via the promise.
  settingsState.value = next;
  applyToDocument(next);
  writeThemeCache(next.theme, next.accent);
  await db.updateSettings(partial);
}

/** For after a bulk import: replace the signal with freshly read values. */
export async function refreshSettings(): Promise<void> {
  await loadSettings();
}

export function useSettings() {
  return {
    settings: settingsState,
    ready: computed(() => isReady.value),
    update: updateSettings,
  };
}

export const settings = settingsState;
