// All TypeScript interfaces for the Pomodoro app.
// Keep in sync with docs/DATABASE.md and docs/REQUIREMENTS.md data model.

export type ThemeName = "light" | "dark" | "system";
export type AccentName = "coral" | "mint" | "lavender" | "sunset" | "ocean";
export type SoundPackName = "classic" | "nature" | "arcade" | "lofi";
export type Phase = "work" | "shortBreak" | "longBreak";

export interface Settings {
  theme: ThemeName;
  accent: AccentName;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  dailyGoalMinutes: number;
  soundPack: SoundPackName;
  soundVolume: number;
  tickSound: boolean;
  notificationsEnabled: boolean;
  reducedMotion: boolean;
  streakStartDate: string | null;
  lastActiveDate: string | null;
  unlockedThemes: string[];
  unlockedCharacters: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accent: "coral",
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoStartBreaks: false,
  autoStartWork: false,
  dailyGoalMinutes: 120,
  soundPack: "classic",
  soundVolume: 0.5,
  tickSound: true,
  notificationsEnabled: true,
  reducedMotion: false,
  streakStartDate: null,
  lastActiveDate: null,
  unlockedThemes: [],
  unlockedCharacters: [],
};

export const DEFAULT_SETTINGS_KEY = "default";

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string | null;
  type: Phase;
  plannedDuration: number; // minutes
  actualDuration: number; // seconds
  completed: boolean;
  tags: string[];
  notes: string | null;
  cycleIndex: number;
}

export interface StreakRecord {
  date: string; // YYYY-MM-DD
  sessionsCount: number;
  totalFocusSeconds: number;
  goalMet: boolean;
}

export interface Achievement {
  id: string;
  unlockedAt: string | null;
  progress: number; // 0–1
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export interface AchievementContext {
  completedWorkSessions: number;
  currentStreak: number;
  experiencedLongBreak: boolean;
  nightOwlSession: boolean;
}

export interface SoundPack {
  id: SoundPackName;
  label: string;
  description: string;
}

export const SOUND_PACKS: SoundPack[] = [
  { id: "classic", label: "Classic", description: "Warm major chords with a soft tick." },
  { id: "nature", label: "Nature", description: "Bird calls and gentle chimes." },
  { id: "arcade", label: "Arcade", description: "8-bit fanfares and blips." },
  { id: "lofi", label: "Lofi", description: "Vinyl crackle with mellow chords." },
];

export interface AccentPalette {
  id: AccentName;
  label: string;
  swatch: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  { id: "coral", label: "Coral", swatch: "#ff7a59" },
  { id: "mint", label: "Mint", swatch: "#3ddc97" },
  { id: "lavender", label: "Lavender", swatch: "#a78bfa" },
  { id: "sunset", label: "Sunset", swatch: "#fb923c" },
  { id: "ocean", label: "Ocean", swatch: "#38bdf8" },
];

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  settings: Settings;
  sessions: Session[];
  streaks: StreakRecord[];
  achievements: Achievement[];
}
