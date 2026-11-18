import { describe, expect, it } from 'vitest';

import {
  backupToJSON,
  parseBackupPayload,
  sessionsToCSV,
  sessionsToJSON,
} from '../src/lib/export.ts';
import type { BackupPayload, Session } from '../src/types/index.ts';

const session: Session = {
  id: 'abc,123',
  startedAt: '2026-11-10T09:00:00.000Z',
  endedAt: '2026-11-10T09:25:00.000Z',
  type: 'work',
  plannedDuration: 25,
  actualDuration: 1500,
  completed: true,
  tags: ['deep,work', 'morning'],
  notes: 'Line one\nLine "two"',
  cycleIndex: 0,
};

describe('export', () => {
  it('sessionsToCSV escapes commas, quotes and newlines', () => {
    const csv = sessionsToCSV([session]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe(
      'id,startedAt,endedAt,type,plannedDuration,actualDuration,completed,tags,notes,cycleIndex',
    );
    expect(row).toContain('"abc,123"');
    expect(row).toContain('"Line one\nLine ""two"""');
    // tags joined with ';'; the comma inside the first tag forces CSV quoting
    expect(row).toContain('"deep,work;morning"');
  });

  it('sessionsToJSON round-trips', () => {
    expect(JSON.parse(sessionsToJSON([session]))[0]).toEqual(session);
  });

  it('parseBackupPayload accepts a valid payload', () => {
    const backup: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {} as never,
      sessions: [session],
      streaks: [],
      achievements: [],
    };
    const parsed = parseBackupPayload(JSON.stringify(backup));
    expect(parsed.sessions[0]?.id).toBe('abc,123');
    expect(JSON.parse(backupToJSON(backup)).version).toBe(1);
  });

  it('parseBackupPayload rejects unknown versions', () => {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      settings: {},
      sessions: [],
      streaks: [],
      achievements: [],
    };
    expect(() => parseBackupPayload(JSON.stringify(backup))).toThrow(/version/i);
  });

  it('parseBackupPayload rejects malformed sessions', () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {},
      sessions: [{ id: 42 }],
      streaks: [],
      achievements: [],
    };
    expect(() => parseBackupPayload(JSON.stringify(backup))).toThrow(/malformed/i);
  });

  it('parseBackupPayload rejects non-objects', () => {
    expect(() => parseBackupPayload('[]')).toThrow();
    expect(() => parseBackupPayload('{}')).toThrow();
  });
});
