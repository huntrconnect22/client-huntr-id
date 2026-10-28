import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  Warehouse,
  XCircle,
} from "lucide-react";
import {
  adminAssignCompanyEnterprisePlan,
  adminGetCompanySubscription,
  adminGrantCompanyEnterpriseTrial,
  adminRevokeCompanyEnterpriseEntitlement,
} from "../../lib/api";
import type { Company } from "./shared";

type EnterprisePlan = {
  key: "enterprise_starter" | "enterprise_growth" | "enterprise_pro";
  name: string;
  monthly_price: number;
  annual_price: number;
  users: number;
  companies: number;
  tax_documents_per_year: number;
  support: string;
  warehouses: number;
  ai_requests_per_month: number;
  crm?: boolean;
};

type Subscription = {
  enterprise_plan?: string | null;
  billing_cycle?: "monthly" | "annual" | "trial" | null;
  is_trial?: boolean;
  status?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  tax_quota?: { limit: number; used: number } | null;
  ai_quota?: {
    limit: number;
    total_requests: number;
    remaining: number;
  } | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const planLabel = (key?: string | null) =>
  key?.replace(/^enterprise_/, "Enterprise ").replaceAll("_", " ") ??
  "Belum ada paket";

export default function CompanySubscriptionTab({
  company,
}: {
  company: Company;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<EnterprisePlan[]>([]);
  const [selectedPlan, setSelectedPlan] =
    useState<EnterprisePlan["key"]>("enterprise_starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialSaving, setTrialSaving] = useState(false);
  const [revokeSaving, setRevokeSaving] = useState(false);
  const [hasEnterpriseHistory, setHasEnterpriseHistory] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminGetCompanySubscription(company.id);
      const nextSubscription = response?.subscription ?? null;
      const nextPlans = (response?.enterprise_catalog ??
        []) as EnterprisePlan[];
      setSubscription(nextSubscription);
      setPlans(nextPlans);
      setHasEnterpriseHistory(Boolean(response?.has_enterprise_history));
      const currentPlan = nextSubscription?.enterprise_plan as
        | EnterprisePlan["key"]
        | undefined;
      if (currentPlan && nextPlans.some((plan) => plan.key === currentPlan))
        setSelectedPlan(currentPlan);
      if (
        nextSubscription?.billing_cycle === "monthly" ||
        nextSubscription?.billing_cycle === "annual"
      ) {
        setBillingCycle(nextSubscription.billing_cycle);
      }
    } catch (error: any) {
      setMessage({
        tone: "error",
        text: error.message || "Data paket perusahaan tidak dapat dimuat.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [company.id]);

  const selected = useMemo(
    () => plans.find((plan) => plan.key === selectedPlan),
    [plans, selectedPlan],
  );

  const applyPlan = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await adminAssignCompanyEnterprisePlan(company.id, {
        enterprise_plan: selectedPlan,
        billing_cycle: billingCycle,
      });
      setSubscription(response.subscription);
      setMessage({
        tone: "success",
        text: "Paket Enterprise telah diterapkan dan masa aktifnya dimulai hari ini.",
      });
    } catch (error: any) {
      setMessage({
        tone: "error",
        text: error.message || "Paket Enterprise gagal diterapkan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const grantTrial = async () => {
    setTrialSaving(true);
    setMessage(null);
    try {
      const response = await adminGrantCompanyEnterpriseTrial(company.id);
      setSubscription(response.subscription);
      setHasEnterpriseHistory(true);
      setSelectedPlan("enterprise_pro");
      setMessage({
        tone: "success",
        text:
          response.message ||
          "Trial Enterprise Pro 14 hari berhasil diberikan.",
      });
    } catch (error: any) {
      setMessage({
        tone: "error",
        text: error.message || "Trial Enterprise gagal diberikan.",
      });
    } finally {
      setTrialSaving(false);
    }
  };

  const revokeEntitlement = async () => {
    const confirmation = await Swal.fire({
      title: "Cabut hak paket Enterprise?",
      text: "Akses Enterprise perusahaan ini akan berhenti sekarang. Riwayat subscription tetap tersimpan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cabut hak paket",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmation.isConfirmed) return;

    setRevokeSaving(true);
    setMessage(null);
    try {
      const response = await adminRevokeCompanyEnterpriseEntitlement(
        company.id,
      );
      setSubscription(response.subscription);
      setMessage({
        tone: "success",
        text: response.message || "Hak paket Enterprise berhasil dicabut.",
      });
    } catch (error: any) {
      setMessage({
        tone: "error",
        text: error.message || "Hak paket Enterprise gagal dicabut.",
      });
    } finally {
      setRevokeSaving(false);
    }
  };

  if (company.type !== "buyer") {
    return (
      <div
        style={{
          padding: 28,
          textAlign: "center",
          color: "var(--ui-text-muted)",
          fontSize: 13,
        }}
      >
        <Building2 size={24} style={{ marginBottom: 8, opacity: 0.55 }} />
        <div>Vendor tidak memerlukan paket Enterprise.</div>
      </div>
    );
  }

  if (loading)
    return (
      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <Loader2 className="animate-spin" size={24} color="var(--ui-primary)" />
      </div>
    );

  const active =
    subscription?.status === "active" &&
    (!subscription.ends_at ||
      new Date(subscription.ends_at).getTime() > Date.now());
  const revoked = subscription?.status === "revoked";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section
        style={{
          border: "1px solid var(--ui-border)",
          background: "var(--ui-bg-input)",
          padding: 16,
          borderRadius: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: active ? "#059669" : "var(--ui-text-muted)",
              }}
            >
              <ShieldCheck size={14} />{" "}
              {active
                ? "Paket aktif"
                : revoked
                  ? "Hak paket dicabut"
                  : "Paket belum aktif"}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--ui-text-primary)",
                marginTop: 5,
              }}
            >
              {planLabel(subscription?.enterprise_plan)}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ui-text-muted)",
                marginTop: 3,
              }}
            >
              {revoked
                ? "Dicabut oleh admin"
                : subscription?.is_trial
                  ? "Masa trial"
                  : subscription?.billing_cycle === "annual"
                    ? "Tagihan tahunan"
                    : "Tagihan bulanan"}{" "}
              · berakhir {formatDate(subscription?.ends_at)}
            </div>
          </div>
          {subscription?.is_trial && (
            <span
              style={{
                color: "#9a6700",
                background: "#fff4cc",
                border: "1px solid #f0d481",
                borderRadius: 5,
                padding: "4px 7px",
                fontSize: 11,
                fontWeight: 750,
              }}
            >
              TRIAL
            </span>
          )}
        </div>
        {active && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 8,
              marginTop: 14,
            }}
          >
            <Metric
              label="Mulai"
              value={formatDate(subscription?.starts_at)}
              icon={<CalendarDays size={13} />}
            />
            <Metric
              label="e-Faktur"
              value={
                subscription.tax_quota
                  ? `${subscription.tax_quota.used.toLocaleString("id-ID")} / ${subscription.tax_quota.limit.toLocaleString("id-ID")}`
                  : "—"
              }
              icon={<Check size={13} />}
            />
            <Metric
              label="AI bulan ini"
              value={
                subscription.ai_quota
                  ? `${subscription.ai_quota.total_requests.toLocaleString("id-ID")} / ${subscription.ai_quota.limit.toLocaleString("id-ID")}`
                  : "—"
              }
              icon={<Sparkles size={13} />}
            />
          </div>
        )}
      </section>

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "end",
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--ui-text-primary)",
              }}
            >
              Tetapkan paket Enterprise
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "var(--ui-text-muted)",
              }}
            >
              Penetapan ini langsung mengganti paket atau trial yang sedang
              berjalan.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid var(--ui-border)",
              borderRadius: 7,
              overflow: "hidden",
            }}
          >
            {(["annual", "monthly"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                style={{
                  border: 0,
                  cursor: "pointer",
                  padding: "7px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color:
                    billingCycle === cycle
                      ? "#fff"
                      : "var(--ui-text-secondary)",
                  background:
                    billingCycle === cycle
                      ? "var(--ui-primary)"
                      : "var(--ui-bg-card)",
                }}
              >
                {cycle === "annual" ? "Tahunan" : "Bulanan"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {plans.map((plan) => {
            const isSelected = plan.key === selectedPlan;
            const isCurrent =
              subscription?.enterprise_plan === plan.key && active;
            const price =
              billingCycle === "annual"
                ? plan.annual_price
                : plan.monthly_price;
            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => setSelectedPlan(plan.key)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${isSelected ? "var(--ui-primary)" : "var(--ui-border)"}`,
                  borderRadius: 8,
                  padding: 13,
                  cursor: "pointer",
                  background: isSelected
                    ? "var(--ui-primary-muted)"
                    : "var(--ui-bg-card)",
                  color: "var(--ui-text-primary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      {plan.name}
                    </div>
                    <div
                      style={{
                        color: "var(--ui-text-muted)",
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {formatCurrency(price)} /{" "}
                      {billingCycle === "annual" ? "tahun" : "bulan"}
                    </div>
                  </div>
                  {isCurrent && (
                    <span
                      style={{
                        color: "#047857",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      PAKET SAAT INI
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "5px 12px",
                    marginTop: 10,
                    fontSize: 11,
                    color: "var(--ui-text-secondary)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Users size={12} /> {plan.users} pengguna
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Building2 size={12} /> {plan.companies} perusahaan
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Warehouse size={12} /> {plan.warehouses} warehouse
                  </span>
                  <span>
                    {plan.tax_documents_per_year.toLocaleString("id-ID")}{" "}
                    e-Faktur/tahun
                  </span>
                  <span>
                    {plan.ai_requests_per_month.toLocaleString("id-ID")}{" "}
                    AI/bulan
                  </span>
                  {plan.crm && <span>CRM Enterprise</span>}
                  <span>{plan.support}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {message && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 11px",
            fontSize: 12,
            borderRadius: 7,
            color: message.tone === "success" ? "#047857" : "#b42318",
            background: message.tone === "success" ? "#ecfdf3" : "#fef3f2",
            border: `1px solid ${message.tone === "success" ? "#a7f3d0" : "#fecdca"}`,
          }}
        >
          {message.tone === "success" ? (
            <Check size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={grantTrial}
            disabled={trialSaving || saving || revokeSaving}
            style={{
              border: "1px solid var(--ui-border-input)",
              borderRadius: 7,
              padding: "10px 12px",
              cursor: trialSaving ? "wait" : "pointer",
              background: "var(--ui-bg-card)",
              color: "var(--ui-text-primary)",
              fontWeight: 750,
              fontSize: 12,
              display: "inline-flex",
              gap: 7,
              alignItems: "center",
              opacity: trialSaving || saving || revokeSaving ? 0.55 : 1,
            }}
          >
            {trialSaving ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Clock3 size={15} />
            )}
            {trialSaving
              ? "Memberikan trial…"
              : hasEnterpriseHistory
                ? "Berikan retrial 14 hari"
                : "Mulai trial 14 hari"}
          </button>
          {active && (
            <button
              type="button"
              onClick={revokeEntitlement}
              disabled={saving || trialSaving || revokeSaving}
              style={{
                border: "1px solid #fecaca",
                borderRadius: 7,
                padding: "10px 12px",
                cursor: revokeSaving ? "wait" : "pointer",
                background: "#fff",
                color: "#b42318",
                fontWeight: 750,
                fontSize: 12,
                display: "inline-flex",
                gap: 7,
                alignItems: "center",
                opacity: saving || trialSaving || revokeSaving ? 0.55 : 1,
              }}
            >
              {revokeSaving ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <XCircle size={15} />
              )}
              {revokeSaving ? "Mencabut hak…" : "Cabut hak paket"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={applyPlan}
          disabled={saving || trialSaving || revokeSaving || !selected}
          style={{
            border: 0,
            borderRadius: 7,
            padding: "10px 14px",
            cursor: saving ? "wait" : "pointer",
            background: "var(--ui-primary)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 12,
            display: "inline-flex",
            gap: 7,
            alignItems: "center",
            opacity:
              saving || trialSaving || revokeSaving || !selected ? 0.55 : 1,
          }}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <Check size={15} />
          )}
          {saving
            ? "Menerapkan paket…"
            : `Terapkan ${selected?.name ?? "paket"}`}
        </button>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "8px 9px",
        border: "1px solid var(--ui-border)",
        borderRadius: 7,
        background: "var(--ui-bg-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: "var(--ui-text-muted)",
          fontSize: 10,
          fontWeight: 750,
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          marginTop: 3,
          color: "var(--ui-text-primary)",
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {value}
      </div>
    </div>
  );
}
