import React, { useEffect, useState, useCallback } from "react";
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
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [roleSwitching, setRoleSwitching] = useState(false); // For role switch loading state
  const [cartCount, setCartCount] = useState(0);

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

  // ── Nav refresh when route changes (re-check auth) ───────────────────────
  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const companySession = localStorage.getItem("active_company");
    const isGuestRoute = pathname === "/" || pathname.startsWith("/marketplace/");

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
    // Update state in case company switched via another tab
    setUser(JSON.parse(userSession));
    setActiveCompany(JSON.parse(companySession));
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

  // ── Nav items ─────────────────────────────────────────────────────────────
  const isPendingCompany = activeCompany?.status === "pending";

  const NAV = [
    ...(isPendingCompany ? [
      { to: "/company", label: "Company", Icon: Building2, section: "settings", badge: "companyAlerts" },
      { to: "/account", label: "Settings", Icon: Settings, section: "settings", badge: "accountAlerts" },
    ] : [
      { to: "/", label: "Dashboard", Icon: LayoutDashboard, section: "main" },
      { to: "/tasks", label: "Tasks", Icon: ListTodo, section: "main", badge: "totalUnread" },

      // Procurement (Buyer)
      ...(isBuyerComp && (isManager || isBuyerRole) ? [
        { to: "/marketplace", label: "Huntr Catalog", Icon: Package, section: "procurement" },
      ] : []),
      ...(isBuyerComp && (isManager || isBuyerRole) ? [
        { to: "/my-pr", label: "My PR", Icon: ClipboardList, section: "procurement", badge: "pendingNewProposals" },
      ] : []),
      ...(canManageApprovals ? [
        { to: "/approvals", label: "Approvals", Icon: CheckCircle2, section: "procurement", badge: "pendingApprovals" },
      ] : []),
      ...(isBuyerComp && (isManager || isBuyerRole) ? [
        { to: "/pr-audit", label: "PR Audit Log", Icon: History, section: "procurement" },
      ] : []),

      // Vendor
      ...(isVendorComp ? [
        { to: "/all-requests", label: "All Request", Icon: Lightbulb, section: "vendor", badge: "opportunities" },
      ] : []),
      ...(isVendorComp && (isManager || isAdminRole) ? [
        { to: "/catalogue", label: "Catalogue", Icon: List, section: "vendor", badge: "catalogueAlerts" },
        { to: "/proposals", label: "Proposals", Icon: Trophy, section: "vendor", badge: "pendingProposals" },
      ] : []),
      ...(isVendorComp && (isManager || isAdminRole) ? [
        { to: "/my-rank", label: "My Rank", Icon: Medal, section: "vendor", badge: "rankAlerts" },
      ] : []),

      // Orders & Documents
      { to: "/negotiation", label: "Negotiations", Icon: MessageSquare, section: "orders", badge: "negotiations" },
      ...(isVendorComp ? [
        { to: "/orders", label: "Purchase Order", Icon: ReceiptText, section: "orders", badge: "pendingPurchaseOrders" },
      ] : [
        { to: "/orders", label: "Purchase Order", Icon: ReceiptText, section: "orders", badge: "buyerOrderAlerts" },
      ]),
      { to: "/receipts", label: "Goods Receipt", Icon: CheckCircle2, section: "orders", badge: "receiptsToInspect" },
      { to: "/bast", label: "BAST", Icon: FileText, section: "orders", badge: "pendingBast" },
      { to: "/efaktur", label: "e-Faktur", Icon: ReceiptText, section: "orders" },
      { to: "/returns", label: "Returns", Icon: Package, section: "orders", badge: "pendingReturns" },
      { to: "/debit-notes", label: "Debit Notes", Icon: Briefcase, section: "orders", badge: "pendingDebitNotes" },

      // Finance
      ...(canManageApprovals ? [
        { to: "/finance", label: "Finance Approval", Icon: Briefcase, section: "finance", badge: "financeApprovals" },
      ] : []),
      { to: "/payment-history", label: "Payment History", Icon: History, section: "finance" },

      // Settings
      { to: "/company", label: "Company", Icon: Building2, section: "settings", badge: "companyAlerts" },
      { to: "/account", label: "Settings", Icon: Settings, section: "settings", badge: "accountAlerts" },
    ]),
  ];

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

      {/* Active Company Badge */}
      {activeCompany && (
        <div style={{ margin: "0 10px 16px", background: "var(--ui-bg-badge)", border: "1px solid var(--ui-border-badge)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 5 }}>ACTIVE WORKSPACE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={14} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeCompany.name}</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", textTransform: "uppercase" }}>
                {activeCompany.type}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={handleSwitchCompany} style={{ width: "100%", padding: "5px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", background: "var(--ui-switch-bg)", border: "1px solid var(--ui-switch-border)", color: "var(--ui-switch-text)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <ArrowLeftRight size={10} /> Switch Company
            </button>
          </div>
        </div>
      )}

      {/* Nav — ref is stable (never re-created) so scroll position is preserved */}
      <nav ref={navScrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 10px", overflowY: "auto" }}>
        {(() => {
          let currentSection = "";
          return NAV.map(({ to, label, Icon, section, badge }: any) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to + "/"));
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
                <Link to={to} onClick={handleNavClick} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10,
                  background: active ? "var(--ui-nav-active-bg)" : "transparent",
                  border: active ? "1px solid var(--ui-nav-active-border)" : "1px solid transparent",
                  color: active ? "var(--ui-text-nav-active)" : "var(--ui-text-nav-idle)",
                  fontWeight: active ? 600 : 400, fontSize: 13,
                  textDecoration: "none", transition: "all 0.15s",
                  position: "relative",
                }}>
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{label}</span>
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

      {/* User panel */}
      {user && (
        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--ui-border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Role switcher - LOCAL ONLY */}
          {import.meta.env.DEV && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Debug: Switch Role
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {(() => {
                  const buyerRoles = ["manager", "buyer", "finance"];
                  const vendorRoles = ["manager", "admin", "finance"];
                  const roles = isBuyerComp ? buyerRoles : vendorRoles;
                  return roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      disabled={roleSwitching || user.role === role}
                      style={{
                        padding: "4px 6px",
                        borderRadius: 6,
                        fontSize: 9,
                        fontWeight: 600,
                        background: user.role === role ? "rgba(249, 115, 22, 0.2)" : "var(--ui-bg-input)",
                        border: user.role === role ? "1px solid rgba(249,115,22,0.4)" : "1px solid var(--ui-border-input)",
                        color: user.role === role ? "#f97316" : "var(--ui-text-muted)",
                        cursor: user.role === role ? "not-allowed" : "pointer",
                        textTransform: "capitalize",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {role}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#ea580c,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 500, textTransform: "none" }}>
                {user.email || "No email"}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--ui-logout-bg)", border: "1px solid var(--ui-logout-border)", color: "var(--ui-logout-text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <LogOut size={11} /> Sign Out
          </button>
        </div>
      )}
    </>
  );

  // Context passed down to child Layout wrappers
  const shellContext: AppShellContext = { setPageTitle, setPageSubtitle, user, company: activeCompany };

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
        <header className="huntr-main-header">
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
            {/* Cart Button (Desktop Only) */}
            {!isMobile && (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                aria-label={`Go to cart, ${cartCount} items`}
                style={{
                  position: "relative",
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "var(--ui-toggle-bg)",
                  border: "1px solid var(--ui-toggle-border)",
                  color: cartCount > 0 ? "#fb923c" : "var(--ui-text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  marginRight: 8
                }}
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: "#f59e0b",
                    border: "2px solid var(--ui-notif-badge-border)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px"
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
                  width: 40, 
                  height: 40, 
                  borderRadius: 12, 
                  background: "var(--ui-toggle-bg)", 
                  border: "1px solid var(--ui-toggle-border)", 
                  color: unreadCount > 0 ? "#fb923c" : "var(--ui-text-muted)", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  transition: "all 0.2s" 
                }}
              >
                <Bell size={18} fill={unreadCount > 0 ? "rgba(249,115,22,0.2)" : "none"} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: "#f59e0b", border: "2px solid var(--ui-notif-badge-border)", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
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
                      borderRadius: 20, 
                      border: "1px solid var(--ui-border)", 
                      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", 
                      zIndex: 99999, 
                      overflow: "hidden",
                      position: "absolute",
                      top: "calc(100% + 12px)",
                      right: 0,
                      width: "400px",
                      maxWidth: "90vw",
                      outline: "none"
                    }}
                  >
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span id="notifications-title" style={{ fontSize: 14, fontWeight: 800, color: "var(--ui-text-primary)" }}>Notifications</span>
                        {unreadCount > 0 && <span style={{ fontSize: 10, background: "rgba(249,115,22,0.2)", color: "#fb923c", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{unreadCount} NEW</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }} style={{ background: "none", border: "none", color: "var(--ui-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                        Mark all as read
                      </button>
                    </div>
                    <div style={{ maxHeight: 350, overflowY: "auto" }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{ padding: 40, textAlign: "center", color: "var(--ui-text-muted)", fontSize: 13 }}>No recent activity</div>
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
                              padding: "14px 20px", 
                              borderBottom: "1px solid var(--ui-border-subtle)", 
                              cursor: "pointer", 
                              background: n.read_at ? "transparent" : "rgba(249,115,22,0.04)", 
                              transition: "all 0.2s",
                              outline: "none"
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700, color: n.read_at ? "var(--ui-text-muted)" : "var(--ui-text-primary)", marginBottom: 2 }}>{n.data?.title}</div>
                            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.data?.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <button onClick={() => { navigate("/notifications"); closeNotifications(); }}
                      style={{ width: "100%", padding: "12px", background: "var(--ui-bg-overlay)", border: "none", color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      View All Notifications
                    </button>
                  </div>
                </>
              )}
            </div>

            {activeCompany && (
              <div className="huntr-header-company-badge" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 10, background: "var(--ui-bg-badge)", border: "1px solid var(--ui-border-badge)", fontSize: 12, fontWeight: 600, color: "var(--ui-text-primary)" }}>
                <Building2 size={13} style={{ flexShrink: 0, color: "#f97316" }} />
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeCompany.name}
                </span>
                {activeCompany.status && (
                  <span style={{
                    padding: "2px 6px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    flexShrink: 0,
                    lineHeight: 1,
                    background: activeCompany.status === "approved" ? "rgba(16,185,129,0.15)" : "rgba(249,115,22,0.15)",
                    color: activeCompany.status === "approved" ? "#10b981" : "#f97316",
                    border: activeCompany.status === "approved" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(249,115,22,0.3)",
                  }}>
                    {activeCompany.status}
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Child routes render here — only this area changes on navigation */}
        <div className="huntr-page-content">
          {activeCompany && activeCompany.status === "pending" && pathname !== "/company" ? (
            <div className="huntr-pending-gate" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", background: "var(--ui-bg-pending-card)", border: "1px solid var(--ui-border)", borderRadius: "32px", boxShadow: "0 24px 60px rgba(0,0,0,0.15)", gap: "24px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "24px", background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.25)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px rgba(251,191,36,0.1)", color: "#fbbf24" }}>
                <Building2 size={42} style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "24px", fontWeight: 900, color: "var(--ui-text-primary)", margin: "0 0 10px", letterSpacing: "-0.5px" }}>Verifikasi Perusahaan Pending</h2>
                <p style={{ fontSize: "14px", color: "var(--ui-text-secondary)", lineHeight: "1.6", margin: 0 }}>
                  The workspace for <strong>{activeCompany.name}</strong> is currently under review by the admin team.
                  All transactions, RFQ creation, document uploads, and catalog management are temporarily disabled until your account is approved.
                </p>
              </div>
              <div className="huntr-pending-gate-actions">
                <button onClick={() => navigate("/company")} style={{ padding: "12px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #f97316, #f59e0b)", border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 10px 25px rgba(249,115,22,0.25)" }}>
                  View Verification Status
                </button>
                <button onClick={handleSwitchCompany} style={{ padding: "12px 24px", borderRadius: "14px", background: "var(--ui-bg-switch-btn)", border: "1px solid var(--ui-border)", color: "var(--ui-text-primary)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Ganti Perusahaan
                </button>
              </div>
            </div>
          ) : (
            <Outlet context={shellContext} />
          )}
        </div>
      </div>
    </div>
  );
}
