import React from "react";
import { Link } from "react-router";

interface NavItem {
  to: string;
  label: string;
  Icon: any;
  section?: string;
  badge?: string;
  exact?: boolean;
  isAi?: boolean;
}

interface SidebarNavProps {
  navItems: NavItem[];
  pathname: string;
  pendingCounts: Record<string, number>;
  onNavClick: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  main: "Main",
  procurement: "Procurement",
  vendor: "Vendor",
  orders: "Orders & Documents",
  finance: "Finance",
  settings: "Settings",
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  navItems,
  pathname,
  pendingCounts,
  onNavClick,
}) => {
  let currentSection = "";

  return (
    <nav
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        padding: "0 10px",
        overflowY: "auto",
      }}
    >
      {navItems.map(({ to, label, Icon, section, badge, exact, isAi }: NavItem) => {
        const active =
          pathname === to || (!exact && to !== "/" && pathname.startsWith(to + "/"));
        const badgeCount = badge ? pendingCounts[badge] || 0 : 0;
        const showSection = section && section !== currentSection;
        if (showSection) currentSection = section;

        return (
          <React.Fragment key={to}>
            {showSection && (
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "var(--ui-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "12px 12px 6px",
                  marginTop: currentSection === "main" ? 0 : 8,
                }}
              >
                {SECTION_LABELS[section] || section}
              </div>
            )}
            <Link
              to={to}
              onClick={onNavClick}
              className="huntr-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 12px",
                borderRadius: 8,
                background: active ? "var(--ui-nav-active-bg)" : "transparent",
                border: active
                  ? "1px solid var(--ui-nav-active-border)"
                  : "1px solid transparent",
                color: active
                  ? "var(--ui-text-nav-active)"
                  : "var(--ui-text-nav-idle)",
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {isAi && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #f97316, #f59e0b)",
                    color: "#fff",
                    letterSpacing: "0.05em",
                  }}
                >
                  AI
                </span>
              )}
              {badgeCount > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: active ? "#f59e0b" : "rgba(249,115,22,0.15)",
                    color: active ? "#fff" : "#f59e0b",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                  }}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
              {active && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#f59e0b",
                  }}
                />
              )}
            </Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
