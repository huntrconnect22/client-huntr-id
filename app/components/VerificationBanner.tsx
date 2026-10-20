import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, X, ChevronRight, AlertTriangle, Sparkles, Clock } from "lucide-react";

interface VerificationBannerProps {
  company: {
    status: string;
    verification_tier?: string;
    profile_completeness?: number;
    slug?: string;
    name?: string;
  };
}

/**
 * VerificationBanner
 *
 * Ditampilkan di atas halaman utama dashboard ketika akun perusahaan
 * belum terverifikasi (status: starter atau pending).
 *
 * - starter  → Belum ada NPWP / dokumen sama sekali
 * - pending  → Sudah submit dokumen, menunggu review admin
 */
export const VerificationBanner: React.FC<VerificationBannerProps> = ({ company }) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (company.status === "approved") return null;
  if (company.status === "rejected") return null; // rejected sudah ada banner lain

  const isStarter = company.status === "starter";
  const isPending = company.status === "pending";

  const completeness = company.profile_completeness ?? 0;

  const config = isStarter
    ? {
        icon: <Sparkles size={16} className="shrink-0" />,
        bg: "bg-indigo-500/10 border-indigo-500/25",
        iconColor: "text-indigo-400",
        textColor: "text-indigo-300",
        title: "Akun Starter — Lengkapi verifikasi untuk bertransaksi",
        subtitle:
          "Anda dapat menjelajahi platform. Tambahkan NPWP & dokumen legalitas agar dapat membuat RFQ, ikut tender, dan bertransaksi.",
        ctaLabel: "Lengkapi Verifikasi Sekarang",
        ctaStyle:
          "bg-indigo-500 hover:bg-indigo-600 text-white",
      }
    : {
        icon: <Clock size={16} className="shrink-0" />,
        bg: "bg-amber-500/10 border-amber-500/25",
        iconColor: "text-amber-400",
        textColor: "text-amber-300",
        title: "Verifikasi Sedang Diproses",
        subtitle:
          "Dokumen Anda sudah diterima dan sedang dalam review oleh tim admin Huntr. Anda akan dapat bertransaksi setelah disetujui.",
        ctaLabel: "Lihat Status Dokumen",
        ctaStyle:
          "bg-amber-500 hover:bg-amber-600 text-white",
      };

  const handleCta = () => {
    if (isStarter) {
      // Navigate to company profile to complete verification
      const slug = company.slug || company.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      navigate(`/${slug}?tab=documents`);
    } else {
      const slug = company.slug || company.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      navigate(`/${slug}?tab=documents`);
    }
  };

  return (
    <div
      className={`w-full mb-4 px-4 py-3 rounded-xl border flex items-start gap-3 ${config.bg}`}
      role="alert"
    >
      {/* Icon */}
      <span className={`mt-0.5 ${config.iconColor}`}>{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${config.textColor}`}>{config.title}</div>
        <p className="text-xs text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">
          {config.subtitle}
        </p>

        {/* Progress bar for starter accounts */}
        {isStarter && completeness > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--ui-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 shrink-0">
              {completeness}% lengkap
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleCta}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${config.ctaStyle}`}
      >
        {config.ctaLabel} <ChevronRight size={12} />
      </button>

      {/* Dismiss */}
      {isPending && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] transition-colors"
          aria-label="Tutup banner"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
