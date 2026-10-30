import { Button as HuntrButton } from "~/shared/ui/Button";
import { Select as HuntrSelect, Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  AlertCircle,
  Check,
  Landmark,
  Loader2,
  Plus,
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
type BudgetTab = "overview" | "allocations" | "plans";

export function BudgetWorkspace({ company }: { company: { id: string; name?: string } }) {
  const { t, locale } = useLanguage();
  const { search } = useLocation();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<BudgetTab>("overview");
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

  useEffect(() => {
    const tabByQuery: Record<string, BudgetTab> = {
      allocations: "allocations",
      plans: "plans",
    };
    const requestedTab = new URLSearchParams(search).get("tab");
    setTab(requestedTab ? (tabByQuery[requestedTab] ?? "overview") : "overview");
  }, [search]);

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
            <HuntrSelect
              aria-label={t("budgeting.selectPeriod")}
              className="max-w-[12rem] border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-2 py-2 text-sm"
              value={cycle?.id ?? ""}
              onChange={(e) => reload(e.target.value)}
            >
              <option value="">{t("budgeting.selectPeriod")}</option>
              {(data?.cycles ?? []).map((row: any) => (
                <option key={row.id} value={row.id}>
                  {row.name} · FY {row.fiscal_year}
                </option>
              ))}
            </HuntrSelect>
            <HuntrButton
              onClick={() => open("plan")}
              disabled={!cycle || cycle.status !== "active"}
              className={button}
            >
              <Plus size={16} />
              {t("budgeting.newPlanBtn")}
            </HuntrButton>
          </div>
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
              <HuntrButton
                onClick={() =>
                  action(
                    () => activateBudgetCycle(company.id, cycle.id),
                    t("budgeting.periodActiveSuccess")
                  )
                }
                className="border border-amber-500/50 px-3 py-1.5 font-semibold"
              >
                {t("budgeting.activateCycleBtn")}
              </HuntrButton>
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
            <HuntrButton
              onClick={() => onOpen("line")}
              className="text-sm font-semibold text-[var(--ui-text-brand)]"
            >
              {t("budgeting.overview.addAllocationBtn")}
            </HuntrButton>
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
          <HuntrButton
            onClick={() => onOpen("plan")}
            className="text-sm font-semibold text-[var(--ui-text-brand)]"
          >
            {t("budgeting.overview.createPlanBtn")}
          </HuntrButton>
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
        <HuntrButton onClick={onCreate} className={button}>
          <Plus size={16} />
          {t("budgeting.allocations.addAllocationBtn")}
        </HuntrButton>
      </div>
      <div className="overflow-x-auto">
        <HuntrTable className="w-full min-w-[760px] text-left text-sm">
          <HuntrTableHead className="border-b border-[var(--ui-border)] text-xs uppercase tracking-wide text-[var(--ui-text-muted)]">
            <HuntrTableRow>
              <HuntrTableHeaderCell className="px-4 py-3">{t("budgeting.allocations.thCode")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>{t("budgeting.allocations.thDepartment")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>{t("budgeting.allocations.thAllocated")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>{t("budgeting.allocations.thCommitted")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell>{t("budgeting.allocations.thActual")}</HuntrTableHeaderCell>
              <HuntrTableHeaderCell className="pr-4 text-right">{t("budgeting.allocations.thRemaining")}</HuntrTableHeaderCell>
            </HuntrTableRow>
          </HuntrTableHead>
          <HuntrTableBody>
            {lines.length ? (
              lines.map((line: any) => (
                <HuntrTableRow key={line.id} className="border-b border-[var(--ui-border)] last:border-0">
                  <HuntrTableCell className="px-4 py-3">
                    <div className="font-semibold text-[var(--ui-text-primary)]">{line.code}</div>
                    <div className="text-xs text-[var(--ui-text-muted)]">
                      {line.name}
                      {line.category ? ` · ${line.category}` : ""}
                    </div>
                  </HuntrTableCell>
                  <HuntrTableCell>{line.department || t("budgeting.allocations.allDepartments")}</HuntrTableCell>
                  <HuntrTableCell>{money(line.allocated_amount, currency, locale)}</HuntrTableCell>
                  <HuntrTableCell>{money(line.committed_amount, currency, locale)}</HuntrTableCell>
                  <HuntrTableCell>{money(line.actual_amount, currency, locale)}</HuntrTableCell>
                  <HuntrTableCell className="pr-4 text-right font-semibold">
                    {money(line.available_amount, currency, locale)}
                  </HuntrTableCell>
                </HuntrTableRow>
              ))
            ) : (
              <HuntrTableRow>
                <HuntrTableCell colSpan={6} className="px-4 py-12 text-center text-[var(--ui-text-muted)]">
                  {t("budgeting.allocations.noBudgetLines")}
                </HuntrTableCell>
              </HuntrTableRow>
            )}
          </HuntrTableBody>
        </HuntrTable>
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
                  <HuntrButton
                    onClick={() =>
                      onAction(
                        () => submitProcurementPlan(companyId, plan.id),
                        t("budgeting.alerts.planSubmitted")
                      )
                    }
                    className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {t("budgeting.plans.submitApproval")}
                  </HuntrButton>
                ) : null}
                {plan.status === "submitted" ? (
                  <>
                    <HuntrButton
                      onClick={() =>
                        onAction(
                          () => approveProcurementPlan(companyId, plan.id),
                          t("budgeting.alerts.planApproved")
                        )
                      }
                      className="border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {t("budgeting.plans.approve")}
                    </HuntrButton>
                    <HuntrButton
                      onClick={() =>
                        onAction(
                          () => rejectProcurementPlan(companyId, plan.id),
                          t("budgeting.alerts.planRejected")
                        )
                      }
                      className="border border-rose-500/40 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300"
                    >
                      {t("budgeting.plans.reject")}
                    </HuntrButton>
                  </>
                ) : null}
                {["approved", "in_progress"].includes(plan.status) ? (
                  <>
                    <HuntrButton
                      onClick={() => onOpen("link-rfq", plan)}
                      className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {t("budgeting.plans.linkPr")}
                    </HuntrButton>
                    <HuntrButton
                      onClick={() => onOpen("link-po", plan)}
                      className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {t("budgeting.plans.linkPo")}
                    </HuntrButton>
                    <HuntrButton
                      onClick={() => onOpen("actual", plan)}
                      className="border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold"
                    >
                      {t("budgeting.plans.recordActual")}
                    </HuntrButton>
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
      <HuntrButton onClick={onCreate} className={`${button} mt-5`}>
        <Plus size={16} />
        {t("budgeting.empty.createCycleBtn")}
      </HuntrButton>
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
      <HuntrButton onClick={onRetry} className={`${button} mt-4`}>
        {t("budgeting.tryAgain")}
      </HuntrButton>
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
          <HuntrButton type="button" onClick={onClose} className="p-1 text-[var(--ui-text-muted)]">
            <X size={18} />
          </HuntrButton>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {isCycle && (
            <>
              <Field label={t("budgeting.modals.fields.cycleName")}>
                <HuntrInput
                  required
                  name="name"
                  className={input}
                  placeholder={t("budgeting.modals.fields.cycleNamePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.fiscalYear")}>
                <HuntrInput
                  required
                  name="fiscal_year"
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.startsAt")}>
                <HuntrInput
                  required
                  name="starts_at"
                  type="date"
                  defaultValue={`${new Date().getFullYear()}-01-01`}
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.endsAt")}>
                <HuntrInput
                  required
                  name="ends_at"
                  type="date"
                  defaultValue={`${new Date().getFullYear()}-12-31`}
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.totalAmount")}>
                <HuntrInput
                  required
                  name="total_amount"
                  type="number"
                  min="0"
                  className={input}
                  placeholder="0"
                />
              </Field>
              <Field label={t("budgeting.modals.fields.currency")}>
                <HuntrSelect name="currency" defaultValue="IDR" className={input}>
                  <option>IDR</option>
                  <option>USD</option>
                </HuntrSelect>
              </Field>
            </>
          )}
          {isLine && (
            <>
              <Field label={t("budgeting.modals.fields.allocationCode")}>
                <HuntrInput
                  required
                  name="code"
                  className={input}
                  placeholder={t("budgeting.modals.fields.allocationCodePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.allocationName")}>
                <HuntrInput
                  required
                  name="name"
                  className={input}
                  placeholder={t("budgeting.modals.fields.allocationNamePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.department")}>
                <HuntrInput
                  name="department"
                  className={input}
                  placeholder={t("budgeting.modals.fields.departmentPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.category")}>
                <HuntrInput
                  name="category"
                  className={input}
                  placeholder={t("budgeting.modals.fields.categoryPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.allocatedAmount")}>
                <HuntrInput
                  required
                  name="allocated_amount"
                  type="number"
                  min="0"
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.currency")}>
                <HuntrSelect name="currency" defaultValue={cycle?.currency || "IDR"} className={input}>
                  <option>IDR</option>
                  <option>USD</option>
                </HuntrSelect>
              </Field>
            </>
          )}
          {isPlan && (
            <>
              <Field label={t("budgeting.modals.fields.planTitle")}>
                <HuntrInput
                  required
                  name="title"
                  className={input}
                  placeholder={t("budgeting.modals.fields.planTitlePlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.budgetAllocation")}>
                <HuntrSelect name="budget_line_id" className={input}>
                  <option value="">{t("budgeting.modals.fields.noSpecificAllocation")}</option>
                  {lines.map((line: any) => (
                    <option key={line.id} value={line.id}>
                      {line.code} · {line.name}
                    </option>
                  ))}
                </HuntrSelect>
              </Field>
              <Field label={t("budgeting.modals.fields.department")}>
                <HuntrInput
                  name="department"
                  className={input}
                  placeholder={t("budgeting.modals.fields.departmentPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.category")}>
                <HuntrInput
                  name="category"
                  className={input}
                  placeholder={t("budgeting.modals.fields.categoryPlaceholder")}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.plannedAmount")}>
                <HuntrInput
                  required
                  name="planned_amount"
                  type="number"
                  min="0"
                  className={input}
                />
              </Field>
              <Field label={t("budgeting.modals.fields.priority")}>
                <HuntrSelect name="priority" className={input}>
                  <option value="normal">{t("budgeting.modals.fields.priorityNormal")}</option>
                  <option value="high">{t("budgeting.modals.fields.priorityHigh")}</option>
                  <option value="critical">{t("budgeting.modals.fields.priorityCritical")}</option>
                  <option value="low">{t("budgeting.modals.fields.priorityLow")}</option>
                </HuntrSelect>
              </Field>
              <Field label={t("budgeting.modals.fields.plannedStart")}>
                <HuntrInput name="planned_start_at" type="date" className={input} />
              </Field>
              <Field label={t("budgeting.modals.fields.plannedEnd")}>
                <HuntrInput name="planned_end_at" type="date" className={input} />
              </Field>
              <Field label={t("budgeting.modals.fields.description")}>
                <HuntrTextarea
                  name="description"
                  className={`${input} min-h-20 sm:col-span-2`}
                  placeholder={t("budgeting.modals.fields.descriptionPlaceholder")}
                />
              </Field>
            </>
          )}
          {kind === "link-rfq" && (
            <Field label={t("budgeting.modals.fields.prSelect")}>
              <HuntrSelect required name="rfq_id" className={input}>
                <option value="">{t("budgeting.modals.fields.prSelectPlaceholder")}</option>
                {rfqs.map((rfq: any) => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.title} · {rfq.department || "Tanpa departemen"} · {rfq.status}
                  </option>
                ))}
              </HuntrSelect>
            </Field>
          )}
          {kind === "link-po" && (
            <>
              <Field label={t("budgeting.modals.fields.poSelect")}>
                <HuntrSelect required name="purchase_order_id" className={input}>
                  <option value="">{t("budgeting.modals.fields.poSelectPlaceholder")}</option>
                  {purchaseOrders.map((po: any) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} ·{" "}
                      {money(po.total_amount, po.currency || cycle?.currency || "IDR", locale)} ·{" "}
                      {po.status}
                    </option>
                  ))}
                </HuntrSelect>
              </Field>
              <Field label={t("budgeting.modals.fields.committedAmount")}>
                <HuntrInput
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
              <HuntrInput
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
          <HuntrButton
            type="button"
            onClick={onClose}
            className="border border-[var(--ui-border)] px-3 py-2 text-sm font-semibold"
          >
            {t("budgeting.modals.cancelBtn")}
          </HuntrButton>
          <HuntrButton disabled={saving} className={button}>
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            {saving ? t("budgeting.modals.savingBtn") : t("budgeting.modals.saveBtn")}
          </HuntrButton>
        </footer>
      </form>
    </div>
  );
}


