// Streak badge (F12): flame + current streak + best streak.
import { IconFlame } from "../ui/Icons.tsx";

export function StreakBadge({ current, best }: { current: number; best: number }) {
  return (
    <div
      class="streak-badge"
      role="status"
      aria-label={`Current streak ${current} days, best ${best} days`}
    >
      <div class="streak-badge__flame" aria-hidden="true">
        <IconFlame size={40} />
      </div>
      <div class="streak-badge__numbers">
        <div class="streak-badge__current">{current}</div>
        <div class="streak-badge__label">day streak</div>
        <div class="streak-badge__best">best {best}</div>
      </div>
    </div>
  );
}
