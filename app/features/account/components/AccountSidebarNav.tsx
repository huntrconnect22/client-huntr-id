import React from "react";
import {
  Shield,
  Smartphone,
  Zap,
  Palette,
  Sparkles,
  Monitor,
} from "lucide-react";

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

const TABS: { id: AccountTabType; icon: React.FC<any>; label: string }[] = [
  { id: "security", icon: Shield, label: "Security & Password" },
  { id: "profile", icon: Smartphone, label: "WhatsApp Profile" },
  { id: "subscription", icon: Zap, label: "Subscription & Trial" },
  { id: "appearance", icon: Palette, label: "Appearance" },
  { id: "features", icon: Sparkles, label: "Feature Flags" },
  { id: "sessions", icon: Monitor, label: "Active Sessions" },
];

export function AccountSidebarNav({ activeTab, onSelectTab }: AccountSidebarNavProps) {
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
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
              active
                ? "bg-orange-500 font-semibold shadow-sm shadow-orange-500/20"
                : "text-[var(--ui-text-nav-idle)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] font-medium"
            }`}
          >
            <Icon
              size={17}
              style={active ? { color: "white" } : undefined}
              className={active ? "" : "text-[var(--ui-text-muted)]"}
            />
            <span
              style={active ? { color: "white" } : undefined}
              className={`truncate ${active ? "font-semibold" : ""}`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
