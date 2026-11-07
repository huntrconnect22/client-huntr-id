import { Activity, Check } from "lucide-react";
import Swal from "sweetalert2";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import { PickerBrowseButton } from "../features/WmsPickerFields";

interface Props {
  cardClass: string;
  inputClass: string;
  adjustMode: "increase" | "decrease";
  setAdjustMode: (mode: "increase" | "decrease") => void;
  adjustForm: {
    warehouse_id: string;
    sku: string;
    bin_location: string;
    quantity: string | number;
    reason: string;
  };
  setAdjustForm: React.Dispatch<React.SetStateAction<any>>;
  selections: Record<string, any>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  openPicker: (kind: any) => void;
  company: any;
  run: (fn: () => Promise<any>) => void;
  busy: boolean;
  adjustStock: (companyId: string, form: any) => Promise<any>;
}

export function WmsAdjustmentsTab({
  cardClass,
  inputClass,
  adjustMode,
  setAdjustMode,
  adjustForm,
  setAdjustForm,
  selections,
  setSelections,
  openPicker,
  company,
  run,
  busy,
  adjustStock,
}: Props) {
  return (
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
      <div className={cardClass + " space-y-4"}>
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
              className={`rounded-md px-3 py-1 transition-all cursor-pointer border-0 ${
                adjustMode === "increase"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] bg-transparent"
              }`}
            >
              + Penambahan (Surplus)
            </button>
            <button
              type="button"
              onClick={() => setAdjustMode("decrease")}
              className={`rounded-md px-3 py-1 transition-all cursor-pointer border-0 ${
                adjustMode === "decrease"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] bg-transparent"
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
                className={inputClass}
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
              className={inputClass}
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
                  className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2.5 py-1 text-[11px] text-[var(--ui-text-secondary)] hover:border-[var(--ui-text-brand)] hover:text-[var(--ui-text-brand)] transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold !text-white transition-opacity hover:opacity-90 shadow-md cursor-pointer border-0 ${
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
  );
}
