import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Package, Search, X } from "lucide-react";

export interface PickerItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: Array<{ label: string; value: string; tone?: "default" | "brand" | "success" | "muted" }>;
  tags?: string[];
  searchable?: string;
  imageUrl?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: PickerItem) => void;
  items: PickerItem[];
  title: string;
  description?: string;
  placeholder?: string;
  emptyLabel?: string;
  selectedId?: string | null;
}

type PickerMetaTone = NonNullable<PickerItem["meta"]>[number]["tone"];

const toneText: Record<NonNullable<PickerMetaTone>, string> = {
  default: "text-[var(--ui-text-secondary)]",
  brand:   "text-[var(--ui-text-brand)]",
  success: "text-emerald-500",
  muted:   "text-[var(--ui-text-muted)]",
};

const toneBg: Record<NonNullable<PickerMetaTone>, string> = {
  default: "bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)]",
  brand:   "bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]",
  success: "bg-emerald-500/10 text-emerald-500",
  muted:   "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]",
};

export function GenericPickerModal({
  open,
  onClose,
  onSelect,
  items,
  title,
  description,
  placeholder = "Search…",
  emptyLabel = "No items available.",
  selectedId,
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
    return () => { window.clearTimeout(t); };
  }, [open]);

  const metaColumns = useMemo(() => {
    const list: string[] = [];
    for (const item of items) {
      if (item.meta) {
        for (const m of item.meta) {
          if (!list.includes(m.label)) {
            list.push(m.label);
          }
        }
      }
    }
    return list;
  }, [items]);

  const showThumbnail = useMemo(
    () => items.some((it) => it.imageUrl !== undefined),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = [
        it.title,
        it.subtitle,
        it.searchable,
        ...(it.tags ?? []),
        ...(it.meta ?? []).map((m) => `${m.label} ${m.value}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[var(--ui-bg-overlay)] backdrop-blur-sm" aria-hidden />
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-none border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-2xl transition-all duration-200 sm:h-[min(84vh,740px)] sm:rounded-xl app-modal-base"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ui-border)] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-6 text-[var(--ui-text-primary)]">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">{description}</p>
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

        {/* ── Search ── */}
        <div className="border-b border-[var(--ui-border)] px-5 py-3 sm:px-6">
          <label className="relative flex items-center rounded-lg bg-[var(--ui-bg-input)] ring-1 ring-[var(--ui-border-input)] focus-within:ring-2 focus-within:ring-[var(--ui-text-brand)]/30">
            <Search size={14} className="pointer-events-none ml-3 shrink-0 text-[var(--ui-text-muted)]" />
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

        {/* ── Table content ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 text-center">
              <Search size={22} className="text-[var(--ui-text-muted)] opacity-40" />
              <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">
                {items.length === 0 ? emptyLabel : "Tidak ada yang cocok."}
              </p>
              {items.length > 0 && (
                <p className="text-xs text-[var(--ui-text-muted)]">Coba kata kunci lain.</p>
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
                    {showThumbnail && (
                      <th className="w-14 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                        Foto
                      </th>
                    )}
                    <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                      Nama / Referensi
                    </th>
                    <th className="px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                      Keterangan
                    </th>
                    {metaColumns.map((col) => (
                      <th
                        key={col}
                        className="px-3.5 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {filtered.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelect(item)}
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

                        {/* Foto / Thumbnail */}
                        {showThumbnail && (
                          <td className="w-14 px-3 py-2.5 text-center align-middle">
                            <div className="relative mx-auto flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
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
                                style={{ display: item.imageUrl ? "none" : "flex" }}
                              >
                                <Package size={16} />
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Title & tags */}
                        <td className="px-3.5 py-3 align-middle">
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-[var(--ui-text-primary)]">
                              {item.title}
                            </span>
                            {item.tags && item.tags.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Subtitle */}
                        <td className="px-3.5 py-3 text-xs text-[var(--ui-text-muted)] align-middle">
                          {item.subtitle || "—"}
                        </td>

                        {/* Dynamic meta columns */}
                        {metaColumns.map((col) => {
                          const m = item.meta?.find((x) => x.label === col);
                          return (
                            <td
                              key={col}
                              className={
                                "px-3.5 py-3 text-right text-xs tabular-nums whitespace-nowrap align-middle " +
                                (toneText[m?.tone ?? "default"] ?? "")
                              }
                            >
                              {m?.value ?? "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer count ── */}
        {filtered.length > 0 && (
          <div className="border-t border-[var(--ui-border)] px-5 py-2 text-[11px] text-[var(--ui-text-muted)]">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            {query && ` cocok dengan "${query}"`}
          </div>
        )}
      </div>
    </div>
  );
}

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
