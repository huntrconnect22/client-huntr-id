import en from "./data/en";
import id from "./data/id";

/** Central locale registry; domain dictionaries are composed here. */
export const LOCALES = { en, id } as const;
export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  id: "Indonesia",
};

export { en, id };
export type { Translations } from "./data/en";
