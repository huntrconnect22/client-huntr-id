import { Button as HuntrButton } from "~/shared/ui/Button";
import { Select as HuntrSelect, Input as HuntrInput } from "~/shared/ui/Fields";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { importUniversalWarehouseStock } from "~/modules/shared/api/wms";

type Key = "sku" | "item_name" | "quantity" | "uom" | "bin_code" | "unit_cost" | "reorder_level";
type Parsed = { name: string; headers: string[]; rows: unknown[][] };
const fields: { key: Key; label: string; required?: boolean }[] = [
  { key: "sku", label: "SKU / kode item", required: true }, { key: "item_name", label: "Nama item" },
  { key: "quantity", label: "Stok fisik", required: true }, { key: "uom", label: "Satuan" },
  { key: "bin_code", label: "Bin / lokasi" }, { key: "unit_cost", label: "Harga modal" }, { key: "reorder_level", label: "Reorder point" },
];
const aliases: Record<Key, string[]> = {
  sku: ["sku", "item sku", "product sku", "item code", "product code", "inventory code", "kode barang", "kode produk", "barcode"],
  item_name: ["item name", "product name", "name", "item", "description", "nama barang", "nama produk"],
  quantity: ["quantity", "qty", "on hand", "stock", "stock on hand", "available stock", "physical quantity", "inventory quantity", "jumlah", "stok", "stok fisik", "kuantitas"],
  uom: ["uom", "unit", "unit of measure", "satuan"],
  bin_code: ["bin", "bin code", "bin location", "location", "rack", "rack code", "storage location", "lokasi", "kode bin", "rak"],
  unit_cost: ["unit cost", "cost", "average cost", "purchase price", "harga modal", "harga beli"],
  reorder_level: ["reorder level", "reorder point", "minimum stock", "min stock", "stok minimum"],
};
const normal = (value: unknown) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const number = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value ?? "").trim().replace(/\s/g, ""); if (!raw) return null;
  const comma = raw.lastIndexOf(","), dot = raw.lastIndexOf("."), decimal = comma > dot ? "," : ".";
  const result = Number(raw.replace(decimal === "," ? /\./g : /,/g, "").replace(decimal, "."));
  return Number.isFinite(result) ? result : null;
};
const autoMap = (headers: string[]) => fields.reduce((map, field) => {
  const match = headers.find((header) => aliases[field.key].includes(normal(header)));
  map[field.key] = match ?? ""; return map;
}, {} as Record<Key, string>);

function downloadTemplate() {
  const rows = [
    ["SKU", "Nama Barang", "Stok Fisik", "Satuan", "Kode Bin", "Harga Modal", "Reorder Point"],
    ["CONTOH-MERAH-M", "Kaos Katun Merah - M", 24, "pcs", "RAK-A-01", 75000, 8],
    ["CONTOH-BIRU-L", "Kaos Katun Biru - L", 12, "pcs", "RAK-A-02", 75000, 5],
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "huntr-wms-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function UniversalWarehouseImportModal({ companyId, warehouses, onClose, onDone }: { companyId: string; warehouses: any[]; onClose: () => void; onDone: () => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<Record<Key, string>>({} as Record<Key, string>);
  const [warehouseId, setWarehouseId] = useState(warehouses.find((item) => item.status === "active")?.id ?? "");
  const [mode, setMode] = useState<"sync" | "add">("sync");
  const [createBins, setCreateBins] = useState(true);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const prepared = useMemo(() => {
    if (!parsed) return { lines: [] as any[], errors: [] as string[] };
    const index = Object.fromEntries(parsed.headers.map((header, i) => [header, i]));
    const get = (row: unknown[], key: Key) => index[mapping[key]] === undefined ? "" : row[index[mapping[key]]];
    const errors: string[] = []; const lines = parsed.rows.flatMap((row, i) => {
      const rowNo = i + 2, sku = String(get(row, "sku") ?? "").trim(), quantity = number(get(row, "quantity"));
      if (!sku && row.every((cell) => String(cell ?? "").trim() === "")) return [];
      if (!sku) { errors.push(`Baris ${rowNo}: SKU kosong.`); return []; }
      if (quantity === null || quantity < 0) { errors.push(`Baris ${rowNo}: stok fisik tidak valid.`); return []; }
      const optional = (key: Key) => String(get(row, key) ?? "").trim() === "" ? null : number(get(row, key));
      const unitCost = optional("unit_cost"), reorder = optional("reorder_level");
      if ((unitCost !== null && unitCost < 0) || (reorder !== null && reorder < 0)) errors.push(`Baris ${rowNo}: nilai stok tidak valid.`);
      return [{ source_row: rowNo, sku, item_name: String(get(row, "item_name") ?? "").trim() || sku, quantity, uom: String(get(row, "uom") ?? "").trim() || "unit", bin_code: String(get(row, "bin_code") ?? "").trim() || null, unit_cost: unitCost, reorder_level: reorder }];
    });
    if (parsed.rows.length > 1000) errors.push("Maksimal 1.000 baris per import.");
    return { lines, errors };
  }, [mapping, parsed]);
  const read = async (file: File) => {
    setBusy(true); setError("");
    try {
      const XLSX = await import("xlsx"), book = XLSX.read(await file.arrayBuffer(), { type: "array", raw: false });
      const rows = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[book.SheetNames[0]], { header: 1, defval: "", raw: true });
      const headerRow = rows.findIndex((row) => Array.isArray(row) && row.filter((cell) => String(cell ?? "").trim()).length >= 2);
      if (headerRow < 0) throw new Error("Header kolom tidak ditemukan.");
      const headers = (rows[headerRow] as unknown[]).map((cell, i) => String(cell ?? "").trim() || `Kolom ${i + 1}`);
      setParsed({ name: file.name, headers, rows: rows.slice(headerRow + 1) as unknown[][] }); setMapping(autoMap(headers));
    } catch (e: any) { setParsed(null); setError(e?.message || "File tidak dapat dibaca. Gunakan CSV, XLS, atau XLSX."); } finally { setBusy(false); }
  };
  const submit = async () => {
    if (!warehouseId || !parsed || !mapping.sku || !mapping.quantity || prepared.errors.length || !prepared.lines.length) { setError("Pilih gudang, petakan SKU dan stok fisik, lalu perbaiki data yang tidak valid."); return; }
    setBusy(true); setError("");
    try { await importUniversalWarehouseStock(companyId, { warehouse_id: warehouseId, idempotency_key: crypto.randomUUID(), source_name: "Universal WMS export", file_name: parsed.name, mapping, mode, create_missing_bins: createBins, lines: prepared.lines }); await onDone(); onClose(); }
    catch (e: any) { setError(e?.message || "Import stok gagal diproses."); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"><section className="max-h-[94vh] w-full overflow-y-auto border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-2xl sm:max-w-4xl sm:rounded-xl">
    <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-5 py-4"><div className="flex gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ui-text-brand)]/10 text-[var(--ui-text-brand)]"><FileSpreadsheet size={18} /></span><div><h2 className="font-bold text-[var(--ui-text-primary)]">Import stok dari WMS lain</h2><p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">CSV, XLS, dan XLSX. Sistem mendeteksi header lalu Anda dapat mengubah pemetaannya.</p></div></div><div className="flex items-center gap-1"><HuntrButton type="button" onClick={downloadTemplate} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ui-border-input)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)]"><Download size={14} />Unduh template</HuntrButton><HuntrButton onClick={onClose} className="rounded-md p-1.5 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)]"><X size={18} /></HuntrButton></div></header>
    <div className="space-y-5 p-5">{error && <div className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-xs text-red-600 dark:text-red-300"><AlertTriangle size={15} className="shrink-0" />{error}</div>}<div className="grid gap-3 md:grid-cols-2"><label className="space-y-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]">Gudang tujuan<HuntrSelect value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="h-10 w-full rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-sm font-normal text-[var(--ui-text-primary)]"><option value="">Pilih gudang</option>{warehouses.filter((w) => w.status === "active").map((w) => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</HuntrSelect></label><div className="space-y-1.5 text-xs font-semibold text-[var(--ui-text-secondary)]">File export<HuntrInput ref={input} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && void read(e.target.files[0])} /><HuntrButton type="button" onClick={() => input.current?.click()} disabled={busy} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-sm font-semibold text-[var(--ui-text-primary)] hover:border-[var(--ui-text-brand)]">{busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}{parsed?.name || "Pilih file CSV / Excel"}</HuntrButton></div></div>
    {parsed && <><div className="rounded-lg border border-[var(--ui-border)] p-3"><p className="mb-3 text-xs text-[var(--ui-text-muted)]">{parsed.rows.length} baris ditemukan. Kolom bertanda * wajib.</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{fields.map((field) => <label key={field.key} className="space-y-1 text-[11px] font-semibold text-[var(--ui-text-secondary)]">{field.label}{field.required ? " *" : ""}<HuntrSelect value={mapping[field.key] || ""} onChange={(e) => setMapping((current) => ({ ...current, [field.key]: e.target.value }))} className="h-8 w-full rounded-md border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-2 text-xs font-normal text-[var(--ui-text-primary)]"><option value="">Tidak dipetakan</option>{parsed.headers.map((header) => <option key={header} value={header}>{header}</option>)}</HuntrSelect></label>)}</div></div><div className="grid gap-3 md:grid-cols-2"><fieldset className="rounded-lg border border-[var(--ui-border)] p-3"><legend className="px-1 text-xs font-semibold text-[var(--ui-text-primary)]">Metode import</legend><label className="mt-1 flex gap-2 text-xs text-[var(--ui-text-secondary)]"><HuntrInput type="radio" checked={mode === "sync"} onChange={() => setMode("sync")} /><span><b>Samakan stok fisik</b><br /><small>Untuk migrasi snapshot stok saat ini.</small></span></label><label className="mt-3 flex gap-2 text-xs text-[var(--ui-text-secondary)]"><HuntrInput type="radio" checked={mode === "add"} onChange={() => setMode("add")} /><span><b>Tambahkan ke stok saat ini</b><br /><small>Untuk saldo pembukaan tambahan.</small></span></label></fieldset><label className="flex rounded-lg border border-[var(--ui-border)] p-3 text-xs text-[var(--ui-text-secondary)]"><HuntrInput className="mt-0.5" type="checkbox" checked={createBins} onChange={(e) => setCreateBins(e.target.checked)} /><span className="ml-2"><b className="text-[var(--ui-text-primary)]">Buat bin yang belum ada</b><br /><small>Bin dari file akan dibuat sebagai lokasi storage aktif.</small></span></label></div><div className="overflow-x-auto rounded-lg border border-[var(--ui-border)]"><HuntrTable className="min-w-full text-left text-xs"><HuntrTableHead className="bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"><HuntrTableRow><HuntrTableHeaderCell className="px-3 py-2">SKU</HuntrTableHeaderCell><HuntrTableHeaderCell className="px-3 py-2">Item</HuntrTableHeaderCell><HuntrTableHeaderCell className="px-3 py-2 text-right">Stok</HuntrTableHeaderCell><HuntrTableHeaderCell className="px-3 py-2">Bin</HuntrTableHeaderCell></HuntrTableRow></HuntrTableHead><HuntrTableBody>{prepared.lines.slice(0, 8).map((line) => <HuntrTableRow key={line.source_row} className="border-t border-[var(--ui-border)] text-[var(--ui-text-secondary)]"><HuntrTableCell className="px-3 py-2 font-mono">{line.sku}</HuntrTableCell><HuntrTableCell className="px-3 py-2">{line.item_name}</HuntrTableCell><HuntrTableCell className="px-3 py-2 text-right">{line.quantity}</HuntrTableCell><HuntrTableCell className="px-3 py-2">{line.bin_code || "Storage default"}</HuntrTableCell></HuntrTableRow>)}</HuntrTableBody></HuntrTable></div>{prepared.errors.length > 0 && <p className="text-xs text-red-600 dark:text-red-300">{prepared.errors.slice(0, 3).join(" ")}{prepared.errors.length > 3 ? ` +${prepared.errors.length - 3} masalah lain.` : ""}</p>}</>}
    </div><footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-5 py-3"><p className="text-[11px] text-[var(--ui-text-muted)]">Perubahan dicatat sebagai transaksi import.</p><div className="flex gap-2"><HuntrButton onClick={onClose} className="rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-secondary)]">Batal</HuntrButton><HuntrButton onClick={() => void submit()} disabled={!parsed || busy || Boolean(prepared.errors.length)} className="inline-flex items-center gap-2 rounded-md bg-[var(--ui-text-brand)] px-3 py-2 text-xs font-semibold !text-white disabled:opacity-50">{busy && <Loader2 size={14} className="animate-spin" />}{busy ? "Mengimport…" : `Import ${prepared.lines.length || ""} baris`}</HuntrButton></div></footer>
  </section></div>;
}
