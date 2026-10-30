import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React, { useState } from "react";
import { createPortal } from "react-dom";
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-orange-500 text-white flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Ajukan Penawaran Supplier
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Berikan harga grosir pabrik kompetitif untuk Collective RFQ ini
              </p>
            </div>
          </div>
          <HuntrButton
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </HuntrButton>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campaign target summary */}
          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">{campaign.title}</div>
            <div className="text-slate-500 flex items-center justify-between">
              <span>Target Volume: {campaign.target_quantity.toLocaleString()} {campaign.unit}</span>
              {campaign.target_price ? (
                <span>Ekspektasi Buyer: <strong className="text-slate-800 dark:text-slate-200">Rp {campaign.target_price.toLocaleString()}</strong></span>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Harga Penawaran Satuan (Rp / {campaign.unit}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">Rp</span>
              <HuntrInput
                type="number"
                min="1"
                required
                value={offeredUnitPrice}
                onChange={(e) => setOfferedUnitPrice(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                MOQ Penawaran ({campaign.unit})
              </label>
              <HuntrInput
                type="number"
                min="1"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Time (Hari)
              </label>
              <HuntrInput
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Penawaran / Spesifikasi Material
            </label>
            <HuntrTextarea
              rows={3}
              placeholder="Jelaskan spesifikasi material, kapasitas produksi, atau benefit penawaran Anda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <HuntrButton
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </HuntrButton>

            <HuntrButton
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Mengirimkan..." : "Kirim Penawaran"}
              <ArrowRight className="w-4 h-4" />
            </HuntrButton>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


