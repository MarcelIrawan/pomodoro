// Data actions (F20): export backup JSON, import, and clear all data.
import { useState } from 'preact/hooks';
import { db } from '../../lib/db.ts';
import { backupToJSON, downloadTextFile, parseBackupPayload } from '../../lib/export.ts';
import { Button } from '../ui/Button.tsx';
import { IconDownload, IconTrash, IconUpload } from '../ui/Icons.tsx';

export function DataActions({ onCleared, onImported }: { onCleared: () => void; onImported: () => void }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const dump = await db.exportAll();
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        ...dump,
      };
      downloadTextFile(
        `pomodoro-backup-${new Date().toISOString().slice(0, 10)}.json`,
        backupToJSON(payload),
        'application/json',
      );
      setMessage('Backup downloaded.');
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const payload = parseBackupPayload(text);
      await db.importAll({
        settings: payload.settings,
        sessions: payload.sessions,
        streaks: payload.streaks,
        achievements: payload.achievements,
      });
      setMessage('Backup restored.');
      onImported();
    } catch (error) {
      setMessage(error instanceof Error ? `Import failed: ${error.message}` : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    setBusy(true);
    try {
      await db.clearAll();
      onCleared();
      setMessage('All data cleared.');
      setConfirmClear(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="data-actions">
      <div class="data-actions__buttons">
        <Button variant="ghost" onClick={exportBackup} disabled={busy}>
          <IconDownload size={16} />
          <span>Export backup (JSON)</span>
        </Button>
        <label class="btn btn--ghost btn--md data-actions__import">
          <IconUpload size={16} />
          <span>Import backup</span>
          <input
            type="file"
            accept="application/json,.json"
            hidden
            disabled={busy}
            onChange={(event) => {
              const input = event.target as HTMLInputElement;
              const file = input.files?.[0];
              if (file) void importBackup(file);
              input.value = '';
            }}
          />
        </label>
        {!confirmClear ? (
          <Button variant="danger" onClick={() => setConfirmClear(true)} disabled={busy}>
            <IconTrash size={16} />
            <span>Clear all data…</span>
          </Button>
        ) : (
          <div class="data-actions__confirm" role="alertdialog" aria-label="Confirm clear all data">
            <p>This permanently deletes all sessions, streaks, achievements and settings. Continue?</p>
            <div class="data-actions__confirm-buttons">
              <Button variant="danger" onClick={clearAll} disabled={busy}>Yes, delete everything</Button>
              <Button variant="ghost" onClick={() => setConfirmClear(false)} disabled={busy}>Keep my data</Button>
            </div>
          </div>
        )}
      </div>
      {message && <p class="data-actions__message" role="status">{message}</p>}
    </div>
  );
}
