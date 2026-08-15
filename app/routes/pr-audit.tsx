import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiGet } from "../lib/api";
import {
  ClipboardList, User, Search, Loader2,
  CheckCircle2, ChevronRight, Trophy, Building2,
} from "lucide-react";
import { useNavigate } from "react-router";

const STATUS_CFG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  pending_approval: { bg: "bg-amber-500/10", color: "text-amber-500", dot: "bg-amber-500", label: "Pending Approval" },
  approved:         { bg: "bg-emerald-500/10", color: "text-emerald-500", dot: "bg-emerald-500", label: "Approved" },
  active:           { bg: "bg-orange-500/10", color: "text-orange-400", dot: "bg-orange-500", label: "Open Tender" },
  rejected:         { bg: "bg-red-500/10", color: "text-red-400", dot: "bg-red-500", label: "Rejected" },
};

function getStatus(status: string) {
  return STATUS_CFG[status] ?? {
    bg: "bg-[var(--ui-bg-input)]",
    color: "text-[var(--ui-text-muted)]",
    dot: "bg-gray-400",
    label: status,
  };
}

function formatDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PurchaseRequisitionAudit() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [winnerMap, setWinnerMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const companySession = localStorage.getItem("active_company");
    if (companySession) {
      const comp = JSON.parse(companySession);
      if (comp.type === "vendor") {
        navigate("/");
        return;
      }
    }
    fetchMyRequests();
  }, [navigate]);

  const fetchMyRequests = async () => {
    const activeComp = localStorage.getItem("active_company");
    if (!activeComp) return;
    const comp = JSON.parse(activeComp);

    try {
      const response = await apiGet(`/api/rfqs?company_id=${comp.id}`);
      const data = response?.data || response || [];
      const rfqs = Array.isArray(data) ? data : [];
      setRequests(rfqs);

      const winnerEntries = await Promise.all(
        rfqs.map(async (rfq: any) => {
          try {
            const fromProposals = (rfq.proposals || []).find(
              (p: any) => p.winner_status === "approved" || p.winner_status === "awarded"
            );
            if (fromProposals) return [String(rfq.id), fromProposals];

            const rankings = await apiGet(`/api/rfqs/${rfq.id}/rankings`);
            const rankList: any[] = Array.isArray(rankings) ? rankings : (rankings?.rankings || []);
            const winnerRank = rankList.find(
              (r: any) => r.is_winner || r.proposal?.winner_status === "approved" || r.proposal?.winner_status === "awarded"
            );
            return [String(rfq.id), winnerRank?.proposal || null];
          } catch {
            return [String(rfq.id), null];
          }
        })
      );

      const map: Record<string, any> = {};
      winnerEntries.forEach(([id, proposal]) => {
        if (proposal) map[id as string] = proposal;
      });
      setWinnerMap(map);
    } catch (err) {
      console.error("Failed to fetch PR audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getWinner = (req: any) => {
    const winner = (req.proposals || []).find(
      (p: any) => p.winner_status === "approved" || p.winner_status === "awarded"
    );
    if (winner) return winner;
    return winnerMap[String(req.id)] || null;
  };

  const filteredRequests = requests.filter((r) =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.approved_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.id ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="PR Audit Log" subtitle="Audit trail for purchase requisitions — creator, approver, and winner.">
      <div className="w-full flex flex-col gap-4">

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
          <input
            type="text"
            placeholder="Search by title, ID, creator, or approver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-orange-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
            <ClipboardList size={24} className="text-[var(--ui-text-muted)] opacity-25" />
            <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">No purchase requisitions found</p>
            <p className="text-xs text-[var(--ui-text-muted)]">Try adjusting your search.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[100px]">PR ID</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Title</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[130px]">Status</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[150px]">Created</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[150px]">Approved</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[160px]">Winner</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[120px]">Company</th>
                    <th className="px-4 py-2.5 w-[40px]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {filteredRequests.map((req) => {
                    const s = getStatus(req.status);
                    const winner = getWinner(req);
                    return (
                      <tr
                        key={req.id}
                        onClick={() => navigate(`/my-pr/${req.id}`)}
                        className="hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                            #{String(req.id ?? "").substring(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-[var(--ui-text-primary)] text-sm line-clamp-1">{req.title}</div>
                          <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">
                            {req.items?.length ?? 0} item{(req.items?.length ?? 0) !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-semibold text-[var(--ui-text-primary)]">{req.user?.name || "Unknown"}</div>
                          <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">{formatDateTime(req.created_at)}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-semibold text-[var(--ui-text-primary)]">
                            {req.approved_by || "—"}
                          </div>
                          <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">
                            {req.approved_at ? formatDateTime(req.approved_at) : "Not approved"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          {winner ? (
                            <>
                              <div className="text-xs font-semibold text-orange-400">
                                {winner.company?.name || "Vendor"}
                              </div>
                              <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">
                                Rp {Number(winner.price_offer).toLocaleString("id-ID")}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--ui-text-muted)]">
                              {req.status === "active" ? "Tender open" : "No winner"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--ui-text-secondary)]">
                            <Building2 size={12} className="text-[var(--ui-text-muted)]" />
                            <span className="line-clamp-1">{req.company?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="w-7 h-7 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] inline-flex items-center justify-center text-[var(--ui-text-muted)] group-hover:text-orange-500 group-hover:border-orange-500/30 transition-all">
                            <ChevronRight size={13} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                <span className="text-xs text-[var(--ui-text-muted)]">
                  {filteredRequests.length} record{filteredRequests.length !== 1 ? "s" : ""}
                  {searchTerm && ` matching "${searchTerm}"`}
                </span>
              </div>
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden flex flex-col gap-2">
              {filteredRequests.map((req) => {
                const s = getStatus(req.status);
                const winner = getWinner(req);
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => navigate(`/my-pr/${req.id}`)}
                    className="w-full text-left rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 hover:bg-[var(--ui-bg-input)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                            #{String(req.id ?? "").substring(0, 8).toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${s.bg} ${s.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[var(--ui-text-primary)] mt-1.5 leading-snug">{req.title}</p>
                      </div>
                      <ChevronRight size={16} className="text-[var(--ui-text-muted)] shrink-0 mt-1" />
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <AuditCell
                        icon={<User size={11} />}
                        label="Created"
                        value={req.user?.name || "Unknown"}
                        sub={formatDate(req.created_at)}
                      />
                      <AuditCell
                        icon={<CheckCircle2 size={11} />}
                        label="Approved"
                        value={req.approved_by || "—"}
                        sub={req.approved_at ? formatDate(req.approved_at) : "Pending"}
                      />
                      <AuditCell
                        icon={<Trophy size={11} />}
                        label="Winner"
                        value={winner ? (winner.company?.name || "Vendor") : "—"}
                        sub={
                          winner
                            ? `Rp ${Number(winner.price_offer).toLocaleString("id-ID")}`
                            : req.status === "active" ? "Tender open" : "No winner"
                        }
                        accent={!!winner}
                      />
                      <AuditCell
                        icon={<Building2 size={11} />}
                        label="Company"
                        value={req.company?.name || "—"}
                        sub={`${req.items?.length ?? 0} items`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function AuditCell({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
        <span className="text-[var(--ui-text-muted)]">{icon}</span>
        {label}
      </div>
      <div className={`text-xs font-semibold mt-1 truncate ${accent ? "text-orange-400" : "text-[var(--ui-text-primary)]"}`}>
        {value}
      </div>
      <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5 truncate">{sub}</div>
    </div>
  );
}
