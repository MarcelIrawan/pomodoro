// Pure aggregation helpers over Session records — no DOM, no idb.
import type { Session } from "../types/index.ts";

export function completedWorkSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.type === "work" && s.completed);
}

export function totalFocusSeconds(sessions: Session[]): number {
  return completedWorkSessions(sessions).reduce((sum, s) => sum + s.actualDuration, 0);
}

export function sessionsOnDate(sessions: Session[], isoDate: string): Session[] {
  return sessions.filter((s) => s.startedAt.slice(0, 10) === isoDate);
}

export function focusSecondsOnDate(sessions: Session[], isoDate: string): number {
  return completedWorkSessions(sessionsOnDate(sessions, isoDate)).reduce(
    (sum, s) => sum + s.actualDuration,
    0,
  );
}

export function countSessionsOnDate(sessions: Session[], isoDate: string): number {
  return sessionsOnDate(sessions, isoDate).length;
}

export function totalCompletedWorkSessions(sessions: Session[]): number {
  return completedWorkSessions(sessions).length;
}

export function experiencedLongBreak(sessions: Session[]): boolean {
  return sessions.some((s) => s.type === "longBreak" && s.completed);
}

export function hasNightOwlSession(sessions: Session[]): boolean {
  return sessions.some((s) => {
    const hour = new Date(s.startedAt).getHours();
    return hour >= 20;
  });
}

/** Daily focus seconds keyed by 'YYYY-MM-DD' for the last `days` ending today. */
export function focusSecondsByDay(
  sessions: Session[],
  days: number,
  dateKeyFor: (d: Date) => string,
): Record<string, number> {
  const result: Record<string, number> = {};
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result[dateKeyFor(d)] = focusSecondsOnDate(sessions, dateKeyFor(d));
  }
  return result;
}

export interface HeatmapCell {
  date: string;
  focusSeconds: number;
  sessions: number;
}

/** Weeks x 7 grid of heatmap cells covering `weeks` weeks ending today. */
export function buildHeatmap(
  sessions: Session[],
  weeks: number,
  dateKeyFor: (d: Date) => string,
  dayIndexFor: (d: Date) => number,
): HeatmapCell[][] {
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  // Start the grid on the Monday of the first week, `weeks` back.
  const mondayOffset = (dayIndexFor(end) + 6) % 7;
  const start = new Date(end);
  start.setDate(start.getDate() - mondayOffset - (weeks - 1) * 7);

  const grid: HeatmapCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const key = dateKeyFor(day);
      const daySessions = sessionsOnDate(sessions, key);
      week.push({
        date: key,
        focusSeconds: focusSecondsOnDate(sessions, key),
        sessions: daySessions.length,
      });
    }
    grid.push(week);
  }
  return grid;
}
