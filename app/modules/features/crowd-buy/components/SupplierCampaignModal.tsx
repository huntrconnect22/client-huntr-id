import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, AlertCircle, Sparkles } from "lucide-react";
import type { CrowdBuyCampaign, CrowdBuyPriceTier } from "../types";
import { crowdBuyApi } from "../../../lib/api/crowd-buy";
import Swal from "sweetalert2";

interface SupplierCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  campaign?: CrowdBuyCampaign | null;
}

export const SupplierCampaignModal: React.FC<SupplierCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  campaign,
}) => {
  const [formData, setFormData] = useState({
    title: campaign?.title || "",
    category: campaign?.category || "Bahan Baku",
    unit: campaign?.unit || "pcs",
    base_price: campaign ? Number(campaign.base_price) : 0,
    target_quantity: campaign?.target_quantity || 100,
    max_quantity: campaign?.max_quantity || "",
    min_order_qty: campaign?.min_order_qty || 5,
    max_order_qty: campaign?.max_order_qty || "",
    starts_at: campaign?.starts_at ? campaign.starts_at.substring(0, 16) : new Date().toISOString().substring(0, 16),
    ends_at: campaign?.ends_at
      ? campaign.ends_at.substring(0, 16)
      : new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 16),
    lead_time_days: campaign?.lead_time_days || 7,
    description: campaign?.description || "",
    delivery_terms: campaign?.delivery_terms || "Franco Gudang Pembeli (Jabodetabek) atau Loco Gudang Supplier.",
    return_policy: campaign?.return_policy || "Retur diterima maksimal 2x24 jam setelah barang sampai bila ada cacat atau kerusakan.",
    image_path: campaign?.image_path || "",
  });

  const [priceTiers, setPriceTiers] = useState<CrowdBuyPriceTier[]>(
    campaign?.price_tiers && campaign.price_tiers.length > 0
      ? campaign.price_tiers
      : []
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const newMin = lastTier ? (lastTier.max_quantity ? lastTier.max_quantity + 1 : lastTier.min_quantity + 10) : formData.min_order_qty * 2;
    setPriceTiers([
      ...priceTiers,
      { min_quantity: newMin, max_quantity: null, unit_price: Math.round(formData.base_price * 0.95) },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index: number, field: keyof CrowdBuyPriceTier, value: any) => {
    const updated = [...priceTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPriceTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.base_price <= 0) {
      setErrorMsg("Harga dasar per unit harus lebih besar dari 0.");
      return;
    }

    if (formData.target_quantity <= 0) {
      setErrorMsg("Target kuantitas harus lebih besar dari 0.");
      return;
    }

    if (formData.max_quantity && Number(formData.max_quantity) < formData.target_quantity) {
      setErrorMsg("Batas maksimum kuantitas tidak boleh lebih kecil dari target minimum.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        ...formData,
        base_price: Number(formData.base_price),
        target_quantity: Number(formData.target_quantity),
        max_quantity: formData.max_quantity ? Number(formData.max_quantity) : null,
        min_order_qty: Number(formData.min_order_qty),
        max_order_qty: formData.max_order_qty ? Number(formData.max_order_qty) : null,
        lead_time_days: Number(formData.lead_time_days),
        price_tiers: priceTiers.length > 0 ? priceTiers : undefined,
      };

      if (campaign) {
        await crowdBuyApi.updateSupplierCampaign(campaign.id, payload);
        Swal.fire({
          title: "Berhasil",
          text: "Campaign Crowd Buy berhasil diperbarui.",
          icon: "success",
          confirmButtonColor: "#f97316",
        });
      } else {
        await crowdBuyApi.createSupplierCampaign(payload);
        Swal.fire({
          title: "Berhasil",
          text: "Draft campaign Crowd Buy berhasil dibuat. Jangan lupa ajukan untuk direview admin.",
          icon: "success",
          confirmButtonColor: "#f97316",
        });
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan campaign.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {campaign ? "Ubah Campaign Crowd Buy" : "Buat Campaign Crowd Buy Baru"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kumpulkan kebutuhan banyak buyer untuk pesanan jumlah besar & harga terbaik
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-md text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Campaign / Produk *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="misal: Minyak Goreng Sawit Curah 1000 Liter"
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              >
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Sembako">Sembako</option>
                <option value="Kemasan & Packaging">Kemasan & Packaging</option>
                <option value="F&B">F&B</option>
                <option value="ATK & Kantor">ATK & Kantor</option>
                <option value="Konstruksi & Material">Konstruksi & Material</option>
                <option value="General">Lainnya / General</option>
              </select>
            </div>
          </div>

          {/* Base Price & Unit & Lead time */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Dasar (Rp) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.base_price || ""}
                onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Satuan (Unit) *
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="pcs, box, kg"
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Time (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={formData.lead_time_days || ""}
                onChange={(e) => setFormData({ ...formData, lead_time_days: Number(e.target.value) })}
                placeholder="7"
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Target & MOQ */}
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Min. *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.target_quantity || ""}
                onChange={(e) => setFormData({ ...formData, target_quantity: Number(e.target.value) })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maks. Kuota
              </label>
              <input
                type="number"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                placeholder="Opsional"
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                MOQ / Buyer *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.min_order_qty || ""}
                onChange={(e) => setFormData({ ...formData, min_order_qty: Number(e.target.value) })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maks. / Buyer
              </label>
              <input
                type="number"
                value={formData.max_order_qty}
                onChange={(e) => setFormData({ ...formData, max_order_qty: e.target.value })}
                placeholder="Opsional"
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mulai Tayang *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Waktu *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Price Tiers (Volume Discounts) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tingkatan Harga Grosir (Volume Price Tiers)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tawarkan harga lebih murah bila volume pemesanan mencapai tier tertentu
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 border border-orange-200 dark:border-orange-800/60 rounded-md transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Tier
              </button>
            </div>

            {priceTiers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1.5">
                Belum ada tier diskon volume. Menggunakan harga dasar tunggal.
              </p>
            ) : (
              <div className="space-y-1.5">
                {priceTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-500 font-medium">Tier {idx + 1}:</span>
                    <input
                      type="number"
                      placeholder="Min Qty"
                      value={tier.min_quantity}
                      onChange={(e) => handleUpdateTier(idx, "min_quantity", Number(e.target.value))}
                      className="w-20 text-xs py-1 px-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">s/d</span>
                    <input
                      type="number"
                      placeholder="Maks (opsional)"
                      value={tier.max_quantity || ""}
                      onChange={(e) => handleUpdateTier(idx, "max_quantity", e.target.value ? Number(e.target.value) : null)}
                      className="w-24 text-xs py-1 px-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">Harga: Rp</span>
                    <input
                      type="number"
                      placeholder="Harga Satuan"
                      value={tier.unit_price}
                      onChange={(e) => handleUpdateTier(idx, "unit_price", Number(e.target.value))}
                      className="w-24 text-xs py-1 px-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description & Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deskripsi & Spesifikasi Produk
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan spesifikasi, merk, sertifikasi (Halal/BPOM/SNI), dll."
              className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ketentuan Pengiriman
              </label>
              <textarea
                rows={2}
                value={formData.delivery_terms}
                onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kebijakan Retur / Komplain
              </label>
              <textarea
                rows={2}
                value={formData.return_policy}
                onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                className="w-full text-xs py-1.5 px-2.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-1.5 px-4 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-md transition-colors"
            >
              {loading ? "Menyimpan..." : campaign ? "Simpan Perubahan" : "Simpan Draft Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


