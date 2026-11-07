import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Check, MapPin, PackageCheck, Search, Warehouse, X } from "lucide-react";
import { getAssetUrl } from "~/lib/assets";

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
  image_url?: string | null;
  image_path?: string | null;
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
  imageUrl?: string | null;
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
        imageUrl: it.image_url || it.image_path ? getAssetUrl(it.image_url || it.image_path) : null,
      }));
    }
    type GroupAcc = Omit<DisplayGroup, "available">;
    const grouped = new Map<string, GroupAcc>();
    for (const it of pool) {
      const key = it.sku;
      const rawImg = it.image_url || it.image_path;
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
        imageUrl: rawImg ? getAssetUrl(rawImg) : null,
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
        className="relative z-10 flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-none border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-2xl transition-all duration-200 sm:h-[min(86vh,820px)] sm:rounded-xl app-modal-base"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--ui-text-primary)]">
              <PackageCheck size={17} className="text-[var(--ui-text-brand)]" />
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-[var(--ui-text-muted)] transition-colors hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)] cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-[var(--ui-border)] px-5 py-3 sm:px-6">
          <label className="relative flex items-center rounded-lg bg-[var(--ui-bg-input)] ring-1 ring-[var(--ui-border-input)] focus-within:ring-2 focus-within:ring-[var(--ui-text-brand)]/30">
            <Search
              size={14}
              className="pointer-events-none ml-3 shrink-0 text-[var(--ui-text-muted)]"
            />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent py-2.5 pl-2.5 pr-3 text-sm text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] focus:outline-none border-0 shadow-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mr-2 shrink-0 rounded p-0.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
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
            <div className="overflow-x-auto rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                  <tr>
                    <th className="w-10 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                      <span className="sr-only">Pilih</span>
                    </th>
                    <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                      Barang & SKU
                    </th>
                    <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                      Gudang & Lokasi Bin
                    </th>
                    <th className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] whitespace-nowrap">
                      On Hand
                    </th>
                    <th className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] whitespace-nowrap">
                      Alokasi
                    </th>
                    <th className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] whitespace-nowrap">
                      Tersedia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {display.map((group) => {
                    const isSelected = selectedSku === group.sku;
                    const lowStock = group.available > 0 && group.available <= 5;
                    const hasMultiBins = group.rows.length > 1 && aggregateBySku;

                    return (
                      <Fragment key={group.key}>
                        {/* Main SKU row */}
                        <tr
                          onClick={() => {
                            const row = aggregateBySku
                              ? [...group.rows].sort(
                                  (a: any, b: any) =>
                                    toNum(b.on_hand) -
                                    toNum(b.allocated) -
                                    (toNum(a.on_hand) - toNum(a.allocated)),
                                )[0]
                              : group.rows[0];
                            onSelect(row);
                          }}
                          className={
                            "cursor-pointer transition-colors " +
                            (isSelected
                              ? "bg-[var(--ui-text-brand)]/10 font-semibold"
                              : "hover:bg-[var(--ui-bg-input)]/70")
                          }
                        >
                          {/* Radio selection */}
                          <td className="w-10 px-3 py-3 text-center align-middle">
                            <span className="inline-flex items-center justify-center">
                              {isSelected ? (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ui-text-brand)] text-white shadow-sm">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="block h-4 w-4 rounded-full border-2 border-[var(--ui-border)]" />
                              )}
                            </span>
                          </td>

                          {/* Barang & SKU */}
                          <td className="px-3.5 py-3 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                                {group.imageUrl ? (
                                  <img
                                    src={group.imageUrl}
                                    alt={group.title}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback") as HTMLElement | null;
                                      if (fallback) fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <span
                                  className="img-fallback flex items-center justify-center text-[var(--ui-text-muted)]"
                                  style={{ display: group.imageUrl ? "none" : "flex" }}
                                >
                                  <Boxes size={16} />
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm font-semibold text-[var(--ui-text-primary)]">
                                    {group.title}
                                  </span>
                                  <span className="shrink-0 rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--ui-text-brand)]">
                                    {group.sku}
                                  </span>
                                  {group.uom && (
                                    <span className="shrink-0 rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]">
                                      {group.uom}
                                    </span>
                                  )}
                                  {group.catalogue_id && (
                                    <span className="shrink-0 rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--ui-text-brand)]">
                                      linked
                                    </span>
                                  )}
                                  {lowStock && (
                                    <span className="shrink-0 rounded border border-orange-400/40 bg-orange-400/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-500">
                                      Low stock
                                    </span>
                                  )}
                                  {group.available <= 0 && !hideUnavailable && (
                                    <span className="shrink-0 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
                                      Habis
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Gudang & Lokasi Bin */}
                          <td className="px-3.5 py-3 text-xs text-[var(--ui-text-muted)] align-middle">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1">
                                <Warehouse size={11} />
                                {group.warehouses.size === 1
                                  ? Array.from(group.warehouses)[0]
                                  : `${group.warehouses.size} gudang`}
                              </span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={11} />
                                {group.bins.size === 1
                                  ? Array.from(group.bins)[0]
                                  : `${group.bins.size} bin`}
                              </span>
                            </div>
                          </td>

                          {/* On Hand */}
                          <td className="px-3.5 py-3 text-right text-xs font-semibold tabular-nums text-[var(--ui-text-primary)] align-middle">
                            {fmtQty(group.on_hand)}
                          </td>

                          {/* Alokasi */}
                          <td className="px-3.5 py-3 text-right text-xs tabular-nums text-[var(--ui-text-secondary)] align-middle">
                            {fmtQty(group.allocated)}
                          </td>

                          {/* Tersedia */}
                          <td className={
                            "px-3.5 py-3 text-right text-xs font-bold tabular-nums align-middle " +
                            (group.available > 0
                              ? group.available <= 5
                                ? "text-orange-500"
                                : "text-emerald-500"
                              : "text-red-500")
                          }>
                            {fmtQty(group.available)}
                          </td>
                        </tr>

                        {/* Multi-bin sub-rows if any */}
                        {hasMultiBins && group.rows.map((row: StockPickerItem, i: number) => {
                          const rowAvail = toNum(row.on_hand) - toNum(row.allocated);
                          return (
                            <tr
                              key={`${row.id}-${i}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(row);
                              }}
                              className="cursor-pointer bg-[var(--ui-bg-input)]/25 hover:bg-[var(--ui-bg-input)] transition-colors border-b border-[var(--ui-border)]/40 text-[11px]"
                            >
                              <td className="text-center py-2 px-2 text-[var(--ui-text-muted)]">
                                └─
                              </td>
                              <td className="px-3.5 py-2 text-[var(--ui-text-muted)] pl-8">
                                <span className="font-mono font-medium text-[var(--ui-text-secondary)]">
                                  Bin: {row.bin_location || "—"}
                                </span>
                              </td>
                              <td className="px-3.5 py-2 text-xs text-[var(--ui-text-muted)]">
                                {row.warehouse_name || "—"}
                              </td>
                              <td className="px-3.5 py-2 text-right tabular-nums text-[var(--ui-text-muted)]">
                                {fmtQty(row.on_hand)}
                              </td>
                              <td className="px-3.5 py-2 text-right tabular-nums text-[var(--ui-text-muted)]">
                                {fmtQty(row.allocated)}
                              </td>
                              <td className={
                                "px-3.5 py-2 text-right tabular-nums font-semibold " +
                                (rowAvail > 0 ? "text-emerald-500" : "text-red-500")
                              }>
                                {fmtQty(rowAvail)}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer count ── */}
        {display.length > 0 && (
          <div className="border-t border-[var(--ui-border)] px-5 py-2 text-[11px] text-[var(--ui-text-muted)]">
            {display.length} SKU{display.length !== 1 ? "s" : ""}
            {query && ` cocok dengan "${query}"`}
          </div>
        )}
      </div>
    </div>
  );
}
