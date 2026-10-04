import React, { useState } from "react";
import { ArrowLeft, Share2, Copy, Check, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";
import { useLanguage } from "../../context/LanguageContext";

const btnGhost =
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors cursor-pointer";

interface RFQHeaderProps {
  rfq: any;
  isTenderExpired: () => boolean;
  onRefresh?: () => void;
}

export function RFQHeader({ rfq, isTenderExpired, onRefresh }: RFQHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const expired = rfq ? isTenderExpired() : false;
  const prShort = rfq?.id ? String(rfq.id).substring(0, 8).toUpperCase() : "";
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const tenderUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tender/${rfq?.id}`
    : `/tender/${rfq?.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tenderUrl);
    setCopied(true);
    setShowShareMenu(false);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenPublicPage = () => {
    window.open(tenderUrl, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={() => navigate(-1)} className={btnGhost}>
        <ArrowLeft size={14} /> {t("rfqDetail.header.back")}
      </button>
      {rfq && (
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
            #{prShort}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
              expired
                ? "bg-red-500/10 text-red-400"
                : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${expired ? "bg-red-400" : "bg-emerald-500"}`} />
            {expired ? t("rfqDetail.header.expired") : t("rfqDetail.header.active")}
          </span>

          {/* Share Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowShareMenu((p) => !p)}
              className={`${btnGhost} ${copied ? "border-emerald-500/40 text-emerald-400" : "hover:border-orange-500/30"}`}
              title={t("rfqDetail.header.shareTenderTitle")}
            >
              {copied ? (
                <><Check size={13} className="text-emerald-400" /><span>{t("rfqDetail.header.copied")}</span></>
              ) : (
                <><Share2 size={13} /><span>{t("rfqDetail.header.shareTender")}</span></>
              )}
            </button>

            {showShareMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowShareMenu(false)}
                />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xl p-2 flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                    {t("rfqDetail.header.shareDropdownHeading")}
                  </div>
                  <div className="px-2 py-1 text-[11px] text-[var(--ui-text-muted)] bg-[var(--ui-bg-input)] rounded-md font-mono break-all">
                    {tenderUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-orange-500/10 hover:text-orange-400 text-[var(--ui-text-secondary)] text-xs font-semibold transition-all text-left cursor-pointer"
                  >
                    <Copy size={13} />
                    {t("rfqDetail.header.copyLink")}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPublicPage}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] text-xs font-semibold transition-all text-left cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    {t("rfqDetail.header.openPublicPage")}
                  </button>
                  <div className="px-2 pt-1 pb-0.5 border-t border-[var(--ui-border)] mt-1 text-[10px] text-[var(--ui-text-muted)]">
                    {t("rfqDetail.header.shareNote")}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
