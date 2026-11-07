import { Building2, CheckCircle2, Boxes, MapPin, Warehouse as WarehouseIcon, Layers, Plus } from "lucide-react";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import { formatQuantity, toNumeric } from "../data/quantity";

interface Props {
  warehouses: any[];
  company: any;
  warehouseForm: {
    code: string;
    name: string;
    address: string;
    capacity_units: string;
  };
  setWarehouseForm: React.Dispatch<React.SetStateAction<{
    code: string;
    name: string;
    address: string;
    capacity_units: string;
  }>>;
  createWarehouse: (companyId: string, form: any) => Promise<any>;
  updateWarehouse: (companyId: string, id: string, data: any) => Promise<any>;
  run: (fn: () => Promise<any>) => void;
  onViewStock: (warehouseId: string) => void;
  onConfigureRacks: () => void;
  inputClass: string;
}

export function WmsWarehousesTab({
  warehouses,
  company,
  warehouseForm,
  setWarehouseForm,
  createWarehouse,
  updateWarehouse,
  run,
  onViewStock,
  onConfigureRacks,
  inputClass,
}: Props) {
  return (
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
                      onClick={() => onViewStock(String(w.id))}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)] shadow-sm hover:border-[var(--ui-text-brand)] hover:bg-[var(--ui-text-brand)]/5 transition-colors cursor-pointer"
                    >
                      <Boxes size={13} className="text-[var(--ui-text-brand)]" />
                      <span>Lihat Stok</span>
                    </button>
                    <button
                      type="button"
                      onClick={onConfigureRacks}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] shadow-sm hover:border-[var(--ui-border)]/90 hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
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
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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
                className={inputClass}
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
                className={inputClass}
                placeholder="Contoh: Gudang Distribusi Cakung"
                required
                value={warehouseForm.name}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Alamat Lengkap</label>
              <input
                className={inputClass}
                placeholder="Jalan, Kawasan Industri, Kota..."
                value={warehouseForm.address}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Target Kapasitas (unit)</label>
              <input
                className={inputClass}
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] py-2.5 text-xs font-bold !text-white shadow transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer border-0"
          >
            <Plus size={15} />
            Simpan Fasilitas Baru
          </button>
        </form>
      </div>
    </div>
  );
}
