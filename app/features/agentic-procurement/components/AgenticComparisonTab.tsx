import React from "react";
import { Sparkles, CheckCircle2, Check } from "lucide-react";

interface AgenticComparisonTabProps {
  comparison: any;
  formatRupiah: (num: number) => string;
}

export default function AgenticComparisonTab({
  comparison,
  formatRupiah,
}: AgenticComparisonTabProps) {
  if (!comparison) return null;

  return (
    <div className="flex flex-col gap-3">
      {comparison.executive_summary && (
        <div className="p-3.5 rounded-lg bg-[var(--ui-bg-card)] border border-orange-500/30 flex flex-col gap-1.5 text-xs">
          <span className="font-bold text-orange-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Sparkles size={12} /> Ringkasan Analisis Komparasi
          </span>
          <p className="text-[var(--ui-text-primary)] leading-relaxed">
            {comparison.executive_summary}
          </p>
          {comparison.winner_reason && (
            <div className="mt-1 text-[11px] p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-1.5">
              <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                <b>Rekomendasi Utama:</b> {comparison.winner_reason}
              </span>
            </div>
          )}
        </div>
      )}

      {comparison.comparison_matrix?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {comparison.comparison_matrix.map((item: any, idx: number) => {
            const isWinner =
              item.catalogue_id === comparison.winner_id || item.score >= 88;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-lg bg-[var(--ui-bg-card)] border flex flex-col justify-between gap-2.5 shadow-sm relative ${
                  isWinner
                    ? "border-emerald-500 ring-1 ring-emerald-500/20"
                    : "border-[var(--ui-border)]"
                }`}
              >
                {isWinner && (
                  <div className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Sparkles size={9} /> Top Choice
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-[var(--ui-text-primary)]">
                        {item.product_name}
                      </h4>
                      {item.vendor_name && (
                        <span className="text-[10px] text-[var(--ui-text-muted)]">
                          {item.vendor_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded">
                      {item.score || 85}/100
                    </span>
                  </div>

                  {item.key_specs && (
                    <div className="p-2 rounded bg-[var(--ui-bg-input)] text-[11px] text-[var(--ui-text-secondary)] border border-[var(--ui-border)]">
                      {item.key_specs}
                    </div>
                  )}

                  {item.pros?.length > 0 && (
                    <div className="text-[11px]">
                      <span className="font-semibold text-emerald-400 block mb-0.5 text-[10px]">
                        Kelebihan:
                      </span>
                      <ul className="space-y-0.5">
                        {item.pros.map((pro: string, pIdx: number) => (
                          <li key={pIdx} className="flex items-start gap-1 text-[var(--ui-text-secondary)]">
                            <Check size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.cons?.length > 0 && (
                    <div className="text-[11px]">
                      <span className="font-semibold text-amber-400 block mb-0.5 text-[10px]">
                        Catatan:
                      </span>
                      <ul className="space-y-0.5">
                        {item.cons.map((con: string, cIdx: number) => (
                          <li key={cIdx} className="flex items-start gap-1 text-[var(--ui-text-muted)]">
                            <span className="text-amber-400">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--ui-text-muted)] text-[11px]">Estimasi:</span>
                  <span className="font-bold font-mono text-[var(--ui-text-primary)]">
                    {formatRupiah(item.estimated_price_idr || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
          Perbandingan otomatis aktif ketika ada 2 atau lebih opsi barang.
        </div>
      )}
    </div>
  );
}
