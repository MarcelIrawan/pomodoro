// Phase badge with 4-cycle progress (dots show where you are in the set).

import type { Phase } from "../../types/index.ts";
import { cn } from "../../utils/cn.ts";

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "work":
      return "Focus";
    case "shortBreak":
      return "Short break";
    case "longBreak":
      return "Long break";
  }
}

export function PhaseBadge({
  phase,
  cycleIndex,
  isRunning,
}: {
  phase: Phase;
  cycleIndex: number;
  isRunning: boolean;
}) {
  const dots = [0, 1, 2, 3];
  return (
    <div class={cn("phase-badge", `phase-badge--${phase}`)} role="status" aria-live="polite">
      <span class="phase-badge__label">{phaseLabel(phase)}</span>
      {phase === "work" && (
        <span class="phase-badge__dots" aria-label={`Pomodoro ${cycleIndex + 1} of 4`}>
          {dots.map((i) => (
            <span
              key={i}
              class={cn("phase-badge__dot", i < (cycleIndex % 4) + 1 && "phase-badge__dot--filled")}
              aria-hidden="true"
            />
          ))}
        </span>
      )}
      <span class="phase-badge__state">
        {isRunning ? "Running" : phase === "work" ? "Ready" : "Rest"}
      </span>
    </div>
  );
}
