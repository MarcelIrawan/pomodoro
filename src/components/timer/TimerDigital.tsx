// Digital time readout — visually hidden but announced for screen readers.
import { formatClock } from "../../lib/date.ts";

export function TimerDigital({
  remainingSeconds,
  label,
}: {
  remainingSeconds: number;
  label: string;
}) {
  return (
    <div class="timer-digital" aria-live="polite" aria-atomic="true">
      <span class="timer-digital__time" aria-hidden="true">
        {formatClock(remainingSeconds)}
      </span>
      <span class="sr-only">{`${label}: ${formatClock(remainingSeconds)} remaining`}</span>
    </div>
  );
}
