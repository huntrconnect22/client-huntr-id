import { Button as HuntrButton } from "~/shared/ui/Button";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext } from "react-router";
import { getCartLineCount } from "~/lib/cart";
import Breadcrumb from "~/components/Breadcrumb";
import NotificationSound from "~/components/NotificationSound";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "~/lib/api";
import { SessionManager } from "~/lib/session";
import { useMediaQuery, MOBILE_BREAKPOINT } from "~/hooks/useMediaQuery";
import { useEventBus } from "~/lib/EventBus";
import { getMyCompanies, switchActiveCompany } from "~/lib/api/company";
import { getTrialInfo } from "~/lib/trial";
import GlobalCartPanel from "~/components/GlobalCartPanel";
import TrialBanner from "~/components/TrialBanner";
import PricingAnnouncement from "~/features/account/components/PricingAnnouncement";
import { SubscriptionOverdueNotice } from "../components/SubscriptionOverdueNotice";
import { SubscriptionOverdueAlert } from "../components/SubscriptionOverdueAlert";
import { VerificationBanner } from "~/components/VerificationBanner";

import { AppDrawer } from "../components/AppDrawer";
import { BottomNavigation } from "../components/BottomNavigation";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { UserMenuDropdown } from "../components/UserMenuDropdown";
import { StatusGate } from "../components/StatusGate";
import {
  buildBudgetBottomNavItems,
  buildCrmBottomNavItems,
  buildNavItems,
  buildWmsBottomNavItems,
} from "../components/navigation";
import { calculateNotificationCounts } from "../components/notificationCounts";
import { isAgenticProcurementEnabled } from "~/lib/features";
import { useLanguage } from "~/context/LanguageContext";
import { AppTopbar } from "../components/AppTopbar";
import { getWmsApps } from "~/lib/api/wms";
import { getCrmApps } from "~/lib/api/crm";
import { getBudgetApps } from "~/lib/api/budgeting";
import { getSubscriptionAccess } from "~/lib/api/subscription";

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
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { lastEvent } = useEventBus();
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const { t } = useLanguage();

  // Global backdrop state — child pages (e.g. App Market drawer) can toggle a
  // blurred topbar + sidebar + page by dispatching huntr:global-backdrop event.
  // true => backdrop ON (topbar blurred + page overlayed).
  const [globalBackdropActive, setGlobalBackdropActive] = useState(false);

  useEffect(() => {
    const on = (e: Event) => {
      const ev = e as CustomEvent<{
        active: boolean;
        blur?: number;
        intensity?: string;
      }>;
      // MUI's modal manager makes the application shell unavailable to screen
      // readers while a child-route modal is open. Release any focus within
      // that shell before it becomes isolated.
      if (ev.detail?.active) {
        const focusedElement = document.activeElement;
        if (
          focusedElement instanceof HTMLElement &&
          focusedElement.closest(".huntr-app-shell")
        ) {
          focusedElement.blur();
        }
      }
      setGlobalBackdropActive(Boolean(ev.detail?.active));
      if (ev.detail?.active) setAppDrawerOpen(false);
      if (ev.detail?.blur != null) {
        document.documentElement.style.setProperty(
          "--huntr-global-backdrop-blur",
          `${ev.detail.blur}px`,
        );
      }
      if (ev.detail?.intensity) {
        document.documentElement.style.setProperty(
          "--huntr-global-backdrop-intensity",
          ev.detail.intensity,
        );
      }
      document.documentElement.style.setProperty(
        "--huntr-global-backdrop-z",
        "90",
      );
    };
    window.addEventListener("huntr:global-backdrop", on as EventListener);
    return () =>
      window.removeEventListener("huntr:global-backdrop", on as EventListener);
  }, []);

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
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const appDrawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const appDrawerFocusTimerRef = useRef<number | null>(null);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>(
    {},
  );
  const [cartCount, setCartCount] = useState(0);
  const [agenticEnabled, setAgenticEnabled] = useState(false);
  const [allUserCompanies, setAllUserCompanies] = useState<any[]>([]);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [wmsInstalled, setWmsInstalled] = useState(false);
  const [crmInstalled, setCrmInstalled] = useState(false);
  const [budgetInstalled, setBudgetInstalled] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionAccess, setSubscriptionAccess] = useState<{
    companyId: string;
    overdue: boolean;
    overdueSince: string | null;
    enterprisePlan: string | null;
    isTrial: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const companyId = activeCompany?.id;
    setSubscriptionAccess(null);
    setHasActiveSubscription(false);
    const load = () => {
      if (!companyId || activeCompany?.type !== "buyer") return;
      const currentRequest = ++requestId;
      getSubscriptionAccess(companyId)
        .then((response) => {
          if (
            !active ||
            currentRequest !== requestId ||
            !response ||
            !("access" in response)
          )
            return;
          setHasActiveSubscription(response.access?.active_enterprise === true);
          setSubscriptionAccess({
            companyId,
            overdue: response.access?.overdue === true,
            overdueSince: response.access?.overdue_since ?? null,
            enterprisePlan: response.access?.enterprise_plan ?? null,
            isTrial: response.access?.is_trial === true,
          });
        })
        .catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    window.addEventListener("huntr:subscription-updated", load);
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("huntr:subscription-updated", load);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeCompany?.id, activeCompany?.type]);

  const loadWmsInstallation = useCallback(async () => {
    if (!activeCompany?.id) {
      setWmsInstalled(false);
      return;
    }
    try {
      const response = await getWmsApps(activeCompany.id);
      setWmsInstalled(
        Boolean(
          response?.apps?.find((app: any) => app.key === "wms-inventory")
            ?.installed,
        ),
      );
    } catch {
      setWmsInstalled(false);
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    loadWmsInstallation();
    window.addEventListener(
      "huntr-app-installations-updated",
      loadWmsInstallation,
    );
    return () =>
      window.removeEventListener(
        "huntr-app-installations-updated",
        loadWmsInstallation,
      );
  }, [loadWmsInstallation]);

  const loadCrmInstallation = useCallback(async () => {
    if (!activeCompany?.id) {
      setCrmInstalled(false);
      return;
    }
    try {
      const response = await getCrmApps(activeCompany.id);
      setCrmInstalled(
        Boolean(
          response?.apps?.find((app: any) => app.key === "crm")?.installed,
        ),
      );
    } catch {
      setCrmInstalled(false);
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    loadCrmInstallation();
    window.addEventListener(
      "huntr-app-installations-updated",
      loadCrmInstallation,
    );
    return () =>
      window.removeEventListener(
        "huntr-app-installations-updated",
        loadCrmInstallation,
      );
  }, [loadCrmInstallation]);

  const loadBudgetInstallation = useCallback(async () => {
    if (!activeCompany?.id) { setBudgetInstalled(false); return; }
    try {
      const response = await getBudgetApps(activeCompany.id);
      setBudgetInstalled(Boolean(response?.apps?.find((app: any) => app.key === "budget-procurement-plan" && app.accessible !== false)?.installed));
    } catch { setBudgetInstalled(false); }
  }, [activeCompany?.id]);

  useEffect(() => {
    loadBudgetInstallation();
    window.addEventListener("huntr-app-installations-updated", loadBudgetInstallation);
    return () => window.removeEventListener("huntr-app-installations-updated", loadBudgetInstallation);
  }, [loadBudgetInstallation]);

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
    setAgenticEnabled(isAgenticProcurementEnabled());
    const handleFeatureUpdate = () => {
      setAgenticEnabled(isAgenticProcurementEnabled());
    };
    window.addEventListener("huntr-feature-flags-updated", handleFeatureUpdate);
    window.addEventListener("storage", handleFeatureUpdate);
    return () => {
      window.removeEventListener(
        "huntr-feature-flags-updated",
        handleFeatureUpdate,
      );
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
      const { getAuthenticatedUser } = await import("~/lib/api");
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

  const openAppDrawer = useCallback(() => {
    const focusedElement = document.activeElement;
    appDrawerReturnFocusRef.current =
      focusedElement instanceof HTMLElement ? focusedElement : null;

    // The Dialog is portalled outside `.huntr-app-shell`. Release focus from
    // its trigger before MUI marks the shell aria-hidden.
    appDrawerReturnFocusRef.current?.blur();
    setAppDrawerOpen(true);
  }, []);

  const closeAppDrawer = useCallback(() => {
    setAppDrawerOpen(false);

    if (appDrawerFocusTimerRef.current !== null) {
      window.clearTimeout(appDrawerFocusTimerRef.current);
    }

    const returnTarget = appDrawerReturnFocusRef.current;
    if (!returnTarget) return;

    // Wait until modal isolation is removed, then restore the keyboard user to
    // the exact control that opened the menu.
    appDrawerFocusTimerRef.current = window.setTimeout(() => {
      if (returnTarget.isConnected) {
        returnTarget.focus({ preventScroll: true });
      }
      appDrawerFocusTimerRef.current = null;
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (appDrawerFocusTimerRef.current !== null) {
        window.clearTimeout(appDrawerFocusTimerRef.current);
      }
    };
  }, []);

  const updateHeaderHeight = useCallback(() => {
    const height = headerRef.current?.offsetHeight ?? 64;
    document.documentElement.style.setProperty(
      "--huntr-header-height",
      `${height}px`,
    );
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
    const isGuestRoute =
      pathname === "/" || pathname.startsWith("/marketplace/");
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
    // The root route is the application launchpad. Keep the user there and
    // open the full-screen Main Menu instead of silently routing to Dashboard.
    if (pathname === "/") {
      setAppDrawerOpen(true);
    }
  }, [pathname]);

  // Real-time notification updates
  useEffect(() => {
    if (user && lastEvent) {
      fetchUnreadCount(user.id);
    }
  }, [lastEvent]);

  useEffect(() => {
    if (!user?.id) return;
    const handleLiveNotification = () => {
      fetchUnreadCount(user.id);
    };
    window.addEventListener(
      "huntr:notification_received",
      handleLiveNotification,
    );
    return () =>
      window.removeEventListener(
        "huntr:notification_received",
        handleLiveNotification,
      );
  }, [user?.id]);

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
    if (pathname !== "/") {
      setAppDrawerOpen(false);
    }
  }, [pathname]);

  // Handle outside clicks & escape key for dropdowns
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showNotifications) setShowNotifications(false);
      if (e.key === "Escape" && showUserMenu) setShowUserMenu(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        showNotifications &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(e.target as Node)
      ) {
        const dropdown = document.querySelector(".huntr-notif-dropdown");
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setShowNotifications(false);
        }
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  // Roles & permissions
  const isOwner = activeCompany?.owner_id === user?.id;
  const isManager = user?.role === "manager" || isOwner;
  const isFinance = user?.role === "finance";
  const isBuyerRole = user?.role === "buyer";
  const isAdminRole = user?.role === "admin";
  const canAccessWms = user?.role === "warehouse_admin" || isManager;
  const isBuyerComp = activeCompany?.type === "buyer";
  const isVendorComp = activeCompany?.type === "vendor";

  const canManageApprovals =
    isBuyerComp &&
    (user?.role === "manager" || isOwner) &&
    !isFinance &&
    !isBuyerRole;
  const showBuyerProcurement = isBuyerComp && (isManager || isBuyerRole);
  const showVendorMenu = isVendorComp;

  // Counterparts
  const normalizeNpwp = (t: string) => (t || "").replace(/[^a-zA-Z0-9]/g, "");
  const activeNpwp = normalizeNpwp(activeCompany?.tax_id || "");
  const counterpartVendor = isBuyerComp
    ? allUserCompanies.find(
        (c) =>
          c.type === "vendor" &&
          normalizeNpwp(c.tax_id || "") === activeNpwp &&
          c.status === "approved",
      )
    : null;
  const counterpartBuyer = isVendorComp
    ? allUserCompanies.find(
        (c) =>
          c.type === "buyer" &&
          normalizeNpwp(c.tax_id || "") === activeNpwp &&
          c.status === "approved",
      )
    : null;

  const rejectedCounterpart = isBuyerComp
    ? allUserCompanies.find(
        (c) =>
          c.type === "vendor" &&
          normalizeNpwp(c.tax_id || "") === activeNpwp &&
          c.status === "rejected",
      )
    : isVendorComp
      ? allUserCompanies.find(
          (c) =>
            c.type === "buyer" &&
            normalizeNpwp(c.tax_id || "") === activeNpwp &&
            c.status === "rejected",
        )
      : null;

  const isPendingCompany = activeCompany?.status === "pending";
  const companySlug =
    activeCompany?.slug ||
    (activeCompany?.name
      ? activeCompany.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : "");
  const companyPrefix = companySlug ? `/${companySlug}` : "";
  const isSubscriptionOverdue = Boolean(
    activeCompany?.id &&
    subscriptionAccess?.companyId === activeCompany.id &&
    subscriptionAccess?.overdue,
  );
  const canManageSubscription = isOwner || user?.role === "manager";
  const isWmsPage = /(?:^|\/)wms\/?$/.test(pathname);
  const isCrmPage = /(?:^|\/)crm\/?$/.test(pathname);
  const isBudgetPage = /(?:^|\/)budgeting\/?$/.test(pathname);
  const isCompanyDashboard = Boolean(companyPrefix) && pathname === companyPrefix;
  const isNewPrCheckout =
    /(?:^|\/)checkout\/?$/.test(pathname) &&
    !new URLSearchParams(search).has("revise");

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
    wmsInstalled,
    crmInstalled,
    budgetInstalled,
    canAccessWms,
  });

  const fetchUnreadCount = async (userId: number) => {
    try {
      const res = await getNotifications(userId);
      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
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
      const url = n.data?.url;
      if (url) {
        const targetUrl = new URL(url, window.location.origin);
        if (
          window.location.href === targetUrl.href ||
          window.location.pathname + window.location.search === url ||
          window.location.pathname === targetUrl.pathname
        ) {
          window.location.reload();
        } else {
          window.location.href = url;
        }
      }
    } catch (err) {
      console.error("Failed to handle notification click", err);
      const url = n.data?.url;
      if (url) {
        const targetUrl = new URL(url, window.location.origin);
        if (
          window.location.href === targetUrl.href ||
          window.location.pathname + window.location.search === url ||
          window.location.pathname === targetUrl.pathname
        ) {
          window.location.reload();
        } else {
          window.location.href = url;
        }
      }
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
      navigate("/");
    } catch (err: any) {
      console.error("Failed to switch workspace", err);
      alert("Gagal beralih workspace. Silakan coba lagi.");
    } finally {
      setSwitchingWorkspace(false);
    }
  };

  const handleAppNavigate = () => {
    setAppDrawerOpen(false);
  };

  const handleAppDrawerClose = useCallback(() => {
    closeAppDrawer();

    // The authenticated root is only a launchpad. Closing it intentionally
    // continues to the workspace dashboard, so the page behind the dialog is
    // never a second, confusing home screen.
    if (pathname === "/" && companyPrefix) {
      navigate(companyPrefix, { replace: true });
    }
  }, [closeAppDrawer, companyPrefix, navigate, pathname]);

  const activeNavItem = [...NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find(
      ({ to, exact }) =>
        pathname === to || (!exact && to !== "/" && pathname.startsWith(`${to}/`)),
    );
  const activeNavSection = activeNavItem?.section ?? "main";
  const isProcurementOrDocumentPage =
    activeNavSection === "procurement" ||
    activeNavSection === "orders" ||
    /\/(?:agentic-procurement|marketplace|crowd-buy|my-pr|approvals|pr-audit|rfq|compare-review|checkout|negotiation|orders|direct-po|receipts|bast|efaktur|returns|debit-notes)(?:\/|$)/.test(
      pathname,
    );
  const procurementAndDocumentItems = NAV.filter(
    (item) => item.section === "procurement" || item.section === "orders",
  );
  // The company dashboard is a workspace overview, not an application launcher.
  // Apps are intentionally opened from Main Menu. Each application then owns its
  // overview and operational navigation after the user explicitly enters it.
  const dashboardAppRoutes = new Set([
    `${companyPrefix}/apps`,
    `${companyPrefix}/wms`,
    `${companyPrefix}/crm`,
    `${companyPrefix}/budgeting`,
  ]);
  const dashboardNavItems = NAV.filter(
    (item) => item.section === "main" && !dashboardAppRoutes.has(item.to),
  );
  const contextualNavItems = isCompanyDashboard
    ? dashboardNavItems
    : isWmsPage
    ? buildWmsBottomNavItems(companyPrefix)
    : isCrmPage
      ? buildCrmBottomNavItems(companyPrefix)
      : isBudgetPage
        ? buildBudgetBottomNavItems(companyPrefix)
        : isProcurementOrDocumentPage
          ? procurementAndDocumentItems
        : NAV.filter((item) => item.section === activeNavSection);

  const handleNotificationToggle = useCallback(() => {
    setShowUserMenu(false);
    if (isMobile) {
      navigate("/notifications");
    } else {
      setShowNotifications(!showNotifications);
    }
  }, [isMobile, navigate, showNotifications]);

  const shellContext = useMemo<AppShellContext>(
    () => ({
      setPageTitle,
      setPageSubtitle,
      user,
      company: activeCompany,
    }),
    [activeCompany, user],
  );
  const trialInfo = getTrialInfo(user);
  const isGuestRoute = pathname === "/" || pathname.startsWith("/marketplace/");

  if (!isClient || (!user && isGuestRoute)) {
    return <Outlet context={shellContext} />;
  }

  return (
    <div
      className={`huntr-app-shell${globalBackdropActive ? " huntr-app-shell--global-backdrop" : ""}`}
    >
      <NotificationSound />

      {globalBackdropActive && (
        <div
          className="huntr-global-backdrop"
          onClick={() => {
            // Child pages/drawers listen for this event and close themselves.
            window.dispatchEvent(
              new CustomEvent("huntr:global-backdrop-clicked"),
            );
          }}
          aria-hidden="true"
        />
      )}

      <AppDrawer
        navItems={NAV}
        pathname={pathname}
        pendingCounts={pendingCounts}
        unreadCount={unreadCount}
        companyId={activeCompany?.id}
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
        open={appDrawerOpen}
        onClose={handleAppDrawerClose}
        onNavigate={handleAppNavigate}
      />
      <div className="huntr-main">
        <AppTopbar
          headerRef={headerRef}
          notificationRef={notifButtonRef}
          userMenuRef={userMenuRef}
          obscured={globalBackdropActive}
          title={pageTitle}
          subtitle={pageSubtitle}
          breadcrumb={<Breadcrumb />}
          user={user}
          cartCount={cartCount}
          unreadCount={unreadCount}
          notificationsOpen={showNotifications}
          userMenuOpen={showUserMenu}
          onHome={() => navigate(companyPrefix || "/")}
          onCart={() => window.dispatchEvent(new CustomEvent("huntr-toggle-cart"))}
          onNotifications={handleNotificationToggle}
          onUserMenu={() => { setShowNotifications(false); setShowUserMenu(!showUserMenu); }}
          status={trialInfo.hasTrial &&
              isBuyerComp &&
              !hasActiveSubscription &&
              !isMobile && (
                <HuntrButton
                  type="button"
                  onClick={() => navigate(`${companyPrefix}/account`)}
                  title={t("header.trialEndsOn", {
                    date: trialInfo.formattedEndDate,
                  })}
                  color={trialInfo.isExpired ? "error" : trialInfo.isUrgent ? "warning" : "primary"}
                  style={{ minHeight: 44, fontSize: 14 }}
                >
                  <span>
                    {trialInfo.isExpired
                      ? t("header.trialExpired")
                      : trialInfo.isExpiringSoon
                        ? t("header.trialExpiringSoon", {
                            days: trialInfo.daysRemaining,
                          })
                        : t("header.trialDays", {
                            days: trialInfo.daysRemaining,
                          })}
                  </span>
                </HuntrButton>
              )}
          notificationMenu={showNotifications && (
                <NotificationDropdown
                  unreadCount={unreadCount}
                  recentNotifications={recentNotifications}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onNotificationClick={handleNotificationClick}
                  onClose={() => setShowNotifications(false)}
                />
              )}
          userMenu={showUserMenu && (
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
        />

        {isBuyerComp && !hasActiveSubscription && !isSubscriptionOverdue && (
          <TrialBanner trial={trialInfo} />
        )}
        {isSubscriptionOverdue && user?.id && (
          <>
            <SubscriptionOverdueAlert
              userId={String(user.id)}
              companyId={String(activeCompany.id)}
              companyPrefix={companyPrefix}
              overdueSince={subscriptionAccess?.overdueSince ?? null}
              canManage={canManageSubscription}
            />
            <SubscriptionOverdueNotice
              overdueSince={subscriptionAccess?.overdueSince ?? null}
              companyPrefix={companyPrefix}
              canManage={canManageSubscription}
            />
          </>
        )}
        {user?.id && activeCompany?.id && (isBuyerComp || isVendorComp) && (
          <PricingAnnouncement
            key={`${user.id}:${activeCompany.id}`}
            companyId={activeCompany.id}
            companyType={isBuyerComp ? "buyer" : "vendor"}
            companyPrefix={companyPrefix}
          />
        )}

        <div className="huntr-page-content">
          {activeCompany &&
          activeCompany.status === "rejected" &&
          pathname !== "/company" ? (
            // Blocked: rejected companies cannot access any page
            <StatusGate
              status={activeCompany.status}
              companyName={activeCompany.name}
              verificationNotes={activeCompany.verification_notes}
              onSwitchCompany={handleSwitchCompany}
            />
          ) : isSubscriptionOverdue && (isWmsPage || isNewPrCheckout) ? (
            <SubscriptionOverdueNotice
              page
              isWms={isWmsPage}
              overdueSince={subscriptionAccess?.overdueSince ?? null}
              companyPrefix={companyPrefix}
              canManage={canManageSubscription}
            />
          ) : (
            <>
              {/* Verification nudge banner for starter + pending accounts */}
              {activeCompany &&
                (activeCompany.status === "starter" ||
                  activeCompany.status === "pending") && (
                  <div className="px-4 pt-4">
                    <VerificationBanner company={activeCompany} />
                  </div>
                )}
              <Outlet context={shellContext} />
            </>
          )}
        </div>
      </div>

      <BottomNavigation
        navItems={contextualNavItems}
        pathname={pathname}
        search={search}
        pendingCounts={pendingCounts}
        onOpenMenu={openAppDrawer}
      />

      <GlobalCartPanel companyPrefix={companyPrefix} />
    </div>
  );
}
