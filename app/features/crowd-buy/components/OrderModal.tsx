import React, { useState } from "react";
import { X, ShoppingBag, ShieldCheck, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CrowdBuyCampaign, CrowdBuyShippingAddress } from "../types";
import { crowdBuyApi } from "../../../lib/api/crowd-buy";
import { SessionManager } from "../../../lib/session";
import Swal from "sweetalert2";

interface OrderModalProps {
  campaign: CrowdBuyCampaign;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const currentCompany = SessionManager.getCompany();
  const isInitiator =
    !!currentCompany?.id &&
    !!campaign.initiator_company_id &&
    String(currentCompany.id) === String(campaign.initiator_company_id);

  const [quantity, setQuantity] = useState<number>(campaign.min_order_qty || 1);
  const [address, setAddress] = useState<CrowdBuyShippingAddress>({
    recipient_name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  if (isInitiator) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
        <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Anda Adalah Inisiator Campaign Ini
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sebagai inisiator/pembuat campaign, kuantitas awal Anda sudah otomatis terhitung ke dalam pool. Anda tidak dapat melakukan order tambahan ke campaign milik sendiri.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Determine active unit price based on tiers
  const getUnitPriceForQty = (qty: number): number => {
    if (!campaign.price_tiers || campaign.price_tiers.length === 0) {
      return Number(campaign.base_price);
    }
    const matchingTier = campaign.price_tiers.find(
      (t) =>
        qty >= t.min_quantity &&
        (!t.max_quantity || qty <= t.max_quantity)
    );
    return matchingTier ? Number(matchingTier.unit_price) : Number(campaign.base_price);
  };

  const currentUnitPrice = getUnitPriceForQty(quantity);
  const subtotal = currentUnitPrice * quantity;
  const total = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (quantity < campaign.min_order_qty) {
      setErrorMsg(`Kuantitas minimal adalah ${campaign.min_order_qty} ${campaign.unit}`);
      return;
    }

    if (campaign.max_order_qty && quantity > campaign.max_order_qty) {
      setErrorMsg(`Kuantitas maksimal per pesanan adalah ${campaign.max_order_qty} ${campaign.unit}`);
      return;
    }

    if (!address.recipient_name || !address.phone || !address.address || !address.city) {
      setErrorMsg("Mohon lengkapi seluruh field alamat pengiriman wajib.");
      return;
    }

    setLoading(true);
    try {
      const res = await crowdBuyApi.createOrder(campaign.id, {
        quantity,
        shipping_address: address,
        notes: notes || undefined,
      });

      Swal.fire({
        icon: "success",
        title: "Order Berhasil Dibuat!",
        text: `Nomor order Anda: ${res.order.order_number}. Anda dapat menyelesaikan pembayaran melalui menu Pesanan Saya.`,
        confirmButtonText: "Lihat Pesanan",
        confirmButtonColor: "#f97316",
      }).then(() => {
        onClose();
        if (onOrderSuccess) onOrderSuccess();
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat order. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Gabung Crowd Buy
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {campaign.code} • {campaign.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-md border border-slate-100 dark:border-slate-800 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-md bg-slate-200 dark:bg-slate-700 shrink-0 overflow-hidden">
              {campaign.image_url ? (
                <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                  CBC
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                {campaign.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                MOQ: {campaign.min_order_qty} {campaign.unit} • Supplier: {campaign.supplier?.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  Rp {currentUnitPrice.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] text-slate-500">/ {campaign.unit}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kuantitas Pemesanan ({campaign.unit})
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(campaign.min_order_qty, prev - 1))}
                className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              >
                -
              </button>
              <input
                type="number"
                min={campaign.min_order_qty}
                max={campaign.max_order_qty || undefined}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-24 text-center py-1.5 px-2 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              >
                +
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                Min. {campaign.min_order_qty} {campaign.unit}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-orange-500" />
              Alamat Pengiriman
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nama Penerima *
                </label>
                <input
                  type="text"
                  required
                  value={address.recipient_name}
                  onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
                  placeholder="Nama PIC / Penerima"
                  className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nomor HP / WA *
                </label>
                <input
                  type="tel"
                  required
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  placeholder="08123456789"
                  className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Alamat Lengkap Gudang / Toko *
              </label>
              <textarea
                required
                rows={2}
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                placeholder="Jl. Nama Jalan, No. Bangunan, RT/RW, Kelurahan, Kecamatan"
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="misal: Jakarta Barat"
                  className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Catatan untuk Supplier (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="misal: packing pallet kayu"
                  className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-900/50 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Subtotal ({quantity} {campaign.unit} × Rp {currentUnitPrice.toLocaleString("id-ID")})</span>
              <span className="font-medium text-slate-900 dark:text-white">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Estimasi Biaya Kirim</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Berdasarkan kesepakatan</span>
            </div>
            <div className="pt-1.5 border-t border-orange-200/60 dark:border-orange-900/80 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Total Pembayaran</span>
              <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-2 px-3 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? "Memproses..." : "Konfirmasi & Buat Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
