import React from "react";
import ThemeToggle from "../../../components/ThemeToggle";
import { useLanguage } from "../../../context/LanguageContext";

export function AccountAppearanceTab() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">
          {t("settings.appearance.title")}
        </h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          {t("settings.appearance.subtitle")}
        </p>
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          {t("settings.appearance.displayMode")}
        </span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)]">
          <div className="p-4 px-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--ui-text-primary)]">
                {t("settings.appearance.interfaceTheme")}
              </div>
              <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                {t("settings.appearance.interfaceThemeDesc")}
              </div>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
