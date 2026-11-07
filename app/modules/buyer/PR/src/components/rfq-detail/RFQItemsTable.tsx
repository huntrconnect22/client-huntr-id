import React from "react";
import { Link } from "react-router";
import { Package } from "lucide-react";
import { getAssetUrl } from "~/lib/assets";
import { useLanguage } from "~/context/LanguageContext";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

interface RFQItemsTableProps {
  rfq: any;
}

export function RFQItemsTable({ rfq }: RFQItemsTableProps) {
  const { t } = useLanguage();
  const items = rfq.items || [];

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Package size={14} className="text-orange-500" />
        <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
          {t("rfqDetail.items.sectionTitle")}
          <span className="text-[var(--ui-text-muted)] font-normal ml-1">({items.length})</span>
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--ui-text-muted)] rounded-lg border border-dashed border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
          {t("rfqDetail.items.empty")}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)] huntr-table-scroll">
          <Table className="w-full text-sm border-collapse min-w-[520px]" size="small">
            <TableHead>
              <TableRow className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                <TableCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-8">#</TableCell>
                <TableCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">{rfq.procurement_type === "services" ? "Pekerjaan / Layanan Jasa" : t("rfqDetail.items.product")}</TableCell>
                <TableCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[80px]">{rfq.procurement_type === "services" ? "Volume" : t("rfqDetail.items.qty")}</TableCell>
                <TableCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[110px]">{rfq.procurement_type === "services" ? "Target Selesai" : t("rfqDetail.items.required")}</TableCell>
                <TableCell className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-[120px]">{rfq.procurement_type === "services" ? "Pagu Budget" : "Est. Price"}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y divide-[var(--ui-border)]">
              {items.map((item: any, index: number) => {
                const cat = item.catalogue;
                const catalogueId = item.catalogue_id || cat?.id;
                const isServiceItem = item.line_type === "service" || (!catalogueId && rfq.procurement_type === "services");
                const hasImage = Boolean(cat?.image_url || cat?.image_path);
                const name = cat?.name || item.item_name || item.name || t("rfqDetail.items.unknownItem");

                return (
                  <TableRow key={item.id ?? index} className="hover:bg-[var(--ui-bg-input)] transition-colors">
                    <TableCell className="px-3 py-2 text-xs text-[var(--ui-text-muted)]">{index + 1}</TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-center shrink-0 overflow-hidden">
                          {isServiceItem ? (
                            <span className="text-orange-500 text-xs font-bold">💼</span>
                          ) : hasImage ? (
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
                            {item.service_scope ? (
                              <span className="text-orange-400/90 font-medium">{item.service_scope}</span>
                            ) : (
                              cat?.item_code || item.item_code || "—"
                            )}
                            {(item.specifications || cat?.specifications) && (
                              <span className="ml-1 opacity-80">· {String(item.specifications || cat?.specifications).slice(0, 40)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)] whitespace-nowrap">
                      {item.qty} {item.uom || cat?.uom || (isServiceItem ? "paket" : "pcs")}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs text-[var(--ui-text-secondary)] whitespace-nowrap">
                      {item.expected_date || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)] text-right tabular-nums whitespace-nowrap">
                      {item.estimated_price ? `IDR ${Number(item.estimated_price).toLocaleString()}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
