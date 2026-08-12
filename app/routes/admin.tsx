import React, { useEffect, useState } from "react";
import {
  Building2, ShieldCheck, LogOut, CheckCircle2, XCircle,
  Clock, Eye, FileText, ChevronDown, ChevronUp, Search,
  Loader2, AlertCircle, Users, TrendingUp, X, ExternalLink, Trash2, Pencil, Package,
  Menu, Settings, CreditCard,
} from "lucide-react";

/* ─── tiny responsive hook ─── */
function useIsMobile(bp = 640) {
  const [mob, setMob] = useState(() => typeof window !== "undefined" ? window.innerWidth < bp : false);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mob;
}
import {
  adminLogin,
  adminGetCompanies,
  adminAuditCompany,
  adminGetCatalogue,
  adminCreateCatalogueItem,
  adminUpdateCatalogueItem,
  adminDeleteCatalogueItem,
  adminGetTransactions,
  adminGetEscrowSummary,
  adminGetSettings,
  adminUpdateSettings,
} from "../lib/api";
import { getCompanyDocumentUrl, getAssetUrl } from "../lib/assets";
import Swal from "sweetalert2";

const BASE_URL_IMAGE = import.meta.env.VITE_BASE_URL_IMAGE || `${import.meta.env.VITE_API_URL}/storage`;

/* ─────────────────────────────────────────────────────────────────── */
/*  Types                                                              */
/* ─────────────────────────────────────────────────────────────────── */

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

interface CompanyDoc {
  id: string;
  name: string;
  type: string;
  file_path: string;
  url?: string;
}

interface Company {
  id: string;
  name: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  tax_id?: string;
  formatted_tax_id?: string;
  country?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  verification_notes?: string;
  created_at: string;
  documents: CompanyDoc[];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Main component                                                     */
/* ─────────────────────────────────────────────────────────────────── */

export default function AdminPortal() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [view, setView] = useState<"login" | "dashboard">("login");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_session");
    if (stored) {
      setAdmin(JSON.parse(stored));
      setView("dashboard");
    }
  }, []);

  const handleLogin = (a: AdminUser) => {
    sessionStorage.setItem("admin_session", JSON.stringify(a));
    setAdmin(a);
    setView("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_session");
    setAdmin(null);
    setView("login");
  };

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: "var(--ui-bg-page)",
      color: "var(--ui-text-primary)",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      {/* Import Inter font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--ui-bg-page); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--ui-scrollbar-track); }
        ::-webkit-scrollbar-thumb { background: var(--ui-scrollbar-thumb); border-radius: 3px; }
        select option { background: var(--ui-bg-card); color: var(--ui-text-primary); }
      `}</style>

      {view === "login" ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard admin={admin!} onLogout={handleLogout} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Admin Login                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function AdminLogin({ onLogin }: { onLogin: (a: AdminUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ email, password });
      onLogin(res.admin);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
      position: "relative", overflow: "hidden",
      background: "var(--ui-bg-page-grad)",
      transition: "background 0.3s ease",
    }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)" }} />
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "clamp(24px, 5vw, 40px)" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20
          }}>
            <img src="/assets/img/logo/sidebar.png" alt="Huntr.id" style={{ height: "clamp(48px, 10vw, 64px)", objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 900, color: "var(--ui-text-primary)", letterSpacing: "-0.5px", marginBottom: 8, transition: "color 0.3s ease" }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: "clamp(12px, 3vw, 14px)", color: "var(--ui-text-muted)", transition: "color 0.3s ease" }}>
            Huntr.id · Global Administration
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--ui-glass-bg)", backdropFilter: "blur(32px)",
            border: "1px solid var(--ui-glass-border)",
            borderRadius: 24,
            boxShadow: "var(--ui-glass-shadow)",
            padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)",
            display: "flex", flexDirection: "column", gap: 20,
            transition: "all 0.3s ease",
          }}
        >
          {/* Accent top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "24px 24px 0 0",
            background: "linear-gradient(90deg,#f59e0b,#f97316,#ec4899)",
          }} />

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#f87171",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={lbl}>Admin Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@huntr.id"
              style={inp}
              autoComplete="email"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={lbl}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inp}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 8, padding: "14px 20px", borderRadius: 12,
              background: isLoading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f59e0b,#f97316)",
              border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: isLoading ? "none" : "0 8px 28px rgba(249,115,22,0.35)",
              letterSpacing: "-0.2px", transition: "all 0.2s",
              minHeight: 48,
            }}
          >
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Authenticating…</> : <>Sign In as Admin →</>}
          </button>

          <div style={{ textAlign: "center", fontSize: 11, color: "var(--ui-text-muted)", transition: "color 0.3s ease" }}>
            Restricted access · Huntr.id Global Operations
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Admin Dashboard                                                    */
/* ─────────────────────────────────────────────────────────────────── */

const getImageUrl = (path: string | undefined | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/storage')) {
    return `${import.meta.env.VITE_API_URL}${path}`;
  }
  return `${BASE_URL_IMAGE}/${path.replace(/^\//, '')}`;
};

function AdminDashboard({ admin, onLogout }: { admin: AdminUser; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"companies" | "catalogue" | "transactions" | "users" | "admins" | "settings">("companies");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const tabs = [
    { id: "companies",    label: "Companies" },
    { id: "catalogue",    label: "Catalogue" },
    { id: "transactions", label: "Transactions" },
    { id: "users",        label: "Users" },
    { id: "admins",       label: "Admins" },
    { id: "settings",     label: "Settings" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--ui-bg-header)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--ui-border)",
        padding: "0 clamp(12px, 4vw, 28px)",
        minHeight: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img src="/assets/img/logo/sidebar.png" alt="Huntr.id" style={{ height: 28, objectFit: "contain" }} />
          {!isMobile && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ui-text-primary)", letterSpacing: "-0.3px" }}>Admin Portal</div>
              <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", fontWeight: 700 }}>GLOBAL OPERATIONS</div>
            </div>
          )}
        </div>

        {/* Desktop tabs — center */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center", overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "7px 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                background: activeTab === t.id ? "rgba(249,115,22,0.15)" : "transparent",
                color: activeTab === t.id ? "#f97316" : "var(--ui-text-muted)",
                border: "none", cursor: "pointer", transition: "all 0.2s",
              }}>{t.label}</button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)" }}>{admin.name}</div>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)" }}>{admin.email}</div>
            </div>
          )}
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 9,
            background: "var(--ui-logout-bg)", border: "1px solid var(--ui-logout-border)",
            color: "var(--ui-logout-text)", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            <LogOut size={13} />{!isMobile && " Sign Out"}
          </button>
          {isMobile && (
            <button onClick={() => setDrawerOpen(true)} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 9,
              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
              color: "var(--ui-text-primary)", cursor: "pointer",
            }}>
              <Menu size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: "72vw", maxWidth: 280,
              background: "var(--ui-bg-card)", borderLeft: "1px solid var(--ui-border)",
              display: "flex", flexDirection: "column", padding: 24, gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{admin.name}</div>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>{admin.email}</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ height: 1, background: "var(--ui-border)", marginBottom: 8 }} />
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setDrawerOpen(false); }} style={{
                padding: "12px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: "left",
                background: activeTab === t.id ? "rgba(249,115,22,0.12)" : "transparent",
                color: activeTab === t.id ? "#f97316" : "var(--ui-text-primary)",
                border: activeTab === t.id ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
                cursor: "pointer",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
          background: "var(--ui-bg-header)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--ui-border)",
          display: "flex",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent",
              color: activeTab === t.id ? "#f97316" : "var(--ui-text-muted)",
              fontSize: 9, fontWeight: 700, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              borderTop: activeTab === t.id ? "2px solid #f97316" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {t.id === "companies" ? <Building2 size={16} /> : t.id === "catalogue" ? <Package size={16} /> : t.id === "transactions" ? <CreditCard size={16} /> : t.id === "users" ? <Users size={16} /> : t.id === "admins" ? <ShieldCheck size={16} /> : <Settings size={16} />}
              {t.label.slice(0, 5)}
            </button>
          ))}
        </nav>
      )}

      <main style={{
        flex: 1,
        padding: "clamp(12px, 3vw, 28px)",
        maxWidth: 1280, margin: "0 auto", width: "100%",
        paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom) + 72px)" : "clamp(12px, 3vw, 28px)",
      }}>
        {activeTab === "companies" && <AdminCompaniesTab />}
        {activeTab === "catalogue" && <AdminCatalogueTab />}
        {activeTab === "transactions" && <AdminTransactionsTab />}
        {activeTab === "users" && <AdminUsersTab />}
        {activeTab === "admins" && <AdminAdminsTab />}
        {activeTab === "settings" && <AdminSettingsTab />}
      </main>
    </div>
  );
}

function AdminCompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [auditModal, setAuditModal] = useState<{ company: Company; action: "approve" | "decline" } | null>(null);
  const isMobile = useIsMobile();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const fetchCompanies = async (page = currentPage, s = search, status = filterStatus) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await adminGetCompanies({ page, per_page: perPage, search: s, status });
      setCompanies(res.data || []);
      setCurrentPage(res.current_page || 1);
      setTotalPages(res.last_page || 1);
      setTotal(res.total || 0);
      if (res.stats) setStats(res.stats);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load companies.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(1, search, filterStatus), 400);
    return () => clearTimeout(timer);
  }, [search, filterStatus]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) fetchCompanies(newPage);
  };

  const statusMeta = {
    pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)",  icon: <Clock size={13} />,        label: "Pending" },
    approved: { color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)",  icon: <CheckCircle2 size={13} />, label: "Approved" },
    rejected: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", icon: <XCircle size={13} />,      label: "Rejected" },
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Companies", value: total,         icon: <Building2 size={20} />,    color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#ea580c)" },
          { label: "Pending",         value: stats.pending, icon: <Clock size={20} />,         color: "#f59e0b", gradient: "linear-gradient(135deg,#f59e0b,#d97706)" },
          { label: "Approved",        value: stats.approved,icon: <CheckCircle2 size={20} />,  color: "#10b981", gradient: "linear-gradient(135deg,#10b981,#059669)" },
          { label: "Rejected",        value: stats.rejected,icon: <XCircle size={20} />,       color: "#ef4444", gradient: "linear-gradient(135deg,#ef4444,#dc2626)" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
            borderRadius: 16, padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: stat.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {React.cloneElement(stat.icon as any, { color: "#fff" })}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 12, padding: "10px 14px" }}>
          <Search size={15} color="var(--ui-text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…" style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 14 }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 0, display: "flex" }}><X size={13} /></button>}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {(["all", "pending", "approved", "rejected"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
              background: filterStatus === s ? "rgba(249,115,22,0.15)" : "var(--ui-bg-input)",
              border: filterStatus === s ? "1px solid rgba(249,115,22,0.3)" : "1px solid var(--ui-border-input)",
              color: filterStatus === s ? "#fb923c" : "var(--ui-text-muted)",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Loader2 className="animate-spin" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {companies.map(company => {
            const sm = statusMeta[company.status] || statusMeta.pending;
            const isExpanded = expandedId === company.id;
            return (
              <div key={company.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 16, overflow: "hidden" }}>
                <div onClick={() => setExpandedId(isExpanded ? null : company.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  {/* Top row: logo + name */}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {company.documents?.find(d => d.type === "logo") ? (
                      <img src={getImageUrl(company.documents.find(d => d.type === "logo")?.url)} alt="Logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "var(--ui-bg-input)" }} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Building2 size={18} color="var(--ui-text-muted)" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {company.name}
                        <span style={{ fontSize: 10, background: "rgba(249,115,22,0.1)", padding: "2px 7px", borderRadius: 8, marginLeft: 6 }}>{company.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>{company.email}{company.phone ? ` · ${company.phone}` : ''}</div>
                    </div>
                    <div style={{ background: sm.bg, color: sm.color, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{sm.label}</div>
                  </div>
                  {/* Approve/Decline row — always full width */}
                  {company.status === 'pending' && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={e => { e.stopPropagation(); setAuditModal({ company, action: "approve" }); }}
                        style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", padding: "8px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >Approve</button>
                      <button
                        onClick={e => { e.stopPropagation(); setAuditModal({ company, action: "decline" }); }}
                        style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", padding: "8px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >Decline</button>
                    </div>
                  )}
                </div>
                {isExpanded && (
                  <div style={{ padding: 20, borderTop: "1px solid var(--ui-border)", background: "rgba(0,0,0,0.015)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 4 }}>COMPANY DETAILS</div>
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                          <div><strong>Tax ID:</strong> {company.formatted_tax_id || company.tax_id || "N/A"}</div>
                          <div><strong>Address:</strong> {company.address || "N/A"}</div>
                          <div><strong>Location:</strong> {[company.city, company.region, company.country].filter(Boolean).join(", ") || "N/A"}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 4 }}>BANKING INFO</div>
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                          <div><strong>Bank Name:</strong> {company.bank_name || "N/A"}</div>
                          <div><strong>Account No:</strong> {company.bank_account || "N/A"}</div>
                          <div><strong>Account Name:</strong> {company.bank_account_name || "N/A"}</div>
                        </div>
                      </div>
                      <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 4 }}>DOCUMENTS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {company.documents && company.documents.length > 0 ? (
                    company.documents.filter(d => d.type !== "logo").map(doc => (
                      <a key={doc.id} href={getCompanyDocumentUrl(doc.id)} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 600,
                        background: "rgba(59,130,246,0.1)", padding: "6px 10px", borderRadius: 6,
                      }}>
                        <FileText size={14} />
                        {doc.type.toUpperCase()}: {doc.name}
                      </a>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>No documents uploaded</div>
                  )}
                </div>
              </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {auditModal && <AuditModal company={auditModal.company} action={auditModal.action} onClose={() => setAuditModal(null)} onDone={() => { setAuditModal(null); fetchCompanies(); }} />}
    </div>
  );
}

function AdminCatalogueTab() {
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchCatalogues = async (page = currentPage, s = search, pp = perPage) => {
    setIsLoading(true);
    try {
      const res = await adminGetCatalogue({ page, per_page: pp, search: s });
      setCatalogues(res.data || []);
      setCurrentPage(res.current_page || 1);
      setTotalPages(res.last_page || 1);
      setTotal(res.total || 0);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalogues(1, search, perPage);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCatalogues(1, search, perPage);
  }, [perPage]);

  const allPageSelected = catalogues.length > 0 && catalogues.every(item => selectedIds.includes(String(item.id)));
  const toggleSelectAll = () => {
    const allPageIds = catalogues.map(item => String(item.id));
    if (allPageSelected) {
      setSelectedIds(prev => prev.filter(id => !allPageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allPageIds])]);
    }
  };
  const thStyle: React.CSSProperties = {
    padding: "11px 16px", textAlign: "left", fontSize: 11,
    fontWeight: 700, color: "var(--ui-text-muted)", borderBottom: "1px solid var(--ui-border)",
    background: "rgba(0,0,0,0.03)", whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 16px", fontSize: 13, borderBottom: "1px solid var(--ui-border)",
    color: "var(--ui-text-primary)", verticalAlign: "middle",
  };
  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const image = fd.get("image");
    if (image instanceof File && image.size === 0) fd.delete("image");
    try {
      await adminCreateCatalogueItem(fd);
      setShowAddModal(false);
      fetchCatalogues();
    } catch { Swal.fire({ icon: 'error', title: 'Error!', text: "Failed to create product" }); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const image = fd.get("image");
    if (image instanceof File && image.size === 0) fd.delete("image");
    try {
      await adminUpdateCatalogueItem(editingItem.id, fd);
      setEditingItem(null);
      fetchCatalogues();
    } catch { Swal.fire({ icon: 'error', title: 'Error!', text: "Failed to update product" }); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Global Catalogue</div>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>{total.toLocaleString()} produk total</div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "var(--ui-primary)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center", gap: 10, background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 10, padding: "9px 14px" }}>
          <Search size={15} color="var(--ui-text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari katalog (nama produk, item code, nama perusahaan)…"
            style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>Tampilkan</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[10, 20, 30, 50].map(n => (
              <button
                key={n}
                onClick={() => setPerPage(n)}
                style={{
                  padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: perPage === n ? "var(--ui-primary)" : "var(--ui-bg-card)",
                  color: perPage === n ? "#fff" : "var(--ui-text-muted)",
                  border: perPage === n ? "none" : "1px solid var(--ui-border)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)" }}>{selectedIds.length} produk terpilih</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSelectedIds([])} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-primary)", cursor: "pointer" }}>Batal</button>
            <button
              onClick={async () => {
                const result = await Swal.fire({ icon: 'question', title: 'Hapus Produk Terpilih?', text: `Yakin ingin menghapus ${selectedIds.length} produk?`, showCancelButton: true, confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal' });
                if (!result.isConfirmed) return;
                Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                try {
                  await Promise.all(selectedIds.map(id => adminDeleteCatalogueItem(id)));
                  Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Produk berhasil dihapus.' });
                  fetchCatalogues();
                } catch { Swal.fire({ icon: 'error', title: 'Error!', text: 'Gagal menghapus beberapa produk.' }); }
              }}
              style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
            >
              <Trash2 size={12} /> Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 14, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Loader2 className="animate-spin" style={{ margin: "0 auto", color: "#f97316" }} size={32} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 40, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", accentColor: "#f97316" }}
                    />
                  </th>
                  <th style={{ ...thStyle, width: 52 }}>IMG</th>
                  <th style={thStyle}>NAMA PRODUK</th>
                  <th style={thStyle}>ITEM CODE</th>
                  <th style={thStyle}>KATEGORI</th>
                  <th style={thStyle}>VENDOR</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>HARGA</th>
                  <th style={thStyle}>UOM</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 110 }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {catalogues.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "var(--ui-text-muted)" }}>
                      Tidak ada produk ditemukan
                    </td>
                  </tr>
                ) : catalogues.map(item => {
                  const isSelected = selectedIds.includes(String(item.id));
                  return (
                    <tr
                      key={item.id}
                      style={{ background: isSelected ? "rgba(249,115,22,0.05)" : "transparent", transition: "background 0.1s" }}
                    >
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => setSelectedIds(prev =>
                            prev.includes(String(item.id)) ? prev.filter(id => id !== String(item.id)) : [...prev, String(item.id)]
                          )}
                          style={{ cursor: "pointer", accentColor: "#f97316" }}
                        />
                      </td>
                      <td style={{ ...tdStyle, padding: "8px 10px" }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                          background: item.image_url ? `url(${item.image_url}) center/cover` : "rgba(249,115,22,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {!item.image_url && <Package size={16} color="rgba(249,115,22,0.5)" />}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 220 }}>
                        <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                          {item.name}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: "var(--ui-text-muted)", fontFamily: "monospace", fontSize: 12 }}>
                        {item.item_code || "—"}
                      </td>
                      <td style={tdStyle}>
                        {item.category ? (
                          <span style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            {item.category}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12 }}>
                        {item.company?.name || <span style={{ color: "var(--ui-text-muted)", fontStyle: "italic" }}>Global</span>}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "var(--ui-primary)", whiteSpace: "nowrap" }}>
                        Rp {item.price?.toLocaleString() ?? "—"}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)" }}>{item.uom}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            onClick={() => setEditingItem(item)}
                            style={{
                              padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                              background: "rgba(59,130,246,0.1)", color: "#3b82f6",
                              border: "1px solid rgba(59,130,246,0.2)", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4,
                            }}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={async () => {
                              const result = await Swal.fire({
                                icon: 'question', title: 'Hapus Produk?',
                                text: `Hapus "${item.name}"?`,
                                showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal'
                              });
                              if (!result.isConfirmed) return;
                              try {
                                await adminDeleteCatalogueItem(item.id);
                                fetchCatalogues();
                              } catch {
                                Swal.fire({ icon: 'error', title: 'Error!', text: "Gagal menghapus produk" });
                              }
                            }}
                            style={{
                              padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                              background: "rgba(239,68,68,0.1)", color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4,
                            }}
                          >
                            <Trash2 size={11} /> Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
            Halaman {currentPage} dari {totalPages} · {total.toLocaleString()} produk
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => fetchCatalogues(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: currentPage === 1 ? "var(--ui-bg-input)" : "rgba(249,115,22,0.12)",
                color: currentPage === 1 ? "var(--ui-text-muted)" : "#f97316",
                border: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>

            {buildPages().map((p, i) =>
              p === "…"
                ? <span key={`dots-${i}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12 }}>…</span>
                : (
                  <button
                    key={p}
                    onClick={() => fetchCatalogues(p as number)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: currentPage === p ? "var(--ui-primary)" : "var(--ui-bg-card)",
                      color: currentPage === p ? "#fff" : "var(--ui-text-muted)",
                      border: currentPage === p ? "none" : "1px solid var(--ui-border)",
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                )
            )}

            <button
              onClick={() => fetchCatalogues(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: currentPage === totalPages ? "var(--ui-bg-input)" : "rgba(249,115,22,0.12)",
                color: currentPage === totalPages ? "var(--ui-text-muted)" : "#f97316",
                border: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
          <div style={{ background: "var(--ui-bg-card)", padding: "24px 20px", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "92dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Add Global Product</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Product Name</label>
                <input name="name" required style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Category (Optional)</label>
                <select name="category" style={{ ...inp, marginTop: 6, cursor: "pointer" }}>
                  <option value="">Select Category...</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Machinery">Machinery</option>
                  <option value="Tools">Tools</option>
                  <option value="Spare Parts">Spare Parts</option>
                  <option value="Safety Equipment">Safety Equipment</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Brand (Optional)</label>
                <input name="brand" placeholder="e.g. Bosch, Siemens" style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>UOM</label>
                <select name="uom" required style={{ ...inp, marginTop: 6, cursor: "pointer" }}>
                  <option value="">Select UOM...</option>
                  <option value="Pc">Pc (Piece)</option>
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="L">L (Liter)</option>
                  <option value="M">M (Meter)</option>
                  <option value="Box">Box</option>
                  <option value="Pallet">Pallet</option>
                  <option value="Set">Set</option>
                  <option value="Unit">Unit</option>
                  <option value="Ton">Ton</option>
                  <option value="Pair">Pair</option>
                  <option value="Drum">Drum</option>
                  <option value="Container">Container</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Keywords / Tags (Optional)</label>
                <textarea name="keywords" rows={3} placeholder="e.g. pump, hydraulic, industrial" style={{ ...inp, marginTop: 6, resize: "vertical" }} />
              </div>
              <div>
                <label style={lbl}>Specifications (Optional)</label>
                <textarea name="specifications" rows={3} style={{ ...inp, marginTop: 6, resize: "vertical" }} />
              </div>
              <div>
                <label style={lbl}>Image (Optional)</label>
                <input name="image" type="file" accept="image/*" style={{ ...inp, marginTop: 6 }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--ui-primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "var(--ui-bg-card)", padding: "24px 20px", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "92dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Edit Product</div>
              <button onClick={() => setEditingItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Product Name</label>
                <input name="name" required defaultValue={editingItem.name || ""} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Item Code</label>
                <input name="item_code" defaultValue={editingItem.item_code || ""} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Brand</label>
                <input name="brand" defaultValue={editingItem.brand || ""} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <input name="category" defaultValue={editingItem.category || ""} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>UOM</label>
                <input name="uom" required defaultValue={editingItem.uom || "Pc"} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Keywords / Tags</label>
                <textarea name="keywords" defaultValue={Array.isArray(editingItem.keywords) ? editingItem.keywords.join(", ") : (editingItem.keywords || "")} rows={3} style={{ ...inp, marginTop: 6, resize: "vertical" }} />
              </div>
              <div>
                <label style={lbl}>Specifications</label>
                <textarea name="specifications" rows={3} defaultValue={editingItem.specifications || ""} style={{ ...inp, marginTop: 6, resize: "vertical" }} />
              </div>
              <div>
                <label style={lbl}>Replace Image</label>
                <input name="image" type="file" accept="image/*" style={{ ...inp, marginTop: 6 }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--ui-primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminTransactionsTab() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchData = async (page = currentPage, s = search) => {
    setIsLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        adminGetEscrowSummary(),
        adminGetTransactions({ page, per_page: perPage, search: s }),
      ]);
      setSummary(sumRes);
      setTransactions(txRes.data || []);
      setCurrentPage(txRes.current_page || 1);
      setTotalPages(txRes.last_page || 1);
      setTotal(txRes.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchData(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  if (isLoading) return <Loader2 className="animate-spin" style={{ margin: "40px auto", display: "block", color: "#f59e0b" }} />;

  return (
    <div>
      {/* Escrow card */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          borderRadius: 16, padding: "clamp(20px,5vw,32px)", color: "#fff",
          boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Total Escrow Balance</div>
          <div style={{ fontSize: "clamp(28px, 8vw, 48px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1 }}>
            Rp {summary?.total_escrow_amount?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>
            From {summary?.total_invoices_held || 0} invoices waiting for finance disbursement
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
        <Search size={15} color="var(--ui-text-muted)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari PO number, buyer, vendor…" style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 14 }} />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 0, display: "flex" }}><X size={13} /></button>}
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Global Transactions <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 400 }}>{total.toLocaleString()} total</span></div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {transactions.map(tx => (
          <div key={tx.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{tx.po_number}</div>
                <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 3 }}>
                  Buyer: {tx.buyer?.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
                  Vendor: {tx.vendor?.name}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Rp {tx.total_amount?.toLocaleString()}</div>
                <div style={{ fontSize: 11, background: "rgba(249,115,22,0.1)", color: "#f97316", padding: "2px 8px", borderRadius: 8, display: "inline-block", marginTop: 4 }}>
                  {tx.status}
                </div>
              </div>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--ui-text-muted)" }}>No transactions found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={() => fetchData(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer", background: currentPage === 1 ? "var(--ui-bg-input)" : "rgba(249,115,22,0.12)", color: currentPage === 1 ? "var(--ui-text-muted)" : "#f97316" }}>← Prev</button>
          <span style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{currentPage} / {totalPages}</span>
          <button onClick={() => fetchData(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer", background: currentPage === totalPages ? "var(--ui-bg-input)" : "rgba(249,115,22,0.12)", color: currentPage === totalPages ? "var(--ui-text-muted)" : "#f97316" }}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Admin Users Tab                                                    */
/* ─────────────────────────────────────────────────────────────────── */

function AdminUsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchUsers = async (page = currentPage, s = search, pp = perPage) => {
    setIsLoading(true);
    try {
      const res = await adminGetUsers({ page, per_page: pp, search: s });
      setUsers(res.users?.data || []);
      setCurrentPage(res.users?.current_page || 1);
      setTotalPages(res.users?.last_page || 1);
      setTotal(res.total ?? res.users?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1, search, perPage), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers(1, search, perPage);
  }, [perPage]);

  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  const thStyle: React.CSSProperties = {
    padding: "11px 16px", textAlign: "left", fontSize: 11,
    fontWeight: 700, color: "var(--ui-text-muted)", borderBottom: "1px solid var(--ui-border)",
    background: "rgba(0,0,0,0.03)", whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 16px", fontSize: 13, borderBottom: "1px solid var(--ui-border)",
    color: "var(--ui-text-primary)", verticalAlign: "middle",
  };

  return (
    <div>
      {/* Header + stat card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div style={{
          background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
          borderRadius: 20, padding: 24,
          display: "flex", alignItems: "center", gap: 18,
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
          }}>
            <Users size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900 }}>{total.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>Total Users</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 260, display: "flex", alignItems: "center", gap: 10, background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 10, padding: "9px 14px" }}>
          <Search size={15} color="var(--ui-text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, WhatsApp, atau perusahaan…"
            style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 13 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", display: "flex", padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>Tampilkan</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[10, 20, 50].map(n => (
              <button
                key={n}
                onClick={() => setPerPage(n)}
                style={{
                  padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: perPage === n ? "var(--ui-primary)" : "var(--ui-bg-card)",
                  color: perPage === n ? "#fff" : "var(--ui-text-muted)",
                  border: perPage === n ? "none" : "1px solid var(--ui-border)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 14, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Loader2 className="animate-spin" style={{ margin: "0 auto", color: "#6366f1" }} size={32} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>NAMA</th>
                  <th style={thStyle}>EMAIL</th>
                  <th style={thStyle}>WHATSAPP</th>
                  <th style={thStyle}>PERUSAHAAN</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>BERGABUNG</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: 48, color: "var(--ui-text-muted)" }}>
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : users.map(user => (
                  <tr key={user.id} style={{ transition: "background 0.1s" }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 800, color: "#fff",
                        }}>
                          {user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        {user.name || "—"}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: "var(--ui-text-muted)" }}>{user.email || "—"}</td>
                    <td style={{ ...tdStyle, color: "var(--ui-text-muted)", fontFamily: "monospace", fontSize: 12 }}>{user.whatsapp || "—"}</td>
                    <td style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12 }}>
                      {user.company?.name
                        ? <span style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{user.company.name}</span>
                        : "—"}
                    </td>
                    <td style={tdStyle}>
                      {user.roles?.[0]?.slug
                        ? <span style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{user.roles[0].slug}</span>
                        : <span style={{ color: "var(--ui-text-muted)", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
            Halaman {currentPage} dari {totalPages} · {total.toLocaleString()} user
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => fetchUsers(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: currentPage === 1 ? "var(--ui-bg-input)" : "rgba(99,102,241,0.12)",
                color: currentPage === 1 ? "var(--ui-text-muted)" : "#818cf8",
                border: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Prev
            </button>

            {buildPages().map((p, i) =>
              p === "…"
                ? <span key={`dots-${i}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12 }}>…</span>
                : (
                  <button
                    key={p}
                    onClick={() => fetchUsers(p as number)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: currentPage === p ? "#6366f1" : "var(--ui-bg-card)",
                      color: currentPage === p ? "#fff" : "var(--ui-text-muted)",
                      border: currentPage === p ? "none" : "1px solid var(--ui-border)",
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                )
            )}

            <button
              onClick={() => fetchUsers(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: currentPage === totalPages ? "var(--ui-bg-input)" : "rgba(99,102,241,0.12)",
                color: currentPage === totalPages ? "var(--ui-text-muted)" : "#818cf8",
                border: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Audit Modal                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function AuditModal({
  company, action, onClose, onDone,
}: {
  company: Company;
  action: "approve" | "decline";
  onClose: () => void;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = action === "approve";
  const accentColor = isApprove ? "#34d399" : "#f87171";
  const accentBg    = isApprove ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)";

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await adminAuditCompany(company.id, { action, notes: notes || undefined });
      onDone();
    } catch (err: any) {
      setError(err.message || "Action failed.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--ui-glass-bg)", border: "1px solid var(--ui-glass-border)",
        borderRadius: 24, padding: "clamp(24px, 5vw, 36px)", width: "100%", maxWidth: 480,
        boxShadow: "var(--ui-glass-shadow)",
        display: "flex", flexDirection: "column", gap: 20,
        position: "relative",
        transition: "all 0.3s ease",
      }}>
        {/* Top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "24px 24px 0 0",
          background: `linear-gradient(90deg,${accentColor},${accentColor}80)`,
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: 10, cursor: "pointer",
            background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ui-text-muted)",
            transition: "all 0.3s ease",
            minHeight: 44,
            minWidth: 44,
          }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: accentBg, border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isApprove ? <CheckCircle2 size={26} color={accentColor} /> : <XCircle size={26} color={accentColor} />}
          </div>
          <div>
            <h3 style={{ fontSize: "clamp(15px, 3vw, 17px)", fontWeight: 800, color: "var(--ui-text-primary)", margin: 0, transition: "color 0.3s ease" }}>
              {isApprove ? "Approve Company" : "Decline Company"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--ui-text-muted)", margin: "4px 0 0", transition: "color 0.3s ease" }}>{company.name}</p>
          </div>
        </div>

        {/* Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label style={lbl}>
            {isApprove ? "Approval Notes (optional)" : "Reason for Decline *"}
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isApprove
              ? "e.g. All documents verified, company approved."
              : "e.g. Incomplete documents, NPWP not valid."}
            rows={4}
            style={{
              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
              borderRadius: 12, padding: "12px 14px",
              fontSize: 13, color: "var(--ui-text-primary)", outline: "none",
              width: "100%", resize: "none",
              fontFamily: "inherit",
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f87171",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, minWidth: 100, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
              color: "var(--ui-text-muted)", cursor: "pointer", transition: "all 0.2s",
              minHeight: 44,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              flex: 2, minWidth: 120, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 800,
              background: isApprove
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#ef4444,#dc2626)",
              border: "none", color: "#fff", cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: isLoading ? 0.75 : 1,
              boxShadow: isLoading ? "none" : `0 6px 20px ${accentColor}30`,
              transition: "all 0.2s",
              minHeight: 44,
            }}
          >
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" /> Processing…</>
            ) : (
              <>{isApprove ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {isApprove ? "Approve Company" : "Decline Registration"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Shared styles                                                      */
/* ─────────────────────────────────────────────────────────────────── */

const lbl: React.CSSProperties = {
  fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.07em",
  transition: "color 0.3s ease",
};

const inp: React.CSSProperties = {
  background: "var(--ui-bg-input)",
  border: "1px solid var(--ui-border-input)",
  borderRadius: 12, padding: "12px 16px",
  fontSize: 14, color: "var(--ui-text-primary)", outline: "none",
  width: "100%", fontFamily: "inherit",
  transition: "border-color 0.2s, background 0.3s ease, color 0.3s ease",
  minHeight: 48,
};
import { adminGetAdmins, adminCreateAdmin, adminGetUsers } from "../lib/api";

function AdminAdminsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await adminGetAdmins();
      setAdmins(res.admins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminCreateAdmin({ name, email, password });
      Swal.fire({ icon: 'success', title: 'Success', text: 'Admin created successfully.' });
      setShowAddModal(false);
      setName(""); setEmail(""); setPassword("");
      fetchAdmins();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to create admin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Admins Management</div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: "var(--ui-primary)", color: "#fff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8
          }}
        >
          <Users size={16} /> Add New Admin
        </button>
      </div>

      {isLoading ? <Loader2 className="animate-spin" /> : (
        <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 20, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--ui-border)" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)" }}>NAME</th>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)" }}>EMAIL</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(adm => (
                <tr key={adm.id} style={{ borderBottom: "1px solid var(--ui-border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 700 }}>{adm.name}</td>
                  <td style={{ padding: "16px 20px", color: "var(--ui-text-muted)" }}>{adm.email}</td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: 40, textAlign: "center", color: "var(--ui-text-muted)" }}>No admins found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div style={{ background: "var(--ui-bg-card)", padding: "24px 20px", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 440, maxHeight: "92dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Add New Admin</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} style={{ ...inp, marginTop: 6 }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 2, padding: "12px", borderRadius: 10, background: "var(--ui-primary)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>
                  {isSubmitting ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Admin Settings Tab                                                 */
/* ─────────────────────────────────────────────────────────────────── */

interface AdminSettings {
  bypass_npwp_verification: boolean;
}

function AdminSettingsTab() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminGetSettings();
      setSettings(res.settings);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to load settings." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleToggle = async (key: keyof AdminSettings) => {
    if (!settings) return;
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    setIsSaving(true);
    try {
      await adminUpdateSettings({ [key]: newValue });
    } catch (err: any) {
      // revert on failure
      setSettings(settings);
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save setting." });
    } finally {
      setIsSaving(false);
    }
  };

  const settingItems = [
    {
      key: "bypass_npwp_verification" as keyof AdminSettings,
      title: "Bypass NPWP Verification",
      description: "Lewati verifikasi NPWP ke Pajak Express dan gunakan dummy data. Aktifkan sementara ketika API Pajak Express tidak tersedia.",
      danger: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg,#6366f1,#4f46e5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Settings size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>System Settings</div>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>Feature flags dan konfigurasi sistem</div>
        </div>
        {isSaving && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ui-text-muted)" }}>
            <Loader2 size={14} className="animate-spin" /> Saving...
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--ui-text-muted)" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {settingItems.map(item => {
            const isOn = settings?.[item.key] ?? false;
            return (
              <div key={item.key} style={{
                background: "var(--ui-bg-card)",
                border: `1px solid ${item.danger && isOn ? "rgba(239,68,68,0.4)" : "var(--ui-border)"}`,
                borderRadius: 16,
                padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
                transition: "border-color 0.2s",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                      {item.title}
                    </span>
                    {item.danger && isOn && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: "rgba(239,68,68,0.15)", color: "#ef4444",
                        letterSpacing: "0.05em",
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ui-text-muted)", lineHeight: 1.5 }}>
                    {item.description}
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggle(item.key)}
                  disabled={isSaving}
                  style={{
                    position: "relative",
                    width: 48, height: 26,
                    borderRadius: 13,
                    background: isOn
                      ? (item.danger ? "#ef4444" : "#10b981")
                      : "var(--ui-border)",
                    border: "none",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    transition: "background 0.25s",
                    flexShrink: 0,
                    opacity: isSaving ? 0.7 : 1,
                  }}
                  aria-label={`Toggle ${item.title}`}
                  aria-checked={isOn}
                  role="switch"
                >
                  <span style={{
                    position: "absolute",
                    top: 3, left: isOn ? 25 : 3,
                    width: 20, height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                    transition: "left 0.25s",
                  }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
