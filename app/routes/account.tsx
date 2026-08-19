import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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

export default function AccountSettings() {
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AccountTabType>("security");
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

  return (
    <Layout title="Account Settings" subtitle="Manage your security, profile, appearance, and active sessions">
      <div className="w-full space-y-6">
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

        {/* Seamless macOS Settings Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start min-h-[520px]">
          {/* Left Navigation Sidebar */}
          <AccountSidebarNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setError(null);
              setSuccess(null);
              setActiveTab(tab);
            }}
          />

          {/* Right Content Area */}
          <div className="flex-1 w-full space-y-6">
            {activeTab === "security" && (
              <AccountSecurityTab
                user={user}
                onUserUpdate={handleUserUpdate}
                onError={setError}
                onSuccess={setSuccess}
              />
            )}

            {activeTab === "profile" && (
              <AccountProfileTab
                user={user}
                onUserUpdate={handleUserUpdate}
                onError={setError}
                onSuccess={setSuccess}
              />
            )}

            {activeTab === "subscription" && (
              <AccountSubscriptionTab
                user={user}
                activeCompany={activeCompany}
              />
            )}

            {activeTab === "appearance" && <AccountAppearanceTab />}

            {activeTab === "features" && (
              <AccountFeaturesTab onSuccess={setSuccess} />
            )}

            {activeTab === "sessions" && <AccountSessionsTab />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
