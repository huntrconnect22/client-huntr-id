import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Package,
  PackageCheck,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";

const toNumeric = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-") return 0;
    const negative = trimmed.startsWith("-");
    const digits = negative ? trimmed.slice(1) : trimmed;
    const native = Number(trimmed);
    if (!Number.isNaN(native)) {
      const hasDots = (digits.match(/\./g) || []).length;
      if (hasDots > 1) {
        const stripped = Number(digits.replace(/\./g, "").replace(/,/g, "."));
        if (!Number.isNaN(stripped)) return negative ? -stripped : stripped;
      }
      return native;
    }
    const normalized = digits.replace(/\./g, "").replace(/,/g, ".");
    const n = Number(normalized);
    if (!Number.isNaN(n)) return negative ? -n : n;
    return 0;
  }
  return 0;
};

const formatQty = (value: unknown, maximumFractionDigits = 3): string => {
  const num = toNumeric(value);
  if (Number.isInteger(num) && Math.abs(num) < 1000) {
    return String(num);
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: Number.isInteger(num) ? 0 : maximumFractionDigits,
  }).format(num);
};

const TX_TYPE_META: Record<string, { label: string; color: string; dot: string }> = {
  receive:  { label: "Receive",  color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  putaway:  { label: "Put Away", color: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500" },
  allocate: { label: "Allocate", color: "text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  transfer: { label: "Transfer", color: "text-cyan-600 dark:text-cyan-400",    dot: "bg-cyan-500" },
  adjust:   { label: "Adjust",   color: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500" },
  ship:     { label: "Ship",     color: "text-rose-600 dark:text-rose-400",     dot: "bg-rose-500" },
};

export function WmsWorkflowGuide({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: string[];
}) {
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-[var(--ui-text-brand)]/25 bg-[var(--ui-text-brand)]/5 px-4 py-3">
      <div className="flex items-center gap-2 text-[var(--ui-text-brand)]">
        <Zap size={15} className="shrink-0" />
        <p className="text-sm font-bold">{title}</p>
      </div>
      <p className="text-xs text-[var(--ui-text-muted)] hidden sm:block">{description}</p>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--ui-text-secondary)] ml-auto">
        {steps.map((step, index) => (
          <span key={step} className="inline-flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ui-text-brand)]/15 text-[10px] font-bold text-[var(--ui-text-brand)]">
              {index + 1}
            </span>
            <span>{step}</span>
            {index < steps.length - 1 && (
              <ChevronRight size={11} className="text-[var(--ui-text-muted)]" />
            )}
          </span>
        ))}
      </div>
    </section>
  );
}

export function WmsOverview({
  dash,
  warehouses,
  receipts,
  stock,
  orders,
  onTabChange,
  onActivityPage,
}: {
  dash: any;
  warehouses: any[];
  receipts: any[];
  stock: any[];
  orders: any[];
  onTabChange: (tab: string) => void;
  onActivityPage: (page: number) => void;
}) {
  const activity =
    dash?.recent_transactions?.data ?? dash?.recent_transactions ?? [];
  const activityPage = dash?.recent_transactions?.current_page ?? 1;
  const activityLastPage = dash?.recent_transactions?.last_page ?? 1;

  const setupSteps = [
    {
      title: "Create a warehouse",
      description: "Add physical location where stock will be stored.",
      tab: "Warehouses",
      ready: warehouses.length > 0,
      Icon: Building2,
      color: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
      iconColor: "text-blue-500",
    },
    {
      title: "Receive goods",
      description: "Record accepted & rejected quantities from a PO.",
      tab: "Receiving & Put Away",
      ready: receipts.length > 0,
      Icon: ArrowDownToLine,
      color: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
      iconColor: "text-emerald-500",
    },
    {
      title: "Put away to bin",
      description: "Move goods from staging to storage/picking bin.",
      tab: "Receiving & Put Away",
      ready: stock.some(
        (item) => item.bin_location && item.bin_location !== "RECEIVING",
      ),
      Icon: Boxes,
      color: "from-violet-500/20 to-violet-600/5 border-violet-500/30",
      iconColor: "text-violet-500",
    },
    {
      title: "Allocate order",
      description: "Reserve stock and generate pick list for packing.",
      tab: "Allocation & Packing",
      ready: orders.length > 0,
      Icon: PackageCheck,
      color: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
      iconColor: "text-amber-500",
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.ready).length;
  const progressPct = Math.round((completedSteps / setupSteps.length) * 100);

  const kpiCards = [
    {
      label: "Active Warehouses",
      value: String(dash?.warehouses ?? 0),
      Icon: Building2,
      tab: "Warehouses",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Tracked SKUs",
      value: String(dash?.sku_count ?? 0),
      Icon: Boxes,
      tab: "Stock",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Units On Hand",
      value: formatQty(dash?.on_hand_units || 0),
      Icon: Package,
      tab: "Stock",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Allocated Units",
      value: formatQty(dash?.allocated_units || 0),
      Icon: Truck,
      tab: "Allocation & Packing",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpiCards.map(({ label, value, Icon, tab, color, bg }) => (
          <button
            key={label}
            type="button"
            onClick={() => onTabChange(tab)}
            className="group flex flex-col gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 text-left transition-all hover:border-[var(--ui-border)]/60 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon size={18} />
              </span>
              <ArrowUpRight size={13} className="text-[var(--ui-text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-[var(--ui-text-primary)]">{value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--ui-text-muted)] uppercase tracking-wider">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Setup checklist + Activity */}
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        {/* Setup checklist */}
        <section className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] px-5 py-4">
            <div>
              <p className="font-bold text-[var(--ui-text-primary)]">Getting started</p>
              <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                Follow the operational flow once to set up your warehouse.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-[var(--ui-text-brand)]">
                  {completedSteps}/{setupSteps.length} complete
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--ui-bg-input)]">
                  <div
                    className="h-full rounded-full bg-[var(--ui-text-brand)] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid divide-y divide-[var(--ui-border)] md:grid-cols-2 md:divide-x md:divide-y-0">
            {setupSteps.map(({ title, description, tab, ready, Icon, color, iconColor }, index) => (
              <button
                key={title}
                type="button"
                onClick={() => onTabChange(tab)}
                className="flex items-start gap-3.5 p-4 text-left transition-colors hover:bg-[var(--ui-bg-input)]/60 group"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br ${ready ? color : "from-[var(--ui-bg-input)] to-[var(--ui-bg-input)] border-[var(--ui-border)]"} transition-all`}
                >
                  {ready ? (
                    <CheckCircle2 size={16} className={iconColor} />
                  ) : (
                    <span className="text-xs font-bold text-[var(--ui-text-muted)]">{index + 1}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`block text-sm font-semibold ${ready ? "text-[var(--ui-text-primary)]" : "text-[var(--ui-text-secondary)]"}`}>
                      {title}
                    </span>
                    {ready && (
                      <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Done
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 block text-xs text-[var(--ui-text-muted)] leading-relaxed">
                    {description}
                  </span>
                </div>
                <Icon
                  size={15}
                  className={`mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${ready ? iconColor : "text-[var(--ui-text-muted)]"}`}
                />
              </button>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-[var(--ui-text-brand)]" />
              <p className="font-bold text-sm text-[var(--ui-text-primary)]">Recent Activity</p>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("Stock")}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ui-text-brand)] hover:opacity-80"
            >
              View stock <ChevronRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-[var(--ui-border)]">
            {activity.slice(0, 8).map((x: any) => {
              const quantity = toNumeric(x.quantity);
              const positive = quantity >= 0;
              const txType = (x.type || "").toLowerCase();
              const txMeta = TX_TYPE_META[txType] || { label: x.type, color: "text-[var(--ui-text-secondary)]", dot: "bg-[var(--ui-text-muted)]" };
              return (
                <div
                  key={x.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--ui-bg-input)]/40 transition-colors"
                >
                  <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${txMeta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[var(--ui-text-primary)]">
                      {x.item_name || x.sku || x.type}
                    </p>
                    <p className="truncate text-[11px] text-[var(--ui-text-muted)]">
                      <span className={`font-medium ${txMeta.color}`}>{txMeta.label}</span>
                      {x.reference ? ` · ${x.reference}` : ""}
                      {" · "}{new Date(x.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
                  >
                    {positive ? "+" : ""}{formatQty(quantity)}
                  </span>
                </div>
              );
            })}
            {!activity.length && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <CircleDot size={28} className="text-[var(--ui-text-muted)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">No activity yet</p>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Receive your first goods to start tracking.
                </p>
                <button
                  type="button"
                  onClick={() => onTabChange("Receiving & Put Away")}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-text-brand)] hover:opacity-80"
                >
                  <TrendingUp size={12} /> Receive now
                </button>
              </div>
            )}
          </div>
          {activityLastPage > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--ui-border)] px-4 py-2.5 text-xs">
              <button
                type="button"
                disabled={activityPage === 1}
                onClick={() => onActivityPage(activityPage - 1)}
                className="rounded-md border border-[var(--ui-border)] px-2.5 py-1 font-semibold text-[var(--ui-text-secondary)] disabled:opacity-40 hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
              >
                Prev
              </button>
              <span className="text-[var(--ui-text-muted)]">
                {activityPage} / {activityLastPage}
              </span>
              <button
                type="button"
                disabled={activityPage === activityLastPage}
                onClick={() => onActivityPage(activityPage + 1)}
                className="rounded-md border border-[var(--ui-border)] px-2.5 py-1 font-semibold text-[var(--ui-text-secondary)] disabled:opacity-40 hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
