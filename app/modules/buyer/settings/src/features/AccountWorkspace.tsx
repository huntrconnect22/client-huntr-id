import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  Box,
  Grid,
  Button,
  Alert,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import Layout from "~/components/Layout";
import { ArrowLeft } from "lucide-react";
import {
  AccountSidebarNav,
  AccountSecurityTab,
  AccountProfileTab,
  AccountSubscriptionTab,
  AccountAppearanceTab,
  AccountFeaturesTab,
  AccountSessionsTab,
  type AccountTabType,
} from "~/features/account";
import { useLanguage } from "~/context/LanguageContext";

/**
 * Account Settings Workspace
 * 
 * 100% Pure Material UI implementation.
 */
export default function AccountSettings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { search } = useLocation();
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
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        console.error("Invalid user session", e);
      }
    }
    if (companySession) {
      try {
        setActiveCompany(JSON.parse(companySession));
      } catch (e) {
        console.error("Invalid company session", e);
      }
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(search).get("tab") === "subscription") {
      setActiveTab("subscription");
      setMobileSelectedTab("subscription");
    }
  }, [search]);

  useEffect(() => {
    if (activeCompany?.type === "vendor" && (activeTab === "features" || mobileSelectedTab === "features")) {
      setActiveTab("security");
      setMobileSelectedTab(null);
    }
  }, [activeCompany?.type, activeTab, mobileSelectedTab]);

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
      <Box sx={{ width: "100%", pb: 8 }}>
        {/* Mobile Back Button when inside a tab */}
        {isMobile && mobileSelectedTab && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => {
              setError(null);
              setSuccess(null);
              setMobileSelectedTab(null);
            }}
            sx={{
              mb: 3,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t("settings.backToMenu")}
          </Button>
        )}

        {/* Feedback messages */}
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: 2.5 }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ mb: 3, borderRadius: 2.5 }}
          >
            {success}
          </Alert>
        )}

        {/* Master-Detail Settings Layout */}
        <Grid container spacing={{ xs: 2.5, md: 3.5 }} sx={{ alignItems: "flex-start" }}>
          {/* Navigation Sidebar: On mobile, shown only when NO sub-tab is selected */}
          {(!isMobile || !mobileSelectedTab) && (
            <Grid size={{ xs: 12, md: 4, lg: 3 }}>
              <AccountSidebarNav
                activeTab={activeTab || "security"}
                companyType={activeCompany?.type}
                onSelectTab={(tab) => {
                  setError(null);
                  setSuccess(null);
                  setActiveTab(tab);
                  if (isMobile) {
                    setMobileSelectedTab(tab);
                  }
                }}
              />
            </Grid>
          )}

          {/* Content Area: On mobile, shown only when a tab is selected. On desktop, always shown */}
          {(!isMobile || mobileSelectedTab) && (
            <Grid size={{ xs: 12, md: 8, lg: 9 }}>
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
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

                {currentTab === "features" && activeCompany?.type !== "vendor" && (
                  <AccountFeaturesTab onSuccess={setSuccess} />
                )}

                {currentTab === "sessions" && <AccountSessionsTab />}
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Layout>
  );
}
