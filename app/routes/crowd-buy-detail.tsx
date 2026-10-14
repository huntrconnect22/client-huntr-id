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
import Swal from "sweetalert2";

export default function CrowdBuyDetailPage() {
  const { id, companySlug } = useParams<{ id: string; companySlug: string }>();
  const isVendorView = isVendorBuyerMode();
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
      confirmButtonColor: "#4f46e5",
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
          confirmButtonColor: "#4f46e5",
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
        <RotateCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-xs text-slate-500">Memuat detail campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-24 text-center space-y-3">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Campaign tidak ditemukan</h3>
        <Link
          to={`/${companySlug || ""}/crowd-buy`}
          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const backUrl = companySlug ? `/${companySlug}/crowd-buy` : `/crowd-buy`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3 md:p-6 animate-fade-in">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Hero Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs p-6 md:p-8 space-y-6">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full">
                    {campaign.category}
                  </span>
                  {campaign.creator_type === "buyer" && (
                    <span className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-white rounded-full flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" /> Inisiasi Buyer
                    </span>
                  )}
                  {campaign.campaign_type === "collective_rfq" && (
                    <span className="px-2.5 py-1 text-xs font-bold bg-purple-600 text-white rounded-full flex items-center gap-1 shadow-xs">
                      <Gavel className="w-3.5 h-3.5" /> Collective RFQ
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    {campaign.code}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" /> Undang / Bagikan
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {campaign.title}
              </h1>

              {/* Supplier or Initiator Info */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
                {campaign.campaign_type === "collective_rfq" && !campaign.supplier ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Diinisiasi oleh: <strong>{campaign.initiator_company?.name || "Buyer Huntr"}</strong> • Tahap Penawaran Supplier (Bidding)
                  </span>
                ) : (
                  <>
                    <span>Disediakan oleh:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {campaign.supplier?.name || "Supplier Huntr"}
                    </strong>
                    <ShieldCheck className="w-4 h-4 text-indigo-600" aria-label="Supplier Terverifikasi Huntr" />
                    {campaign.supplier?.city && <span>• {campaign.supplier.city}</span>}
                  </>
                )}
              </div>
            </div>

            {/* Media Image / Illustration */}
            <div className="w-full h-72 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {campaign.image_url ? (
                <img
                  src={campaign.image_url}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <span className="text-xs uppercase font-bold tracking-wider">Crowd Buy Bulk Sourcing</span>
                </div>
              )}
            </div>

            {/* Progress Section */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Progres Target Pembelian
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
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

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Total Partisipan: <strong>{participantsCount} Perusahaan</strong></span>
                <span>MOQ per Buyer: <strong>{campaign.min_order_qty} {campaign.unit}</strong></span>
              </div>
            </div>

            {/* Price Tiers (Volume Discounts) */}
            {campaign.price_tiers && campaign.price_tiers.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tingkatan Harga Grosir (Volume Discount Tiers)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {campaign.price_tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1"
                    >
                      <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        {tier.max_quantity
                          ? `${tier.min_quantity} - ${tier.max_quantity} ${campaign.unit}`
                          : `≥ ${tier.min_quantity} ${campaign.unit}`}
                      </span>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white">
                        Rp {Number(tier.unit_price).toLocaleString("id-ID")}
                        <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Specifications */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Deskripsi & Ketentuan Produk
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {campaign.description || "Tidak ada deskripsi tambahan dari supplier."}
              </p>
            </div>

            {/* Delivery & Return Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5">
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-600" /> Ketentuan Pengiriman
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {campaign.delivery_terms || "Sesuai kesepakatan logistik standard."}
                </p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Lead time: {campaign.lead_time_days || 7} hari kerja setelah target terpenuhi.
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5">
                <h4 className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Kebijakan Retur & Komplain
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {campaign.return_policy || "Retur diterima bila terdapat cacat produksi / kerusakan pengiriman."}
                </p>
              </div>
            </div>
            {/* Supplier Bids Section for Collective RFQ */}
            {campaign.campaign_type === "collective_rfq" && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-indigo-600" />
                    Penawaran Supplier Terdaftar ({campaign.bids?.length || 0})
                  </h3>
                  {isVendorView && campaign.status === "bidding" && (
                    <button
                      onClick={() => setIsBiddingModalOpen(true)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajukan Penawaran</span>
                    </button>
                  )}
                </div>

                {!campaign.bids || campaign.bids.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-center text-xs text-slate-500">
                    Belum ada penawaran supplier yang diajukan untuk Collective RFQ ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {campaign.bids.map((bid) => (
                      <div
                        key={bid.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                          bid.status === "accepted"
                            ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800"
                            : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 dark:text-white text-sm">
                              {bid.supplier_company?.name || "Supplier Huntr"}
                            </strong>
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-label="Supplier Terverifikasi" />
                            {bid.status === "accepted" && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Pemenang Dipilih
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            Harga Satuan:{" "}
                            <strong className="text-indigo-600 dark:text-indigo-400 text-sm">
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
                            className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all shadow-xs shrink-0 self-start sm:self-auto"
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
        <div className="space-y-4">
          <div className="sticky top-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs text-slate-500">
                {campaign.status === "bidding" ? "Ekspektasi Target Harga:" : "Harga Dasar Satuan:"}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Rp {Number(campaign.base_price).toLocaleString("id-ID")}
                <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 py-3 border-y border-slate-100 dark:border-slate-800">
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

            {campaign.is_active ? (
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Gabung Crowd Buy Sekarang</span>
              </button>
            ) : campaign.status === "bidding" ? (
              <div className="space-y-2">
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Ikut Gabung Pool Kebutuhan</span>
                </button>

                {isVendorView && (
                  <button
                    onClick={() => setIsBiddingModalOpen(true)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Ajukan Penawaran Supplier (Bidding)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs text-slate-500 font-medium">
                Campaign ini sedang tidak menerima pesanan baru.
              </div>
            )}

            <button
              onClick={handleShare}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Undang Rekan Buyer (Share Link)</span>
            </button>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
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
              confirmButtonColor: "#10b981",
            });
            reloadCampaign();
          }}
        />
      )}
    </div>
  );
}
