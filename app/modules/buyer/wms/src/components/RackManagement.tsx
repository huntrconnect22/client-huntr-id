import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Search,
  Layers,
  Warehouse as WarehouseIcon,
  Edit3,
  Trash2,
  Boxes,
  X,
  Loader2,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import {
  createWarehouseBin,
  updateWarehouseBin,
  deleteWarehouseBin,
  getWarehouseBinStock,
} from "~/modules/shared/api/wms";

interface RackManagementProps {
  companyId: string;
  warehouses: any[];
  onRefresh: () => Promise<void> | void;
  onNavigateToPutAway?: (warehouseId: string, binId: string) => void;
  initialWarehouseId?: string;
}

const card = "";
const input = "";

export function RackManagement({
  companyId,
  warehouses,
  onRefresh,
  onNavigateToPutAway,
  initialWarehouseId,
}: RackManagementProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    initialWarehouseId || warehouses[0]?.id || "",
  );

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(String(warehouses[0].id));
    }
  }, [warehouses, selectedWarehouseId]);

  const activeWarehouse = useMemo(() => {
    return warehouses.find((w) => String(w.id) === String(selectedWarehouseId)) || warehouses[0];
  }, [warehouses, selectedWarehouseId]);

  const bins: any[] = useMemo(() => {
    return activeWarehouse?.bins || [];
  }, [activeWarehouse]);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredBins = useMemo(() => {
    return bins.filter((bin) => {
      const matchSearch =
        search === "" ||
        bin.code.toLowerCase().includes(search.toLowerCase()) ||
        (bin.name && bin.name.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === "all" || bin.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [bins, search, typeFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBins = bins.length;
    const occupiedBins = bins.filter((b) => Number(b.total_units || 0) > 0).length;
    const emptyBins = totalBins - occupiedBins;
    const totalUnits = bins.reduce(
      (sum, b) => sum + Number(b.total_units || 0),
      0,
    );
    const storageBins = bins.filter((b) => b.type === "storage").length;

    return { totalBins, occupiedBins, emptyBins, totalUnits, storageBins };
  }, [bins]);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<any | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  // Form State
  const [binForm, setBinForm] = useState({
    code: "",
    name: "",
    type: "storage",
    capacity_units: "",
    pick_priority: "100",
  });

  // Quick Code Generator Helper
  const [useGenerator, setUseGenerator] = useState(false);
  const [genAisle, setGenAisle] = useState("A");
  const [genRack, setGenRack] = useState("01");
  const [genTier, setGenTier] = useState("01");
  const [genBin, setGenBin] = useState("01");

  useEffect(() => {
    if (useGenerator && !editingBin) {
      const generatedCode = `RAK-${genAisle}-${genRack}-${genTier}-${genBin}`;
      setBinForm((prev) => ({
        ...prev,
        code: generatedCode,
        name: prev.name || `Lorong ${genAisle} · Rak ${genRack} · Tingkat ${genTier} · Kotak ${genBin}`,
      }));
    }
  }, [useGenerator, genAisle, genRack, genTier, genBin, editingBin]);

  const handleOpenAdd = () => {
    setEditingBin(null);
    setUseGenerator(false);
    setBinForm({
      code: "",
      name: "",
      type: "storage",
      capacity_units: "",
      pick_priority: "100",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bin: any) => {
    setEditingBin(bin);
    setUseGenerator(false);
    setBinForm({
      code: bin.code,
      name: bin.name || "",
      type: bin.type || "storage",
      capacity_units: bin.capacity_units ? String(bin.capacity_units) : "",
      pick_priority: String(bin.pick_priority || 100),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarehouse?.id) {
      Swal.fire({ icon: "warning", title: "Pilih Gudang terlebih dahulu" });
      return;
    }

    setFormBusy(true);
    try {
      if (editingBin) {
        await updateWarehouseBin(
          companyId,
          activeWarehouse.id,
          editingBin.id,
          {
            name: binForm.name,
            type: binForm.type,
            capacity_units: binForm.capacity_units ? Number(binForm.capacity_units) : null,
            pick_priority: Number(binForm.pick_priority || 100),
          },
        );
        Swal.fire({
          icon: "success",
          title: "Rak Berhasil Diperbarui",
          text: `Rak ${editingBin.code} telah disimpan.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createWarehouseBin(
          companyId,
          activeWarehouse.id,
          {
            code: binForm.code,
            name: binForm.name,
            type: binForm.type,
            capacity_units: binForm.capacity_units ? Number(binForm.capacity_units) : null,
            pick_priority: Number(binForm.pick_priority || 100),
          },
        );
        Swal.fire({
          icon: "success",
          title: "Rak Berhasil Dibuat",
          text: `Rak ${binForm.code} siap digunakan untuk penyimpanan.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan Rak",
        text: err.message || "Terjadi kesalahan saat menyimpan rak.",
      });
    } finally {
      setFormBusy(false);
    }
  };

  const handleDeleteBin = async (bin: any) => {
    if (bin.is_system) {
      Swal.fire({
        icon: "warning",
        title: "Lokasi Sistem",
        text: "Lokasi sistem bawaan (Receiving, Storage, Quarantine) tidak dapat dihapus.",
      });
      return;
    }

    if (Number(bin.total_units || 0) > 0) {
      Swal.fire({
        icon: "warning",
        title: "Rak Masih Berisi Barang",
        text: `Rak ${bin.code} masih memiliki ${bin.total_units} unit barang. Lakukan Put Away atau pemindahan stok terlebih dahulu sebelum menghapus.`,
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Hapus Rak?",
      text: `Apakah Anda yakin ingin menghapus rak ${bin.code} (${bin.name})?`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteWarehouseBin(companyId, activeWarehouse.id, bin.id);
      Swal.fire({
        icon: "success",
        title: "Rak Dihapus",
        timer: 1500,
        showConfirmButton: false,
      });
      await onRefresh();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus Rak",
        text: err.message || "Terjadi kesalahan saat menghapus rak.",
      });
    }
  };

  // Inspect Modal (Isi Barang di Rak)
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectingBin, setInspectingBin] = useState<any | null>(null);
  const [inspectItems, setInspectItems] = useState<any[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const handleInspectBin = async (bin: any) => {
    setInspectingBin(bin);
    setInspectModalOpen(true);
    setInspectLoading(true);
    try {
      const res = await getWarehouseBinStock(companyId, activeWarehouse.id, bin.id);
      setInspectItems(res.data?.items || []);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengambil Data Stok Rak",
        text: err.message || "Gagal memuat isi rak.",
      });
    } finally {
      setInspectLoading(false);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "receiving":
        return "border-amber-500/30 bg-amber-500/10 text-amber-500";
      case "quarantine":
        return "border-red-500/30 bg-red-500/10 text-red-500";
      case "picking":
        return "border-blue-500/30 bg-blue-500/10 text-blue-500";
      case "packing":
        return "border-purple-500/30 bg-purple-500/10 text-purple-500";
      case "staging":
        return "border-cyan-500/30 bg-cyan-500/10 text-cyan-500";
      case "storage":
      default:
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Warehouse Selector & Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--ui-text-primary)]">
            Manajemen Rak & Lokasi Penyimpanan (Bin Master)
          </h2>
          <p className="text-xs text-[var(--ui-text-muted)]">
            Petakan denah rak, lorong, dan kapasitas penyimpanan fisik agar posisi barang selalu terlacak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-1.5 text-xs">
            <WarehouseIcon size={14} className="text-[var(--ui-text-secondary)]" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              style={{ background: "transparent", fontWeight: 600, outline: "none", border: "none", fontSize: 14 }}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleOpenAdd}
            startIcon={<Plus size={14} />}
            sx={{ fontWeight: 600, textTransform: "none" }}
          >
            Tambah Rak Baru
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={card + " rounded-lg"}>
          <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
            <span>Total Rak / Lokasi</span>
            <Layers size={14} />
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ui-text-primary)]">
            {metrics.totalBins}
          </p>
          <span className="text-[11px] text-[var(--ui-text-muted)]">
            {metrics.storageBins} rak penyimpanan aktif
          </span>
        </div>

        <div className={card + " rounded-lg"}>
          <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
            <span>Rak Terisi</span>
            <Boxes size={14} className="text-emerald-500" />
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-500">
            {metrics.occupiedBins}
          </p>
          <span className="text-[11px] text-[var(--ui-text-muted)]">
            Menyimpan barang fisik
          </span>
        </div>

        <div className={card + " rounded-lg"}>
          <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
            <span>Rak Kosong</span>
            <Layers size={14} className="text-blue-500" />
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-blue-500">
            {metrics.emptyBins}
          </p>
          <span className="text-[11px] text-[var(--ui-text-muted)]">
            Siap untuk Put Away
          </span>
        </div>

        <div className={card + " rounded-lg"}>
          <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
            <span>Total Unit di Rak</span>
            <Boxes size={14} className="text-[var(--ui-text-brand)]" />
          </div>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ui-text-brand)]">
            {new Intl.NumberFormat("id-ID").format(metrics.totalUnits)}
          </p>
          <span className="text-[11px] text-[var(--ui-text-muted)]">
            Total unit on-hand
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={card + " rounded-lg p-3"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
              />
              <input
                style={{ width: "100%", paddingLeft: 32, paddingRight: 8, paddingTop: 6, paddingBottom: 6, fontSize: 12, borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none" }}
                placeholder="Cari kode rak (misal RAK-A-01) atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1">
              <SlidersHorizontal size={13} className="text-[var(--ui-text-muted)]" />
              <select
                style={{ fontSize: 12, paddingTop: 6, paddingBottom: 6, paddingLeft: 8, paddingRight: 8, borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none" }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Semua Tipe Lokasi</option>
                <option value="storage">Storage (Rak Penyimpanan)</option>
                <option value="picking">Picking (Area Pick)</option>
                <option value="receiving">Receiving (Staging Masuk)</option>
                <option value="quarantine">Quarantine (Karantina / Rusak)</option>
                <option value="staging">Staging</option>
                <option value="packing">Packing</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[var(--ui-text-muted)]">
            Menampilkan <strong className="text-[var(--ui-text-primary)]">{filteredBins.length}</strong> dari {bins.length} rak
          </div>
        </div>
      </div>

      {/* Table / List of Racks */}
      <div className={card + " overflow-hidden p-0 rounded-lg"}>
        <div className="overflow-x-auto">
          <TableContainer><Table size="small" sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell sx={{ px: 2, py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Kode &amp; Nama Rak</TableCell>
                <TableCell sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Tipe Lokasi</TableCell>
                <TableCell sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Kapasitas &amp; Utilisasi</TableCell>
                <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Jumlah SKU</TableCell>
                <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Total Unit</TableCell>
                <TableCell align="right" sx={{ px: 2, py: 1.5, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBins.map((bin) => {
                const totalUnits = Number(bin.total_units || 0);
                const capacity = bin.capacity_units ? Number(bin.capacity_units) : null;
                const occupancyPct = bin.occupancy_pct !== null && bin.occupancy_pct !== undefined
                  ? Number(bin.occupancy_pct)
                  : capacity && capacity > 0
                  ? Math.min(100, Math.round((totalUnits / capacity) * 100))
                  : null;

                const isFull = occupancyPct !== null && occupancyPct >= 100;
                const isHigh = occupancyPct !== null && occupancyPct >= 80;

                return (
                  <TableRow key={bin.id} hover>
                    <TableCell sx={{ px: 2, py: 1.5, verticalAlign: "middle" }}>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--ui-text-primary)]">
                          {bin.code}
                        </span>
                        {bin.is_system && (
                          <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-blue-500">
                            Sistem
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                        {bin.name || "Tanpa deskripsi"}
                      </p>
                    </TableCell>

                    <TableCell sx={{ py: 1.5, verticalAlign: "middle" }}>
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${getTypeBadgeClass(
                          bin.type,
                        )}`}
                      >
                        {bin.type}
                      </span>
                    </TableCell>

                    <TableCell sx={{ py: 1.5, verticalAlign: "middle" }}>
                      {capacity ? (
                        <div className="w-40 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold tabular-nums text-[var(--ui-text-primary)]">
                              {totalUnits} / {capacity}
                            </span>
                            <span
                              className={`font-semibold tabular-nums ${
                                isFull
                                  ? "text-red-500"
                                  : isHigh
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                              }`}
                            >
                              {occupancyPct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ui-border)]">
                            <div
                              className={`h-full transition-all ${
                                isFull
                                  ? "bg-red-500"
                                  : isHigh
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, occupancyPct || 0)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--ui-text-muted)]">
                          {totalUnits > 0
                            ? `${totalUnits} unit (Tanpa batas kapasitas)`
                            : "Tak terbatas"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.5, verticalAlign: "middle", fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                      {bin.sku_count || 0} SKU
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.5, verticalAlign: "middle", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                      {new Intl.NumberFormat("id-ID").format(totalUnits)}
                    </TableCell>

                    <TableCell align="right" sx={{ px: 2, py: 1.5, verticalAlign: "middle" }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleInspectBin(bin)}
                          startIcon={<Boxes size={12} />}
                          sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
                        >
                          Lihat Isi ({totalUnits})
                        </Button>

                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(bin)}
                          title="Edit Rak"
                        >
                          <Edit3 size={13} />
                        </IconButton>

                        {!bin.is_system && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBin(bin)}
                            title="Hapus Rak"
                            sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                          >
                            <Trash2 size={13} />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!filteredBins.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    <Layers size={28} className="mx-auto mb-2 text-[var(--ui-text-muted)] opacity-50" />
                    Belum ada rak yang sesuai dengan pencarian atau filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></TableContainer>
        </div>
      </div>

      {/* Modal Tambah / Edit Rak */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
              <div>
                <h3 className="font-bold text-[var(--ui-text-primary)]">
                  {editingBin ? `Edit Rak: ${editingBin.code}` : "Tambah Rak Baru"}
                </h3>
                <p className="text-xs text-[var(--ui-text-muted)]">
                  Gudang: {activeWarehouse?.name} ({activeWarehouse?.code})
                </p>
              </div>
              <IconButton size="small" onClick={() => setIsModalOpen(false)}><X size={18} /></IconButton>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {!editingBin && (
                <div className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                      Gunakan Format Standar Gudang (Aisle/Rack/Tier/Bin)
                    </span>
                    <Button
                      size="small"
                      onClick={() => setUseGenerator(!useGenerator)}
                      sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", p: 0, minWidth: 0 }}
                    >
                      {useGenerator ? "Mode Manual" : "Aktifkan Helper"}
                    </Button>
                  </div>

                  {useGenerator && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] text-[var(--ui-text-muted)]">Lorong</label>
                        <input style={{ width: "100%", padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc", background: "transparent", outline: "none" }} value={genAisle} onChange={(e) => setGenAisle(e.target.value.toUpperCase())} placeholder="A" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--ui-text-muted)]">Nomor Rak</label>
                        <input style={{ width: "100%", padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc", background: "transparent", outline: "none" }} value={genRack} onChange={(e) => setGenRack(e.target.value)} placeholder="01" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--ui-text-muted)]">Tingkat / Level</label>
                        <input style={{ width: "100%", padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc", background: "transparent", outline: "none" }} value={genTier} onChange={(e) => setGenTier(e.target.value)} placeholder="01" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--ui-text-muted)]">Kotak / Bin</label>
                        <input style={{ width: "100%", padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc", background: "transparent", outline: "none" }} value={genBin} onChange={(e) => setGenBin(e.target.value)} placeholder="01" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Kode Rak <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  disabled={Boolean(editingBin)}
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, fontFamily: "monospace", textTransform: "uppercase", borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none", opacity: editingBin ? 0.6 : 1 }}
                  placeholder="Contoh: RAK-A-01-01 atau BIN-05"
                  value={binForm.code}
                  onChange={(e) => setBinForm({ ...binForm, code: e.target.value.toUpperCase() })}
                />
                {editingBin && (
                  <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
                    Kode rak tidak dapat diubah setelah dibuat.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Nama / Keterangan Lokasi <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none" }}
                  placeholder="Contoh: Lorong A - Rak 1 Tingkat 1"
                  value={binForm.name}
                  onChange={(e) => setBinForm({ ...binForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                    Tipe Lokasi <span className="text-red-500">*</span>
                  </label>
                  <select
                    style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none" }}
                    value={binForm.type}
                    onChange={(e) => setBinForm({ ...binForm, type: e.target.value })}
                  >
                    <option value="storage">Storage (Penyimpanan Utama)</option>
                    <option value="picking">Picking (Area Pengambilan)</option>
                    <option value="receiving">Receiving (Staging Masuk)</option>
                    <option value="quarantine">Quarantine (Karantina / Rusak)</option>
                    <option value="staging">Staging</option>
                    <option value="packing">Packing</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                    Kapasitas Maksimal (Unit)
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none" }}
                    placeholder="Opsional (Kosong = Tak terbatas)"
                    value={binForm.capacity_units}
                    onChange={(e) => setBinForm({ ...binForm, capacity_units: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Prioritas Picking (0 - 1000)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  style={{ width: "100%", padding: "8px 12px", fontSize: 14, borderRadius: 6, border: "1px solid #ccc", background: "transparent", outline: "none" }}
                  placeholder="Default: 100 (Nilai lebih rendah diprioritaskan saat picking)"
                  value={binForm.pick_priority}
                  onChange={(e) => setBinForm({ ...binForm, pick_priority: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-[var(--ui-text-muted)]">
                  Digunakan untuk mengurutkan rute pengambilan barang saat order packing.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--ui-border)] pt-3">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsModalOpen(false)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={formBusy}
                  startIcon={formBusy ? <Loader2 size={13} className="animate-spin" /> : undefined}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {editingBin ? "Simpan Perubahan" : "Buat Rak"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Inspect Rak (Detail Barang di Rak) */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-0.5 font-mono text-sm font-bold text-[var(--ui-text-brand)]">
                    {inspectingBin?.code}
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${getTypeBadgeClass(
                      inspectingBin?.type || "",
                    )}`}
                  >
                    {inspectingBin?.type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
                  {inspectingBin?.name} · Gudang: {activeWarehouse?.name}
                </p>
              </div>
              <IconButton size="small" onClick={() => setInspectModalOpen(false)}><X size={18} /></IconButton>
            </div>

            {inspectLoading ? (
              <div className="py-12 text-center text-sm text-[var(--ui-text-muted)]">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-[var(--ui-text-brand)]" />
                Memuat data barang di rak...
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
                  <span>
                    Total SKU: <strong className="text-[var(--ui-text-primary)]">{inspectItems.length}</strong>
                  </span>
                  <span>
                    Total Unit:{" "}
                    <strong className="text-[var(--ui-text-primary)]">
                      {new Intl.NumberFormat("id-ID").format(
                        inspectItems.reduce(
                          (sum, item) => sum + Number(item.on_hand || 0),
                          0,
                        ),
                      )}
                    </strong>
                    {inspectingBin?.capacity_units
                      ? ` / ${inspectingBin.capacity_units} unit`
                      : ""}
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--ui-border)]">
                  <TableContainer><Table size="small">
                    <TableHead sx={{ position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 1 }}>
                      <TableRow>
                        <TableCell sx={{ px: 1.5, py: 1, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>SKU &amp; Nama Barang</TableCell>
                        <TableCell align="right" sx={{ py: 1, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>On Hand</TableCell>
                        <TableCell align="right" sx={{ py: 1, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Reserved</TableCell>
                        <TableCell align="right" sx={{ px: 1.5, py: 1, fontWeight: 600, fontSize: "0.625rem", textTransform: "uppercase" }}>Available</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspectItems.map((item) => {
                        const onHand = Number(item.on_hand || 0);
                        const allocated = Number(item.allocated || 0);
                        const available = onHand - allocated;

                        return (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ px: 1.5, py: 1, verticalAlign: "middle" }}>
                              <p className="font-semibold text-[var(--ui-text-primary)]">
                                {item.item_name}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                                <span className="font-mono text-[var(--ui-text-secondary)]">
                                  {item.sku}
                                </span>
                                {item.catalogue_category && (
                                  <>
                                    <span>·</span>
                                    <span className="text-[var(--ui-text-muted)]">
                                      {item.catalogue_category}
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1, verticalAlign: "middle", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                              {new Intl.NumberFormat("id-ID").format(onHand)} {item.uom}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1, verticalAlign: "middle", fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>
                              {new Intl.NumberFormat("id-ID").format(allocated)}
                            </TableCell>
                            <TableCell align="right" sx={{ px: 1.5, py: 1, verticalAlign: "middle", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#10b981" }}>
                              {new Intl.NumberFormat("id-ID").format(available)}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {!inspectItems.length && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                            <Boxes size={24} className="mx-auto mb-1.5 opacity-40" />
                            Rak ini kosong. Belum ada stok barang yang ditempatkan di sini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table></TableContainer>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--ui-text-muted)]">
                    <ShieldAlert size={13} />
                    Untuk memindahkan barang ke rak ini atau dari rak ini, gunakan menu Put Away.
                  </div>

                  {onNavigateToPutAway && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => {
                        setInspectModalOpen(false);
                        onNavigateToPutAway(activeWarehouse.id, inspectingBin.id);
                      }}
                      endIcon={<ArrowRight size={13} />}
                      sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      Buka Put Away
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
