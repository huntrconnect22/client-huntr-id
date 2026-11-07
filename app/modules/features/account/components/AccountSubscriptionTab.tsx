import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Zap,
  Clock,
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  Bot,
  RefreshCw,
  Cpu,
} from "lucide-react";
import Swal from "sweetalert2";
import { getTrialInfo } from "../../../lib/trial";
import { getAiUsage } from "../../../lib/api/ai";
import {
  getCompanySubscription,
  type GmvSubscriptionSummary,
} from "../../../lib/api/subscription";
import { useLanguage } from "../../../context/LanguageContext";
import { EnterprisePlans } from "./EnterprisePlans";

interface AccountSubscriptionTabProps {
  user: any;
  activeCompany: any;
}

/**
 * AccountSubscriptionTab Component
 * 
 * Pure Material UI implementation.
 */
export function AccountSubscriptionTab({
  user,
  activeCompany,
}: AccountSubscriptionTabProps) {
  const theme = useTheme();
  const { t, locale } = useLanguage();
  const trial = getTrialInfo(user);
  const [usageData, setUsageData] = useState<{
    total_requests: number;
    total_tokens: number;
    total_cost_usd: number;
    month: string;
    limit?: number;
    remaining?: number;
    plan_name?: string;
  } | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  const [subscription, setSubscription] =
    useState<GmvSubscriptionSummary | null>(null);
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);

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
    let current = true;
    setSubscriptionReady(false);
    setSubscription(null);
    setShowUpgradeOptions(false);
    if (!activeCompany?.id) return () => { current = false; };

    getCompanySubscription(activeCompany.id)
      .then((response: any) => {
        if (!response || !("subscription" in response)) throw new Error("Subscription unavailable");
        if (current) { setSubscription(response.subscription ?? null); setSubscriptionReady(true); }
      })
      .catch(() => { if (current) setSubscriptionReady(false); });
    return () => { current = false; };
  }, [activeCompany?.id]);

  const numberLocale = locale === "en" ? "en-US" : "id-ID";
  const formatRupiah = (value: number) =>
    `Rp ${value.toLocaleString(numberLocale)}`;
  const aiQuotaExhausted = Boolean(
    usageData?.limit !== undefined && usageData.remaining !== undefined && usageData.remaining <= 0,
  );
  const quotaPercent = subscription && subscription.gmv_limit > 0
    ? Math.min(
        100,
        ((subscription.current_realized_gmv + subscription.reserved_gmv) /
          subscription.gmv_limit) *
          100,
      )
    : 0;

  const enterpriseTrialActive = Boolean(
    subscription?.is_trial &&
      subscription.status === "active" &&
      new Date(subscription.ends_at).getTime() > Date.now(),
  );
  const enterpriseTrialExpired = Boolean(
    subscription?.is_trial && !enterpriseTrialActive,
  );
  const canManageSubscription =
    user?.role === "manager" ||
    String(activeCompany?.owner_id) === String(user?.id);
  const hasActivePaidEnterprise = Boolean(
    subscription?.enterprise_plan &&
      !subscription.is_trial &&
      subscription.status === "active" &&
      new Date(subscription.ends_at).getTime() > Date.now(),
  );
  const hasScheduledUpgrade = Boolean(subscription?.scheduled_change);
  const canOfferUpgrade =
    hasActivePaidEnterprise &&
    subscription?.enterprise_plan !== "enterprise_pro" &&
    !hasScheduledUpgrade;
  const canChooseEnterprisePlan =
    subscriptionReady &&
    activeCompany?.type === "buyer" &&
    (!subscription?.enterprise_plan ||
      (enterpriseTrialExpired && showUpgradeOptions) ||
      (hasActivePaidEnterprise && showUpgradeOptions) ||
      (!enterpriseTrialActive && !hasActivePaidEnterprise));

  const openUpgradeOptions = () => {
    setShowUpgradeOptions(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById("enterprise-upgrade-options")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const enterprisePlanSelector = canChooseEnterprisePlan ? (
    <Box id="enterprise-upgrade-options" sx={{ mt: 3 }}>
      <EnterprisePlans
        companyId={activeCompany.id}
        subscriptionReady={subscriptionReady}
        activePlan={
          hasActivePaidEnterprise ? subscription?.enterprise_plan ?? null : null
        }
        canManage={canManageSubscription}
        onPaid={() => {
          window.dispatchEvent(new Event("huntr:subscription-updated"));
          getCompanySubscription(activeCompany.id).then((response: any) =>
            setSubscription(response?.subscription ?? null),
          );
        }}
      />
    </Box>
  ) : null;

  const handleContactSales = () => {
    Swal.fire({
      title: t("settings.subscription.contactSalesModalTitle"),
      html: `
        <div style="text-align: left; font-size: 13px; color: var(--ui-text-secondary, #4b5563); line-height: 1.6;">
          <p style="margin-bottom: 12px;">${
            locale === "en"
              ? "Discuss enterprise plans and onboarding with the Huntr team:"
              : "Konsultasikan paket enterprise dan onboarding dengan tim Huntr:"
          }</p>
          <div style="background: rgba(239, 125, 0, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 125, 0, 0.2); margin-bottom: 12px;">
            <div style="font-weight: 700; color: #ef7d00; margin-bottom: 4px;">Huntr Enterprise Solutions</div>
            <div>📧 Email: <b>support@huntr.id</b></div>
            <div>📞 WhatsApp: <b>+62 812-3456-7890</b></div>
            <div>🏢 Jakarta, Indonesia</div>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText:
        locale === "en" ? "Contact via WhatsApp" : "Hubungi via WhatsApp",
      showCancelButton: true,
      cancelButtonText: locale === "en" ? "Close" : "Tutup",
      confirmButtonColor: "#ef7d00",
    }).then((res: any) => {
      if (res.isConfirmed) {
        const text = encodeURIComponent(
          locale === "en"
            ? "Hello Huntr Team, I am interested in the Huntr.id Enterprise Plan."
            : "Halo Tim Huntr, saya tertarik dengan paket Enterprise Huntr.id",
        );
        window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
      }
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, maxWidth: 860 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("settings.subscription.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("settings.subscription.subtitle")}
        </Typography>
      </Box>

      {/* AI Usage Card Section */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Bot size={15} color={theme.palette.primary.main} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
              {t("settings.subscription.aiUsageSection", {
                month: usageData?.month || t("settings.subscription.thisMonth"),
              })}
            </Typography>
          </Stack>

          <Button
            size="small"
            variant="text"
            color="primary"
            onClick={fetchUsage}
            disabled={loadingUsage}
            startIcon={<RefreshCw size={12} className={loadingUsage ? "animate-spin" : ""} />}
            sx={{ textTransform: "none", fontSize: 11, fontWeight: 700, p: 0.5 }}
          >
            {t("settings.subscription.refresh")}
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "background.paper" }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", mb: 0.5 }}>
                  <Cpu size={14} color={theme.palette.primary.main} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {t("settings.subscription.totalAiRequests")}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {usageData?.total_requests?.toLocaleString(numberLocale) ?? 0}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                    / {usageData?.limit?.toLocaleString(numberLocale) ?? "–"} req
                  </Typography>
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", mb: 0.5 }}>
                  <Zap size={14} color="#f59e0b" />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {t("settings.subscription.tokensConsumed")}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {usageData?.total_tokens?.toLocaleString(numberLocale) ?? 0}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                    tokens
                  </Typography>
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", mb: 0.5 }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {t("settings.subscription.quotaStatus")}
                  </Typography>
                </Stack>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: aiQuotaExhausted ? "error.main" : "success.main",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: aiQuotaExhausted ? "error.main" : "success.main",
                    }}
                  />
                  {usageData?.limit !== undefined
                    ? `${(usageData.remaining ?? 0).toLocaleString(numberLocale)} tersisa`
                    : subscription?.enterprise_plan
                    ? "Tersedia"
                    : t("settings.subscription.trialUnlimited")}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {usageData?.limit !== undefined && usageData.limit > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  {usageData.plan_name ?? "Paket Enterprise"}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {Math.min(100, Math.round(((usageData.total_requests ?? 0) / usageData.limit) * 100))}% digunakan
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, ((usageData.total_requests ?? 0) / usageData.limit) * 100)}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
          )}
        </Paper>
      </Box>

      {/* GMV Quota if applicable */}
      {subscription && !subscription.enterprise_plan && subscription.gmv_limit > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
              {t("settings.subscription.gmvQuota")}
            </Typography>
            <Chip
              size="small"
              label={
                subscription.status === "active"
                  ? t("settings.subscription.statusActive")
                  : t("settings.subscription.statusNeedsRenewal")
              }
              color={subscription.status === "active" ? "success" : "warning"}
              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
            />
          </Stack>

          <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "background.paper" }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-end" } }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("settings.subscription.realizedGmv")}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {formatRupiah(subscription.current_realized_gmv + subscription.reserved_gmv)}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      / {formatRupiah(subscription.gmv_limit)}
                    </Typography>
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {t("settings.subscription.remainingGmv", {
                    amount: formatRupiah(subscription.available_gmv),
                  })}
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={quotaPercent}
                sx={{ height: 8, borderRadius: 1 }}
              />

              <Typography variant="caption" color="text.secondary">
                {t("settings.subscription.gmvLimitFeeNote", {
                  fee: formatRupiah(subscription.upfront_fee),
                  date: new Date(subscription.ends_at).toLocaleDateString(numberLocale),
                  overflowNote:
                    subscription.overflow_strategy === "transaction_fee"
                      ? t("settings.subscription.overflowTransactionFee")
                      : t("settings.subscription.overflowNewContract"),
                })}
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}

      {/* Enterprise Plan Card vs Current Plan */}
      {subscription?.enterprise_plan ? (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: "background.paper" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {subscription.is_trial
                  ? "Trial Enterprise Pro"
                  : ({ enterprise_starter: "Enterprise Starter", enterprise_growth: "Enterprise Growth", enterprise_pro: "Enterprise Pro" } as Record<string, string>)[subscription.enterprise_plan] || subscription.enterprise_plan}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subscription.is_trial
                  ? enterpriseTrialActive
                    ? "Trial aktif"
                    : "Trial telah berakhir"
                  : subscription.status === "active" && new Date(subscription.ends_at).getTime() > Date.now()
                  ? "Aktif"
                  : "Perlu diperpanjang"}
                {" · "}Berlaku hingga {new Date(subscription.ends_at).toLocaleDateString(numberLocale)}
              </Typography>
            </Box>

            {(enterpriseTrialExpired || canOfferUpgrade) && canManageSubscription && (
              <Button
                variant="contained"
                color="primary"
                onClick={openUpgradeOptions}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, fontSize: 13 }}
              >
                Upgrade paket
              </Button>
            )}
          </Stack>

          {subscription.scheduled_change && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
              Upgrade ke {({ enterprise_starter: "Enterprise Starter", enterprise_growth: "Enterprise Growth", enterprise_pro: "Enterprise Pro" } as Record<string, string>)[subscription.scheduled_change.enterprise_plan] || subscription.scheduled_change.enterprise_plan} berlaku mulai {subscription.scheduled_change.starts_at ? new Date(subscription.scheduled_change.starts_at).toLocaleDateString(numberLocale) : "akhir periode paket ini"}.
            </Typography>
          )}

          {subscription.tax_quota && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              e-Faktur: {subscription.tax_quota.used.toLocaleString(numberLocale)} / {subscription.tax_quota.limit.toLocaleString(numberLocale)} dokumen digunakan · Tahun paket berakhir {new Date(subscription.tax_quota.ends_at).toLocaleDateString(numberLocale)}
            </Typography>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", px: 0.5 }}>
            {t("settings.subscription.currentPlan")}
          </Typography>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, bgcolor: "background.paper" }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                      color: "primary.main",
                    }}
                  >
                    <Zap size={24} />
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {activeCompany?.type === "vendor"
                          ? t("settings.subscription.vendorFreeTitle")
                          : t("settings.subscription.buyerTrialTitle")}
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          activeCompany?.type === "vendor"
                            ? t("settings.subscription.vendorFreeBadge")
                            : t("settings.subscription.buyerTrialBadge")
                        }
                        color="primary"
                        variant="outlined"
                        sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {activeCompany?.type === "vendor"
                        ? t("settings.subscription.vendorFreeDesc")
                        : t("settings.subscription.buyerTrialDesc")}
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  {activeCompany?.type === "vendor" ? (
                    <Chip size="small" label="Gratis" color="success" sx={{ fontWeight: 700 }} />
                  ) : trial.isExpired ? (
                    <Chip size="small" label={t("settings.subscription.statusExpired")} color="error" sx={{ fontWeight: 700 }} />
                  ) : trial.isUrgent ? (
                    <Chip size="small" label={t("settings.subscription.statusExpiringSoon")} color="warning" sx={{ fontWeight: 700 }} />
                  ) : (
                    <Chip size="small" label={t("settings.subscription.statusActive")} color="success" sx={{ fontWeight: 700 }} />
                  )}
                </Box>
              </Stack>

              {/* Progress Timeline for Buyer */}
              {activeCompany?.type !== "vendor" && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.primary" }}>
                        <Clock size={15} color={theme.palette.primary.main} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {t("settings.subscription.remainingTrialTime")}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                        {trial.isExpired
                          ? t("settings.subscription.expiredTime")
                          : t("settings.subscription.daysRemainingText", {
                              days: trial.daysRemaining,
                            })}
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={trial.percentRemaining}
                      sx={{ height: 6, borderRadius: 1 }}
                    />

                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("settings.subscription.validUntil")}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {trial.formattedEndDate}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {/* Features Matrix */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.05em", color: "text.secondary", display: "block", mb: 1.5 }}>
                  {t("settings.subscription.featuresIncluded")}
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    t("settings.subscription.features.unlimitedPrRfq"),
                    t("settings.subscription.features.multiTierApproval"),
                    t("settings.subscription.features.aiAgentic"),
                    t("settings.subscription.features.efakturVat"),
                    t("settings.subscription.features.liveBidding"),
                    t("settings.subscription.features.teamInvites"),
                  ].map((feat, i) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={i}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <ShieldCheck size={16} color="#10b981" />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                          {feat}
                        </Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              {/* Contact Sales Action */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                <Typography variant="caption" color="text.secondary">
                  {t("settings.subscription.upgradePrompt")}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleContactSales}
                  startIcon={<PhoneCall size={14} />}
                  endIcon={<ArrowRight size={14} />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    px: 2.5,
                  }}
                >
                  {t("settings.subscription.contactSalesBtn")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}

      {enterprisePlanSelector}
    </Box>
  );
}
