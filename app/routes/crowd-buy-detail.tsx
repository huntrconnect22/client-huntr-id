import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  Truck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Share2,
  RotateCw,
  Sparkles,
  Gavel,
  Check,
  Users,
  Plus,
} from "lucide-react";
import { crowdBuyApi } from "../lib/api/crowd-buy";
import type { CrowdBuyCampaign } from "../features/crowd-buy/types";
import { CampaignProgressBar } from "../features/crowd-buy/components/CampaignProgressBar";
import { OrderModal } from "../features/crowd-buy/components/OrderModal";
import { InviteShareModal } from "../features/crowd-buy/components/InviteShareModal";
import { SupplierBiddingModal } from "../features/crowd-buy/components/SupplierBiddingModal";
import { isVendorBuyerMode } from "../lib/viewMode";
import { SessionManager } from "../lib/session";
import Swal from "sweetalert2";

export default function CrowdBuyDetailPage() {
  const { id, companySlug } = useParams<{ id: string; companySlug: string }>();
  const isVendorView = isVendorBuyerMode();
  const currentCompany = SessionManager.getCompany();
  const [campaign, setCampaign] = useState<CrowdBuyCampaign | null>(null);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);

  const reloadCampaign = () => {
    if (!id) return;
    crowdBuyApi
      .getCampaignDetail(id)
      .then((res) => {
        setCampaign(res.campaign);
        setParticipantsCount(res.participants_count || 0);
      })
      .catch((err) => {
        console.error("Failed to reload campaign", err);
      });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    crowdBuyApi
      .getCampaignDetail(id)
      .then((res) => {
        setCampaign(res.campaign);
        setParticipantsCount(res.participants_count || 0);
      })
      .catch((err) => {
        console.error("Failed to load campaign detail", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAcceptBid = async (bidId: string) => {
    if (!campaign) return;
    const result = await Swal.fire({
      title: "Terima Penawaran Supplier Ini?",
      text: "Dengan menerima penawaran ini, supplier terpilih akan menjadi pemasok resmi untuk Group Buy ini.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Terima Penawaran",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await crowdBuyApi.acceptSupplierBid(campaign.id, bidId);
        Swal.fire({
          icon: "success",
          title: "Penawaran Diterima!",
          text: "Supplier telah ditetapkan dan campaign sekarang aktif untuk proses pemesanan & pembayaran.",
          confirmButtonColor: "#f97316",
        });
        reloadCampaign();
      } catch (err: any) {
        Swal.fire("Error", err.message || "Gagal menerima penawaran.", "error");
      }
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RotateCw className="w-7 h-7 animate-spin mx-auto text-orange-500" />
        <p className="text-xs text-slate-500">Memuat detail campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-20 text-center space-y-3">
        <Package className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Campaign tidak ditemukan</h3>
        <Link
          to={`/${companySlug || ""}/crowd-buy`}
          className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const backUrl = companySlug ? `/${companySlug}/crowd-buy` : `/crowd-buy`;

  const isAutoDemand =
    campaign.campaign_type === "auto_demand_aggregation" ||
    !!campaign.is_monthly_recurring ||
    !!campaign.is_auto_demand;

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-2 md:p-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to={backUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Crowd Buy</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 md:p-6 space-y-5 shadow-xs">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded">
                    {campaign.category}
                  </span>
                  {isAutoDemand && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3" /> Rekomendasi Rutin PO (Auto)
                    </span>
                  )}
                  {campaign.creator_type === "buyer" && !isAutoDemand && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-500 text-white rounded flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Inisiasi Buyer
                    </span>
                  )}
                  {campaign.campaign_type === "collective_rfq" && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-white dark:bg-slate-700 rounded flex items-center gap-1">
                      <Gavel className="w-3 h-3" /> Collective RFQ
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    {campaign.code}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 font-semibold rounded-md transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> Undang / Bagikan
                </button>
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {campaign.title}
              </h1>

              {/* Supplier or Initiator Info */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                {campaign.campaign_type === "collective_rfq" && !campaign.supplier ? (
                  <span className="text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Diinisiasi oleh: <strong>{campaign.initiator_company?.name || "Buyer Huntr"}</strong> • Tahap Penawaran Supplier (Bidding)
                  </span>
                ) : (
                  <>
                    <span>Disediakan oleh:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {campaign.supplier?.name || "Supplier Huntr"}
                    </strong>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-label="Supplier Terverifikasi Huntr" />
                    {campaign.supplier?.city && <span>• {campaign.supplier.city}</span>}
                  </>
                )}
              </div>
            </div>

            {/* Media Image / Illustration */}
            <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
              {campaign.image_url ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <Layers className="w-10 h-10 mx-auto mb-1.5 opacity-40" />
                  <span className="text-[11px] uppercase font-bold tracking-wider">Crowd Buy Bulk Sourcing</span>
                </div>
              )}
            </div>

            {/* Delivery Schedule Banner (Setiap Tanggal 27) */}
            <div className="p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-blue-500/10 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-blue-950/20 rounded-lg border border-orange-200 dark:border-orange-800/80 flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Jadwal Pengiriman Rutin Bulanan
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded">
                    Setiap Tgl {campaign.monthly_delivery_day || 27}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Barang akan dikirim setiap <strong>tanggal {campaign.monthly_delivery_day || 27} setiap bulannya</strong> ke lokasi sesuai delivery point perusahaan Anda.
                </p>
                {campaign.historical_metrics && (
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Rata-rata volume bulanan: <strong>{campaign.historical_metrics.monthly_average_qty?.toLocaleString("id-ID") || "-"} {campaign.unit}</strong></span>
                    <span>•</span>
                    <span>Harga terendah historis: <strong className="text-emerald-600 dark:text-emerald-400">Rp {campaign.historical_metrics.lowest_historical_price?.toLocaleString("id-ID") || "-"}</strong></span>
                    <span>•</span>
                    <span>Dianalisis dari riwayat PO: <strong>{campaign.historical_metrics.buyer_companies_count || 1}+ Buyer</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Progres Target Pembelian
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  {campaign.days_remaining > 0 ? `${campaign.days_remaining} hari tersisa` : "Telah Berakhir"}
                </span>
              </div>

              <CampaignProgressBar
                current={campaign.current_quantity}
                target={campaign.target_quantity}
                max={campaign.max_quantity}
                unit={campaign.unit}
                percentage={campaign.progress_percentage}
                isTargetReached={campaign.is_target_reached}
              />

              <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                <span>Total Partisipan: <strong>{participantsCount} Perusahaan</strong></span>
                <span>MOQ per Buyer: <strong>{campaign.min_order_qty} {campaign.unit}</strong></span>
              </div>
            </div>

            {/* Price Tiers (Volume Discounts) */}
            {campaign.price_tiers && campaign.price_tiers.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Tingkatan Harga Grosir (Volume Discount Tiers)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {campaign.price_tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-md space-y-0.5"
                    >
                      <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400">
                        {tier.max_quantity
                          ? `${tier.min_quantity} - ${tier.max_quantity} ${campaign.unit}`
                          : `≥ ${tier.min_quantity} ${campaign.unit}`}
                      </span>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        Rp {Number(tier.unit_price).toLocaleString("id-ID")}
                        <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Specifications */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Deskripsi & Ketentuan Produk
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {campaign.description || "Tidak ada deskripsi tambahan dari supplier."}
              </p>
            </div>

            {/* Delivery & Return Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-100 dark:border-slate-800 space-y-1">
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-500" /> Ketentuan Pengiriman
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {campaign.delivery_terms || "Sesuai kesepakatan logistik standard."}
                </p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Lead time: {campaign.lead_time_days || 7} hari kerja setelah target terpenuhi.
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-100 dark:border-slate-800 space-y-1">
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Kebijakan Retur & Komplain
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {campaign.return_policy || "Retur diterima bila terdapat cacat produksi / kerusakan pengiriman."}
                </p>
              </div>
            </div>

            {/* Supplier Bids Section for Collective RFQ */}
            {campaign.campaign_type === "collective_rfq" && (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Gavel className="w-3.5 h-3.5 text-orange-500" />
                    Penawaran Supplier Terdaftar ({campaign.bids?.length || 0})
                  </h3>
                  {isVendorView && campaign.status === "bidding" && (
                    <button
                      onClick={() => setIsBiddingModalOpen(true)}
                      className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajukan Penawaran</span>
                    </button>
                  )}
                </div>

                {!campaign.bids || campaign.bids.length === 0 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-200/60 dark:border-slate-700/60 text-center text-xs text-slate-500">
                    Belum ada penawaran supplier yang diajukan untuk Collective RFQ ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campaign.bids.map((bid) => (
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
                            <strong className="text-slate-900 dark:text-white text-xs">
                              {bid.supplier_company?.name || "Supplier Huntr"}
                            </strong>
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" aria-label="Supplier Terverifikasi" />
                            {bid.status === "accepted" && (
                              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded flex items-center gap-1">
                                <Check className="w-3 h-3" /> Pemenang Dipilih
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            Harga Satuan:{" "}
                            <strong className="text-orange-600 dark:text-orange-400 font-semibold">
                              Rp {Number(bid.offered_unit_price).toLocaleString("id-ID")}
                            </strong>{" "}
                            / {campaign.unit} • MOQ: {bid.min_order_qty} • Lead Time: {bid.lead_time_days || 7} hari
                          </div>
                          {bid.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              "{bid.notes}"
                            </p>
                          )}
                        </div>

                        {campaign.status === "bidding" && bid.status === "pending" && (
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs transition-colors shrink-0 self-start sm:self-auto"
                          >
                            Terima Penawaran
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Card: Purchase Action */}
        <div className="space-y-3">
          <div className="sticky top-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs space-y-4">
            <div>
              <span className="text-xs text-slate-500">
                {campaign.status === "bidding" ? "Ekspektasi Target Harga:" : "Harga Dasar Satuan:"}
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                Rp {Number(campaign.base_price).toLocaleString("id-ID")}
                <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 py-2.5 border-y border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>Minimal Order (MOQ):</span>
                <strong>{campaign.min_order_qty} {campaign.unit}</strong>
              </div>
              <div className="flex justify-between">
                <span>Batas Waktu:</span>
                <strong>{new Date(campaign.ends_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="capitalize font-semibold text-emerald-600">{campaign.status}</span>
              </div>
            </div>

            {/* ── Join / Order Button ── */}
            {(() => {
              // Check if the current user is the campaign initiator
              const isInitiator =
                !!currentCompany?.id &&
                !!campaign.initiator_company_id &&
                String(currentCompany.id) === String(campaign.initiator_company_id);

              if (isInitiator) {
                return (
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-md text-center space-y-1">
                    <p className="text-xs font-bold text-orange-800 dark:text-orange-300">Anda adalah Inisiator Campaign Ini</p>
                    <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-snug">
                      Komitmen pesanan awal Anda sudah terhitung dalam progress. Bagikan link undangan untuk mengajak buyer lain bergabung.
                    </p>
                  </div>
                );
              }

              if (campaign.is_active) {
                return (
                  <button
                    onClick={() => setIsOrderModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{isAutoDemand ? "Ikut Komitmen Pengadaan Bulanan" : "Gabung Crowd Buy Sekarang"}</span>
                  </button>
                );
              }

              if (campaign.status === "bidding") {
                return (
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsOrderModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Ikut Gabung Pool Kebutuhan</span>
                    </button>

                    {isVendorView && (
                      <button
                        onClick={() => setIsBiddingModalOpen(true)}
                        className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>Ajukan Penawaran Supplier</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-md text-center text-xs text-slate-500 font-medium">
                  Campaign ini sedang tidak menerima pesanan baru.
                </div>
              );
            })()}

            <button
              onClick={handleShare}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-orange-500" />
              <span>Undang Rekan Buyer (Share Link)</span>
            </button>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Jaminan Transaksi Aman Huntr
              </div>
              <p>
                Dana Anda terlindungi. Jika campaign gagal mencapai target kuantitas hingga batas waktu, dana pesanan akan direfund 100%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isOrderModalOpen && (
        <OrderModal
          campaign={campaign}
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onOrderSuccess={() => {
            reloadCampaign();
          }}
        />
      )}

      {isShareModalOpen && (
        <InviteShareModal
          campaign={campaign}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {isBiddingModalOpen && (
        <SupplierBiddingModal
          campaign={campaign}
          onClose={() => setIsBiddingModalOpen(false)}
          onSuccess={() => {
            setIsBiddingModalOpen(false);
            Swal.fire({
              icon: "success",
              title: "Penawaran Terkirim!",
              text: "Penawaran harga Anda berhasil diajukan untuk Collective RFQ ini.",
              confirmButtonColor: "#f97316",
            });
            reloadCampaign();
          }}
        />
      )}
    </div>
  );
}
