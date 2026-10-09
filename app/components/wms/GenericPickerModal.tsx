import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";

export interface PickerItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: Array<{ label: string; value: string; tone?: "default" | "brand" | "success" | "muted" }>;
  tags?: string[];
  searchable?: string;
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

const toneClass: Record<NonNullable<PickerMetaTone>, string> = {
  default: "text-[var(--ui-text-secondary)]",
  brand: "text-[var(--ui-text-brand)]",
  success: "text-[var(--ui-text-success)]",
  muted: "text-[var(--ui-text-muted)]",
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
    return () => {
      window.clearTimeout(t);
    };
  }, [open]);

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
      <div
        className="absolute inset-0 bg-[var(--ui-bg-overlay)] backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-none border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-2xl transition-all duration-200 sm:h-[min(82vh,720px)] sm:rounded-2xl app-modal-base"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[var(--ui-text-primary)]">
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
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center">
              <Search size={22} className="text-[var(--ui-text-muted)]" />
              <p className="mt-2 text-sm font-semibold text-[var(--ui-text-secondary)]">
                {items.length === 0 ? emptyLabel : "No matches found."}
              </p>
              {items.length > 0 && (
                <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                  Try a different keyword.
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={
                        "group relative block w-full rounded-xl border p-3 text-left transition-all duration-150 " +
                        (isSelected
                          ? "border-[var(--ui-text-brand)]/60 bg-[var(--ui-text-brand)]/5 shadow-[0_0_0_1px_var(--ui-text-brand)]/20"
                          : "border-[var(--ui-border)] bg-[var(--ui-bg-card)] hover:border-[var(--ui-text-brand)]/40 hover:bg-[var(--ui-bg-card-hover)]")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-[var(--ui-text-primary)]">
                              {item.title}
                            </p>
                            {item.tags?.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ui-text-muted)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {item.subtitle && (
                            <p className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--ui-text-brand)] text-white shadow-sm">
                            <Check size={14} />
                          </span>
                        )}
                      </div>
                      {item.meta && item.meta.length > 0 && (
                        <div className="mt-2.5 grid grid-cols-1 gap-1.5 border-t border-[var(--ui-border)] pt-2 text-[11px] sm:grid-cols-2">
                          {item.meta.map((m, i) => (
                            <div
                              key={`${m.label}-${i}`}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                                {m.label}
                              </span>
                              <span
                                className={
                                  "font-semibold tabular-nums " +
                                  (toneClass[m.tone ?? "default"] ?? "")
                                }
                              >
                                {m.value}
                              </span>
                            </div>
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

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
