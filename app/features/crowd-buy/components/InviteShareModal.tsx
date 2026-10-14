import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Users,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { CrowdBuyCampaign } from "../types";

interface InviteShareModalProps {
  campaign: CrowdBuyCampaign;
  onClose: () => void;
}

export const InviteShareModal: React.FC<InviteShareModalProps> = ({
  campaign,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const inviteCode = campaign.invite_code || campaign.code;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/crowd-buy/p/${campaign.id}?invite=${inviteCode}`;

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const shareText = `Halo rekan bisnis!\nAyo gabung Group Buying di Huntr untuk produk:\n*${campaign.title}*\n\nTarget bersama: ${campaign.target_quantity.toLocaleString()} ${campaign.unit}\nHarga grosir: ${formatRupiah(campaign.base_price)} / ${campaign.unit}\n\nDengan memesan bersama, kita bisa menikmati harga grosir pabrik!\nGabung di sini: ${inviteUrl}`;

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      `Undangan Group Buying Huntr: ${campaign.title}`
    );
    const body = encodeURIComponent(
      `Halo Rekan,\n\nSaya mengundang perusahaan Anda untuk ikut bergabung dalam Crowd Buy / Collective Procurement produk "${campaign.title}" di Huntr.id.\n\nTarget Volume: ${campaign.target_quantity} ${campaign.unit}\nHarga Perkiraan: ${formatRupiah(campaign.base_price)} / ${campaign.unit}\n\nSilakan klik link berikut untuk melihat detail dan memesan kuota:\n${inviteUrl}\n\nTerima kasih!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-orange-500 text-white flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Undang Rekan Buyer
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajak pelaku usaha lain patungan volume untuk dapat harga terbaik
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Campaign summary preview */}
          <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 rounded">
                  {campaign.category}
                </span>
                <h4 className="font-semibold text-slate-900 dark:text-white mt-1 text-sm line-clamp-1">
                  {campaign.title}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatRupiah(campaign.base_price)}
                </div>
                <div className="text-[11px] text-slate-500">per {campaign.unit}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Target: {campaign.target_quantity.toLocaleString()} {campaign.unit}
              </span>
              <span>
                Terkumpul: <strong>{campaign.current_quantity.toLocaleString()}</strong> ({campaign.progress_percentage}%)
              </span>
            </div>
          </div>

          {/* Invite Code Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kode Undangan Unik
            </label>
            <div className="flex items-center justify-between px-3.5 py-2 rounded-md bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
              <span className="font-mono text-xs font-bold tracking-wider text-orange-700 dark:text-orange-400">
                {inviteCode}
              </span>
              <span className="text-[11px] text-orange-600 dark:text-orange-400">
                Bisa diinput di halaman checkout
              </span>
            </div>
          </div>

          {/* Copyable Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tautan Undangan Langsung
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-semibold transition-colors active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Share Options */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bagikan Langsung Ke:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>

              <button
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Rekan
              </button>
            </div>
          </div>

          {/* Explanation Tip */}
          <div className="p-3 rounded-md bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-orange-500 mt-0.5" />
            <p className="leading-relaxed">
              Semakin banyak kuantiti yang terkumpul sebelum batas waktu berakhir, semakin besar peluang tier diskon tercapai dan pesanan diproses dengan harga termurah!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
