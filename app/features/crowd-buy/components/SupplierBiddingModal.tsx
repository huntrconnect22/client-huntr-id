import React, { useState } from "react";
import { X, Gavel, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { crowdBuyApi } from "../../../lib/api/crowd-buy";
import type { CrowdBuyCampaign } from "../types";

interface SupplierBiddingModalProps {
  campaign: CrowdBuyCampaign;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierBiddingModal: React.FC<SupplierBiddingModalProps> = ({
  campaign,
  onClose,
  onSuccess,
}) => {
  const [offeredUnitPrice, setOfferedUnitPrice] = useState<number>(
    campaign.target_price || campaign.base_price || 0
  );
  const [minOrderQty, setMinOrderQty] = useState<number>(campaign.min_order_qty || 1);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(campaign.lead_time_days || 7);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (offeredUnitPrice <= 0) {
      setErrorMessage("Harga penawaran harus lebih besar dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      await crowdBuyApi.submitSupplierBid(campaign.id, {
        offered_unit_price: Number(offeredUnitPrice),
        min_order_qty: Number(minOrderQty),
        lead_time_days: Number(leadTimeDays),
        notes: notes.trim() || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Gagal mengajukan penawaran harga."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Ajukan Penawaran Supplier
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berikan harga grosir pabrik kompetitif untuk Collective RFQ ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campaign target summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">{campaign.title}</div>
            <div className="text-slate-500 flex items-center justify-between">
              <span>Target Volume: {campaign.target_quantity.toLocaleString()} {campaign.unit}</span>
              {campaign.target_price ? (
                <span>Ekspektasi Buyer: Rp {campaign.target_price.toLocaleString()}</span>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Harga Penawaran Satuan (Rp / {campaign.unit}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
              <input
                type="number"
                min="1"
                required
                value={offeredUnitPrice}
                onChange={(e) => setOfferedUnitPrice(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                MOQ Penawaran ({campaign.unit})
              </label>
              <input
                type="number"
                min="1"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Time (Hari)
              </label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Penawaran / Spesifikasi Material
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan spesifikasi material, kapasitas produksi, atau benefit penawaran Anda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Mengirimkan..." : "Kirim Penawaran"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
