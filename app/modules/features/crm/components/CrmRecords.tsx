import React, { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import type { RecordRow } from "../types";
import { card, date, getInitials, money } from "../crm-utils";
import { Empty, StatusBadge } from "./CrmShared";

export function CrmRecords({
  title,
  intro,
  icon: Icon,
  rows,
  cols,
  onCreate,
  onAction,
  actionLabel,
  onSecondaryAction,
  secondaryActionLabel,
  canAction,
  createLabel,
}: {
  title: string;
  intro: string;
  icon?: any;
  rows: RecordRow[];
  cols: string[];
  onCreate: () => void;
  onAction?: (row: RecordRow) => void;
  actionLabel?: string | ((row: RecordRow) => string);
  onSecondaryAction?: (row: RecordRow) => void;
  secondaryActionLabel?: string;
  canAction?: (row: RecordRow) => boolean;
  createLabel?: string;
}) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) =>
      cols.some((c) => String(row[c] ?? "").toLowerCase().includes(term)),
    );
  }, [rows, cols, search]);

  return (
    <section className={card}>
      {/* ── Table Top Toolbar ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3.5 border-b border-[var(--ui-border)] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-orange-500" />}
            <h3 className="text-base font-bold text-[var(--ui-text-primary)]">
              {title}
            </h3>
          </div>
          <p className="text-xs text-[var(--ui-text-secondary)]">{intro}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari data..."
              className="h-9 w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] py-1.5 pl-8 pr-3 text-xs text-[var(--ui-text-primary)] outline-none transition-all placeholder:text-[var(--ui-text-muted)] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          <button
            onClick={onCreate}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600"
          >
            <Plus size={14} />
            <span>{createLabel || "Tambah Data"}</span>
          </button>
        </div>
      </div>

      {/* ── Responsive Data Table ───────────────────────────────────── */}
      {filteredRows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]/60 text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="px-4 py-3">
                    {c.replaceAll("_", " ")}
                  </th>
                ))}
                {(onAction || onSecondaryAction) && (
                  <th className="px-4 py-3 text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)]">
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-[var(--ui-bg-input)]/40"
                >
                  {cols.map((c) => {
                    const val = row[c];
                    return (
                      <td key={c} className="max-w-[260px] px-4 py-3">
                        {c === "name" ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-bold text-orange-500">
                              {getInitials(val)}
                            </div>
                            <span className="font-bold text-[var(--ui-text-primary)]">
                              {val || "—"}
                            </span>
                          </div>
                        ) : ["status", "lifecycle_stage", "priority"].includes(c) ? (
                          <StatusBadge value={val} kind={c} />
                        ) : c === "score" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[var(--ui-text-primary)]">
                              {val ?? 0}
                            </span>
                            <span className="text-[10px] text-[var(--ui-text-muted)]">
                              pts
                            </span>
                          </div>
                        ) : c.includes("amount") || c === "subtotal" ? (
                          <span className="font-semibold text-orange-500">
                            {money(val, row.currency)}
                          </span>
                        ) : c.includes("_at") ? (
                          <span className="text-[var(--ui-text-secondary)]">
                            {date(val)}
                          </span>
                        ) : (
                          <span className="text-[var(--ui-text-secondary)]">
                            {String(val ?? "—")}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {(onAction || onSecondaryAction) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onSecondaryAction && (
                          <button
                            type="button"
                            onClick={() => onSecondaryAction(row)}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] px-3 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
                          >
                            {secondaryActionLabel}
                          </button>
                        )}
                        {onAction && (
                          <button
                            type="button"
                            disabled={canAction ? !canAction(row) : false}
                            onClick={() => onAction(row)}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 text-xs font-bold text-orange-500 transition-all hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span>
                              {typeof actionLabel === "function"
                                ? actionLabel(row)
                                : actionLabel}
                            </span>
                            <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          text={
            search
              ? "Tidak ada data yang cocok dengan pencarian Anda."
              : "Belum ada rekaman data. Mulai tambahkan data pertama Anda."
          }
          icon={Icon}
        />
      )}
    </section>
  );
}


