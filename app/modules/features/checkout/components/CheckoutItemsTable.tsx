import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React from "react";
import {
  Package,
  Plus,
  Trash2,
  Tag,
  Briefcase,
  Layers,
  Sparkles,
} from "lucide-react";
import { getAssetUrl } from "~/lib/assets";
import type { CartItem, ProcurementType, ProcurementMode } from "../types";

interface CheckoutItemsTableProps {
  cart: CartItem[];
  cartTotal: number;
  procurementType: ProcurementType;
  procurementMode?: ProcurementMode;
  onAddManualItem: () => void;
  onAddServiceLine: () => void;
  onUpdateManualItem: (
    id: string,
    field: string,
    value: string | number,
  ) => void;
  onRemoveItem?: (id: string) => void;
  onUpdateQuantity: (id: string, qty: number | "") => void;
  onUpdateEstimatedPrice: (id: string, price: number) => void;
}

export function CheckoutItemsTable({
  cart,
  cartTotal,
  procurementType,
  procurementMode = "direct",
  onAddManualItem,
  onAddServiceLine,
  onUpdateManualItem,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateEstimatedPrice,
}: CheckoutItemsTableProps) {
  return (
    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] overflow-hidden shadow-xs transition-colors">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            {procurementType === "services" ? (
              <Briefcase size={20} />
            ) : procurementType === "mixed" ? (
              <Layers size={20} />
            ) : (
              <Package size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text-primary)] tracking-tight">
                {procurementType === "services"
                  ? "Lingkup Pekerjaan & Anggaran Jasa"
                  : procurementType === "mixed"
                  ? "Daftar Item Barang & Jasa"
                  : "Daftar Item yang Diminta"}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {cart.length} {procurementType === "services" ? "layanan" : "item"}
              </span>
            </div>
            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
              Tentukan kuantitas dan estimasi pagu harga untuk proses evaluasi PR.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {procurementType !== "services" && (
            <HuntrButton
              type="button"
              onClick={onAddManualItem}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)] hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} className="text-orange-500" />
              <span>+ Input Item Manual</span>
            </HuntrButton>
          )}
          {procurementType !== "goods" && (
            <HuntrButton
              type="button"
              onClick={onAddServiceLine}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)] hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/5 transition-all shadow-xs cursor-pointer"
            >
              <Briefcase size={13} className="text-orange-500" />
              <span>+ Tambah Jasa / Scope</span>
            </HuntrButton>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="divide-y divide-[var(--ui-border)]">
        {cart.length === 0 ? (
          <div className="py-14 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-muted)]">
              {procurementType === "services" ? (
                <Briefcase size={26} className="text-orange-500/60" />
              ) : (
                <Package size={26} className="text-orange-500/60" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--ui-text-primary)]">
                Belum ada item yang ditambahkan
              </p>
              <p className="text-xs text-[var(--ui-text-muted)] mt-1 max-w-sm mx-auto">
                {procurementType === "services"
                  ? "Tambahkan lingkup pekerjaan jasa atau layanan yang dibutuhkan perusahaan Anda."
                  : "Anda bisa menambahkan item secara manual tanpa katalog, atau memilih langsung dari katalog."}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {procurementType !== "services" && (
                <HuntrButton
                  type="button"
                  onClick={onAddManualItem}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} /> Tambah Item Manual
                </HuntrButton>
              )}
              {procurementType !== "goods" && (
                <HuntrButton
                  type="button"
                  onClick={onAddServiceLine}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Briefcase size={14} /> Tambah Lingkup Jasa
                </HuntrButton>
              )}
            </div>
          </div>
        ) : (
          cart.map((item, idx) => {
            const isService = item.line_type === "service";
            const subtotal = Number(item.estimated_price || 0) * (Number(item.qty) || 0);

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 space-y-3.5 hover:bg-[var(--ui-bg-input)]/25 transition-colors"
              >
                {/* Row Header: Badges & Delete Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-muted)]">
                      #{idx + 1}
                    </span>
                    {item.manual ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center gap-1">
                        <Tag size={11} />
                        {isService ? "Jasa Kustom" : "Input Manual"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-500 flex items-center gap-1">
                        <Package size={11} />
                        Katalog ({item.item_code || "Katalog"})
                      </span>
                    )}
                    {!item.manual && item.brand && (
                      <span className="text-xs text-[var(--ui-text-muted)] hidden sm:inline">
                        · Brand: {item.brand}
                      </span>
                    )}
                  </div>

                  {onRemoveItem && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Hapus baris item ini"
                    >
                      <Trash2 size={13} />
                      <span className="text-[11px]">Hapus</span>
                    </button>
                  )}
                </div>

                {/* Symmetrical Grid: All columns share exact matching baseline & height */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Column 1: Item Name (with thumbnail) */}
                  <div className="sm:col-span-6 flex gap-2.5 items-end">
                    {/* Visual Thumbnail */}
                    <div className="w-10 h-10 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] overflow-hidden shrink-0 flex items-center justify-center shadow-xs mb-0.5">
                      {isService ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-orange-500/10 text-orange-500">
                          <Briefcase size={16} />
                        </div>
                      ) : item.image_url || item.image_path ? (
                        <img
                          src={getAssetUrl(item.image_url || item.image_path)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : item.manual ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-amber-500/10 text-amber-500">
                          <Tag size={16} />
                        </div>
                      ) : (
                        <Package
                          size={18}
                          className="text-[var(--ui-text-muted)] opacity-50"
                        />
                      )}
                    </div>

                    {/* Name Input / Display */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5 truncate">
                        {isService ? "Nama Jasa / Pekerjaan" : "Nama Barang / Material Kustom"} <span className="text-red-500">*</span>
                      </label>
                      {item.manual ? (
                        <HuntrInput
                          required
                          placeholder={
                            isService
                              ? "misal: Maintenance Server, Jasa Desain Arsitektur..."
                              : "misal: Kursi Ergonomis Kantor, Laptop Core i7..."
                          }
                          value={item.name}
                          onChange={(event) =>
                            onUpdateManualItem(item.id, "name", event.target.value)
                          }
                          className="w-full h-10 px-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs font-semibold text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        />
                      ) : (
                        <div className="h-10 px-3 rounded-xl bg-[var(--ui-bg-input)]/60 border border-[var(--ui-border)] flex items-center text-xs font-bold text-[var(--ui-text-primary)] truncate">
                          {item.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5 truncate">
                      {isService ? "Volume" : "Kuantitas"}
                    </label>
                    <HuntrInput
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.qty === 0 || item.qty === "" ? "" : item.qty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          onUpdateQuantity(item.id, "");
                          return;
                        }
                        const clean = raw.replace(/\D/g, "");
                        onUpdateQuantity(item.id, clean === "" ? "" : Number(clean));
                      }}
                      onBlur={() => {
                        if (item.qty === "" || Number(item.qty) <= 0) {
                          onUpdateQuantity(item.id, 1);
                        }
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs font-bold text-[var(--ui-text-primary)] text-center outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  {/* Column 3: Unit Price */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5 truncate">
                      {isService ? "Pagu Satuan" : "Harga Satuan"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--ui-text-muted)] pointer-events-none">
                        IDR
                      </span>
                      <HuntrInput
                        type="number"
                        value={item.estimated_price === 0 ? "" : item.estimated_price}
                        placeholder="0"
                        onChange={(e) =>
                          onUpdateEstimatedPrice(
                            item.id,
                            Math.max(0, Number(e.target.value)),
                          )
                        }
                        className="w-full h-10 pl-10 pr-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs font-bold text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all tabular-nums text-right"
                      />
                    </div>
                  </div>

                  {/* Column 4: Subtotal */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1.5 text-right truncate">
                      Subtotal
                    </label>
                    <div className="h-10 px-3 rounded-xl bg-[var(--ui-bg-input)]/40 border border-[var(--ui-border)] flex items-center justify-end text-xs font-black text-orange-500 tabular-nums">
                      {subtotal > 0
                        ? `IDR ${subtotal.toLocaleString("id-ID")}`
                        : "IDR 0"}
                    </div>
                  </div>
                </div>

                {/* Optional Service Scope Input for Custom Service Items */}
                {item.manual && isService && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                      Rincian Ruang Lingkup Pekerjaan (Scope of Work / Deliverables)
                    </label>
                    <HuntrTextarea
                      value={item.service_scope || ""}
                      onChange={(event) =>
                        onUpdateManualItem(
                          item.id,
                          "service_scope",
                          event.target.value,
                        )
                      }
                      placeholder="Rincian ruang lingkup pekerjaan, SLA, atau kriteria teknis yang diminta..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-secondary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Total bar if items exist */}
      {cart.length > 0 && (
        <div className="p-3.5 px-5 bg-[var(--ui-bg-input)]/40 border-t border-[var(--ui-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--ui-text-muted)] font-medium">
            Total {cart.length} item pengadaan
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              {procurementType === "services" ? "Total Pagu Budget:" : "Estimasi Total:"}
            </span>
            <span className="text-sm font-black text-orange-500 tabular-nums">
              IDR {cartTotal.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
