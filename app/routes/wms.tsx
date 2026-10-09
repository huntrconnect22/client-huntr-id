import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  Boxes,
  Building2,
  Check,
  ChevronRight,
  Loader2,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Truck,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import Layout from "../components/Layout";
import { WmsOverview, WmsWorkflowGuide } from "../components/wms/WmsOverview";
import type { PickerItem } from "../components/wms/GenericPickerModal";
import { GenericPickerModal } from "../components/wms/GenericPickerModal";
import type { StockPickerItem } from "../components/wms/StockPickerModal";
import { StockPickerModal } from "../components/wms/StockPickerModal";
import {
  adjustStock,
  allocateStock,
  checkWmsStockAvailability,
  createWarehouse,
  getInboundPurchaseOrders,
  getWmsCatalogue,
  getWmsDashboard,
  getWmsOrders,
  getWmsReceipts,
  getWmsReport,
  getWmsStock,
  getWarehouses,
  installWms,
  importExistingGoodsReceipts,
  repairWmsLegacyGoodsReceiptStock,
  putAwayStock,
  packWmsOrder,
  receiveStock,
  releaseWmsOrder,
  setWmsReorderLevel,
  shipWmsOrder,
  startWmsPicking,
  transferStock,
  updateWarehouse,
} from "../lib/api/wms";

const card = "border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4";
const input =
  "w-full rounded-md border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none";

const toNumeric = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "-") return 0;
    const negative = trimmed.startsWith("-");
    const digits = negative ? trimmed.slice(1) : trimmed;

    // 1) Native parse first — works for US/backend style: "4", "4.000", "1234.56", "-4.000"
    const native = Number(trimmed);
    if (!Number.isNaN(native)) {
      const hasDots = (digits.match(/\./g) || []).length;
      if (hasDots > 1) {
        const stripped = Number(digits.replace(/\./g, "").replace(/,/g, "."));
        if (!Number.isNaN(stripped)) return negative ? -stripped : stripped;
      }
      if (hasDots === 1) {
        const [beforeDot, afterDot] = digits.split(".");
        if (
          afterDot &&
          afterDot.length === 3 &&
          /^\d+$/.test(afterDot) &&
          // Ambiguous: "4.000" (4) vs "12.500" (12500).
          // Treat as thousand separator ONLY when digits before dot are
          // >= 2 characters (>= 10 thousand) OR the afterDot has non-zero
          // digits AND the overall length looks like a real thousand group.
          (beforeDot.length >= 2 || /[1-9]/.test(afterDot)) &&
          beforeDot.length + afterDot.length >= 5
        ) {
          const asThousand = Number(digits.replace(/\./g, ""));
          if (!Number.isNaN(asThousand)) {
            return negative ? -asThousand : asThousand;
          }
        }
      }
      return native;
    }

    // 2) Native failed (pure id-ID formatting): strip thousand separators
    //    then treat comma as decimal separator.
    const normalized = digits.replace(/\./g, "").replace(/,/g, ".");
    const n = Number(normalized);
    if (!Number.isNaN(n)) return negative ? -n : n;
    return 0;
  }
  return 0;
};

const formatQuantity = (value: unknown, maximumFractionDigits = 3): string => {
  const num = toNumeric(value);
  if (Number.isInteger(num) && Math.abs(num) < 1000) {
    return String(num);
  }
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits,
    ...(Number.isInteger(num) ? { maximumFractionDigits: 0 } : {}),
  }).format(num);
};

const browseBtn =
  "w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] hover:border-[var(--ui-text-brand)]/40 hover:bg-[var(--ui-bg-card-hover)] px-3 py-2 text-left text-sm text-[var(--ui-text-primary)] outline-none transition-colors";

function PickerBrowseButton({
  label,
  placeholder,
  selected,
  onClick,
}: {
  label: string;
  placeholder: string;
  selected: PickerItem | StockPickerItem | null;
  onClick: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">{label}</div>
      <button type="button" className={browseBtn} onClick={onClick}>
        {selected ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {"sku" in selected ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{selected.item_name}</span>
                    <span className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--ui-text-brand)]">
                      {selected.sku}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
                    {selected.warehouse_name || ""}
                    {selected.bin_location
                      ? `${selected.warehouse_name ? " · " : ""}${selected.bin_location}`
                      : ""}
                  </div>
                </>
              ) : (
                <>
                  <div className="truncate text-sm font-semibold">{selected.title}</div>
                  {selected.subtitle && (
                    <div className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
                      {selected.subtitle}
                    </div>
                  )}
                </>
              )}
            </div>
            <ChevronRight size={16} className="shrink-0 text-[var(--ui-text-muted)]" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 text-[var(--ui-text-muted)]">
            <span>{placeholder}</span>
            <Search size={15} />
          </div>
        )}
      </button>
      {selected && (
        <div className="mt-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/50 px-3 py-2">
          {"sku" in selected ? (
            <div className="flex items-center gap-2 text-[11px] text-[var(--ui-text-secondary)]">
              <WarehouseIcon size={12} className="text-[var(--ui-text-muted)]" />
              <span className="truncate">
                {selected.warehouse_name || "—"}
                {selected.bin_location ? ` · ${selected.bin_location}` : ""}
              </span>
              <span className="ml-auto tabular-nums font-semibold text-[var(--ui-text-success)]">
                available {formatQuantity(Number(selected.on_hand) - Number(selected.allocated))}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {selected.meta?.slice(0, 3).map((m, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">{m.label}</span>
                  <span className="tabular-nums font-semibold text-[var(--ui-text-secondary)]">{m.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CatalogueSkuInput({
  label,
  placeholder,
  helperText,
  value,
  onValueChange,
  onBrowse,
}: {
  label: string;
  placeholder: string;
  helperText?: string;
  value: string;
  onValueChange: (sku: string) => void;
  onBrowse: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
        {label}
      </div>
      <div className="flex gap-2">
        <input
          className={input + " min-w-0 flex-1"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm font-semibold text-[var(--ui-text-primary)] transition-colors hover:border-[var(--ui-text-brand)]/40"
        >
          <Search size={15} className="text-[var(--ui-text-muted)]" />
          Browse
        </button>
      </div>
      {helperText && (
        <p className="text-[11px] text-[var(--ui-text-muted)]">{helperText}</p>
      )}
    </div>
  );
}

type PickerKind =
  | "receive_warehouse"
  | "receive_po"
  | "receive_po_line"
  | "receive_condition"
  | "receive_catalogue_sku"
  | "putaway_warehouse"
  | "putaway_sku"
  | "putaway_from_bin"
  | "putaway_to_bin"
  | "allocate_warehouse"
  | "allocate_sku"
  | "transfer_from_wh"
  | "transfer_to_wh"
  | "transfer_sku"
  | "adjust_warehouse"
  | "adjust_sku";

export default function WmsPage() {
  const [company, setCompany] = useState<any>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dash, setDash] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inboundOrders, setInboundOrders] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [tab, setTab] = useState("Overview");

  const [picker, setPicker] = useState<{ kind: PickerKind | null; open: boolean }>({
    kind: null,
    open: false,
  });
  const openPicker = useCallback((kind: PickerKind) => setPicker({ kind, open: true }), []);
  const closePicker = useCallback(() => setPicker({ kind: null, open: false }), []);
  const [selections, setSelections] = useState<Record<string, PickerItem | StockPickerItem | null>>({});
  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    address: "",
  });
  const [receiveForm, setReceiveForm] = useState({
    warehouse_id: "",
    purchase_order_id: "",
    catalogue_id: "",
    sku: "",
    item_name: "",
    quantity: "",
    bin_location: "",
    rejected_quantity: "0",
    condition: "good",
    inspection_notes: "",
  });
  const [receiveKey, setReceiveKey] = useState(() => crypto.randomUUID());
  const [receiveLines, setReceiveLines] = useState<any[]>([]);
  const [receiptLineNotice, setReceiptLineNotice] = useState("");
  const [allocateForm, setAllocateForm] = useState({
    warehouse_id: "",
    order_number: "",
    sku: "",
    quantity: "",
  });
  const [putawayForm, setPutawayForm] = useState({
    warehouse_id: "",
    sku: "",
    from_bin_id: "",
    to_bin_id: "",
    quantity: "",
  });
  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    sku: "",
    from_bin: "",
    to_bin: "",
    quantity: "",
  });
  const [adjustForm, setAdjustForm] = useState({
    warehouse_id: "",
    sku: "",
    bin_location: "",
    quantity: "",
    reason: "",
  });
  const [shipping, setShipping] = useState<
    Record<string, { carrier: string; tracking_number: string }>
  >({});
  const [reorderLevels, setReorderLevels] = useState<Record<number, string>>(
    {},
  );
  useEffect(() => {
    try {
      setCompany(JSON.parse(localStorage.getItem("active_company") || "null"));
    } catch {
      setCompany(null);
    }
  }, []);
  const refresh = useCallback(async () => {
    if (!company?.id) return;
    try {
      try {
        await repairWmsLegacyGoodsReceiptStock(company.id);
      } catch {
        /* repair is best-effort; stock load continues */
      }
      const [d, w, s, r, c, rcv, o, po] = await Promise.all([
        getWmsDashboard(company.id),
        getWarehouses(company.id),
        getWmsStock(company.id),
        getWmsReport(company.id),
        getWmsCatalogue(company.id),
        getWmsReceipts(company.id),
        getWmsOrders(company.id),
        getInboundPurchaseOrders(company.id),
      ]);
      setDash(d);
      setWarehouses(w?.data || []);
      setStock(s?.data?.data || s?.data || []);
      setReport(r);
      setCatalogue(c?.data || []);
      setReceipts(rcv?.data?.data || []);
      setOrders(o?.data?.data || []);
      setInboundOrders(po?.data || []);
      setInstalled(true);
    } catch (e: any) {
      if ((e.message || "").toLowerCase().includes("install"))
        setInstalled(false);
      else setError(e.message || "Gagal memuat data gudang.");
    }
  }, [company]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e: any) {
      setError(e.message || "Operasi gagal.");
    } finally {
      setBusy(false);
    }
  };

  const nonAllocatableBinIds = useMemo(() => {
    const ids = new Set<string>();
    for (const w of warehouses) {
      for (const bin of w.bins || []) {
        const type = String(bin.type ?? "").toLowerCase();
        if (type === "receiving" || type === "quarantine") {
          ids.add(String(bin.id));
        }
      }
    }
    return ids;
  }, [warehouses]);

  const isAllocatableStockRow = useCallback(
    (x: StockPickerItem) =>
      !nonAllocatableBinIds.has(String(x.bin_id ?? "")) &&
      !["RECEIVING", "QUARANTINE"].includes(
        String(x.bin_location ?? "").toUpperCase(),
      ),
    [nonAllocatableBinIds],
  );

  const allocationAvailable = stock
    .filter(
      (item: any) =>
        String(item.warehouse_id) === String(allocateForm.warehouse_id) &&
        item.sku === allocateForm.sku &&
        !nonAllocatableBinIds.has(String(item.bin_id ?? "")) &&
        !["RECEIVING", "QUARANTINE"].includes(
          String(item.bin_location ?? "").toUpperCase(),
        ),
    )
    .reduce(
      (total: number, item: any) =>
        total +
        toNumeric(item.on_hand) -
        toNumeric(item.allocated),
      0,
    );
  const allocationRequested = Number(allocateForm.quantity || 0);
  const allocationSufficient =
    allocationRequested > 0 && allocationAvailable >= allocationRequested;

  const cataloguePickerItems: PickerItem[] = useMemo(
    () =>
      catalogue.map((item: any) => ({
        id: String(item.id),
        title: item.name || String(item.item_code),
        subtitle: String(item.item_code),
        searchable: `${item.item_code} ${item.name ?? ""}`,
        meta: [
          {
            label: "SKU",
            value: String(item.item_code),
            tone: "brand" as const,
          },
        ],
      })),
    [catalogue],
  );

  const conditionPickerItems: PickerItem[] = useMemo(
    () => [
      {
        id: "good",
        title: "Good",
        subtitle: "Inspection passed — fully accepted",
        meta: [
          { label: "Tone", value: "Accepted", tone: "success" as const },
        ],
      },
      {
        id: "damaged",
        title: "Damaged",
        subtitle: "Goods arrived damaged",
        meta: [
          { label: "Tone", value: "Review", tone: "brand" as const },
        ],
      },
      {
        id: "short",
        title: "Short shipment",
        subtitle: "Less quantity received than ordered",
        meta: [
          { label: "Tone", value: "Short", tone: "muted" as const },
        ],
      },
      {
        id: "other",
        title: "Other",
        subtitle: "Custom inspection note required",
        meta: [
          { label: "Tone", value: "Manual", tone: "default" as const },
        ],
      },
    ],
    [],
  );

  const warehousePickerItems: PickerItem[] = useMemo(
    () =>
      warehouses.map((w: any) => ({
        id: String(w.id),
        title: w.name,
        subtitle: `${w.code} · ${w.address || "—"}`,
        meta: [
          {
            label: "Bins",
            value: String(w.bins?.length || 0),
            tone: "muted" as const,
          },
        ],
      })),
    [warehouses],
  );

  const poPickerItems: PickerItem[] = useMemo(
    () =>
      inboundOrders.map((po: any) => ({
        id: String(po.id),
        title: po.po_number,
        subtitle: `${po.vendor_name || "Vendor"} · ${po.status || "open"}`,
        meta: [
          {
            label: "Lines",
            value: String(po.lines?.length || 0),
            tone: "muted" as const,
          },
        ],
      })),
    [inboundOrders],
  );

  const poLinePickerItems: PickerItem[] = useMemo(() => {
    const po = inboundOrders.find(
      (x: any) => String(x.id) === String(receiveForm.purchase_order_id),
    );
    return (po?.lines || [])
      .filter((line: any) => Number(line.remaining_quantity || 0) > 0)
      .map((line: any) => ({
        id: String(line.sku),
        title: line.name || line.sku,
        subtitle: `${line.sku}`,
        meta: [
          {
            label: "Remaining",
            value: String(line.remaining_quantity || 0),
            tone: "brand" as const,
          },
        ],
      }));
  }, [inboundOrders, receiveForm.purchase_order_id]);

  const putawayBinItems = useMemo(() => {
    const bins =
      warehouses.find((w: any) => String(w.id) === putawayForm.warehouse_id)
        ?.bins || [];
    return {
      all: bins.map((bin: any) => ({
        id: String(bin.id),
        title: bin.name || bin.code,
        subtitle: `${bin.code} · ${bin.type}`,
        meta: [
          {
            label: "Status",
            value: bin.status || "active",
            tone: bin.status === "active" ? ("success" as const) : ("muted" as const),
          },
        ],
      })),
      storage: bins
        .filter(
          (bin: any) =>
            ["storage", "picking", "packing"].includes(bin.type) &&
            bin.status === "active",
        )
        .map((bin: any) => ({
          id: String(bin.id),
          title: bin.name || bin.code,
          subtitle: `${bin.code} · ${bin.type}`,
          meta: [
            { label: "Type", value: bin.type, tone: "brand" as const },
          ],
        })),
    };
  }, [warehouses, putawayForm.warehouse_id]);

  const stockPickerAll: StockPickerItem[] = useMemo(
    () =>
      stock.map((x: any) => ({
        id: x.id,
        sku: x.sku,
        item_name: x.item_name,
        uom: x.uom,
        bin_location: x.bin_location,
        warehouse_id: x.warehouse_id,
        warehouse_name: x.warehouse_name,
        warehouse_code: x.warehouse_code,
        on_hand: x.on_hand,
        allocated: x.allocated,
        catalogue_id: x.catalogue_id,
        bin_id: x.bin_id,
      })),
    [stock],
  );

  const printGrn = (receipt: any) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setError("Pop-up diblokir browser. Izinkan pop-up untuk mencetak GRN.");
      return;
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const lines = receipt.lines || [];
    const rows = lines
      .map(
        (line: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(line.item_name)}</strong><br /><small>${escapeHtml(line.sku)}</small></td>
            <td>${escapeHtml(line.uom)}</td>
            <td>${formatQuantity(line.received_quantity)}</td>
            <td>${formatQuantity(line.accepted_quantity)}</td>
            <td>${formatQuantity(line.rejected_quantity)}</td>
            <td>${escapeHtml(line.condition)}</td>
          </tr>`,
      )
      .join("");
    const totalReceived = lines.reduce(
      (total: number, line: any) => total + Number(line.received_quantity || 0),
      0,
    );
    const totalAccepted = lines.reduce(
      (total: number, line: any) => total + Number(line.accepted_quantity || 0),
      0,
    );
    const totalRejected = lines.reduce(
      (total: number, line: any) => total + Number(line.rejected_quantity || 0),
      0,
    );

    printWindow.document.write(`<!doctype html>
      <html><head><title>GRN ${escapeHtml(receipt.receipt_number)}</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { color: #172033; font: 12px Arial, sans-serif; margin: 0; }
        header { border-bottom: 2px solid #ef7d00; display: flex; justify-content: space-between; padding-bottom: 14px; }
        h1 { font-size: 21px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 24px 0 8px; }
        .muted { color: #65758b; } .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; margin-top: 18px; }
        .meta b { display: block; font-size: 10px; color: #65758b; text-transform: uppercase; }
        table { border-collapse: collapse; margin-top: 12px; width: 100%; } th, td { border: 1px solid #d9e0ea; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f5f7fa; font-size: 10px; text-transform: uppercase; } tfoot td { font-weight: bold; background: #f9fafb; }
        footer { border-top: 1px solid #d9e0ea; color: #65758b; display: flex; justify-content: space-between; margin-top: 42px; padding-top: 12px; }
      </style></head><body>
        <header><div><h1>Goods Received Note</h1><div class="muted">Huntr WMS &amp; Inventory</div></div><div><b>GRN NO.</b><br /><strong>${escapeHtml(receipt.receipt_number)}</strong></div></header>
        <section class="meta">
          <div><b>Company</b>${escapeHtml(company?.name)}</div>
          <div><b>Warehouse</b>${escapeHtml(receipt.warehouse_name)}</div>
          <div><b>Reference / PO</b>${escapeHtml(receipt.reference)}</div>
          <div><b>Received at</b>${receipt.received_at ? escapeHtml(new Date(receipt.received_at).toLocaleString("id-ID")) : "—"}</div>
          <div><b>Status</b>${escapeHtml(receipt.status)}</div>
          <div><b>Received by</b>${escapeHtml(receipt.received_by)}</div>
        </section>
        <h2>Received items</h2>
        <table><thead><tr><th>#</th><th>Item / SKU</th><th>UoM</th><th>Received</th><th>Accepted</th><th>Rejected</th><th>Condition</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No receipt lines.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3">Total</td><td>${formatQuantity(totalReceived)}</td><td>${formatQuantity(totalAccepted)}</td><td>${formatQuantity(totalRejected)}</td><td></td></tr></tfoot></table>
        <footer><span>Generated ${escapeHtml(new Date().toLocaleString("id-ID"))}</span><span>GRN is system generated.</span></footer>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };</script>
      </body></html>`);
    printWindow.document.close();
  };
  if (!company?.id)
    return (
      <Layout
        title="WMS & Inventory"
        subtitle="Pilih company workspace untuk melanjutkan."
      >
        <div className={card}>Pilih perusahaan aktif terlebih dahulu.</div>
      </Layout>
    );
  if (installed === false)
    return (
      <Layout
        title="WMS & Inventory"
        subtitle="Modul gudang belum diaktifkan untuk workspace ini."
      >
        <div className={`${card} max-w-2xl`}>
          <PackageCheck size={30} className="text-[var(--ui-text-brand)]" />
          <h2 className="mt-3 text-lg font-bold">Install dari App Market</h2>
          <p className="my-2 text-sm text-[var(--ui-text-secondary)]">
            Aktifkan WMS &amp; Inventory untuk perusahaan ini. Instalasi siap
            digunakan langsung.
          </p>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await installWms(company.id);
                setInstalled(true);
              })
            }
            className="mt-3 rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white"
          >
            Install module
          </button>
        </div>
      </Layout>
    );
  const tabs = [
    ["Overview", BarChart3],
    ["Stock", Boxes],
    ["Receiving & Put Away", ArrowDownToLine],
    ["Allocation & Packing", PackageCheck],
    ["Transfers", Truck],
    ["Adjustments", Activity],
    ["Warehouses", Building2],
    ["Reports", BarChart3],
  ] as const;
  return (
    <Layout
      title="WMS & Inventory"
      subtitle="Warehouse operations · connected to Huntr Catalogue"
    >
      <div className="w-full space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {tabs.map(([name, Icon]) => (
              <button
                key={name}
                onClick={() => setTab(name)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-semibold whitespace-nowrap ${tab === name ? "border-[var(--ui-text-brand)] bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]" : "border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-secondary)]"}`}
              >
                <Icon size={14} />
                {name}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            className="shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2 text-[var(--ui-text-secondary)]"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
        {error && (
          <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 text-sm text-[var(--ui-text-brand)]">
            {error}
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Saving transaction…
          </div>
        )}
        {tab === "Overview" && (
          <WmsOverview
            dash={dash}
            warehouses={warehouses}
            receipts={receipts}
            stock={stock}
            orders={orders}
            onTabChange={setTab}
          />
        )}
        {tab === "Warehouses" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Start with the physical warehouse"
              description="A warehouse automatically receives Receiving, Storage, and Quarantine bins. Use the code consistently on labels and documents."
              steps={[
                "Create warehouse",
                "Review default bins",
                "Receive first goods",
              ]}
            />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className={card}>
                <h3 className="mb-4 font-bold">Warehouse network</h3>
                <div className="space-y-2">
                  {warehouses.map((w) => (
                    <div
                      key={w.id}
                      className="flex justify-between border border-[var(--ui-border)] p-3"
                    >
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        <p className="text-xs text-[var(--ui-text-muted)]">
                          {w.code} · {w.address || "Address not set"}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          run(() =>
                            updateWarehouse(company.id, w.id, {
                              status:
                                w.status === "active" ? "inactive" : "active",
                            }),
                          )
                        }
                        className="rounded-md border border-[var(--ui-border)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-secondary)]"
                      >
                        {w.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                  {!warehouses.length && (
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      Create a warehouse to begin.
                    </p>
                  )}
                </div>
              </div>
              <form
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await createWarehouse(company.id, warehouseForm);
                    setWarehouseForm({ code: "", name: "", address: "" });
                  });
                }}
              >
                <h3 className="font-bold">Add warehouse</h3>
                <input
                  className={input}
                  placeholder="Warehouse code"
                  required
                  value={warehouseForm.code}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, code: e.target.value })
                  }
                />
                <input
                  className={input}
                  placeholder="Warehouse name"
                  required
                  value={warehouseForm.name}
                  onChange={(e) =>
                    setWarehouseForm({ ...warehouseForm, name: e.target.value })
                  }
                />
                <input
                  className={input}
                  placeholder="Address"
                  value={warehouseForm.address}
                  onChange={(e) =>
                    setWarehouseForm({
                      ...warehouseForm,
                      address: e.target.value,
                    })
                  }
                />
                <button className="inline-flex items-center gap-2 rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  <Plus size={15} />
                  Create warehouse
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Stock" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Read stock before making changes"
              description="On hand is the physical quantity. Allocated is reserved for an order. Available is what can still be promised."
              steps={[
                "Find SKU",
                "Check bin availability",
                "Set reorder level",
              ]}
            />
            <div className={card + " overflow-x-auto"}>
              <h3 className="mb-4 font-bold">Inventory by warehouse</h3>
              {stock.length > 0 ? (
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-xs text-[var(--ui-text-muted)]">
                    <tr>
                      <th className="py-2">SKU / Catalogue</th>
                      <th>Item</th>
                      <th>Warehouse</th>
                      <th>Bin</th>
                      <th>On hand</th>
                      <th>Allocated</th>
                      <th>Available</th>
                      <th>Reorder level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((x: any) => (
                      <tr
                        key={x.id}
                        className="border-t border-[var(--ui-border)]"
                      >
                        <td className="py-3 font-mono text-xs">
                          {x.sku}
                          {x.catalogue_id && (
                            <span className="ml-1 text-[var(--ui-text-brand)]">
                              · linked
                            </span>
                          )}
                        </td>
                        <td>{x.item_name}</td>
                        <td>{x.warehouse_name}</td>
                        <td>{x.bin_location || "—"}</td>
                        <td>
                          {formatQuantity(x.on_hand)} {x.uom}
                        </td>
                        <td>{formatQuantity(x.allocated)}</td>
                        <td>
                          {formatQuantity(
                            Number(x.on_hand) - Number(x.allocated),
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <input
                              aria-label={`Reorder level ${x.sku}`}
                              type="number"
                              min="0"
                              step="0.001"
                              className={input + " w-24 px-2 py-1"}
                              value={
                                reorderLevels[x.id] !== undefined
                                  ? reorderLevels[x.id]
                                  : String(toNumeric(x.reorder_level))
                              }
                              onChange={(e) =>
                                setReorderLevels({
                                  ...reorderLevels,
                                  [x.id]: e.target.value,
                                })
                              }
                            />
                            <button
                              onClick={() =>
                                run(async () => {
                                  await setWmsReorderLevel(
                                    company.id,
                                    x.id,
                                    toNumeric(
                                      reorderLevels[x.id] ?? x.reorder_level ?? 0,
                                    ),
                                  );
                                })
                              }
                              className="rounded-md bg-[var(--ui-bg-input)] px-2 py-1 text-xs"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center">
                  <Boxes
                    size={24}
                    className="mx-auto text-[var(--ui-text-brand)]"
                  />
                  <p className="mt-2 text-sm font-semibold">No inventory yet</p>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                    Receive incoming goods first. Approved quantities will
                    appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("Receiving & Put Away")}
                    className="mt-3 text-xs font-semibold text-[var(--ui-text-brand)]"
                  >
                    Go to receiving
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {tab === "Receiving & Put Away" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Inbound flow: receive, inspect, then store"
              description="Goods first enter Receiving. Only accepted quantity increases inventory; put away moves it to a storage or picking bin."
              steps={[
                "Select warehouse and PO",
                "Add and inspect lines",
                "Confirm receipt",
                "Put away accepted stock",
              ]}
            />
            <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <form
                className={card + " space-y-3 p-3.5"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    if (!receiveLines.length) {
                      throw new Error(
                        "Add at least one receipt line before confirming.",
                      );
                    }
                    await receiveStock(company.id, {
                      warehouse_id: receiveForm.warehouse_id,
                      purchase_order_id:
                        receiveForm.purchase_order_id || undefined,
                      idempotency_key: receiveKey,
                      reference: receiveForm.bin_location || undefined,
                      lines: receiveLines,
                    });
                    setReceiveForm({
                      ...receiveForm,
                      purchase_order_id: "",
                      catalogue_id: "",
                      sku: "",
                      item_name: "",
                      quantity: "",
                      bin_location: "",
                      rejected_quantity: "0",
                      condition: "good",
                      inspection_notes: "",
                    });
                    setReceiveKey(crypto.randomUUID());
                    setReceiveLines([]);
                    setReceiptLineNotice(
                      "Receipt confirmed and sent to the receiving bin.",
                    );
                  });
                }}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
                  <div>
                    <h3 className="font-bold">Receive incoming goods</h3>
                    <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">Create a draft, inspect each line, then confirm it into the receiving bin.</p>
                  </div>
                  <span className="shrink-0 border border-[var(--ui-border)] px-2 py-1 text-[10px] font-semibold text-[var(--ui-text-muted)]">DRAFT</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <PickerBrowseButton
                    label="Warehouse"
                    placeholder="Select warehouse"
                    selected={selections["receive_warehouse"] || null}
                    onClick={() => openPicker("receive_warehouse")}
                  />
                  <PickerBrowseButton
                    label="Purchase order"
                    placeholder="No linked purchase order (optional)"
                    selected={selections["receive_po"] || null}
                    onClick={() => openPicker("receive_po")}
                  />
                </div>
                <div className="space-y-2 border-t border-[var(--ui-border)] pt-3">
                  <p className="text-[10px] font-bold tracking-wider text-[var(--ui-text-muted)] uppercase">Item and inspection</p>
                  <CatalogueSkuInput
                    label="Product variant / SKU"
                    placeholder="Type SKU or browse Huntr Catalogue"
                    helperText="Browse opens the catalogue modal. You can still type any SKU that is not listed."
                    value={receiveForm.sku}
                    onBrowse={() => openPicker("receive_catalogue_sku")}
                    onValueChange={(sku) => {
                      const item = catalogue.find(
                        (x: any) =>
                          String(x.item_code).toLowerCase() ===
                          sku.trim().toLowerCase(),
                      );
                      setReceiveForm({
                        ...receiveForm,
                        catalogue_id: item ? String(item.id) : "",
                        sku,
                        item_name: item?.name || receiveForm.item_name,
                      });
                      setSelections((prev) => {
                        if (!item) {
                          return { ...prev, receive_catalogue_sku: null };
                        }
                        const pickerItem = cataloguePickerItems.find(
                          (p) => p.id === String(item.id),
                        );
                        return {
                          ...prev,
                          receive_catalogue_sku: pickerItem ?? null,
                        };
                      });
                    }}
                  />
                {receiveForm.sku && (
                  <p className="border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-bg-input)] px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
                    Selected SKU identity:{" "}
                    <span className="font-mono font-semibold">
                      {receiveForm.sku}
                    </span>
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <PickerBrowseButton
                    label="Inspection condition"
                    placeholder="Select condition"
                    selected={selections["receive_condition"] || null}
                    onClick={() => openPicker("receive_condition")}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Inspection notes</div>
                    <input
                      className={input}
                      placeholder="Inspection notes"
                      value={receiveForm.inspection_notes}
                      onChange={(e) =>
                        setReceiveForm({
                          ...receiveForm,
                          inspection_notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <input
                  required={!receiveForm.catalogue_id}
                  className={input}
                  placeholder="Item name (required for a new SKU)"
                  value={receiveForm.item_name}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      item_name: e.target.value,
                    })
                  }
                />
                </div>
                {receiveForm.purchase_order_id && (
                  <PickerBrowseButton
                    label="Outstanding PO line"
                    placeholder="Select outstanding PO line"
                    selected={selections["receive_po_line"] || null}
                    onClick={() => openPicker("receive_po_line")}
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={input}
                    placeholder="Received quantity"
                    value={receiveForm.quantity}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        quantity: e.target.value,
                      })
                    }
                  />
                  <input
                    className={input}
                    placeholder="Reference / PO"
                    value={receiveForm.bin_location}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        bin_location: e.target.value,
                      })
                    }
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  max={receiveForm.quantity || undefined}
                  className={input}
                  placeholder="Rejected quantity after inspection"
                  value={receiveForm.rejected_quantity}
                  onChange={(e) =>
                    setReceiveForm({
                      ...receiveForm,
                      rejected_quantity: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    if (
                      (!receiveForm.catalogue_id && !receiveForm.sku) ||
                      !Number(receiveForm.quantity)
                    ) {
                      setError(
                        "Select an item and enter its received quantity first.",
                      );
                      return;
                    }
                    setReceiveLines([
                      ...receiveLines,
                      {
                        ...(receiveForm.catalogue_id
                          ? { catalogue_id: receiveForm.catalogue_id }
                          : { sku: receiveForm.sku }),
                        item_name: receiveForm.item_name || undefined,
                        received_quantity: Number(receiveForm.quantity),
                        accepted_quantity:
                          Number(receiveForm.quantity) -
                          Number(receiveForm.rejected_quantity || 0),
                        rejected_quantity: Number(
                          receiveForm.rejected_quantity || 0,
                        ),
                        condition: receiveForm.condition,
                        inspection_notes:
                          receiveForm.inspection_notes || undefined,
                      },
                    ]);
                    setReceiptLineNotice(
                      `Receipt line added. ${receiveLines.length + 1} line(s) ready to confirm.`,
                    );
                    setReceiveForm({
                      ...receiveForm,
                      catalogue_id: "",
                      sku: "",
                      item_name: "",
                      quantity: "",
                      rejected_quantity: "0",
                      condition: "good",
                      inspection_notes: "",
                    });
                  }}
                  className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-4 py-2 text-sm font-semibold text-[var(--ui-text-primary)] transition-colors hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
                >
                  + Add receipt line
                </button>
                {receiptLineNotice && (
                  <p className="border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {receiptLineNotice}
                  </p>
                )}
                {receiveLines.length > 0 && (
                  <div className="border border-[var(--ui-border)] p-3 text-xs">
                    <p className="mb-2 font-semibold">
                      Receipt lines ({receiveLines.length})
                    </p>
                    {receiveLines.map((line, index) => (
                      <div
                        key={`${line.sku || line.catalogue_id}-${index}`}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <span>
                          {line.sku || line.catalogue_id} ·{" "}
                          {formatQuantity(line.accepted_quantity)} accepted
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReceiveLines(
                              receiveLines.filter((_, i) => i !== index),
                            )
                          }
                          className="text-[var(--ui-text-muted)]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  disabled={busy || receiveLines.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : null}
                  {busy
                    ? "Confirming receipt…"
                    : `Confirm receiving (${receiveLines.length})`}
                </button>
              </form>
              <form
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await putAwayStock(company.id, putawayForm);
                    setPutawayForm({
                      ...putawayForm,
                      sku: "",
                      to_bin_id: "",
                      quantity: "",
                    });
                  });
                }}
              >
                <h3 className="font-bold">Put away to storage bin</h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Move received goods from staging to the assigned storage bin.
                </p>
                <PickerBrowseButton
                  label="Warehouse"
                  placeholder="Select warehouse"
                  selected={selections["putaway_warehouse"] || null}
                  onClick={() => openPicker("putaway_warehouse")}
                />
                <div className="grid grid-cols-2 gap-3">
                  <PickerBrowseButton
                    label="Inventory item"
                    placeholder="Select inventory item"
                    selected={selections["putaway_sku"] || null}
                    onClick={() => openPicker("putaway_sku")}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Units to move</div>
                    <input
                      required
                      type="number"
                      min="0.001"
                      step="0.001"
                      className={input}
                      placeholder="Units to move"
                      value={putawayForm.quantity}
                      onChange={(e) =>
                        setPutawayForm({
                          ...putawayForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PickerBrowseButton
                    label="From bin"
                    placeholder="Select source bin"
                    selected={selections["putaway_from_bin"] || null}
                    onClick={() => openPicker("putaway_from_bin")}
                  />
                  <PickerBrowseButton
                    label="Destination bin"
                    placeholder="Select destination bin"
                    selected={selections["putaway_to_bin"] || null}
                    onClick={() => openPicker("putaway_to_bin")}
                  />
                </div>
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Confirm put away
                </button>
              </form>
            </div>
            <div className={card + " overflow-x-auto"}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Receiving receipts</h3>
                <button
                  type="button"
                  onClick={() =>
                    run(() =>
                      importExistingGoodsReceipts(
                        company.id,
                        receiveForm.warehouse_id || warehouses[0]?.id,
                      ),
                    )
                  }
                  disabled={!receiveForm.warehouse_id && !warehouses[0]?.id}
                  className="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Import existing Goods Receipts
                </button>
              </div>
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="text-xs text-[var(--ui-text-muted)]">
                  <tr>
                    <th className="py-2">Receipt</th>
                    <th>Warehouse</th>
                    <th>Lines</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Reference</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((x: any) => (
                    <tr
                      key={x.id}
                      className="border-t border-[var(--ui-border)]"
                    >
                      <td className="py-2">{x.receipt_number}</td>
                      <td>{x.warehouse_name}</td>
                      <td>{x.lines?.length || 0}</td>
                      <td>
                        {formatQuantity(
                          (x.lines || []).reduce(
                            (sum: number, line: any) =>
                              sum + Number(line.accepted_quantity || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td>
                        {formatQuantity(
                          (x.lines || []).reduce(
                            (sum: number, line: any) =>
                              sum + Number(line.rejected_quantity || 0),
                            0,
                          ),
                        )}
                      </td>
                      <td>{x.reference || "—"}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => printGrn(x)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--ui-border)] px-2 py-1 text-xs font-semibold hover:border-[var(--ui-text-brand)]"
                        >
                          <Printer size={13} /> Print GRN
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!receipts.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 text-[var(--ui-text-muted)]"
                      >
                        No receiving activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "Allocation & Packing" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Fulfilment flow"
              description="Allocation reserves stock. Pick it from the shown bins, confirm packing, then add carrier details before dispatch."
              steps={[
                "Allocate order",
                "Start picking",
                "Confirm packed",
                "Dispatch",
              ]}
            />
            <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
              <form
                className={card + " space-y-3"}
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    const availability = await checkWmsStockAvailability(
                      company.id,
                      {
                        warehouse_id: allocateForm.warehouse_id,
                        lines: [
                          {
                            sku: allocateForm.sku,
                            quantity: Number(allocateForm.quantity),
                          },
                        ],
                      },
                    );
                    const line = availability?.data?.[0];
                    if (!line?.sufficient) {
                      throw new Error(
                        `Stok ${line?.sku || allocateForm.sku} tidak cukup. Dibutuhkan ${line?.requested || allocateForm.quantity}, tersedia ${line?.available || 0}.`,
                      );
                    }
                    await allocateStock(company.id, {
                      warehouse_id: allocateForm.warehouse_id,
                      order_number: allocateForm.order_number,
                      lines: [
                        {
                          sku: allocateForm.sku,
                          quantity: Number(allocateForm.quantity),
                        },
                      ],
                    });
                    setAllocateForm({
                      ...allocateForm,
                      order_number: "",
                      sku: "",
                      quantity: "",
                    });
                  });
                }}
              >
                <h3 className="font-bold">Allocate for order</h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  The system reserves available stock and selects pick bins
                  automatically.
                </p>
                <PickerBrowseButton
                  label="Warehouse"
                  placeholder="Select warehouse"
                  selected={selections["allocate_warehouse"] || null}
                  onClick={() => openPicker("allocate_warehouse")}
                />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Order number</div>
                  <input
                    required
                    className={input}
                    placeholder="Order number"
                    value={allocateForm.order_number}
                    onChange={(e) =>
                      setAllocateForm({
                        ...allocateForm,
                        order_number: e.target.value,
                      })
                    }
                  />
                </div>
                <PickerBrowseButton
                  label="Inventory item"
                  placeholder="Select inventory item"
                  selected={selections["allocate_sku"] || null}
                  onClick={() => openPicker("allocate_sku")}
                />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Units to reserve</div>
                  <input
                    required
                    type="number"
                    min="0.001"
                    step="0.001"
                    className={input}
                    placeholder="Units to reserve"
                    value={allocateForm.quantity}
                    onChange={(e) =>
                      setAllocateForm({
                        ...allocateForm,
                        quantity: e.target.value,
                      })
                    }
                  />
                </div>
                {allocateForm.warehouse_id &&
                  allocateForm.sku &&
                  allocationRequested > 0 && (
                    <p
                      className={`text-xs ${allocationSufficient ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {allocationSufficient
                        ? `Stock available: ${allocationAvailable}. Ready to reserve ${allocationRequested}.`
                        : `Stock insufficient: ${allocationAvailable} available, ${allocationRequested} requested.`}
                    </p>
                  )}
                <button
                  disabled={!allocationSufficient}
                  className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Allocate stock
                </button>
              </form>
              <div className={card + " space-y-3"}>
                <h3 className="font-bold">
                  Picking, packing &amp; dispatch queue
                </h3>
                {orders.map((o: any) => {
                  const lines =
                    typeof o.lines === "string"
                      ? JSON.parse(o.lines)
                      : o.lines || [];
                  const meta = shipping[String(o.id)] || {
                    carrier: "",
                    tracking_number: "",
                  };
                  return (
                    <div
                      key={o.id}
                      className="border border-[var(--ui-border)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{o.order_number}</p>
                          <p className="text-xs capitalize text-[var(--ui-text-muted)]">
                            {o.warehouse_name} · {o.status}
                          </p>
                        </div>
                        {o.status === "allocated" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                run(() => startWmsPicking(company.id, o.id))
                              }
                              className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold"
                            >
                              Start picking
                            </button>
                            <button
                              onClick={() =>
                                run(() => releaseWmsOrder(company.id, o.id))
                              }
                              className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-muted)]"
                            >
                              Release
                            </button>
                          </div>
                        )}
                        {o.status === "picking" && (
                          <button
                            onClick={() =>
                              run(() =>
                                packWmsOrder(
                                  company.id,
                                  o.id,
                                  "Packed and checked",
                                ),
                              )
                            }
                            className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold"
                          >
                            Confirm packed
                          </button>
                        )}
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-[var(--ui-text-secondary)]">
                        {lines.map((line: any, i: number) => (
                          <p key={`${line.stock_id}-${i}`}>
                            Pick {line.quantity} × {line.sku} from bin{" "}
                            <strong>{line.bin_location || "—"}</strong>
                          </p>
                        ))}
                      </div>
                      {o.status === "packed" && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                          <input
                            className={input}
                            placeholder="Carrier"
                            value={meta.carrier}
                            onChange={(e) =>
                              setShipping({
                                ...shipping,
                                [String(o.id)]: {
                                  ...meta,
                                  carrier: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            className={input}
                            placeholder="Tracking number"
                            value={meta.tracking_number}
                            onChange={(e) =>
                              setShipping({
                                ...shipping,
                                [String(o.id)]: {
                                  ...meta,
                                  tracking_number: e.target.value,
                                },
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              run(() => shipWmsOrder(company.id, o.id, meta))
                            }
                            className="rounded-md bg-[var(--ui-bg-input)] px-3 py-2 text-xs font-semibold"
                          >
                            Dispatch
                          </button>
                        </div>
                      )}
                      {o.status === "shipped" && (
                        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
                          {o.carrier || "Carrier pending"} ·{" "}
                          {o.tracking_number || "No tracking number"}
                        </p>
                      )}
                    </div>
                  );
                })}
                {!orders.length && (
                  <p className="text-sm text-[var(--ui-text-muted)]">
                    No orders in the fulfilment queue.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {tab === "Transfers" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Move inventory between warehouses"
              description="Use a transfer only when physical stock moves. Select the source bin that currently holds the SKU and its destination bin."
              steps={[
                "Choose origin",
                "Choose destination",
                "Select SKU and bins",
                "Confirm transfer",
              ]}
            />
            <div className={card + " max-w-3xl space-y-3"}>
              <h3 className="font-bold">Inter-warehouse stock transfer</h3>
              <p className="text-xs text-[var(--ui-text-muted)]">
                Moves stock between warehouses and records both inventory
                movements.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await transferStock(company.id, transferForm);
                    setTransferForm({
                      ...transferForm,
                      sku: "",
                      from_bin: "",
                      to_bin: "",
                      quantity: "",
                    });
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <PickerBrowseButton
                    label="From warehouse"
                    placeholder="Select source warehouse"
                    selected={selections["transfer_from_wh"] || null}
                    onClick={() => openPicker("transfer_from_wh")}
                  />
                  <PickerBrowseButton
                    label="To warehouse"
                    placeholder="Select destination warehouse"
                    selected={selections["transfer_to_wh"] || null}
                    onClick={() => openPicker("transfer_to_wh")}
                  />
                  <PickerBrowseButton
                    label="Inventory item"
                    placeholder="Select inventory item"
                    selected={selections["transfer_sku"] || null}
                    onClick={() => openPicker("transfer_sku")}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Units to transfer</div>
                    <input
                      required
                      type="number"
                      min="0.001"
                      step="0.001"
                      className={input}
                      placeholder="Units to transfer"
                      value={transferForm.quantity}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Source bin</div>
                    <input
                      required
                      className={input}
                      placeholder="Source bin"
                      value={transferForm.from_bin}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          from_bin: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Destination bin</div>
                    <input
                      required
                      className={input}
                      placeholder="Destination bin"
                      value={transferForm.to_bin}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          to_bin: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Confirm transfer
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Adjustments" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Correct stock after a physical count"
              description="Use adjustments for a verified discrepancy only. A positive number adds stock; a negative number removes stock. Always leave a reason."
              steps={[
                "Count physical stock",
                "Find SKU and bin",
                "Enter variance",
                "Record reason",
              ]}
            />
            <div className={card + " max-w-3xl space-y-3"}>
              <h3 className="font-bold">Cycle count / stock adjustment</h3>
              <p className="text-xs text-[var(--ui-text-muted)]">
                Add or subtract stock after a count. Allocated stock cannot be
                adjusted away.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await adjustStock(company.id, {
                      ...adjustForm,
                      quantity: Number(adjustForm.quantity),
                    });
                    setAdjustForm({
                      ...adjustForm,
                      sku: "",
                      bin_location: "",
                      quantity: "",
                      reason: "",
                    });
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <PickerBrowseButton
                    label="Warehouse"
                    placeholder="Select warehouse"
                    selected={selections["adjust_warehouse"] || null}
                    onClick={() => openPicker("adjust_warehouse")}
                  />
                  <PickerBrowseButton
                    label="Inventory item"
                    placeholder="Select inventory item"
                    selected={selections["adjust_sku"] || null}
                    onClick={() => openPicker("adjust_sku")}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Bin location</div>
                    <input
                      required
                      className={input}
                      placeholder="Bin location"
                      value={adjustForm.bin_location}
                      onChange={(e) =>
                        setAdjustForm({
                          ...adjustForm,
                          bin_location: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">Adjustment quantity (+ / -)</div>
                    <input
                      required
                      type="number"
                      step="0.001"
                      className={input}
                      placeholder="Adjustment quantity (+ / -)"
                      value={adjustForm.quantity}
                      onChange={(e) =>
                        setAdjustForm({ ...adjustForm, quantity: e.target.value })
                      }
                    />
                  </div>
                </div>
                <input
                  required
                  className={input}
                  placeholder="Reason / cycle count reference"
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, reason: e.target.value })
                  }
                />
                <button className="rounded-md bg-[image:var(--huntr-gradient)] px-4 py-2 text-sm font-semibold text-white">
                  Record adjustment
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Reports" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Use reports to decide what to replenish"
              description="Start with warehouse availability, review movement, then act on any item below its reorder level."
              steps={[
                "Review availability",
                "Inspect movement",
                "Resolve replenishment alerts",
              ]}
            />
            <div className={card + " overflow-x-auto"}>
              <h3 className="mb-4 font-bold">
                Warehouse performance &amp; analysis
              </h3>
              <p className="mb-4 text-xs text-[var(--ui-text-muted)]">
                Movement and order summaries for the last 30 days.
              </p>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs text-[var(--ui-text-muted)]">
                  <tr>
                    <th className="py-2">Warehouse</th>
                    <th>SKU count</th>
                    <th>On hand</th>
                    <th>Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.stock_by_warehouse || []).map((x: any) => (
                    <tr
                      className="border-t border-[var(--ui-border)]"
                      key={x.id}
                    >
                      <td className="py-3">
                        {x.name}{" "}
                        <span className="text-xs text-[var(--ui-text-muted)]">
                          {x.code}
                        </span>
                      </td>
                      <td>{x.sku_count}</td>
                      <td>{formatQuantity(x.on_hand)}</td>
                      <td>{formatQuantity(x.allocated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(report?.movement_summary || []).map((x: any) => (
                  <div
                    key={x.type}
                    className="border border-[var(--ui-border)] p-3"
                  >
                    <p className="capitalize font-semibold">{x.type}</p>
                    <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                      {formatQuantity(x.transactions)} movements ·{" "}
                      {formatQuantity(x.quantity)} units
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <h4 className="mb-3 font-bold">Replenishment alerts</h4>
                <div className="space-y-2">
                  {(report?.low_stock_items || []).map((x: any) => (
                    <div
                      key={`${x.sku}-${x.warehouse_name}-${x.bin_location}`}
                      className="flex flex-wrap items-center justify-between gap-2 border border-[var(--ui-border)] p-3 text-sm"
                    >
                      <span className="font-semibold">
                        {x.sku} · {x.item_name}
                      </span>
                      <span className="text-[var(--ui-text-secondary)]">
                        {x.warehouse_name} / {x.bin_location} · available{" "}
                        {formatQuantity(x.available)} · minimum{" "}
                        {formatQuantity(x.reorder_level)}
                      </span>
                    </div>
                  ))}
                  {!report?.low_stock_items?.length && (
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      No items currently below reorder level.
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-5 text-xs text-[var(--ui-text-muted)]">
                {report?.catalogue_linked_skus || 0} SKUs linked to Huntr
                Catalogue
              </p>
            </div>
          </div>
        )}
      </div>

      <StockPickerModal
        open={
          picker.open &&
          (picker.kind === "putaway_sku" ||
            picker.kind === "allocate_sku" ||
            picker.kind === "transfer_sku" ||
            picker.kind === "adjust_sku")
        }
        onClose={closePicker}
        onSelect={(item: StockPickerItem) => {
          switch (picker.kind) {
            case "putaway_sku":
              setPutawayForm({ ...putawayForm, sku: item.sku });
              setSelections((prev) => ({ ...prev, putaway_sku: item }));
              break;
            case "allocate_sku":
              setAllocateForm({ ...allocateForm, sku: item.sku });
              setSelections((prev) => ({ ...prev, allocate_sku: item }));
              break;
            case "transfer_sku":
              setTransferForm({ ...transferForm, sku: item.sku });
              setSelections((prev) => ({ ...prev, transfer_sku: item }));
              break;
            case "adjust_sku":
              setAdjustForm({ ...adjustForm, sku: item.sku });
              setSelections((prev) => ({ ...prev, adjust_sku: item }));
              break;
          }
          closePicker();
        }}
        items={(() => {
          switch (picker.kind) {
            case "putaway_sku":
              return stockPickerAll.filter(
                (x: any) => String(x.warehouse_id) === String(putawayForm.warehouse_id),
              );
            case "allocate_sku":
              return stockPickerAll.filter(
                (x) =>
                  String(x.warehouse_id) === String(allocateForm.warehouse_id) &&
                  isAllocatableStockRow(x),
              );
            case "transfer_sku":
              return stockPickerAll.filter(
                (x: any) => String(x.warehouse_id) === String(transferForm.from_warehouse_id),
              );
            case "adjust_sku":
              return stockPickerAll.filter(
                (x: any) => String(x.warehouse_id) === String(adjustForm.warehouse_id),
              );
            default:
              return [];
          }
        })()}
        title={(() => {
          switch (picker.kind) {
            case "putaway_sku":
              return "Select inventory to put away";
            case "allocate_sku":
              return "Select allocatable inventory";
            case "transfer_sku":
              return "Select transferable inventory";
            case "adjust_sku":
              return "Select adjustable inventory";
            default:
              return "Select inventory item";
          }
        })()}
        description={(() => {
          switch (picker.kind) {
            case "allocate_sku":
              return "Only stock with available quantity > 0 in non-receiving bins is shown.";
            case "transfer_sku":
              return "Only stock in the source warehouse with positive available quantity is shown.";
            default:
              return "Choose an SKU and optionally a specific bin to target.";
          }
        })()}
        selectedSku={(() => {
          switch (picker.kind) {
            case "putaway_sku":
              return putawayForm.sku || null;
            case "allocate_sku":
              return allocateForm.sku || null;
            case "transfer_sku":
              return transferForm.sku || null;
            case "adjust_sku":
              return adjustForm.sku || null;
            default:
              return null;
          }
        })()}
        aggregateBySku={true}
        hideUnavailable={
          picker.kind === "allocate_sku" || picker.kind === "transfer_sku"
        }
      />

      <GenericPickerModal
        open={
          picker.open &&
          (picker.kind === "receive_warehouse" ||
            picker.kind === "receive_po" ||
            picker.kind === "receive_po_line" ||
            picker.kind === "receive_condition" ||
            picker.kind === "receive_catalogue_sku" ||
            picker.kind === "putaway_warehouse" ||
            picker.kind === "putaway_from_bin" ||
            picker.kind === "putaway_to_bin" ||
            picker.kind === "allocate_warehouse" ||
            picker.kind === "transfer_from_wh" ||
            picker.kind === "transfer_to_wh" ||
            picker.kind === "adjust_warehouse")
        }
        onClose={closePicker}
        onSelect={(item: PickerItem) => {
          switch (picker.kind) {
            case "receive_warehouse":
              setReceiveForm({ ...receiveForm, warehouse_id: item.id });
              setSelections((prev) => ({ ...prev, receive_warehouse: item }));
              break;
            case "receive_po": {
              const po = inboundOrders.find((x: any) => String(x.id) === item.id);
              const line = po?.lines?.find(
                (x: any) => Number(x.remaining_quantity || 0) > 0,
              );
              setReceiveForm({
                ...receiveForm,
                purchase_order_id: item.id,
                bin_location: po?.po_number || "",
                catalogue_id: line?.catalogue_id || "",
                sku: line?.sku || "",
                item_name: line?.name || "",
                quantity: line ? String(line.remaining_quantity) : "",
              });
              setSelections((prev) => ({
                ...prev,
                receive_po: item,
                receive_po_line: null,
              }));
              break;
            }
            case "receive_po_line": {
              const po = inboundOrders.find(
                (x: any) => String(x.id) === String(receiveForm.purchase_order_id),
              );
              const line = po?.lines?.find((x: any) => String(x.sku) === item.id);
              setReceiveForm({
                ...receiveForm,
                catalogue_id: line?.catalogue_id || "",
                sku: line?.sku || "",
                item_name: line?.name || "",
                quantity: line ? String(line.remaining_quantity) : "",
              });
              setSelections((prev) => ({ ...prev, receive_po_line: item }));
              break;
            }
            case "receive_condition":
              setReceiveForm({ ...receiveForm, condition: item.id });
              setSelections((prev) => ({ ...prev, receive_condition: item }));
              break;
            case "receive_catalogue_sku": {
              const cat = catalogue.find(
                (x: any) => String(x.id) === String(item.id),
              );
              setReceiveForm({
                ...receiveForm,
                catalogue_id: item.id,
                sku: cat ? String(cat.item_code) : item.subtitle || "",
                item_name: cat?.name || item.title,
              });
              setSelections((prev) => ({
                ...prev,
                receive_catalogue_sku: item,
              }));
              break;
            }
            case "putaway_warehouse":
              setPutawayForm({ ...putawayForm, warehouse_id: item.id });
              setSelections((prev) => ({
                ...prev,
                putaway_warehouse: item,
                putaway_from_bin: null,
                putaway_to_bin: null,
              }));
              break;
            case "putaway_from_bin":
              setPutawayForm({ ...putawayForm, from_bin_id: item.id });
              setSelections((prev) => ({ ...prev, putaway_from_bin: item }));
              break;
            case "putaway_to_bin":
              setPutawayForm({ ...putawayForm, to_bin_id: item.id });
              setSelections((prev) => ({ ...prev, putaway_to_bin: item }));
              break;
            case "allocate_warehouse":
              setAllocateForm({ ...allocateForm, warehouse_id: item.id });
              setSelections((prev) => ({
                ...prev,
                allocate_warehouse: item,
                allocate_sku: null,
              }));
              break;
            case "transfer_from_wh":
              setTransferForm({ ...transferForm, from_warehouse_id: item.id });
              setSelections((prev) => ({
                ...prev,
                transfer_from_wh: item,
                transfer_sku: null,
              }));
              break;
            case "transfer_to_wh":
              setTransferForm({ ...transferForm, to_warehouse_id: item.id });
              setSelections((prev) => ({ ...prev, transfer_to_wh: item }));
              break;
            case "adjust_warehouse":
              setAdjustForm({ ...adjustForm, warehouse_id: item.id });
              setSelections((prev) => ({
                ...prev,
                adjust_warehouse: item,
                adjust_sku: null,
              }));
              break;
          }
          closePicker();
        }}
        items={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
            case "putaway_warehouse":
            case "allocate_warehouse":
            case "transfer_from_wh":
            case "transfer_to_wh":
            case "adjust_warehouse":
              return warehousePickerItems;
            case "receive_po":
              return poPickerItems;
            case "receive_po_line":
              return poLinePickerItems;
            case "receive_condition":
              return conditionPickerItems;
            case "receive_catalogue_sku":
              return cataloguePickerItems;
            case "putaway_from_bin":
              return putawayBinItems.all;
            case "putaway_to_bin":
              return putawayBinItems.storage;
            default:
              return [];
          }
        })()}
        title={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
            case "putaway_warehouse":
            case "allocate_warehouse":
            case "adjust_warehouse":
              return "Select warehouse";
            case "transfer_from_wh":
              return "Select source warehouse";
            case "transfer_to_wh":
              return "Select destination warehouse";
            case "receive_po":
              return "Link purchase order";
            case "receive_po_line":
              return "Select outstanding PO line";
            case "receive_condition":
              return "Inspection condition";
            case "receive_catalogue_sku":
              return "Select product variant / SKU";
            case "putaway_from_bin":
              return "Select source bin";
            case "putaway_to_bin":
              return "Select destination bin";
            default:
              return "Select";
          }
        })()}
        description={(() => {
          switch (picker.kind) {
            case "receive_po":
              return "Optional. Linking a PO will pre-fill the reference, first outstanding line, and its remaining quantity.";
            case "receive_condition":
              return "The inspection result records whether the goods were accepted, damaged or short. Use notes for details.";
            case "receive_catalogue_sku":
              return "Pick from Huntr Catalogue, or close and type a new SKU in the field.";
            case "putaway_to_bin":
              return "Only active storage, picking and packing bins are valid put away destinations.";
            default:
              return undefined;
          }
        })()}
        placeholder={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
            case "putaway_warehouse":
            case "allocate_warehouse":
            case "adjust_warehouse":
              return "Search warehouse by name, code or address…";
            case "transfer_from_wh":
            case "transfer_to_wh":
              return "Search warehouse…";
            case "receive_po":
              return "Search PO number or vendor…";
            case "receive_po_line":
              return "Search line by SKU or name…";
            case "receive_condition":
              return "Search condition…";
            case "receive_catalogue_sku":
              return "Search by SKU code or product name…";
            case "putaway_from_bin":
            case "putaway_to_bin":
              return "Search bin code or name…";
            default:
              return "Search…";
          }
        })()}
        emptyLabel={(() => {
          switch (picker.kind) {
            case "receive_po":
              return "No inbound purchase orders synced yet.";
            case "receive_po_line":
              return "This PO has no open lines remaining.";
            case "receive_catalogue_sku":
              return "No catalogue products synced yet. Type a SKU manually in the field.";
            case "putaway_from_bin":
            case "putaway_to_bin":
              return "No bins configured for this warehouse yet.";
            default:
              return "No items available.";
          }
        })()}
        selectedId={(() => {
          switch (picker.kind) {
            case "receive_warehouse":
              return receiveForm.warehouse_id || null;
            case "receive_po":
              return receiveForm.purchase_order_id || null;
            case "receive_po_line":
              return receiveForm.sku || null;
            case "receive_condition":
              return receiveForm.condition || null;
            case "receive_catalogue_sku":
              return receiveForm.catalogue_id || null;
            case "putaway_warehouse":
              return putawayForm.warehouse_id || null;
            case "putaway_from_bin":
              return putawayForm.from_bin_id || null;
            case "putaway_to_bin":
              return putawayForm.to_bin_id || null;
            case "allocate_warehouse":
              return allocateForm.warehouse_id || null;
            case "transfer_from_wh":
              return transferForm.from_warehouse_id || null;
            case "transfer_to_wh":
              return transferForm.to_warehouse_id || null;
            case "adjust_warehouse":
              return adjustForm.warehouse_id || null;
            default:
              return null;
          }
        })()}
      />
    </Layout>
  );
}
