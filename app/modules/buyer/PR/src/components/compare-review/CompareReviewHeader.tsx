import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { ArrowLeft, RefreshCw, Printer } from "lucide-react";
import { useNavigate } from "react-router";

interface CompareReviewHeaderProps {
  title: string;
  onRefresh?: () => void;
  onPrint?: () => void;
  backUrl?: string;
}

export const CompareReviewHeader: React.FC<CompareReviewHeaderProps> = ({
  title,
  onRefresh = () => window.location.reload(),
  onPrint,
  backUrl = "/approvals",
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
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

      <div style={{ flex: 1, minWidth: 220 }}>
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
          Tender Winner Review &amp; Comparison
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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onPrint && (
          <Button
            variant="contained"
            size="small"
            onClick={onPrint}
            startIcon={<Printer size={15} />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: "none",
              background: "linear-gradient(135deg, #ef7d00 0%, #d96d00 100%)",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(239, 125, 0, 0.25)",
              "&:hover": {
                background: "#d96d00",
              },
            }}
          >
            Print Comparison Form
          </Button>
        )}

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
    </div>
  );
};
