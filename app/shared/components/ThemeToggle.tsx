import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { Sun, Moon, SunMoon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function ThemeToggle() {
  const { isDark, isAuto, setThemeMode } = useTheme();
  const { t } = useLanguage();
  const mode = isAuto ? "auto" : isDark ? "dark" : "light";
  const segments = [
    { key: "light", Icon: Sun }, { key: "auto", Icon: SunMoon }, { key: "dark", Icon: Moon },
  ] as const;
  return (
    <ToggleButtonGroup value={mode} exclusive size="small" aria-label="Theme selection"
      onChange={(_, next: "light" | "auto" | "dark" | null) => { if (next) setThemeMode(next); }}>
      {segments.map(({ key, Icon }) => (
        <ToggleButton key={key} value={key} aria-label={t(`settings.appearance.${key}`)} sx={{ px: 1.25, py: 1 }}>
          <Tooltip title={t(`settings.appearance.${key}`)}><Icon size={18} /></Tooltip>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
