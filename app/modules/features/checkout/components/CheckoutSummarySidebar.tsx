import { Button as HuntrButton } from "~/shared/ui/Button";
import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  FileCheck,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { ProcurementType, ProcurementMode } from "../types";

interface CheckoutSummarySidebarProps {
  procurementType: ProcurementType;
  procurementMode?: ProcurementMode;
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
  procurementMode = "direct",
  cartTotal,
  cartLength,
  error,
  loading,
  revisionLoading,
  revisionRfqId,
  onSubmit,
}: CheckoutSummarySidebarProps) {
  const isServices = procurementType === "services";
  const isTender = procurementMode === "tender";

  return (
    <div className="space-y-4">
      <div className="sticky top-6 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-sm space-y-5 transition-colors">
        {/* Header */}
        <div className="pb-4 border-b border-[var(--ui-border)]">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[var(--ui-text-primary)] tracking-tight">
              {isServices ? "Ringkasan Anggaran Jasa" : "Ringkasan Pengadaan"}
            </h4>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isTender
                  ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              {isTender ? (
                <>
                  <Layers size={11} /> Jalur Tender
                </>
              ) : (
                <>
                  <Zap size={11} /> Pembelian Langsung
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-[var(--ui-text-muted)] mt-1">
            {isServices
              ? "Estimasi pagu anggaran dan batas atas penawaran vendor"
              : `Total pengadaan untuk ${cartLength} item terpilih`}
          </p>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between text-[var(--ui-text-secondary)]">
            <span>
              {isServices ? "Pagu Alokasi Budget" : `Total Item (${cartLength})`}
            </span>
            <span className="font-semibold text-[var(--ui-text-primary)] tabular-nums">
              IDR {cartTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--ui-text-secondary)]">
            <span className="flex items-center gap-1">
              Estimasi PPN & Pajak
              <span className="text-[10px] text-[var(--ui-text-muted)]">(Exclude)</span>
            </span>
            <span className="font-semibold text-[var(--ui-text-muted)] tabular-nums">
              IDR 0
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--ui-text-secondary)]">
            <span>Estimasi Ongkos Kirim / Delivery</span>
            <span className="text-[11px] font-medium text-emerald-500">
              {isTender ? "Ditentukan Vendor" : "Sesuai Lokasi"}
            </span>
          </div>

          {isServices && (
            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-[11px] text-[var(--ui-text-secondary)] leading-relaxed">
              <span className="font-bold text-orange-500">💡 Info Pagu Budget:</span>{" "}
              Total ini berfungsi sebagai batas atas pagu (Owner Estimate / HPS) saat proses evaluasi penawaran vendor.
            </div>
          )}

          {isTender && !isServices && (
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[11px] text-[var(--ui-text-secondary)] leading-relaxed">
              <span className="font-bold text-purple-400">⚖️ Mode Tender Terbuka:</span>{" "}
              Vendor akan bersaing mengajukan penawaran harga terbaik di bawah atau sesuai spesifikasi Anda.
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-3 border-t border-[var(--ui-border)]">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                  {isServices ? "Total Pagu Anggaran" : "Total Estimasi"}
                </span>
                <p className="text-[10px] text-[var(--ui-text-muted)]">
                  Mata Uang: IDR (Rupiah)
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-orange-500 tabular-nums tracking-tight">
                  IDR {cartTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Submit Action Button */}
        <HuntrButton
          onClick={onSubmit}
          disabled={loading || revisionLoading || !!error || cartLength === 0}
          className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Memproses Pengajuan...</span>
            </>
          ) : (
            <>
              <span>{revisionRfqId ? "Kirim Revisi PR" : "Ajukan Purchase Request"}</span>
              {revisionRfqId ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
            </>
          )}
        </HuntrButton>

        {/* Trust Badges & Notice */}
        <div className="pt-2 border-t border-[var(--ui-border)]/60 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-[var(--ui-text-muted)]">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Alur approval berjenjang otomatis sesuai SOP</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--ui-text-muted)]">
            <FileCheck size={14} className="text-blue-500 shrink-0" />
            <span>Audit trail lengkap & nomor PR resmi terintegrasi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
