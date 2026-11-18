// Year heatmap of daily focus time (F9, GitHub-style contribution grid).

import { toISODate } from "../../lib/date.ts";
import { buildHeatmap } from "../../lib/stats.ts";
import type { Session } from "../../types/index.ts";
import { cn } from "../../utils/cn.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CalendarHeatmap({
  sessions,
  goalMinutes,
}: {
  sessions: Session[];
  goalMinutes: number;
}) {
  const weeks = buildHeatmap(sessions, 26, toISODate, (d) => d.getDay());
  const goalSeconds = Math.max(1, goalMinutes) * 60;

  const level = (focusSeconds: number): 0 | 1 | 2 | 3 | 4 => {
    if (focusSeconds <= 0) return 0;
    const ratio = focusSeconds / goalSeconds;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 1) return 3;
    return 4;
  };

  // Month labels along the top, positioned per week column.
  const monthLabels = weeks.map((week, _index) => {
    const first = week[0];
    if (!first) return null;
    const date = new Date(`${first.date}T12:00:00`);
    return date.getDate() <= 7 ? MONTHS[date.getMonth()] : null;
  });

  return (
    <div class="heatmap" role="img" aria-label="Focus heatmap for the last 26 weeks">
      <div class="heatmap__months">
        {monthLabels.map((label, index) => (
          <span key={index} class="heatmap__month">
            {label ?? ""}
          </span>
        ))}
      </div>
      <div class="heatmap__grid">
        {weeks.map((week, w) => (
          <div key={w} class="heatmap__week">
            {week.map((cell) => (
              <div
                key={cell.date}
                class={cn("heatmap__cell", `heatmap__cell--${level(cell.focusSeconds)}`)}
                title={`${cell.date}: ${cell.sessions} session${cell.sessions === 1 ? "" : "s"}, ${Math.round(cell.focusSeconds / 60)} min focus`}
              />
            ))}
          </div>
        ))}
      </div>
      <div class="heatmap__legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} class={cn("heatmap__cell", `heatmap__cell--${l}`)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
