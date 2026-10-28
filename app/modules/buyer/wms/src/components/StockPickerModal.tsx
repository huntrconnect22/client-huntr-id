import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Check, MapPin, PackageCheck, Search, Warehouse, X } from "lucide-react";

export interface StockPickerItem {
  id: string | number;
  sku: string;
  item_name: string;
  uom?: string;
  bin_location?: string | null;
  warehouse_id?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  on_hand: number | string;
  allocated: number | string;
  catalogue_id?: string | null;
  bin_id?: string | null;
  extraMeta?: Array<{ label: string; value: string; tone?: "default" | "brand" | "success" | "muted" }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: StockPickerItem) => void;
  items: StockPickerItem[];
  title?: string;
  description?: string;
  placeholder?: string;
  emptyLabel?: string;
  selectedSku?: string | null;
  /** If true, group rows will be shown for each SKU showing per-bin breakdown */
  aggregateBySku?: boolean;
  /** Hide unavailable items (available <= 0) */
  hideUnavailable?: boolean;
}

const toNum = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "" || trimmed === "-") return 0;
    const native = Number(trimmed);
    if (!Number.isNaN(native)) return native;
  }
  return 0;
};

const fmtQty = (v: unknown): string => {
  const num = toNum(v);
  if (Number.isInteger(num) && Math.abs(num) < 1000) return String(num);
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: Number.isInteger(num) ? 0 : 3,
  }).format(num);
};

type PooledItem = StockPickerItem & { _num: number; _alloc: number };

type DisplayGroup = {
  key: string;
  title: string;
  sku: string;
  uom?: string;
  catalogue_id?: string | null;
  rows: PooledItem[];
  on_hand: number;
  allocated: number;
  available: number;
  warehouses: Set<string>;
  bins: Set<string>;
  extraMeta?: StockPickerItem["extraMeta"];
};

export function StockPickerModal({
  open,
  onClose,
  onSelect,
  items,
  title = "Select inventory item",
  description = "Choose an SKU to see its on-hand, allocated and available quantities per storage bins.",
  placeholder = "Search by SKU, item name warehouse or bin location…",
  emptyLabel = "No inventory recorded yet.",
  selectedSku,
  aggregateBySku = true,
  hideUnavailable = false,
}: Props) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => {
      if (mountedRef.current && dialogRef.current) {
        dialogRef.current.classList.add("app-modal-mounted");
      }
    }, 0);
    mountedRef.current = true;
    return () => {
      window.clearTimeout(t);
    };
  }, [open]);

  const display = useMemo((): DisplayGroup[] => {
    const base: PooledItem[] = items.map((x) => ({
      ...x,
      _num: toNum(x.on_hand),
      _alloc: toNum(x.allocated),
    }));
    const pool = (
      hideUnavailable ? base.filter((x) => x._num - x._alloc > 0) : base
    ).filter((it) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        [
          it.sku,
          it.item_name,
          it.uom,
          it.bin_location ?? "",
          it.warehouse_name ?? "",
          it.warehouse_code ?? "",
          ...(it.extraMeta ?? []).map((m) => `${m.label} ${m.value}`),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    });
    if (!aggregateBySku) {
      return pool.map((it) => ({
        key: String(it.id),
        title: it.item_name,
        sku: it.sku,
        uom: it.uom,
        catalogue_id: it.catalogue_id,
        rows: [it],
        on_hand: it._num,
        allocated: it._alloc,
        available: it._num - it._alloc,
        warehouses: new Set<string>([
          it.warehouse_name || it.warehouse_id || "?",
        ]),
        bins: new Set<string>([it.bin_location || "—"]),
        extraMeta: it.extraMeta,
      }));
    }
    type GroupAcc = Omit<DisplayGroup, "available">;
    const grouped = new Map<string, GroupAcc>();
    for (const it of pool) {
      const key = it.sku;
      const cur: GroupAcc = grouped.get(key) ?? {
        key,
        title: it.item_name,
        sku: it.sku,
        uom: it.uom,
        catalogue_id: it.catalogue_id,
        rows: [],
        on_hand: 0,
        allocated: 0,
        warehouses: new Set<string>(),
        bins: new Set<string>(),
        extraMeta: it.extraMeta,
      };
      cur.rows.push(it);
      cur.on_hand += it._num;
      cur.allocated += it._alloc;
      if (it.warehouse_name || it.warehouse_id) {
        cur.warehouses.add(it.warehouse_name || it.warehouse_id || "?");
      }
      if (it.bin_location) {
        cur.bins.add(it.bin_location);
      }
      grouped.set(key, cur);
    }
    return Array.from(grouped.values()).map((g) => ({
      ...g,
      available: g.on_hand - g.allocated,
    }));
  }, [items, query, aggregateBySku, hideUnavailable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-[var(--ui-bg-overlay)] backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-none border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-2xl transition-all duration-200 sm:h-[min(86vh,820px)] sm:rounded-2xl app-modal-base"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-bold text-[var(--ui-text-primary)]">
              <PackageCheck size={17} className="text-[var(--ui-text-brand)]" />
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-[var(--ui-border)] px-5 py-3">
          <label className="relative block">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
            />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] py-2 pl-9 pr-3 text-sm text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] focus:border-[var(--ui-text-brand)]/60 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {display.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <Boxes size={26} className="text-[var(--ui-text-muted)]" />
              <p className="mt-2 text-sm font-semibold text-[var(--ui-text-secondary)]">
                {items.length === 0
                  ? emptyLabel
                  : query.trim()
                    ? "No SKU matches your search."
                    : hideUnavailable
                      ? "No stock with available quantity in this scope."
                      : "No SKU matches your search."}
              </p>
              {items.length > 0 && query.trim() && (
                <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                  Try searching for a different SKU name or bin code.
                </p>
              )}
              {items.length > 0 && !query.trim() && hideUnavailable && (
                <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                  Put away from receiving bins or reduce allocations, then try again.
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {display.map((group) => {
                const isSelected = selectedSku === group.sku;
                const lowStock = group.available > 0 && group.available <= 5;
                return (
                  <li key={group.key}>
                    <button
                      type="button"
                      onClick={() => {
                        const row = aggregateBySku
                          ? // when aggregating: pick the row with most available
                            [...group.rows].sort(
                                (a: any, b: any) =>
                                  toNum(b.on_hand) -
                                  toNum(b.allocated) -
                                  (toNum(a.on_hand) - toNum(a.allocated)),
                              )[0]
                          : group.rows[0];
                        onSelect(row);
                      }}
                      className={
                        "group relative block w-full rounded-2xl border p-4 text-left transition-all duration-150 " +
                        (isSelected
                          ? "border-[var(--ui-text-brand)]/60 bg-[var(--ui-text-brand)]/5 shadow-[0_0_0_1px_var(--ui-text-brand)]/20"
                          : "border-[var(--ui-border)] bg-[var(--ui-bg-card)] hover:border-[var(--ui-text-brand)]/40 hover:bg-[var(--ui-bg-card-hover)]")
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-[var(--ui-text-primary)]">
                              {group.title}
                            </p>
                            <span className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--ui-text-brand)]">
                              {group.sku}
                            </span>
                            {group.uom && (
                              <span className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                                {group.uom}
                              </span>
                            )}
                            {group.catalogue_id && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--ui-primary-border)] bg-[var(--ui-primary-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ui-text-brand)]">
                                · linked
                              </span>
                            )}
                            {lowStock && (
                              <span className="rounded-md border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
                                Low stock
                              </span>
                            )}
                            {group.available <= 0 && !hideUnavailable && (
                              <span className="rounded-md border border-[var(--ui-border-error)] bg-[var(--ui-bg-error)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ui-text-error)]">
                                Sold out
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ui-text-muted)]">
                            <span className="inline-flex items-center gap-1">
                              <Warehouse size={12} />
                              {group.warehouses.size === 1
                                ? Array.from(group.warehouses)[0]
                                : `${group.warehouses.size} warehouses`}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} />
                              {group.bins.size === 1
                                ? Array.from(group.bins)[0]
                                : `${group.bins.size} bin locations`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isSelected && (
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--ui-text-brand)] text-white shadow-sm">
                              <Check size={14} />
                            </span>
                          )}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1">
                              <div className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                                On hand
                              </div>
                              <div className="mt-0.5 text-sm font-bold tabular-nums text-[var(--ui-text-primary)]">
                                {fmtQty(group.on_hand)}
                              </div>
                            </div>
                            <div className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1">
                              <div className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                                Alloc
                              </div>
                              <div className="mt-0.5 text-sm font-bold tabular-nums text-[var(--ui-text-secondary)]">
                                {fmtQty(group.allocated)}
                              </div>
                            </div>
                            <div
                              className={
                                "rounded-md border px-2 py-1 " +
                                (group.available > 0
                                  ? group.available <= 5
                                    ? "border-orange-400/40 bg-orange-400/10"
                                    : "border-[var(--ui-border-success)] bg-[var(--ui-bg-success)]"
                                  : "border-[var(--ui-border-error)] bg-[var(--ui-bg-error)]")
                              }
                            >
                              <div className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                                Available
                              </div>
                              <div
                                className={
                                  "mt-0.5 text-sm font-bold tabular-nums " +
                                  (group.available > 0
                                    ? group.available <= 5
                                      ? "text-orange-500"
                                      : "text-[var(--ui-text-success)]"
                                    : "text-[var(--ui-text-error)]")
                                }
                              >
                                {fmtQty(group.available)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {group.rows.length > 1 && aggregateBySku && (
                        <div className="mt-3 space-y-1.5 border-t border-[var(--ui-border)] pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                            Bin breakdown — tap row to select specific bin
                          </p>
                          <ul className="space-y-1">
                            {group.rows.map((row: StockPickerItem, i: number) => (
                              <li key={`${row.id}-${i}`}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(row);
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/60] px-3 py-2 text-[11px] transition-colors hover:border-[var(--ui-text-brand)]/40 hover:text-[var(--ui-text-brand)]"
                                >
                                  <span className="flex items-center gap-2 text-[var(--ui-text-secondary)]">
                                    <MapPin size={12} />
                                    <span className="font-mono font-semibold">
                                      {row.bin_location || "—"}
                                    </span>
                                    {row.warehouse_name && (
                                      <span className="text-[var(--ui-text-muted)]">
                                        · {row.warehouse_name}
                                      </span>
                                    )}
                                    {row.bin_id && (
                                      <span className="text-[var(--ui-text-muted)]">
                                        · bin id{" "}
                                        <span className="font-mono">
                                          {String(row.bin_id).slice(0, 8)}
                                        </span>
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    className={
                                      "tabular-nums font-semibold " +
                                      (toNum(row.on_hand) - toNum(row.allocated) > 0
                                        ? "text-[var(--ui-text-success)]"
                                        : "text-[var(--ui-text-error)]")
                                    }
                                  >
                                    {fmtQty(
                                      toNum(row.on_hand) - toNum(row.allocated),
                                    )}{" "}
                                    <span className="text-[var(--ui-text-muted)]">
                                      / {fmtQty(row.on_hand)}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {group.extraMeta && group.extraMeta.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--ui-border)] pt-3 text-[11px]">
                          {group.extraMeta.map((m, i) => (
                            <span
                              key={`${m.label}-${i}`}
                              className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1"
                            >
                              <span className="mr-1 font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                                {m.label}:
                              </span>
                              <span className="font-semibold">
                                {m.value}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
