import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet } from "../lib/api";
import {
  ClipboardList, Clock, CheckCircle2, XCircle, ChevronRight,
  Package, Calendar, Search, Loader2, Plus, ArrowUpRight, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router";

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  pending_approval: { bg: "bg-amber-500/10",  color: "text-amber-500",  dot: "bg-amber-500",  label: "Pending Approval" },
  approved:         { bg: "bg-emerald-500/10", color: "text-emerald-500",dot: "bg-emerald-500",label: "Approved"         },
  active:           { bg: "bg-orange-500/10",  color: "text-orange-400", dot: "bg-orange-500", label: "Open RFQ"         },
  rejected:         { bg: "bg-red-500/10",     color: "text-red-400",    dot: "bg-red-500",    label: "Rejected"         },
};

function getStatus(status: string) {
  return STATUS_CFG[status] ?? { bg: "bg-[var(--ui-bg-input)]", color: "text-[var(--ui-text-muted)]", dot: "bg-gray-400", label: status };
}

function getRoute(req: any) {
  return req.status === "active" ? `/rfq/${req.id}` : `/my-pr/${req.id}`;
}

export default function MyPurchaseRequisitions() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      if (comp.type === "vendor") { navigate("/"); return; }
    }
    fetchMyRequests();

    const handleRefresh = () => fetchMyRequests();
    window.addEventListener("huntr:notification_received", handleRefresh);
    return () => window.removeEventListener("huntr:notification_received", handleRefresh);
  }, []);

  const fetchMyRequests = async () => {
    const activeComp = localStorage.getItem("active_company");
    if (!activeComp) return;
    const comp = JSON.parse(activeComp);
    try {
      const res = await apiGet(`/api/rfqs?company_id=${comp.id}`);
      setRequests(res || []);
    } catch (err) {
      console.error("Failed to fetch PRs", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter((r) =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.id ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="My Purchase Requisitions" subtitle="Track the status of your internal purchase requests.">
      <div className="w-full flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            <input
              type="text"
              placeholder="Search by title or PR ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/agentic-procurement")}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Sparkles size={15} />
              <span>AI Agent Procurement</span>
            </button>
            <button
              onClick={() => navigate("/marketplace")}
              style={{ color: 'white' }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ui-bg-input)] hover:bg-[var(--ui-border)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-sm font-semibold transition-all cursor-pointer"
            >
              <Plus size={15} /> New PR (Manual)
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-orange-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
            <ClipboardList size={32} className="text-[var(--ui-text-muted)] opacity-25" />
            <div className="text-center">
              <p className="font-semibold text-[var(--ui-text-secondary)] text-sm">No purchase requests found</p>
              <p className="text-xs text-[var(--ui-text-muted)] mt-1">Create a new PR from the marketplace.</p>
            </div>
            <button onClick={() => navigate("/marketplace")} style={{ color: 'white' }} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-sm font-semibold transition-all">
              Go to Marketplace
            </button>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── (hidden on mobile) */}
            <div className="hidden md:block rounded-xl border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">PR ID</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Title</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[90px]">Items</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[120px]">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[160px]">Status</th>
                    <th className="px-5 py-3 w-[52px]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {filtered.map((req) => {
                    const s = getStatus(req.status);
                    const href = getRoute(req);
                    return (
                      <tr
                        key={req.id}
                        onClick={() => navigate(href)}
                        className="hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer group"
                      >
                        {/* PR ID */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                            #{String(req.id ?? "").substring(0, 8).toUpperCase()}
                          </span>
                        </td>
                        {/* Title + description */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[var(--ui-text-primary)] truncate max-w-[360px]">{req.title}</div>
                          {req.description && (
                            <div className="text-xs text-[var(--ui-text-muted)] truncate max-w-[360px] mt-0.5">{req.description}</div>
                          )}
                        </td>
                        {/* Items count */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-[var(--ui-text-secondary)]">
                            <Package size={13} className="text-[var(--ui-text-muted)]" />
                            {req.items?.length ?? 0}
                          </div>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--ui-text-muted)]">
                            <Calendar size={12} />
                            {new Date(req.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </td>
                        {/* Status badge */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${s.bg} ${s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        {/* Arrow */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="w-7 h-7 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] inline-flex items-center justify-center text-[var(--ui-text-muted)] group-hover:text-orange-500 group-hover:border-orange-500/30 transition-all">
                            <ArrowUpRight size={13} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Row count */}
              <div className="px-5 py-2.5 border-t border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-between">
                <span className="text-xs text-[var(--ui-text-muted)]">
                  {filtered.length} request{filtered.length !== 1 ? "s" : ""}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
                <span className="text-xs text-[var(--ui-text-muted)]">Click a row to view details</span>
              </div>
            </div>

            {/* ── Mobile Card list ── (hidden on desktop) */}
            <div className="md:hidden flex flex-col gap-2.5">
              {filtered.map((req) => {
                const s = getStatus(req.status);
                return (
                  <button
                    key={req.id}
                    onClick={() => navigate(getRoute(req))}
                    className="w-full text-left p-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                        #{String(req.id ?? "").substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.color}`}>
                        <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-[var(--ui-text-primary)] truncate">{req.title}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--ui-text-muted)]">
                      <span className="flex items-center gap-1"><Package size={11} /> {req.items?.length ?? 0} items</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(req.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </button>
                );
              })}
              <p className="text-xs text-center text-[var(--ui-text-muted)] pt-1">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
