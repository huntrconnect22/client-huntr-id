import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  Truck,
  RotateCw,
  Share2,
  LogIn,
} from "lucide-react";
import { crowdBuyApi } from "../lib/api/crowd-buy";
import type { CrowdBuyCampaign } from "../features/crowd-buy/types";
import { CampaignProgressBar } from "../features/crowd-buy/components/CampaignProgressBar";
import { SessionManager } from "../lib/session";
import Swal from "sweetalert2";

export default function CrowdBuyPublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CrowdBuyCampaign | null>(null);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to load public campaign detail", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoinClick = () => {
    const company = SessionManager.getCompany();
    const companySlug = company?.slug;
    if (companySlug) {
      navigate(`/${companySlug}/crowd-buy/${campaign?.id}`);
    } else {
      navigate(`/login?redirect=/crowd-buy/p/${campaign?.id}`);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Tautan campaign disalin ke clipboard!",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RotateCw className="w-7 h-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-950">
        <Package className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Campaign tidak ditemukan</h3>
        <Link to="/login" className="text-xs text-orange-600 hover:underline">
          Masuk ke Huntr Platform
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Navigation bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              HUNTR<span className="text-orange-500">.ID</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400">
              Crowd Buy
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Bagikan
            </button>
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" /> Masuk
            </Link>
          </div>
        </div>

        {/* Content Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-5">
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded">
                  {campaign.category}
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
                  {campaign.title}
                </h1>
                <p className="text-xs text-slate-500">
                  Disediakan oleh <strong className="text-slate-700 dark:text-slate-300">{campaign.supplier?.name}</strong> • Kode: {campaign.code}
                </p>
              </div>

              {/* Image banner */}
              <div className="w-full h-60 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60">
                {campaign.image_url ? (
                  <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-1 opacity-40" />
                    <span className="text-[11px] uppercase font-bold tracking-wider">Crowd Buy Bulk Sourcing</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                <CampaignProgressBar
                  current={campaign.current_quantity}
                  target={campaign.target_quantity}
                  max={campaign.max_quantity}
                  unit={campaign.unit}
                  percentage={campaign.progress_percentage}
                  isTargetReached={campaign.is_target_reached}
                />
                <div className="flex justify-between text-xs text-slate-500 pt-0.5">
                  <span>Partisipan: <strong>{participantsCount} Perusahaan</strong></span>
                  <span>Batas Waktu: <strong>{campaign.days_remaining} hari lagi</strong></span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Deskripsi Produk</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {campaign.description || "Tidak ada deskripsi tambahan."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action */}
          <div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
              <div>
                <span className="text-xs text-slate-500">Harga Satuan Grosir:</span>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  Rp {Number(campaign.base_price).toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 py-2.5 border-y border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>MOQ per Buyer:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{campaign.min_order_qty} {campaign.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Batas Waktu:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {new Date(campaign.ends_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </strong>
                </div>
              </div>

              <button
                onClick={handleJoinClick}
                className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Gabung Crowd Buy Sekarang</span>
              </button>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pengadaan Resmi B2B Huntr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
