import React from "react";
import { Sparkles, CheckCircle2, Check, Award } from "lucide-react";

interface AgenticComparisonTabProps {
  comparison: any;
  formatRupiah: (num: number) => string;
}

export default function AgenticComparisonTab({
  comparison,
  formatRupiah,
}: AgenticComparisonTabProps) {
  if (!comparison) return null;

  // Winner HANYA ditentukan dari winner_id — tidak pakai score sebagai tie-breaker
  const winnerId = comparison.winner_id ?? null;

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
            // Winner hanya satu: yang catalogue_id-nya persis sama dengan winner_id
            const isWinner =
              winnerId !== null &&
              (String(item.catalogue_id) === String(winnerId));

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
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Award size={9} /> Direkomendasikan
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {/* Header: nama produk + skor — TANPA vendor_name */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-[var(--ui-text-primary)] leading-snug">
                      {item.product_name}
                    </h4>
                    <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded shrink-0">
                      {item.score || 85}/100
                    </span>
                  </div>

                  {/* Spesifikasi ringkas */}
                  {item.key_specs && (
                    <div className="p-2 rounded bg-[var(--ui-bg-input)] text-[11px] text-[var(--ui-text-secondary)] border border-[var(--ui-border)]">
                      {item.key_specs}
                    </div>
                  )}

                  {/* Kelebihan */}
                  {item.pros?.length > 0 && (
                    <div className="text-[11px]">
                      <span className="font-semibold text-emerald-400 block mb-0.5 text-[10px]">
                        Kelebihan:
                      </span>
                      <ul className="space-y-0.5">
                        {item.pros.map((pro: string, pIdx: number) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-1 text-[var(--ui-text-secondary)]"
                          >
                            <Check
                              size={11}
                              className="text-emerald-400 flex-shrink-0 mt-0.5"
                            />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Catatan / Kekurangan */}
                  {item.cons?.length > 0 && (
                    <div className="text-[11px]">
                      <span className="font-semibold text-amber-400 block mb-0.5 text-[10px]">
                        Catatan:
                      </span>
                      <ul className="space-y-0.5">
                        {item.cons.map((con: string, cIdx: number) => (
                          <li
                            key={cIdx}
                            className="flex items-start gap-1 text-[var(--ui-text-muted)]"
                          >
                            <span className="text-amber-400">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cocok untuk use-case apa */}
                  {item.best_for && (
                    <div className="text-[10px] text-[var(--ui-text-muted)] italic">
                      Cocok untuk: {item.best_for}
                    </div>
                  )}
                </div>

                {/* Footer: value rating + harga estimasi */}
                <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
                  <span className="text-[11px]">
                    {item.value_rating ? (
                      <span
                        className={`font-medium ${
                          item.value_rating?.toLowerCase().includes("sangat")
                            ? "text-emerald-400"
                            : "text-[var(--ui-text-muted)]"
                        }`}
                      >
                        {item.value_rating}
                      </span>
                    ) : (
                      <span className="text-[var(--ui-text-muted)]">
                        Estimasi:
                      </span>
                    )}
                  </span>
                  <span className="font-bold font-mono text-[var(--ui-text-primary)]">
                    {(item.estimated_price_idr || 0) > 0
                      ? formatRupiah(item.estimated_price_idr)
                      : "Perlu Penawaran"}
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
