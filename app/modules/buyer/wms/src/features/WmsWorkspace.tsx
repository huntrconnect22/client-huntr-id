import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useLocation } from "react-router";
import Swal from "sweetalert2";
import {
  AlertTriangle,
  Check,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import Layout from "~/components/Layout";
import { getAssetUrl } from "~/lib/assets";
import { WmsOverview } from "../components/WmsOverview";
import { WmsMapTab } from "../tabs/WmsMapTab";
import { WmsRacksTab } from "../tabs/WmsRacksTab";
import { UniversalWarehouseImportModal } from "../components/UniversalWarehouseImportModal";
import { WmsWarehousesTab } from "../tabs/WmsWarehousesTab";
import { WmsStockTab } from "../tabs/WmsStockTab";
import { WmsTransfersTab } from "../tabs/WmsTransfersTab";
import { WmsAdjustmentsTab } from "../tabs/WmsAdjustmentsTab";
import { WmsReportsTab } from "../tabs/WmsReportsTab";
import { WmsAllocationTab } from "../tabs/WmsAllocationTab";
import { WmsReceivingTab } from "../tabs/WmsReceivingTab";
import { WmsReorderModals } from "../components/WmsReorderModals";
import { WmsPickerModals } from "../components/WmsPickerModals";
import type { PickerItem } from "../components/GenericPickerModal";
import type { StockPickerItem } from "../components/StockPickerModal";
import { formatQuantity, toNumeric } from "../data/quantity";
import { useActiveCompany } from "~/shared/hooks/useActiveCompany";
import {
  adjustStock,
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
  repairWmsLegacyGoodsReceiptStock,
  setWmsReorderLevel,
  createWmsReorderPo,
  transferStock,
  updateWarehouse,
} from "~/modules/shared/api/wms";

const card = "";
const input = "";

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
  const company = useActiveCompany<any>();
  const { search } = useLocation();
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
  const [receiveLines, setReceiveLines] = useState<any[]>([]);
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
    const paramTab = new URLSearchParams(search).get("tab");
    const tabByQuery: Record<string, string> = {
      Inventory: "Stock",
      Stock: "Stock",
      "Warehouse Map": "Warehouse Map",
      Racks: "Rak & Lokasi",
      Receiving: "Receiving & Put Away",
      "Receiving & Put Away": "Receiving & Put Away",
      Fulfillment: "Allocation & Packing",
      "Allocation & Packing": "Allocation & Packing",
      Transfers: "Transfers",
      Adjustments: "Adjustments",
      Warehouses: "Warehouses",
      Reports: "Reports",
    };

    setTab(paramTab ? (tabByQuery[paramTab] ?? "Overview") : "Overview");
  }, [search]);

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
      catalogue.map((item: any) => {
        const rawImg = item.image_url || item.image_path || item.image;
        return {
          id: String(item.id),
          title: item.name || String(item.item_code),
          subtitle: String(item.item_code),
          searchable: `${item.item_code} ${item.name ?? ""}`,
          imageUrl: rawImg ? getAssetUrl(rawImg) : null,
          meta: [
            {
              label: "SKU",
              value: String(item.item_code),
              tone: "brand" as const,
            },
          ],
        };
      }),
    [catalogue],
  );

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
              <Button
                variant="contained"
                color="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await installWms(company.id);
                    setInstalled(true);
                  })
                }
                fullWidth
                sx={{ mt: 2 }}
                startIcon={busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              >
                Aktifkan WMS &amp; Inventory
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  return (
    <Layout
      title="WMS & Inventory"
      subtitle="Warehouse operations · connected to Huntr Catalogue"
    >
      <div className="w-full space-y-4">
        {error && (
          <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
        )}
        {busy && (
          <Alert severity="info" icon={<Loader2 size={13} className="animate-spin" />} sx={{ py: 0.5 }}>
            Menyimpan transaksi…
          </Alert>
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
            <Button
              variant="contained"
              onClick={() => setTab("Reports")}
              sx={{ bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' }, fontSize: '0.75rem', fontWeight: 700 }}
              startIcon={<ShoppingCart size={13} />}
            >
              Review &amp; Buat PO
            </Button>
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
          <WmsWarehousesTab
            warehouses={warehouses}
            company={company}
            warehouseForm={warehouseForm}
            setWarehouseForm={setWarehouseForm}
            createWarehouse={createWarehouse}
            updateWarehouse={updateWarehouse}
            run={run}
            onViewStock={(wId) => {
              setStockWarehouseId(wId);
              setTab("Stock");
            }}
            onConfigureRacks={() => setTab("Rak & Lokasi")}
            inputClass={input}
          />
        )}
        {tab === "Stock" && (
          <WmsStockTab
            cardClass={card}
            inputClass={input}
            stockSummary={stockSummary}
            stockFilterLowOnly={stockFilterLowOnly}
            setStockFilterLowOnly={setStockFilterLowOnly}
            filteredStock={filteredStock}
            stockSearch={stockSearch}
            setStockSearch={setStockSearch}
            stockWarehouseId={stockWarehouseId}
            setStockWarehouseId={setStockWarehouseId}
            warehouses={warehouses}
            stockCategory={stockCategory}
            setStockCategory={setStockCategory}
            stockCategories={stockCategories}
            setStockImportOpen={setStockImportOpen}
            hasStockFilters={hasStockFilters}
            stockGroupedByBinType={stockGroupedByBinType}
            BIN_TYPE_LABELS={BIN_TYPE_LABELS}
            leadTimes={leadTimes}
            handleOpenReorderConfig={handleOpenReorderConfig}
            handleOpenReorderModal={handleOpenReorderModal}
            onNavigateToReceiving={() => setTab("Receiving & Put Away")}
          />
        )}
        {tab === "Receiving & Put Away" && (
          <WmsReceivingTab
            cardClass={card}
            inputClass={input}
            receivingBinItems={receivingBinItems}
            warehouses={warehouses}
            receiveForm={receiveForm}
            setReceiveForm={setReceiveForm}
            receiveLines={receiveLines}
            setReceiveLines={setReceiveLines}
            putawayForm={putawayForm}
            setPutawayForm={setPutawayForm}
            selections={selections}
            setSelections={setSelections}
            openPicker={openPicker}
            company={company}
            run={run}
            busy={busy}
            receipts={receipts}
            catalogue={catalogue}
            cataloguePickerItems={cataloguePickerItems}
            setError={setError}
          />
        )}
        {tab === "Allocation & Packing" && (
          <WmsAllocationTab
            cardClass={card}
            inputClass={input}
            company={company}
            run={run}
            allocateForm={allocateForm}
            setAllocateForm={setAllocateForm}
            selections={selections}
            openPicker={openPicker}
            allocationAvailable={allocationAvailable}
            allocationRequested={allocationRequested}
            allocationSufficient={allocationSufficient}
            fulfillmentCounts={fulfillmentCounts}
            fulfillmentFilter={fulfillmentFilter}
            setFulfillmentFilter={setFulfillmentFilter}
            filteredOrders={filteredOrders}
            shipping={shipping}
            setShipping={setShipping}
          />
        )}
        {tab === "Transfers" && (
          <WmsTransfersTab
            cardClass={card}
            inputClass={input}
            transferForm={transferForm}
            setTransferForm={setTransferForm}
            selections={selections}
            setSelections={setSelections}
            openPicker={openPicker}
            company={company}
            run={run}
            busy={busy}
            transferStock={transferStock}
          />
        )}
        {tab === "Adjustments" && (
          <WmsAdjustmentsTab
            cardClass={card}
            inputClass={input}
            adjustMode={adjustMode}
            setAdjustMode={setAdjustMode}
            adjustForm={adjustForm}
            setAdjustForm={setAdjustForm}
            selections={selections}
            setSelections={setSelections}
            openPicker={openPicker}
            company={company}
            run={run}
            busy={busy}
            adjustStock={adjustStock}
          />
        )}
        {tab === "Reports" && (
          <WmsReportsTab
            report={report}
            warehouses={warehouses}
            handleOpenReorderModal={handleOpenReorderModal}
          />
        )}
        {tab === "Warehouse Map" && (
          <WmsMapTab
            company={company}
            warehouses={warehouses}
            stock={stock}
            refresh={refresh}
            setPutawayForm={setPutawayForm}
            setTransferForm={setTransferForm}
            setAdjustForm={setAdjustForm}
            setSelections={setSelections}
            setTab={setTab}
          />
        )}
        {tab === "Rak & Lokasi" && (
          <WmsRacksTab
            warehouses={warehouses}
            company={company}
            refresh={refresh}
            setPutawayForm={setPutawayForm}
            setTab={setTab}
          />
        )}
      </div>

      <WmsPickerModals
        picker={picker}
        closePicker={closePicker}
        warehouses={warehouses}
        stock={stock}
        inboundOrders={inboundOrders}
        cataloguePickerItems={cataloguePickerItems}
        receiveForm={receiveForm}
        setReceiveForm={setReceiveForm}
        putawayForm={putawayForm}
        setPutawayForm={setPutawayForm}
        allocateForm={allocateForm}
        setAllocateForm={setAllocateForm}
        transferForm={transferForm}
        setTransferForm={setTransferForm}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        selections={selections}
        setSelections={setSelections}
      />
      <WmsReorderModals
        inputClass={input}
        reorderModalItem={reorderModalItem}
        setReorderModalItem={setReorderModalItem}
        reorderForm={reorderForm}
        setReorderForm={setReorderForm}
        handleSubmitReorderPo={handleSubmitReorderPo}
        submittingReorder={submittingReorder}
        reorderConfigItem={reorderConfigItem}
        setReorderConfigItem={setReorderConfigItem}
        configMinStock={configMinStock}
        setConfigMinStock={setConfigMinStock}
        configLeadTime={configLeadTime}
        setConfigLeadTime={setConfigLeadTime}
        handleSaveReorderConfig={handleSaveReorderConfig}
        savingReorderConfig={savingReorderConfig}
      />
      </Layout>
  );
}
