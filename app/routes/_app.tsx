import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router";
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Package,
  ClipboardList,
  Lightbulb,
  Trophy,
  CheckCircle2,
  ReceiptText,
  LogOut,
  ArrowLeftRight,
  List,
  Bell,
  Settings,
  Medal,
  Menu,
  X,
  History,
  MessageSquare,
  Briefcase,
  FileText,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { loadCart, getCartLineCount } from "../lib/cart";
import Breadcrumb from "../components/Breadcrumb";
import NotificationSound from "../components/NotificationSound";
import ThemeToggle from "../components/ThemeToggle";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, switchRole } from "../lib/api";
import { SessionManager } from "../lib/session";
import { useTheme } from "../context/ThemeContext";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";
import { useEventBus } from "../lib/EventBus";
import { isDemoMode, isNavItemDisabledInDemo } from "../lib/demo-mode";
import { isAgenticProcurementEnabled } from "../lib/features";
import { getMyCompanies, switchActiveCompany } from "../lib/api/company";
import { getTrialInfo } from "../lib/trial";
import GlobalCartPanel from "../components/GlobalCartPanel";
import TrialBanner from "../components/TrialBanner";

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
  const { isDark, isAuto } = useTheme();
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
  const [roleSwitching, setRoleSwitching] = useState(false); // For role switch loading state
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
      
      // Merge with existing token if available
      const currentUser = SessionManager.getUser();
      if (currentUser?.token) {
        freshUser.token = currentUser.token;
      }
      
      // Update both SessionManager and local state
      SessionManager.setUser(freshUser);
      setUser(freshUser);
      
      console.log("Fresh user data fetched:", freshUser);
    } catch (err) {
      console.error("Failed to fetch fresh user data:", err);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    if (userSession) {
      const userData = JSON.parse(userSession);
      setUser(userData);
      
      // If user doesn't have a role, fetch fresh user data
      if (!userData.role) {
        fetchFreshUserData();
      }
    }
    if (companySession) {
      setActiveCompany(JSON.parse(companySession));
    }
    
    // Subscribe to session changes
    const unsubscribe = SessionManager.subscribe(() => {
      const userSession = localStorage.getItem("user_session");
      const companySession = localStorage.getItem("active_company");
      if (userSession) setUser(JSON.parse(userSession));
      if (companySession) setActiveCompany(JSON.parse(companySession));
    });
    
    // Wrap to ensure we don't return boolean
    return () => {
      unsubscribe();
    };
  }, []);

  // Sidebar scroll — persists forever because this component never unmounts
  const navScrollRef = React.useRef<HTMLDivElement>(null);
  const notifButtonRef = React.useRef<HTMLButtonElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLElement>(null);

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

  // ── Auth guard ────────────────────────────────────────────────────────────
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
  }, []); // Only on mount — shell never unmounts, so this runs once

  // ── Nav refresh when route changes (re-check auth & ensure company slug URL) ──
  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    const isGuestRoute = pathname === "/";

    if (!userSession) {
      if (isGuestRoute) {
        setUser(null);
        setActiveCompany(null);
        return;
      }
      navigate("/login");
      return;
    }
    if (!companySession) {
      if (isGuestRoute) return;
      navigate("/select-company");
      return;
    }
    
    const u = JSON.parse(userSession);
    const c = JSON.parse(companySession);
    setUser(u);
    setActiveCompany(c);

    // If user is at root "/" after logging in, redirect to active company slug route
    const slug = c?.slug || (c?.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "");
    if (slug && pathname === "/") {
      navigate(`/${slug}`, { replace: true });
    }
  }, [pathname]);

  // ── Real-time: refresh counts on new event ───────────────────────────────
  useEffect(() => {
    if (user && lastEvent) {
      fetchUnreadCount(user.id);
    }
  }, [lastEvent]);

  // ── Real-time: poll every 30 s ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => fetchUnreadCount(user.id), 30_000);
    return () => clearInterval(id);
  }, [user]);

  // ── Refresh notifications when active company changes ────────────────────
  useEffect(() => {
    if (user?.id && activeCompany?.id) {
      fetchUnreadCount(user.id);
    }
  }, [user?.id, activeCompany?.id]);

  // ── Close mobile sidebar on navigation ───────────────────────────────────
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  // ── Enhanced notification close functionality ────────────────────────────
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotifications) {
        setShowNotifications(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Additional safeguard for click outside (if backdrop fails)
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

    if (showNotifications) {
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when notifications are open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore body scroll
      document.body.style.overflow = '';
    };
  }, [showNotifications]);

  // ── Lock body scroll when mobile sidebar open ─────────────────────────────
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sidebarOpen]);

  // ── Roles ────────────────────────────────────────────────────────────────
  const isOwner = activeCompany?.owner_id === user?.id;
  const isManager = user?.role === "manager" || isOwner;
  const isFinance = user?.role === "finance";
  const isBuyerRole = user?.role === "buyer";
  const isAdminRole = user?.role === "admin";
  const isBuyerComp = activeCompany?.type === "buyer";
  const isVendorComp = activeCompany?.type === "vendor";

  // Only true managers (not buyer, not finance) can approve
  const canManageApprovals = isBuyerComp && (user?.role === "manager" || isOwner) && !isFinance && !isBuyerRole;

  // Procurement visibility based purely on active workspace type
  const showBuyerProcurement = isBuyerComp && (isManager || isBuyerRole);
  const showVendorMenu = isVendorComp;

  // Find linked counterpart workspace (same NPWP, different type)
  const normalizeNpwp = (t: string) => (t || "").replace(/[^a-zA-Z0-9]/g, "");
  const activeNpwp = normalizeNpwp(activeCompany?.tax_id || "");
  const counterpartVendor = isBuyerComp
    ? allUserCompanies.find(
        (c) => c.type === "vendor" && normalizeNpwp(c.tax_id || "") === activeNpwp
      )
    : null;
  const counterpartBuyer = isVendorComp
    ? allUserCompanies.find(
        (c) => c.type === "buyer" && normalizeNpwp(c.tax_id || "") === activeNpwp
      )
    : null;

  // ── Nav items ─────────────────────────────────────────────────────────────
  const isPendingCompany = activeCompany?.status === "pending";
  const companySlug = activeCompany?.slug || (activeCompany?.name ? activeCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : "");
  const companyPrefix = companySlug ? `/${companySlug}` : "";

  const NAV = [
    ...(isPendingCompany ? [
      { to: `${companyPrefix}/company`, label: "Company", Icon: Building2, section: "settings", badge: "companyAlerts" },
      { to: `${companyPrefix}/account`, label: "Settings", Icon: Settings, section: "settings", badge: "accountAlerts" },
    ] : [
      { to: `${companyPrefix || "/"}`, label: "Dashboard", Icon: LayoutDashboard, section: "main", exact: true },
      { to: `${companyPrefix}/tasks`, label: "Tasks", Icon: ListTodo, section: "main", badge: "totalUnread" },

      // Procurement (Buyer & Vendor Buyer Mode)
      ...(showBuyerProcurement ? [
        ...(agenticEnabled ? [
          { to: `${companyPrefix}/agentic-procurement`, label: "AI Agentic Procurement", Icon: Sparkles, section: "procurement", isAi: true },
        ] : []),
        { to: `${companyPrefix}/marketplace`, label: "Huntr Catalog", Icon: Package, section: "procurement" },
        { to: `${companyPrefix}/my-pr`, label: "My PR", Icon: ClipboardList, section: "procurement", badge: "pendingNewProposals" },
      ] : []),
      ...(canManageApprovals ? [
        { to: `${companyPrefix}/approvals`, label: "Approvals", Icon: CheckCircle2, section: "procurement", badge: "pendingApprovals" },
      ] : []),
      ...(showBuyerProcurement ? [
        { to: `${companyPrefix}/pr-audit`, label: "PR Audit Log", Icon: History, section: "procurement" },
      ] : []),

      // Vendor (Only in Vendor Mode)
      ...(showVendorMenu ? [
        { to: `${companyPrefix}/all-requests`, label: "All Request", Icon: Lightbulb, section: "vendor", badge: "opportunities" },
      ] : []),
      ...(showVendorMenu && (isManager || isAdminRole) ? [
        { to: `${companyPrefix}/catalogue`, label: "Catalogue", Icon: List, section: "vendor", badge: "catalogueAlerts" },
        { to: `${companyPrefix}/proposals`, label: "Proposals", Icon: Trophy, section: "vendor", badge: "pendingProposals" },
      ] : []),
      ...(showVendorMenu && (isManager || isAdminRole) ? [
        { to: `${companyPrefix}/my-rank`, label: "My Rank", Icon: Medal, section: "vendor", badge: "rankAlerts" },
      ] : []),

      // Orders & Documents
      { to: `${companyPrefix}/negotiation`, label: "Negotiations", Icon: MessageSquare, section: "orders", badge: "negotiations" },
      ...(isVendorComp ? [
        { to: `${companyPrefix}/orders`, label: "Purchase Order", Icon: ReceiptText, section: "orders", badge: "pendingPurchaseOrders" },
      ] : [
        { to: `${companyPrefix}/orders`, label: "Purchase Order", Icon: ReceiptText, section: "orders", badge: "buyerOrderAlerts" },
      ]),
      { to: `${companyPrefix}/receipts`, label: "Goods Receipt", Icon: CheckCircle2, section: "orders", badge: "receiptsToInspect" },
      { to: `${companyPrefix}/bast`, label: "BAST", Icon: FileText, section: "orders", badge: "pendingBast" },
      { to: `${companyPrefix}/efaktur`, label: "e-Faktur", Icon: ReceiptText, section: "orders" },
      { to: `${companyPrefix}/returns`, label: "Returns", Icon: Package, section: "orders", badge: "pendingReturns" },
      { to: `${companyPrefix}/debit-notes`, label: "Debit Notes", Icon: Briefcase, section: "orders", badge: "pendingDebitNotes" },

      // Finance
      ...(canManageApprovals ? [
        { to: `${companyPrefix}/finance`, label: "Finance Approval", Icon: Briefcase, section: "finance", badge: "financeApprovals" },
      ] : []),
      { to: `${companyPrefix}/payment-history`, label: "Payment History", Icon: History, section: "finance" },

      // Settings
      { to: `${companyPrefix}/company`, label: "Company", Icon: Building2, section: "settings", badge: "companyAlerts" },
      { to: `${companyPrefix}/account`, label: "Settings", Icon: Settings, section: "settings", badge: "accountAlerts" },
    ]),
  ].filter((item: any) => !isNavItemDisabledInDemo(item.to));

  // ── Notification logic ───────────────────────────────────────────────────
  const fetchUnreadCount = async (userId: number) => {
    try {
      const res = await getNotifications(userId);
      const dataArray = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      const unread = dataArray.filter((n: any) => n.read_at === null).length;
      setUnreadCount(unread);
      setRecentNotifications(dataArray.slice(0, 5));
      calculatePendingCounts(dataArray, unread);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const calculatePendingCounts = (notifications: any[], totalUnread = 0) => {
    const counts: Record<string, number> = {
      totalUnread,
      pendingApprovals: 0,
      opportunities: 0,
      pendingProposals: 0,
      negotiations: 0,
      receiptsToInspect: 0,
      pendingReturns: 0,
      pendingDebitNotes: 0,
      financeApprovals: 0,
      pendingNewProposals: 0,
      pendingPurchaseOrders: 0,
      pendingBast: 0,
      catalogueAlerts: 0,
      rankAlerts: 0,
      buyerOrderAlerts: 0,
      companyAlerts: 0,
      accountAlerts: 0,
    };

    notifications.forEach((n: any) => {
      if (n.read_at) return;
      const type = n.data?.type || n.type;
      if (type === "rfq_created" || type === "rfq_published") {
        counts.opportunities++;
      } else if (type === "proposal_submitted") {
        counts.pendingProposals++;
        counts.pendingNewProposals++;
      } else if (type === "proposal_awarded" || type === "award_received") {
        counts.pendingProposals++;
        counts.rankAlerts++;
      } else if (type === "negotiation_started" || type === "negotiation_response") {
        counts.negotiations++;
      } else if (type === "goods_delivered" || type === "delivery_order_created") {
        counts.receiptsToInspect++;
        counts.buyerOrderAlerts++;
      } else if (type === "return_created" || type === "resolution_proposed" || type === "goods_receipt_rejected_items") {
        counts.pendingReturns++;
      } else if (type === "debit_note_issued") {
        counts.pendingDebitNotes++;
      } else if (["invoice_published", "payment_pending", "payment_success", "payment_received"].includes(type)) {
        counts.financeApprovals++;
      } else if (
        type === "pending_approval" ||
        type === "winner_approval" ||
        type === "pr_created" ||
        type?.includes("approval") ||
        type?.includes("review")
      ) {
        counts.pendingApprovals++;
      } else if (type === "purchase_order_created") {
        counts.pendingPurchaseOrders++;
        counts.buyerOrderAlerts++;
      } else if (type === "goods_received" || type === "bast_issued") {
        counts.pendingBast++;
      } else if (type === "catalogue_update" || type === "catalogue_expiry") {
        counts.catalogueAlerts++;
      } else if (type === "company_verified" || type === "company_rejected") {
        counts.companyAlerts++;
        counts.accountAlerts++;
      } else if (["ranking_update", "award_received"].includes(type)) {
        counts.rankAlerts++;
      }
    });

    setPendingCounts(counts);
  };

  const handleNotificationClick = async (n: any) => {
    if (!user) return;
    try {
      if (n.read_at === null) {
        await markNotificationAsRead(n.id, user.id);
        fetchUnreadCount(user.id);
      }
      closeNotifications();
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
      const res = await switchRole(role);
      console.log("Role switched successfully:", res);
      
      // Force refresh user data after role switch
      await fetchFreshUserData();
      
    } catch (err: any) {
      console.error("Failed to switch role", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Gagal beralih peran!";
      alert(`${errorMessage} Silakan coba lagi.`);
    } finally {
      setRoleSwitching(false);
    }
  };

  /**
   * Switch to a different workspace (Buyer ↔ Vendor).
   * Calls backend to update user.company_id, then refreshes local session.
   */
  const handleSwitchWorkspace = async (targetCompany: any) => {
    if (!targetCompany) return;
    setSwitchingWorkspace(true);
    try {
      const res = await switchActiveCompany(targetCompany.id);
      // Update localStorage session with new company and refreshed user
      localStorage.setItem("active_company", JSON.stringify(targetCompany));
      if (res?.user) {
        const current = JSON.parse(localStorage.getItem("user_session") || "{}");
        localStorage.setItem("user_session", JSON.stringify({ ...current, ...res.user }));
        setUser({ ...current, ...res.user });
      }
      setActiveCompany(targetCompany);
      await loadUserCompanies();
      const slug = targetCompany.slug || targetCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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

  // ── Enhanced notification handlers ───────────────────────────────────────
  const handleNotificationToggle = useCallback(() => {
    if (isMobile) {
      navigate("/notifications");
    } else {
      setShowNotifications(!showNotifications);
    }
  }, [isMobile, navigate, showNotifications]);

  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  // Focus management for notifications
  useEffect(() => {
    if (showNotifications && !isMobile) {
      // Focus the first notification item or the dropdown itself
      const dropdown = document.querySelector('.huntr-notif-dropdown');
      if (dropdown) {
        const firstItem = dropdown.querySelector('button, [tabindex="0"]');
        if (firstItem) {
          (firstItem as HTMLElement).focus();
        } else {
          (dropdown as HTMLElement).focus();
        }
      }
    }
  }, [showNotifications, isMobile]);

  // ── Sidebar JSX ──────────────────────────────────────────────────────────
  const sectionLabels: Record<string, string> = {
    main: "Main",
    procurement: "Procurement",
    vendor: "Vendor",
    orders: "Orders & Documents",
    finance: "Finance",
    settings: "Settings",
  };

  const sidebarInner = (
    <>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%" }}>
          <Link to="/" onClick={handleNavClick} style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", width: "100%", textDecoration: "none" }}>
            <img src="/assets/img/logo/sidebar.png" alt="Huntr Logo"
              style={{ width: 260, height: 64, objectFit: "contain", flexShrink: 0, marginLeft: 0, display: "block", cursor: "pointer" }} />
          </Link>
        </div>
      </div>

      {/* Nav — ref is stable (never re-created) so scroll position is preserved */}
      <nav ref={navScrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, padding: "0 10px", overflowY: "auto" }}>
        {(() => {
          let currentSection = "";
          return NAV.map(({ to, label, Icon, section, badge, exact, isAi }: any) => {
            const active = pathname === to || (!exact && to !== "/" && pathname.startsWith(to + "/"));
            const badgeCount = badge ? pendingCounts[badge] || 0 : 0;
            const showSection = section && section !== currentSection;
            if (showSection) currentSection = section;

            return (
              <React.Fragment key={to}>
                {showSection && (
                  <div style={{ fontSize: 9, fontWeight: 800, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "12px 12px 6px", marginTop: currentSection === "main" ? 0 : 8 }}>
                    {sectionLabels[section] || section}
                  </div>
                )}
                <Link to={to} onClick={handleNavClick} className="huntr-nav-item" style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 12px", borderRadius: 8,
                  background: active ? "var(--ui-nav-active-bg)" : "transparent",
                  border: active ? "1px solid var(--ui-nav-active-border)" : "1px solid transparent",
                  color: active ? "var(--ui-text-nav-active)" : "var(--ui-text-nav-idle)",
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  textDecoration: "none", transition: "all 0.15s",
                  position: "relative",
                }}>
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {isAi && (
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "linear-gradient(135deg, #f97316, #f59e0b)", color: "#fff", letterSpacing: "0.05em" }}>
                      AI
                    </span>
                  )}
                  {badgeCount > 0 && (
                    <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: active ? "#f59e0b" : "rgba(249,115,22,0.15)", color: active ? "#fff" : "#f59e0b", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                  {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />}
                </Link>
              </React.Fragment>
            );
          });
        })()}
      </nav>

      {/* Active Company Badge — Sidebar bottom */}
      {activeCompany && (
        <div style={{ margin: "8px 8px 0", borderTop: "1px solid var(--ui-border)", paddingTop: 10 }}>
          {/* Dev: role switcher */}
          {import.meta.env.DEV && user && (
            <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Debug: Switch Role</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {(() => {
                  const buyerRoles = ["manager", "buyer", "finance"];
                  const vendorRoles = ["manager", "admin", "finance", "buyer"];
                  const roles = isBuyerComp ? buyerRoles : vendorRoles;
                  return roles.map((role) => (
                    <button key={role} onClick={() => handleRoleSwitch(role)} disabled={roleSwitching || user.role === role}
                      style={{ padding: "3px 7px", borderRadius: 6, fontSize: 9, fontWeight: 600, background: user.role === role ? "rgba(249,115,22,0.15)" : "var(--ui-bg-input)", border: user.role === role ? "1px solid rgba(249,115,22,0.35)" : "1px solid var(--ui-border)", color: user.role === role ? "#f97316" : "var(--ui-text-muted)", cursor: user.role === role ? "not-allowed" : "pointer", textTransform: "capitalize", transition: "all 0.15s ease" }}>
                      {role}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
          <div style={{ background: "var(--ui-bg-badge)", border: "1px solid var(--ui-border-badge)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5, textTransform: "uppercase" }}>Active Workspace</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: isBuyerComp
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "linear-gradient(135deg,#f97316,#f59e0b)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <Building2 size={13} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeCompany.name}</div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "1px 6px", borderRadius: 4, fontWeight: 800, fontSize: 8,
                    background: isBuyerComp ? "rgba(99,102,241,0.15)" : "rgba(249,115,22,0.15)",
                    color: isBuyerComp ? "#818cf8" : "#f97316",
                  }}>
                    {isBuyerComp ? "BUYER" : "VENDOR"}
                  </span>
                  {(activeCompany.formatted_tax_id || activeCompany.tax_id) && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        fontSize: "8px",
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56, 189, 248, 0.25)",
                      }}
                      title="NPWP Terverifikasi"
                    >
                      <CheckCircle2 size={8} className="text-sky-400" />
                      <span>NPWP VERIFIED</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Real Workspace Switcher */}
            {(isVendorComp || isBuyerComp) && (
              <div style={{ marginTop: 8 }}>
                {/* Has counterpart workspace: direct 1-click switch */}
                {(isVendorComp ? counterpartBuyer : counterpartVendor) ? (
                  <button
                    disabled={switchingWorkspace}
                    onClick={() => handleSwitchWorkspace(isVendorComp ? counterpartBuyer : counterpartVendor)}
                    style={{
                      width: "100%", padding: "6px 8px", borderRadius: 6, fontSize: 10,
                      fontWeight: 700, cursor: switchingWorkspace ? "not-allowed" : "pointer",
                      background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#818cf8",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.15s ease", opacity: switchingWorkspace ? 0.6 : 1,
                    }}
                  >
                    <ArrowLeftRight size={11} />
                    <span>
                      {switchingWorkspace
                        ? "Beralih..."
                        : isVendorComp
                        ? `Beralih ke Buyer Workspace`
                        : `Beralih ke Vendor Workspace`}
                    </span>
                  </button>
                ) : (
                  /* No counterpart: prompt to create one */
                  <button
                    onClick={() => {
                      const type = isVendorComp ? "buyer" : "vendor";
                      navigate(`/onboarding?type=${type}&from_company=${activeCompany.id}`);
                    }}
                    style={{
                      width: "100%", padding: "6px 8px", borderRadius: 6, fontSize: 10,
                      fontWeight: 700, cursor: "pointer",
                      background: "var(--ui-bg-input)",
                      border: "1px solid var(--ui-border)",
                      color: "var(--ui-text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ShoppingCart size={11} />
                    <span>
                      {isVendorComp ? "Aktifkan Buyer Mode" : "Daftar sebagai Vendor"}
                    </span>
                  </button>
                )}
              </div>
            )}


            <div style={{ marginTop: 6 }}>
              <button onClick={handleSwitchCompany} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", background: "var(--ui-switch-bg)", border: "1px solid var(--ui-switch-border)", color: "var(--ui-switch-text)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.15s" }}>
                <ArrowLeftRight size={10} /> Switch Company
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Context passed down to child Layout wrappers
  const shellContext: AppShellContext = { setPageTitle, setPageSubtitle, user, company: activeCompany };

  // Trial status calculation
  const trialInfo = getTrialInfo(user);

  const isGuestRoute = pathname === "/" || pathname.startsWith("/marketplace/");
  
  if (!isClient) {
    // Render a placeholder that matches server output exactly
    return <Outlet context={shellContext} />;
  }

  if (!user && isGuestRoute) {
    return <Outlet context={shellContext} />;
  }

  return (
    <div className="huntr-app-shell">
      {/* NotificationSound lives HERE — never re-mounts between navigations */}
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
            {/* Trial Status Chip (Desktop & Tablet - Buyer Purchasing Only) */}
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

            {/* Cart Button (Desktop Only) — dispatches toggle-cart event picked up by marketplace */}
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


            {/* Notification Bell */}
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
                <>
                  <div 
                    className="huntr-notif-dropdown" 
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="notifications-title"
                    tabIndex={-1}
                    style={{ 
                      background: "var(--ui-bg-card)", 
                      borderRadius: 12, 
                      border: "1px solid var(--ui-border)", 
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)", 
                      zIndex: 99999, 
                      overflow: "hidden",
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "360px",
                      maxWidth: "90vw",
                      outline: "none"
                    }}
                  >
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ui-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span id="notifications-title" style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)" }}>Notifications</span>
                        {unreadCount > 0 && <span style={{ fontSize: 9, background: "rgba(249,115,22,0.15)", color: "#fb923c", padding: "2px 7px", borderRadius: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{unreadCount} new</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }} style={{ background: "none", border: "none", color: "var(--ui-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                        Mark all read
                      </button>
                    </div>
                    <div style={{ maxHeight: 340, overflowY: "auto" }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{ padding: 36, textAlign: "center", color: "var(--ui-text-muted)", fontSize: 12 }}>No recent activity</div>
                      ) : (
                        recentNotifications.map((n: any) => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className="huntr-notif-item"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNotificationClick(n);
                              }
                            }}
                            aria-label={`Notification: ${n.data?.title}`}
                            style={{ 
                              padding: "12px 18px", 
                              borderBottom: "1px solid var(--ui-border)", 
                              cursor: "pointer", 
                              background: n.read_at ? "transparent" : "rgba(249,115,22,0.03)", 
                              transition: "background 0.15s",
                              outline: "none"
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: n.read_at ? "var(--ui-text-secondary)" : "var(--ui-text-primary)", marginBottom: 2 }}>{n.data?.title}</div>
                            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.data?.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <button onClick={() => { navigate("/notifications"); closeNotifications(); }}
                      style={{ width: "100%", padding: "12px", background: "transparent", borderTop: "1px solid var(--ui-border)", border: "none", color: "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      View All Notifications
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Dropdown Topbar */}
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
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "210px",
                      background: "var(--ui-bg-card)",
                      border: "1px solid var(--ui-border)",
                      borderRadius: 12,
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                      zIndex: 99999,
                      padding: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2
                    }}
                  >
                    <div style={{ padding: "8px 10px 6px", borderBottom: "1px solid var(--ui-border)", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)" }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ui-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                    </div>

                    {/* Real Workspace Switcher in user menu */}
                    {(isVendorComp || isBuyerComp) && (
                      <button
                        disabled={switchingWorkspace}
                        onClick={() => {
                          setShowUserMenu(false);
                          const counterpart = isVendorComp ? counterpartBuyer : counterpartVendor;
                          if (counterpart) {
                            handleSwitchWorkspace(counterpart);
                          } else {
                            const type = isVendorComp ? "buyer" : "vendor";
                            navigate(`/onboarding?type=${type}&from_company=${activeCompany?.id}`);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "none",
                          background: (isVendorComp ? counterpartBuyer : counterpartVendor)
                            ? "rgba(99,102,241,0.08)"
                            : "transparent",
                          color: (isVendorComp ? counterpartBuyer : counterpartVendor)
                            ? "#818cf8"
                            : "var(--ui-text-primary)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: switchingWorkspace ? "not-allowed" : "pointer",
                          textAlign: "left",
                          opacity: switchingWorkspace ? 0.6 : 1,
                        }}
                        className="hover:bg-[var(--ui-bg-input)]"
                      >
                        <ArrowLeftRight size={14} style={{ color: (isVendorComp ? counterpartBuyer : counterpartVendor) ? "#818cf8" : "var(--ui-text-muted)" }} />
                        <span>
                          {switchingWorkspace
                            ? "Beralih..."
                            : (isVendorComp ? counterpartBuyer : counterpartVendor)
                            ? isVendorComp
                              ? "Beralih ke Buyer Workspace"
                              : "Beralih ke Vendor Workspace"
                            : isVendorComp
                            ? "Aktifkan Buyer Mode"
                            : "Daftar sebagai Vendor"}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => { setShowUserMenu(false); navigate("/account"); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "transparent",
                        color: "var(--ui-text-primary)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                      className="hover:bg-[var(--ui-bg-input)]"
                    >
                      <Settings size={14} className="text-[var(--ui-text-muted)]" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: "rgba(239,68,68,0.08)",
                        color: "#ef4444",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        marginTop: 2
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </header>

        {/* Trial Expiring / Expired Warning Banner (Buyer Purchasing Only) */}
        {isBuyerComp && <TrialBanner trial={trialInfo} />}


        {/* Child routes render here — only this area changes on navigation */}
        <div className="huntr-page-content">
          {activeCompany && activeCompany.status === "pending" && pathname !== "/company" ? (
            <div className="huntr-pending-gate" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", gap: "20px", padding: "48px 32px" }}>
              <div style={{ width: 72, height: 72, borderRadius: "18px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24" }}>
                <Building2 size={36} style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
              </div>
              <div style={{ maxWidth: 460 }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ui-text-primary)", margin: "0 0 8px", letterSpacing: "-0.3px" }}>Verifikasi Perusahaan Pending</h2>
                <p style={{ fontSize: "13px", color: "var(--ui-text-secondary)", lineHeight: "1.6", margin: 0 }}>
                  Workspace untuk <strong>{activeCompany.name}</strong> sedang dalam proses review oleh tim admin.
                  Semua transaksi, pembuatan RFQ, upload dokumen, dan manajemen katalog dinonaktifkan sementara hingga akun Anda disetujui.
                </p>
              </div>
              <div className="huntr-pending-gate-actions">
                <button onClick={() => navigate("/company")} style={{ padding: "10px 22px", borderRadius: "10px", background: "linear-gradient(135deg, #f97316, #f59e0b)", border: "none", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>
                  View Verification Status
                </button>
                <button onClick={handleSwitchCompany} style={{ padding: "10px 22px", borderRadius: "10px", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)", color: "var(--ui-text-secondary)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                  Ganti Perusahaan
                </button>
              </div>
            </div>
          ) : (
            <Outlet context={shellContext} />
          )}
        </div>
      </div>

      <GlobalCartPanel companyPrefix={companyPrefix} />
    </div>
  );
}
