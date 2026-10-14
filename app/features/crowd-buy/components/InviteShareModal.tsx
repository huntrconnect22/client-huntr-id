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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Undang Rekan Buyer
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajak pelaku usaha lain patungan volume untuk dapat harga terbaik
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Campaign summary preview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
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
                <div className="text-xs text-slate-500">per {campaign.unit}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kode Undangan Unik
            </label>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50">
              <span className="font-mono text-sm font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                {inviteCode}
              </span>
              <span className="text-xs text-indigo-500 dark:text-indigo-400">
                Bisa diinput di halaman checkout
              </span>
            </div>
          </div>

          {/* Copyable Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tautan Undangan Langsung
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Share Options */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Bagikan Langsung Ke:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>

              <button
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Mail className="w-4 h-4" />
                Email Rekan
              </button>
            </div>
          </div>

          {/* Explanation Tip */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed">
              Semakin banyak kuantiti yang terkumpul sebelum batas waktu berakhir, semakin besar peluang tier diskon tercapai dan pesanan diproses dengan harga termurah!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
