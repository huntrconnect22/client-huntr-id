import React, { useEffect, useState } from "react";
import { ContactRound, GripVertical, Plus } from "lucide-react";
import type { RecordRow } from "../types";
import { card, money, stageConfig, stages } from "../crm-utils";

export function CrmPipeline({
  deals,
  onCreate,
  onMove,
}: {
  deals: RecordRow[];
  onCreate: () => void;
  onMove: (row: RecordRow, stage: string) => Promise<boolean>;
}) {
  const [localDeals, setLocalDeals] = useState(deals);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [savingDealId, setSavingDealId] = useState<string | null>(null);

  useEffect(() => setLocalDeals(deals), [deals]);

  const moveDeal = async (deal: RecordRow, stage: string) => {
    if (deal.stage === stage || savingDealId === deal.id) return;

    const previousStage = deal.stage;
    setLocalDeals((current) =>
      current.map((item) => (item.id === deal.id ? { ...item, stage } : item)),
    );
    setSavingDealId(deal.id);

    const saved = await onMove(deal, stage);
    if (!saved) {
      setLocalDeals((current) =>
        current.map((item) =>
          item.id === deal.id ? { ...item, stage: previousStage } : item,
        ),
      );
    }
    setSavingDealId(null);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, stage: string) => {
    event.preventDefault();
    const dealId = event.dataTransfer.getData("application/x-huntr-crm-deal") || draggedDealId;
    setDropStage(null);
    setDraggedDealId(null);

    const deal = localDeals.find((item) => item.id === dealId);
    if (deal) await moveDeal(deal, stage);
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <ContactRound size={18} className="text-orange-500" />
            <h3 className="text-base font-bold text-[var(--ui-text-primary)]">
              Sales Pipeline & Deal Flow
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--ui-text-secondary)]">
            Seret kartu deal ke tahapan tujuan. Perubahan langsung disimpan ke pipeline.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:bg-orange-600"
        >
          <Plus size={14} />
          <span>Deal Baru</span>
        </button>
      </div>

      <div className="overflow-x-auto p-4 sm:p-5">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3.5">
          {stages.map((stage) => {
            const config = stageConfig[stage] || {
              label: stage.replaceAll("_", " "),
              dot: "bg-orange-500",
            };
            const stageDeals = localDeals.filter((deal) => deal.stage === stage);
            const stageTotal = stageDeals.reduce(
              (total, deal) => total + Number(deal.amount || 0),
              0,
            );
            const isDropTarget = dropStage === stage && Boolean(draggedDealId);

            return (
              <div
                key={stage}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropStage(stage);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDropStage((current) => (current === stage ? null : current));
                  }
                }}
                onDrop={(event) => void handleDrop(event, stage)}
                className={`flex min-h-[400px] flex-col rounded-xl border bg-[var(--ui-bg-input)]/40 p-3 transition-colors ${
                  isDropTarget
                    ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30"
                    : "border-[var(--ui-border)]"
                }`}
              >
                <div className="mb-3 border-b border-[var(--ui-border)] pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--ui-text-primary)]">
                      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                    <span className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ui-text-muted)]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-orange-500">
                    {money(stageTotal)}
                  </div>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {stageDeals.map((deal) => {
                    const isSaving = savingDealId === deal.id;
                    return (
                      <article
                        key={deal.id}
                        draggable={!isSaving}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("application/x-huntr-crm-deal", deal.id);
                          setDraggedDealId(deal.id);
                        }}
                        onDragEnd={() => {
                          setDraggedDealId(null);
                          setDropStage(null);
                        }}
                        className={`group relative rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 shadow-2xs transition-all hover:border-orange-500/40 hover:shadow-xs ${
                          draggedDealId === deal.id ? "opacity-50" : ""
                        } ${isSaving ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
                      >
                        <div className="flex gap-1.5">
                          <GripVertical
                            size={15}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-[var(--ui-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-xs font-bold text-[var(--ui-text-primary)]">
                              {deal.name}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-xs">
                              <span className="font-extrabold text-orange-500">
                                {money(deal.amount, deal.currency)}
                              </span>
                              <span className="text-[10px] font-semibold text-[var(--ui-text-muted)]">
                                {isSaving ? "Menyimpan…" : `${deal.probability}% Prob`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--ui-bg-input)]">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{
                              width: `${Math.min(100, Math.max(5, deal.probability || 0))}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 border-t border-[var(--ui-border)] pt-2">
                          <label className="mb-1 block text-[10px] font-semibold text-[var(--ui-text-muted)]">
                            Pindah Tahapan
                          </label>
                          <select
                            value={deal.stage}
                            disabled={isSaving}
                            onChange={(event) => void moveDeal(deal, event.target.value)}
                            className="h-7 w-full rounded-md border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-2 text-[11px] font-medium text-[var(--ui-text-primary)] outline-none transition-colors focus:border-orange-500 disabled:cursor-wait disabled:opacity-60"
                          >
                            {stages.map((item) => (
                              <option key={item} value={item}>
                                {stageConfig[item]?.label ?? item.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    );
                  })}

                  {stageDeals.length === 0 && (
                    <div
                      className={`grid h-28 place-items-center rounded-lg border border-dashed p-2 text-center text-[11px] transition-colors ${
                        isDropTarget
                          ? "border-orange-500 text-orange-500"
                          : "border-[var(--ui-border)] text-[var(--ui-text-muted)]"
                      }`}
                    >
                      {isDropTarget ? "Lepaskan deal di sini" : "Seret deal ke sini"}
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
