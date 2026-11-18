// Weekly bar chart of focus minutes (F9, ADR-005 hand-rolled SVG).
import { barBoxes } from '../../lib/charts.ts';
import { shortWeekdayLabel } from '../../lib/date.ts';

export interface DayFocus {
  day: string;
  focusSeconds: number;
}

export function WeeklyBarChart({ data }: { data: DayFocus[] }) {
  const width = 320;
  const height = 140;
  const pad = 18;
  const values = data.map((d) => d.focusSeconds / 60);
  const boxes = barBoxes(values, width, height, pad);
  const max = Math.max(1, ...values);

  return (
    <svg
      class="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Focus minutes for each of the last 7 days"
    >
      <title>Focus minutes, last 7 days</title>
      <desc>Bar chart of daily focus minutes for the last 7 days.</desc>
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
      {boxes.map((box, index) => {
        const value = values[index] ?? 0;
        const day = data[index]?.day ?? '';
        return (
          <g key={index}>
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              rx={4}
              class="chart__bar"
              aria-label={`${shortWeekdayLabel(day)}: ${Math.round(value)} minutes`}
            />
            <text
              x={box.x + box.width / 2}
              y={height - 4}
              class="chart__label"
              textAnchor="middle"
            >
              {shortWeekdayLabel(day)}
            </text>
          </g>
        );
      })}
      <text x={pad} y={12} class="chart__axis">
        {`${max.toFixed(0)} min`}
      </text>
    </svg>
  );
}
