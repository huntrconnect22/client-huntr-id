import React, { useState } from "react";
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
        Swal.fire("Berhasil", "Campaign Crowd Buy berhasil diperbarui.", "success");
      } else {
        await crowdBuyApi.createSupplierCampaign(payload);
        Swal.fire("Berhasil", "Draft campaign Crowd Buy berhasil dibuat. Jangan lupa ajukan untuk direview admin.", "success");
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              {campaign ? "Ubah Campaign Crowd Buy" : "Buat Campaign Crowd Buy Baru"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kumpulkan kebutuhan banyak buyer untuk pesanan jumlah besar & harga terbaik
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-3 gap-3">
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
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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

          {/* Pricing & Units */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Harga Dasar Satuan (Rp) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.base_price || ""}
                onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                placeholder="15000"
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                placeholder="pcs, box, karung, kg"
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Time (Hari Kerja)
              </label>
              <input
                type="number"
                min={1}
                value={formData.lead_time_days || ""}
                onChange={(e) => setFormData({ ...formData, lead_time_days: Number(e.target.value) })}
                placeholder="7"
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Target & MOQ */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Min. Kuantitas *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.target_quantity || ""}
                onChange={(e) => setFormData({ ...formData, target_quantity: Number(e.target.value) })}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maks. Kuantitas
              </label>
              <input
                type="number"
                value={formData.max_quantity}
                onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                placeholder="Opsional"
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                MOQ per Buyer *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.min_order_qty || ""}
                onChange={(e) => setFormData({ ...formData, min_order_qty: Number(e.target.value) })}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Maks. per Buyer
              </label>
              <input
                type="number"
                value={formData.max_order_qty}
                onChange={(e) => setFormData({ ...formData, max_order_qty: e.target.value })}
                placeholder="Opsional"
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mulai Tayang *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.starts_at}
                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Waktu (Deadline) *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Price Tiers (Volume Discounts) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
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
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Tier
              </button>
            </div>

            {priceTiers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Belum ada tier diskon volume. Menggunakan harga dasar tunggal.
              </p>
            ) : (
              <div className="space-y-2">
                {priceTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xs text-slate-500 font-medium">Tier {idx + 1}:</span>
                    <input
                      type="number"
                      placeholder="Min Qty"
                      value={tier.min_quantity}
                      onChange={(e) => handleUpdateTier(idx, "min_quantity", Number(e.target.value))}
                      className="w-24 text-xs py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">s/d</span>
                    <input
                      type="number"
                      placeholder="Maks (opsional)"
                      value={tier.max_quantity || ""}
                      onChange={(e) => handleUpdateTier(idx, "max_quantity", e.target.value ? Number(e.target.value) : null)}
                      className="w-28 text-xs py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">Harga: Rp</span>
                    <input
                      type="number"
                      placeholder="Harga Satuan"
                      value={tier.unit_price}
                      onChange={(e) => handleUpdateTier(idx, "unit_price", Number(e.target.value))}
                      className="w-28 text-xs py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
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
              className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ketentuan Pengiriman
              </label>
              <textarea
                rows={2}
                value={formData.delivery_terms}
                onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                className="w-full text-xs py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer CTA */}
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
              {loading ? "Menyimpan..." : campaign ? "Simpan Perubahan" : "Simpan Draft Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
