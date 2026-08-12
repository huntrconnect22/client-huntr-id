import React from "react";
import { 
  ShieldCheck, Trophy, MessageSquare, Award, CheckCircle2, 
  Info, Loader2, Sparkles 
} from "lucide-react";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../../hooks/useMediaQuery";
import { getAssetUrl } from "../../lib/assets";

interface ProposalRankingsProps {
  rankings: any[];
  canApproveOrAward: boolean;
  isRfqAlreadyAwarded: boolean;
  awardingProposal: string | number | null;
  isProcessing: boolean;
  onNegotiate: (proposal: any) => void;
  onAward: (proposalId: string | number, rfqId: string | number) => void;
  onAIRank: () => void;
  aiRankLoading: boolean;
  showAiPanel: boolean;
}

export function ProposalRankings({
  rankings,
  canApproveOrAward,
  isRfqAlreadyAwarded,
  awardingProposal,
  isProcessing,
  onNegotiate,
  onAward,
  onAIRank,
  aiRankLoading,
  showAiPanel
}: ProposalRankingsProps) {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const topRankData = rankings.find(r => r.rank === 1);

  if (rankings.length === 0) return null;

  return (
    <div style={{ marginTop: 20, background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={18} color="#f97316" />
          <div style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Participant Rankings & Evaluation</div>
        </div>
        {/* AI Analyse Button */}
        {canApproveOrAward && (
          <button
            onClick={onAIRank}
            disabled={aiRankLoading}
            style={{
              padding: "8px 16px", borderRadius: 12,
              background: showAiPanel
                ? "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.1))"
                : "linear-gradient(135deg, #a855f7, #6366f1)",
              border: showAiPanel ? "1px solid rgba(168,85,247,0.3)" : "none",
              color: showAiPanel ? "#a855f7" : "#fff",
              fontSize: 12, fontWeight: 600, cursor: aiRankLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: showAiPanel ? "none" : "0 4px 14px rgba(168,85,247,0.35)",
              transition: "all 0.2s ease",
              opacity: aiRankLoading ? 0.7 : 1,
            }}
          >
            {aiRankLoading
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> AI Menganalisis...</>
              : <><Sparkles size={13} /> {showAiPanel ? "Refresh AI Analisis" : "Analisis AI"}</>
            }
          </button>
        )}
      </div>

      {/* Metodologi Penilaian (Evaluation Criteria Info) */}
      <div style={{
        background: "var(--ui-bg-input)",
        border: "1px solid var(--ui-border-input)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        fontSize: 12,
        color: "var(--ui-text-secondary)",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 13 }}>
          <Info size={14} color="#f97316" />
          System Evaluation Criteria
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 4 }}>
          <div>
            <div style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>1. Harga (Prioritas Utama)</div>
            <div style={{ color: "var(--ui-text-muted)", marginTop: 2, fontSize: 11 }}>Mengutamakan total penawaran harga terendah dari seluruh vendor.</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>2. Waktu Pengiriman (Lead Time)</div>
            <div style={{ color: "var(--ui-text-muted)", marginTop: 2, fontSize: 11 }}>Jika harga sama, mengutamakan durasi pengiriman paling cepat (hari).</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>3. Garansi Layanan</div>
            <div style={{ color: "var(--ui-text-muted)", marginTop: 2, fontSize: 11 }}>Jika harga & lead time sama, mengutamakan masa garansi terpanjang (bulan).</div>
          </div>
        </div>
      </div>

      {/* System Winner Recommendation */}
      {topRankData && (
        <div style={{
          background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%)",
          border: "1px solid rgba(249, 115, 22, 0.25)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "start" }}>
              <Trophy size={20} color="#f97316" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 11, color: "#f97316", textTransform: "uppercase", letterSpacing: 0.5 }}>System Recommendation (Selected Winner)</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "var(--ui-text-primary)", marginTop: 4 }}>
                  {topRankData.proposal.company?.name || "Unknown Vendor"}
                </div>
              </div>
            </div>
            {canApproveOrAward && !isRfqAlreadyAwarded && (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => onNegotiate(topRankData.proposal)}
                  style={{
                    background: "rgba(249,115,22,0.1)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: 10,
                    padding: "8px 16px",
                    color: "#f97316",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MessageSquare size={12} /> Negotiate
                </button>
                <button
                  onClick={() => onAward(topRankData.proposal.id, topRankData.proposal.rfq?.id || topRankData.proposal.rfq_id)}
                  disabled={awardingProposal === topRankData.proposal.id || isProcessing}
                  style={{
                    background: (awardingProposal === topRankData.proposal.id || isProcessing) ? "#9ca3af" : "var(--huntr-orange)",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 16px",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: (awardingProposal === topRankData.proposal.id || isProcessing) ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: (awardingProposal === topRankData.proposal.id || isProcessing) ? "none" : "0 4px 12px rgba(249,115,22,0.2)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {awardingProposal === topRankData.proposal.id ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />} Award Proposal Ini
                </button>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--ui-text-secondary)", lineHeight: 1.5, borderTop: "1px solid rgba(249, 115, 22, 0.1)", paddingTop: 10 }}>
            <strong>Alasan Rekomendasi:</strong> Vendor ini menawarkan kombinasi parameter paling optimal dengan harga terendah sebesar <strong>Rp {Number(topRankData.proposal.price_offer).toLocaleString('id-ID')}</strong>, pengiriman dalam waktu <strong>{topRankData.proposal.delivery_days} hari</strong>, dan jaminan garansi <strong>{topRankData.proposal.warranty_months} bulan</strong>.
          </div>
        </div>
      )}

      {/* List Detail Perbandingan Ranking */}
      <div style={{ display: "grid", gap: 16 }}>
        {rankings.map((rankData: any, idx: number) => {
          const isWinnerOrAwarded = rankData.is_winner || rankData.proposal.winner_status === 'awarded' || rankData.proposal.winner_status === 'approved';

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "12px 16px",
                background: idx === 0 ? "rgba(249,115,22,0.04)" : "var(--ui-bg-card)",
                border: idx === 0 ? "1px solid rgba(249,115,22,0.2)" : "1px solid var(--ui-border)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: idx === 0 ? "var(--huntr-orange)" : "var(--ui-bg-input)",
                    color: idx === 0 ? "#fff" : "var(--ui-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14
                  }}>
                    #{rankData.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 15 }}>
                      {rankData.proposal.company?.name || "Unknown Vendor"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                      Tanggal Kirim: {new Date(rankData.proposal.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {canApproveOrAward && !isRfqAlreadyAwarded && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => onNegotiate(rankData.proposal)}
                        style={{
                          background: "rgba(249,115,22,0.1)",
                          border: "1px solid rgba(249,115,22,0.2)",
                          borderRadius: 10,
                          padding: "6px 12px",
                          color: "#f97316",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MessageSquare size={12} /> Negotiate
                      </button>
                      <button
                        onClick={() => onAward(rankData.proposal.id, rankData.proposal.rfq?.id || rankData.proposal.rfq_id)}
                        disabled={awardingProposal === rankData.proposal.id || isProcessing}
                        style={{
                          background: (awardingProposal === rankData.proposal.id || isProcessing) ? "#9ca3af" : (idx === 0 ? "var(--huntr-orange)" : "var(--ui-bg-input)"),
                          border: (awardingProposal === rankData.proposal.id || isProcessing) ? "none" : (idx === 0 ? "none" : "1px solid var(--ui-border)"),
                          borderRadius: 10,
                          padding: "6px 12px",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: (awardingProposal === rankData.proposal.id || isProcessing) ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.2s ease"
                        }}
                      >
                        {awardingProposal === rankData.proposal.id ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />} Award
                      </button>
                    </div>
                  )}

                  {isWinnerOrAwarded ? (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      borderRadius: 10,
                      background: "rgba(34,197,94,0.1)",
                      color: "#22c55e",
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      <CheckCircle2 size={12} /> PEMENANG (AWARDED)
                    </div>
                  ) : rankData.proposal.winner_status === 'rejected' ? (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 12px",
                      borderRadius: 10,
                      background: "rgba(239,68,68,0.06)",
                      color: "#ef4444",
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      DIELIMINASI
                    </div>
                  ) : (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 12px",
                      borderRadius: 10,
                      background: "var(--ui-bg-input)",
                      color: "var(--ui-text-secondary)",
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      PESERTA
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Stats */}
              {rankData.vendor_stats && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: 12,
                  background: "rgba(59, 130, 246, 0.05)",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(59, 130, 246, 0.1)"
                }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", display: "block" }}>TOTAL TENDER</span>
                    <strong style={{ fontSize: 14, color: "var(--ui-text-primary)" }}>{rankData.vendor_stats.total_tenders}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", display: "block" }}>TOTAL MENANG</span>
                    <strong style={{ fontSize: 14, color: "var(--ui-text-primary)" }}>{rankData.vendor_stats.total_wins}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", display: "block" }}>PERSENTASE KEMENANGAN</span>
                    <strong style={{ fontSize: 14, color: "var(--ui-text-primary)" }}>{rankData.vendor_stats.win_rate}%</strong>
                  </div>
                </div>
              )}

              {/* Kriteria Evaluasi Detail */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
                background: "var(--ui-bg-input)",
                padding: 12,
                borderRadius: 12,
                border: "1px solid var(--ui-border-subtle)",
                marginTop: 4
              }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", display: "block" }}>HARGA PENAWARAN</span>
                  <strong style={{ fontSize: 14, color: "var(--ui-text-primary)" }}>
                    Rp {Number(rankData.proposal.price_offer).toLocaleString('id-ID')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", display: "block" }}>WAKTU PENGIRIMAN</span>
                  <strong style={{ fontSize: 14, color: "var(--ui-text-primary)" }}>
                    {rankData.proposal.delivery_days} Hari
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", display: "block" }}>GARANSI</span>
                  <strong style={{ fontSize: 14, color: "var(--ui-text-primary)" }}>
                    {rankData.proposal.warranty_months} Bulan
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", display: "block" }}>DOKUMEN VENDOR</span>
                  {rankData.proposal.document_path || rankData.proposal.document_url ? (
                    <a
                      href={rankData.proposal.document_url || getAssetUrl(rankData.proposal.document_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "#fb923c",
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        marginTop: 2
                      }}
                    >
                      📄 Lihat Dokumen
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontStyle: "italic", display: "block", marginTop: 2 }}>
                      Tidak Ada
                    </span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--ui-text-muted)", lineHeight: 1.4, display: "flex", gap: 6, alignItems: "start" }}>
                <Info size={14} color="var(--ui-text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Alasan Peringkat:</strong> {rankData.detailed_reason?.summary || "Tidak ada alasan yang tersedia"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}