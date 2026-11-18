// Monthly line chart of sessions per day (F9, ADR-005 hand-rolled SVG).
import { linePath, linePoints } from "../../lib/charts.ts";
import { monthDayLabel } from "../../lib/date.ts";

export interface DaySessions {
  day: string;
  sessions: number;
}

export function MonthlyLineChart({ data }: { data: DaySessions[] }) {
  const width = 320;
  const height = 140;
  const pad = 22;
  const values = data.map((d) => d.sessions);
  const points = linePoints(values, width, height, pad);
  const path = linePath(points);
  const max = Math.max(1, ...values);

  return (
    <svg
      class="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Sessions per day for the last 30 days"
    >
      <title>Sessions per day, last 30 days</title>
      <desc>Line chart of sessions completed per day for the last 30 days.</desc>
      {[0.25, 0.5, 0.75, 1].map((fraction) => (
        <line
          key={fraction}
          x1={pad}
          x2={width - pad}
          y1={pad + (height - pad * 2) * (1 - fraction)}
          y2={pad + (height - pad * 2) * (1 - fraction)}
          class="chart__gridline"
        />
      ))}
      {path && <path d={path} class="chart__line" fill="none" strokeWidth={2.5} />}
      {points.map((point, index) => {
        const isPeak = values[index] === max && max > 0;
        return (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={isPeak ? 4 : 2.5}
            class="chart__dot"
            aria-label={`${monthDayLabel(data[index]?.day ?? "")}: ${values[index] ?? 0} sessions`}
          />
        );
      })}
      <text x={pad} y={12} class="chart__axis">{`${max} sess`}</text>
      <text x={width - pad} y={height - 4} class="chart__axis" textAnchor="end">
        {monthDayLabel(data[data.length - 1]?.day ?? "")}
      </text>
    </svg>
  );
}
