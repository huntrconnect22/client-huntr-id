import React from "react";
import {
  Trophy,
  DollarSign,
  Clock,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

interface VendorRankingCardProps {
  rankData: any;
  index: number;
  recommendedWinnerId?: string | null;
}

export const VendorRankingCard: React.FC<VendorRankingCardProps> = ({
  rankData,
  index,
  recommendedWinnerId,
}) => {
  const proposal = rankData.proposal || {};
  const companyName = proposal.company?.name || rankData.vendor || "Unknown Vendor";
  const isWinner =
    rankData.is_winner ||
    proposal.winner_status === "awarded" ||
    proposal.winner_status === "approved" ||
    rankData.proposal_id === recommendedWinnerId;

  return (
    <div
      style={{
        background: "var(--ui-bg-card)",
        border: isWinner ? "2px solid #22c55e" : "1px solid var(--ui-border)",
        borderRadius: 20,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: isWinner ? "rgba(34,197,94,0.1)" : "var(--ui-bg-badge)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isWinner ? "#22c55e" : "var(--ui-text-brand)",
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            {isWinner ? <Trophy size={24} /> : `#${rankData.rank || index + 1}`}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)", margin: 0 }}>
                {companyName}
              </h4>
              {isWinner && (
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#22c55e",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  WINNER
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 13,
                color: "var(--ui-text-secondary)",
                marginTop: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={16} />
                Rp {Number(proposal.price_offer || 0).toLocaleString("id-ID")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={16} />
                {proposal.delivery_days} days
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={16} />
                {proposal.warranty_months} months warranty
              </div>
            </div>
            {(proposal.document_path || proposal.document_url) && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={proposal.document_url || getAssetUrl(proposal.document_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: isWinner ? "#22c55e" : "#f97316",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <FileText size={14} /> View Vendor Document
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Score breakdown badge */}
        {rankData.total_score !== undefined && rankData.total_score !== null && (
          <div
            style={{
              textAlign: "right",
              background: isWinner ? "rgba(34,197,94,0.05)" : "var(--ui-bg-input)",
              padding: "12px 20px",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ui-text-muted)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Total Score
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: isWinner ? "#22c55e" : "var(--ui-text-primary)",
              }}
            >
              {rankData.total_score}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Analysis: Strengths, Weaknesses, Recommendation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {rankData.strengths && rankData.strengths.length > 0 && (
          <div
            style={{
              background: "rgba(34,197,94,0.05)",
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#22c55e",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle2 size={14} /> Strengths
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {rankData.strengths.map((strength: string, i: number) => (
                <li key={i} style={{ fontSize: 13, color: "var(--ui-text-primary)" }}>
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {rankData.weaknesses && rankData.weaknesses.length > 0 && (
          <div
            style={{
              background: "rgba(239,68,68,0.05)",
              padding: 16,
              borderRadius: 12,
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#ef4444",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={14} /> Weaknesses
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {rankData.weaknesses.map((weakness: string, i: number) => (
                <li key={i} style={{ fontSize: 13, color: "var(--ui-text-primary)" }}>
                  • {weakness}
                </li>
              ))}
            </ul>
          </div>
        )}

        {rankData.recommendation && (
          <div
            style={{
              background: "var(--ui-bg-input)",
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--ui-text-brand)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Lightbulb size={14} /> Recommendation
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-primary)" }}>
              {rankData.recommendation}
            </p>
          </div>
        )}

        {rankData.detailed_reason?.summary && (
          <div
            style={{
              background: "var(--ui-bg-input)",
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "var(--ui-text-brand)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <BarChart3 size={14} /> Detailed Reason
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-primary)" }}>
              {rankData.detailed_reason.summary}
            </p>
          </div>
        )}
      </div>

      {/* Score breakdown grid */}
      {rankData.score_breakdown && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "var(--ui-bg-input)",
            borderRadius: 12,
            border: "1px solid var(--ui-border)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "var(--ui-text-muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Score Breakdown
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {rankData.score_breakdown.price_score !== undefined && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Price</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>
                  {rankData.score_breakdown.price_score}
                </div>
              </div>
            )}
            {rankData.score_breakdown.delivery_score !== undefined && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Delivery</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6" }}>
                  {rankData.score_breakdown.delivery_score}
                </div>
              </div>
            )}
            {rankData.score_breakdown.warranty_score !== undefined && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Warranty</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#8b5cf6" }}>
                  {rankData.score_breakdown.warranty_score}
                </div>
              </div>
            )}
            {rankData.score_breakdown.completeness_score !== undefined && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 4 }}>Completeness</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>
                  {rankData.score_breakdown.completeness_score}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
