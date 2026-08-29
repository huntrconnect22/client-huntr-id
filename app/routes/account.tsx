import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";
import {
  AccountSidebarNav,
  AccountSecurityTab,
  AccountProfileTab,
  AccountSubscriptionTab,
  AccountAppearanceTab,
  AccountFeaturesTab,
  AccountSessionsTab,
  type AccountTabType,
} from "../features/account";

const TAB_TITLES: Record<AccountTabType, { title: string; subtitle: string }> = {
  security: { title: "Security & Password", subtitle: "Manage authentication and password security" },
  profile: { title: "WhatsApp Profile", subtitle: "Manage WhatsApp number and notification settings" },
  subscription: { title: "Subscription & Trial", subtitle: "Manage active subscription plan and limits" },
  appearance: { title: "Appearance", subtitle: "Customize theme and display preferences" },
  features: { title: "Feature Flags", subtitle: "Configure experimental and advanced features" },
  sessions: { title: "Active Sessions", subtitle: "Monitor active devices and login sessions" },
};

export default function AccountSettings() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AccountTabType | null>("security");
  const [mobileSelectedTab, setMobileSelectedTab] = useState<AccountTabType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    if (session) {
      setUser(JSON.parse(session));
    }
    if (companySession) {
      setActiveCompany(JSON.parse(companySession));
    }
  }, []);

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  const currentTab = isMobile ? mobileSelectedTab : (activeTab || "security");

  const pageTitle = isMobile && mobileSelectedTab
    ? TAB_TITLES[mobileSelectedTab]?.title || "Account Settings"
    : "Account Settings";

  const pageSubtitle = isMobile && mobileSelectedTab
    ? TAB_TITLES[mobileSelectedTab]?.subtitle
    : isMobile
    ? "Manage your account preferences"
    : "Manage your security, profile, appearance, and active sessions";

  return (
    <Layout title={pageTitle} subtitle={pageSubtitle}>
      <div className="w-full space-y-6">
        {/* Mobile Back Button when inside a tab */}
        {isMobile && mobileSelectedTab && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setMobileSelectedTab(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Settings Menu
          </button>
        )}

        {/* Feedback messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start min-h-[520px]">
          {/* Navigation Sidebar: On mobile, shown only when NO sub-tab is selected */}
          {(!isMobile || !mobileSelectedTab) && (
            <div className="w-full md:w-64 flex-shrink-0">
              <AccountSidebarNav
                activeTab={activeTab || "security"}
                onSelectTab={(tab) => {
                  setError(null);
                  setSuccess(null);
                  setActiveTab(tab);
                  if (isMobile) {
                    setMobileSelectedTab(tab);
                  }
                }}
              />
            </div>
          )}

          {/* Content Area: On mobile, shown only when a tab is selected. On desktop, always shown */}
          {(!isMobile || mobileSelectedTab) && (
            <div className="flex-1 w-full space-y-6">
              {currentTab === "security" && (
                <AccountSecurityTab
                  user={user}
                  onUserUpdate={handleUserUpdate}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              )}

              {currentTab === "profile" && (
                <AccountProfileTab
                  user={user}
                  onUserUpdate={handleUserUpdate}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              )}

              {currentTab === "subscription" && (
                <AccountSubscriptionTab
                  user={user}
                  activeCompany={activeCompany}
                />
              )}

              {currentTab === "appearance" && <AccountAppearanceTab />}

              {currentTab === "features" && (
                <AccountFeaturesTab onSuccess={setSuccess} />
              )}

              {currentTab === "sessions" && <AccountSessionsTab />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
