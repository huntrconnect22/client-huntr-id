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
import { useLanguage } from "../context/LanguageContext";

export default function AccountSettings() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const { t } = useLanguage();
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

  const tabTitles: Record<AccountTabType, { title: string; subtitle: string }> = {
    security: { title: t("settings.tabs.security"), subtitle: t("settings.tabs.securityDesc") },
    profile: { title: t("settings.tabs.profile"), subtitle: t("settings.tabs.profileDesc") },
    subscription: { title: t("settings.tabs.subscription"), subtitle: t("settings.tabs.subscriptionDesc") },
    appearance: { title: t("settings.tabs.appearance"), subtitle: t("settings.tabs.appearanceDesc") },
    features: { title: t("settings.tabs.features"), subtitle: t("settings.tabs.featuresDesc") },
    sessions: { title: t("settings.tabs.sessions"), subtitle: t("settings.tabs.sessionsDesc") },
  };

  const pageTitle = isMobile && mobileSelectedTab
    ? tabTitles[mobileSelectedTab]?.title || t("settings.title")
    : t("settings.title");

  const pageSubtitle = isMobile && mobileSelectedTab
    ? tabTitles[mobileSelectedTab]?.subtitle
    : isMobile
    ? t("settings.subtitleMobile")
    : t("settings.subtitleDesktop");

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
            <ArrowLeft size={14} /> {t("settings.backToMenu")}
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
