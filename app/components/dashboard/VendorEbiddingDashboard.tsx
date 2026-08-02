import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Layout from "../Layout";
import CurrencyWidget from "../CurrencyWidget";
import WeatherWidget from "../WeatherWidget";
import { SummaryWidget, MiniStat } from "./SummaryWidget";
import { TrendingSearchWidget } from "./TrendingSearchWidget";
import { apiGet } from "../../lib/api";
import { ClipboardList, Trophy, Timer } from "lucide-react";

const VENDOR_DASHBOARD_HINTS = [
  "Monitoring tender aktif",
  "Draft proposal tersimpan",
  "Pengiriman submisi terdekat",
];

function getRfqDeadline(rfq: any): number | null {
  const base = rfq?.approved_at || rfq?.created_at;
  if (!base) return null;
  const durationDays = Number(rfq?.duration_days || 7);
  const start = new Date(base);
  if (Number.isNaN(start.getTime())) return null;
  return start.getTime() + (durationDays * 24 * 60 * 60 * 1000);
}

function isRfqExpired(rfq: any, now: number): boolean {
  if (!rfq?.approved_at) return false; // Not approved yet, so not expired
  
  const deadline = getRfqDeadline(rfq);
  if (!deadline) return false;
  
  return now > deadline;
}

function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "00j 00m 00d";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}h ${String(hours).padStart(2, "0")}j ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(hours).padStart(2, "0")}j ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}d`;
}

export function VendorEbiddingDashboard({ user, activeCompany }: { user: any, activeCompany: any }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [openRfqs, setOpenRfqs] = useState<any[]>([]);
  const [vendorProposals, setVendorProposals] = useState<any[]>([]);
  const [vendorRankings, setVendorRankings] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeCompany?.id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [rfqRes, proposalRes, rankRes] = await Promise.all([
          apiGet("/api/rfqs?status=active"),
          apiGet(`/api/proposals?company_id=${activeCompany.id}`),
          apiGet(`/api/proposals/my-rank?company_id=${activeCompany.id}`),
        ]);

        if (cancelled) return;

        setOpenRfqs(Array.isArray(rfqRes) ? rfqRes : rfqRes.data || []);
        setVendorProposals(Array.isArray(proposalRes) ? proposalRes : proposalRes.data || []);
        setVendorRankings(Array.isArray(rankRes) ? rankRes : rankRes.rankings || []);
      } catch (err) {
        console.error("Failed to load vendor dashboard", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeCompany?.id]);

  const proposalMap = new Map(vendorProposals.map((proposal: any) => [String(proposal.rfq_id), proposal]));
  const rankingMap = new Map(vendorRankings.map((ranking: any) => [String(ranking.rfq_id || ranking.proposal?.rfq_id), ranking]));
  const participatedCount = new Set(vendorRankings.map((ranking: any) => String(ranking.rfq_id || ranking.proposal?.rfq_id))).size || new Set(vendorProposals.map((proposal: any) => String(proposal.rfq_id))).size;
  const wins = vendorRankings.filter((ranking: any) => ranking.is_winner || ["awarded", "approved"].includes(String(ranking.proposal?.winner_status || ranking.winner_status || ""))).length;
  const winRate = participatedCount > 0 ? Math.round((wins / participatedCount) * 100) : 0;

  const deadlines = openRfqs
    .filter((rfq: any) => !isRfqExpired(rfq, now)) // Filter out expired RFQs
    .map((rfq: any) => getRfqDeadline(rfq))
    .filter((value: number | null): value is number => typeof value === "number")
    .sort((a: number, b: number) => a - b);
  const nearestDeadline = deadlines[0] || null;
  const countdown = nearestDeadline ? formatCountdown(nearestDeadline - now) : "Belum ada tender aktif";

  const tableRows = [...openRfqs]
    .filter((rfq: any) => !isRfqExpired(rfq, now)) // Filter out expired RFQs from table
    .sort((a: any, b: any) => (getRfqDeadline(a) || Number.MAX_SAFE_INTEGER) - (getRfqDeadline(b) || Number.MAX_SAFE_INTEGER))
    .slice(0, 12)
    .map((rfq: any) => {
      const proposal = proposalMap.get(String(rfq.id));
      const ranking = rankingMap.get(String(rfq.id));
      const submittedAt = proposal?.created_at ? new Date(proposal.created_at).toLocaleDateString("id-ID") : "-";
      const deadline = getRfqDeadline(rfq);
      const deadlineText = deadline ? new Date(deadline).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";
      const isExpired = isRfqExpired(rfq, now);
      const status = proposal
        ? (["awarded", "approved"].includes(String(proposal.winner_status)) ? "Awarded" : "Submitted")
        : isExpired ? "Expired" : "Draft";

      return {
        rfq,
        proposal,
        ranking,
        submittedAt,
        deadlineText,
        status,
        isExpired,
      };
    });

  const downloadCSV = (title: string, headers: string[], data: any[][]) => {
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...data.map(row => row.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadStats = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Active Company", activeCompany?.name || "—"],
      ["Total Diikuti (Tender Unik)", String(participatedCount)],
      ["Total Menang (Wins)", `${wins}`],
      ["Win Rate (%)", `${winRate}%`],
      ["Deadline Terdekat", countdown],
      ["Open Tenders", String(openRfqs.filter((rfq: any) => !isRfqExpired(rfq, now)).length)],
      ["Submitted Proposals", String(vendorProposals.length)],
      ["Draft Proposals", String(Math.max(openRfqs.filter((rfq: any) => !isRfqExpired(rfq, now)).length - vendorProposals.length, 0))]
    ];
    downloadCSV("Vendor_Performance_Metrics", headers, rows);
  };

  const handleDownloadTenderTable = () => {
    const headers = ["Tender Title", "Total Items", "Buyer Company Name", "RFQ Code", "Status", "Proposal Price Offer (IDR)", "Proposal Ranking", "Deadline"];
    const rows = tableRows.map(({ rfq, proposal, ranking, deadlineText, status }) => [
      rfq.title,
      String(rfq.items?.length || 0),
      rfq.company?.name || "Buyer",
      `RFQ ${String(rfq.id).slice(0, 8)}`,
      status,
      proposal ? String(proposal.price_offer || 0) : "0",
      ranking ? `Rank #${ranking.rank}` : "N/A",
      deadlineText
    ]);
    downloadCSV("Vendor_Ebidding_Tenders", headers, rows);
  };

  return (
    <Layout title="Vendor E-Bidding Dashboard" subtitle="Pantau tender aktif, draft proposal, dan submisi yang sedang berjalan.">
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24, boxSizing: "border-box" }}>

        {/* Weather + Currency compact row */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "stretch" }}>
          <WeatherWidget embedded />
          <CurrencyWidget embedded />
        </section>

        {/* Stats Section Header with Download */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Statistik Performa Vendor</h3>
          <button 
            onClick={handleDownloadStats} 
            style={{ 
              background: "rgba(249,115,22,0.1)", 
              border: "1px solid rgba(249,115,22,0.3)", 
              color: "#f59e0b", 
              padding: "4px 10px", 
              borderRadius: 8, 
              fontSize: 11, 
              fontWeight: 700, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            Download Stats Excel
          </button>
        </div>

        {/* Stat cards compact row — all cards uniform small size */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {/* Company */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px", borderLeft: "3px solid #f97316" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Company</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--ui-text-primary)", marginTop: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeCompany?.name || "—"}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 3 }}>{user?.name}</div>
          </div>
          {/* Total Tender */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Diikuti</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--ui-text-primary)", marginTop: 4, lineHeight: 1 }}>{loading ? "..." : String(participatedCount)}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Tender unik</div>
          </div>
          {/* Wins */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Menang</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#34d399", marginTop: 4, lineHeight: 1 }}>{loading ? "..." : `${wins}`}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>{winRate}% win rate</div>
          </div>
          {/* Deadline */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deadline Terdekat</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#60a5fa", marginTop: 4, lineHeight: 1.2 }}>{loading ? "..." : countdown}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>RFQ aktif</div>
          </div>
          {/* Open Tenders */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Open Tenders</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fb923c", marginTop: 4, lineHeight: 1 }}>{loading ? "..." : openRfqs.filter((rfq: any) => !isRfqExpired(rfq, now)).length}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Aktif saat ini</div>
          </div>
          {/* Submitted */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Submitted</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#a78bfa", marginTop: 4, lineHeight: 1 }}>{loading ? "..." : vendorProposals.length}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Proposal terkirim</div>
          </div>
          {/* Drafts */}
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Drafts</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--ui-text-primary)", marginTop: 4, lineHeight: 1 }}>{loading ? "..." : Math.max(openRfqs.filter((rfq: any) => !isRfqExpired(rfq, now)).length - vendorProposals.length, 0)}</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 4 }}>Belum disubmit</div>
          </div>
        </section>

        {/* Trending Search Indicator */}
        <section>
          <TrendingSearchWidget />
        </section>

        {/* Tender table — full width */}
        <section>
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ui-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Modul E-Bidding</div>
                <h2 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 900, color: "var(--ui-text-primary)" }}>Draft dan Pengajuan Proposal</h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button 
                  onClick={handleDownloadTenderTable} 
                  style={{ 
                    background: "rgba(249,115,22,0.1)", 
                    border: "1px solid rgba(249,115,22,0.3)", 
                    color: "#f59e0b", 
                    padding: "6px 12px", 
                    borderRadius: 8, 
                    fontSize: 11, 
                    fontWeight: 700, 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  Download Proposals Excel
                </button>
                <div style={{ display: "flex", gap: 6 }}>
                  {VENDOR_DASHBOARD_HINTS.map((item) => (
                    <span key={item} style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(249,115,22,0.1)", color: "#f59e0b", fontSize: 10, fontWeight: 700 }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ui-text-muted)" }}>
                    <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--ui-border)" }}>Tender</th>
                    <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--ui-border)" }}>Buyer</th>
                    <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--ui-border)" }}>Status</th>
                    <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--ui-border)" }}>Submisi</th>
                    <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--ui-border)" }}>Deadline</th>
                    <th style={{ padding: "10px 14px", borderBottom: "1px solid var(--ui-border)" }} />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--ui-text-muted)" }}>Memuat tender aktif...</td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--ui-text-muted)" }}>Belum ada tender aktif yang bisa dipantau.</td>
                    </tr>
                  ) : (
                    tableRows.map(({ rfq, proposal, ranking, submittedAt, deadlineText, status, isExpired }) => (
                      <tr key={rfq.id} style={{ borderBottom: "1px solid var(--ui-border-subtle)" }}>
                        <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 800, color: "var(--ui-text-primary)", lineHeight: 1.4, fontSize: 13 }}>{rfq.title}</div>
                          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>{rfq.items?.length || 0} item</div>
                        </td>
                        <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: "var(--ui-text-primary)", fontSize: 13 }}>{rfq.company?.name || "Buyer"}</div>
                          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>RFQ {String(rfq.id).slice(0, 8)}</div>
                        </td>
                        <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 800,
                            background: status === "Draft" ? "rgba(59,130,246,0.12)" 
                                      : status === "Submitted" ? "rgba(249,115,22,0.12)" 
                                      : status === "Expired" ? "rgba(239,68,68,0.12)"
                                      : "rgba(34,197,94,0.12)",
                            color: status === "Draft" ? "#60a5fa" 
                                 : status === "Submitted" ? "#f59e0b" 
                                 : status === "Expired" ? "#ef4444"
                                 : "#34d399",
                          }}>
                            {status}
                          </span>
                          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 6 }}>
                            {proposal ? `Winner: ${proposal.winner_status || "submitted"}` : isExpired ? "Deadline passed" : "No proposal"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: "var(--ui-text-primary)", fontSize: 13 }}>{proposal ? `Rp ${Number(proposal.price_offer || 0).toLocaleString("id-ID")}` : isExpired ? "N/A" : "Draft"}</div>
                          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                            {ranking ? `Rank #${ranking.rank}` : submittedAt === "-" ? (isExpired ? "Expired" : "Not submitted") : `Sent ${submittedAt}`}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 700, color: isExpired ? "#ef4444" : "var(--ui-text-primary)", fontSize: 13 }}>{deadlineText}</div>
                          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                            {isExpired ? "Closed" : proposal ? `Sent ${submittedAt}` : "Ready"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", verticalAlign: "top", textAlign: "right" }}>
                          {isExpired ? (
                            <span style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              border: "1px solid rgba(239,68,68,0.22)",
                              background: "rgba(239,68,68,0.08)",
                              color: "#ef4444",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "default",
                            }}>
                              Closed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate("/proposals", { state: { rfqId: rfq.id } })}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(249,115,22,0.22)",
                                background: "rgba(249,115,22,0.08)",
                                color: "#f59e0b",
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              {proposal ? "Lihat" : "Buka"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
