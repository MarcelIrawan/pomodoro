// Stats screen (F9, F12, F13): weekly/monthly charts, streak badge, achievements.
import { WeeklyBarChart } from '../components/stats/WeeklyBarChart.tsx';
import { MonthlyLineChart } from '../components/stats/MonthlyLineChart.tsx';
import { AchievementGallery } from '../components/stats/AchievementGallery.tsx';
import { StreakBadge } from '../components/stats/StreakBadge.tsx';
import { Card } from '../components/ui/Card.tsx';
import { useSessions } from '../hooks/useSessions.ts';
import { bestStreak, currentStreak } from '../hooks/useStreaks.ts';
import { formatDuration } from '../lib/date.ts';

export function StatsScreen() {
  const { stats, monthHistogram } = useSessions();

  const totalFocus = stats.value.totalFocusSeconds;
  const completed = stats.value.totalCompletedWork;
  const sessionsThisWeek = stats.value.sessionsThisWeek;

  return (
    <main class="screen screen--stats">
      <div class="screen__inner">
        <h2 class="screen__title">Stats</h2>
        <p class="screen__subtitle">Progress over time — all computed locally from your sessions.</p>

        <div class="stats-overview">
          <Card class="stats-overview__streak">
            <StreakBadge current={currentStreak.value} best={bestStreak.value} />
          </Card>
          <Card class="stats-overview__totals">
            <div class="stats-totals">
              <div class="stats-totals__item">
                <span class="stats-totals__value">{formatDuration(totalFocus)}</span>
                <span class="stats-totals__label">total focus</span>
              </div>
              <div class="stats-totals__item">
                <span class="stats-totals__value">{completed}</span>
                <span class="stats-totals__label">sessions done</span>
              </div>
              <div class="stats-totals__item">
                <span class="stats-totals__value">{sessionsThisWeek}</span>
                <span class="stats-totals__label">this week</span>
              </div>
            </div>
          </Card>
        </div>

        <Card title="This week" subtitle="Focus minutes per day">
          <WeeklyBarChart data={stats.value.thisWeek} />
        </Card>

        <Card title="Last 30 days" subtitle="Sessions per day">
          <MonthlyLineChart data={monthHistogram.value} />
        </Card>

        <Card title="Achievements" subtitle="Unlock them by focusing">
          <AchievementGallery />
        </Card>
      </div>
    </main>
  );
}
