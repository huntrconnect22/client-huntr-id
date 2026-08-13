import React, { useState } from "react";
import {
  Building2, ShieldCheck, LogOut, Users, X, Menu, CreditCard, Package,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import AdminCompaniesTab from "./AdminCompaniesTab";
import AdminCatalogueTab from "./AdminCatalogueTab";
import AdminTransactionsTab from "./AdminTransactionsTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminAdminsTab from "./AdminAdminsTab";
import type { AdminUser } from "./shared";

function useIsMobile(bp = 640) {
  const [mob, setMob] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < bp : false
  );
  React.useEffect(() => {
    const fn = () => setMob(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mob;
}

export type TabId = "companies" | "catalogue" | "transactions" | "users" | "admins";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "companies",    label: "Companies",    icon: <Building2 size={16} /> },
  { id: "catalogue",   label: "Catalogue",    icon: <Package size={16} /> },
  { id: "transactions", label: "Transactions", icon: <CreditCard size={16} /> },
  { id: "users",       label: "Users",        icon: <Users size={16} /> },
  { id: "admins",      label: "Admins",       icon: <ShieldCheck size={16} /> },
];

interface Props {
  admin: AdminUser;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
}

export default function AdminDashboard({ admin, activeTab, onTabChange, onLogout }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--ui-bg-header)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--ui-border)",
          padding: "0 clamp(12px, 4vw, 24px)",
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Left: logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img
            src="/assets/img/logo/sidebar.png"
            alt="Huntr.id"
            style={{ height: 26, objectFit: "contain" }}
          />
          {!isMobile && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "var(--ui-text-primary)", letterSpacing: "-0.3px" }}>
                Admin Portal
              </div>
              <div style={{ fontSize: 9, color: "var(--huntr-amber)", letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase" }}>
                Global Operations
              </div>
            </div>
          )}
        </div>

        {/* Center: desktop nav tabs */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: 2, flex: 1, justifyContent: "center", overflowX: "auto" }}>
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onTabChange(t.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: isActive ? "var(--ui-primary-muted)" : "transparent",
                    color: isActive ? "var(--ui-primary)" : "var(--ui-text-muted)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: theme toggle + user + sign out + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ThemeToggle />

          {!isMobile && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)" }}>{admin.name}</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)" }}>{admin.email}</div>
            </div>
          )}

          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 8,
              background: "var(--ui-logout-bg)", border: "1px solid var(--ui-logout-border)",
              color: "var(--ui-logout-text)", fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            <LogOut size={13} />
            {!isMobile && "Sign Out"}
          </button>

          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 8,
                background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
                color: "var(--ui-text-primary)", cursor: "pointer",
              }}
            >
              <Menu size={17} />
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: "70vw", maxWidth: 280,
              background: "var(--ui-bg-card)", borderLeft: "1px solid var(--ui-border)",
              display: "flex", flexDirection: "column", padding: "20px 16px", gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ui-text-primary)" }}>{admin.name}</div>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>{admin.email}</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 4, display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ height: 1, background: "var(--ui-border)", marginBottom: 8 }} />
            {TABS.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { onTabChange(t.id); setDrawerOpen(false); }}
                  style={{
                    padding: "11px 14px", borderRadius: 9, fontSize: 14, fontWeight: 700, textAlign: "left",
                    background: isActive ? "var(--ui-primary-muted)" : "transparent",
                    color: isActive ? "var(--ui-primary)" : "var(--ui-text-primary)",
                    border: isActive ? "1px solid var(--ui-primary-border)" : "1px solid transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
            background: "var(--ui-bg-header)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid var(--ui-border)", display: "flex",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                style={{
                  flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent",
                  color: isActive ? "var(--ui-primary)" : "var(--ui-text-muted)",
                  fontSize: 9, fontWeight: 700, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  borderTop: isActive ? "2px solid var(--ui-primary)" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {t.icon}
                {t.label.slice(0, 5)}
              </button>
            );
          })}
        </nav>
      )}

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          padding: "clamp(16px, 3vw, 28px)",
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          paddingBottom: isMobile
            ? "calc(env(safe-area-inset-bottom) + 72px)"
            : "clamp(16px, 3vw, 28px)",
        }}
      >
        {activeTab === "companies"    && <AdminCompaniesTab />}
        {activeTab === "catalogue"    && <AdminCatalogueTab />}
        {activeTab === "transactions" && <AdminTransactionsTab />}
        {activeTab === "users"        && <AdminUsersTab />}
        {activeTab === "admins"       && <AdminAdminsTab />}
      </main>
    </div>
  );
}
