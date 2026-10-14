import React, { useState } from "react";
import { X, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CrowdBuyOrder } from "../types";
import { crowdBuyApi } from "../../../lib/api/crowd-buy";
import Swal from "sweetalert2";

interface SupplierFulfillmentModalProps {
  order: CrowdBuyOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupplierFulfillmentModal: React.FC<SupplierFulfillmentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<"processing" | "shipped" | "delivered">("shipped");
  const [carrier, setCarrier] = useState(order.carrier || "JNE Cargo");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (status === "shipped" && (!carrier || !trackingNumber)) {
      setErrorMsg("Nama kurir dan nomor resi wajib diisi untuk status kirim.");
      return;
    }

    setLoading(true);
    try {
      await crowdBuyApi.fulfillOrder(order.id, {
        status,
        carrier: status === "shipped" ? carrier : undefined,
        tracking_number: status === "shipped" ? trackingNumber : undefined,
        notes: notes || undefined,
      });

      Swal.fire({
        icon: "success",
        title: "Pemenuhan Diperbarui!",
        text: `Status pesanan ${order.order_number} berhasil diperbarui menjadi ${status}.`,
        confirmButtonColor: "#4f46e5",
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui status pengiriman.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Fulfillment Pesanan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Order:</span>
              <strong className="text-slate-800 dark:text-slate-200">{order.order_number}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pembeli:</span>
              <span className="text-slate-800 dark:text-slate-200">{order.buyer_company?.name || "Buyer"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kuantitas:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {order.quantity} {order.campaign?.unit || "unit"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Pemenuhan *
            </label>
            <select
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="processing">Sedang Dipersiapkan / Packing (processing)</option>
              <option value="shipped">Sedang Dikirim (shipped)</option>
              <option value="delivered">Telah Diterima (delivered)</option>
            </select>
          </div>

          {status === "shipped" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kurir / Ekspedisi *
                </label>
                <input
                  type="text"
                  required
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="misal: JNE Trucking / Indah Cargo / Armada Internal"
                  className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Resi / Surat Jalan *
                </label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="misal: JNE-0982736182"
                  className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Pengiriman (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan untuk pembeli terkait proses pengiriman..."
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              {loading ? "Menyimpan..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
