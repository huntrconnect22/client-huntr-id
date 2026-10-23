import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Truck,
  Upload,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";
import Layout from "../components/Layout";
import { getAssetUrl } from "../lib/assets";
import { WmsOverview, WmsWorkflowGuide } from "../components/wms/WmsOverview";
import { RackManagement } from "../components/wms/RackManagement";
import { WarehouseMap } from "../components/wms/WarehouseMap";
import { UniversalWarehouseImportModal } from "../components/wms/UniversalWarehouseImportModal";
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

const card = "rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4";
const input =
  "w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)] transition-colors";

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
  "w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] hover:border-[var(--ui-text-brand)]/60 hover:bg-[var(--ui-bg-input)] px-3 py-2 text-left text-sm text-[var(--ui-text-primary)] outline-none transition-all";

function PickerBrowseButton({
  label,
  placeholder,
  selected,
  onClick,
  helperText,
}: {
  label: string;
  placeholder: string;
  selected: PickerItem | StockPickerItem | null;
  onClick: () => void;
  helperText?: string;
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
      {helperText && (
        <p className="text-[11px] text-[var(--ui-text-muted)]">{helperText}</p>
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
  | "transfer_from_bin"
  | "transfer_to_bin"
  | "transfer_sku"
  | "adjust_warehouse"
  | "adjust_bin"
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
  const [stockImportOpen, setStockImportOpen] = useState(false);

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
  const [stockFilterLowOnly, setStockFilterLowOnly] = useState(false);
  const [reorderConfigItem, setReorderConfigItem] = useState<any | null>(null);
  const [configMinStock, setConfigMinStock] = useState("");
  const [configLeadTime, setConfigLeadTime] = useState("");
  const [savingReorderConfig, setSavingReorderConfig] = useState(false);
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [adjustMode, setAdjustMode] = useState<"increase" | "decrease">("increase");

  const handleOpenReorderConfig = (item: any) => {
    setReorderConfigItem(item);
    setConfigMinStock(
      reorderLevels[item.id] !== undefined
        ? reorderLevels[item.id]
        : String(toNumeric(item.reorder_level || 0))
    );
    setConfigLeadTime(
      leadTimes[item.id] !== undefined
        ? leadTimes[item.id]
        : String(toNumeric(item.lead_time_days || 0))
    );
  };

  const handleSaveReorderConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderConfigItem || !company?.id) return;
    setSavingReorderConfig(true);
    try {
      const minStockNum = toNumeric(configMinStock);
      const leadTimeNum = toNumeric(configLeadTime);
      await setWmsReorderLevel(
        company.id,
        reorderConfigItem.id,
        minStockNum,
        leadTimeNum,
      );
      setReorderLevels((prev) => ({ ...prev, [reorderConfigItem.id]: configMinStock }));
      setLeadTimes((prev) => ({ ...prev, [reorderConfigItem.id]: configLeadTime }));
      setReorderConfigItem(null);
      await Swal.fire({
        icon: "success",
        title: "Pengaturan Disimpan",
        text: `Ambang batas untuk ${reorderConfigItem.sku} berhasil diperbarui.`,
        timer: 1500,
        showConfirmButton: false,
      });
      await refresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.message || "Terjadi kesalahan.",
      });
    } finally {
      setSavingReorderConfig(false);
    }
  };

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
  const stockSummary = useMemo(() => {
    let totalOnHand = 0;
    let totalAllocated = 0;
    let totalAvailable = 0;
    let lowStockCount = 0;
    const uniqueSkus = new Set<string>();

    for (const item of stock) {
      if (item.sku) uniqueSkus.add(item.sku);
      const onHand = toNumeric(item.on_hand);
      const alloc = toNumeric(item.allocated);
      const avail = onHand - alloc;
      const reorder = toNumeric(item.reorder_level);

      totalOnHand += onHand;
      totalAllocated += alloc;
      totalAvailable += avail;

      if (reorder > 0 && avail <= reorder) {
        lowStockCount++;
      }
    }

    return {
      totalSkus: uniqueSkus.size,
      totalOnHand,
      totalAllocated,
      totalAvailable,
      lowStockCount,
    };
  }, [stock]);

  const filteredStock = useMemo(() => {
    return stock.filter((item: any) => {
      const query = stockSearch.trim().toLowerCase();
      const matchesQuery =
        !query ||
        `${item.sku} ${item.item_name} ${item.bin_location || ""}`
          .toLowerCase()
          .includes(query);
      const matchesWarehouse =
        !stockWarehouseId || String(item.warehouse_id) === stockWarehouseId;
      const matchesCategory =
        !stockCategory || item.catalogue_category === stockCategory;

      let matchesLow = true;
      if (stockFilterLowOnly) {
        const avail = toNumeric(item.on_hand) - toNumeric(item.allocated);
        const reorder = toNumeric(item.reorder_level);
        matchesLow = reorder > 0 && avail <= reorder;
      }

      return matchesQuery && matchesWarehouse && matchesCategory && matchesLow;
    });
  }, [stock, stockSearch, stockWarehouseId, stockCategory, stockFilterLowOnly]);

  const receivingBinItems = useMemo(() => {
    return stock.filter((item: any) => {
      const binType = (item.bin_type || "").toLowerCase();
      const binLoc = (item.bin_location || "").toLowerCase();
      return (
        (binType === "receiving" || binLoc.includes("receiv")) &&
        toNumeric(item.on_hand) > 0
      );
    });
  }, [stock]);

  const fulfillmentCounts = useMemo(() => {
    let allocated = 0;
    let picking = 0;
    let packed = 0;
    let shipped = 0;
    for (const o of orders) {
      if (o.status === "allocated") allocated++;
      else if (o.status === "picking") picking++;
      else if (o.status === "packed") packed++;
      else if (o.status === "shipped") shipped++;
    }
    return { allocated, picking, packed, shipped, total: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (fulfillmentFilter === "all") return orders;
    return orders.filter((o: any) => o.status === fulfillmentFilter);
  }, [orders, fulfillmentFilter]);

  const hasStockFilters = Boolean(
    stockSearch || stockWarehouseId || stockCategory || stockFilterLowOnly,
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

  const transferBinItems = useMemo(() => {
    const makeItems = (warehouseId: string, source: boolean): PickerItem[] => {
      const bins =
        warehouses.find((warehouse: any) => String(warehouse.id) === String(warehouseId))
          ?.bins || [];
      const stockInWarehouse = stock.filter(
        (row: any) =>
          String(row.warehouse_id) === String(warehouseId) &&
          (!transferForm.sku || row.sku === transferForm.sku),
      );
      const availableAt = (bin: any) =>
        stockInWarehouse
          .filter(
            (row: any) =>
              String(row.bin_id || "") === String(bin.id) ||
              row.bin_location === bin.code,
          )
          .reduce(
            (total: number, row: any) =>
              total + Math.max(0, toNumeric(row.on_hand) - toNumeric(row.allocated)),
            0,
          );

      return bins
        .filter((bin: any) => {
          if (bin.status !== "active") return false;
          if (!source)
            return ["receiving", "storage", "picking", "packing", "staging"].includes(
              bin.type,
            );
          return !transferForm.sku || availableAt(bin) > 0;
        })
        .map((bin: any) => {
          const available = availableAt(bin);
          const capacity = toNumeric(bin.capacity_units);
          const binTypeLabel = `${String(bin.type || "storage").charAt(0).toUpperCase()}${String(bin.type || "storage").slice(1)}`;
          return {
            id: String(bin.id),
            title: bin.code,
            subtitle: `${bin.name || "Tanpa nama"} · ${binTypeLabel}`,
            tags: [binTypeLabel],
            meta: source
              ? [
                  { label: "Tersedia", value: formatQuantity(available), tone: available > 0 ? ("success" as const) : ("muted" as const) },
                  { label: "SKU", value: transferForm.sku || "Semua", tone: "muted" as const },
                ]
              : [
                  { label: "Isi", value: capacity > 0 ? `${formatQuantity(toNumeric(bin.total_units))}/${formatQuantity(capacity)}` : formatQuantity(toNumeric(bin.total_units)), tone: "brand" as const },
                  { label: "Kapasitas", value: capacity > 0 ? formatQuantity(capacity) : "Tidak dibatasi", tone: "muted" as const },
                ],
          };
        });
    };

    return {
      source: makeItems(transferForm.from_warehouse_id, true),
      destination: makeItems(transferForm.to_warehouse_id, false),
    };
  }, [stock, transferForm.from_warehouse_id, transferForm.sku, transferForm.to_warehouse_id, warehouses]);

  const adjustBinItems = useMemo<PickerItem[]>(() => {
    const bins =
      warehouses.find(
        (warehouse: any) => String(warehouse.id) === String(adjustForm.warehouse_id),
      )?.bins || [];
    const stockAtBin = (bin: any) =>
      stock.filter(
        (row: any) =>
          String(row.warehouse_id) === String(adjustForm.warehouse_id) &&
          row.sku === adjustForm.sku &&
          (String(row.bin_id || "") === String(bin.id) || row.bin_location === bin.code),
      );

    return bins
      .filter((bin: any) => bin.status === "active")
      .filter((bin: any) => !adjustForm.sku || stockAtBin(bin).length > 0)
      .map((bin: any) => {
        const binStock = stockAtBin(bin);
        const onHand = binStock.reduce(
          (total: number, row: any) => total + toNumeric(row.on_hand),
          0,
        );
        const allocated = binStock.reduce(
          (total: number, row: any) => total + toNumeric(row.allocated),
          0,
        );
        const binTypeLabel = `${String(bin.type || "storage").charAt(0).toUpperCase()}${String(bin.type || "storage").slice(1)}`;
        return {
          id: String(bin.id),
          title: bin.code,
          subtitle: `${bin.name || "Tanpa nama"} · ${binTypeLabel}`,
          tags: [binTypeLabel],
          meta: [
            { label: "Stok sistem", value: formatQuantity(onHand), tone: "brand" as const },
            { label: "Dialokasikan", value: formatQuantity(allocated), tone: "muted" as const },
          ],
        };
      });
  }, [adjustForm.sku, adjustForm.warehouse_id, stock, warehouses]);

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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]">
              <WarehouseIcon size={32} />
            </span>
            <p className="font-bold text-[var(--ui-text-primary)]">Pilih perusahaan aktif</p>
            <p className="text-sm text-[var(--ui-text-muted)]">Pilih company workspace untuk melanjutkan ke WMS.</p>
          </div>
        </div>
      </Layout>
    );
  if (installed === false)
    return (
      <Layout
        title="WMS & Inventory"
        subtitle="Warehouse operations · connected to Huntr Catalogue"
      >
        <div className="flex min-h-[70vh] items-center justify-center p-6">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xl">
            <div className="bg-gradient-to-br from-[var(--ui-text-brand)]/10 to-amber-500/5 p-8 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ui-text-brand)]/15">
                <PackageCheck size={32} className="text-[var(--ui-text-brand)]" />
              </span>
              <h2 className="mt-4 text-xl font-black text-[var(--ui-text-primary)]">Warehouse Management</h2>
              <p className="mt-1.5 text-sm text-[var(--ui-text-muted)]">
                Modul WMS &amp; Inventory belum diaktifkan.
                Aktifkan sekarang untuk mulai mengelola gudang, stok, dan pengiriman.
              </p>
            </div>
            <div className="space-y-3 p-6">
              {[
                "Manajemen gudang & bin lokasi",
                "Penerimaan & inspeksi barang (GRN)",
                "Alokasi & pemenuhan order",
                "Laporan stok & replenishment alert",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-[var(--ui-text-secondary)]">
                  <Check size={15} className="shrink-0 text-emerald-500" />
                  {f}
                </div>
              ))}
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await installWms(company.id);
                    setInstalled(true);
                  })
                }
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] px-4 py-3 text-sm font-bold !text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Aktifkan WMS & Inventory
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  const tabs = [
    { key: "Overview", label: "Overview", Icon: BarChart3 },
    { key: "Stock", label: "Stok & Katalog", Icon: Boxes },
    { key: "Warehouse Map", label: "Peta Gudang", Icon: MapPin },
    { key: "Rak & Lokasi", label: "Rak & Lokasi", Icon: Layers },
    {
      key: "Receiving & Put Away",
      label: "Penerimaan & QC",
      Icon: ArrowDownToLine,
      badge: receivingBinItems.length > 0 ? receivingBinItems.length : undefined,
      badgeColor: "bg-blue-500 text-white",
    },
    {
      key: "Allocation & Packing",
      label: "Fulfillment",
      Icon: PackageCheck,
      badge: fulfillmentCounts.allocated > 0 ? fulfillmentCounts.allocated : undefined,
      badgeColor: "bg-violet-500 text-white",
    },
    { key: "Transfers", label: "Transfer", Icon: Truck },
    { key: "Adjustments", label: "Penyesuaian", Icon: Activity },
    { key: "Warehouses", label: "Gudang", Icon: Building2 },
    {
      key: "Reports",
      label: "Laporan",
      Icon: BarChart3,
      badge: report?.low_stock_items?.length > 0 ? report.low_stock_items.length : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
  ];
  return (
    <Layout
      title="WMS & Inventory"
      subtitle="Warehouse operations · connected to Huntr Catalogue"
    >
      <div className="w-full space-y-4">
        {/* Tab navigation */}
        <div className="flex items-center gap-2">
          <div
            className="-mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
            style={{ scrollbarWidth: "none" }}
          >
            {tabs.map(({ key, label, Icon, badge, badgeColor }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  tab === key
                    ? "border-[var(--ui-text-brand)] bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)] shadow-sm"
                    : "border-transparent bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-bg-card)] hover:text-[var(--ui-text-primary)]"
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none ${
                      badgeColor || "bg-[var(--ui-text-brand)] text-white"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStockImportOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] transition-colors hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
          >
            <Upload size={13} /> Import stok
          </button>
          <button
            onClick={refresh}
            className="shrink-0 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-1.5 text-[var(--ui-text-secondary)] transition-colors hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
            title="Refresh data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle size={15} className="shrink-0" />
            {error}
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-2 text-xs text-[var(--ui-text-muted)]">
            <Loader2 size={13} className="animate-spin text-[var(--ui-text-brand)]" />
            Menyimpan transaksi…
          </div>
        )}
        {report?.low_stock_items && report.low_stock_items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-400/5 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={17} />
              </span>
              <div>
                <p className="font-bold text-amber-700 dark:text-amber-400">
                  {report.low_stock_items.length} SKU di bawah Reorder Point
                </p>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Stok menipis · Periksa lead time dan segera terbitkan PO
                </p>
              </div>
            </div>
            <button
              onClick={() => setTab("Reports")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 transition-colors"
            >
              <ShoppingCart size={13} />
              Review & Buat PO
            </button>
          </div>
        )}
        {stockImportOpen && (
          <UniversalWarehouseImportModal
            companyId={company.id}
            warehouses={warehouses}
            onClose={() => setStockImportOpen(false)}
            onDone={async () => {
              await refresh();
              await Swal.fire({ icon: "success", title: "Stok berhasil diimport", text: "Stok dan transaksi import sudah tercatat di gudang tujuan.", timer: 2200, showConfirmButton: false });
            }}
          />
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
              description="A warehouse auto-creates Receiving, Storage, and Quarantine bins. Use the code consistently on labels and documents."
              steps={["Create warehouse", "Review default bins", "Receive first goods"]}
            />

            {/* Warehouse KPI Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]">
                  <Building2 size={20} />
                </span>
                <div>
                  <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">{warehouses.length}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">Total Gudang</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
                    {warehouses.filter((w) => w.status === "active").length}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">Gudang Aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Boxes size={20} />
                </span>
                <div>
                  <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
                    {formatQuantity(
                      warehouses.reduce((acc, w) => acc + (toNumeric(w.capacity_units) || 0), 0)
                    )}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">Total Kapasitas</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
                    {warehouses.filter((w) => w.address).length}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">Lokasi Terdaftar</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* Warehouse list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">Jaringan Gudang Operasional</h3>
                    <p className="text-xs text-[var(--ui-text-muted)]">Kelola fasilitas penyimpanan, status operasional, dan struktur rak & bin</p>
                  </div>
                  <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-text-secondary)]">
                    {warehouses.length} Fasilitas
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-1">
                  {warehouses.map((w) => (
                    <div
                      key={w.id}
                      className="group relative flex flex-col justify-between gap-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4.5 transition-all hover:border-[var(--ui-border)]/90 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3.5">
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/60 text-[var(--ui-text-brand)]">
                            <WarehouseIcon size={20} />
                          </span>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-base text-[var(--ui-text-primary)]">{w.name}</h4>
                              <span className="font-mono rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-0.5 text-xs font-semibold text-[var(--ui-text-secondary)]">
                                {w.code}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  w.status === "active"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${w.status === "active" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                                {w.status === "active" ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                            <p className="flex items-center gap-1.5 text-xs text-[var(--ui-text-muted)]">
                              <MapPin size={13} className="shrink-0 text-[var(--ui-text-muted)]" />
                              <span>{w.address || "Alamat fisik belum dicatat"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--ui-text-secondary)] self-start sm:self-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/40 px-3 py-1.5">
                          <Boxes size={14} className="text-[var(--ui-text-brand)]" />
                          <span>Kapasitas:</span>
                          <strong className="text-[var(--ui-text-primary)]">
                            {w.capacity_units ? `${formatQuantity(w.capacity_units)} unit` : "Tak terbatas"}
                          </strong>
                        </div>
                      </div>

                      {/* Card Action Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ui-border)] pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setStockWarehouseId(String(w.id));
                              setTab("Stock");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)] shadow-sm hover:border-[var(--ui-text-brand)] hover:bg-[var(--ui-text-brand)]/5 transition-colors"
                          >
                            <Boxes size={13} className="text-[var(--ui-text-brand)]" />
                            <span>Lihat Stok</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTab("Rak & Lokasi");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] shadow-sm hover:border-[var(--ui-border)]/90 hover:bg-[var(--ui-bg-input)] transition-colors"
                          >
                            <Layers size={13} />
                            <span>Atur Rak & Bin</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            run(() =>
                              updateWarehouse(company.id, w.id, {
                                status: w.status === "active" ? "inactive" : "active",
                              }),
                            )
                          }
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            w.status === "active"
                              ? "text-zinc-500 hover:bg-zinc-500/10"
                              : "text-emerald-500 hover:bg-emerald-500/10"
                          }`}
                        >
                          {w.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </div>
                    </div>
                  ))}
                  {!warehouses.length && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] py-12 text-center">
                      <Building2 size={32} className="text-[var(--ui-text-muted)] opacity-30" />
                      <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">Belum ada gudang terdaftar</p>
                      <p className="text-xs text-[var(--ui-text-muted)]">Gunakan form di sebelah kanan untuk menambahkan fasilitas pertama.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add warehouse form */}
              <form
                className="h-fit space-y-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await createWarehouse(company.id, warehouseForm);
                    setWarehouseForm({ code: "", name: "", address: "", capacity_units: "" });
                  });
                }}
              >
                <div className="flex items-center gap-2.5 border-b border-[var(--ui-border)] pb-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]">
                    <Plus size={16} />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">Tambah Fasilitas Gudang</h3>
                    <p className="text-[11px] text-[var(--ui-text-muted)]">Otomatis membuat bin RECEIVING, STORAGE, & QUARANTINE</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Kode Gudang *</label>
                    <input
                      className={input}
                      placeholder="Misal: WH-JKT-01"
                      required
                      value={warehouseForm.code}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    />
                    <p className="text-[10px] text-[var(--ui-text-muted)]">Harus unik, digunakan di barcode & label pengiriman</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Nama Fasilitas *</label>
                    <input
                      className={input}
                      placeholder="Contoh: Gudang Distribusi Cakung"
                      required
                      value={warehouseForm.name}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Alamat Lengkap</label>
                    <input
                      className={input}
                      placeholder="Jalan, Kawasan Industri, Kota..."
                      value={warehouseForm.address}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Target Kapasitas (unit)</label>
                    <input
                      className={input}
                      placeholder="0 (opsional)"
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={warehouseForm.capacity_units}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity_units: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] py-2.5 text-xs font-bold !text-white shadow transition-all hover:opacity-90 active:scale-[0.99]"
                >
                  <Plus size={15} />
                  Simpan Fasilitas Baru
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

            {/* Quick KPI Stat Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={card + " flex items-center gap-3 p-3.5"}>
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
              <div className={card + " flex items-center gap-3 p-3.5"}>
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
              <div className={card + " flex items-center gap-3 p-3.5"}>
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
                className={`${card} flex items-center justify-between gap-3 p-3.5 text-left transition-all ${
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

            <div className={card + " overflow-hidden p-0"}>
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
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
                    <input
                      className={input + " pl-8 py-1.5 text-xs"}
                      placeholder="Cari SKU, item, atau bin…"
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                    />
                  </div>
                  <select
                    style={{ width: "10rem" }}
                    className="shrink-0 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-1.5 text-xs text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)] transition-colors"
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
                    className="shrink-0 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-1.5 text-xs text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)] transition-colors"
                    value={stockCategory}
                    onChange={(e) => setStockCategory(e.target.value)}
                  >
                    <option value="">Semua kategori</option>
                    {stockCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {hasStockFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setStockSearch("");
                        setStockWarehouseId("");
                        setStockCategory("");
                        setStockFilterLowOnly(false);
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--ui-border)] px-2 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)] transition-colors"
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
                                <th className="px-4 py-3 font-semibold">Ambang Batas & Lead Time</th>
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
                                    className="border-t border-[var(--ui-border)] hover:bg-[var(--ui-bg-input)]/60 transition-colors"
                                  >
                                    <td className="px-4 py-3 align-middle">
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
                                    </td>
                                    <td className="py-3 align-middle">
                                      <p className="font-medium text-[var(--ui-text-primary)]">{x.warehouse_name}</p>
                                      <p className="mt-0.5 font-mono text-xs text-[var(--ui-text-muted)]">
                                        {x.bin_location || "No bin assigned"}
                                      </p>
                                    </td>
                                    <td className="py-3 text-right align-middle tabular-nums">
                                      <span className="font-semibold text-[var(--ui-text-primary)]">
                                        {formatQuantity(x.on_hand)}
                                      </span>{" "}
                                      <span className="text-xs text-[var(--ui-text-muted)]">
                                        {x.uom || "unit"}
                                      </span>
                                    </td>
                                    <td className="py-3 text-right align-middle tabular-nums text-[var(--ui-text-secondary)]">
                                      {formatQuantity(x.allocated)}
                                    </td>
                                    <td className="py-3 text-right align-middle tabular-nums">
                                      <span
                                        className={
                                          belowReorder
                                            ? "font-bold text-amber-500"
                                            : "font-bold text-emerald-500"
                                        }
                                      >
                                        {formatQuantity(available)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
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
                                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-1 text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)] transition-colors"
                                            title="Atur Ambang Batas Stok"
                                          >
                                            <SlidersHorizontal size={12} />
                                            Atur
                                          </button>
                                          {belowReorder && (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenReorderModal(x)}
                                              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
                                            >
                                              <ShoppingCart size={12} />
                                              PO
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
                    onClick={() => setTab("Receiving & Put Away")}
                    className="mt-1 rounded-lg border border-[var(--ui-border)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-brand)] hover:bg-[var(--ui-bg-input)] transition-colors"
                  >
                    Ke halaman Receiving
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
            {/* Staging / Receiving Bin Queue Status */}
            <div className={card + " border-blue-500/30 bg-blue-500/5 p-4"}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                    <ArrowDownToLine size={16} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ui-text-primary)]">
                      Area Penerimaan (Staging Menunggu Put Away)
                    </h4>
                    <p className="text-xs text-[var(--ui-text-muted)]">
                      Barang yang baru diterima ditampung di area Receiving sebelum dipindahkan ke rak penyimpanan tetap
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-500">
                  {receivingBinItems.length} SKU di Receiving
                </span>
              </div>
              {receivingBinItems.length > 0 ? (
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {receivingBinItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-[var(--ui-text-primary)] truncate">
                          {item.item_name}
                        </p>
                        <p className="font-mono text-[10px] text-[var(--ui-text-brand)]">
                          {item.sku}
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
                          Gudang: <strong>{item.warehouse_name}</strong> · Jumlah:{" "}
                          <strong className="text-blue-500">
                            {formatQuantity(item.on_hand)} {item.uom || "unit"}
                          </strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPutawayForm((prev: any) => ({
                            ...prev,
                            warehouse_id: String(item.warehouse_id),
                            sku: item.sku,
                            quantity: String(
                              toNumeric(item.on_hand) - toNumeric(item.allocated),
                            ),
                            from_bin_id: String(item.bin_id || ""),
                          }));
                          setSelections((prev) => ({
                            ...prev,
                            putaway_warehouse: warehouses.find(
                              (w: any) => String(w.id) === String(item.warehouse_id),
                            )
                              ? {
                                  id: String(item.warehouse_id),
                                  title: item.warehouse_name,
                                  subtitle: "",
                                }
                              : null,
                            putaway_sku: {
                              id: String(item.id),
                              sku: item.sku,
                              item_name: item.item_name,
                              warehouse_name: item.warehouse_name,
                              bin_location: item.bin_location,
                            } as any,
                          }));
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--ui-text-brand)] px-2.5 py-1.5 text-xs font-bold !text-white hover:opacity-90 transition-opacity"
                      >
                        Put Away <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <span>Area Receiving bersih · Semua barang masuk sudah dipindahkan ke rak penyimpanan.</span>
                </div>
              )}
            </div>

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
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ArrowDownToLine size={15} className="text-emerald-500" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--ui-text-primary)]">Penerimaan Barang Masuk</h3>
                      <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                        Konfirmasi langsung atau tambah baris jika satu pengiriman memuat beberapa item.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-[10px] font-bold tracking-wider text-[var(--ui-text-muted)] uppercase">
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <PackageCheck size={15} className="text-emerald-500" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--ui-text-primary)]">Receiving Receipts (GRN)</h3>
                    <p className="text-xs text-[var(--ui-text-muted)]">Riwayat penerimaan barang masuk</p>
                  </div>
                </div>
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
                  className="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-secondary)] disabled:opacity-50 hover:bg-[var(--ui-bg-input)] transition-colors"
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
                className={card + " space-y-3.5"}
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
                <div className="flex items-center gap-2.5 border-b border-[var(--ui-border)] pb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <PackageCheck size={15} className="text-violet-500" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--ui-text-primary)]">Alokasi Order</h3>
                    <p className="text-xs text-[var(--ui-text-muted)]">Sistem memilih bin picking secara otomatis.</p>
                  </div>
                </div>
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] px-4 py-2.5 text-sm font-bold !text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PackageCheck size={14} /> Alokasi Stok
                </button>
              </form>
              <div className={card + " space-y-3"}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Truck size={15} className="text-amber-500" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--ui-text-primary)]">Antrian Fulfillment</h3>
                      <p className="text-xs text-[var(--ui-text-muted)]">Picking · Packing · Dispatch</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ui-text-secondary)]">
                    {filteredOrders.length} Pesanan
                  </span>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "all", label: "Semua", count: fulfillmentCounts.total },
                    { id: "allocated", label: "Siap Pick", count: fulfillmentCounts.allocated },
                    { id: "picking", label: "Sedang Pick", count: fulfillmentCounts.picking },
                    { id: "packed", label: "Siap Kirim", count: fulfillmentCounts.packed },
                    { id: "shipped", label: "Terkirim", count: fulfillmentCounts.shipped },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFulfillmentFilter(f.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        fulfillmentFilter === f.id
                          ? "bg-[var(--ui-text-brand)] text-white shadow-sm"
                          : "bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-card)]"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          fulfillmentFilter === f.id
                            ? "bg-white/20 text-white"
                            : "bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)]"
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-1">
                  {filteredOrders.map((o: any) => {
                    const lines =
                      typeof o.lines === "string"
                        ? JSON.parse(o.lines)
                        : o.lines || [];
                    const meta = shipping[String(o.id)] || {
                      carrier: "",
                      tracking_number: "",
                    };

                    const steps = [
                      { id: "allocated", label: "Alokasi" },
                      { id: "picking", label: "Picking" },
                      { id: "packed", label: "Packing" },
                      { id: "shipped", label: "Dikirim" },
                    ];
                    const currentIdx = steps.findIndex((s) => s.id === o.status);

                    return (
                      <div
                        key={o.id}
                        className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/30 p-3.5 transition-all hover:border-[var(--ui-border)]/80"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--ui-border)] pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[var(--ui-text-primary)]">{o.order_number}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  o.status === "allocated"
                                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                    : o.status === "picking"
                                    ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                                    : o.status === "packed"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : o.status === "shipped"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
                                }`}
                              >
                                {o.status}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">{o.warehouse_name}</p>
                          </div>

                          {/* Quick Actions */}
                          {o.status === "allocated" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => run(() => startWmsPicking(company.id, o.id))}
                                className="inline-flex items-center gap-1 rounded-lg bg-[var(--ui-text-brand)] px-3 py-1.5 text-xs font-bold !text-white hover:opacity-90 shadow-sm"
                              >
                                <Package size={12} /> Mulai Picking
                              </button>
                              <button
                                onClick={() => run(() => releaseWmsOrder(company.id, o.id))}
                                className="rounded-lg border border-[var(--ui-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)] hover:text-red-500"
                                title="Lepas Alokasi Stok"
                              >
                                Release
                              </button>
                            </div>
                          )}
                          {o.status === "picking" && (
                            <button
                              onClick={() =>
                                run(() =>
                                  packWmsOrder(company.id, o.id, "Packed and checked"),
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
                            >
                              <PackageCheck size={12} /> Selesai Packing
                            </button>
                          )}
                        </div>

                        {/* Visual 4-Step Stepper */}
                        <div className="my-2.5 flex items-center justify-between text-[10px]">
                          {steps.map((st, i) => {
                            const isDone = currentIdx >= i;
                            const isCurrent = currentIdx === i;
                            return (
                              <div key={st.id} className="flex min-w-0 flex-1 items-center">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                      isDone
                                        ? "bg-emerald-500 text-white"
                                        : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
                                    }`}
                                  >
                                    {isDone ? "✓" : i + 1}
                                  </span>
                                  <span
                                    className={`font-semibold ${
                                      isCurrent
                                        ? "text-[var(--ui-text-brand)]"
                                        : isDone
                                        ? "text-[var(--ui-text-primary)]"
                                        : "text-[var(--ui-text-muted)]"
                                    }`}
                                  >
                                    {st.label}
                                  </span>
                                </div>
                                {i < steps.length - 1 && (
                                  <div
                                    className={`mx-2 h-0.5 flex-1 ${
                                      currentIdx > i ? "bg-emerald-500" : "bg-[var(--ui-border)]"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Line items to pick / pack */}
                        <div className="mt-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-2.5 space-y-1 text-xs text-[var(--ui-text-secondary)]">
                          {lines.map((line: any, i: number) => (
                            <div
                              key={`${line.stock_id}-${i}`}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="font-mono text-xs text-[var(--ui-text-primary)]">
                                {line.quantity} × {line.sku}
                              </span>
                              <span className="rounded bg-[var(--ui-bg-input)] px-2 py-0.5 text-[11px] text-[var(--ui-text-muted)]">
                                Bin: <strong className="text-[var(--ui-text-brand)]">{line.bin_location || "STORAGE"}</strong>
                              </span>
                            </div>
                          ))}
                        </div>

                        {o.status === "packed" && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                            <input
                              className={input}
                              placeholder="Kurir / Carrier (misal: JNE, GrabExpress)"
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
                              placeholder="No. Resi / Tracking number"
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
                              onClick={() => run(() => shipWmsOrder(company.id, o.id, meta))}
                              className="inline-flex items-center gap-1 rounded-lg bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-bold !text-white hover:opacity-90 shadow-sm"
                            >
                              <Truck size={13} /> Kirim Sekarang
                            </button>
                          </div>
                        )}

                        {o.status === "shipped" && (
                          <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                            <Truck size={13} className="shrink-0" />
                            <span>
                              Kurir: <strong>{o.carrier || "Kurir Tercatat"}</strong> · No. Resi:{" "}
                              <strong className="font-mono">{o.tracking_number || "Tanpa Resi"}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!filteredOrders.length && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Truck size={28} className="text-[var(--ui-text-muted)] opacity-30" />
                      <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">
                        {fulfillmentFilter === "all"
                          ? "Antrian fulfillment kosong"
                          : `Tidak ada pesanan dengan status ${fulfillmentFilter}`}
                      </p>
                      <p className="text-xs text-[var(--ui-text-muted)]">
                        Alokasi order baru untuk memulai alur picking & packing.
                      </p>
                    </div>
                  )}
                </div>
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

            {/* Visual Route Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-cyan-500/10 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-500">
                  <Truck size={20} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">
                    Transfer Stok Antar-Gudang
                  </h3>
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    Pindahkan stok fisik dan sinkronkan pergerakan inventory kedua lokasi secara akurat.
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 sm:flex">
                <span>Gudang Asal</span>
                <ArrowRight size={14} className="text-cyan-500" />
                <span className="rounded bg-cyan-500/20 px-2 py-0.5">🚚 Dalam Transit</span>
                <ArrowRight size={14} className="text-cyan-500" />
                <span>Gudang Tujuan</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const missing = [
                  [transferForm.from_warehouse_id, "gudang asal"],
                  [transferForm.sku, "item inventori"],
                  [transferForm.from_bin, "bin / rak asal"],
                  [transferForm.to_warehouse_id, "gudang tujuan"],
                  [transferForm.to_bin, "bin / rak tujuan"],
                  [transferForm.quantity, "jumlah unit"],
                ].find(([value]) => !value);
                if (missing) {
                  void Swal.fire({
                    icon: "warning",
                    title: "Lengkapi transfer",
                    text: `Pilih ${missing[1]} sebelum mengeksekusi transfer.`,
                    confirmButtonColor: "#f97316",
                  });
                  return;
                }
                run(async () => {
                  await transferStock(company.id, transferForm);
                  setTransferForm({
                    ...transferForm,
                    sku: "",
                    from_bin: "",
                    to_bin: "",
                    quantity: "",
                  });
                  setSelections((prev) => ({
                    ...prev,
                    transfer_sku: null,
                    transfer_from_bin: null,
                    transfer_to_bin: null,
                  }));
                  await Swal.fire({
                    icon: "success",
                    title: "Transfer Berhasil",
                    text: "Stok telah berhasil dipindahkan antar gudang.",
                    timer: 1600,
                    showConfirmButton: false,
                  });
                });
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {/* Source Column */}
                <div className={card + " space-y-3"}>
                  <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15 text-[11px] font-bold text-blue-500">
                      1
                    </span>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ui-text-primary)]">
                      Lokasi Asal (Sumber Barang)
                    </h4>
                  </div>
                  <PickerBrowseButton
                    label="Gudang Asal"
                    placeholder="Pilih gudang asal"
                    selected={selections["transfer_from_wh"] || null}
                    onClick={() => openPicker("transfer_from_wh")}
                  />
                  <PickerBrowseButton
                    label="Item Inventori / SKU"
                    placeholder="Pilih item yang akan dipindah"
                    selected={selections["transfer_sku"] || null}
                    onClick={() => openPicker("transfer_sku")}
                  />
                  <PickerBrowseButton
                    label="Bin / Rak Asal"
                    placeholder={transferForm.from_warehouse_id ? "Pilih bin yang menyimpan barang" : "Pilih gudang asal terlebih dahulu"}
                    selected={selections["transfer_from_bin"] || null}
                    onClick={() => openPicker("transfer_from_bin")}
                    helperText={transferForm.sku ? "Hanya bin dengan stok SKU terpilih yang ditampilkan." : "Pilih item terlebih dahulu agar stok tersedia dapat dicek."}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Jumlah Unit yang Dipindahkan
                    </div>
                    <input
                      required
                      type="number"
                      min="0.001"
                      step="0.001"
                      className={input}
                      placeholder="0"
                      value={transferForm.quantity}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Destination Column */}
                <div className={card + " space-y-3"}>
                  <div className="flex items-center gap-2 border-b border-[var(--ui-border)] pb-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-[11px] font-bold text-emerald-500">
                      2
                    </span>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ui-text-primary)]">
                      Lokasi Tujuan (Penerima)
                    </h4>
                  </div>
                  <PickerBrowseButton
                    label="Gudang Tujuan"
                    placeholder="Pilih gudang penerima"
                    selected={selections["transfer_to_wh"] || null}
                    onClick={() => openPicker("transfer_to_wh")}
                  />
                  <PickerBrowseButton
                    label="Bin / Rak Tujuan"
                    placeholder={transferForm.to_warehouse_id ? "Pilih bin penerima" : "Pilih gudang tujuan terlebih dahulu"}
                    selected={selections["transfer_to_bin"] || null}
                    onClick={() => openPicker("transfer_to_bin")}
                    helperText="Lihat tipe bin serta kapasitas sebelum memilih lokasi tujuan."
                  />

                  {/* Transfer Summary Preview */}
                  <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/40 p-3.5 space-y-2 mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                      Ringkasan Transfer
                    </p>
                    <div className="text-xs text-[var(--ui-text-secondary)] space-y-1">
                      <p>
                        Item: <strong className="text-[var(--ui-text-primary)]">{transferForm.sku || "Belum dipilih"}</strong>
                      </p>
                      <p>
                        Jumlah: <strong className="text-[var(--ui-text-brand)]">{transferForm.quantity ? `${transferForm.quantity} unit` : "0 unit"}</strong>
                      </p>
                      <p className="text-[11px] text-[var(--ui-text-muted)]">
                        Dari bin <strong>{transferForm.from_bin || "—"}</strong> ➔ ke bin <strong>{transferForm.to_bin || "—"}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] px-4 py-3 text-sm font-bold !text-white transition-opacity hover:opacity-90 shadow-md disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                Eksekusi Transfer Stok
              </button>
            </form>
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                    <Activity size={15} className="text-amber-500" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--ui-text-primary)]">
                      Stock Opname & Penyesuaian Saldo
                    </h3>
                    <p className="text-xs text-[var(--ui-text-muted)]">
                      Koreksi perbedaan stok fisik hasil opname dengan catatan sistem.
                    </p>
                  </div>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("increase")}
                    className={`rounded-md px-3 py-1 transition-all ${
                      adjustMode === "increase"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                    }`}
                  >
                    + Penambahan (Surplus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode("decrease")}
                    className={`rounded-md px-3 py-1 transition-all ${
                      adjustMode === "decrease"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                    }`}
                  >
                    - Pengurangan (Defisit/Rusak)
                  </button>
                </div>
              </div>

              <form
                className="space-y-3.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const missing = [
                    [adjustForm.warehouse_id, "gudang"],
                    [adjustForm.sku, "item inventori"],
                    [adjustForm.bin_location, "bin / lokasi rak"],
                    [adjustForm.quantity, "jumlah selisih"],
                    [adjustForm.reason, "alasan penyesuaian"],
                  ].find(([value]) => !value);
                  if (missing) {
                    void Swal.fire({
                      icon: "warning",
                      title: "Lengkapi penyesuaian",
                      text: `Pilih atau isi ${missing[1]} sebelum menyimpan.`,
                      confirmButtonColor: "#f97316",
                    });
                    return;
                  }
                  run(async () => {
                    const rawQty = Math.abs(Number(adjustForm.quantity || 0));
                    const finalQty = adjustMode === "decrease" ? -rawQty : rawQty;
                    await adjustStock(company.id, {
                      ...adjustForm,
                      quantity: finalQty,
                    });
                    setAdjustForm({
                      ...adjustForm,
                      sku: "",
                      bin_location: "",
                      quantity: "",
                      reason: "",
                    });
                    setSelections((prev) => ({
                      ...prev,
                      adjust_sku: null,
                      adjust_bin: null,
                    }));
                    await Swal.fire({
                      icon: "success",
                      title: "Penyesuaian Berhasil",
                      text: "Saldo stok inventori telah berhasil disesuaikan.",
                      timer: 1600,
                      showConfirmButton: false,
                    });
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <PickerBrowseButton
                    label="Gudang"
                    placeholder="Pilih gudang"
                    selected={selections["adjust_warehouse"] || null}
                    onClick={() => openPicker("adjust_warehouse")}
                  />
                  <PickerBrowseButton
                    label="Item Inventori / SKU"
                    placeholder="Pilih item inventori"
                    selected={selections["adjust_sku"] || null}
                    onClick={() => openPicker("adjust_sku")}
                  />
                  <PickerBrowseButton
                    label="Bin / Lokasi Rak"
                    placeholder={adjustForm.warehouse_id ? "Pilih bin lokasi stok" : "Pilih gudang terlebih dahulu"}
                    selected={selections["adjust_bin"] || null}
                    onClick={() => openPicker("adjust_bin")}
                    helperText={adjustForm.sku ? "Hanya bin aktif yang menyimpan SKU terpilih ditampilkan." : "Pilih item terlebih dahulu untuk memeriksa saldo per bin."}
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Jumlah Selisih ({adjustMode === "increase" ? "+" : "-"})
                    </div>
                    <input
                      required
                      type="number"
                      min="0.001"
                      step="0.001"
                      className={input}
                      placeholder="0"
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Alasan Penyesuaian / Referensi Opname *
                    </label>
                    <span className="text-[11px] text-[var(--ui-text-muted)]">
                      Pilih alasan cepat di bawah atau ketik manual
                    </span>
                  </div>
                  <input
                    required
                    className={input}
                    placeholder="Contoh: Temuan Stock Opname Q4 atau Barang Rusak saat handling"
                    value={adjustForm.reason}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, reason: e.target.value })
                    }
                  />

                  {/* Quick Reason Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      "Stock Opname Berkala",
                      "Barang Rusak / Kadaluarsa",
                      "Koreksi Selisih Input Sistem",
                      "Sample / Demo Produk",
                      "Selisih Penerimaan Fisik",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setAdjustForm({ ...adjustForm, reason: chip })}
                        className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-1 text-[11px] text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)] transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold !text-white transition-opacity hover:opacity-90 shadow-md ${
                    adjustMode === "decrease" ? "bg-rose-600 hover:bg-rose-700" : "bg-[var(--ui-text-brand)]"
                  }`}
                >
                  <Check size={15} />
                  Simpan Penyesuaian Stok ({adjustMode === "increase" ? "+" : "-"}
                  {adjustForm.quantity || 0})
                </button>
              </form>
            </div>
          </div>
        )}
        {tab === "Reports" && (
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
                  <table className="w-full min-w-[500px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--ui-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                        <th className="py-2.5">Fasilitas Gudang</th>
                        <th className="text-right">Varian SKU</th>
                        <th className="text-right">Fisik (On-Hand)</th>
                        <th className="text-right">Teralokasi</th>
                        <th className="text-right">Ketersediaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ui-border)]">
                      {(report?.stock_by_warehouse || []).map((x: any) => {
                        const onHand = toNumeric(x.on_hand) || 0;
                        const allocated = toNumeric(x.allocated) || 0;
                        const available = Math.max(0, onHand - allocated);
                        const freePct = onHand > 0 ? Math.round((available / onHand) * 100) : 100;
                        return (
                          <tr key={x.id} className="group hover:bg-[var(--ui-bg-input)]/40 transition-colors">
                            <td className="py-3">
                              <p className="font-semibold text-xs text-[var(--ui-text-primary)]">{x.name}</p>
                              <span className="font-mono text-[11px] text-[var(--ui-text-muted)]">{x.code}</span>
                            </td>
                            <td className="text-right font-medium text-xs tabular-nums text-[var(--ui-text-secondary)]">
                              {x.sku_count}
                            </td>
                            <td className="text-right font-bold text-xs tabular-nums text-[var(--ui-text-primary)]">
                              {formatQuantity(onHand)}
                            </td>
                            <td className="text-right font-medium text-xs tabular-nums text-amber-500">
                              {formatQuantity(allocated)}
                            </td>
                            <td className="text-right">
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
                            </td>
                          </tr>
                        );
                      })}
                      {!report?.stock_by_warehouse?.length && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[var(--ui-text-muted)]">
                            Belum ada data stok per gudang tercatat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ui-text-brand)] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
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
        )}
        {tab === "Warehouse Map" && (
          <WarehouseMap
            companyId={company.id}
            warehouses={warehouses}
            stock={stock}
            onOpenOperation={(action, { warehouse, bin, item }) => {
              const warehouseSelection: PickerItem = {
                id: String(warehouse.id),
                title: warehouse.name,
                subtitle: `${warehouse.code} · ${warehouse.address || "—"}`,
                meta: [{ label: "Bins", value: String(warehouse.bins?.length || 0), tone: "muted" }],
              };
              const binSelection: PickerItem = {
                id: String(bin.id),
                title: bin.code,
                subtitle: `${bin.name || "Tanpa nama"} · ${bin.type}`,
                meta: [{ label: "Status", value: bin.status || "active", tone: "success" }],
              };
              const stockSelection = item
                ? ({
                    id: String(item.id || item.sku),
                    sku: item.sku,
                    item_name: item.item_name || item.sku,
                    uom: item.uom || "unit",
                    bin_location: bin.code,
                    bin_id: String(bin.id),
                    warehouse_id: String(warehouse.id),
                    warehouse_name: warehouse.name,
                    warehouse_code: warehouse.code,
                    on_hand: item.on_hand || 0,
                    allocated: item.allocated || 0,
                  } as StockPickerItem)
                : null;

              if (action === "putaway") {
                setPutawayForm((current) => ({
                  ...current,
                  warehouse_id: String(warehouse.id),
                  to_bin_id: String(bin.id),
                }));
                setSelections((current) => ({
                  ...current,
                  putaway_warehouse: warehouseSelection,
                  putaway_to_bin: binSelection,
                }));
                setTab("Receiving & Put Away");
                return;
              }

              if (action === "transfer") {
                setTransferForm((current) => ({
                  ...current,
                  from_warehouse_id: String(warehouse.id),
                  from_bin: bin.code,
                  sku: item?.sku || "",
                  quantity: "",
                }));
                setSelections((current) => ({
                  ...current,
                  transfer_from_wh: warehouseSelection,
                  transfer_from_bin: binSelection,
                  transfer_sku: stockSelection,
                }));
                setTab("Transfers");
                return;
              }

              setAdjustForm((current) => ({
                ...current,
                warehouse_id: String(warehouse.id),
                sku: item?.sku || "",
                bin_location: bin.code,
              }));
              setSelections((current) => ({
                ...current,
                adjust_warehouse: warehouseSelection,
                adjust_bin: binSelection,
                adjust_sku: stockSelection,
              }));
              setTab("Adjustments");
            }}
          />
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
              setTransferForm({ ...transferForm, sku: item.sku, from_bin: "" });
              setSelections((prev) => ({
                ...prev,
                transfer_sku: item,
                transfer_from_bin: null,
              }));
              break;
            case "adjust_sku":
              setAdjustForm({ ...adjustForm, sku: item.sku, bin_location: "" });
              setSelections((prev) => ({
                ...prev,
                adjust_sku: item,
                adjust_bin: null,
              }));
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
            picker.kind === "transfer_from_bin" ||
            picker.kind === "transfer_to_bin" ||
            picker.kind === "adjust_warehouse" ||
            picker.kind === "adjust_bin")
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
              setTransferForm({
                ...transferForm,
                from_warehouse_id: item.id,
                sku: "",
                from_bin: "",
              });
              setSelections((prev) => ({
                ...prev,
                transfer_from_wh: item,
                transfer_sku: null,
                transfer_from_bin: null,
              }));
              break;
            case "transfer_to_wh":
              setTransferForm({ ...transferForm, to_warehouse_id: item.id, to_bin: "" });
              setSelections((prev) => ({
                ...prev,
                transfer_to_wh: item,
                transfer_to_bin: null,
              }));
              break;
            case "transfer_from_bin":
              setTransferForm({ ...transferForm, from_bin: item.title });
              setSelections((prev) => ({ ...prev, transfer_from_bin: item }));
              break;
            case "transfer_to_bin":
              setTransferForm({ ...transferForm, to_bin: item.title });
              setSelections((prev) => ({ ...prev, transfer_to_bin: item }));
              break;
            case "adjust_warehouse":
              setAdjustForm({
                ...adjustForm,
                warehouse_id: item.id,
                sku: "",
                bin_location: "",
              });
              setSelections((prev) => ({
                ...prev,
                adjust_warehouse: item,
                adjust_sku: null,
                adjust_bin: null,
              }));
              break;
            case "adjust_bin":
              setAdjustForm({ ...adjustForm, bin_location: item.title });
              setSelections((prev) => ({ ...prev, adjust_bin: item }));
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
            case "transfer_from_bin":
              return transferBinItems.source;
            case "transfer_to_bin":
              return transferBinItems.destination;
            case "adjust_bin":
              return adjustBinItems;
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
            case "transfer_from_bin":
              return "Pilih bin / rak asal";
            case "transfer_to_bin":
              return "Pilih bin / rak tujuan";
            case "adjust_bin":
              return "Pilih bin / lokasi rak";
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
            case "transfer_from_bin":
              return transferForm.sku
                ? "Hanya bin aktif dengan stok tersedia untuk SKU ini yang dapat dipilih."
                : "Pilih SKU terlebih dahulu untuk menampilkan stok tersedia tiap bin.";
            case "transfer_to_bin":
              return "Pilih bin aktif penerima. Kapasitas ditampilkan untuk membantu penempatan stok.";
            case "adjust_bin":
              return adjustForm.sku
                ? "Pilih lokasi aktif yang menyimpan SKU ini. Saldo sistem ditampilkan untuk membantu opname."
                : "Pilih SKU terlebih dahulu untuk menampilkan bin yang menyimpan barang.";
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
            case "transfer_from_bin":
            case "transfer_to_bin":
            case "adjust_bin":
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
            case "transfer_from_bin":
            case "transfer_to_bin":
            case "adjust_bin":
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
            case "transfer_from_bin":
              return (selections["transfer_from_bin"] as PickerItem | null)?.id || null;
            case "transfer_to_bin":
              return (selections["transfer_to_bin"] as PickerItem | null)?.id || null;
            case "adjust_bin":
              return (selections["adjust_bin"] as PickerItem | null)?.id || null;
            case "adjust_warehouse":
              return adjustForm.warehouse_id || null;
            default:
              return null;
          }
        })()}
      />
      {reorderModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <ShoppingCart size={17} className="text-amber-600" />
                </span>
                <h3 className="text-lg font-bold text-[var(--ui-text-primary)]">
                  Buat Purchase Order (Reorder Point)
                </h3>
                <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                  Pemesanan ulang otomatis untuk stok yang menipis
                </p>
              </div>
              <button
                onClick={() => setReorderModalItem(null)}
                className="ml-auto rounded-lg p-1.5 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)] transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/50 p-4 text-xs">
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
      {reorderConfigItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <SlidersHorizontal size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[var(--ui-text-primary)]">Atur Ambang Batas Stok</h3>
                  <p className="text-xs text-[var(--ui-text-muted)] font-mono">{reorderConfigItem.sku} · {reorderConfigItem.item_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReorderConfigItem(null)}
                className="rounded-lg p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveReorderConfig} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Batas Minimum Stok (Reorder Point)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  className={input}
                  placeholder="0"
                  value={configMinStock}
                  onChange={(e) => setConfigMinStock(e.target.value)}
                />
                <p className="text-[11px] text-[var(--ui-text-muted)]">
                  Sistem akan memberi alert peringatan jika stok tersedia berada di bawah angka ini.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Estimasi Lead Time Pemasok (Hari)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  className={input}
                  placeholder="0"
                  value={configLeadTime}
                  onChange={(e) => setConfigLeadTime(e.target.value)}
                />
                <p className="text-[11px] text-[var(--ui-text-muted)]">
                  Waktu tunggu rata-rata (dalam hari) sejak pemesanan hingga barang tiba di gudang.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[var(--ui-border)] pt-3">
                <button
                  type="button"
                  onClick={() => setReorderConfigItem(null)}
                  className="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingReorderConfig}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-bold !text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingReorderConfig ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </Layout>
  );
}
