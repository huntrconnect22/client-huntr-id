import React from "react";
import { ContactRound, Plus } from "lucide-react";
import type { RecordRow } from "../types";
import { card, money, stageConfig, stages } from "../crm-utils";

export function CrmPipeline({
  deals,
  onCreate,
  onMove,
}: {
  deals: RecordRow[];
  onCreate: () => void;
  onMove: (row: RecordRow, stage: string) => void;
}) {
  return (
    <section className={`${card} overflow-hidden`}>
      {/* ── Pipeline Header ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <ContactRound size={18} className="text-orange-500" />
            <h3 className="text-base font-bold text-[var(--ui-text-primary)]">
              Sales Pipeline & Deal Flow
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--ui-text-secondary)]">
            Pantau dan pindahkan deal melalui setiap tahapan negosiasi menuju kesepakatan akhir.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600"
        >
          <Plus size={14} />
          <span>Deal Baru</span>
        </button>
      </div>

      {/* ── Kanban Board Columns ──────────────────────────────────── */}
      <div className="overflow-x-auto p-4 sm:p-5">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3.5">
          {stages.map((stage) => {
            const config = stageConfig[stage] || {
              label: stage.replaceAll("_", " "),
              color: "text-[var(--ui-text-primary)]",
              border: "border-[var(--ui-border)]",
              bg: "bg-[var(--ui-bg-input)]",
              dot: "bg-orange-500",
            };
            const stageDeals = deals.filter((d: RecordRow) => d.stage === stage);
            const stageTotal = stageDeals.reduce(
              (acc, d) => acc + Number(d.amount || 0),
              0,
            );

            return (
              <div
                key={stage}
                className="flex flex-col rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/40 p-3 min-h-[400px]"
              >
                {/* Column Title */}
                <div className="mb-3 border-b border-[var(--ui-border)] pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--ui-text-primary)]">
                      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                    <span className="rounded-md bg-[var(--ui-bg-card)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ui-text-muted)] border border-[var(--ui-border)]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-orange-500">
                    {money(stageTotal)}
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {stageDeals.map((deal: RecordRow) => (
                    <article
                      key={deal.id}
                      className="group relative rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 shadow-2xs transition-all hover:border-orange-500/40 hover:shadow-xs"
                    >
                      <div className="text-xs font-bold text-[var(--ui-text-primary)] line-clamp-2">
                        {deal.name}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-orange-500">
                          {money(deal.amount, deal.currency)}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--ui-text-muted)]">
                          {deal.probability}% Prob
                        </span>
                      </div>

                      {/* Probability mini bar */}
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--ui-bg-input)]">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{
                            width: `${Math.min(100, Math.max(5, deal.probability || 0))}%`,
                          }}
                        />
                      </div>

                      {/* Stage Selector */}
                      <div className="mt-3 pt-2 border-t border-[var(--ui-border)]">
                        <label className="text-[10px] font-semibold text-[var(--ui-text-muted)] block mb-1">
                          Pindah Tahapan:
                        </label>
                        <select
                          value={deal.stage}
                          onChange={(e) => onMove(deal, e.target.value)}
                          className="h-7 w-full rounded-md border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-2 text-[11px] font-medium text-[var(--ui-text-primary)] outline-none transition-all focus:border-orange-500"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              {s.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="grid h-28 place-items-center rounded-lg border border-dashed border-[var(--ui-border)] p-2 text-center text-[11px] text-[var(--ui-text-muted)]">
                      Kosong
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
