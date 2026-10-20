import { useState } from "react";
import type { EnterpriseCatalog } from "../../../lib/api/subscription";
import type { SubscriptionPurchase } from "./SubscriptionCheckout";

const rupiah = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

export function EnterprisePlanOptions({
  catalog,
  canManage,
  onSelect,
  activePlan,
  subscriptionReady,
}: {
  catalog: EnterpriseCatalog;
  canManage: boolean;
  onSelect: (purchase: SubscriptionPurchase) => void;
  activePlan: string | null;
  subscriptionReady: boolean;
}) {
  const [annual, setAnnual] = useState(true);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="m-0 text-base font-bold text-[var(--ui-text-primary)]">
          Pilih paket Enterprise
        </h3>
        <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
          Onboarding standar {catalog.onboarding_business_days.min}–
          {catalog.onboarding_business_days.max} hari kerja. Vendor tetap
          gratis.
        </p>
      </div>
      <div
        className="inline-flex border border-[var(--ui-border)] p-0.5 text-xs"
        aria-label="Periode pembayaran"
      >
        <button
          type="button"
          onClick={() => setAnnual(false)}
          aria-pressed={!annual}
          className={`px-3 py-2 ${!annual ? "bg-orange-600 !text-white" : "text-[var(--ui-text-secondary)]"}`}
        >
          Bulanan
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          aria-pressed={annual}
          className={`px-3 py-2 ${annual ? "bg-orange-600 !text-white" : "text-[var(--ui-text-secondary)]"}`}
        >
          Tahunan
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {catalog.plans.map((plan, index) => {
          const amount = annual ? plan.annual_price : plan.monthly_price;
          const activeIndex = activePlan
            ? catalog.plans.findIndex((item) => item.key === activePlan)
            : -1;
          const isCurrentPlan = activePlan === plan.key;
          const canUpgrade = activeIndex >= 0 && index > activeIndex;
          const unavailable = activeIndex >= 0 && !isCurrentPlan && !canUpgrade;
          const disabled =
            !catalog.checkout_enabled ||
            !canManage ||
            !subscriptionReady ||
            amount === null ||
            unavailable;
          const buttonLabel = isCurrentPlan
            ? "Kelola add-on"
            : canUpgrade
              ? "Upgrade paket"
              : unavailable
                ? "Paket lebih rendah"
                : "Pilih paket";

          return (
            <article
              key={plan.key}
              className="flex flex-col border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4"
            >
              <h4 className="m-0 text-sm font-semibold">{plan.name}</h4>
              <p className="mb-1 mt-4 text-lg font-bold">
                {amount === null ? "Hubungi kami" : rupiah(amount)}
              </p>
              <p className="m-0 min-h-8 text-xs text-[var(--ui-text-muted)]">
                {amount === null
                  ? "Detail paket tersedia melalui tim Huntr."
                  : annual
                    ? `per tahun, dibayar di muka · setara ${rupiah(Math.round(amount / 12))}/bulan`
                    : "per bulan"}
              </p>
              <ul className="my-4 flex-1 space-y-2 border-t border-[var(--ui-border)] pt-4 text-xs text-[var(--ui-text-secondary)]">
                <li>
                  {plan.users === null
                    ? "Pengguna: hubungi kami"
                    : `${plan.users} pengguna`}
                </li>
                <li>
                  {plan.companies === null
                    ? "Company: hubungi kami"
                    : `${plan.companies} company`}
                </li>
                <li>
                  {plan.tax_documents_per_year === null
                    ? "e-Faktur: hubungi kami"
                    : `${plan.tax_documents_per_year.toLocaleString("id-ID")} dokumen e-Faktur/tahun`}
                </li>
                <li>
                  {plan.support === null
                    ? "SLA support: hubungi kami"
                    : `SLA support: ${plan.support}`}
                </li>
                <li>
                  {plan.warehouses === null
                    ? "WMS: hubungi kami"
                    : `WMS ${plan.warehouses} warehouse`}
                </li>
                <li>
                  {plan.ai_requests_per_month === null
                    ? "AI: hubungi kami"
                    : `${plan.ai_requests_per_month.toLocaleString("id-ID")} request AI/bulan`}
                </li>
              </ul>
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  amount !== null &&
                  onSelect({
                    purchase_type: isCurrentPlan ? "addon" : "plan",
                    key: plan.key,
                    name: plan.name,
                    billing_cycle: annual ? "annual" : "monthly",
                    unit_price: amount,
                  })
                }
                className="border border-orange-500 px-3 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-500/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!catalog.checkout_enabled ? "Checkout belum tersedia" : buttonLabel}
              </button>
            </article>
          );
        })}
      </div>
      {!subscriptionReady && (
        <p className="text-xs text-[var(--ui-text-muted)]">
          Status langganan belum tersedia. Jika terlalu lama, muat ulang
          halaman.
        </p>
      )}
      {!canManage && (
        <p className="text-xs text-[var(--ui-text-muted)]">
          Hanya owner atau manager yang dapat mengelola pembayaran.
        </p>
      )}
    </div>
  );
}
