import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  Search,
  CheckCircle2,
} from "lucide-react";
import { crowdBuyApi } from "../../../lib/api/crowd-buy";
import { getCatalogues } from "../../../lib/api/catalogue";
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
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string; industry_type?: string; logo_path?: string }>
  >([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [catalogueId, setCatalogueId] = useState<string | null>(null);

  // Search catalog items (optional helper)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogSearchResults, setCatalogSearchResults] = useState<any[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [showCatalogDropdown, setShowCatalogDropdown] = useState(false);
  const catalogSearchRef = useRef<HTMLDivElement>(null);

  const [basePrice, setBasePrice] = useState<number>(25000);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);
  const [priceTiers, setPriceTiers] = useState<
    Array<{ min_quantity: number; unit_price: number }>
  >([
    { min_quantity: 100, unit_price: 23500 },
    { min_quantity: 500, unit_price: 21000 },
  ]);

  // Load suppliers list on mount
  useEffect(() => {
    let mounted = true;
    setLoadingSuppliers(true);
    crowdBuyApi
      .getSuppliers()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setSuppliers(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load suppliers:", err);
      })
      .finally(() => {
        if (mounted) setLoadingSuppliers(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Close catalog search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        catalogSearchRef.current &&
        !catalogSearchRef.current.contains(e.target as Node)
      ) {
        setShowCatalogDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchCatalog = async (q: string) => {
    setCatalogSearchQuery(q);
    if (!q.trim()) {
      setCatalogSearchResults([]);
      setShowCatalogDropdown(false);
      return;
    }
    setIsSearchingCatalog(true);
    try {
      const res = await getCatalogues({ search: q.trim(), per_page: 5 });
      const items = res?.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setCatalogSearchResults(items);
      setShowCatalogDropdown(true);
    } catch {
      setCatalogSearchResults([]);
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  const handleSelectCatalogItem = (item: any) => {
    setTitle(item.name || "");
    if (item.category) setCategory(item.category);
    if (item.uom) setUnit(item.uom);
    if (item.company_id) setSupplierCompanyId(item.company_id);
    if (item.id) setCatalogueId(item.id);
    setShowCatalogDropdown(false);
    setCatalogSearchQuery(item.name || "");
  };

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

    if (activeTab === "buyer_catalog") {
      if (!supplierCompanyId) {
        setErrorMessage(
          "Silakan pilih Supplier / Vendor penyedia barang untuk inisiasi dari katalog produk. Jika Anda belum memiliki supplier tertentu, silakan beralih ke 'Opsi 2: Collective RFQ (Custom)'."
        );
        return;
      }
      if (basePrice <= 0) {
        setErrorMessage("Harga normal produk (Base Price) harus lebih besar dari 0.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (activeTab === "buyer_catalog") {
        const payload = {
          campaign_type: "buyer_catalog" as const,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          unit,
          target_quantity: Number(targetQuantity),
          min_order_qty: Number(minOrderQty) || 1,
          ends_at: endsAt,
          base_price: Number(basePrice),
          lead_time_days: Number(leadTimeDays) || 7,
          supplier_company_id: supplierCompanyId,
          catalogue_id: catalogueId || undefined,
          initial_quantity: Number(initialQuantity) || undefined,
          price_tiers: priceTiers.map((t) => ({
            min_quantity: Number(t.min_quantity),
            unit_price: Number(t.unit_price),
          })),
        };

        const res = await crowdBuyApi.createBuyerInitiative(payload);
        onSuccess(res.campaign);
      } else {
        const payload = {
          campaign_type: "collective_rfq" as const,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          unit,
          target_quantity: Number(targetQuantity),
          target_price: Number(targetPrice),
          ends_at: endsAt,
          initial_quantity: Number(initialQuantity) || undefined,
        };

        const res = await crowdBuyApi.createBuyerInitiative(payload);
        onSuccess(res.campaign);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Gagal membuat inisiasi Crowd Buy."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-orange-500 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Inisiasi Group Buying (Buyer)
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pegang kendali pengadaan — ajak sesama buyer patungan volume untuk harga terbaik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection (2 Options) */}
        <div className="px-5 pt-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-2.5 pb-3.5">
            <button
              type="button"
              onClick={() => setActiveTab("buyer_catalog")}
              className={`p-3 rounded-md border text-left transition-all flex items-start gap-2.5 ${
                activeTab === "buyer_catalog"
                  ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div
                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                  activeTab === "buyer_catalog"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold">Opsi 1: Dari Katalog Produk</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  Pilih barang dari supplier terdaftar & ajak buyer lain pesan bareng
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("collective_rfq")}
              className={`p-3 rounded-md border text-left transition-all flex items-start gap-2.5 ${
                activeTab === "collective_rfq"
                  ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div
                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                  activeTab === "collective_rfq"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold">Opsi 2: Collective RFQ (Custom)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                  Ajukan spesifikasi custom, kumpulkan volume, lalu lelang ke supplier
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Opsi 1 Specific: Supplier Selection & Catalog Picker */}
          {activeTab === "buyer_catalog" && (
            <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-lg space-y-3">
              {/* Optional Quick Catalog Search */}
              <div ref={catalogSearchRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cari dari Katalog Produk Huntr (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => handleSearchCatalog(e.target.value)}
                    placeholder="Ketik nama produk katalog untuk auto-fill data & supplier..."
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {isSearchingCatalog && (
                    <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin absolute right-2.5 top-2.5" />
                  )}
                </div>

                {showCatalogDropdown && catalogSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                    {catalogSearchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectCatalogItem(item)}
                        className="w-full p-2 text-left hover:bg-orange-50 dark:hover:bg-slate-800 border-b last:border-0 border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            Vendor: {item.company?.name || "Vendor Huntr"} • {item.category}
                          </p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 shrink-0 font-medium">
                          Pilih
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Required Supplier Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-500" />
                  Supplier / Vendor Penyedia Barang *
                </label>
                <select
                  value={supplierCompanyId}
                  onChange={(e) => setSupplierCompanyId(e.target.value)}
                  required
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                >
                  <option value="">
                    {loadingSuppliers
                      ? "Memuat daftar supplier..."
                      : "-- Pilih Supplier / Vendor Terdaftar --"}
                  </option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.industry_type ? `(${sup.industry_type})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notice helper */}
              {!supplierCompanyId && (
                <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded border border-orange-200/60 dark:border-orange-900/40">
                  <span className="shrink-0">💡</span>
                  <p className="leading-snug">
                    Belum menentukan supplier atau butuh barang custom?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("collective_rfq")}
                      className="text-orange-600 dark:text-orange-400 font-semibold underline hover:no-underline"
                    >
                      Beralih ke Opsi 2 (Collective RFQ)
                    </button>{" "}
                    agar para supplier yang mengajukan penawaran harga.
                  </p>
                </div>
              )}
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
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Produk
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Target Quantity & Deadline */}
          <div className="grid grid-cols-2 gap-3">
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
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <span className="text-[10px] text-slate-400">Total volume gabungan seluruh buyer</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Batas Waktu Pengumpulan *
              </label>
              <input
                type="date"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Opsi 1 Specific: Pricing & Supplier */}
          {activeTab === "buyer_catalog" ? (
            <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Price Tiers */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tier Diskon Volume (Makin banyak makin murah)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Tier
                  </button>
                </div>

                <div className="space-y-1.5">
                  {priceTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="text-slate-500 shrink-0 text-[11px]">Min:</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.min_quantity}
                        onChange={(e) =>
                          handleUpdateTier(idx, "min_quantity", Number(e.target.value))
                        }
                        className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs"
                      />
                      <span className="text-slate-500 shrink-0 text-[11px]">{unit}</span>
                      <span className="text-slate-500 shrink-0 text-[11px] ml-1">Harga: Rp</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.unit_price}
                        onChange={(e) =>
                          handleUpdateTier(idx, "unit_price", Number(e.target.value))
                        }
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white text-xs"
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
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ekspektasi / Target Harga Per Unit (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Supplier terdaftar akan melihat target ini dan mengajukan penawaran terbaik (bidding).
                </span>
              </div>
            </div>
          )}

          {/* Initial Order Commitment */}
          <div className="p-3.5 rounded-md bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950 dark:text-orange-200">
                Komitmen Pesanan Awal Anda ({unit})
              </span>
              <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
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
              className="w-full text-xs bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 rounded-md px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
    </div>,
    document.body
  );
};


