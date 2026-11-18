// Circular progress ring (F4): accent arc depletes as the timer counts down.
import { formatClock } from '../../lib/date.ts';
import { ringGeometry } from '../../lib/charts.ts';

export interface TimerRingProps {
  size: number;
  progress: number; // 0..1 elapsed
  remainingSeconds: number;
  phaseLabel: string;
  cycleLabel: string;
}

export function TimerRing({ size, progress, remainingSeconds, phaseLabel, cycleLabel }: TimerRingProps) {
  const strokeWidth = Math.max(10, Math.round(size * 0.055));
  const { cx, cy, r, circumference, dashOffset } = ringGeometry(size, strokeWidth, progress);

  return (
    <div class="timer-ring" role="img" aria-label={`${phaseLabel} timer, ${formatClock(remainingSeconds)} remaining. ${cycleLabel}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          class="timer-ring__track"
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          class="timer-ring__value"
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div class="timer-ring__center">
        <div class="timer-ring__time" aria-hidden="true">{formatClock(remainingSeconds)}</div>
        <div class="timer-ring__phase" aria-hidden="true">{phaseLabel}</div>
      </div>
    </div>
  );
}
