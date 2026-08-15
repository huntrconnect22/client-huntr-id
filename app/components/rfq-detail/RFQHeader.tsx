import React from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";

const btnGhost =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors";

interface RFQHeaderProps {
  rfq: any;
  isTenderExpired: () => boolean;
  onRefresh?: () => void;
}

export function RFQHeader({ rfq, isTenderExpired, onRefresh }: RFQHeaderProps) {
  const navigate = useNavigate();
  const expired = rfq ? isTenderExpired() : false;
  const prShort = rfq?.id ? String(rfq.id).substring(0, 8).toUpperCase() : "";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={() => navigate(-1)} className={btnGhost}>
        <ArrowLeft size={14} /> Back
      </button>
      {onRefresh && (
        <button type="button" onClick={onRefresh} className={btnGhost}>
          <RefreshCw size={13} /> Refresh
        </button>
      )}
      {rfq && (
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
            #{prShort}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
              expired
                ? "bg-red-500/10 text-red-400"
                : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${expired ? "bg-red-400" : "bg-emerald-500"}`} />
            {expired ? "Closed" : "Active"}
          </span>
        </div>
      )}
    </div>
  );
}
