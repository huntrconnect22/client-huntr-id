import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  WalletCards,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  activateBudgetCycle,
  approveProcurementPlan,
  createBudgetCycle,
  createBudgetLine,
  createProcurementPlan,
  getBudgetDashboard,
  linkProcurementPlanPo,
  linkProcurementPlanRfq,
  recordProcurementPlanActual,
  rejectProcurementPlan,
  submitProcurementPlan,
} from "../../lib/api/budgeting";
import { useLanguage } from "../../context/LanguageContext";
import { badge, button, card, date, input, money } from "./budget-utils";

type ModalKind = "cycle" | "line" | "plan" | "link-rfq" | "link-po" | "actual" | null;

export function BudgetWorkspace({ company }: { company: { id: string; name?: string } }) {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"overview" | "allocations" | "plans">("overview");
  const [modal, setModal] = useState<ModalKind>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reload = async (cycleId?: string) => {
    setLoading(true);
    setError("");
    try {
      setData(await getBudgetDashboard(company.id, cycleId));
    } catch (e: any) {
      setError(e.message || t("budgeting.alerts.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [company.id]);

  const cycle = data?.cycle;
  const plans = data?.plans ?? [];
  const summary = data?.summary ?? {};
  const currency = cycle?.currency ?? "IDR";
  const open = (kind: ModalKind, plan?: any) => {
    setSelectedPlan(plan ?? null);
    setModal(kind);
  };
  const close = () => {
    setModal(null);
    setSelectedPlan(null);
  };

  const action = async (fn: () => Promise<any>, success: string) => {
    setSaving(true);
    setError("");
    try {
      await fn();
      await reload(cycle?.id);
      await Swal.fire({
        icon: "success",
        title: success,
        timer: 1300,
        showConfirmButton: false,
      });
      close();
    } catch (e: any) {
      setError(e.message || t("budgeting.alerts.actionFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <Loading t={t} />;
  if (error && !data) return <ErrorState message={error} onRetry={() => reload()} t={t} />;

  const tabs: [key: "overview" | "allocations" | "plans", label: string][] = [
    ["overview", t("budgeting.tabs.overview")],
    ["allocations", t("budgeting.tabs.allocations")],
    ["plans", t("budgeting.tabs.plans")],
  ];

  return (
    <section className="space-y-5">
      <header className={`${card} border-l-4 border-l-[var(--ui-text-brand)] px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[var(--ui-text-brand)]">
              <WalletCards size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                {t("budgeting.enterpriseProBadge")}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-[var(--ui-text-primary)]">
              {t("budgeting.pageTitle")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--ui-text-muted)]">
              {t("budgeting.heroDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reload(cycle?.id)}
              className="border border-[var(--ui-border)] p-2 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)]"
              title={t("budgeting.refreshTooltip")}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => open("plan")}
              disabled={!cycle || cycle.status !== "active"}
              className={button}
            >
              <Plus size={16} />
              {t("budgeting.newPlanBtn")}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--ui-border)] pt-3">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-sm font-semibold ${
                tab === key
                  ? "bg-[var(--ui-text-brand)] text-white"
                  : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)]"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            aria-label={t("budgeting.selectPeriod")}
            className="ml-auto border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-2 text-sm"
            value={cycle?.id ?? ""}
            onChange={(e) => reload(e.target.value)}
          >
            <option value="">{t("budgeting.selectPeriod")}</option>
            {(data?.cycles ?? []).map((row: any) => (
              <option key={row.id} value={row.id}>
                {row.name} · FY {row.fiscal_year}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!cycle ? (
        <EmptyBudget onCreate={() => open("cycle")} t={t} />
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {cycle.status !== "active" && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <span>
                <b>{cycle.name}</b> {t("budgeting.cycleDraftWarning")}
              </span>
              <button
                onClick={() =>
                  action(
                    () => activateBudgetCycle(company.id, cycle.id),
                    t("budgeting.periodActiveSuccess")
                  )
                }
                className="border border-amber-500/50 px-3 py-1.5 font-semibold"
              >
                {t("budgeting.activateCycleBtn")}
              </button>
            </div>
          )}
          {tab === "overview" && (
            <Overview
              currency={currency}
              summary={summary}
              lines={data?.lines ?? []}
              plans={plans}
              onOpen={open}
              t={t}
              locale={locale}
            />
          )}
          {tab === "allocations" && (
            <Allocations
              currency={currency}
              cycle={cycle}
              lines={data?.lines ?? []}
              onCreate={() => open("line")}
              t={t}
              locale={locale}
            />
          )}
          {tab === "plans" && (
            <Plans
              currency={currency}
              plans={plans}
              onOpen={open}
              onAction={action}
              companyId={company.id}
              t={t}
              locale={locale}
            />
          )}
        </>
      )}

      {modal && (
        <BudgetModal
          kind={modal}
          companyId={company.id}
          cycle={cycle}
          lines={data?.lines ?? []}
          plan={selectedPlan}
          rfqs={data?.rfqs ?? []}
          purchaseOrders={data?.purchase_orders ?? []}
          saving={saving}
          onClose={close}
          onSubmit={action}
          t={t}
          locale={locale}
        />
      )}
    </section>
  );
}

function Overview({ currency, summary, lines, plans, onOpen, t, locale }: any) {
  const stats = [
    [t("budgeting.stats.allocated"), summary.allocated_amount, t("budgeting.stats.allocatedHint")],
    [
      t("budgeting.stats.committed"),
      summary.committed_amount,
      t("budgeting.stats.committedHint", { percent: summary.utilization_percent || 0 }),
    ],
    [t("budgeting.stats.actual"), summary.actual_amount, t("budgeting.stats.actualHint")],
    [t("budgeting.stats.available"), summary.available_amount, t("budgeting.stats.availableHint")],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-px overflow-hidden border border-[var(--ui-border)] bg-[var(--ui-border)] sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label as string} className="bg-[var(--ui-bg-card)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
              {label}
            </div>
            <div className="mt-2 text-xl font-bold text-[var(--ui-text-primary)]">
              {money(value, currency, locale)}
            </div>
            <div className="mt-1 text-xs text-[var(--ui-text-muted)]">{hint}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className={`${card} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[var(--ui-text-primary)]">
                {t("budgeting.overview.allocationUsageTitle")}
              </h3>
              <p className="text-xs text-[var(--ui-text-muted)]">
                {t("budgeting.overview.allocationUsageDesc")}
              </p>
            </div>
            <button
              onClick={() => onOpen("line")}
              className="text-sm font-semibold text-[var(--ui-text-brand)]"
            >
              {t("budgeting.overview.addAllocationBtn")}
            </button>
          </div>
          <div className="space-y-3">
            {lines.length ? (
              lines.slice(0, 6).map((line: any) => (
                <AllocationUtilization key={line.id} line={line} currency={currency} locale={locale} t={t} />
              ))
            ) : (
              <p className="py-7 text-center text-sm text-[var(--ui-text-muted)]">
                {t("budgeting.overview.noAllocations")}
              </p>
            )}
          </div>
        </div>
        <div className={`${card} p-4`}>
          <h3 className="font-bold text-[var(--ui-text-primary)]">
            {t("budgeting.overview.workflowTitle")}
          </h3>
          <ol className="mt-3 space-y-3 text-sm text-[var(--ui-text-muted)]">
            <li>
              <b className="text-[var(--ui-text-primary)]">
                {t("budgeting.overview.step1Title")}
              </b>
              <br />
              {t("budgeting.overview.step1Desc")}
            </li>
            <li>
              <b className="text-[var(--ui-text-primary)]">
                {t("budgeting.overview.step2Title")}
              </b>
              <br />
              {t("budgeting.overview.step2Desc")}
            </li>
            <li>
              <b className="text-[var(--ui-text-primary)]">
                {t("budgeting.overview.step3Title")}
              </b>
              <br />
              {t("budgeting.overview.step3Desc")}
            </li>
          </ol>
        </div>
      </div>
      <div className={`${card} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[var(--ui-text-primary)]">
              {t("budgeting.overview.recentPlansTitle")}
            </h3>
            <p className="text-xs text-[var(--ui-text-muted)]">
              {t("budgeting.overview.recentPlansDesc")}
            </p>
          </div>
          <button
            onClick={() => onOpen("plan")}
            className="text-sm font-semibold text-[var(--ui-text-brand)]"
          >
            {t("budgeting.overview.createPlanBtn")}
          </button>
        </div>
        <PlanRows plans={plans.slice(0, 5)} currency={currency} t={t} locale={locale} />
      </div>
    </div>
  );
}

function AllocationUtilization({ line, currency, locale, t }: any) {
  const allocated = Number(line.allocated_amount || 0);
  const committed = Number(line.committed_amount || 0);
  const remaining = allocated - committed;
  const rawPercent = allocated > 0 ? (committed / allocated) * 100 : 0;
  const percent = Math.max(0, Math.round(rawPercent * 10) / 10);
  const visualPercent = committed > 0 ? Math.max(2, Math.min(100, percent)) : 0;
  const commitmentCount = Number(line.commitment_count || 0);
  const isOverBudget = committed > allocated;

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-[var(--ui-text-primary)]">
          {line.code} · {line.name}
        </span>
        <span className="text-[var(--ui-text-muted)]">
          {money(committed, currency, locale)} / {money(allocated, currency, locale)}
        </span>
      </div>
      <div
        className="relative mt-1.5 h-2 overflow-hidden bg-[var(--ui-bg-input)]"
        role="progressbar"
        aria-label={`${line.code} ${t("budgeting.overview.allocationUsageTitle")}`}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, allocated)}
        aria-valuenow={Math.max(0, committed)}
      >
        {committed === 0 && <span className="absolute inset-y-0 left-0 w-px bg-[var(--ui-text-muted)]/70" />}
        <div
          className={`h-full transition-[width] duration-500 ${isOverBudget ? "bg-rose-500" : "bg-[var(--ui-text-brand)]"}`}
          style={{ width: `${visualPercent}%` }}
        />
      </div>
      <div className="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] text-[var(--ui-text-muted)]">
        <span className={isOverBudget ? "font-semibold text-rose-600 dark:text-rose-300" : ""}>
          {isOverBudget
            ? t("budgeting.overview.utilizationOverBudget")
            : t("budgeting.overview.utilizationPercent", { percent: percent.toLocaleString(locale, { maximumFractionDigits: 1 }) })}
        </span>
        <span>{t("budgeting.overview.utilizationPoCount", { count: commitmentCount })}</span>
        <span>{t("budgeting.overview.utilizationRemaining", { amount: money(Math.max(0, remaining), currency, locale) })}</span>
      </div>
      {commitmentCount === 0 && (
        <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
          {t("budgeting.overview.utilizationWaitingPo")}
        </p>
      )}
    </div>
  );
}

function Allocations({ currency, cycle, lines, onCreate, t, locale }: any) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3">
        <div>
          <h3 className="font-bold text-[var(--ui-text-primary)]">
            {t("budgeting.allocations.title", { name: cycle.name })}
          </h3>
          <p className="text-xs text-[var(--ui-text-muted)]">
            {t("budgeting.allocations.subtitle")}
          </p>
        </div>
        <button onClick={onCreate} className={button}>
          <Plus size={16} />
          {t("budgeting.allocations.addAllocationBtn")}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--ui-border)] text-xs uppercase tracking-wide text-[var(--ui-text-muted)]">
            <tr>
              <th className="px-4 py-3">{t("budgeting.allocations.thCode")}</th>
              <th>{t("budgeting.allocations.thDepartment")}</th>
              <th>{t("budgeting.allocations.thAllocated")}</th>
              <th>{t("budgeting.allocations.thCommitted")}</th>
              <th>{t("budgeting.allocations.thActual")}</th>
              <th className="pr-4 text-right">{t("budgeting.allocations.thRemaining")}</th>
            </tr>
          </thead>
          <tbody>
            {lines.length ? (
              lines.map((line: any) => (
                <tr key={line.id} className="border-b border-[var(--ui-border)] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--ui-text-primary)]">{line.code}</div>
                    <div className="text-xs text-[var(--ui-text-muted)]">
                      {line.name}
                      {line.category ? ` · ${line.category}` : ""}
                    </div>
                  </td>
                  <td>{line.department || t("budgeting.allocations.allDepartments")}</td>
                  <td>{money(line.allocated_amount, currency, locale)}</td>
                  <td>{money(line.committed_amount, currency, locale)}</td>
                  <td>{money(line.actual_amount, currency, locale)}</td>
                  <td className="pr-4 text-right font-semibold">
                    {money(line.available_amount, currency, locale)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--ui-text-muted)]">
                  {t("budgeting.allocations.noBudgetLines")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Plans({ currency, plans, onOpen, onAction, companyId, t, locale }: any) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="border-b border-[var(--ui-border)] px-4 py-3">
        <h3 className="font-bold text-[var(--ui-text-primary)]">
          {t("budgeting.plans.title")}
        </h3>
        <p className="text-xs text-[var(--ui-text-muted)]">
          {t("budgeting.plans.subtitle")}
        </p>
      </div>
      <div className="divide-y divide-[var(--ui-border)]">
        {plans.length ? (
          plans.map((plan: any) => (
            <div key={plan.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--ui-text-muted)]">
                      {plan.plan_number}
                    </span>
                    <span className={badge(plan.status)}>
                      {plan.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <h4 className="mt-1 font-bold text-[var(--ui-text-primary)]">{plan.title}</h4>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                    {plan.budget_line_code
                      ? `${plan.budget_line_code} · ${plan.budget_line_name}`
                      : t("budgeting.plans.unlinkedAllocation")}
                    {plan.department ? ` · ${plan.department}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--ui-text-primary)]">
                    {money(plan.planned_amount, currency, locale)}
                  </div>
                  <div className="text-xs text-[var(--ui-text-muted)]">
                    {date(plan.planned_start_at, locale)} — {date(plan.planned_end_at, locale)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.status === "draft" || plan.status === "rejected" ? (
                  <button
                    onClick={() =>
                      onAction(
                        () => submitProcurementPlan(companyId, plan.id),
                        t("budgeting.alerts.planSubmitted")
                      )
                    }
                    className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {t("budgeting.plans.submitApproval")}
                  </button>
                ) : null}
                {plan.status === "submitted" ? (
                  <>
                    <button
                      onClick={() =>
                        onAction(
                          () => approveProcurementPlan(companyId, plan.id),
                          t("budgeting.alerts.planApproved")
                        )
                      }
                      className="border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {t("budgeting.plans.approve")}
                    </button>
                    <button
                      onClick={() =>
                        onAction(
                          () => rejectProcurementPlan(companyId, plan.id),
                          t("budgeting.alerts.planRejected")
                        )
                      }
                      className="border border-rose-500/40 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300"
                    >
                      {t("budgeting.plans.reject")}
                    </button>
                  </>
                ) : null}
                {["approved", "in_progress"].includes(plan.status) ? (
                  <>
                    <button
                      onClick={() => onOpen("link-rfq", plan)}
                      className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {t("budgeting.plans.linkPr")}
                    </button>
                    <button
                      onClick={() => onOpen("link-po", plan)}
                      className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {t("budgeting.plans.linkPo")}
                    </button>
                    <button
                      onClick={() => onOpen("actual", plan)}
                      className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {t("budgeting.plans.recordActual")}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-12 text-center text-sm text-[var(--ui-text-muted)]">
            {t("budgeting.plans.noPlans")}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanRows({ plans, currency, t, locale }: any) {
  return (
    <div className="mt-3 divide-y divide-[var(--ui-border)]">
      {plans.length ? (
        plans.map((p: any) => (
          <div className="flex items-center justify-between gap-3 py-2.5 text-sm" key={p.id}>
            <div>
              <div className="font-medium text-[var(--ui-text-primary)]">{p.title}</div>
              <span className={badge(p.status)}>{p.status}</span>
            </div>
            <b className="text-[var(--ui-text-primary)]">{money(p.planned_amount, currency, locale)}</b>
          </div>
        ))
      ) : (
        <div className="py-6 text-center text-sm text-[var(--ui-text-muted)]">
          {t("budgeting.plans.noRecentPlans")}
        </div>
      )}
    </div>
  );
}

function EmptyBudget({ onCreate, t }: any) {
  return (
    <div className={`${card} px-6 py-14 text-center`}>
      <Landmark className="mx-auto text-[var(--ui-text-brand)]" size={36} />
      <h3 className="mt-4 text-lg font-bold text-[var(--ui-text-primary)]">
        {t("budgeting.empty.title")}
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--ui-text-muted)]">
        {t("budgeting.empty.desc")}
      </p>
      <button onClick={onCreate} className={`${button} mt-5`}>
        <Plus size={16} />
        {t("budgeting.empty.createCycleBtn")}
      </button>
    </div>
  );
}

function Loading({ t }: any) {
  return (
    <div className={`${card} flex min-h-64 items-center justify-center text-sm text-[var(--ui-text-muted)]`}>
      <Loader2 className="mr-2 animate-spin" size={18} />
      {t("budgeting.loading")}
    </div>
  );
}

function ErrorState({ message, onRetry, t }: any) {
  return (
    <div className={`${card} px-6 py-14 text-center`}>
      <AlertCircle className="mx-auto text-rose-500" />
      <p className="mt-3 text-sm text-[var(--ui-text-muted)]">{message}</p>
      <button onClick={onRetry} className={`${button} mt-4`}>
        {t("budgeting.tryAgain")}
      </button>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block text-sm font-semibold text-[var(--ui-text-secondary)]">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function BudgetModal({
  kind,
  companyId,
  cycle,
  lines,
  plan,
  rfqs,
  purchaseOrders,
  saving,
  onClose,
  onSubmit,
  t,
  locale,
}: any) {
  const isCycle = kind === "cycle";
  const isLine = kind === "line";
  const isPlan = kind === "plan";

  const title = isCycle
    ? t("budgeting.modals.createCycleTitle")
    : isLine
    ? t("budgeting.modals.addAllocationTitle")
    : isPlan
    ? t("budgeting.modals.createPlanTitle")
    : kind === "link-rfq"
    ? t("budgeting.modals.linkRfqTitle")
    : kind === "link-po"
    ? t("budgeting.modals.linkPoTitle")
    : t("budgeting.modals.recordActualTitle");

  const submit = async (e: any) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    if (isCycle)
      return onSubmit(
        () =>
          createBudgetCycle(companyId, {
            ...v,
            total_amount: Number(v.total_amount),
          }),
        t("budgeting.alerts.cycleCreated")
      );
    if (isLine)
      return onSubmit(
        () =>
          createBudgetLine(companyId, {
            ...v,
            budget_cycle_id: cycle.id,
            allocated_amount: Number(v.allocated_amount),
          }),
        t("budgeting.alerts.allocationCreated")
      );
    if (isPlan)
      return onSubmit(
        () =>
          createProcurementPlan(companyId, {
            ...v,
            budget_cycle_id: cycle.id,
            planned_amount: Number(v.planned_amount),
          }),
        t("budgeting.alerts.planCreated")
      );
    if (kind === "link-rfq")
      return onSubmit(
        () => linkProcurementPlanRfq(companyId, plan.id, String(v.rfq_id)),
        t("budgeting.alerts.prLinked")
      );
    if (kind === "link-po")
      return onSubmit(
        () =>
          linkProcurementPlanPo(
            companyId,
            plan.id,
            String(v.purchase_order_id),
            v.amount ? Number(v.amount) : undefined
          ),
        t("budgeting.alerts.poLinked")
      );
    return onSubmit(
      () =>
        recordProcurementPlanActual(
          companyId,
          plan.id,
          v.amount ? Number(v.amount) : undefined
        ),
      t("budgeting.alerts.actualRecorded")
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--ui-border)] px-5 py-4">
          <div>
            <h3 className="font-bold text-[var(--ui-text-primary)]">{title}</h3>
            <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
              {plan?.title || cycle?.name || t("budgeting.modals.modalSubtitleDefault")}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[var(--ui-text-muted)]">
            <X size={18} />
          </button>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {isCycle && (
            <>
              <Field label={t("budgeting.modals.fields.cycleName")}>
                <input
                  required
                  name="name"
                  className={input}
                  placeholder={t("budgeting.modals.fields.cycleNamePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.fiscalYear")}>
                <input
                  required
                  name="fiscal_year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.startsAt")}>
                <input
                  required
                  name="starts_at"
                  type="date"
                  defaultValue={`${new Date().getFullYear()}-01-01`}
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.endsAt")}>
                <input
                  required
                  name="ends_at"
                  type="date"
                  defaultValue={`${new Date().getFullYear()}-12-31`}
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.totalAmount")}>
                <input
                  required
                  name="total_amount"
                  type="number"
                  min="0"
                  className={input}
                  placeholder="0"
                />
              </Field>
              <Field label={t("budgeting.modals.fields.currency")}>
                <select name="currency" defaultValue="IDR" className={input}>
                  <option>IDR</option>
                  <option>USD</option>
                </select>
              </Field>
            </>
          )}
          {isLine && (
            <>
              <Field label={t("budgeting.modals.fields.allocationCode")}>
                <input
                  required
                  name="code"
                  className={input}
                  placeholder={t("budgeting.modals.fields.allocationCodePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.allocationName")}>
                <input
                  required
                  name="name"
                  className={input}
                  placeholder={t("budgeting.modals.fields.allocationNamePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.department")}>
                <input
                  name="department"
                  className={input}
                  placeholder={t("budgeting.modals.fields.departmentPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.category")}>
                <input
                  name="category"
                  className={input}
                  placeholder={t("budgeting.modals.fields.categoryPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.allocatedAmount")}>
                <input
                  required
                  name="allocated_amount"
                  type="number"
                  min="0"
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.currency")}>
                <select name="currency" defaultValue={cycle?.currency || "IDR"} className={input}>
                  <option>IDR</option>
                  <option>USD</option>
                </select>
              </Field>
            </>
          )}
          {isPlan && (
            <>
              <Field label={t("budgeting.modals.fields.planTitle")}>
                <input
                  required
                  name="title"
                  className={input}
                  placeholder={t("budgeting.modals.fields.planTitlePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.budgetAllocation")}>
                <select name="budget_line_id" className={input}>
                  <option value="">{t("budgeting.modals.fields.noSpecificAllocation")}</option>
                  {lines.map((line: any) => (
                    <option key={line.id} value={line.id}>
                      {line.code} · {line.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("budgeting.modals.fields.department")}>
                <input
                  name="department"
                  className={input}
                  placeholder={t("budgeting.modals.fields.departmentPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.category")}>
                <input
                  name="category"
                  className={input}
                  placeholder={t("budgeting.modals.fields.categoryPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.plannedAmount")}>
                <input
                  required
                  name="planned_amount"
                  type="number"
                  min="0"
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.priority")}>
                <select name="priority" className={input}>
                  <option value="normal">{t("budgeting.modals.fields.priorityNormal")}</option>
                  <option value="high">{t("budgeting.modals.fields.priorityHigh")}</option>
                  <option value="critical">{t("budgeting.modals.fields.priorityCritical")}</option>
                  <option value="low">{t("budgeting.modals.fields.priorityLow")}</option>
                </select>
              </Field>
              <Field label={t("budgeting.modals.fields.plannedStart")}>
                <input name="planned_start_at" type="date" className={input} />
              </Field>
              <Field label={t("budgeting.modals.fields.plannedEnd")}>
                <input name="planned_end_at" type="date" className={input} />
              </Field>
              <Field label={t("budgeting.modals.fields.description")}>
                <textarea
                  name="description"
                  className={`${input} min-h-20 sm:col-span-2`}
                  placeholder={t("budgeting.modals.fields.descriptionPlaceholder")}
                />
              </Field>
            </>
          )}
          {kind === "link-rfq" && (
            <Field label={t("budgeting.modals.fields.prSelect")}>
              <select required name="rfq_id" className={input}>
                <option value="">{t("budgeting.modals.fields.prSelectPlaceholder")}</option>
                {rfqs.map((rfq: any) => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.title} · {rfq.department || "Tanpa departemen"} · {rfq.status}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {kind === "link-po" && (
            <>
              <Field label={t("budgeting.modals.fields.poSelect")}>
                <select required name="purchase_order_id" className={input}>
                  <option value="">{t("budgeting.modals.fields.poSelectPlaceholder")}</option>
                  {purchaseOrders.map((po: any) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} ·{" "}
                      {money(po.total_amount, po.currency || cycle?.currency || "IDR", locale)} ·{" "}
                      {po.status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("budgeting.modals.fields.committedAmount")}>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  className={input}
                  placeholder={t("budgeting.modals.fields.committedAmountPlaceholder")}
                />
              </Field>
            </>
          )}
          {kind === "actual" && (
            <Field label={t("budgeting.modals.fields.actualAmount")}>
              <input
                name="amount"
                type="number"
                min="0"
                className={input}
                placeholder={t("budgeting.modals.fields.actualAmountPlaceholder")}
              />
            </Field>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--ui-border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--ui-border)] px-3 py-2 text-sm font-semibold"
          >
            {t("budgeting.modals.cancelBtn")}
          </button>
          <button disabled={saving} className={button}>
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {saving ? t("budgeting.modals.savingBtn") : t("budgeting.modals.saveBtn")}
          </button>
        </footer>
      </form>
    </div>
  );
}
