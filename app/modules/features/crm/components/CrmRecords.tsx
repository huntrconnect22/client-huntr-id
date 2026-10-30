import { Input as HuntrInput } from "~/shared/ui/Fields";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
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
            <HuntrInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari data..."
              className="h-9 w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] py-1.5 pl-8 pr-3 text-xs text-[var(--ui-text-primary)] outline-none transition-all placeholder:text-[var(--ui-text-muted)] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          <HuntrButton
            onClick={onCreate}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600"
          >
            <Plus size={14} />
            <span>{createLabel || "Tambah Data"}</span>
          </HuntrButton>
        </div>
      </div>

      {/* ── Responsive Data Table ───────────────────────────────────── */}
      {filteredRows.length ? (
        <div className="overflow-x-auto">
          <HuntrTable className="w-full min-w-[700px] text-left text-xs">
            <HuntrTableHead className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]/60 text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              <HuntrTableRow>
                {cols.map((c) => (
                  <HuntrTableHeaderCell key={c} className="px-4 py-3">
                    {c.replaceAll("_", " ")}
                  </HuntrTableHeaderCell>
                ))}
                {(onAction || onSecondaryAction) && (
                  <HuntrTableHeaderCell className="px-4 py-3 text-right">Aksi</HuntrTableHeaderCell>
                )}
              </HuntrTableRow>
            </HuntrTableHead>
            <HuntrTableBody className="divide-y divide-[var(--ui-border)]">
              {filteredRows.map((row) => (
                <HuntrTableRow
                  key={row.id}
                  className="transition-colors hover:bg-[var(--ui-bg-input)]/40"
                >
                  {cols.map((c) => {
                    const val = row[c];
                    return (
                      <HuntrTableCell key={c} className="max-w-[260px] px-4 py-3">
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
                      </HuntrTableCell>
                    );
                  })}

                  {(onAction || onSecondaryAction) && (
                    <HuntrTableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onSecondaryAction && (
                          <HuntrButton
                            type="button"
                            onClick={() => onSecondaryAction(row)}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] px-3 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
                          >
                            {secondaryActionLabel}
                          </HuntrButton>
                        )}
                        {onAction && (
                          <HuntrButton
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
                          </HuntrButton>
                        )}
                      </div>
                    </HuntrTableCell>
                  )}
                </HuntrTableRow>
              ))}
            </HuntrTableBody>
          </HuntrTable>
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


