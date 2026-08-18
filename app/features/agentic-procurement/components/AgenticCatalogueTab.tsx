import React from "react";

interface AgenticCatalogueTabProps {
  catalogues: any[];
}

export default function AgenticCatalogueTab({ catalogues }: AgenticCatalogueTabProps) {
  if (!catalogues || catalogues.length === 0) {
    return (
      <div className="p-6 text-center rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)]">
        Item spesifikasi standar industri digenerasikan untuk ditenderkan ke vendor.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {catalogues.map((cat: any, idx: number) => (
        <div
          key={idx}
          className="p-3 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] hover:border-orange-500/30 transition-all flex flex-col justify-between gap-2 shadow-sm text-xs"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded">
                Match {cat.ai_score || 85}%
              </span>
              <span className="text-[10px] text-[var(--ui-text-muted)]">
                {cat.category || "General"}
              </span>
            </div>
            <h4 className="font-bold text-xs text-[var(--ui-text-primary)] line-clamp-2">
              {cat.name}
            </h4>
            <p className="text-[11px] text-[var(--ui-text-muted)] line-clamp-2">
              {cat.specifications || "Spesifikasi vendor"}
            </p>
            {cat.vendor && (
              <span className="text-[10px] text-[var(--ui-text-secondary)]">
                🏢 {cat.vendor}
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-[11px]">
            <span className="text-[var(--ui-text-muted)]">{cat.item_code}</span>
            <span className="font-semibold text-orange-400">{cat.uom || "unit"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
