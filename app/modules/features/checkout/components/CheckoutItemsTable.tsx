import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React from "react";
import {
  Package,
  Briefcase,
  Coins,
  Plus,
  Trash2,
  Tag,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getAssetUrl } from "../../../lib/assets";
import type { CartItem, ProcurementMode, ProcurementType } from "../types";

interface CheckoutItemsTableProps {
  cart: CartItem[];
  cartTotal: number;
  procurementType: ProcurementType;
  procurementMode: ProcurementMode;
  onAddManualItem: () => void;
  onAddServiceLine: () => void;
  onUpdateManualItem: (id: string, field: string, value: string) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateEstimatedPrice: (id: string, price: number) => void;
  onRemoveItem?: (id: string) => void;
}

export function CheckoutItemsTable({
  cart,
  cartTotal,
  procurementType,
  procurementMode,
  onAddManualItem,
  onAddServiceLine,
  onUpdateManualItem,
  onUpdateQuantity,
  onUpdateEstimatedPrice,
  onRemoveItem,
}: CheckoutItemsTableProps) {
  return (
    <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]/60 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
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
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)] hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} className="text-orange-500" />
              <span>+ Input Item Manual</span>
            </HuntrButton>
          )}
          {procurementType !== "goods" && (
            <HuntrButton
              type="button"
              onClick={onAddServiceLine}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)] hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/5 transition-all shadow-xs cursor-pointer"
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
          <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3">
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
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} /> Tambah Item Manual
                </HuntrButton>
              )}
              {procurementType !== "goods" && (
                <HuntrButton
                  type="button"
                  onClick={onAddServiceLine}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Briefcase size={14} /> Tambah Lingkup Jasa
                </HuntrButton>
              )}
            </div>
          </div>
        ) : (
          cart.map((item, idx) => {
            const isService = item.line_type === "service";
            const subtotal = Number(item.estimated_price || 0) * (item.qty || 1);

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-[var(--ui-bg-input)]/40 transition-colors"
              >
                {/* Visual Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                  {isService ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-orange-500/10 text-orange-500">
                      <Briefcase size={18} />
                      <span className="text-[8px] font-extrabold uppercase mt-0.5">
                        JASA
                      </span>
                    </div>
                  ) : item.image_url || item.image_path ? (
                    <img
                      src={getAssetUrl(item.image_url || item.image_path)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.manual ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-amber-500/10 text-amber-500">
                      <Tag size={18} />
                      <span className="text-[8px] font-extrabold uppercase mt-0.5">
                        CUSTOM
                      </span>
                    </div>
                  ) : (
                    <Package
                      size={20}
                      className="text-[var(--ui-text-muted)] opacity-50"
                    />
                  )}
                </div>

                {/* Item Details Input / Display */}
                <div className="flex-1 min-w-0 w-full space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-muted)]">
                      #{idx + 1}
                    </span>
                    {item.manual ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-500">
                        Input Manual
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-500">
                        Katalog
                      </span>
                    )}
                  </div>

                  {item.manual ? (
                    <div className="space-y-2">
                      <HuntrInput
                        required
                        placeholder={
                          isService
                            ? "Nama Jasa / Pekerjaan (misal: Maintenance Server, Jasa Desain Arsitektur)..."
                            : "Nama Barang / Material Kustom (misal: Kursi Ergonomis Kantor)..."
                        }
                        value={item.name}
                        onChange={(event) =>
                          onUpdateManualItem(item.id, "name", event.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm font-semibold text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />

                      {isService && (
                        <HuntrTextarea
                          value={item.service_scope || ""}
                          onChange={(event) =>
                            onUpdateManualItem(
                              item.id,
                              "service_scope",
                              event.target.value,
                            )
                          }
                          placeholder="Rincian Ruang Lingkup Pekerjaan (Scope of Work / Deliverables)..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-secondary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[var(--ui-text-primary)] truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--ui-text-muted)]">
                        <span className="font-mono text-[11px]">
                          {item.item_code || "SKU: —"}
                        </span>
                        {item.brand && <span>· Brand: {item.brand}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantitative controls */}
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--ui-border)]/50">
                  {/* Quantity */}
                  <div className="w-24 shrink-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                      {isService ? "Volume" : "Kuantitas"}
                    </span>
                    <HuntrInput
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        onUpdateQuantity(item.id, Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs font-semibold text-[var(--ui-text-primary)] text-center outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  {/* Unit Estimated Price */}
                  <div className="w-36 shrink-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                      {isService ? "Pagu Satuan" : "Harga Satuan"}
                    </span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--ui-text-muted)] pointer-events-none">
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
                        className="w-full pl-9 pr-2.5 py-1.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs font-bold text-[var(--ui-text-primary)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all tabular-nums text-right"
                      />
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="w-28 text-right shrink-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-1">
                      Subtotal
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-orange-500 tabular-nums block">
                      {subtotal > 0
                        ? `IDR ${subtotal.toLocaleString("id-ID")}`
                        : "—"}
                    </span>
                  </div>

                  {/* Remove Button */}
                  {onRemoveItem && (
                    <HuntrButton
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                      title="Hapus item ini"
                    >
                      <Trash2 size={15} />
                    </HuntrButton>
                  )}
                </div>
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
