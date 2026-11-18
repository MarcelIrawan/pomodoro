// Export button (F11): downloads the given sessions as CSV or JSON.
import { useState } from 'preact/hooks';
import { sessionsToCSV, sessionsToJSON, downloadTextFile } from '../../lib/export.ts';
import { Button } from '../ui/Button.tsx';
import { IconDownload } from '../ui/Icons.tsx';
import type { Session } from '../../types/index.ts';

export function ExportButton({ sessions }: { sessions: Session[] }) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  const exportNow = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      downloadTextFile(`pomodoro-sessions-${stamp}.csv`, sessionsToCSV(sessions), 'text/csv');
    } else {
      downloadTextFile(`pomodoro-sessions-${stamp}.json`, sessionsToJSON(sessions), 'application/json');
    }
  };

  return (
    <div class="export-button" role="group" aria-label="Export history">
      <select
        class="export-button__select"
        value={format}
        onChange={(event) => setFormat((event.target as HTMLSelectElement).value as 'csv' | 'json')}
        aria-label="Export format"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>
      <Button variant="ghost" onClick={exportNow} disabled={sessions.length === 0}>
        <IconDownload size={16} />
        <span>Export</span>
      </Button>
    </div>
  );
}
