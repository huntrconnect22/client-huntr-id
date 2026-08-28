import React, { useEffect, useState } from "react";
import { Zap, Clock, ShieldCheck, PhoneCall, ArrowRight, Bot, RefreshCw, Cpu } from "lucide-react";
import Swal from "sweetalert2";
import { getTrialInfo } from "../../../lib/trial";
import { getAiUsage } from "../../../lib/api/ai";

interface AccountSubscriptionTabProps {
  user: any;
  activeCompany: any;
}

export function AccountSubscriptionTab({
  user,
  activeCompany,
}: AccountSubscriptionTabProps) {
  const trial = getTrialInfo(user);
  const [usageData, setUsageData] = useState<{
    total_requests: number;
    total_tokens: number;
    total_cost_usd: number;
    month: string;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const fetchUsage = async () => {
    if (!activeCompany?.id) return;
    setLoadingUsage(true);
    try {
      const res: any = await getAiUsage(activeCompany.id);
      if (res && res.success && res.data) {
        setUsageData(res.data);
      }
    } catch (e) {
      console.error("Failed to load AI usage", e);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [activeCompany?.id]);

  const handleContactSales = () => {
    Swal.fire({
      title: "Konsultasi Paket Langganan",
      html: `
        <div style="text-align: left; font-size: 13px; color: var(--ui-text-secondary, #4b5563); line-height: 1.6;">
          <p style="margin-bottom: 12px;">Dapatkan akses enterprise khusus, integrasi ERP, dan kuota tanpa batas untuk seluruh organisasi Anda:</p>
          <div style="background: rgba(249, 115, 22, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(249, 115, 22, 0.2); margin-bottom: 12px;">
            <div style="font-weight: 700; color: #f97316; margin-bottom: 4px;">Huntr Enterprise Solutions</div>
            <div>📧 Email: <b>support@huntr.id</b></div>
            <div>📞 WhatsApp: <b>+62 812-3456-7890</b></div>
            <div>🏢 Jakarta, Indonesia</div>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Hubungi via WhatsApp",
      showCancelButton: true,
      cancelButtonText: "Tutup",
      confirmButtonColor: "#f97316",
    }).then((res: any) => {
      if (res.isConfirmed) {
        window.open(
          "https://wa.me/6281234567890?text=Halo%20Tim%20Huntr,%20saya%20tertarik%20dengan%20paket%20Enterprise%20Huntr.id",
          "_blank"
        );
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Subscription & Trial Plan</h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          Pantau masa aktif paket percobaan (trial), kuota pemakaian AI, dan kelola lisensi akun enterprise Anda.
        </p>
      </div>

      {/* AI Usage Card Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1.5">
            <Bot size={13} className="text-orange-500" />
            Penggunaan AI & Credit ({usageData?.month || "Bulan Ini"})
          </span>
          <button
            onClick={fetchUsage}
            disabled={loadingUsage}
            className="text-[11px] text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={11} className={loadingUsage ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 font-medium">
                <Cpu size={12} className="text-orange-500" /> Total Request AI
              </span>
              <div className="text-lg font-bold text-[var(--ui-text-primary)] mt-1">
                {usageData?.total_requests?.toLocaleString("id-ID") ?? 0}
                <span className="text-[10px] font-normal text-[var(--ui-text-muted)] ml-1">calls</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 font-medium">
                <Zap size={12} className="text-amber-500" /> Token Dikonsumsi
              </span>
              <div className="text-lg font-bold text-[var(--ui-text-primary)] mt-1">
                {usageData?.total_tokens?.toLocaleString("id-ID") ?? 0}
                <span className="text-[10px] font-normal text-[var(--ui-text-muted)] ml-1">tokens</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 font-medium">
                <ShieldCheck size={12} className="text-emerald-500" /> Status Kuota
              </span>
              <div className="text-sm font-bold text-emerald-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Trial Unlimited
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          Paket Aktif Saat Ini
        </span>

        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-6 space-y-6">
          {/* Plan Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Zap size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--ui-text-primary)] m-0">
                    {activeCompany?.type === "vendor"
                      ? "Vendor Unlimited Free Account"
                      : "Buyer Purchasing Enterprise Free Trial"}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    {activeCompany?.type === "vendor" ? "0% PLATFORM FEE" : "30 DAYS TRIAL"}
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                  {activeCompany?.type === "vendor"
                    ? "Sisi Vendor 100% bebas biaya pendaftaran dan bebas potongan platform fee."
                    : "Trial 30 hari gratis 0% platform fee untuk Buyer Purchasing (PPN 11% barang tetap berlaku)."}
                </p>
              </div>
            </div>

            <div>
              {trial.isExpired ? (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  KEDALUWARSA
                </span>
              ) : trial.isUrgent ? (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  SEGERA BERAKHIR
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  AKTIF
                </span>
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-2 p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
                <Clock size={14} className="text-orange-500" />
                Sisa Waktu Masa Percobaan:
              </span>
              <span className="font-bold text-orange-500">
                {trial.isExpired ? "0 Hari (Habis)" : `${trial.daysRemaining} Hari Tersisa`}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[var(--ui-bg-input)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  trial.isExpired
                    ? "bg-red-500"
                    : trial.isUrgent
                    ? "bg-gradient-to-r from-red-500 to-amber-500"
                    : "bg-gradient-to-r from-orange-500 to-amber-400"
                }`}
                style={{ width: `${trial.percentRemaining}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--ui-text-muted)] pt-1">
              <span>Masa Berlaku Berakhir:</span>
              <span className="font-medium text-[var(--ui-text-primary)]">{trial.formattedEndDate}</span>
            </div>
          </div>

          {/* Features Matrix */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              Fitur Enterprise yang Termasuk:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--ui-text-secondary)]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Unlimited PR & RFQ Creation</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Multi-Tier Approval Management</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>AI Agentic Procurement Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>E-Faktur VAT Match & Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Real-time Live Bidding Websockets</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Unlimited Team Member Invites</span>
              </div>
            </div>
          </div>

          {/* Contact Sales Action */}
          <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[var(--ui-text-muted)]">
              Ingin upgrade ke langganan tahunan atau paket enterprise dedicated?
            </div>
            <button
              type="button"
              onClick={handleContactSales}
              style={{ color: "white" }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <PhoneCall size={14} />
              <span>Hubungi Sales / Upgrade</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
