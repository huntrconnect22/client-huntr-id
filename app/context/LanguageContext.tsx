import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "../locales";
import en, { type Translations } from "../locales/en";

// ─── Storage key ─────────────────────────────────────────────────────────────
const STORAGE_KEY = "huntr_locale";

// ─── Interpolation helper ────────────────────────────────────────────────────
/**
 * Replaces `{{key}}` placeholders in a string with values from `params`.
 * Example: interpolate("Hello {{name}}", { name: "Budi" }) → "Hello Budi"
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

// ─── Type helpers ─────────────────────────────────────────────────────────────
type DeepKeys<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${DeepKeys<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

export type TranslationKey = DeepKeys<typeof en> | (string & {});

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as string;
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a dot-notation key, optionally interpolating `{{param}}` tokens. */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in LOCALES) {
        setLocaleState(saved);
      }
    } catch {
      // SSR / private browsing — silently ignore
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const strings = LOCALES[locale] as unknown as Record<string, unknown>;
      const raw = getNestedValue(strings, key);
      if (typeof raw !== "string") {
        // Fallback to English if key missing in current locale
        const fallback = getNestedValue(
          LOCALES[DEFAULT_LOCALE] as unknown as Record<string, unknown>,
          key
        );
        return typeof fallback === "string"
          ? interpolate(fallback, params)
          : key;
      }
      return interpolate(raw, params);
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
