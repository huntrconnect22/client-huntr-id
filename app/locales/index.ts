/**
 * Locale registry — add new languages here.
 */
import en from "./en";
import id from "./id";

export const LOCALES = { en, id } as const;
export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  id: "Indonesia",
};

export { en, id };
