import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  Boxes,
  Building2,
  Check,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Package,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import Layout from "../components/Layout";
import { getAssetUrl } from "../lib/assets";
import { WmsOverview, WmsWorkflowGuide } from "../components/wms/WmsOverview";
import { RackManagement } from "../components/wms/RackManagement";
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
  createWmsReorderPo,
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

    // 1) Native parse first — works for backend numbers and standard decimals: "20", "20.000", "1234.56"
    const native = Number(trimmed);
    if (!Number.isNaN(native)) {
      // If there are multiple dots (e.g. "1.000.000"), it was explicitly formatted with thousand separators
      const hasDots = (digits.match(/\./g) || []).length;
      if (hasDots > 1) {
        const stripped = Number(digits.replace(/\./g, "").replace(/,/g, "."));
        if (!Number.isNaN(stripped)) return negative ? -stripped : stripped;
      }
      return native;
    }

    // 2) Native failed (pure id-ID formatting, e.g. "1.500,50" or "20,5"):
    //    strip thousand dots then treat comma as decimal separator.
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
    maximumFractionDigits: Number.isInteger(num) ? 0 : maximumFractionDigits,
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
      <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
        {label}
      </div>
      <button type="button" className={browseBtn} onClick={onClick}>
        {selected ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {"sku" in selected ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">
                      {selected.item_name}
                    </span>
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
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {selected.imageUrl && (
                    <img
                      src={selected.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-md border border-[var(--ui-border)] object-cover bg-[var(--ui-bg-input)]"
                      onError={(event) => { event.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {selected.title}
                    </div>
                    {selected.subtitle && (
                      <div className="mt-0.5 truncate text-xs text-[var(--ui-text-muted)]">
                        {selected.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <ChevronRight
              size={16}
              className="shrink-0 text-[var(--ui-text-muted)]"
            />
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
              <WarehouseIcon
                size={12}
                className="text-[var(--ui-text-muted)]"
              />
              <span className="truncate">
                {selected.warehouse_name || "—"}
                {selected.bin_location ? ` · ${selected.bin_location}` : ""}
              </span>
              <span className="ml-auto tabular-nums font-semibold text-[var(--ui-text-success)]">
                available{" "}
                {formatQuantity(
                  toNumeric(selected.on_hand) - toNumeric(selected.allocated),
                )}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {selected.meta?.slice(0, 3).map((m, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
                    {m.label}
                  </span>
                  <span className="tabular-nums font-semibold text-[var(--ui-text-secondary)]">
                    {m.value}
                  </span>
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
  const [activityPage, setActivityPage] = useState(1);
  const [stockSearch, setStockSearch] = useState("");
  const [stockWarehouseId, setStockWarehouseId] = useState("");
  const [stockCategory, setStockCategory] = useState("");

  const [picker, setPicker] = useState<{
    kind: PickerKind | null;
    open: boolean;
  }>({
    kind: null,
    open: false,
  });
  const openPicker = useCallback(
    (kind: PickerKind) => setPicker({ kind, open: true }),
    [],
  );
  const closePicker = useCallback(
    () => setPicker({ kind: null, open: false }),
    [],
  );
  const [selections, setSelections] = useState<
    Record<string, PickerItem | StockPickerItem | null>
  >({});
  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    address: "",
    capacity_units: "",
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
  const [leadTimes, setLeadTimes] = useState<Record<number, string>>({});
  const [reorderModalItem, setReorderModalItem] = useState<any | null>(null);
  const [reorderForm, setReorderForm] = useState({
    quantity: "",
    vendor_name: "",
    expected_receiving_date: "",
    notes: "",
  });
  const [submittingReorder, setSubmittingReorder] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const paramTab = new URLSearchParams(window.location.search).get("tab");
      if (paramTab) {
        if (paramTab === "Reports") setTab("Reports");
        else if (paramTab === "Stock" || paramTab === "Inventory") setTab("Stock");
        else if (paramTab === "Receiving") setTab("Receiving & Put Away");
      }
    }
  }, []);

  const handleOpenReorderModal = (item: any) => {
    const leadDays = toNumeric(item.lead_time_days || 0);
    const estDate = leadDays > 0
      ? new Date(Date.now() + leadDays * 86400000).toISOString().split("T")[0]
      : new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const currentAvailable = item.available !== undefined
      ? toNumeric(item.available)
      : toNumeric(item.on_hand) - toNumeric(item.allocated);
    const minLevel = toNumeric(item.reorder_level);
    const suggested = item.suggested_qty
      ? String(item.suggested_qty)
      : String(Math.max(1, Math.round(minLevel * 2 - currentAvailable)));

    setReorderForm({
      quantity: suggested,
      vendor_name: "",
      expected_receiving_date: estDate,
      notes: `Replenishment order for SKU ${item.sku}`,
    });
    setReorderModalItem(item);
  };

  const handleSubmitReorderPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderModalItem || !company?.id) return;
    const qty = toNumeric(reorderForm.quantity);
    if (qty <= 0) {
      Swal.fire({
        icon: "error",
        title: "Jumlah tidak valid",
        text: "Jumlah pesanan harus lebih besar dari 0.",
      });
      return;
    }
    setSubmittingReorder(true);
    try {
      const res = await createWmsReorderPo(company.id, reorderModalItem.id, {
        quantity: qty,
        vendor_name: reorderForm.vendor_name || undefined,
        expected_receiving_date: reorderForm.expected_receiving_date || undefined,
        notes: reorderForm.notes || undefined,
      });
      await Swal.fire({
        icon: "success",
        title: "Purchase Order Diterbitkan!",
        text: res?.message || `PO berhasil dibuat dan dijadwalkan masuk di Inbound Orders WMS.`,
      });
      setReorderModalItem(null);
      await refresh();
      setTab("Receiving & Put Away");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal membuat PO",
        text: err?.message || "Terjadi kesalahan saat membuat Purchase Order.",
      });
    } finally {
      setSubmittingReorder(false);
    }
  };
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
        getWmsDashboard(company.id, activityPage),
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
  }, [company, activityPage]);
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

  const buildReceiveLine = () => {
    if (
      (!receiveForm.catalogue_id && !receiveForm.sku) ||
      !Number(receiveForm.quantity)
    ) {
      throw new Error("Select an item and enter its received quantity first.");
    }

    const receivedQuantity = Number(receiveForm.quantity);
    const rejectedQuantity = Number(receiveForm.rejected_quantity || 0);
    if (rejectedQuantity > receivedQuantity) {
      throw new Error("Rejected quantity cannot exceed received quantity.");
    }

    return {
      ...(receiveForm.catalogue_id
        ? { catalogue_id: receiveForm.catalogue_id }
        : { sku: receiveForm.sku }),
      item_name: receiveForm.item_name || undefined,
      received_quantity: receivedQuantity,
      accepted_quantity: receivedQuantity - rejectedQuantity,
      rejected_quantity: rejectedQuantity,
      condition: receiveForm.condition,
      inspection_notes: receiveForm.inspection_notes || undefined,
    };
  };

  const clearReceiveLine = () => {
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
  };

  const hasReceiveLineInput = Boolean(
    receiveForm.catalogue_id ||
    receiveForm.sku ||
    receiveForm.item_name ||
    receiveForm.quantity,
  );
  const readyReceiveLineCount =
    receiveLines.length +
    ((receiveForm.catalogue_id || receiveForm.sku) &&
    Number(receiveForm.quantity)
      ? 1
      : 0);

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
        total + toNumeric(item.on_hand) - toNumeric(item.allocated),
      0,
    );
  const allocationRequested = Number(allocateForm.quantity || 0);
  const allocationSufficient =
    allocationRequested > 0 && allocationAvailable >= allocationRequested;
  const stockCategories = [
    ...new Set(
      stock.map((item: any) => item.catalogue_category).filter(Boolean),
    ),
  ].sort();
  const filteredStock = stock.filter((item: any) => {
    const query = stockSearch.trim().toLowerCase();
    return (
      (!stockWarehouseId || String(item.warehouse_id) === stockWarehouseId) &&
      (!stockCategory || item.catalogue_category === stockCategory) &&
      (!query ||
        `${item.sku} ${item.item_name} ${item.bin_location || ""}`
          .toLowerCase()
          .includes(query))
    );
  });
  const hasStockFilters = Boolean(
    stockSearch || stockWarehouseId || stockCategory,
  );

  // Bin type order & labels for display grouping
  const BIN_TYPE_ORDER = ["receiving", "quarantine", "storage", "picking", "packing", "shipping", "other"];
  const BIN_TYPE_LABELS: Record<string, { label: string; description: string; color: string }> = {
    receiving:  { label: "Receiving",  description: "Barang masuk, belum diinspeksi / put away", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
    quarantine: { label: "Quarantine", description: "Barang ditahan untuk inspeksi lebih lanjut",  color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
    storage:    { label: "Storage",    description: "Stok utama siap digunakan",                   color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    picking:    { label: "Picking",    description: "Area picking untuk pemenuhan order",           color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
    packing:    { label: "Packing",    description: "Sedang dikemas untuk pengiriman",              color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20" },
    shipping:   { label: "Shipping",   description: "Siap kirim / dalam pengiriman",                color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    other:      { label: "Other",      description: "Bin tanpa tipe khusus",                         color: "text-[var(--ui-text-secondary)] bg-[var(--ui-bg-input)] border-[var(--ui-border)]" },
  };

  const stockGroupedByBinType = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const item of filteredStock) {
      const rawType = (item.bin_type || "other").toLowerCase();
      const key = BIN_TYPE_ORDER.includes(rawType) ? rawType : "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return BIN_TYPE_ORDER
      .filter((k) => groups[k]?.length > 0)
      .map((k) => ({ type: k, items: groups[k] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStock]);

  const cataloguePickerItems: PickerItem[] = useMemo(
    () =>
      catalogue.map((item: any) => ({
        id: String(item.id),
        title: item.name || String(item.item_code),
        subtitle: String(item.item_code),
        searchable: `${item.item_code} ${item.name ?? ""}`,
        imageUrl: item.image_url || (item.image_path ? getAssetUrl(item.image_path) : null),
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
        meta: [{ label: "Tone", value: "Accepted", tone: "success" as const }],
      },
      {
        id: "damaged",
        title: "Damaged",
        subtitle: "Goods arrived damaged",
        meta: [{ label: "Tone", value: "Review", tone: "brand" as const }],
      },
      {
        id: "short",
        title: "Short shipment",
        subtitle: "Less quantity received than ordered",
        meta: [{ label: "Tone", value: "Short", tone: "muted" as const }],
      },
      {
        id: "other",
        title: "Other",
        subtitle: "Custom inspection note required",
        meta: [{ label: "Tone", value: "Manual", tone: "default" as const }],
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
            tone:
              bin.status === "active"
                ? ("success" as const)
                : ("muted" as const),
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
          meta: [{ label: "Type", value: bin.type, tone: "brand" as const }],
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
            className="mt-3 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white"
          >
            Install module
          </button>
        </div>
      </Layout>
    );
  const tabs = [
    ["Overview", BarChart3],
    ["Stock", Boxes],
    ["Rak & Lokasi", Layers],
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
        {report?.low_stock_items && report.low_stock_items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm">
            <div className="flex items-start gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {report.low_stock_items.length} Barang Perlu Pemesanan Ulang (Low Stock Alert)
                </p>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Stok barang telah mencapai atau di bawah Reorder Point. Periksa lead time dan segera terbitkan PO.
                </p>
              </div>
            </div>
            <button
              onClick={() => setTab("Reports")}
              className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              <ShoppingCart size={13} />
              Review & Buat PO
            </button>
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
            onActivityPage={setActivityPage}
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
                      className="flex justify-between gap-3 border border-[var(--ui-border)] p-3"
                    >
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        <p className="text-xs text-[var(--ui-text-muted)]">
                          {w.code} · {w.address || "Address not set"}
                          {w.capacity_units
                            ? ` · capacity ${formatQuantity(w.capacity_units)} units`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStockWarehouseId(String(w.id));
                            setTab("Stock");
                          }}
                          className="rounded-md border border-[var(--ui-border)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-brand)]"
                        >
                          View stock
                        </button>
                        <button
                          type="button"
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
                    setWarehouseForm({
                      code: "",
                      name: "",
                      address: "",
                      capacity_units: "",
                    });
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
                <input
                  className={input}
                  placeholder="Warehouse capacity (units)"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={warehouseForm.capacity_units}
                  onChange={(e) =>
                    setWarehouseForm({
                      ...warehouseForm,
                      capacity_units: e.target.value,
                    })
                  }
                />
                <button className="inline-flex items-center gap-2 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white">
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
            <div className={card + " overflow-hidden p-0"}>
              <div className="border-b border-[var(--ui-border)] px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">Stock</h3>
                    <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                      Live inventory across all warehouses.
                    </p>
                  </div>
                  <span className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-xs font-medium text-[var(--ui-text-secondary)]">
                    {filteredStock.length} location
                    {filteredStock.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md bg-[var(--ui-bg-input)] p-2">
                  <span className="px-1 text-xs font-semibold text-[var(--ui-text-secondary)]">
                    Filter
                  </span>
                  <input
                    className={input + " w-48 bg-[var(--ui-bg-card)]"}
                    placeholder="Search SKU, item, bin"
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                  />
                  <select
                    className={input + " w-44 bg-[var(--ui-bg-card)]"}
                    value={stockWarehouseId}
                    onChange={(e) => setStockWarehouseId(e.target.value)}
                  >
                    <option value="">All warehouses</option>
                    {warehouses.map((warehouse: any) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={input + " w-40 bg-[var(--ui-bg-card)]"}
                    value={stockCategory}
                    onChange={(e) => setStockCategory(e.target.value)}
                  >
                    <option value="">All categories</option>
                    {stockCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {hasStockFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setStockSearch("");
                        setStockWarehouseId("");
                        setStockCategory("");
                      }}
                      className="px-2 py-2 text-xs font-semibold text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                    >
                      Clear
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
                        <div className={`flex items-center gap-2 border-b border-[var(--ui-border)] px-4 py-2 ${meta.color.includes("bg-") ? "" : ""}`}>
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
                          <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-[var(--ui-bg-input)] text-[10px] uppercase tracking-[0.08em] text-[var(--ui-text-muted)]">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Item</th>
                                <th className="py-3 font-semibold">Location</th>
                                <th className="py-3 text-right font-semibold">On hand</th>
                                <th className="py-3 text-right font-semibold">Reserved</th>
                                <th className="py-3 text-right font-semibold">Available</th>
                                <th className="px-4 py-3 font-semibold">Reorder point & Lead time</th>
                              </tr>
                            </thead>
                            <tbody>
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
                                  <tr
                                    key={x.id}
                                    className="border-t border-[var(--ui-border)] hover:bg-[var(--ui-bg-input)]/60"
                                  >
                                    <td className="px-4 py-3 align-middle">
                                      <p className="font-semibold text-[var(--ui-text-primary)]">
                                        {x.item_name}
                                      </p>
                                      <div className="mt-1 flex items-center gap-2 text-xs">
                                        <span className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ui-text-secondary)]">
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
                                    </td>
                                    <td className="py-3 align-middle">
                                      <p className="font-medium">{x.warehouse_name}</p>
                                      <p className="mt-0.5 font-mono text-xs text-[var(--ui-text-muted)]">
                                        {x.bin_location || "No bin assigned"}
                                      </p>
                                    </td>
                                    <td className="py-3 text-right align-middle tabular-nums">
                                      {formatQuantity(x.on_hand)}{" "}
                                      <span className="text-xs text-[var(--ui-text-muted)]">
                                        {x.uom}
                                      </span>
                                    </td>
                                    <td className="py-3 text-right align-middle tabular-nums text-[var(--ui-text-secondary)]">
                                      {formatQuantity(x.allocated)}
                                    </td>
                                    <td className="py-3 text-right align-middle tabular-nums">
                                      <span
                                        className={
                                          belowReorder
                                            ? "font-semibold text-amber-600"
                                            : "font-semibold text-emerald-600"
                                        }
                                      >
                                        {formatQuantity(available)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-[var(--ui-text-muted)]">Min. Stok</span>
                                            <input
                                              aria-label={`Reorder level ${x.sku}`}
                                              type="number"
                                              min="0"
                                              step="0.001"
                                              className={input + " w-20 px-2 py-1 text-xs"}
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
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[10px] text-[var(--ui-text-muted)]">Lead Time (hr)</span>
                                            <input
                                              aria-label={`Lead time ${x.sku}`}
                                              type="number"
                                              min="0"
                                              step="1"
                                              placeholder="0"
                                              className={input + " w-16 px-2 py-1 text-xs"}
                                              value={
                                                leadTimes[x.id] !== undefined
                                                  ? leadTimes[x.id]
                                                  : String(toNumeric(x.lead_time_days || 0))
                                              }
                                              onChange={(e) =>
                                                setLeadTimes({
                                                  ...leadTimes,
                                                  [x.id]: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                          <button
                                            onClick={async () => {
                                              try {
                                                await setWmsReorderLevel(
                                                  company.id,
                                                  x.id,
                                                  toNumeric(
                                                    reorderLevels[x.id] ??
                                                      x.reorder_level ??
                                                      0,
                                                  ),
                                                  toNumeric(
                                                    leadTimes[x.id] ??
                                                      x.lead_time_days ??
                                                      0,
                                                  ),
                                                );
                                                await Swal.fire({
                                                  icon: "success",
                                                  title: "Pengaturan Disimpan",
                                                  text: `Reorder point dan lead time untuk ${x.sku} berhasil diperbarui.`,
                                                  timer: 1400,
                                                  showConfirmButton: false,
                                                });
                                                await refresh();
                                              } catch (error: any) {
                                                await Swal.fire({
                                                  icon: "error",
                                                  title: "Unable to save",
                                                  text:
                                                    error.message || "Please try again.",
                                                });
                                              }
                                            }}
                                            className="self-end rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-card)]"
                                          >
                                            Save
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                          {currentLeadDays > 0 ? (
                                            <span className="text-[var(--ui-text-muted)]">
                                              ⏱️ Est. tiba: {currentLeadDays} hari
                                            </span>
                                          ) : (
                                            <span className="text-[var(--ui-text-muted)]">
                                              Lead time: -
                                            </span>
                                          )}
                                          {belowReorder && (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenReorderModal(x)}
                                              className="inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 font-semibold text-white hover:bg-amber-700"
                                            >
                                              <ShoppingCart size={11} />
                                              Pesan Sekarang
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                    const lines = hasReceiveLineInput
                      ? [...receiveLines, buildReceiveLine()]
                      : receiveLines;
                    if (!lines.length) {
                      throw new Error(
                        "Select an item and enter its received quantity first.",
                      );
                    }
                    await receiveStock(company.id, {
                      warehouse_id: receiveForm.warehouse_id,
                      purchase_order_id:
                        receiveForm.purchase_order_id || undefined,
                      idempotency_key: receiveKey,
                      reference: receiveForm.bin_location || undefined,
                      lines,
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
                    <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                      Confirm the item being entered directly, or add lines
                      first when one delivery contains multiple items.
                    </p>
                  </div>
                  <span className="shrink-0 border border-[var(--ui-border)] px-2 py-1 text-[10px] font-semibold text-[var(--ui-text-muted)]">
                    DRAFT
                  </span>
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
                  <p className="text-[10px] font-bold tracking-wider text-[var(--ui-text-muted)] uppercase">
                    Item and inspection
                  </p>
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
                  <div className="grid gap-2 sm:grid-cols-2">
                    <PickerBrowseButton
                      label="Inspection condition"
                      placeholder="Select condition"
                      selected={selections["receive_condition"] || null}
                      onClick={() => openPicker("receive_condition")}
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                        Inspection notes
                      </div>
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
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-semibold text-[var(--ui-text-secondary)]">
                    Received quantity
                    <input
                      required
                      type="number"
                      min="0.001"
                      step="0.001"
                      className={input}
                      placeholder="0"
                      value={receiveForm.quantity}
                      onChange={(e) =>
                        setReceiveForm({
                          ...receiveForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs font-semibold text-[var(--ui-text-secondary)]">
                    Reference
                    <input
                      className={input}
                      placeholder="PO or delivery note"
                      value={receiveForm.bin_location}
                      onChange={(e) =>
                        setReceiveForm({
                          ...receiveForm,
                          bin_location: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label className="block max-w-xs space-y-1 text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Rejected after inspection
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    max={receiveForm.quantity || undefined}
                    className={input}
                    placeholder="0"
                    value={receiveForm.rejected_quantity}
                    onChange={(e) =>
                      setReceiveForm({
                        ...receiveForm,
                        rejected_quantity: e.target.value,
                      })
                    }
                  />
                </label>
                {receiptLineNotice && (
                  <p className="border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {receiptLineNotice}
                  </p>
                )}
                {receiveLines.length > 0 && (
                  <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/30 text-xs">
                    <div className="flex items-center justify-between border-b border-[var(--ui-border)] px-3 py-2">
                      <p className="font-semibold">Ready to receive</p>
                      <span className="font-mono text-[var(--ui-text-brand)]">
                        {receiveLines.length} line
                        {receiveLines.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="divide-y divide-[var(--ui-border)] px-3">
                      {receiveLines.map((line, index) => (
                        <div
                          key={`${line.sku || line.catalogue_id}-${index}`}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <span className="min-w-0 truncate font-mono text-[var(--ui-text-secondary)]">
                            {line.sku || line.catalogue_id}
                          </span>
                          <span className="ml-auto shrink-0 tabular-nums text-[var(--ui-text-muted)]">
                            {formatQuantity(line.accepted_quantity)} accepted
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReceiveLines(
                                receiveLines.filter((_, i) => i !== index),
                              )
                            }
                            className="shrink-0 text-[var(--ui-text-muted)] hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] px-3 py-2">
                      <span className="text-[var(--ui-text-muted)]">
                        Accepted total
                      </span>
                      <strong className="tabular-nums">
                        {formatQuantity(
                          receiveLines.reduce(
                            (sum, line) =>
                              sum + Number(line.accepted_quantity || 0),
                            0,
                          ),
                        )}
                      </strong>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const line = buildReceiveLine();
                        setReceiveLines([...receiveLines, line]);
                        setReceiptLineNotice(
                          `Receipt line added. ${receiveLines.length + 1} line(s) ready to confirm.`,
                        );
                        clearReceiveLine();
                      } catch (lineError: any) {
                        setError(
                          lineError.message ||
                            "Select an item and enter its received quantity first.",
                        );
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm font-semibold text-[var(--ui-text-primary)] transition-colors hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
                  >
                    + Add receipt line
                  </button>
                  <button
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : null}
                    {busy
                      ? "Confirming receipt…"
                      : `Confirm receiving (${readyReceiveLineCount})`}
                  </button>
                </div>
              </form>
              <form
                className={card + " space-y-3"}
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!putawayForm.warehouse_id) {
                    await Swal.fire({
                      icon: "warning",
                      title: "Pilih Gudang",
                      text: "Silakan pilih gudang terlebih dahulu.",
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }
                  if (!putawayForm.sku) {
                    await Swal.fire({
                      icon: "warning",
                      title: "Pilih Item",
                      text: "Silakan pilih item inventori yang akan dipindahkan.",
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }
                  if (!putawayForm.quantity || Number(putawayForm.quantity) <= 0) {
                    await Swal.fire({
                      icon: "warning",
                      title: "Jumlah Tidak Valid",
                      text: "Masukkan jumlah unit yang valid (lebih dari 0).",
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }
                  if (!putawayForm.from_bin_id) {
                    await Swal.fire({
                      icon: "warning",
                      title: "Pilih Bin Asal",
                      text: "Silakan pilih bin asal (from bin).",
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }
                  if (!putawayForm.to_bin_id) {
                    await Swal.fire({
                      icon: "warning",
                      title: "Pilih Bin Tujuan",
                      text: "Silakan pilih bin tujuan (destination bin).",
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }
                  if (putawayForm.from_bin_id === putawayForm.to_bin_id) {
                    await Swal.fire({
                      icon: "warning",
                      title: "Bin Tidak Valid",
                      text: "Bin asal dan bin tujuan tidak boleh sama.",
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }

                  const fromBinItem = selections["putaway_from_bin"];
                  const fromBinName =
                    (fromBinItem && "title" in fromBinItem
                      ? fromBinItem.title
                      : null) ||
                    warehouses
                      .find((w: any) => String(w.id) === putawayForm.warehouse_id)
                      ?.bins?.find(
                        (b: any) => String(b.id) === putawayForm.from_bin_id,
                      )?.code ||
                    "bin asal";

                  const toBinItem = selections["putaway_to_bin"];
                  const toBinName =
                    (toBinItem && "title" in toBinItem
                      ? toBinItem.title
                      : null) ||
                    warehouses
                      .find((w: any) => String(w.id) === putawayForm.warehouse_id)
                      ?.bins?.find(
                        (b: any) => String(b.id) === putawayForm.to_bin_id,
                      )?.code ||
                    "bin tujuan";

                  const confirmResult = await Swal.fire({
                    title: "Konfirmasi Put Away",
                    text: `Pindahkan ${formatQuantity(putawayForm.quantity)} unit ${putawayForm.sku} dari ${fromBinName} ke ${toBinName}?`,
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Ya, Put Away",
                    cancelButtonText: "Batal",
                    confirmButtonColor: "#f97316",
                  });

                  if (!confirmResult.isConfirmed) return;

                  const movedQty = putawayForm.quantity;
                  const movedSku = putawayForm.sku;

                  run(async () => {
                    try {
                      await putAwayStock(company.id, putawayForm);
                      setPutawayForm({
                        ...putawayForm,
                        sku: "",
                        to_bin_id: "",
                        quantity: "",
                      });
                      setSelections((prev) => ({
                        ...prev,
                        putaway_sku: null,
                        putaway_to_bin: null,
                      }));
                      await Swal.fire({
                        icon: "success",
                        title: "Put Away Berhasil",
                        text: `${formatQuantity(movedQty)} unit ${movedSku} berhasil dipindahkan ke ${toBinName}.`,
                        timer: 2000,
                        showConfirmButton: false,
                      });
                    } catch (err: any) {
                      await Swal.fire({
                        icon: "error",
                        title: "Put Away Gagal",
                        text: err.message || "Gagal memproses put away.",
                        confirmButtonColor: "#f97316",
                      });
                      throw err;
                    }
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
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Units to move
                    </div>
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
                <button
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : null}
                  {busy ? "Confirming put away…" : "Confirm put away"}
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
                      order_number:
                        allocateForm.order_number ||
                        `WMS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                      lines: [
                        {
                          sku: allocateForm.sku,
                          quantity: Number(allocateForm.quantity),
                        },
                      ],
                    });
                    setAllocateForm({
                      ...allocateForm,
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
                <div className="border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-bg-input)] px-3 py-2 text-xs text-[var(--ui-text-secondary)]">
                  Order number is generated automatically when stock is
                  allocated.
                </div>
                <PickerBrowseButton
                  label="Inventory item"
                  placeholder="Select inventory item"
                  selected={selections["allocate_sku"] || null}
                  onClick={() => openPicker("allocate_sku")}
                />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                    Units to reserve
                  </div>
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
                  className="rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className={card + " space-y-4"}>
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
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Units to transfer
                    </div>
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
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Source bin
                    </div>
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
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Destination bin
                    </div>
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
                <button className="rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white">
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
            <div className={card + " space-y-4"}>
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
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Bin location
                    </div>
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
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Adjustment quantity (+ / -)
                    </div>
                    <input
                      required
                      type="number"
                      step="0.001"
                      className={input}
                      placeholder="Adjustment quantity (+ / -)"
                      value={adjustForm.quantity}
                      onChange={(e) =>
                        setAdjustForm({
                          ...adjustForm,
                          quantity: e.target.value,
                        })
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
                <button className="rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-sm font-semibold !text-white">
                  Record adjustment
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Reports" && (
          <div className="space-y-4">
            <WmsWorkflowGuide
              title="Warehouse performance"
              description="Review availability, movement, and items that need replenishment."
              steps={[
                "Review availability",
                "Inspect movement",
                "Resolve alerts",
              ]}
            />
            <div className="grid gap-3 md:grid-cols-3">
              <div className={card}>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Active warehouses
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {report?.stock_by_warehouse?.length || 0}
                </p>
              </div>
              <div className={card}>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Catalogue linked SKUs
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatQuantity(report?.catalogue_linked_skus || 0)}
                </p>
              </div>
              <div className={card}>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Replenishment alerts
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-500">
                  {formatQuantity(report?.low_stock_items?.length || 0)}
                </p>
              </div>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <div className={card + " overflow-x-auto"}>
                <h3 className="font-bold">Stock position by warehouse</h3>
                <table className="mt-3 w-full min-w-[500px] text-left text-sm">
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
              </div>
              <div className={card}>
                <h3 className="font-bold">Movement in the last 30 days</h3>
                <div className="mt-3 divide-y divide-[var(--ui-border)]">
                  {(report?.movement_summary || []).map((x: any) => (
                    <div
                      key={x.type}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <p className="capitalize font-semibold">{x.type}</p>
                      <p className="text-right text-xs text-[var(--ui-text-muted)]">
                        {formatQuantity(x.transactions)} movements ·{" "}
                        {formatQuantity(x.quantity)} units
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={card}>
              <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-base">
                    <AlertTriangle className="text-amber-500" size={18} />
                    Replenishment alerts (Barang di Bawah Reorder Point)
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                    Daftar stok yang telah mencapai atau di bawah batas minimum pemesanan ulang
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {report?.low_stock_items?.length || 0} SKU Perlu PO
                </span>
              </div>

              <div className="mt-3 divide-y divide-[var(--ui-border)]">
                {(report?.low_stock_items || []).map((x: any) => {
                  const leadDays = toNumeric(x.lead_time_days || 0);
                  const deficit = Math.max(0, toNumeric(x.reorder_level) - toNumeric(x.available));
                  return (
                    <div
                      key={`${x.sku}-${x.warehouse_name}-${x.bin_location}`}
                      className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--ui-text-primary)]">
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
                            <strong className="text-amber-500">
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
                              <span className="font-medium text-rose-500">
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
                          onClick={() => handleOpenReorderModal(x)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ui-text-brand)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                        >
                          <ShoppingCart size={14} />
                          Buat Purchase Order (PO)
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!report?.low_stock_items?.length && (
                  <div className="py-6 text-center text-sm text-[var(--ui-text-muted)]">
                    <PackageCheck size={28} className="mx-auto mb-1 text-emerald-500 opacity-80" />
                    Semua stok aman. Tidak ada barang di bawah reorder point.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {tab === "Rak & Lokasi" && (
          <div className="space-y-4">
            {warehouses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] py-16 text-center">
                <Layers size={36} className="text-[var(--ui-text-muted)] opacity-40" />
                <div>
                  <p className="font-semibold text-[var(--ui-text-primary)]">Belum ada gudang</p>
                  <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                    Buat gudang terlebih dahulu di tab Warehouses, lalu kembali ke sini untuk mengatur rak.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("Warehouses")}
                  className="rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-semibold !text-white"
                >
                  Buka Tab Warehouses
                </button>
              </div>
            ) : (
              <RackManagement
                companyId={company.id}
                warehouses={warehouses}
                onRefresh={refresh}
                onNavigateToPutAway={(warehouseId, _binId) => {
                  setPutawayForm((prev: any) => ({
                    ...prev,
                    warehouse_id: warehouseId,
                  }));
                  setTab("Receiving & Put Away");
                }}
              />
            )}
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
            case "putaway_sku": {
              const matchedBin = item.bin_id
                ? putawayBinItems.all.find(
                    (b: any) => String(b.id) === String(item.bin_id),
                  )
                : item.bin_location
                  ? putawayBinItems.all.find(
                      (b: any) =>
                        b.title === item.bin_location ||
                        b.subtitle
                          ?.toLowerCase()
                          .includes(item.bin_location!.toLowerCase()),
                    )
                  : null;
              setPutawayForm((prev) => ({
                ...prev,
                sku: item.sku,
                from_bin_id: matchedBin ? matchedBin.id : prev.from_bin_id,
              }));
              setSelections((prev) => ({
                ...prev,
                putaway_sku: item,
                ...(matchedBin ? { putaway_from_bin: matchedBin } : {}),
              }));
              break;
            }
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
                (x: any) =>
                  String(x.warehouse_id) === String(putawayForm.warehouse_id),
              );
            case "allocate_sku":
              return stockPickerAll.filter(
                (x) =>
                  String(x.warehouse_id) ===
                    String(allocateForm.warehouse_id) &&
                  isAllocatableStockRow(x),
              );
            case "transfer_sku":
              return stockPickerAll.filter(
                (x: any) =>
                  String(x.warehouse_id) ===
                  String(transferForm.from_warehouse_id),
              );
            case "adjust_sku":
              return stockPickerAll.filter(
                (x: any) =>
                  String(x.warehouse_id) === String(adjustForm.warehouse_id),
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
              const po = inboundOrders.find(
                (x: any) => String(x.id) === item.id,
              );
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
                (x: any) =>
                  String(x.id) === String(receiveForm.purchase_order_id),
              );
              const line = po?.lines?.find(
                (x: any) => String(x.sku) === item.id,
              );
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
      {reorderModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--ui-text-primary)]">
                  Buat Purchase Order (Reorder Point)
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                  Pemesanan ulang otomatis untuk stok yang menipis
                </p>
              </div>
              <button
                onClick={() => setReorderModalItem(null)}
                className="rounded p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/40 p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--ui-text-muted)]">Barang:</span>
                <span className="font-semibold text-[var(--ui-text-primary)]">
                  {reorderModalItem.sku} · {reorderModalItem.item_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ui-text-muted)]">Gudang Tujuan:</span>
                <span className="font-medium">{reorderModalItem.warehouse_name || "Semua Gudang"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ui-text-muted)]">Stok Tersedia / Reorder Point:</span>
                <span className="font-medium text-amber-500">
                  {formatQuantity(
                    reorderModalItem.available !== undefined
                      ? reorderModalItem.available
                      : toNumeric(reorderModalItem.on_hand) - toNumeric(reorderModalItem.allocated)
                  )}{" "}
                  / {formatQuantity(reorderModalItem.reorder_level)} {reorderModalItem.uom || "unit"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ui-text-muted)]">Lead Time Pemasok:</span>
                <span className="font-medium">
                  {toNumeric(reorderModalItem.lead_time_days) > 0
                    ? `${reorderModalItem.lead_time_days} hari`
                    : "Belum diatur"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitReorderPo} className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Jumlah Pesanan (Quantity)*
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    className={input}
                    placeholder="Contoh: 50"
                    value={reorderForm.quantity}
                    onChange={(e) =>
                      setReorderForm({ ...reorderForm, quantity: e.target.value })
                    }
                  />
                  <span className="shrink-0 text-xs font-medium text-[var(--ui-text-muted)]">
                    {reorderModalItem.uom || "unit"}
                  </span>
                </div>
                {reorderModalItem.suggested_qty && (
                  <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
                    Saran sistem: {formatQuantity(reorderModalItem.suggested_qty)}{" "}
                    {reorderModalItem.uom || "unit"} (untuk memulihkan stok optimal)
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Nama Vendor / Supplier (Opsional)
                </label>
                <input
                  type="text"
                  className={input}
                  placeholder="Contoh: PT Sumber Pemasok Utama"
                  value={reorderForm.vendor_name}
                  onChange={(e) =>
                    setReorderForm({ ...reorderForm, vendor_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Estimasi Tanggal Tiba (Expected Receiving Date)
                </label>
                <input
                  type="date"
                  className={input}
                  value={reorderForm.expected_receiving_date}
                  onChange={(e) =>
                    setReorderForm({
                      ...reorderForm,
                      expected_receiving_date: e.target.value,
                    })
                  }
                />
                <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
                  Dihitung otomatis dari lead time (hari ini +{" "}
                  {toNumeric(reorderModalItem.lead_time_days) || 7} hari).
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Catatan Pemesanan (Opsional)
                </label>
                <textarea
                  rows={2}
                  className={input + " resize-none"}
                  placeholder="Catatan tambahan untuk pemesanan..."
                  value={reorderForm.notes}
                  onChange={(e) =>
                    setReorderForm({ ...reorderForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[var(--ui-border)] pt-2">
                <button
                  type="button"
                  onClick={() => setReorderModalItem(null)}
                  className="rounded-md border border-[var(--ui-border)] px-4 py-2 text-xs font-semibold text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReorder}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {submittingReorder && (
                    <Loader2 size={13} className="animate-spin" />
                  )}
                  Konfirmasi & Terbitkan PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
