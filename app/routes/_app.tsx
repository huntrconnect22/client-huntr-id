import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router";
import { Menu, ShoppingCart, Bell } from "lucide-react";
import { getCartLineCount } from "../lib/cart";
import Breadcrumb from "../components/Breadcrumb";
import NotificationSound from "../components/NotificationSound";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, switchRole } from "../lib/api";
import { SessionManager } from "../lib/session";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";
import { useEventBus } from "../lib/EventBus";
import { getMyCompanies, switchActiveCompany } from "../lib/api/company";
import { getTrialInfo } from "../lib/trial";
import GlobalCartPanel from "../components/GlobalCartPanel";
import TrialBanner from "../components/TrialBanner";

import { SidebarNav } from "../components/app-shell/SidebarNav";
import { SidebarBottomSection } from "../components/app-shell/SidebarBottomSection";
import { NotificationDropdown } from "../components/app-shell/NotificationDropdown";
import { UserMenuDropdown } from "../components/app-shell/UserMenuDropdown";
import { StatusGate } from "../components/app-shell/StatusGate";
import { buildNavItems } from "../components/app-shell/navigation";
import { calculateNotificationCounts } from "../components/app-shell/notificationCounts";

// Context that child Layout wrappers use to push their title/subtitle up here
export interface AppShellContext {
  setPageTitle: (t: string) => void;
  setPageSubtitle: (s: string) => void;
  user: any;
  company: any;
}

export function useAppShell() {
  return useOutletContext<AppShellContext>();
}

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { lastEvent } = useEventBus();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  // Page title/subtitle — child routes push these upward via context
  const [pageTitle, setPageTitle] = useState("Huntr.id");
  const [pageSubtitle, setPageSubtitle] = useState("");

  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [agenticEnabled, setAgenticEnabled] = useState(false);
  const [allUserCompanies, setAllUserCompanies] = useState<any[]>([]);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  // Load all user companies to power the workspace switcher
  const loadUserCompanies = useCallback(async () => {
    try {
      const data = await getMyCompanies();
      const list = Array.isArray(data?.companies) ? data.companies : [];
      setAllUserCompanies(list);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    if (userSession) loadUserCompanies();
  }, [loadUserCompanies]);

  // Sync and listen for Feature Flags updates
  useEffect(() => {
    const { isAgenticProcurementEnabled } = require("../lib/features");
    setAgenticEnabled(isAgenticProcurementEnabled());
    const handleFeatureUpdate = () => {
      setAgenticEnabled(isAgenticProcurementEnabled());
    };
    window.addEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
    window.addEventListener("storage", handleFeatureUpdate);
    return () => {
      window.removeEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
      window.removeEventListener("storage", handleFeatureUpdate);
    };
  }, []);

  // Update cart count when cart changes
  useEffect(() => {
    const updateCart = () => {
      setCartCount(getCartLineCount());
    };
    updateCart();
    window.addEventListener("huntr-cart-updated", updateCart);
    return () => window.removeEventListener("huntr-cart-updated", updateCart);
  }, []);

  // Function to fetch fresh user data from backend
  const fetchFreshUserData = async () => {
    try {
      const { getAuthenticatedUser } = await import("../lib/api");
      const freshUser = await getAuthenticatedUser();
      const currentUser = SessionManager.getUser();
      if (currentUser?.token) {
        freshUser.token = currentUser.token;
      }
      SessionManager.setUser(freshUser);
      setUser(freshUser);
    } catch (err) {
      console.error("Failed to fetch fresh user data:", err);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const syncSession = () => {
      const u = SessionManager.getUser();
      const c = SessionManager.getCompany();
      setUser(u);
      setActiveCompany(c);
      if (u?.id) fetchUnreadCount(u.id as number);
    };
    syncSession();
    const unsubscribe = SessionManager.subscribe(syncSession);
    return () => {
      unsubscribe();
    };
  }, []);

  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const updateHeaderHeight = useCallback(() => {
    const height = headerRef.current?.offsetHeight ?? 64;
    document.documentElement.style.setProperty("--huntr-header-height", `${height}px`);
  }, []);

  useEffect(() => {
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    const observer = new ResizeObserver(updateHeaderHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      observer.disconnect();
    };
  }, [updateHeaderHeight, pageTitle, pageSubtitle]);

  // Auth guard
  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    if (userSession) {
      const u = JSON.parse(userSession);
      setUser(u);
      fetchUnreadCount(u.id);
    }
    if (companySession) {
      setActiveCompany(JSON.parse(companySession));
    }
    const isGuestRoute = pathname === "/" || pathname.startsWith("/marketplace/");
    if (!userSession) {
      if (isGuestRoute) return;
      navigate("/login");
      return;
    }
    if (!companySession) {
      if (isGuestRoute) return;
      navigate("/select-company");
      return;
    }
  }, []);

  // Nav guard when route changes — reads via SessionManager to stay in sync
  useEffect(() => {
    const u = SessionManager.getUser();
    const c = SessionManager.getCompany();
    const isGuestRoute = pathname === "/";

    if (!u) {
      if (isGuestRoute) {
        setUser(null);
        setActiveCompany(null);
        return;
      }
      navigate("/login");
      return;
    }
    if (!c) {
      if (isGuestRoute) return;
      navigate("/select-company");
      return;
    }
    // Do NOT overwrite state here — syncSession (subscribed to SessionManager) already keeps state in sync.
    // Only handle redirect for root path.
    const slug = c?.slug || (c?.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "");
    if (slug && pathname === "/") {
      navigate(`/${slug}`, { replace: true });
    }
  }, [pathname]);

  // Real-time notification updates
  useEffect(() => {
    if (user && lastEvent) {
      fetchUnreadCount(user.id);
    }
  }, [lastEvent]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => fetchUnreadCount(user.id), 30_000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (user?.id && activeCompany?.id) {
      fetchUnreadCount(user.id);
    }
  }, [user?.id, activeCompany?.id]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  // Handle outside clicks & escape key for dropdowns
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotifications) setShowNotifications(false);
      if (e.key === 'Escape' && showUserMenu) setShowUserMenu(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (showNotifications && notifButtonRef.current && !notifButtonRef.current.contains(e.target as Node)) {
        const dropdown = document.querySelector('.huntr-notif-dropdown');
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setShowNotifications(false);
        }
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  // Roles & permissions
  const isOwner = activeCompany?.owner_id === user?.id;
  const isManager = user?.role === "manager" || isOwner;
  const isFinance = user?.role === "finance";
  const isBuyerRole = user?.role === "buyer";
  const isAdminRole = user?.role === "admin";
  const isBuyerComp = activeCompany?.type === "buyer";
  const isVendorComp = activeCompany?.type === "vendor";

  const canManageApprovals = isBuyerComp && (user?.role === "manager" || isOwner) && !isFinance && !isBuyerRole;
  const showBuyerProcurement = isBuyerComp && (isManager || isBuyerRole);
  const showVendorMenu = isVendorComp;

  // Counterparts
  const normalizeNpwp = (t: string) => (t || "").replace(/[^a-zA-Z0-9]/g, "");
  const activeNpwp = normalizeNpwp(activeCompany?.tax_id || "");
  const counterpartVendor = isBuyerComp
    ? allUserCompanies.find(
        (c) => c.type === "vendor" && normalizeNpwp(c.tax_id || "") === activeNpwp && c.status === "approved"
      )
    : null;
  const counterpartBuyer = isVendorComp
    ? allUserCompanies.find(
        (c) => c.type === "buyer" && normalizeNpwp(c.tax_id || "") === activeNpwp && c.status === "approved"
      )
    : null;

  const rejectedCounterpart = isBuyerComp
    ? allUserCompanies.find(
        (c) => c.type === "vendor" && normalizeNpwp(c.tax_id || "") === activeNpwp && c.status === "rejected"
      )
    : isVendorComp
    ? allUserCompanies.find(
        (c) => c.type === "buyer" && normalizeNpwp(c.tax_id || "") === activeNpwp && c.status === "rejected"
      )
    : null;

  const isPendingCompany = activeCompany?.status === "pending";
  const companySlug = activeCompany?.slug || (activeCompany?.name ? activeCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "");
  const companyPrefix = companySlug ? `/${companySlug}` : "";

  const NAV = buildNavItems({
    isPendingCompany,
    companyPrefix,
    showBuyerProcurement,
    canManageApprovals,
    agenticEnabled,
    showVendorMenu,
    isManager,
    isAdminRole,
    isVendorComp,
  });

  const fetchUnreadCount = async (userId: number) => {
    try {
      const res = await getNotifications(userId);
      const dataArray = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const unread = dataArray.filter((n: any) => n.read_at === null).length;
      setUnreadCount(unread);
      setRecentNotifications(dataArray.slice(0, 5));
      setPendingCounts(calculateNotificationCounts(dataArray, unread));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!user) return;
    try {
      if (n.read_at === null) {
        await markNotificationAsRead(n.id, user.id);
        fetchUnreadCount(user.id);
      }
      setShowNotifications(false);
      if (n.data?.url) navigate(n.data.url);
    } catch (err) {
      console.error("Failed to handle notification click", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.id);
      fetchUnreadCount(user.id);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    localStorage.removeItem("active_company");
    window.location.href = "/";
  };

  const handleSwitchCompany = () => {
    localStorage.removeItem("active_company");
    navigate("/select-company");
  };

  const handleRoleSwitch = async (role: string) => {
    if (!user) return;
    try {
      setRoleSwitching(true);
      await switchRole(role);
      await fetchFreshUserData();
    } catch (err: any) {
      console.error("Failed to switch role", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Gagal beralih peran!";
      alert(`${errorMessage} Silakan coba lagi.`);
    } finally {
      setRoleSwitching(false);
    }
  };

  const handleSwitchWorkspace = async (targetCompany: any) => {
    if (!targetCompany) return;
    setSwitchingWorkspace(true);
    try {
      const res = await switchActiveCompany(targetCompany.id);
      // Use the server response company if available (has latest data), fallback to targetCompany
      const freshCompany = res?.company ?? targetCompany;
      // Use SessionManager so all subscribers (syncSession) are notified immediately
      SessionManager.setCompany(freshCompany);
      if (res?.user) {
        const current = SessionManager.getUser() ?? {};
        SessionManager.setUser({ ...current, ...res.user });
      }
      await loadUserCompanies();
      const slug = freshCompany.slug || freshCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      navigate(`/${slug}`);
    } catch (err: any) {
      console.error("Failed to switch workspace", err);
      alert("Gagal beralih workspace. Silakan coba lagi.");
    } finally {
      setSwitchingWorkspace(false);
    }
  };

  const closeSidebar = () => setSidebarOpen(false);
  const handleNavClick = () => { if (isMobile) closeSidebar(); };

  const handleNotificationToggle = useCallback(() => {
    if (isMobile) {
      navigate("/notifications");
    } else {
      setShowNotifications(!showNotifications);
    }
  }, [isMobile, navigate, showNotifications]);

  const sidebarInner = (
    <>
      <div style={{ padding: "0 20px 24px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%" }}>
          <Link to="/" onClick={handleNavClick} style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", textDecoration: "none" }}>
            <img src="/assets/img/logo/sidebar.png" alt="Huntr Logo"
              style={{ width: 260, height: 64, objectFit: "contain", flexShrink: 0, marginLeft: 0, display: "block", cursor: "pointer" }} />
          </Link>
        </div>
      </div>

      <SidebarNav
        navItems={NAV}
        pathname={pathname}
        pendingCounts={pendingCounts}
        onNavClick={handleNavClick}
      />

      <SidebarBottomSection
        user={user}
        activeCompany={activeCompany}
        isBuyerComp={isBuyerComp}
        isVendorComp={isVendorComp}
        roleSwitching={roleSwitching}
        switchingWorkspace={switchingWorkspace}
        counterpartBuyer={counterpartBuyer}
        counterpartVendor={counterpartVendor}
        rejectedCounterpart={rejectedCounterpart}
        onRoleSwitch={handleRoleSwitch}
        onSwitchWorkspace={handleSwitchWorkspace}
        onSwitchCompany={handleSwitchCompany}
      />
    </>
  );

  const shellContext: AppShellContext = { setPageTitle, setPageSubtitle, user, company: activeCompany };
  const trialInfo = getTrialInfo(user);
  const isGuestRoute = pathname === "/" || pathname.startsWith("/marketplace/");
  
  if (!isClient || (!user && isGuestRoute)) {
    return <Outlet context={shellContext} />;
  }

  return (
    <div className="huntr-app-shell">
      <NotificationSound />

      {sidebarOpen && <div className="huntr-sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />}
      <aside className={`huntr-sidebar${sidebarOpen ? " huntr-sidebar--open" : ""}`}>
        {sidebarInner}
      </aside>

      <div className="huntr-main">
        <header ref={headerRef} className="huntr-main-header">
          <div className="huntr-header-leading">
            <button type="button" className="huntr-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
              <Menu size={20} />
            </button>
            <div className="huntr-header-titles">
              <Breadcrumb />
              <h1>{pageTitle}</h1>
              {pageSubtitle && <p>{pageSubtitle}</p>}
            </div>
          </div>

          <div className="huntr-header-actions">
            {trialInfo.hasTrial && isBuyerComp && !isMobile && (
              <button
                type="button"
                onClick={() => navigate(`${companyPrefix}/account`)}
                title={`Masa trial berakhir pada ${trialInfo.formattedEndDate}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 6,
                  background: trialInfo.isExpired
                    ? "rgba(239, 68, 68, 0.12)"
                    : trialInfo.isUrgent
                    ? "rgba(249, 115, 22, 0.15)"
                    : "var(--ui-bg-input)",
                  border: trialInfo.isExpired
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : trialInfo.isUrgent
                    ? "1px solid rgba(249, 115, 22, 0.35)"
                    : "1px solid var(--ui-border)",
                  color: trialInfo.isExpired
                    ? "#ef4444"
                    : trialInfo.isUrgent
                    ? "#f97316"
                    : "var(--ui-text-secondary)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                className="hover:border-orange-500/50"
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: trialInfo.isExpired ? "#ef4444" : trialInfo.isUrgent ? "#f97316" : "#10b981",
                    display: "inline-block",
                  }}
                  className={trialInfo.isUrgent ? "animate-pulse" : ""}
                />
                <span>
                  {trialInfo.isExpired
                    ? "Trial Berakhir"
                    : trialInfo.isExpiringSoon
                    ? `Trial: Sisa ${trialInfo.daysRemaining} Hari`
                    : `Trial: ${trialInfo.daysRemaining} Hari`}
                </span>
              </button>
            )}

            {!isMobile && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("huntr-toggle-cart"))}
                aria-label={`View cart (${cartCount} items in cart)`}
                style={{
                  position: "relative",
                  width: 34,
                  height: 34,
                  borderRadius: 4,
                  background: "var(--ui-bg-input)",
                  border: "1px solid var(--ui-border)",
                  color: cartCount > 0 ? "#fb923c" : "var(--ui-text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <ShoppingCart size={16} />
                {cartCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 2,
                    background: "#f59e0b",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px"
                  }}>
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            <div style={{ position: "relative" }}>
              <button 
                ref={notifButtonRef} 
                onClick={handleNotificationToggle}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                style={{ 
                  position: "relative", 
                  width: 34, 
                  height: 34, 
                  borderRadius: 8, 
                  background: "var(--ui-bg-input)", 
                  border: "1px solid var(--ui-border)", 
                  color: unreadCount > 0 ? "#fb923c" : "var(--ui-text-muted)", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  transition: "all 0.2s" 
                }}
              >
                <Bell size={16} fill={unreadCount > 0 ? "rgba(249,115,22,0.2)" : "none"} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 4, background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown
                  unreadCount={unreadCount}
                  recentNotifications={recentNotifications}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onNotificationClick={handleNotificationClick}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {user && (
              <div ref={userMenuRef} className="huntr-user-menu-wrap">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label={`User menu, ${user.name}`}
                  className={`huntr-user-menu-btn${showUserMenu ? " huntr-user-menu-btn--open" : ""}`}
                >
                  <div className="huntr-user-avatar">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  {!isMobile && (
                    <div className="huntr-user-menu-label">
                      <span className="huntr-user-menu-name">{user.name}</span>
                      <span className="huntr-user-menu-email">{user.email || "No email"}</span>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <UserMenuDropdown
                    user={user}
                    activeCompany={activeCompany}
                    isVendorComp={isVendorComp}
                    isBuyerComp={isBuyerComp}
                    counterpartBuyer={counterpartBuyer}
                    counterpartVendor={counterpartVendor}
                    rejectedCounterpart={rejectedCounterpart}
                    switchingWorkspace={switchingWorkspace}
                    onSwitchWorkspace={handleSwitchWorkspace}
                    onLogout={handleLogout}
                    onClose={() => setShowUserMenu(false)}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        {isBuyerComp && <TrialBanner trial={trialInfo} />}

        <div className="huntr-page-content">
          {activeCompany &&
          (activeCompany.status === "rejected" ||
            activeCompany.status === "pending") &&
          pathname !== "/company" ? (
            <StatusGate
              status={activeCompany.status}
              companyName={activeCompany.name}
              verificationNotes={activeCompany.verification_notes}
              onSwitchCompany={handleSwitchCompany}
            />
          ) : (
            <Outlet context={shellContext} />
          )}
        </div>
      </div>

      <GlobalCartPanel companyPrefix={companyPrefix} />
    </div>
  );
}

