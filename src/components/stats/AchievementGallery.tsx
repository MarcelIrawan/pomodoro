// Achievement gallery (F13): unlocked/locked cards with progress bars.
import { mergedAchievements } from "../../hooks/useAchievements.ts";
import { cn } from "../../utils/cn.ts";
import { IconLock, IconTrophy } from "../ui/Icons.tsx";

export function AchievementGallery() {
  const merged = mergedAchievements.value;

  return (
    <div class="achievement-gallery">
      {merged.map(({ def, unlockedAt, progress }) => {
        const unlocked = unlockedAt !== null || progress >= 1;
        return (
          <article
            key={def.id}
            class={cn("achievement", unlocked && "achievement--unlocked")}
            aria-label={`${def.title}: ${unlocked ? "unlocked" : `${Math.round(progress * 100)} percent complete`}`}
          >
            <div class="achievement__icon" aria-hidden="true">
              {unlocked ? <IconTrophy size={26} /> : <IconLock size={26} />}
            </div>
            <div class="achievement__body">
              <h4 class="achievement__title">{def.title}</h4>
              <p class="achievement__desc">{def.description}</p>
              {!unlocked && (
                <div
                  class="achievement__progress"
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${def.title} progress`}
                >
                  <div class="achievement__progress-fill" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
              {unlocked && <span class="achievement__date">Unlocked</span>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
