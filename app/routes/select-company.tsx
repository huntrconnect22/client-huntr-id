import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { 
  Building2, Plus, Loader2, CheckCircle2, ArrowRight,
  LayoutGrid, LogOut,
} from "lucide-react";
import { getMyCompanies } from "../lib/api";
import ThemeToggle from "../components/ThemeToggle";

export default function SelectCompany() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (!session) { navigate("/login"); return; }
    const u = JSON.parse(session);
    setUser(u);
    getMyCompanies()
      .then(data => {
        console.log("[SelectCompany] getMyCompanies response:", data);
        const list = Array.isArray(data?.companies) ? data.companies : Array.isArray(data) ? data : [];
        setCompanies(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch((err) => {
        console.error("[SelectCompany] getMyCompanies failed:", err);
        setCompanies([]);
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);


  const handleLogin = () => {
    if (!selected) return;
    localStorage.setItem("active_company", JSON.stringify(selected));
    const slug = selected.slug || selected.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/${slug}`);
  };

  const handleRegisterNew = () => navigate("/onboarding");

  const handleSignOut = () => { 
    localStorage.removeItem("user_session");
    localStorage.removeItem("active_company");
    localStorage.removeItem("huntr_cart");
    navigate("/login"); 
  };

  const statusMeta: Record<string, { color: string; bg: string; label: string }> = {
    approved: { color: "#34d399", bg: "rgba(52,211,153,0.12)", label: "Verified" },
    pending:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  label: "Pending"  },
    rejected: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "Rejected" },
  };

  const getMeta = (s: string) => statusMeta[s] || { color: "#9ca3af", bg: "rgba(156,163,175,0.12)", label: s || "Unknown" };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[var(--ui-bg-page-grad)]">

      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-8%] w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-15%] left-[-8%] w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(251,146,60,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--ui-border)] bg-[var(--ui-bg-card)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img 
            src="/assets/img/logo/sidebar.png" 
            alt="Huntr Logo" 
            className="w-28 h-7 object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--ui-bg-input)] border border-[var(--ui-border)] rounded-lg text-xs font-semibold text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] transition-all"
          >
            <LogOut size={13} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main card */}
      <div className="w-full max-w-md relative z-1 mt-16">
        <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-xl overflow-hidden shadow-xl">
          {/* Top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500" />

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-500/20">
                <LayoutGrid size={22} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-[var(--ui-text-primary)] tracking-tight mb-1">
                Choose a Workspace
              </h1>
              {user && (
                <p className="text-xs text-[var(--ui-text-secondary)]">
                  Welcome back,{" "}
                  <span className="text-orange-400 font-semibold">{user.name}</span>
                </p>
              )}
            </div>

            {/* Body */}
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={24} className="text-orange-500 animate-spin" />
                <span className="text-xs text-[var(--ui-text-muted)] font-medium">Loading workspaces...</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-4">
                <div className="w-11 h-11 rounded-lg bg-[var(--ui-bg-input)] flex items-center justify-center mx-auto mb-3 text-[var(--ui-text-muted)]">
                  <Building2 size={22} />
                </div>
                <p className="text-xs text-[var(--ui-text-secondary)] mb-5">
                  You don't have any registered company yet.
                </p>
                <button
                  onClick={handleRegisterNew}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                  <Plus size={16} /> Register a Company
                </button>
              </div>
            ) : (
              <>
                {/* Company list */}
                <div className="flex flex-col gap-2 mb-5">
                  {companies.map(c => {
                    const isSelected = selected?.id === c.id;
                    const meta = getMeta(c.status);
                    const isBuyer = c.type === "buyer";
                    const typeColor = isBuyer ? "#818cf8" : "#f97316";
                    const typeBg = isBuyer ? "rgba(99,102,241,0.15)" : "rgba(249,115,22,0.15)";
                    const gradientBg = isBuyer
                      ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                      : "linear-gradient(135deg,#f97316,#f59e0b)";
                    const selectedBorderColor = isBuyer ? "rgba(99,102,241,0.4)" : "rgba(249,115,22,0.4)";
                    const selectedBg = isBuyer ? "rgba(99,102,241,0.07)" : "rgba(249,115,22,0.07)";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelected(c)}
                        className={`
                          p-3 rounded-lg text-left transition-all border flex items-center gap-3 group
                          ${isSelected
                            ? ""
                            : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] hover:border-orange-500/30"
                          }
                        `}
                        style={isSelected ? { background: selectedBg, borderColor: selectedBorderColor } : {}}
                      >
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all"
                          style={{ background: isSelected ? gradientBg : "var(--ui-bg-input-focus)" }}
                        >
                          <Building2 size={17} color={isSelected ? "#fff" : "var(--ui-text-muted)"} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: isSelected ? typeColor : "var(--ui-text-primary)" }}>
                            {c.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {/* Workspace type badge */}
                            <span
                              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ color: typeColor, background: typeBg }}
                            >
                              {isBuyer ? "BUYER" : "VENDOR"}
                            </span>
                            {/* Status badge */}
                            <span
                              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ color: meta.color, background: meta.bg }}
                            >
                              {meta.label}
                            </span>
                            {/* NPWP Verified Badge */}
                            {(c.formatted_tax_id || c.tax_id) && (
                              <span
                                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                title={`NPWP: ${c.formatted_tax_id || c.tax_id} (Terverifikasi)`}
                              >
                                <CheckCircle2 size={10} className="text-sky-400 shrink-0" />
                                <span>NPWP Terverifikasi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: typeColor }}>
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={!selected}
                    style={{ color: 'white' }}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    Enter Workspace <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={handleRegisterNew}
                    className="w-full py-2 bg-[var(--ui-bg-input)] hover:bg-[var(--ui-bg-input-focus)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] rounded-lg font-medium text-xs transition-all"
                  >
                    + Register Another Company
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-[var(--ui-text-muted)] font-medium">
            &copy; 2026 Huntr.id &bull; Secure Environment
          </p>
        </div>
      </div>
    </div>
  );
}
