// Settings screen (F16–F20): durations, theme, sounds, goals, notifications, data.
import { useEffect, useState } from "preact/hooks";

import { Accordion } from "../components/settings/Accordion.tsx";
import { DataActions } from "../components/settings/DataActions.tsx";
import { SoundPackPicker } from "../components/settings/SoundPackPicker.tsx";
import { ThemePicker } from "../components/settings/ThemePicker.tsx";
import { Button } from "../components/ui/Button.tsx";
import { IconBell } from "../components/ui/Icons.tsx";
import { showToast, ToastHost } from "../components/ui/Toast.tsx";
import { refreshAchievements } from "../hooks/useAchievements.ts";
import { reloadSessions } from "../hooks/useSessions.ts";
import { useSettings } from "../hooks/useSettings.ts";
import { refreshStreaks } from "../hooks/useStreaks.ts";
import type { AccentName, SoundPackName, ThemeName } from "../types/index.ts";

async function notifyTest(): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    showToast("This browser does not support notifications.", "error");
    return;
  }
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    new Notification("Pomodoro", { body: "Notifications are working 🍅", tag: "pomodoro-test" });
  } else {
    showToast("Notification permission was denied.", "error");
  }
}

function NumberField({
  label,
  value,
  min,
  max,
  onCommit,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label class="number-field">
      <span class="number-field__label">{label}</span>
      <span class="number-field__control">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10);
            if (Number.isNaN(parsed)) return;
            onCommit(Math.min(max, Math.max(min, parsed)));
          }}
        />
        {suffix && <span class="number-field__suffix">{suffix}</span>}
      </span>
    </label>
  );
}

export function SettingsScreen() {
  const { settings, update, ready } = useSettings();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const updatePromise = (partial: Parameters<typeof update>[0]) => {
    void update(partial).catch(() => showToast("Could not save settings.", "error"));
  };

  return (
    <main class="screen screen--settings">
      <ToastHost />
      <div class="screen__inner">
        <h2 class="screen__title">Settings</h2>
        <p class="screen__subtitle">All preferences are stored locally in your browser.</p>

        <Accordion
          title="Timer durations"
          subtitle="Work, short break and long break lengths"
          defaultOpen
        >
          <div class="settings-grid">
            <NumberField
              label="Focus session"
              value={settings.value.workMinutes}
              min={1}
              max={120}
              suffix="min"
              onCommit={(workMinutes) => updatePromise({ workMinutes })}
            />
            <NumberField
              label="Short break"
              value={settings.value.shortBreakMinutes}
              min={1}
              max={60}
              suffix="min"
              onCommit={(shortBreakMinutes) => updatePromise({ shortBreakMinutes })}
            />
            <NumberField
              label="Long break"
              value={settings.value.longBreakMinutes}
              min={1}
              max={90}
              suffix="min"
              onCommit={(longBreakMinutes) => updatePromise({ longBreakMinutes })}
            />
            <NumberField
              label="Daily goal"
              value={settings.value.dailyGoalMinutes}
              min={5}
              max={720}
              suffix="min/day"
              onCommit={(dailyGoalMinutes) => updatePromise({ dailyGoalMinutes })}
            />
          </div>
          <div class="settings-toggles">
            <label class="toggle">
              <input
                type="checkbox"
                checked={settings.value.autoStartBreaks}
                onChange={() => updatePromise({ autoStartBreaks: !settings.value.autoStartBreaks })}
              />
              <span>Auto-start breaks</span>
            </label>
            <label class="toggle">
              <input
                type="checkbox"
                checked={settings.value.autoStartWork}
                onChange={() => updatePromise({ autoStartWork: !settings.value.autoStartWork })}
              />
              <span>Auto-start next focus session</span>
            </label>
          </div>
        </Accordion>

        <Accordion title="Appearance" subtitle="Theme, accent color and motion">
          <ThemePicker
            theme={settings.value.theme}
            accent={settings.value.accent}
            onThemeChange={(theme: ThemeName) => updatePromise({ theme })}
            onAccentChange={(accent: AccentName) => updatePromise({ accent })}
          />
          <div class="settings-toggles">
            <label class="toggle">
              <input
                type="checkbox"
                checked={settings.value.reducedMotion}
                onChange={() => updatePromise({ reducedMotion: !settings.value.reducedMotion })}
              />
              <span>Reduce motion</span>
            </label>
          </div>
        </Accordion>

        <Accordion title="Sounds" subtitle="Ambient pack, volume and completion chimes">
          <SoundPackPicker
            soundPack={settings.value.soundPack}
            onChange={(soundPack: SoundPackName) => updatePromise({ soundPack })}
          />
          <label class="number-field number-field--range">
            <span class="number-field__label">Volume</span>
            <span class="number-field__control">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.value.soundVolume * 100)}
                onInput={(event) =>
                  updatePromise({
                    soundVolume: Number((event.target as HTMLInputElement).value) / 100,
                  })
                }
                aria-label="Sound volume"
              />
              <span class="number-field__suffix">
                {Math.round(settings.value.soundVolume * 100)}%
              </span>
            </span>
          </label>
          <div class="settings-toggles">
            <label class="toggle">
              <input
                type="checkbox"
                checked={settings.value.tickSound}
                onChange={() => updatePromise({ tickSound: !settings.value.tickSound })}
              />
              <span>Tick each second</span>
            </label>
          </div>
        </Accordion>

        <Accordion title="Notifications" subtitle="Get nudged when a phase finishes">
          <div class="settings-toggles">
            <label class="toggle">
              <input
                type="checkbox"
                checked={settings.value.notificationsEnabled}
                onChange={(event) => {
                  const enabled = (event.target as HTMLInputElement).checked;
                  updatePromise({ notificationsEnabled: enabled });
                  if (
                    enabled &&
                    "Notification" in window &&
                    Notification.permission === "default"
                  ) {
                    void Notification.requestPermission().then(setPermission);
                  }
                }}
              />
              <span>Enable desktop notifications</span>
            </label>
          </div>
          <div class="settings-notify-row">
            <Button
              variant="ghost"
              onClick={() => void notifyTest()}
              disabled={permission === "unsupported"}
            >
              <IconBell size={16} />
              <span>Send test notification</span>
            </Button>
            <span class="settings-notify-status" role="status">
              {permission === "granted"
                ? "Permission: granted"
                : permission === "denied"
                  ? "Permission: denied (browser blocked)"
                  : permission === "unsupported"
                    ? "Not supported"
                    : "Permission: not yet asked"}
            </span>
          </div>
        </Accordion>

        <Accordion title="Keyboard shortcuts" subtitle="Available on the timer screen">
          <dl class="shortcut-list">
            <div>
              <dt>Space</dt>
              <dd>Start / pause timer</dd>
            </div>
            <div>
              <dt>R</dt>
              <dd>Reset current phase</dd>
            </div>
            <div>
              <dt>S</dt>
              <dd>Skip to next phase</dd>
            </div>
            <div>
              <dt>F</dt>
              <dd>Toggle focus mode</dd>
            </div>
          </dl>
        </Accordion>

        <Accordion title="Your data" subtitle="Export, import or clear everything stored locally">
          <DataActions
            onCleared={() => {
              void reloadSessions();
              void refreshStreaks();
              void refreshAchievements();
              showToast("All local data cleared.", "info");
            }}
            onImported={() => {
              void reloadSessions();
              void refreshStreaks();
              void refreshAchievements();
            }}
          />
        </Accordion>

        {!ready.value && <p class="sr-only">Loading settings…</p>}
      </div>
    </main>
  );
}
