import {
  Boxes,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  AlertTriangle,
  Search,
  Upload,
  X,
  Clock,
  SlidersHorizontal,
  ShoppingCart,
} from "lucide-react";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import { formatQuantity, toNumeric } from "../data/quantity";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";

interface Props {
  cardClass: string;
  inputClass: string;
  stockSummary: {
    totalSkus: number;
    totalOnHand: number;
    totalAvailable: number;
    lowStockCount: number;
  };
  stockFilterLowOnly: boolean;
  setStockFilterLowOnly: (v: boolean) => void;
  filteredStock: any[];
  stockSearch: string;
  setStockSearch: (v: string) => void;
  stockWarehouseId: string;
  setStockWarehouseId: (v: string) => void;
  warehouses: any[];
  stockCategory: string;
  setStockCategory: (v: string) => void;
  stockCategories: string[];
  setStockImportOpen: (v: boolean) => void;
  hasStockFilters: boolean;
  stockGroupedByBinType: Array<{ type: string; items: any[] }>;
  BIN_TYPE_LABELS: Record<string, any>;
  leadTimes: Record<string, any>;
  handleOpenReorderConfig: (item: any) => void;
  handleOpenReorderModal: (item: any) => void;
  onNavigateToReceiving: () => void;
}

export function WmsStockTab({
  cardClass,
  inputClass,
  stockSummary,
  stockFilterLowOnly,
  setStockFilterLowOnly,
  filteredStock,
  stockSearch,
  setStockSearch,
  stockWarehouseId,
  setStockWarehouseId,
  warehouses,
  stockCategory,
  setStockCategory,
  stockCategories,
  setStockImportOpen,
  hasStockFilters,
  stockGroupedByBinType,
  BIN_TYPE_LABELS,
  leadTimes,
  handleOpenReorderConfig,
  handleOpenReorderModal,
  onNavigateToReceiving,
}: Props) {
  return (
    <div className="space-y-4">
      <WmsWorkflowGuide
        title="Read stock before making changes"
        description="On hand is the physical quantity. Allocated is reserved for an order. Available is what can still be promised."
        steps={["Find SKU", "Check bin availability", "Set reorder level"]}
      />

      {/* Quick KPI Stat Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={cardClass + " flex items-center gap-3 p-3.5"}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
            <Boxes size={18} />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
              {stockSummary.totalSkus}
            </p>
            <p className="text-[11px] text-[var(--ui-text-muted)]">Tracked SKUs</p>
          </div>
        </div>
        <div className={cardClass + " flex items-center gap-3 p-3.5"}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <WarehouseIcon size={18} />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
              {formatQuantity(stockSummary.totalOnHand)}
            </p>
            <p className="text-[11px] text-[var(--ui-text-muted)]">Fisik On-Hand</p>
          </div>
        </div>
        <div className={cardClass + " flex items-center gap-3 p-3.5"}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
              {formatQuantity(stockSummary.totalAvailable)}
            </p>
            <p className="text-[11px] text-[var(--ui-text-muted)]">Siap Dipakai (Available)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStockFilterLowOnly(!stockFilterLowOnly)}
          className={`${cardClass} flex items-center justify-between gap-3 p-3.5 text-left transition-all cursor-pointer ${
            stockFilterLowOnly
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40"
              : "hover:border-[var(--ui-border)]/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                stockSummary.lowStockCount > 0
                  ? "bg-amber-500/15 text-amber-500"
                  : "bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
                {stockSummary.lowStockCount}
              </p>
              <p className="text-[11px] text-[var(--ui-text-muted)]">Stok Menipis</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              stockFilterLowOnly
                ? "bg-amber-500 text-white"
                : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
            }`}
          >
            {stockFilterLowOnly ? "Aktif" : "Filter"}
          </span>
        </button>
      </div>

      <div className={cardClass + " overflow-hidden p-0"}>
        <div className="border-b border-[var(--ui-border)] px-4 py-3">
          {/* Toolbar: title + filters all in one row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                <Boxes size={14} className="text-violet-500" />
              </span>
              <span className="font-bold text-sm text-[var(--ui-text-primary)]">Live Inventory</span>
              <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--ui-text-secondary)]">
                {filteredStock.length} lokasi
              </span>
            </div>
            {/* Search */}
            <div className="relative min-w-[160px] flex-1 max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] pointer-events-none" />
              <input
                className={inputClass + " pl-9 py-1.5 text-xs"}
                placeholder="Cari SKU, item, atau bin…"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>
            <select
              style={{ width: "10rem" }}
              className="shrink-0 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-1.5 text-xs text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)] transition-colors cursor-pointer"
              value={stockWarehouseId}
              onChange={(e) => setStockWarehouseId(e.target.value)}
            >
              <option value="">Semua gudang</option>
              {warehouses.map((warehouse: any) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <select
              style={{ width: "9rem" }}
              className="shrink-0 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-1.5 text-xs text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)] transition-colors cursor-pointer"
              value={stockCategory}
              onChange={(e) => setStockCategory(e.target.value)}
            >
              <option value="">Semua kategori</option>
              {stockCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setStockImportOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ui-text-brand)]/30 bg-[var(--ui-text-brand)]/8 px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-brand)] transition-colors hover:bg-[var(--ui-text-brand)]/14 cursor-pointer"
            >
              <Upload size={13} /> Import stok
            </button>
            {hasStockFilters && (
              <button
                type="button"
                onClick={() => {
                  setStockSearch("");
                  setStockWarehouseId("");
                  setStockCategory("");
                  setStockFilterLowOnly(false);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--ui-border)] px-2 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
              >
                <X size={11} /> Reset
              </button>
            )}
          </div>
        </div>
        {filteredStock.length > 0 ? (
          <div className="divide-y divide-[var(--ui-border)]">
            {stockGroupedByBinType.map(({ type, items }) => {
              const meta = BIN_TYPE_LABELS[type] ?? BIN_TYPE_LABELS["other"];
              return (
                <div key={type}>
                  {/* Section header per bin type */}
                  <div className="flex items-center gap-2 border-b border-[var(--ui-border)] px-4 py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-xs text-[var(--ui-text-muted)]">{meta.description}</span>
                    <span className="ml-auto shrink-0 rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-0.5 text-[11px] font-medium text-[var(--ui-text-secondary)]">
                      {items.length} record{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <TableContainer><Table size="small" sx={{ minWidth: 850 }}>
                      <TableHead sx={{ bgcolor: "action.hover" }}>
                        <TableRow>
                          <TableCell sx={{ px: 2, py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Item</TableCell>
                          <TableCell sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Location</TableCell>
                          <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>On hand</TableCell>
                          <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Reserved</TableCell>
                          <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Available</TableCell>
                          <TableCell sx={{ px: 2, py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Ambang Batas &amp; Lead Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((x: any) => {
                          const available =
                            toNumeric(x.on_hand) - toNumeric(x.allocated);
                          const belowReorder =
                            toNumeric(x.reorder_level) > 0 &&
                            available <= toNumeric(x.reorder_level);
                          const currentLeadDays =
                            leadTimes[x.id] !== undefined
                              ? toNumeric(leadTimes[x.id])
                              : toNumeric(x.lead_time_days || 0);

                          return (
                            <TableRow key={x.id} hover>
                              <TableCell sx={{ px: 2, py: 1.5, verticalAlign: "middle" }}>
                                <p className="font-semibold text-[var(--ui-text-primary)]">
                                  {x.item_name}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-xs">
                                  <span className="rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ui-text-secondary)]">
                                    {x.sku}
                                  </span>
                                  <span className="text-[var(--ui-text-muted)]">
                                    {x.catalogue_category || "Uncategorised"}
                                  </span>
                                  {belowReorder && (
                                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                      Stok Menipis
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell sx={{ py: 1.5, verticalAlign: "middle" }}>
                                <p className="font-medium text-[var(--ui-text-primary)]">{x.warehouse_name}</p>
                                <p className="mt-0.5 font-mono text-xs text-[var(--ui-text-muted)]">
                                  {x.bin_location || "No bin assigned"}
                                </p>
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1.5, verticalAlign: "middle", fontVariantNumeric: "tabular-nums" }}>
                                <span className="font-semibold text-[var(--ui-text-primary)]">
                                  {formatQuantity(x.on_hand)}
                                </span>{" "}
                                <span className="text-xs text-[var(--ui-text-muted)]">
                                  {x.uom || "unit"}
                                </span>
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1.5, verticalAlign: "middle", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                                {formatQuantity(x.allocated)}
                              </TableCell>
                              <TableCell align="right" sx={{ py: 1.5, verticalAlign: "middle", fontVariantNumeric: "tabular-nums" }}>
                                <span
                                  className={
                                    belowReorder
                                      ? "font-bold text-amber-500"
                                      : "font-bold text-emerald-500"
                                  }
                                >
                                  {formatQuantity(available)}
                                </span>
                              </TableCell>
                              <TableCell sx={{ px: 2, py: 1.5, verticalAlign: "middle" }}>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <span className="text-[var(--ui-text-muted)]">Min:</span>
                                      <span className="font-semibold text-[var(--ui-text-primary)]">
                                        {toNumeric(x.reorder_level) > 0
                                          ? `${formatQuantity(x.reorder_level)} ${x.uom || "unit"}`
                                          : "Belum diatur"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--ui-text-muted)]">
                                      <Clock size={11} />
                                      <span>
                                        {currentLeadDays > 0
                                          ? `Lead: ${currentLeadDays} hari`
                                          : "Lead: —"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReorderConfig(x)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)] transition-colors cursor-pointer"
                                      title="Atur Ambang Batas Stok"
                                    >
                                      <SlidersHorizontal size={12} />
                                      Atur
                                    </button>
                                    {belowReorder && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReorderModal(x)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors cursor-pointer"
                                      >
                                        <ShoppingCart size={12} />
                                        PO
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table></TableContainer>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
              <Boxes size={26} className="text-violet-400" />
            </span>
            <div>
              <p className="font-bold text-[var(--ui-text-primary)]">Belum ada inventory</p>
              <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                Terima barang masuk terlebih dahulu. Kuantitas yang diterima akan muncul di sini.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToReceiving}
              className="mt-1 rounded-lg border border-[var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-brand)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
            >
              Ke halaman Receiving
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
