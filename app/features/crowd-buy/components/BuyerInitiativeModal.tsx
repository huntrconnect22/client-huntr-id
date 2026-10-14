import React, { useState } from "react";
import {
  X,
  Users,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  FileText,
  Clock,
  ArrowRight,
  AlertCircle,
  Building2,
} from "lucide-react";
import { crowdBuyApi } from "../../../lib/api/crowd-buy";
import type { CrowdBuyCampaign, CrowdBuyPriceTier } from "../types";

interface BuyerInitiativeModalProps {
  onClose: () => void;
  onSuccess: (campaign: CrowdBuyCampaign) => void;
}

export const BuyerInitiativeModal: React.FC<BuyerInitiativeModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"buyer_catalog" | "collective_rfq">(
    "buyer_catalog"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Packaging & Logistics");
  const [unit, setUnit] = useState("pcs");
  const [targetQuantity, setTargetQuantity] = useState<number>(500);
  const [minOrderQty, setMinOrderQty] = useState<number>(10);
  const [endsAt, setEndsAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 hari default
    return d.toISOString().split("T")[0];
  });
  const [initialQuantity, setInitialQuantity] = useState<number>(50);

  // Opsi 1 Specific (Group Buy dari Katalog Supplier)
  const [supplierCompanyId, setSupplierCompanyId] = useState("");
  const [basePrice, setBasePrice] = useState<number>(25000);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [priceTiers, setPriceTiers] = useState<
    Array<{ min_quantity: number; unit_price: number }>
  >([
    { min_quantity: 100, unit_price: 23500 },
    { min_quantity: 500, unit_price: 21000 },
  ]);

  // Opsi 2 Specific (Collective RFQ / Custom Demand Pool)
  const [targetPrice, setTargetPrice] = useState<number>(20000);

  const handleAddTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1];
    const nextQty = lastTier ? lastTier.min_quantity * 2 : targetQuantity;
    const nextPrice = lastTier ? Math.round(lastTier.unit_price * 0.9) : Math.round(basePrice * 0.9);
    setPriceTiers([...priceTiers, { min_quantity: nextQty, unit_price: nextPrice }]);
  };

  const handleRemoveTier = (idx: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== idx));
  };

  const handleUpdateTier = (
    idx: number,
    field: "min_quantity" | "unit_price",
    value: number
  ) => {
    const updated = [...priceTiers];
    updated[idx][field] = value;
    setPriceTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Judul produk atau kebutuhan wajib diisi.");
      return;
    }

    if (targetQuantity <= 0) {
      setErrorMessage("Target kuantiti harus lebih besar dari 0.");
      return;
    }

    if (activeTab === "buyer_catalog" && !supplierCompanyId) {
      // Dummy / fallback supplier ID if user hasn't selected a specific UUID
      // We can prompt or pass an empty/valid fallback
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        campaign_type: activeTab,
        title,
        description,
        category,
        unit,
        target_quantity: Number(targetQuantity),
        min_order_qty: Number(minOrderQty),
        ends_at: `${endsAt} 23:59:59`,
        initial_quantity: Number(initialQuantity) || 0,
      };

      if (activeTab === "buyer_catalog") {
        payload.supplier_company_id = supplierCompanyId || "00000000-0000-0000-0000-000000000000";
        payload.base_price = Number(basePrice);
        payload.lead_time_days = Number(leadTimeDays);
        payload.price_tiers = priceTiers.filter((t) => t.min_quantity > 0 && t.unit_price > 0);
      } else {
        payload.target_price = Number(targetPrice);
      }

      const res = await crowdBuyApi.createBuyerInitiative(payload);
      onSuccess(res.campaign);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Gagal membuat inisiasi Crowd Buy."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Inisiasi Group Buying (Buyer)
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pegang kendali pengadaan — ajak sesama buyer patungan volume untuk harga terbaik
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

        {/* Tab Selection (2 Options) */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="grid grid-cols-2 gap-3 pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("buyer_catalog")}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                activeTab === "buyer_catalog"
                  ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === "buyer_catalog"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Opsi 1: Dari Katalog Produk</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Pilih barang dari supplier terdaftar & ajak buyer lain pesan bareng
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("collective_rfq")}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                activeTab === "collective_rfq"
                  ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === "collective_rfq"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Opsi 2: Collective RFQ (Custom)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Ajukan spesifikasi custom, kumpulkan volume, lalu lelang ke supplier
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === "buyer_catalog"
                ? "Nama Produk / Barang Katalog *"
                : "Nama Kebutuhan Pengadaan (Spesifikasi Barang) *"}
            </label>
            <input
              type="text"
              required
              placeholder={
                activeTab === "buyer_catalog"
                  ? "Contoh: Kardus Corrugated 20x20x10 cm Single Wall"
                  : "Contoh: Botol Plastik HDPE 500ml Tutup Segel Bening"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {activeTab === "buyer_catalog"
                ? "Catatan / Deskripsi Tambahan"
                : "Rincian Spesifikasi & Kebutuhan Teknis *"}
            </label>
            <textarea
              rows={3}
              placeholder={
                activeTab === "buyer_catalog"
                  ? "Deskripsi kondisi barang, variasi ukuran, atau ketentuan pemesanan..."
                  : "Sebutkan material, dimensi, ketebalan, toleransi, atau sertifikasi yang wajib dipenuhi supplier..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Produk
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Packaging & Logistics">Packaging & Logistics</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Chemicals">Chemicals</option>
                <option value="Office & Facility">Office & Facility</option>
                <option value="Electronic & Hardware">Electronic & Hardware</option>
                <option value="Food & Agriculture">Food & Agriculture</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Satuan Ukuran (Unit)
              </label>
              <input
                type="text"
                placeholder="pcs, box, kg, drum, pack"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Target Quantity & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Total Kuota ({unit}) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">Total volume gabungan seluruh buyer</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Waktu Pengumpulan (Deadline) *
              </label>
              <input
                type="date"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Opsi 1 Specific: Pricing & Supplier */}
          {activeTab === "buyer_catalog" ? (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Normal / Base Price (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimasi Lead Time (Hari)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Price Tiers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tier Diskon Volume (Makin banyak makin murah)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Tier
                  </button>
                </div>

                <div className="space-y-2">
                  {priceTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="text-slate-500 shrink-0 text-[11px]">Min:</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.min_quantity}
                        onChange={(e) =>
                          handleUpdateTier(idx, "min_quantity", Number(e.target.value))
                        }
                        className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                      <span className="text-slate-500 shrink-0 text-[11px]">{unit}</span>
                      <span className="text-slate-500 shrink-0 text-[11px] ml-2">Harga: Rp</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.unit_price}
                        onChange={(e) =>
                          handleUpdateTier(idx, "unit_price", Number(e.target.value))
                        }
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Opsi 2 Specific: Target Price for Collective RFQ */
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ekspektasi / Target Harga Per Unit (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Supplier terdaftar akan melihat target ini dan mengajukan penawaran terbaik (bidding).
                </span>
              </div>
            </div>
          )}

          {/* Initial Order Commitment */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Komitmen Pesanan Awal Anda ({unit})
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                Otomatis dihitung dalam progress
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Berapa kuantiti yang ingin perusahaan Anda pesan langsung sebagai inisiator?
            </p>
            <input
              type="number"
              min="1"
              value={initialQuantity}
              onChange={(e) => setInitialQuantity(Number(e.target.value))}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Mulai Inisiasi & Dapatkan Link Undangan
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
