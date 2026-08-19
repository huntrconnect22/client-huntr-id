import React from "react";
import ThemeToggle from "../../../components/ThemeToggle";

export function AccountAppearanceTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Appearance & Theme</h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">Configure interface mode and visual theme settings.</p>
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Display Mode</span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)]">
          <div className="p-4 px-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--ui-text-primary)]">Interface Theme</div>
              <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">Switch between Light, System Auto, or Dark mode.</div>
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
