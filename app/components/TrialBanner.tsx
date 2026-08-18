import React, { useState } from "react";
import { AlertTriangle, Clock, X, ArrowRight, ShieldCheck, Zap, PhoneCall, Sparkles } from "lucide-react";
import { type TrialInfo, dismissTrialBanner } from "../lib/trial";
import Swal from "sweetalert2";

interface TrialBannerProps {
  trial: TrialInfo;
  onDismiss?: () => void;
}

export default function TrialBanner({ trial, onDismiss }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!trial.hasTrial || dismissed || (!trial.isExpiringSoon && !trial.isExpired)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    dismissTrialBanner(12); // dismiss for 12 hours
    if (onDismiss) onDismiss();
  };

  const handleContactSales = () => {
    Swal.fire({
      title: "Upgrade Akun Enterprise Huntr",
      html: `
        <div style="text-align: left; font-size: 13px; color: var(--ui-text-secondary, #4b5563); line-height: 1.6;">
          <p style="margin-bottom: 12px;">Untuk melanjutkan akses penuh tanpa gangguan atau memperpanjang paket enterprise, silakan hubungi perwakilan resmi kami:</p>
          <div style="background: rgba(249, 115, 22, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(249, 115, 22, 0.2); margin-bottom: 12px;">
            <div style="font-weight: 700; color: #f97316; margin-bottom: 4px;">Tim Sales & Support Huntr.id</div>
            <div>📧 Email: <b>support@huntr.id</b></div>
            <div>📞 WhatsApp: <b>+62 812-3456-7890</b></div>
            <div>🏢 Jam Operasional: <b>Senin - Jumat, 08:30 - 17:30 WIB</b></div>
          </div>
          <p style="font-size: 12px; color: #6b7280;">ID Akun: <b>${trial.trialEndsAt?.toISOString().split("T")[0] || "Trial Active"}</b></p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Hubungi via WhatsApp",
      showCancelButton: true,
      cancelButtonText: "Tutup",
      confirmButtonColor: "#f97316",
    }).then((res) => {
      if (res.isConfirmed) {
        window.open("https://wa.me/6281234567890?text=Halo%20Tim%20Huntr,%20saya%20ingin%20konsultasi%20perpanjangan%20paket%20langganan%20Huntr.id", "_blank");
      }
    });
  };

  // State 1: Expired
  if (trial.isExpired) {
    return (
      <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm z-30 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold uppercase tracking-wide bg-white/20 px-1.5 py-0.5 rounded text-[10px] mr-2">
              Trial Berakhir
            </span>
            <span className="font-medium">
              Masa trial 30 hari Anda telah selesai pada <b>{trial.formattedEndDate}</b>.
            </span>
            <span className="hidden md:inline ml-1 text-white/85">
              Hubungi sales untuk mengaktifkan langganan resmi dan menjaga kelancaran alur pengadaan Anda.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleContactSales}
            className="px-3 py-1.5 rounded-lg bg-white text-red-700 hover:bg-white/90 font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Upgrade Akun</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    );
  }

  // State 2: Urgent (<= 3 Days)
  if (trial.isUrgent) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white px-4 py-2 shadow-md flex items-center justify-between gap-3 text-xs sm:text-sm z-30 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-bounce">
            <Zap size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold uppercase tracking-wide bg-white/20 px-1.5 py-0.5 rounded text-[10px] mr-2">
              Sisa {trial.daysRemaining} Hari
            </span>
            <span className="font-medium">
              Masa trial Anda akan berakhir pada <b>{trial.formattedEndDate}</b>.
            </span>
            <span className="hidden lg:inline ml-1 text-white/90">
              Jangan sampai proses PR, PO, dan approval terhenti.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleContactSales}
            className="px-3 py-1 rounded-md bg-white text-orange-600 hover:bg-white/95 font-bold text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Perpanjang Sekarang</span>
            <ArrowRight size={12} />
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Tutup pemberitahuan"
            className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Ingatkan nanti"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // State 3: Warning (4-7 Days Remaining)
  return (
    <div className="w-full bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-orange-500/10 border-b border-orange-500/25 px-4 py-2 flex items-center justify-between gap-3 text-xs z-30 text-[var(--ui-text-primary)] transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center flex-shrink-0">
          <Clock size={13} />
        </div>
        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-orange-500 flex items-center gap-1">
            <Sparkles size={12} />
            Masa Percobaan:
          </span>
          <span className="text-[var(--ui-text-secondary)]">
            Tersisa <b>{trial.daysRemaining} hari lagi</b> (berakhir pada {trial.formattedEndDate}).
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={handleContactSales}
          className="text-xs text-orange-500 hover:text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Upgrade Enterprise</span>
          <ArrowRight size={11} />
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Tutup pemberitahuan"
          className="p-1 rounded text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-all cursor-pointer"
          title="Ingatkan nanti"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
