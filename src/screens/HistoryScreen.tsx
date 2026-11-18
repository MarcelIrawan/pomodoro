// History screen (F8–F11): heatmap, tag/date filters, session list, CSV/JSON export.
import { useMemo, useState } from "preact/hooks";

import { CalendarHeatmap } from "../components/history/CalendarHeatmap.tsx";
import { ExportButton } from "../components/history/ExportButton.tsx";
import { SessionList } from "../components/history/SessionList.tsx";
import { Card } from "../components/ui/Card.tsx";
import { allTags, useSessions } from "../hooks/useSessions.ts";
import { useSettings } from "../hooks/useSettings.ts";

export function HistoryScreen() {
  const { sessions } = useSessions();
  const { settings } = useSettings();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const tags = useMemo(() => allTags(), [sessions.value]);

  const filtered = useMemo(() => {
    let list = sessions.value;
    if (tagFilter) {
      list = list.filter((s) => s.tags.includes(tagFilter));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.notes?.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.type.includes(q),
      );
    }
    return list;
  }, [sessions.value, tagFilter, query]);

  const goalMinutes = settings.value.dailyGoalMinutes;

  return (
    <main class="screen screen--history">
      <div class="screen__inner">
        <h2 class="screen__title">History</h2>
        <p class="screen__subtitle">Every focus block and break, logged locally.</p>

        <Card title="Focus heatmap" subtitle="Last 26 weeks — darker cells mean more focus minutes">
          <CalendarHeatmap sessions={sessions.value} goalMinutes={goalMinutes} />
        </Card>

        <Card title="Filters" subtitle="Narrow sessions by tag or free text">
          <div class="filter-row">
            <div class="filter-chips" role="group" aria-label="Filter by tag">
              <button
                class={`chip${tagFilter === null ? " chip--active" : ""}`}
                onClick={() => setTagFilter(null)}
                aria-pressed={tagFilter === null}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  class={`chip${tagFilter === tag ? " chip--active" : ""}`}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  aria-pressed={tagFilter === tag}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              class="filter-search"
              type="search"
              placeholder="Search notes or tags…"
              value={query}
              onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
              aria-label="Search sessions"
            />
          </div>
        </Card>

        <Card
          title="Sessions"
          subtitle={`${filtered.length} shown${tagFilter ? `, tagged “${tagFilter}”` : ""}`}
        >
          <div class="history-toolbar">
            <ExportButton sessions={filtered} />
          </div>
          <SessionList sessions={filtered} />
        </Card>
      </div>
    </main>
  );
}
