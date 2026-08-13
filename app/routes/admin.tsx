import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import AdminLogin from "../components/admin/AdminLogin";
import AdminDashboard from "../components/admin/AdminDashboard";
import type { AdminUser } from "../components/admin/shared";

const VALID_TABS = ["companies", "catalogue", "transactions", "users", "admins"] as const;
type TabId = (typeof VALID_TABS)[number];

function isValidTab(s: string | undefined): s is TabId {
  return VALID_TABS.includes(s as TabId);
}

export default function AdminPortal() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [view, setView] = useState<"login" | "dashboard">("login");
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // Resolve active tab from URL, fallback to "companies"
  const activeTab: TabId = isValidTab(tab) ? tab : "companies";

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_session");
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
        setView("dashboard");
      } catch {
        sessionStorage.removeItem("admin_session");
      }
    }
  }, []);

  const handleLogin = (a: AdminUser) => {
    sessionStorage.setItem("admin_session", JSON.stringify(a));
    setAdmin(a);
    setView("dashboard");
    navigate("/admin/companies", { replace: true });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    setAdmin(null);
    setView("login");
    navigate("/admin", { replace: true });
  };

  const handleTabChange = (t: TabId) => {
    navigate(`/admin/${t}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ui-bg-page)",
        color: "var(--ui-text-primary)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {admin && view === "dashboard" ? (
        <AdminDashboard
          admin={admin}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}
