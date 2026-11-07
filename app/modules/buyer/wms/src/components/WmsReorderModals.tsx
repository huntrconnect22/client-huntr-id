import React from "react";
import {
  Check,
  Loader2,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { formatQuantity, toNumeric } from "../data/quantity";

interface Props {
  inputClass: string;
  reorderModalItem: any;
  setReorderModalItem: (item: any) => void;
  reorderForm: {
    quantity: string;
    vendor_name: string;
    expected_arrival: string;
    notes: string;
  };
  setReorderForm: React.Dispatch<React.SetStateAction<any>>;
  handleSubmitReorderPo: (e: React.FormEvent) => void;
  submittingReorder: boolean;
  reorderConfigItem: any;
  setReorderConfigItem: (item: any) => void;
  configMinStock: string;
  setConfigMinStock: (val: string) => void;
  configLeadTime: string;
  setConfigLeadTime: (val: string) => void;
  handleSaveReorderConfig: (e: React.FormEvent) => void;
  savingReorderConfig: boolean;
}

export function WmsReorderModals({
  inputClass,
  reorderModalItem,
  setReorderModalItem,
  reorderForm,
  setReorderForm,
  handleSubmitReorderPo,
  submittingReorder,
  reorderConfigItem,
  setReorderConfigItem,
  configMinStock,
  setConfigMinStock,
  configLeadTime,
  setConfigLeadTime,
  handleSaveReorderConfig,
  savingReorderConfig,
}: Props) {
  return (
    <>
      {reorderModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <ShoppingCart size={17} className="text-amber-600" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--ui-text-primary)]">
                    Buat Purchase Order (Reorder Point)
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--ui-text-muted)]">
                    Pemesanan ulang otomatis untuk stok yang menipis
                  </p>
                </div>
              </div>
              <button
                type="button"
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
                    className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
                  value={reorderForm.expected_arrival}
                  onChange={(e) =>
                    setReorderForm({
                      ...reorderForm,
                      expected_arrival: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                  Catatan Pemesanan (Opsional)
                </label>
                <textarea
                  className={inputClass + " h-20 resize-none"}
                  placeholder="Instruksi pengiriman, kontak purchasing, dll."
                  value={reorderForm.notes}
                  onChange={(e) =>
                    setReorderForm({ ...reorderForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[var(--ui-border)] pt-4">
                <button
                  type="button"
                  onClick={() => setReorderModalItem(null)}
                  className="rounded-lg border border-[var(--ui-border)] px-4 py-2 text-xs font-semibold text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)] transition-colors"
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--ui-text-brand)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {savingReorderConfig ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

