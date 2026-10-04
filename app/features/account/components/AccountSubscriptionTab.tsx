import React, { useEffect, useState } from "react";
import { Zap, Clock, ShieldCheck, PhoneCall, ArrowRight, Bot, RefreshCw, Cpu } from "lucide-react";
import Swal from "sweetalert2";
import { getTrialInfo } from "../../../lib/trial";
import { getAiUsage } from "../../../lib/api/ai";
import { getCompanySubscription, type GmvSubscriptionSummary } from "../../../lib/api/subscription";
import { useLanguage } from "../../../context/LanguageContext";

interface AccountSubscriptionTabProps {
  user: any;
  activeCompany: any;
}

export function AccountSubscriptionTab({
  user,
  activeCompany,
}: AccountSubscriptionTabProps) {
  const { t, locale } = useLanguage();
  const trial = getTrialInfo(user);
  const [usageData, setUsageData] = useState<{
    total_requests: number;
    total_tokens: number;
    total_cost_usd: number;
    month: string;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [subscription, setSubscription] = useState<GmvSubscriptionSummary | null>(null);

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

  useEffect(() => {
    if (!activeCompany?.id) {
      setSubscription(null);
      return;
    }

    getCompanySubscription(activeCompany.id)
      .then((response: any) => setSubscription(response?.subscription ?? null))
      .catch(() => setSubscription(null));
  }, [activeCompany?.id]);

  const numberLocale = locale === "en" ? "en-US" : "id-ID";
  const formatRupiah = (value: number) => `Rp ${value.toLocaleString(numberLocale)}`;
  const quotaPercent = subscription
    ? Math.min(100, ((subscription.current_realized_gmv + subscription.reserved_gmv) / subscription.gmv_limit) * 100)
    : 0;

  const handleContactSales = () => {
    Swal.fire({
      title: t("settings.subscription.contactSalesModalTitle"),
      html: `
        <div style="text-align: left; font-size: 13px; color: var(--ui-text-secondary, #4b5563); line-height: 1.6;">
          <p style="margin-bottom: 12px;">${
            locale === "en"
              ? "Get dedicated enterprise access, ERP integrations, and unlimited quotas for your whole organization:"
              : "Dapatkan akses enterprise khusus, integrasi ERP, dan kuota tanpa batas untuk seluruh organisasi Anda:"
          }</p>
          <div style="background: rgba(249, 115, 22, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(249, 115, 22, 0.2); margin-bottom: 12px;">
            <div style="font-weight: 700; color: #f97316; margin-bottom: 4px;">Huntr Enterprise Solutions</div>
            <div>📧 Email: <b>support@huntr.id</b></div>
            <div>📞 WhatsApp: <b>+62 812-3456-7890</b></div>
            <div>🏢 Jakarta, Indonesia</div>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: locale === "en" ? "Contact via WhatsApp" : "Hubungi via WhatsApp",
      showCancelButton: true,
      cancelButtonText: locale === "en" ? "Close" : "Tutup",
      confirmButtonColor: "#f97316",
    }).then((res: any) => {
      if (res.isConfirmed) {
        const text = encodeURIComponent(
          locale === "en"
            ? "Hello Huntr Team, I am interested in the Huntr.id Enterprise Plan."
            : "Halo Tim Huntr, saya tertarik dengan paket Enterprise Huntr.id"
        );
        window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">
          {t("settings.subscription.title")}
        </h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          {t("settings.subscription.subtitle")}
        </p>
      </div>

      {/* AI Usage Card Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1.5">
            <Bot size={13} className="text-orange-500" />
            {t("settings.subscription.aiUsageSection", {
              month: usageData?.month || t("settings.subscription.thisMonth"),
            })}
          </span>
          <button
            onClick={fetchUsage}
            disabled={loadingUsage}
            className="text-[11px] text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={11} className={loadingUsage ? "animate-spin" : ""} />
            <span>{t("settings.subscription.refresh")}</span>
          </button>
        </div>

        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 font-medium">
                <Cpu size={12} className="text-orange-500" /> {t("settings.subscription.totalAiRequests")}
              </span>
              <div className="text-lg font-bold text-[var(--ui-text-primary)] mt-1">
                {usageData?.total_requests?.toLocaleString(numberLocale) ?? 0}
                <span className="text-[10px] font-normal text-[var(--ui-text-muted)] ml-1">calls</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 font-medium">
                <Zap size={12} className="text-amber-500" /> {t("settings.subscription.tokensConsumed")}
              </span>
              <div className="text-lg font-bold text-[var(--ui-text-primary)] mt-1">
                {usageData?.total_tokens?.toLocaleString(numberLocale) ?? 0}
                <span className="text-[10px] font-normal text-[var(--ui-text-muted)] ml-1">tokens</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col justify-between">
              <span className="text-[11px] text-[var(--ui-text-muted)] flex items-center gap-1.5 font-medium">
                <ShieldCheck size={12} className="text-emerald-500" /> {t("settings.subscription.quotaStatus")}
              </span>
              <div className="text-sm font-bold text-emerald-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {t("settings.subscription.trialUnlimited")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {subscription && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1.5">
              <Zap size={13} className="text-orange-500" /> {t("settings.subscription.gmvQuota")}
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${subscription.status === "active" ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"}`}>
              {subscription.status === "active" ? t("settings.subscription.statusActive") : t("settings.subscription.statusNeedsRenewal")}
            </span>
          </div>
          <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 text-xs">
              <div>
                <p className="m-0 text-[var(--ui-text-muted)]">{t("settings.subscription.realizedGmv")}</p>
                <p className="m-0 mt-1 text-base font-bold text-[var(--ui-text-primary)]">
                  {formatRupiah(subscription.current_realized_gmv + subscription.reserved_gmv)}
                  <span className="font-normal text-[var(--ui-text-muted)]"> / {formatRupiah(subscription.gmv_limit)}</span>
                </p>
              </div>
              <span className="font-semibold text-orange-500">
                {t("settings.subscription.remainingGmv", { amount: formatRupiah(subscription.available_gmv) })}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--ui-bg-card)] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all" style={{ width: `${quotaPercent}%` }} />
            </div>
            <p className="m-0 text-[11px] text-[var(--ui-text-muted)]">
              {t("settings.subscription.gmvLimitFeeNote", {
                fee: formatRupiah(subscription.upfront_fee),
                date: new Date(subscription.ends_at).toLocaleDateString(numberLocale),
                overflowNote:
                  subscription.overflow_strategy === "transaction_fee"
                    ? t("settings.subscription.overflowTransactionFee")
                    : t("settings.subscription.overflowNewContract"),
              })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          {t("settings.subscription.currentPlan")}
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
                      ? t("settings.subscription.vendorFreeTitle")
                      : t("settings.subscription.buyerTrialTitle")}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    {activeCompany?.type === "vendor"
                      ? t("settings.subscription.vendorFreeBadge")
                      : t("settings.subscription.buyerTrialBadge")}
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                  {activeCompany?.type === "vendor"
                    ? t("settings.subscription.vendorFreeDesc")
                    : t("settings.subscription.buyerTrialDesc")}
                </p>
              </div>
            </div>

            <div>
              {trial.isExpired ? (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {t("settings.subscription.statusExpired")}
                </span>
              ) : trial.isUrgent ? (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {t("settings.subscription.statusExpiringSoon")}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {t("settings.subscription.statusActive")}
                </span>
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-2 p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
                <Clock size={14} className="text-orange-500" />
                {t("settings.subscription.remainingTrialTime")}
              </span>
              <span className="font-bold text-orange-500">
                {trial.isExpired
                  ? t("settings.subscription.expiredTime")
                  : t("settings.subscription.daysRemainingText", { days: trial.daysRemaining })}
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
              <span>{t("settings.subscription.validUntil")}</span>
              <span className="font-medium text-[var(--ui-text-primary)]">{trial.formattedEndDate}</span>
            </div>
          </div>

          {/* Features Matrix */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              {t("settings.subscription.featuresIncluded")}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--ui-text-secondary)]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>{t("settings.subscription.features.unlimitedPrRfq")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>{t("settings.subscription.features.multiTierApproval")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>{t("settings.subscription.features.aiAgentic")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>{t("settings.subscription.features.efakturVat")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>{t("settings.subscription.features.liveBidding")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>{t("settings.subscription.features.teamInvites")}</span>
              </div>
            </div>
          </div>

          {/* Contact Sales Action */}
          <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[var(--ui-text-muted)]">
              {t("settings.subscription.upgradePrompt")}
            </div>
            <button
              type="button"
              onClick={handleContactSales}
              style={{ color: "white" }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <PhoneCall size={14} />
              <span>{t("settings.subscription.contactSalesBtn")}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
