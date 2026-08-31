import React from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";

interface CompareReviewHeaderProps {
  title: string;
  onRefresh?: () => void;
  backUrl?: string;
}

export const CompareReviewHeader: React.FC<CompareReviewHeaderProps> = ({
  title,
  onRefresh = () => window.location.reload(),
  backUrl = "/approvals",
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
      <button
        onClick={() => navigate(backUrl)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)",
          color: "var(--ui-text-primary)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Back to Approvals"
      >
        <ArrowLeft size={20} />
      </button>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--ui-text-brand)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          Tender Winner Review
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 900,
            color: "var(--ui-text-primary)",
          }}
        >
          {title}
        </h1>
      </div>

      <button
        onClick={onRefresh}
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--ui-border-input)",
          color: "var(--ui-text-secondary)",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <RefreshCw size={14} /> Refresh
      </button>
    </div>
  );
};
