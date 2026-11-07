import { Truck, ArrowRight, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { WmsWorkflowGuide } from "../components/WmsOverview";
import { PickerBrowseButton } from "../features/WmsPickerFields";

interface Props {
  cardClass: string;
  inputClass: string;
  transferForm: {
    from_warehouse_id: string;
    to_warehouse_id: string;
    sku: string;
    from_bin: string;
    to_bin: string;
    quantity: string;
  };
  setTransferForm: React.Dispatch<React.SetStateAction<any>>;
  selections: Record<string, any>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  openPicker: (kind: any) => void;
  company: any;
  run: (fn: () => Promise<any>) => void;
  busy: boolean;
  transferStock: (companyId: string, form: any) => Promise<any>;
}

export function WmsTransfersTab({
  cardClass,
  inputClass,
  transferForm,
  setTransferForm,
  selections,
  setSelections,
  openPicker,
  company,
  run,
  busy,
  transferStock,
}: Props) {
  return (
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
          <div className={cardClass + " space-y-3"}>
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
                className={inputClass}
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
          <div className={cardClass + " space-y-3"}>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ui-text-brand)] px-4 py-3 text-sm font-bold !text-white transition-opacity hover:opacity-90 shadow-md disabled:opacity-50 cursor-pointer border-0"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
          Eksekusi Transfer Stok
        </button>
      </form>
    </div>
  );
}
