import {
  Activity,
  ArrowDownToLine,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  PackageCheck,
  Truck,
} from "lucide-react";

const card = "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4";

const toNumeric = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-") return 0;
    const negative = trimmed.startsWith("-");
    const digits = negative ? trimmed.slice(1) : trimmed;

    // 1) Native parse first — works for US/backend style: "4", "4.000", "1234.56", "-4.000"
    const native = Number(trimmed);
    if (!Number.isNaN(native)) {
      // Native parse valid -> use it. EXCEPT if the string uses id-ID thousand
      // separator "." AND the native parse produced a fraction that looks
      // wrong (e.g. user typed "4.500" and meant 4500, not 4.5).
      // Heuristic: treat "." as thousand separator ONLY when there are
      // MULTIPLE dots, OR the digits after a dot are exactly 3 AND the
      // native number ends with .000 integer anyway (4.000 → still 4).
      const hasDots = (digits.match(/\./g) || []).length;
      if (hasDots > 1) {
        const stripped = Number(digits.replace(/\./g, "").replace(/,/g, "."));
        if (!Number.isNaN(stripped)) return negative ? -stripped : stripped;
      }
      // Single dot: check if it's clearly a thousand separator (3 trailing
      // digits AND overall >= 1000 after stripping). Otherwise keep native
      // parse (e.g. "4.000" native = 4 → correct for 4 units).
      if (hasDots === 1) {
        const [beforeDot, afterDot] = digits.split(".");
        if (
          afterDot &&
          afterDot.length === 3 &&
          /^\d+$/.test(afterDot) &&
          // Ambiguous: "4.000" (4) vs "12.500" (12500).
          // Treat as thousand separator ONLY when digits before dot are
          // >= 2 characters (>= 10 thousand) OR the afterDot has non-zero
          // digits AND the overall length looks like a real thousand group.
          (beforeDot.length >= 2 || /[1-9]/.test(afterDot)) &&
          beforeDot.length + afterDot.length >= 5
        ) {
          const asThousand = Number(digits.replace(/\./g, ""));
          if (!Number.isNaN(asThousand)) {
            return negative ? -asThousand : asThousand;
          }
        }
      }
      return native;
    }

    // 2) Native failed (pure id-ID formatting): strip thousand separators
    //    then treat comma as decimal separator.
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
    maximumFractionDigits,
    ...(Number.isInteger(num) ? { maximumFractionDigits: 0 } : {}),
  }).format(num);
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
    <section className="border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-bg-card)] px-4 py-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--ui-text-muted)]">
        {description}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ui-text-secondary)]">
        {steps.map((step, index) => (
          <span key={step} className="inline-flex items-center gap-2">
            <span>
              {index + 1}. {step}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight size={13} className="text-[var(--ui-text-muted)]" />
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
}: {
  dash: any;
  warehouses: any[];
  receipts: any[];
  stock: any[];
  orders: any[];
  onTabChange: (tab: string) => void;
}) {
  const setupSteps = [
    {
      title: "Create a warehouse",
      description:
        "Add the first physical location where stock will be stored.",
      tab: "Warehouses",
      ready: warehouses.length > 0,
      Icon: Building2,
    },
    {
      title: "Receive incoming goods",
      description:
        "Record accepted and rejected quantities from a purchase order.",
      tab: "Receiving & Put Away",
      ready: receipts.length > 0,
      Icon: ArrowDownToLine,
    },
    {
      title: "Put stock into a bin",
      description: "Move approved goods from Receiving to Storage or Picking.",
      tab: "Receiving & Put Away",
      ready: stock.some(
        (item) => item.bin_location && item.bin_location !== "RECEIVING",
      ),
      Icon: Boxes,
    },
    {
      title: "Allocate an order",
      description:
        "Reserve available stock and generate a pick list for packing.",
      tab: "Allocation & Packing",
      ready: orders.length > 0,
      Icon: PackageCheck,
    },
  ];
  return (
    <>
      <section className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--ui-border)] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">
              Get started with your warehouse
            </p>
            <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
              Follow the operational flow once. After that, use the tabs for
              day-to-day work.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--ui-text-brand)]">
            {setupSteps.filter((step) => step.ready).length}/{setupSteps.length}{" "}
            complete
          </span>
        </div>
        <div className="grid divide-y divide-[var(--ui-border)] md:grid-cols-2 md:divide-x md:divide-y-0">
          {setupSteps.map(({ title, description, tab, ready, Icon }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => onTabChange(tab)}
              className="flex items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--ui-bg-input)]"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-bold ${ready ? "border-[var(--ui-text-brand)] bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]" : "border-[var(--ui-border)] text-[var(--ui-text-muted)]"}`}
              >
                {ready ? <CheckCircle2 size={16} /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--ui-text-muted)]">
                  {description}
                </span>
              </span>
              <Icon
                size={17}
                className="shrink-0 text-[var(--ui-text-brand)]"
              />
            </button>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Active warehouses", dash?.warehouses ?? 0, Building2],
          ["Tracked SKUs", dash?.sku_count ?? 0, Boxes],
          [
            "Units on hand",
            formatQty(dash?.on_hand_units || 0),
            PackageCheck,
          ],
          [
            "Allocated units",
            formatQty(dash?.allocated_units || 0),
            Truck,
          ],
        ].map(([label, value, Icon]: any) => (
          <div className={card} key={label}>
            <Icon size={17} className="text-[var(--ui-text-brand)]" />
            <p className="mt-4 text-xs text-[var(--ui-text-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--ui-text-primary)]">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className={card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">Recent activity</h3>
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              Your latest inventory events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("Stock")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-text-brand)]"
          >
            View stock <ChevronRight size={14} />
          </button>
        </div>
        <div className="mt-4 divide-y divide-[var(--ui-border)]">
          {(dash?.recent_transactions || []).map((x: any) => {
            const qty = toNumeric(x.quantity);
            const positive = qty >= 0;
            return (
              <div
                key={x.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--ui-bg-input)] text-[var(--ui-text-brand)]">
                    <Activity size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--ui-text-primary)]">
                      {x.item_name ||
                        (x.sku ? `SKU ${x.sku}` : (
                          <span className="capitalize">{x.type}</span>
                        ))}
                    </p>
                    <p className="truncate text-xs text-[var(--ui-text-muted)]">
                      <span className="capitalize">{x.type}</span>
                      {x.sku && ` · SKU ${x.sku}`}
                      {x.reference && ` · ${x.reference}`}
                      {" · "}
                      {new Date(x.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={
                    "font-semibold tabular-nums " +
                    (positive
                      ? "text-[color:var(--ui-text-success)]"
                      : "text-[color:var(--ui-text-error)]")
                  }
                >
                  {positive ? "+" : ""}
                  {formatQty(x.quantity)}
                </span>
              </div>
            );
          })}
          {!dash?.recent_transactions?.length && (
            <div className="py-6 text-center">
              <ArrowDownToLine
                size={22}
                className="mx-auto text-[var(--ui-text-brand)]"
              />
              <p className="mt-2 text-sm font-semibold">
                No stock movement yet
              </p>
              <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                Receive your first incoming goods to start tracking inventory.
              </p>
              <button
                type="button"
                onClick={() => onTabChange("Receiving & Put Away")}
                className="mt-3 text-xs font-semibold text-[var(--ui-text-brand)]"
              >
                Receive incoming goods
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
