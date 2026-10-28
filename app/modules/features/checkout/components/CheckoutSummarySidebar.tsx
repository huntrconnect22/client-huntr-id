import React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ProcurementType } from "../types";

interface CheckoutSummarySidebarProps {
  procurementType: ProcurementType;
  cartTotal: number;
  cartLength: number;
  error: string | null;
  loading: boolean;
  revisionLoading: boolean;
  revisionRfqId: string | null;
  onSubmit: () => void;
}

export function CheckoutSummarySidebar({
  procurementType,
  cartTotal,
  cartLength,
  error,
  loading,
  revisionLoading,
  revisionRfqId,
  onSubmit,
}: CheckoutSummarySidebarProps) {
  return (
    <div className="space-y-3">
      <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3 sticky top-4">
        <h4 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] pb-2 border-b border-[var(--ui-border)] flex items-center justify-between">
          <span>
            {procurementType === "services"
              ? "Ringkasan Budget Jasa"
              : "Order Summary"}
          </span>
          {procurementType === "services" && (
            <span className="text-[10px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
              Layanan Proyek
            </span>
          )}
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ui-text-muted)]">
              {procurementType === "services"
                ? "Pagu Alokasi Budget"
                : "Subtotal"}
            </span>
            <span className="font-semibold text-[var(--ui-text-primary)] tabular-nums">
              IDR {cartTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ui-text-muted)]">Tax (0%)</span>
            <span className="font-semibold text-[var(--ui-text-primary)]">
              IDR 0
            </span>
          </div>
          {procurementType === "services" && (
            <div className="text-[10px] text-[var(--ui-text-muted)] bg-orange-500/5 border border-orange-500/20 p-2 rounded-lg">
              💡 <b>Pagu Budget:</b> Menjadi batas atas (Owner Estimate / HPS)
              bagi vendor dalam mengajukan penawaran tender.
            </div>
          )}
          <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between">
            <span className="font-bold text-[var(--ui-text-primary)] uppercase">
              {procurementType === "services"
                ? "Total Pagu Anggaran"
                : "Total"}
            </span>
            <span className="text-sm font-bold text-orange-500 tabular-nums">
              IDR {cartTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={loading || revisionLoading || !!error || cartLength === 0}
          style={{ color: "white" }}
          className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              {revisionRfqId ? "Submit revised PR" : "Submit Request"}{" "}
              <CheckCircle2 size={16} />
            </>
          )}
        </button>

        <p className="text-[10px] text-[var(--ui-text-muted)] text-center leading-relaxed">
          By submitting, this request will be sent to your manager for approval
          before being published.
        </p>
      </div>
    </div>
  );
}


