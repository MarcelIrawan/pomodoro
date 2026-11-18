// CSV / JSON export helpers for sessions (F11, F20).
import type { BackupPayload, Session } from "../types/index.ts";

const CSV_HEADER =
  "id,startedAt,endedAt,type,plannedDuration,actualDuration,completed,tags,notes,cycleIndex";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function sessionsToCSV(sessions: Session[]): string {
  const rows = sessions.map((s) =>
    [
      s.id,
      s.startedAt,
      s.endedAt ?? "",
      s.type,
      String(s.plannedDuration),
      String(s.actualDuration),
      s.completed ? "true" : "false",
      s.tags.join(";"),
      s.notes ?? "",
      String(s.cycleIndex),
    ]
      .map(csvEscape)
      .join(","),
  );
  return [CSV_HEADER, ...rows].join("\r\n");
}

export function sessionsToJSON(sessions: Session[]): string {
  return JSON.stringify(sessions, null, 2);
}

export function backupToJSON(backup: BackupPayload): string {
  return JSON.stringify(backup, null, 2);
}

/** Validate an arbitrary JSON import payload and normalize sessions. */
export function parseBackupPayload(json: string): BackupPayload {
  const parsed = JSON.parse(json) as BackupPayload;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Backup file is not a valid JSON object.");
  }
  if (parsed.version !== 1) {
    throw new Error(`Unsupported backup version: ${String(parsed.version)}`);
  }
  if (!Array.isArray(parsed.sessions)) {
    throw new Error("Backup is missing the sessions array.");
  }
  for (const [index, session] of parsed.sessions.entries()) {
    if (
      typeof session.id !== "string" ||
      typeof session.startedAt !== "string" ||
      typeof session.type !== "string" ||
      typeof session.plannedDuration !== "number" ||
      typeof session.cycleIndex !== "number"
    ) {
      throw new Error(`Session #${index + 1} is malformed.`);
    }
  }
  return parsed;
}

export function downloadTextFile(filename: string, text: string, mimeType: string): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
