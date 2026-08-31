import React from "react";
import { Calendar, MapPin, Package, CheckCircle2, Loader2 } from "lucide-react";

interface CompareReviewSummaryProps {
  request: any;
  awardedProposal: any;
  processingId: string | null;
  onApproveWinner: (proposalId: string | number) => void;
}

export const CompareReviewSummary: React.FC<CompareReviewSummaryProps> = ({
  request,
  awardedProposal,
  processingId,
  onApproveWinner,
}) => {
  const proposalId = awardedProposal?.proposal?.id || awardedProposal?.proposal_id;
  const isProcessing = processingId === String(proposalId);

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 24,
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ui-text-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Deadline
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>
            <Calendar size={16} style={{ display: "inline", marginRight: 6 }} />
            {request.deadline ? new Date(request.deadline).toLocaleDateString() : "—"}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ui-text-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Delivery Location
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>
            <MapPin size={16} style={{ display: "inline", marginRight: 6 }} />
            {request.delivery_location || "—"}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ui-text-muted)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Items
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>
            <Package size={16} style={{ display: "inline", marginRight: 6 }} />
            {request.items?.length || 0} Products
          </div>
        </div>

        {awardedProposal && (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => {
                if (proposalId) onApproveWinner(proposalId);
              }}
              disabled={isProcessing}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                background: "var(--huntr-orange)",
                border: "none",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                cursor: isProcessing ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 12px rgba(249,115,22,0.2)",
              }}
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve & Generate PO
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
