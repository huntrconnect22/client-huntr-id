import React, { createContext, useContext, useEffect, useState } from "react";

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
    const savedTheme = localStorage.getItem("huntr_theme") as Theme | null;
    setManual(savedTheme || null);
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
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (manual) {
      localStorage.setItem("huntr_theme", manual);
    } else {
      localStorage.removeItem("huntr_theme");
    }
  }, [theme, manual]);

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
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
