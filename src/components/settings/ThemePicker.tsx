// Theme + accent palette pickers (F16, F24-ish unlocked themes from achievements).
import { ACCENT_PALETTES, type AccentName, type ThemeName } from "../../types/index.ts";
import { cn } from "../../utils/cn.ts";
import { IconMonitor, IconMoon, IconSun } from "../ui/Icons.tsx";

const THEME_OPTIONS: { id: ThemeName; label: string; Icon: typeof IconSun }[] = [
  { id: "light", label: "Light", Icon: IconSun },
  { id: "dark", label: "Dark", Icon: IconMoon },
  { id: "system", label: "System", Icon: IconMonitor },
];

export function ThemePicker({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
}: {
  theme: ThemeName;
  accent: AccentName;
  onThemeChange: (theme: ThemeName) => void;
  onAccentChange: (accent: AccentName) => void;
}) {
  return (
    <div class="theme-picker">
      <div class="theme-picker__row" role="radiogroup" aria-label="Theme">
        {THEME_OPTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="radio"
            aria-checked={theme === id}
            class={cn("theme-picker__option", theme === id && "theme-picker__option--active")}
            onClick={() => onThemeChange(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div class="accent-picker" role="radiogroup" aria-label="Accent color">
        {ACCENT_PALETTES.map((palette) => (
          <button
            key={palette.id}
            role="radio"
            aria-checked={accent === palette.id}
            class={cn(
              "accent-picker__swatch",
              accent === palette.id && "accent-picker__swatch--active",
            )}
            style={{ "--swatch": palette.swatch }}
            onClick={() => onAccentChange(palette.id)}
            title={palette.label}
            aria-label={`${palette.label} accent`}
          >
            <span class="accent-picker__dot" />
            <span class="accent-picker__label">{palette.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
