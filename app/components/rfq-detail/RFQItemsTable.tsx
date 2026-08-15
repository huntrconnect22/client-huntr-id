import React from "react";
import { Link } from "react-router";
import { Package } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";

interface RFQItemsTableProps {
  rfq: any;
}

export function RFQItemsTable({ rfq }: RFQItemsTableProps) {
  const items = rfq.items || [];

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Package size={14} className="text-orange-500" />
        <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
          Items & Specifications
          <span className="text-[var(--ui-text-muted)] font-normal ml-1">({items.length})</span>
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--ui-text-muted)] rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
          No items in this RFQ.
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)] huntr-table-scroll">
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-8">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Product</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[80px]">Qty</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border)]">
              {items.map((item: any, index: number) => {
                const cat = item.catalogue;
                const catalogueId = item.catalogue_id || cat?.id;
                const hasImage = Boolean(cat?.image_url || cat?.image_path);
                const name = cat?.name || item.item_name || item.name || "Unknown Item";

                return (
                  <tr key={item.id ?? index} className="hover:bg-[var(--ui-bg-input)] transition-colors">
                    <td className="px-3 py-2 text-xs text-[var(--ui-text-muted)]">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-center shrink-0 overflow-hidden">
                          {hasImage ? (
                            <img
                              src={getAssetUrl(cat.image_url || cat.image_path)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <Package size={12} className="text-[var(--ui-text-muted)] opacity-40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          {catalogueId ? (
                            <Link
                              to={`/marketplace/${catalogueId}`}
                              className="text-xs font-semibold text-[var(--ui-text-primary)] hover:text-orange-400 truncate block"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="text-xs font-semibold text-[var(--ui-text-primary)] truncate block">{name}</span>
                          )}
                          <div className="text-[10px] text-[var(--ui-text-muted)] truncate">
                            {cat?.item_code || item.item_code || "—"}
                            {(item.specifications || cat?.specifications) && (
                              <span className="ml-1 opacity-80">· {String(item.specifications || cat?.specifications).slice(0, 40)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)] whitespace-nowrap">
                      {item.qty} {cat?.uom || "pcs"}
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--ui-text-secondary)] whitespace-nowrap">
                      {item.expected_date || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
