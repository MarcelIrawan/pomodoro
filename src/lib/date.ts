// Date helpers for local-time ISO dates and calendar-aware ranges.
// All dates are local time; 'YYYY-MM-DD' strings are date-only keys.

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function parseISODate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(later: string, earlier: string): number {
  const a = startOfDay(parseISODate(later)).getTime();
  const b = startOfDay(parseISODate(earlier)).getTime();
  return Math.round((a - b) / 86_400_000);
}

export function isConsecutive(later: string, earlier: string): boolean {
  return daysBetween(later, earlier) === 1;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/** Start of week (Monday) through end of week (Sunday, exclusive = next Monday). */
export function weekRange(now: Date = new Date()): DateRange {
  const day = now.getDay(); // 0=Sun..6=Sat
  const mondayOffset = (day + 6) % 7;
  const start = startOfDay(addDays(now, -mondayOffset));
  const end = addDays(start, 7);
  return { start, end };
}

/** Start of month through next month boundary (exclusive). */
export function monthRange(now: Date = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

export function isInRange(iso: string, start: Date, end: Date): boolean {
  const ts = new Date(iso).getTime();
  return ts >= start.getTime() && ts < end.getTime();
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function shortWeekdayLabel(iso: string): string {
  const d = new Date(iso);
  const idx = Number.isNaN(d.getTime()) ? 0 : d.getDay();
  return WEEKDAY_SHORT[idx] ?? 'Sun';
}

export function monthDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Format a duration in seconds as e.g. "1h 24m" or "45m". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/** mm:ss clock used by the timer ring. */
export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
