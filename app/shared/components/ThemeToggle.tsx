import React, { useEffect, useState } from "react";
import { Sun, Moon, SunMoon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

/**
 * ThemeToggle — pill-style 3-state toggle: Light | Auto | Dark
 * Designed for the top bar.
 */
export default function ThemeToggle() {
  const { isDark, isAuto, setThemeMode } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Derive current active mode (defaults to 'dark' on SSR before mount)
  const mode: "light" | "auto" | "dark" = mounted
    ? (isAuto ? "auto" : isDark ? "dark" : "light")
    : "dark";

  const handleClick = (next: "light" | "auto" | "dark") => {
    setThemeMode(next);
  };

  const segments: { key: "light" | "auto" | "dark"; icon: React.ReactNode; label: string }[] = [
    { key: "light", icon: <Sun size={12} />, label: t("settings.appearance.light") },
    { key: "auto",  icon: <SunMoon size={12} />, label: t("settings.appearance.auto")  },
    { key: "dark",  icon: <Moon size={12} />, label: t("settings.appearance.dark")  },
  ];

  return (
    <div
      role="group"
      aria-label="Theme selection"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        borderRadius: 10,
        background: "var(--ui-toggle-bg)",
        border: "1px solid var(--ui-toggle-border)",
      }}
    >
      {segments.map(({ key, icon, label }) => {
        const isActive = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleClick(key)}
            aria-pressed={isActive}
            title={`${label} mode`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 7,
              border: "none",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s ease",
              background: isActive
                ? "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.15))"
                : "transparent",
              color: isActive
                ? "#f97316"
                : "var(--ui-text-muted)",
              boxShadow: isActive
                ? "inset 0 0 0 1px rgba(249,115,22,0.35)"
                : "none",
              lineHeight: 1,
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
