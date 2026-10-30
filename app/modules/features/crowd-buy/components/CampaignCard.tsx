import { Button as HuntrButton } from "~/shared/ui/Button";
import React from "react";
import { Link } from "react-router";
import { Clock, ShieldCheck, TrendingUp, Users, ArrowRight, Layers, Share2, Sparkles, Gavel, Calendar } from "lucide-react";
import type { CrowdBuyCampaign } from "../types";
import { CampaignProgressBar } from "./CampaignProgressBar";
import { SessionManager } from "../../../lib/session";

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
  const currentCompany = SessionManager.getCompany();
  const isInitiator =
    !!currentCompany?.id &&
    !!campaign.initiator_company_id &&
    String(currentCompany.id) === String(campaign.initiator_company_id);

  const detailUrl = companySlug
    ? `/${companySlug}/crowd-buy/${campaign.id}`
    : `/crowd-buy/p/${campaign.id}`;

  const isAutoDemand =
    campaign.campaign_type === "auto_demand_aggregation" ||
    !!campaign.is_monthly_recurring ||
    !!campaign.is_auto_demand;
  const isBuyerInitiated = campaign.creator_type === "buyer" || campaign.is_buyer_initiated;
  const isCollectiveRfq = campaign.campaign_type === "collective_rfq";
  const isBidding = campaign.status === "bidding";

  const hasTiers = campaign.price_tiers && campaign.price_tiers.length > 0;
  const bestTierPrice = hasTiers
    ? Math.min(...campaign.price_tiers!.map((t) => Number(t.unit_price)))
    : null;

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:border-orange-500/60 transition-all duration-200">
      {/* Media / Header Banner */}
      <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {campaign.image_url ? (
          <img
            src={campaign.image_url}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <Layers className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              {isCollectiveRfq ? "Collective RFQ" : "Crowd Buy"}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 items-center">
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 rounded border border-slate-200/80 dark:border-slate-700">
            {campaign.category}
          </span>
          {isAutoDemand && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3" /> Auto Demand PO
            </span>
          )}
          {isBuyerInitiated && !isAutoDemand && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {isInitiator ? "Inisiator Anda" : "Inisiasi Buyer"}
            </span>
          )}
          {isCollectiveRfq && isBidding && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded flex items-center gap-1">
              <Gavel className="w-3 h-3 text-orange-400" /> Bidding
            </span>
          )}
          {campaign.is_target_reached && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Tercapai
            </span>
          )}
        </div>

        {/* Share Quick Button */}
        {onShareClick && (
          <HuntrButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShareClick(campaign);
            }}
            title="Undang Rekan Buyer"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:text-orange-500 hover:border-orange-500 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </HuntrButton>
        )}

        {/* Remaining Time Badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-medium rounded flex items-center gap-1">
          <Clock className="w-3 h-3 text-orange-400" />
          <span>{campaign.days_remaining > 0 ? `${campaign.days_remaining} hari lagi` : "Berakhir"}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
        <div>
          {/* Supplier or Initiator Info */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            {isCollectiveRfq && !campaign.supplier ? (
              <span className="truncate max-w-[200px] text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                <Users className="w-3 h-3 text-orange-500" />
                Inisiator: <strong>{campaign.initiator_company?.name || "Buyer Huntr"}</strong>
              </span>
            ) : isAutoDemand ? (
              <span className="truncate max-w-[200px] text-blue-600 dark:text-blue-400 font-medium text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Algoritma Demand PO HUNTR
              </span>
            ) : (
              <>
                <span className="truncate max-w-[200px] text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                  {campaign.supplier?.name || "Supplier Huntr"}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" aria-label="Supplier Terverifikasi" />
              </>
            )}
          </div>

          {/* Title */}
          <Link to={detailUrl} className="block group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 text-sm leading-snug">
              {campaign.title}
            </h3>
          </Link>

          {/* Pricing Section */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <div>
              <span className="text-[11px] text-slate-400 block">
                {isCollectiveRfq && isBidding
                  ? "Target Harga Satuan:"
                  : isAutoDemand
                  ? "Harga Terendah Historis:"
                  : "Harga Satuan:"}
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                Rp {Number(campaign.base_price).toLocaleString("id-ID")}
                <span className="text-xs font-normal text-slate-500"> / {campaign.unit}</span>
              </div>
            </div>
            {bestTierPrice && bestTierPrice < campaign.base_price && (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                s/d Rp {bestTierPrice.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          {/* Monthly Delivery Schedule Banner */}
          {isAutoDemand && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 rounded text-[11px] text-orange-800 dark:text-orange-300">
              <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Kirim <strong>Tgl {campaign.monthly_delivery_day || 27}</strong> / bulan ke delivery point</span>
            </div>
          )}
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
        <div className="pt-1 flex items-center gap-2">
          <Link
            to={detailUrl}
            className="flex-1 py-1.5 px-3 text-center text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Detail
          </Link>
          {isInitiator ? (
            <span
              className="flex-1 py-1.5 px-2 text-center text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md select-none flex items-center justify-center"
              title="Anda adalah pembuat campaign ini. Kebutuhan awal Anda sudah tercatat otomatis."
            >
              Inisiator
            </span>
          ) : (
            onJoinClick && (campaign.is_active || isBidding) && (
              <HuntrButton
                onClick={() => onJoinClick(campaign)}
                className="flex-1 py-1.5 px-3 text-center text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isBidding ? "Ikut Pool" : isAutoDemand ? "Ikut Komitmen" : "Gabung"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </HuntrButton>
            )
          )}
        </div>
      </div>
    </div>
  );
};


