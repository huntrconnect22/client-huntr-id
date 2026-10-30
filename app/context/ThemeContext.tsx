import React, { createContext, useContext, useEffect, useState } from "react";
import { AppThemeProvider } from "~/shared/theme/AppThemeProvider";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: "light" | "dark" | "auto") => void;
  isDark: boolean;
  isAuto: boolean;
  resetToAuto: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setThemeMode: () => {},
  isDark: true,
  isAuto: true,
  resetToAuto: () => {},
});

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // null = follow system (auto), string = manual override
  const [isClient, setIsClient] = useState(false);
  const [manual, setManual] = useState<Theme | null>(null);
  const [systemTheme, setSystemTheme] = useState<Theme>("dark");

  useEffect(() => {
    setIsClient(true);
    try {
      const savedTheme = localStorage.getItem("huntr_theme");
      setManual(savedTheme === "dark" || savedTheme === "light" ? savedTheme : null);
    } catch { /* Theme switching also works when browser storage is unavailable. */ }
    setSystemTheme(getSystemTheme());
    
    // Listen for OS theme changes
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme: Theme = manual ?? systemTheme;
  const isAuto = manual === null;

  // Apply to <html> and persist
  useEffect(() => {
    if (!isClient) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      if (manual) localStorage.setItem("huntr_theme", manual);
      else localStorage.removeItem("huntr_theme");
    } catch { /* Keep the active theme even without persistent storage. */ }
  }, [theme, manual, isClient]);

  const toggleTheme = () => {
    setManual((prev) => {
      const current = prev ?? systemTheme;
      return current === "dark" ? "light" : "dark";
    });
  };

  const setThemeMode = (mode: "light" | "dark" | "auto") => {
    if (mode === "auto") {
      setManual(null);
    } else {
      setManual(mode);
    }
  };

  const resetToAuto = () => setManual(null);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, isDark: theme === "dark", isAuto, resetToAuto }}>
      <AppThemeProvider mode={theme}>{children}</AppThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
