import React from "react";
import { Link } from "react-router";
import { Clock, ShieldCheck, TrendingUp, Users, ArrowRight, Layers, Share2, Sparkles, Gavel } from "lucide-react";
import type { CrowdBuyCampaign } from "../types";
import { CampaignProgressBar } from "./CampaignProgressBar";

interface CampaignCardProps {
  campaign: CrowdBuyCampaign;
  companySlug?: string;
  onJoinClick?: (campaign: CrowdBuyCampaign) => void;
  onShareClick?: (campaign: CrowdBuyCampaign) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  companySlug,
  onJoinClick,
  onShareClick,
}) => {
  const detailUrl = companySlug
    ? `/${companySlug}/crowd-buy/${campaign.id}`
    : `/crowd-buy/p/${campaign.id}`;

  const isBuyerInitiated = campaign.creator_type === "buyer" || campaign.is_buyer_initiated;
  const isCollectiveRfq = campaign.campaign_type === "collective_rfq";
  const isBidding = campaign.status === "bidding";

  const hasTiers = campaign.price_tiers && campaign.price_tiers.length > 0;
  const bestTierPrice = hasTiers
    ? Math.min(...campaign.price_tiers!.map((t) => Number(t.unit_price)))
    : null;

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500">
      {/* Media / Header Banner */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        {campaign.image_url ? (
          <img
            src={campaign.image_url}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
            <Layers className="w-10 h-10 mb-1 opacity-60" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              {isCollectiveRfq ? "Collective RFQ" : "Bulk Crowd Buy"}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-md rounded-full shadow-xs">
            {campaign.category}
          </span>
          {isBuyerInitiated && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Inisiasi Buyer
            </span>
          )}
          {isCollectiveRfq && isBidding && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full shadow-xs flex items-center gap-1">
              <Gavel className="w-3 h-3" /> Bidding Supplier
            </span>
          )}
          {campaign.is_target_reached && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500 text-white rounded-full shadow-xs flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Target Tercapai
            </span>
          )}
        </div>

        {/* Share Quick Button */}
        {onShareClick && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShareClick(campaign);
            }}
            title="Undang Rekan Buyer"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 backdrop-blur-md flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>
        )}

        {/* Remaining Time Badge */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/85 text-white text-[11px] font-medium backdrop-blur-md rounded-full flex items-center gap-1.5 shadow-xs">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{campaign.days_remaining > 0 ? `${campaign.days_remaining} hari lagi` : "Berakhir"}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Supplier or Initiator Info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            {isCollectiveRfq && !campaign.supplier ? (
              <span className="truncate max-w-[200px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Diinisiasi oleh {campaign.initiator_company?.name || "Buyer Huntr"}
              </span>
            ) : (
              <>
                <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">
                  {campaign.supplier?.name || "Supplier Huntr"}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" aria-label="Supplier Terverifikasi" />
              </>
            )}
          </div>

          {/* Title */}
          <Link to={detailUrl} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {campaign.title}
            </h3>
          </Link>

          {/* Pricing Section */}
          <div className="mt-3 flex items-baseline gap-2">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isCollectiveRfq && isBidding ? "Ekspektasi Harga:" : "Harga Satuan:"}
              </span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                Rp {Number(campaign.base_price).toLocaleString("id-ID")}
                <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
              </div>
            </div>
            {bestTierPrice && bestTierPrice < campaign.base_price && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                Diskon s/d Rp {bestTierPrice.toLocaleString("id-ID")}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <CampaignProgressBar
            current={campaign.current_quantity}
            target={campaign.target_quantity}
            max={campaign.max_quantity}
            unit={campaign.unit}
            percentage={campaign.progress_percentage}
            isTargetReached={campaign.is_target_reached}
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex items-center gap-2">
          <Link
            to={detailUrl}
            className="flex-1 py-2 px-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Lihat Detail
          </Link>
          {onJoinClick && (campaign.is_active || isBidding) && (
            <button
              onClick={() => onJoinClick(campaign)}
              className="flex-1 py-2 px-3 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>{isBidding ? "Ikut Pool" : "Gabung"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
