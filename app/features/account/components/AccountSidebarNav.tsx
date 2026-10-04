import React from "react";
import {
  Shield,
  Smartphone,
  Zap,
  Palette,
  Sparkles,
  Monitor,
} from "lucide-react";
import { useLanguage, type TranslationKey } from "../../../context/LanguageContext";

export type AccountTabType =
  | "security"
  | "profile"
  | "subscription"
  | "appearance"
  | "features"
  | "sessions";

interface AccountSidebarNavProps {
  activeTab: AccountTabType;
  onSelectTab: (tab: AccountTabType) => void;
}

const TABS: { id: AccountTabType; icon: React.FC<any>; labelKey: TranslationKey }[] = [
  { id: "security", icon: Shield, labelKey: "settings.tabs.security" },
  { id: "profile", icon: Smartphone, labelKey: "settings.tabs.profile" },
  { id: "subscription", icon: Zap, labelKey: "settings.tabs.subscription" },
  { id: "appearance", icon: Palette, labelKey: "settings.tabs.appearance" },
  { id: "features", icon: Sparkles, labelKey: "settings.tabs.features" },
  { id: "sessions", icon: Monitor, labelKey: "settings.tabs.sessions" },
];

export function AccountSidebarNav({ activeTab, onSelectTab }: AccountSidebarNavProps) {
  const { t } = useLanguage();
  return (
    <div className="w-full md:w-64 space-y-1 flex-shrink-0 md:sticky md:top-6">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            style={active ? { color: "white" } : undefined}
            className={`w-full text-left px-3.5 py-3 md:py-2.5 rounded-xl md:rounded-lg text-sm transition-all flex items-center justify-between md:justify-start gap-3 border md:border-transparent ${
              active
                ? "bg-orange-500 font-semibold shadow-sm shadow-orange-500/20 border-orange-500"
                : "bg-[var(--ui-bg-card)] md:bg-transparent border-[var(--ui-border)] text-[var(--ui-text-primary)] md:text-[var(--ui-text-nav-idle)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] font-medium"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 md:w-auto md:h-auto rounded-lg flex items-center justify-center ${
                  active ? "bg-white/20 md:bg-transparent" : "bg-orange-500/10 md:bg-transparent"
                }`}
              >
                <Icon
                  size={17}
                  style={active ? { color: "white" } : undefined}
                  className={active ? "" : "text-orange-500 md:text-[var(--ui-text-muted)]"}
                />
              </div>
              <span
                style={active ? { color: "white" } : undefined}
                className={`truncate ${active ? "font-semibold" : ""}`}
              >
                {t(tab.labelKey)}
              </span>
            </div>
            <div className="md:hidden flex items-center">
              <span className={`text-xs ${active ? "text-white/80" : "text-[var(--ui-text-muted)]"}`}>
                ›
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
