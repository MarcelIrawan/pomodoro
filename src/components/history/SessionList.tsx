// Session list grouped by day (F8). Clicking a row expands notes/tags inline.
import { useState } from 'preact/hooks';
import { formatDuration } from '../../lib/date.ts';
import { cn } from '../../utils/cn.ts';
import { IconTag } from '../ui/Icons.tsx';
import type { Session } from '../../types/index.ts';

function dayKey(session: Session): string {
  return session.startedAt.slice(0, 10);
}

const TYPE_LABEL: Record<Session['type'], string> = {
  work: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
};

export function SessionList({
  sessions,
  limit = 200,
}: {
  sessions: Session[];
  limit?: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const grouped = new Map<string, Session[]>();
  for (const session of sessions.slice(0, limit)) {
    const key = dayKey(session);
    const list = grouped.get(key) ?? [];
    list.push(session);
    grouped.set(key, list);
  }

  if (grouped.size === 0) {
    return (
      <p class="session-list__empty">No sessions yet — press start on the timer and focus for a while.</p>
    );
  }

  return (
    <div class="session-list">
      {[...grouped.entries()].map(([day, daySessions]) => (
        <section key={day} class="session-list__group">
          <h4 class="session-list__day">{day}</h4>
          <ul class="session-list__items">
            {daySessions.map((session) => {
              const expanded = expandedId === session.id;
              return (
                <li key={session.id}>
                  <button
                    class={cn('session-row', expanded && 'session-row--expanded')}
                    onClick={() => setExpandedId(expanded ? null : session.id)}
                    aria-expanded={expanded}
                  >
                    <span class={cn('session-row__type', `session-row__type--${session.type}`)}>
                      {TYPE_LABEL[session.type]}
                    </span>
                    <span class="session-row__time">
                      {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span class="session-row__duration">
                      {formatDuration(session.actualDuration)}
                      {!session.completed && <span class="session-row__skipped">· skipped</span>}
                    </span>
                    {session.tags.length > 0 && (
                      <span class="session-row__tags">
                        {session.tags.slice(0, 2).map((tag) => (
                          <span key={tag} class="session-row__tag">
                            <IconTag size={12} />
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                  {expanded && (
                    <div class="session-row__details">
                      <p class="session-row__meta">
                        Planned {session.plannedDuration} min · Cycle {session.cycleIndex + 1}/4
                        {session.endedAt ? ` · Ended ${new Date(session.endedAt).toLocaleTimeString()}` : ''}
                      </p>
                      {session.notes && <p class="session-row__notes">{session.notes}</p>}
                      {session.tags.length > 0 && (
                        <p class="session-row__meta">Tags: {session.tags.join(', ')}</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
