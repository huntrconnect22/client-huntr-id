import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Loader2,
  MapPinned,
  PackageSearch,
  Search,
  X,
} from "lucide-react";
import { getWarehouseBinStock } from "../../lib/api/wms";

type Operation = "putaway" | "picking" | "dispatch";
type WarehouseAction = "putaway" | "transfer" | "adjust";
type WarehouseActionContext = { warehouse: any; bin: any; item?: any };

const number = (value: unknown) => Number(value || 0);
const label: Record<string, string> = {
  receiving: "Receiving",
  storage: "Storage",
  picking: "Picking",
  packing: "Packing",
  staging: "Staging",
  quarantine: "Quarantine",
};
const tone: Record<string, string> = {
  receiving:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  storage:
    "border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  picking: "border-blue-500/45 bg-blue-500/10 text-blue-700 dark:text-blue-200",
  packing:
    "border-violet-500/45 bg-violet-500/10 text-violet-700 dark:text-violet-200",
  staging: "border-cyan-500/45 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  quarantine:
    "border-rose-500/45 bg-rose-500/10 text-rose-700 dark:text-rose-200",
};

function BinTile({
  bin,
  active,
  highlighted,
  compact = false,
  onClick,
}: {
  bin: any;
  active: boolean;
  highlighted: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const units = number(bin.total_units);
  const capacity = number(bin.capacity_units);
  const occupied =
    capacity > 0
      ? Math.min(100, (units / capacity) * 100)
      : units > 0
        ? 100
        : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative border p-2 text-left transition-all ${compact ? "min-h-[54px]" : "min-h-[88px]"} ${tone[bin.type] || tone.storage} ${active ? "ring-2 ring-[var(--ui-text-brand)] ring-offset-2 ring-offset-[var(--ui-bg-card)]" : "hover:-translate-y-0.5 hover:shadow-sm"} ${highlighted ? "outline outline-2 outline-orange-500" : ""}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="truncate font-mono text-[11px] font-bold">
          {bin.code}
        </span>
        {!compact && (
          <span className="text-[9px] font-bold uppercase opacity-70">
            {label[bin.type] || bin.type}
          </span>
        )}
      </div>
      <div
        className={`${compact ? "mt-1 text-sm" : "mt-2 text-lg"} font-bold tabular-nums`}
      >
        {units}
      </div>
      {!compact && (
        <div className="text-[10px] opacity-75">
          {bin.sku_count || 0} SKU{capacity > 0 ? ` · ${capacity} cap.` : ""}
        </div>
      )}
      <div className={`${compact ? "mt-1" : "mt-2"} h-1 bg-black/10`}>
        <div
          className="h-full bg-current opacity-70"
          style={{ width: `${occupied}%` }}
        />
      </div>
    </button>
  );
}

function FloorZone({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden border border-slate-400/70 bg-white/75 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] dark:border-slate-600 dark:bg-slate-900/70 ${className}`}
    >
      <div className="mb-2 border-b border-slate-300/80 pb-1 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
          {title}
        </p>
        <p className="text-[9px] text-slate-500">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">{children}</div>
    </section>
  );
}

export function WarehouseMap({
  companyId,
  warehouses,
  stock,
  onOpenOperation,
}: {
  companyId: string;
  warehouses: any[];
  stock: any[];
  onOpenOperation?: (
    action: WarehouseAction,
    context: WarehouseActionContext,
  ) => void;
}) {
  const [warehouseId, setWarehouseId] = useState("");
  const [operation, setOperation] = useState<Operation>("putaway");
  const [selectedBinId, setSelectedBinId] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState("");
  const [search, setSearch] = useState("");
  const [binItems, setBinItems] = useState<any[]>([]);
  const [inspecting, setInspecting] = useState(false);

  useEffect(() => {
    if (!warehouseId && warehouses[0]?.id)
      setWarehouseId(String(warehouses[0].id));
  }, [warehouseId, warehouses]);
  const warehouse = useMemo(
    () =>
      warehouses.find((row) => String(row.id) === warehouseId) || warehouses[0],
    [warehouses, warehouseId],
  );
  const bins = warehouse?.bins || [];
  const warehouseStock = useMemo(
    () =>
      stock.filter(
        (row) =>
          String(row.warehouse_id) === String(warehouse?.id) &&
          number(row.on_hand) > 0,
      ),
    [stock, warehouse?.id],
  );
  const skus = useMemo(
    () =>
      warehouseStock
        .filter(
          (row, index, rows) =>
            rows.findIndex((candidate) => candidate.sku === row.sku) === index,
        )
        .sort((a, b) => String(a.item_name).localeCompare(String(b.item_name))),
    [warehouseStock],
  );
  const selectedStock = warehouseStock.find((row) => row.sku === selectedSku);
  const selectedBin = bins.find((row: any) => String(row.id) === selectedBinId);
  const highlightedBinId = selectedSku
    ? String(
        selectedStock?.bin_id ||
          bins.find((bin: any) => bin.code === selectedStock?.bin_location)
            ?.id ||
          "",
      )
    : "";
  const storageBins = bins.filter((bin: any) => bin.type === "storage");
  const route = useMemo(() => {
    const receiving = bins.find((bin: any) => bin.type === "receiving");
    const storage =
      bins.find((bin: any) => String(bin.id) === highlightedBinId) ||
      selectedBin ||
      storageBins[0];
    const picking =
      bins.find((bin: any) => bin.type === "picking") ||
      bins.find((bin: any) => bin.type === "staging") ||
      bins.find((bin: any) => bin.type === "packing");
    const packing =
      bins.find((bin: any) => bin.type === "packing") ||
      bins.find((bin: any) => bin.type === "staging");
    if (operation === "putaway") return [receiving, storage].filter(Boolean);
    if (operation === "picking")
      return [storage, picking, packing].filter(Boolean);
    return [storage, picking, packing].filter(Boolean);
  }, [bins, highlightedBinId, operation, selectedBin, storageBins]);

  const inspect = async (bin: any) => {
    if (!warehouse?.id) return;
    setSelectedBinId(String(bin.id));
    setInspecting(true);
    setBinItems([]);
    try {
      const response = await getWarehouseBinStock(
        companyId,
        warehouse.id,
        bin.id,
      );
      setBinItems(response?.data?.items || []);
    } finally {
      setInspecting(false);
    }
  };
  const matchingBins = (rows: any[]) =>
    rows.filter(
      (bin) =>
        !search ||
        `${bin.code} ${bin.name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );

  return (
    <section className="space-y-4">
      <header className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[var(--ui-text-brand)]">
              <MapPinned size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                Live layout
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-[var(--ui-text-primary)]">
              Peta gudang interaktif
            </h2>
            <p className="mt-1 text-sm text-[var(--ui-text-muted)]">
              Klik lokasi untuk melihat isi bin. Dari item pada bin, mulai
              transfer atau penyesuaian; pilih bin tujuan untuk memulai put
              away.
            </p>
          </div>
          <select
            value={warehouse?.id || ""}
            onChange={(event) => {
              setWarehouseId(event.target.value);
              setSelectedBinId("");
              setSelectedSku("");
            }}
            className="border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm font-semibold text-[var(--ui-text-primary)]"
          >
            {warehouses.map((row) => (
              <option key={row.id} value={row.id}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid gap-2 border-t border-[var(--ui-border)] pt-3 md:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
              size={15}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kode atau nama bin"
              className="w-full border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] py-2 pl-9 pr-3 text-sm text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-text-brand)]"
            />
          </label>
          <div className="flex border border-[var(--ui-border)]">
            {(
              [
                ["putaway", "Put away"],
                ["picking", "Picking"],
                ["dispatch", "Dispatch"],
              ] as [Operation, string][]
            ).map(([key, title]) => (
              <button
                key={key}
                type="button"
                onClick={() => setOperation(key)}
                className={`px-3 py-2 text-xs font-semibold ${operation === key ? "bg-[var(--ui-text-brand)] text-white" : "text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)]"}`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </header>
      {!warehouse ? (
        <div className="border border-dashed border-[var(--ui-border)] py-14 text-center text-sm text-[var(--ui-text-muted)]">
          Buat gudang dan bin terlebih dahulu untuk menampilkan peta.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-[var(--ui-text-primary)]">
                  {warehouse.name}
                </h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Setiap blok adalah bin fisik. Angka besar adalah unit stok
                  saat ini.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-[var(--ui-text-muted)]">
                <span>▣ {bins.length} bin</span>
                <span>▣ {storageBins.length} storage</span>
                <span>▣ {warehouseStock.length} stock position</span>
              </div>
            </div>
            <div className="overflow-x-auto border border-[var(--ui-border)] bg-[var(--ui-bg-input)]/35 p-3">
              <div className="relative mx-auto min-h-[570px] min-w-[820px] max-w-[1180px] overflow-hidden border-2 border-slate-400/75 bg-slate-100 p-3 dark:border-slate-600 dark:bg-slate-950">
                <div className="absolute inset-x-0 top-0 flex h-8 items-center justify-center border-b border-slate-400/60 bg-slate-200/80 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                  Loading dock · inbound access
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-8 items-center justify-center border-t border-slate-400/60 bg-slate-200/80 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                  Shipping dock · outbound access
                </div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  <defs>
                    <marker
                      id="warehouse-route-arrow"
                      markerWidth="5"
                      markerHeight="5"
                      refX="4"
                      refY="2.5"
                      orient="auto"
                    >
                      <path d="M0,0 L5,2.5 L0,5 z" fill="currentColor" />
                    </marker>
                  </defs>
                  {operation === "putaway" ? (
                    <polyline
                      points="12,17 31,17 31,49 50,49"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.65"
                      strokeDasharray="2.2 1.3"
                      markerEnd="url(#warehouse-route-arrow)"
                      className="text-[var(--ui-text-brand)]"
                    />
                  ) : (
                    <polyline
                      points="50,49 69,49 69,17 87,17 87,83"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.65"
                      strokeDasharray="2.2 1.3"
                      markerEnd="url(#warehouse-route-arrow)"
                      className="text-[var(--ui-text-brand)]"
                    />
                  )}
                </svg>
                <div className="relative grid h-full min-h-[540px] grid-cols-[19%_1fr_19%] grid-rows-[1fr_1fr] gap-3 pt-7 pb-7">
                  <FloorZone
                    title="Inbound"
                    subtitle="Receiving"
                    className="col-start-1 row-start-1"
                  >
                    {matchingBins(
                      bins.filter((bin: any) => bin.type === "receiving"),
                    ).map((bin: any) => (
                      <BinTile
                        key={bin.id}
                        bin={bin}
                        active={String(bin.id) === selectedBinId}
                        highlighted={String(bin.id) === highlightedBinId}
                        compact
                        onClick={() => inspect(bin)}
                      />
                    ))}
                  </FloorZone>
                  <FloorZone
                    title="Outbound"
                    subtitle="Packing · staging"
                    className="col-start-3 row-start-2"
                  >
                    {matchingBins(
                      bins.filter((bin: any) =>
                        ["packing", "staging"].includes(bin.type),
                      ),
                    ).map((bin: any) => (
                      <BinTile
                        key={bin.id}
                        bin={bin}
                        active={String(bin.id) === selectedBinId}
                        highlighted={String(bin.id) === highlightedBinId}
                        compact
                        onClick={() => inspect(bin)}
                      />
                    ))}
                  </FloorZone>
                  <FloorZone
                    title="QC hold"
                    subtitle="Quarantine"
                    className="col-start-1 row-start-2"
                  >
                    {matchingBins(
                      bins.filter((bin: any) => bin.type === "quarantine"),
                    ).map((bin: any) => (
                      <BinTile
                        key={bin.id}
                        bin={bin}
                        active={String(bin.id) === selectedBinId}
                        highlighted={String(bin.id) === highlightedBinId}
                        compact
                        onClick={() => inspect(bin)}
                      />
                    ))}
                  </FloorZone>
                  <FloorZone
                    title="Pick face"
                    subtitle="Picking"
                    className="col-start-3 row-start-1"
                  >
                    {matchingBins(
                      bins.filter((bin: any) => bin.type === "picking"),
                    ).map((bin: any) => (
                      <BinTile
                        key={bin.id}
                        bin={bin}
                        active={String(bin.id) === selectedBinId}
                        highlighted={String(bin.id) === highlightedBinId}
                        compact
                        onClick={() => inspect(bin)}
                      />
                    ))}
                  </FloorZone>
                  <div className="relative col-start-2 row-span-2 row-start-1 overflow-hidden border border-emerald-700/35 bg-emerald-900/[0.035] p-3 dark:bg-emerald-400/[0.035]">
                    <div className="absolute inset-y-0 left-[33.333%] border-l border-dashed border-slate-400/70" />
                    <div className="absolute inset-y-0 left-[66.666%] border-l border-dashed border-slate-400/70" />
                    <div className="relative flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
                      <span>Storage racks</span>
                      <span>{storageBins.length} bin</span>
                    </div>
                    <div className="relative mt-3 grid grid-cols-3 gap-x-5 gap-y-4 px-2">
                      {matchingBins(storageBins).map((bin: any) => (
                        <BinTile
                          key={bin.id}
                          bin={bin}
                          active={String(bin.id) === selectedBinId}
                          highlighted={String(bin.id) === highlightedBinId}
                          compact
                          onClick={() => inspect(bin)}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-x-3 bottom-2 flex justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      <span>Aisle A</span>
                      <span>Aisle B</span>
                      <span>Aisle C</span>
                    </div>
                  </div>
                </div>
                {bins.length === 0 && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--ui-text-muted)]">
                    Belum ada bin untuk gudang ini.
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium text-[var(--ui-text-muted)]">
                <span>
                  <i className="mr-1 inline-block h-2 w-2 bg-amber-500" />
                  Inbound
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 bg-emerald-500" />
                  Storage
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 bg-blue-500" />
                  Picking
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 bg-violet-500" />
                  Packing
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 bg-rose-500" />
                  Quarantine
                </span>
                <span className="ml-auto">
                  Garis putus-putus = rute{" "}
                  {operation === "putaway" ? "put away" : operation}
                </span>
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
              <div className="flex items-center gap-2">
                <PackageSearch
                  size={16}
                  className="text-[var(--ui-text-brand)]"
                />
                <h3 className="font-bold text-[var(--ui-text-primary)]">
                  Cari barang
                </h3>
              </div>
              <select
                value={selectedSku}
                onChange={(event) => {
                  setSelectedSku(event.target.value);
                  const row = warehouseStock.find(
                    (stock) => stock.sku === event.target.value,
                  );
                  if (row)
                    setSelectedBinId(
                      String(
                        row.bin_id ||
                          bins.find((bin: any) => bin.code === row.bin_location)
                            ?.id ||
                          "",
                      ),
                    );
                }}
                className="mt-3 w-full border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)]"
              >
                <option value="">Pilih SKU untuk menemukan lokasi</option>
                {skus.map((row: any) => (
                  <option key={row.sku} value={row.sku}>
                    {row.sku} · {row.item_name}
                  </option>
                ))}
              </select>
              {selectedStock && (
                <div className="mt-3 border-l-2 border-[var(--ui-text-brand)] bg-[var(--ui-text-brand)]/5 px-3 py-2 text-xs">
                  <p className="font-semibold text-[var(--ui-text-primary)]">
                    {selectedStock.item_name}
                  </p>
                  <p className="mt-1 text-[var(--ui-text-muted)]">
                    {selectedStock.sku} · {number(selectedStock.on_hand)}{" "}
                    tersedia di{" "}
                    {selectedStock.bin_location || "bin belum ditentukan"}
                  </p>
                </div>
              )}
            </div>
            <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
              <h3 className="font-bold text-[var(--ui-text-primary)]">
                Rute {operation === "putaway" ? "put away" : operation}
              </h3>
              <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                Rute yang disorot mengikuti lokasi barang atau bin yang dipilih.
              </p>
              <div className="mt-4 space-y-0">
                {route.length ? (
                  route.map((bin: any, index: number) => (
                    <div key={bin.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-7 w-7 items-center justify-center border text-xs font-bold ${tone[bin.type] || tone.storage}`}
                        >
                          {index + 1}
                        </span>
                        {index < route.length - 1 && (
                          <span className="h-6 border-l border-dashed border-[var(--ui-text-brand)]/70" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-mono text-xs font-bold text-[var(--ui-text-primary)]">
                          {bin.code}
                        </p>
                        <p className="text-[11px] text-[var(--ui-text-muted)]">
                          {label[bin.type] || bin.type}{" "}
                          {bin.name ? `· ${bin.name}` : ""}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--ui-text-muted)]">
                    Tambahkan bin receiving dan storage untuk menampilkan rute.
                  </p>
                )}
              </div>
              {route.length > 1 && (
                <p className="flex items-center gap-1 border-t border-[var(--ui-border)] pt-3 text-xs text-[var(--ui-text-muted)]">
                  Ikuti urutan blok 1 <ArrowRight size={13} /> {route.length}
                </p>
              )}
            </div>
            <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--ui-text-primary)]">
                  {selectedBin ? selectedBin.code : "Pilih bin"}
                </h3>
                {selectedBin && (
                  <button
                    onClick={() => {
                      setSelectedBinId("");
                      setBinItems([]);
                    }}
                    className="text-[var(--ui-text-muted)]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              {inspecting ? (
                <div className="flex items-center gap-2 py-6 text-sm text-[var(--ui-text-muted)]">
                  <Loader2 size={16} className="animate-spin" />
                  Memuat isi bin…
                </div>
              ) : selectedBin ? (
                <div className="mt-3">
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    {selectedBin.name ||
                      label[selectedBin.type] ||
                      selectedBin.type}{" "}
                    · {number(selectedBin.total_units)} unit
                  </p>
                  {["storage", "picking", "packing", "staging"].includes(
                    selectedBin.type,
                  ) && (
                    <div className="mt-3 border-y border-[var(--ui-border)] py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
                        Operasi dari denah
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenOperation?.("putaway", {
                            warehouse,
                            bin: selectedBin,
                          })
                        }
                        className="mt-2 w-full border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-2.5 py-2 text-xs font-semibold text-[var(--ui-text-primary)] transition-colors hover:border-[var(--ui-text-brand)]"
                      >
                        Put away ke bin ini
                      </button>
                    </div>
                  )}
                  <div className="divide-y divide-[var(--ui-border)]">
                    {binItems.length ? (
                      binItems.map((item: any) => (
                        <div key={item.id} className="py-2.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--ui-text-primary)]">
                                {item.item_name}
                              </p>
                              <p className="mt-0.5 font-mono text-[var(--ui-text-muted)]">
                                {item.sku} · {number(item.on_hand)}{" "}
                                {item.uom || "unit"}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenOperation?.("adjust", {
                                    warehouse,
                                    bin: selectedBin,
                                    item,
                                  })
                                }
                                className="border border-[var(--ui-border-input)] px-1.5 py-1 text-[10px] font-semibold text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
                              >
                                Sesuaikan
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenOperation?.("transfer", {
                                    warehouse,
                                    bin: selectedBin,
                                    item,
                                  })
                                }
                                className="border border-[var(--ui-border-input)] px-1.5 py-1 text-[10px] font-semibold text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"
                              >
                                Transfer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-xs text-[var(--ui-text-muted)]">
                        Bin kosong.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--ui-text-muted)]">
                  Pilih blok pada denah untuk memeriksa isi dan kapasitas bin.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
