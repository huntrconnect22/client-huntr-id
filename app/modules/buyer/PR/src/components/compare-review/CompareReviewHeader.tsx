import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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
      <IconButton
        onClick={() => navigate(backUrl)}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2.5,
          border: 1,
          borderColor: "divider",
        }}
        aria-label="Back to Approvals"
      >
        <ArrowLeft size={20} />
      </IconButton>

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

      <Button
        variant="outlined"
        size="small"
        onClick={onRefresh}
        startIcon={<RefreshCw size={14} />}
        sx={{
          borderRadius: 2.5,
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Refresh
      </Button>
    </div>
  );
};
