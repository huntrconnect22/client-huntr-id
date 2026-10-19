import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Users,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  Building2,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Share2,
  Gavel,
  Check,
} from "lucide-react";
import { crowdBuyApi, type PaginatedResponse } from "../lib/api/crowd-buy";
import type { CrowdBuyCampaign, CrowdBuyOrder, CrowdBuyBid } from "../features/crowd-buy/types";
import { CampaignCard } from "../features/crowd-buy/components/CampaignCard";
import { OrderModal } from "../features/crowd-buy/components/OrderModal";
import { SupplierCampaignModal } from "../features/crowd-buy/components/SupplierCampaignModal";
import { SupplierFulfillmentModal } from "../features/crowd-buy/components/SupplierFulfillmentModal";
import { BuyerInitiativeModal } from "../features/crowd-buy/components/BuyerInitiativeModal";
import { InviteShareModal } from "../features/crowd-buy/components/InviteShareModal";
import { SupplierBiddingModal } from "../features/crowd-buy/components/SupplierBiddingModal";
import { isVendorBuyerMode } from "../lib/viewMode";
import { SessionManager } from "../lib/session";
import Swal from "sweetalert2";

export default function CrowdBuyPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const isVendorView = isVendorBuyerMode();

  // Active Tab: 'catalog' | 'initiatives' | 'my-orders' | 'supplier'
  const [activeTab, setActiveTab] = useState<string>("catalog");

  // Catalog State
  const [campaigns, setCampaigns] = useState<CrowdBuyCampaign[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("ending_soonest");
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Buyer Initiatives State
  const [myInitiatives, setMyInitiatives] = useState<CrowdBuyCampaign[]>([]);
  const [loadingInitiatives, setLoadingInitiatives] = useState(false);

  // Buyer Orders State
  const [myOrders, setMyOrders] = useState<CrowdBuyOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Supplier Campaigns & Orders State
  const [supplierCampaigns, setSupplierCampaigns] = useState<CrowdBuyCampaign[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<CrowdBuyOrder[]>([]);
  const [loadingSupplier, setLoadingSupplier] = useState(false);

  // Modals
  const [selectedCampaignForOrder, setSelectedCampaignForOrder] = useState<CrowdBuyCampaign | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const [selectedCampaignForShare, setSelectedCampaignForShare] = useState<CrowdBuyCampaign | null>(null);
  const [selectedCampaignForBid, setSelectedCampaignForBid] = useState<CrowdBuyCampaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CrowdBuyCampaign | null>(null);
  const [fulfillingOrder, setFulfillingOrder] = useState<CrowdBuyOrder | null>(null);

  // Fetch Public Catalog
  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const res = await crowdBuyApi.getPublicCampaigns({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        search: searchQuery || undefined,
        sort: sortBy,
      });

      let data = res.data || [];
      if (campaignTypeFilter === "auto_demand") {
        data = data.filter((c) => c.campaign_type === "auto_demand_aggregation" || c.is_monthly_recurring || c.is_auto_demand);
      } else if (campaignTypeFilter === "supplier_promo") {
        data = data.filter((c) => (!c.creator_type || c.creator_type === "supplier") && c.campaign_type !== "auto_demand_aggregation");
      } else if (campaignTypeFilter === "buyer_catalog") {
        data = data.filter((c) => c.campaign_type === "buyer_catalog");
      } else if (campaignTypeFilter === "collective_rfq") {
        data = data.filter((c) => c.campaign_type === "collective_rfq");
      }

      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Fetch Categories
  useEffect(() => {
    crowdBuyApi.getCategories().then((cats) => setCategories(cats)).catch(() => {});
  }, []);

  // Fetch on Filter Change
  useEffect(() => {
    if (activeTab === "catalog") {
      loadCatalog();
    } else if (activeTab === "initiatives") {
      loadBuyerInitiatives();
    } else if (activeTab === "my-orders") {
      loadMyOrders();
    } else if (activeTab === "supplier") {
      loadSupplierData();
    }
  }, [activeTab, selectedCategory, campaignTypeFilter, sortBy]);

  const loadBuyerInitiatives = async () => {
    setLoadingInitiatives(true);
    try {
      const res = await crowdBuyApi.getBuyerInitiatives();
      setMyInitiatives(res.data || []);
    } catch (err) {
      console.error("Failed to load buyer initiatives", err);
    } finally {
      setLoadingInitiatives(false);
    }
  };

  const loadMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await crowdBuyApi.getBuyerOrders();
      setMyOrders(res.data || []);
    } catch (err) {
      console.error("Failed to load buyer orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadSupplierData = async () => {
    setLoadingSupplier(true);
    try {
      const [campRes, ordRes] = await Promise.all([
        crowdBuyApi.getSupplierCampaigns(),
        crowdBuyApi.getSupplierOrders(),
      ]);
      setSupplierCampaigns(campRes.data || []);
      setSupplierOrders(ordRes.data || []);
    } catch (err) {
      console.error("Failed to load supplier data", err);
    } finally {
      setLoadingSupplier(false);
    }
  };

  const handleAcceptBid = async (campaignId: string, bidId: string) => {
    const result = await Swal.fire({
      title: "Terima Penawaran Supplier Ini?",
      text: "Dengan menerima penawaran ini, supplier terpilih akan menjadi pemasok resmi untuk Group Buy ini dan harga dasar akan diperbarui.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Terima Penawaran",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await crowdBuyApi.acceptSupplierBid(campaignId, bidId);
        Swal.fire({
          icon: "success",
          title: "Penawaran Diterima!",
          text: "Supplier telah ditetapkan dan campaign sekarang aktif untuk proses pemesanan & pembayaran.",
          confirmButtonColor: "#f97316",
        });
        loadBuyerInitiatives();
        loadCatalog();
      } catch (err: any) {
        Swal.fire("Error", err.message || "Gagal menerima penawaran.", "error");
      }
    }
  };

  const handleSimulatePayment = async (orderId: string) => {
    try {
      await crowdBuyApi.simulatePayOrder(orderId);
      Swal.fire({
        icon: "success",
        title: "Pembayaran Dikonfirmasi!",
        text: "Pesanan Crowd Buy Anda berhasil dibayar dan kuantitas telah ditambahkan ke progres campaign.",
        confirmButtonColor: "#f97316",
      });
      loadMyOrders();
    } catch (err: any) {
      Swal.fire("Error", err.message || "Gagal memproses pembayaran.", "error");
    }
  };

  const handleSubmitForReview = async (campaignId: string) => {
    try {
      await crowdBuyApi.submitSupplierCampaign(campaignId);
      Swal.fire({
        icon: "success",
        title: "Diajukan untuk Review",
        text: "Campaign Anda telah dikirim ke tim admin Huntr untuk disetujui.",
        confirmButtonColor: "#f97316",
      });
      loadSupplierData();
    } catch (err: any) {
      Swal.fire("Error", err.message || "Gagal mengajukan campaign.", "error");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in p-2 md:p-6 max-w-7xl mx-auto">
      {/* Flat Hero Banner */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>Huntr Crowd Buying & Bulk Procurement</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Beli Grosir Bareng, <span className="text-orange-600 dark:text-orange-500">Harga Jauh Lebih Murah</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Gabungkan kebutuhan pengadaan bahan baku bersama pelaku bisnis lain. Capai target volume untuk mengunci diskon grosir pabrik secara otomatis dan transparan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsBuyerModalOpen(true)}
              className="py-2 px-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mulai Inisiasi Group Buy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-2">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "catalog"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Katalog Campaign</span>
          </button>

          <button
            onClick={() => setActiveTab("initiatives")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "initiatives"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Inisiasi Saya</span>
            {myInitiatives.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded font-bold">
                {myInitiatives.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("my-orders")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === "my-orders"
                ? "border-orange-500 text-orange-600 dark:text-orange-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pesanan Saya</span>
            {myOrders.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded font-bold">
                {myOrders.length}
              </span>
            )}
          </button>

          {isVendorView && (
            <button
              onClick={() => setActiveTab("supplier")}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === "supplier"
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Kelola Campaign (Supplier)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pb-2 sm:pb-0">
          {activeTab === "supplier" && (
            <button
              onClick={() => {
                setEditingCampaign(null);
                setIsSupplierModalOpen(true);
              }}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Promo Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: CATALOGUE ─────────────────────────────────────────────── */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk / bahan baku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadCatalog()}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Category Select & Sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500"
              >
                <option value="ending_soonest">Berakhir Segera</option>
                <option value="highest_progress">Progres Tertinggi</option>
                <option value="price_low_high">Harga Terendah</option>
                <option value="price_high_low">Harga Tertinggi</option>
                <option value="newest">Terbaru</option>
              </select>
            </div>
          </div>

          {/* Campaign Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "Semua Tipe" },
              { id: "auto_demand", label: "🤖 Rekomendasi Rutin PO (Auto)" },
              { id: "supplier_promo", label: "Promo Supplier" },
              { id: "buyer_catalog", label: "Group Buy Buyer" },
              { id: "collective_rfq", label: "Collective RFQ (Lelang)" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setCampaignTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                  campaignTypeFilter === t.id
                    ? "bg-orange-500 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Automated Demand Aggregation Callout Banner */}
          <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-orange-500/10 to-amber-500/10 dark:from-blue-950/40 dark:via-orange-950/30 dark:to-amber-950/20 rounded-lg border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pengumpulan Permintaan Otomatis (Algoritma Riwayat PO)
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded">
                    Pengiriman Serentak Setiap Tgl 27 / Bulan
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                  Algoritma HUNTR secara otomatis menganalisis riwayat PO seluruh buyer untuk mengidentifikasi kebutuhan rutin bulanan dengan <strong>harga historis terendah</strong>. Anda cukup klik <strong>Ikut Komitmen</strong> dan tentukan kuantitas bulanan perusahaan. Barang dikirim setiap tanggal 27 setiap bulannya ke lokasi delivery point.
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Grid */}
          {loadingCatalog ? (
            <div className="py-20 text-center space-y-3">
              <RotateCw className="w-7 h-7 animate-spin mx-auto text-orange-500" />
              <p className="text-xs text-slate-500">Memuat campaign Crowd Buy aktif...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Tidak ada campaign ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Belum ada campaign Crowd Buy aktif untuk kategori atau kata kunci yang Anda cari.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {campaigns.map((camp) => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  companySlug={companySlug}
                  onJoinClick={(c) => {
                    const currentCompany = SessionManager.getCompany();
                    if (
                      currentCompany?.id &&
                      c.initiator_company_id &&
                      String(currentCompany.id) === String(c.initiator_company_id)
                    ) {
                      Swal.fire({
                        icon: "info",
                        title: "Inisiator Campaign",
                        text: "Anda adalah pembuat campaign ini. Kebutuhan awal Anda sudah tercatat otomatis.",
                        confirmButtonColor: "#f97316",
                      });
                      return;
                    }
                    setSelectedCampaignForOrder(c);
                  }}
                  onShareClick={(c) => setSelectedCampaignForShare(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: BUYER INITIATIVES (INISIASI SAYA) ───────────────────────── */}
      {activeTab === "initiatives" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                Inisiasi Group Buying & Collective RFQ Saya
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola group buying yang Anda inisiasi dan pantau penawaran masuk dari para supplier
              </p>
            </div>

            <button
              onClick={() => setIsBuyerModalOpen(true)}
              className="py-1.5 px-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Inisiasi Kebutuhan Baru</span>
            </button>
          </div>

          {loadingInitiatives ? (
            <div className="py-20 text-center space-y-3">
              <RotateCw className="w-7 h-7 animate-spin mx-auto text-orange-500" />
              <p className="text-xs text-slate-500">Memuat inisiasi Anda...</p>
            </div>
          ) : myInitiatives.length === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-3">
              <Sparkles className="w-8 h-8 text-orange-400 mx-auto" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                Belum ada inisiasi yang Anda buat
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Anda bisa memulai Group Buying dari produk katalog supplier yang sudah ada, atau membuat Collective RFQ untuk spesifikasi barang custom dan mengundang rekan usaha lain.
              </p>
              <button
                onClick={() => setIsBuyerModalOpen(true)}
                className="mt-1 py-1.5 px-3.5 text-xs font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
              >
                Mulai Inisiasi Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myInitiatives.map((camp) => {
                const isRfq = camp.campaign_type === "collective_rfq";
                const bids = camp.bids || [];

                return (
                  <div
                    key={camp.id}
                    className="p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-3"
                  >
                    {/* Top Row: Code, Badges, Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {camp.code}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          isRfq
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                            : "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}>
                          {isRfq ? "Collective RFQ" : "Group Buy Katalog"}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                          camp.status === "active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : camp.status === "bidding"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {camp.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCampaignForShare(camp)}
                          className="py-1 px-2.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Undang Buyer Lain</span>
                        </button>

                        <Link
                          to={companySlug ? `/${companySlug}/crowd-buy/${camp.id}` : `/crowd-buy/p/${camp.id}`}
                          className="py-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-md text-xs font-medium transition-colors"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {camp.title}
                      </h4>
                      {camp.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {camp.description}
                        </p>
                      )}
                    </div>

                    {/* Stats & Progress */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Terkumpul / Target:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {camp.current_quantity} / {camp.target_quantity} {camp.unit}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Progres Kuota:</span>
                        <strong className="text-orange-600 dark:text-orange-400">
                          {camp.progress_percentage}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">
                          {isRfq ? "Ekspektasi Harga:" : "Harga Satuan:"}
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          Rp {Number(camp.base_price).toLocaleString("id-ID")}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Sisa Waktu:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {camp.days_remaining > 0 ? `${camp.days_remaining} hari` : "Berakhir"}
                        </strong>
                      </div>
                    </div>

                    {/* Supplier Bids Section (For Collective RFQ) */}
                    {isRfq && (
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Gavel className="w-3.5 h-3.5 text-orange-500" />
                            Penawaran Supplier ({bids.length} masuk)
                          </span>
                        </div>

                        {bids.length === 0 ? (
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-md text-center text-xs text-slate-500">
                            Belum ada penawaran supplier yang masuk. Penawaran akan muncul di sini saat supplier mengajukan bidding.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {bids.map((bid) => (
                              <div
                                key={bid.id}
                                className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
                                  bid.status === "accepted"
                                    ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800"
                                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-slate-900 dark:text-white">
                                      {bid.supplier_company?.name || "Supplier Huntr"}
                                    </strong>
                                    {bid.status === "accepted" && (
                                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Pemenang Dipilih
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-600 dark:text-slate-300">
                                    Harga Ditawarkan:{" "}
                                    <strong className="text-orange-600 dark:text-orange-400 font-semibold">
                                      Rp {Number(bid.offered_unit_price).toLocaleString("id-ID")}
                                    </strong>{" "}
                                    / {camp.unit} • MOQ: {bid.min_order_qty} • Lead Time: {bid.lead_time_days || 7} hari
                                  </div>
                                  {bid.notes && (
                                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                                      "{bid.notes}"
                                    </p>
                                  )}
                                </div>

                                {camp.status === "bidding" && bid.status === "pending" && (
                                  <button
                                    onClick={() => handleAcceptBid(camp.id, bid.id)}
                                    className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs transition-all shrink-0 self-start sm:self-auto"
                                  >
                                    Terima Penawaran Ini
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BUYER ORDERS ──────────────────────────────────────────── */}
      {activeTab === "my-orders" && (
        <div className="space-y-3">
          {loadingOrders ? (
            <div className="py-20 text-center space-y-3">
              <RotateCw className="w-7 h-7 animate-spin mx-auto text-orange-500" />
              <p className="text-xs text-slate-500">Memuat pesanan Anda...</p>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-3">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Belum ada pesanan Crowd Buy</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Temukan bahan baku grosir yang Anda butuhkan dan gabung campaign sekarang.
              </p>
              <button
                onClick={() => setActiveTab("catalog")}
                className="mt-1 py-1.5 px-3.5 text-xs font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
              >
                Jelajahi Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {ord.order_number}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        ord.status === "paid" || ord.status === "processing"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                          : ord.status === "shipped"
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200"
                          : ord.status === "delivered"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200"
                          : ord.status === "pending_payment"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200"
                      }`}>
                        {ord.status.toUpperCase().replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                      {ord.campaign?.title || "Campaign Item"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Jumlah: <strong className="text-slate-800 dark:text-slate-200">{ord.quantity} {ord.campaign?.unit || "unit"}</strong> • Total: <strong className="text-orange-600 dark:text-orange-400 font-semibold">Rp {Number(ord.total_amount).toLocaleString("id-ID")}</strong>
                    </p>

                    {ord.tracking_number && (
                      <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-md w-fit">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Resi: {ord.carrier} - <strong>{ord.tracking_number}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ord.status === "pending_payment" && (
                      <button
                        onClick={() => handleSimulatePayment(ord.id)}
                        className="py-1.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang (Simulasi)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: SUPPLIER WORKSPACE ────────────────────────────────────── */}
      {activeTab === "supplier" && (
        <div className="space-y-4">
          {/* Supplier Campaign List */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Campaign Milik Saya</h3>
            {loadingSupplier ? (
              <p className="text-xs text-slate-500 py-6 text-center">Memuat data supplier...</p>
            ) : supplierCampaigns.length === 0 ? (
              <div className="py-10 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-2">
                <p className="text-xs text-slate-500">Anda belum memiliki campaign Crowd Buy.</p>
                <button
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="py-1.5 px-3.5 text-xs font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Buat Campaign Pertama Anda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {supplierCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{camp.code}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {camp.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {camp.title}
                    </h4>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>Target: {camp.current_quantity} / {camp.target_quantity} {camp.unit} ({camp.progress_percentage}%)</div>
                      <div>Harga: Rp {Number(camp.base_price).toLocaleString("id-ID")} / {camp.unit}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      {camp.status === "draft" && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCampaign(camp);
                              setIsSupplierModalOpen(true);
                            }}
                            className="flex-1 py-1 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSubmitForReview(camp.id)}
                            className="flex-1 py-1 px-3 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
                          >
                            Ajukan Review
                          </button>
                        </>
                      )}
                      {camp.status === "pending_review" && (
                        <span className="text-xs text-amber-600 font-medium italic">
                          Menunggu review admin Huntr
                        </span>
                      )}
                      {camp.status === "active" && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Sedang aktif berjalan
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Orders for Fulfillment */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pesanan Masuk & Pengiriman</h3>
            {supplierOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Belum ada pesanan masuk untuk campaign Anda.</p>
            ) : (
              <div className="space-y-2">
                {supplierOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs text-slate-900 dark:text-white">{ord.order_number}</span>
                        <span className="text-xs text-slate-500">• {ord.buyer_company?.name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ord.quantity} {ord.campaign?.unit || "unit"} • Total: Rp {Number(ord.total_amount).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <button
                      onClick={() => setFulfillingOrder(ord)}
                      className="py-1 px-3 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Update Pengiriman</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedCampaignForOrder && (
        <OrderModal
          campaign={selectedCampaignForOrder}
          isOpen={!!selectedCampaignForOrder}
          onClose={() => setSelectedCampaignForOrder(null)}
          onOrderSuccess={() => {
            loadCatalog();
            loadMyOrders();
          }}
        />
      )}

      {isBuyerModalOpen && (
        <BuyerInitiativeModal
          onClose={() => setIsBuyerModalOpen(false)}
          onSuccess={(newCampaign) => {
            setIsBuyerModalOpen(false);
            Swal.fire({
              icon: "success",
              title: "Inisiasi Berhasil Dibuat!",
              text: "Inisiasi Group Buying Anda sekarang aktif. Bagikan link undangan ke rekan bisnis Anda untuk mulai mengumpulkan volume.",
              confirmButtonColor: "#f97316",
            });
            loadBuyerInitiatives();
            loadCatalog();
            setSelectedCampaignForShare(newCampaign);
          }}
        />
      )}

      {selectedCampaignForShare && (
        <InviteShareModal
          campaign={selectedCampaignForShare}
          onClose={() => setSelectedCampaignForShare(null)}
        />
      )}

      {selectedCampaignForBid && (
        <SupplierBiddingModal
          campaign={selectedCampaignForBid}
          onClose={() => setSelectedCampaignForBid(null)}
          onSuccess={() => {
            setSelectedCampaignForBid(null);
            Swal.fire({
              icon: "success",
              title: "Penawaran Terkirim!",
              text: "Penawaran harga Anda telah diajukan ke inisiator Collective RFQ.",
              confirmButtonColor: "#f97316",
            });
            loadCatalog();
            loadSupplierData();
          }}
        />
      )}

      {isSupplierModalOpen && (
        <SupplierCampaignModal
          isOpen={isSupplierModalOpen}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingCampaign(null);
          }}
          campaign={editingCampaign}
          onSuccess={loadSupplierData}
        />
      )}

      {fulfillingOrder && (
        <SupplierFulfillmentModal
          order={fulfillingOrder}
          isOpen={!!fulfillingOrder}
          onClose={() => setFulfillingOrder(null)}
          onSuccess={loadSupplierData}
        />
      )}
    </div>
  );
}
