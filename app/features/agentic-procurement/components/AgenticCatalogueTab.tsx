import React from "react";
import { Tag, Package } from "lucide-react";

interface AgenticCatalogueTabProps {
  catalogues: any[];
}

/** Warna badge AI Score berdasarkan nilai */
function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (score >= 70) return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

const formatRupiah = (val: number) =>
  val > 0 ? `Rp ${Number(val).toLocaleString("id-ID")}` : "—";

export default function AgenticCatalogueTab({ catalogues }: AgenticCatalogueTabProps) {
  if (!catalogues || catalogues.length === 0) {
    return (
      <div className="p-6 text-center rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
        <Package size={28} className="mx-auto mb-2 opacity-40" />
        <p>Tidak ada katalog yang ditemukan.</p>
        <p className="mt-1 opacity-70">Spesifikasi standar industri akan digenerate untuk ditenderkan ke vendor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sorting info */}
      <p className="text-[11px] text-[var(--ui-text-muted)] px-1">
        Menampilkan <b>{catalogues.length}</b> katalog, diurutkan berdasarkan AI Match Score tertinggi.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {catalogues.map((cat: any, idx: number) => {
          const score = Number(cat.ai_score ?? 85);
          const price = Number(cat.estimated_price ?? 0);
          const badgeClass = getScoreBadgeClass(score);

          return (
            <div
              key={cat.id || idx}
              className="p-3 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] hover:border-orange-500/30 transition-all flex flex-col justify-between gap-2 shadow-sm text-xs"
            >
              {/* Header: rank + score + category */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold text-[var(--ui-text-muted)] w-4 text-center">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}
                  >
                    Match {score}%
                  </span>
                </div>
                <span className="text-[10px] text-[var(--ui-text-muted)] truncate max-w-[80px]">
                  {cat.category || "General"}
                </span>
              </div>

              {/* Product name */}
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-xs text-[var(--ui-text-primary)] line-clamp-2 leading-tight">
                  {cat.name}
                </h4>

                {cat.brand && (
                  <span className="text-[10px] text-orange-400 font-semibold flex items-center gap-1">
                    <Tag size={9} />
                    {cat.brand}
                  </span>
                )}

                <p className="text-[11px] text-[var(--ui-text-muted)] line-clamp-2 leading-relaxed">
                  {cat.specifications || "Spesifikasi vendor"}
                </p>

                {/* Fit reason dari AI */}
                {cat.fit_reason && (
                  <p className="text-[10px] text-emerald-500 italic line-clamp-1">
                    ✓ {cat.fit_reason}
                  </p>
                )}

                {cat.vendor && (
                  <span className="text-[10px] text-[var(--ui-text-secondary)]">
                    🏢 {cat.vendor}
                  </span>
                )}
              </div>

              {/* Footer: item code + harga + uom */}
              <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between gap-1">
                <span className="text-[10px] text-[var(--ui-text-muted)] truncate">{cat.item_code || "—"}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {price > 0 && (
                    <span className="text-[10px] font-bold text-orange-400">
                      {formatRupiah(price)}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--ui-text-muted)]">/{cat.uom || "unit"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
