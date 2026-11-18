// Minimal shared focus-mode state (F7): hides UI chrome, timer + minimal controls only.
import { signal } from "@preact/signals";

export const focusMode = signal(false);
