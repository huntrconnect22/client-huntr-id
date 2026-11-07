import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Boxes,
  Building2,
  Clock,
  Layers,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import { formatQuantity, toNumeric } from "../data/quantity";
import {
  Table as HuntrTable,
  TableHead as HuntrTableHead,
  TableRow as HuntrTableRow,
  TableHeaderCell as HuntrTableHeaderCell,
  TableBody as HuntrTableBody,
  TableCell as HuntrTableCell,
} from "~/shared/ui/Table";

interface Props {
  report: any;
  warehouses: any[];
  handleOpenReorderModal: (item: any) => void;
}

export function WmsReportsTab({
  report,
  warehouses,
  handleOpenReorderModal,
}: Props) {
  return (
    <div className="space-y-4">
      <WmsWorkflowGuide
        title="Warehouse performance & inventory analytics"
        description="Review availability, physical inventory movement, and SKUs requiring procurement replenishment."
        steps={[
          "Review availability",
          "Inspect movement",
          "Resolve alerts",
        ]}
      />

      {/* KPI Metric Highlights */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Gudang Aktif Terhubung",
            value: String(report?.stock_by_warehouse?.length || 0),
            subtext: `${warehouses.length} fasilitas terdaftar`,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            Icon: Building2,
          },
          {
            label: "SKU Terdaftar di Katalog",
            value: formatQuantity(report?.catalogue_linked_skus || 0),
            subtext: "Terhubung otomatis dengan POS/RFQ",
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            Icon: Boxes,
          },
          {
            label: "Peringatan Restock (Low Stock)",
            value: formatQuantity(report?.low_stock_items?.length || 0),
            subtext: (report?.low_stock_items?.length || 0) > 0 ? "Perlu pengajuan Purchase Order" : "Semua stok dalam batas aman",
            color: (report?.low_stock_items?.length || 0) > 0 ? "text-amber-500" : "text-emerald-500",
            bg: (report?.low_stock_items?.length || 0) > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
            Icon: (report?.low_stock_items?.length || 0) > 0 ? AlertTriangle : ShieldCheck,
          },
        ].map(({ label, value, subtext, color, bg, Icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4.5 shadow-sm">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
              <Icon size={22} />
            </span>
            <div>
              <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--ui-text-primary)]">{label}</p>
              <p className="text-[11px] text-[var(--ui-text-muted)]">{subtext}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Posisi Stok per Gudang */}
        <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]">
                <Building2 size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">Posisi Stok per Gudang</h3>
                <p className="text-[11px] text-[var(--ui-text-muted)]">Perbandingan fisik on-hand dengan kuantitas yang teralokasi order</p>
              </div>
            </div>
            <span className="text-xs text-[var(--ui-text-muted)]">
              {report?.stock_by_warehouse?.length || 0} Gudang
            </span>
          </div>

          <div className="overflow-x-auto">
            <HuntrTable className="w-full min-w-[500px] text-left text-sm">
              <HuntrTableHead>
                <HuntrTableRow className="border-b border-[var(--ui-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                  <HuntrTableHeaderCell className="py-2.5">Fasilitas Gudang</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell className="text-right">Varian SKU</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell className="text-right">Fisik (On-Hand)</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell className="text-right">Teralokasi</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell className="text-right">Ketersediaan</HuntrTableHeaderCell>
                </HuntrTableRow>
              </HuntrTableHead>
              <HuntrTableBody className="divide-y divide-[var(--ui-border)]">
                {(report?.stock_by_warehouse || []).map((x: any) => {
                  const onHand = toNumeric(x.on_hand) || 0;
                  const allocated = toNumeric(x.allocated) || 0;
                  const available = Math.max(0, onHand - allocated);
                  const freePct = onHand > 0 ? Math.round((available / onHand) * 100) : 100;
                  return (
                    <HuntrTableRow key={x.id} className="group hover:bg-[var(--ui-bg-input)]/40 transition-colors">
                      <HuntrTableCell className="py-3">
                        <p className="font-semibold text-xs text-[var(--ui-text-primary)]">{x.name}</p>
                        <span className="font-mono text-[11px] text-[var(--ui-text-muted)]">{x.code}</span>
                      </HuntrTableCell>
                      <HuntrTableCell className="text-right font-medium text-xs tabular-nums text-[var(--ui-text-secondary)]">
                        {x.sku_count}
                      </HuntrTableCell>
                      <HuntrTableCell className="text-right font-bold text-xs tabular-nums text-[var(--ui-text-primary)]">
                        {formatQuantity(onHand)}
                      </HuntrTableCell>
                      <HuntrTableCell className="text-right font-medium text-xs tabular-nums text-amber-500">
                        {formatQuantity(allocated)}
                      </HuntrTableCell>
                      <HuntrTableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-xs tabular-nums text-emerald-500">
                            {formatQuantity(available)}
                          </span>
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--ui-bg-input)]">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${Math.min(100, freePct)}%` }}
                            />
                          </div>
                        </div>
                      </HuntrTableCell>
                    </HuntrTableRow>
                  );
                })}
                {!report?.stock_by_warehouse?.length && (
                  <HuntrTableRow>
                    <HuntrTableCell colSpan={5} className="py-8 text-center text-xs text-[var(--ui-text-muted)]">
                      Belum ada data stok per gudang tercatat.
                    </HuntrTableCell>
                  </HuntrTableRow>
                )}
              </HuntrTableBody>
            </HuntrTable>
          </div>
        </div>

        {/* Pergerakan 30 Hari Terakhir */}
        <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]">
                <Activity size={16} />
              </span>
              <div>
                <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">Aktivitas Gudang 30 Hari Terakhir</h3>
                <p className="text-[11px] text-[var(--ui-text-muted)]">Ringkasan volume arus barang berdasarkan jenis transaksi</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {(report?.movement_summary || []).map((x: any) => {
              const typeConfig: Record<string, { label: string; bg: string; text: string; Icon: any }> = {
                receive: { label: "Penerimaan Barang (Inbound)", bg: "bg-emerald-500/10", text: "text-emerald-500", Icon: ArrowDownToLine },
                putaway: { label: "Put Away ke Rak Tetap", bg: "bg-blue-500/10", text: "text-blue-500", Icon: Layers },
                allocate: { label: "Alokasi Pesanan", bg: "bg-violet-500/10", text: "text-violet-500", Icon: PackageCheck },
                transfer: { label: "Transfer Antar-Gudang", bg: "bg-cyan-500/10", text: "text-cyan-500", Icon: Truck },
                adjust: { label: "Penyesuaian Opname", bg: "bg-amber-500/10", text: "text-amber-500", Icon: Activity },
                ship: { label: "Pengiriman / Dispatch", bg: "bg-rose-500/10", text: "text-rose-500", Icon: ArrowRight },
                shipment: { label: "Pengiriman / Dispatch", bg: "bg-rose-500/10", text: "text-rose-500", Icon: ArrowRight },
              };
              const cfg = typeConfig[x.type?.toLowerCase()] || {
                label: x.type,
                bg: "bg-[var(--ui-bg-input)]",
                text: "text-[var(--ui-text-secondary)]",
                Icon: Activity,
              };
              const OpIcon = cfg.Icon;
              return (
                <div
                  key={x.type}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/25 p-3 hover:bg-[var(--ui-bg-input)]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>
                      <OpIcon size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[var(--ui-text-primary)]">{cfg.label}</p>
                      <p className="text-[11px] text-[var(--ui-text-muted)]">{formatQuantity(x.transactions)} transaksi tercatat</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-[var(--ui-text-primary)]">
                      {formatQuantity(x.quantity)} <span className="text-[11px] font-normal text-[var(--ui-text-muted)]">unit</span>
                    </p>
                  </div>
                </div>
              );
            })}
            {!report?.movement_summary?.length && (
              <div className="py-8 text-center text-xs text-[var(--ui-text-muted)]">
                Belum ada pergerakan stok dalam 30 hari terakhir.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replenishment Alerts */}
      <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle size={16} />
            </span>
            <div>
              <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">
                Peringatan Ambang Batas Minimum (Reorder Point Alerts)
              </h3>
              <p className="text-[11px] text-[var(--ui-text-muted)]">
                Daftar stok yang telah menyentuh atau di bawah batas minimum pemesanan ulang untuk segera di-restock
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              (report?.low_stock_items?.length || 0) > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {report?.low_stock_items?.length || 0} SKU Perlu Perhatian
          </span>
        </div>

        <div className="mt-4">
          {(report?.low_stock_items || []).map((x: any) => {
            const leadDays = toNumeric(x.lead_time_days || 0);
            const deficit = Math.max(0, toNumeric(x.reorder_level) - toNumeric(x.available));
            return (
              <div
                key={`${x.sku}-${x.warehouse_name}-${x.bin_location}`}
                className="flex flex-col gap-3 border-b border-[var(--ui-border)] py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--ui-text-primary)]">
                      {x.item_name}
                    </span>
                    <span className="rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ui-text-secondary)]">
                      {x.sku}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ui-text-secondary)]">
                    <span>
                      📍 {x.warehouse_name} ({x.bin_location || "Tanpa Bin"})
                    </span>
                    <span>·</span>
                    <span>
                      Tersedia:{" "}
                      <strong className="text-amber-500 font-bold">
                        {formatQuantity(x.available)} {x.uom || "unit"}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Min. Reorder: {formatQuantity(x.reorder_level)} {x.uom || "unit"}
                    </span>
                    {deficit > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-rose-500">
                          Defisit: {formatQuantity(deficit)} {x.uom || "unit"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {leadDays > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                        <Clock size={13} />
                        Lead time: {leadDays} hari · Estimasi barang tiba:{" "}
                        {x.estimated_arrival
                          ? new Date(x.estimated_arrival).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : `${leadDays} hari setelah pemesanan`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[var(--ui-text-muted)]">
                        <Clock size={13} /> Lead time belum diatur
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReorderModal(x)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ui-text-brand)] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer border-0"
                  >
                    <ShoppingCart size={14} />
                    Buat Purchase Order (PO)
                  </button>
                </div>
              </div>
            );
          })}
          {!report?.low_stock_items?.length && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--ui-border)] py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <ShieldCheck size={26} />
              </div>
              <p className="font-bold text-sm text-[var(--ui-text-primary)]">Kondisi Stok Optimal · Seluruh SKU di Batas Aman</p>
              <p className="max-w-md text-xs text-[var(--ui-text-muted)]">
                Tidak ada SKU yang berada di bawah ambang batas minimum pemesanan ulang (Reorder Point). Sistem otomatis memperingatkan saat stok menipis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
