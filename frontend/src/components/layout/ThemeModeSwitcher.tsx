"use client";

import { cn } from "@/utils/cn";
import { useThemeMode, type ThemeMode } from "@/components/layout/ThemeModeProvider";

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: "default", label: "Default" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeModeSwitcher({ className }: { className?: string }) {
  const { mode, setMode } = useThemeMode();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/70 p-1 text-xs shadow-sm backdrop-blur",
        "dark:border-white/15 dark:bg-slate-900/70",
        className
      )}
      role="group"
      aria-label="Theme mode"
    >
      {themeOptions.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 font-medium transition-colors",
              isActive
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "text-slate-600 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
            )}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeModeSwitcher;
