import React from "react";
import { Package, Briefcase, Coins } from "lucide-react";
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
}: CheckoutItemsTableProps) {
  return (
    <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] overflow-hidden">
      <div className="p-3.5 px-4 border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
            {procurementType === "services" ? (
              <Briefcase size={16} />
            ) : (
              <Package size={16} />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)]">
              {procurementType === "services"
                ? "Daftar Lingkup Jasa & Budget"
                : procurementType === "mixed"
                ? "Item Barang & Jasa"
                : "Item Summary"}
            </h3>
            <p className="text-[10px] text-[var(--ui-text-muted)]">
              {cart.length}{" "}
              {procurementType === "services"
                ? "layanan / scope pekerjaan"
                : "item(s)"}{" "}
              dalam request ini
            </p>
          </div>
        </div>
        {cartTotal > 0 && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[var(--ui-text-muted)] block">
              {procurementType === "services"
                ? "Total Pagu Budget"
                : "Est. Total"}
            </span>
            <span className="text-xs sm:text-sm font-bold text-orange-500">
              IDR {cartTotal.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {procurementMode === "direct" && procurementType !== "services" && (
            <button
              type="button"
              onClick={onAddManualItem}
              className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-500/50 cursor-pointer"
            >
              + Add manual item
            </button>
          )}
          {procurementType !== "goods" && (
            <button
              type="button"
              onClick={onAddServiceLine}
              className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-500/50 flex items-center gap-1.5 cursor-pointer"
            >
              <Briefcase size={12} className="text-orange-500" />
              + Tambah Jasa / Scope
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--ui-border)]">
        {cart.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--ui-text-muted)]">
            {procurementType === "services" ? (
              <div>
                <Briefcase
                  size={28}
                  className="mx-auto text-orange-500/50 mb-2"
                />
                <p className="font-semibold text-[var(--ui-text-primary)]">
                  Belum ada item jasa
                </p>
                <p className="text-[11px] mt-1">
                  Tambahkan lingkup pekerjaan dan pagu budget yang dialokasikan.
                </p>
                <button
                  type="button"
                  onClick={onAddServiceLine}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  + Tambah Jasa / Scope Pertama
                </button>
              </div>
            ) : (
              "Belum ada item terpilih."
            )}
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="p-3.5 px-4 flex items-center gap-3 text-xs"
            >
              <div className="w-11 h-11 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] overflow-hidden shrink-0 flex items-center justify-center">
                {item.line_type === "service" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-orange-500/10 text-orange-500">
                    <Briefcase size={16} />
                    <span className="text-[8px] font-bold uppercase mt-0.5">
                      JASA
                    </span>
                  </div>
                ) : item.image_url || item.image_path ? (
                  <img
                    src={getAssetUrl(item.image_url || item.image_path)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package
                    size={18}
                    className="text-[var(--ui-text-muted)] opacity-40"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {item.manual ? (
                  <div>
                    <input
                      required
                      placeholder={
                        item.line_type === "service"
                          ? "Nama Jasa / Pekerjaan (misal: Jasa Desain Arsitektur, Maintenance Server)"
                          : "Item name"
                      }
                      value={item.name}
                      onChange={(event) =>
                        onUpdateManualItem(item.id, "name", event.target.value)
                      }
                      className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-xs text-[var(--ui-text-primary)] w-full rounded"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-semibold text-[var(--ui-text-primary)] truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[var(--ui-text-muted)] font-mono">
                      {item.item_code || "—"}
                    </p>
                  </>
                )}
                {item.manual && item.line_type === "service" && (
                  <textarea
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
                    className="mt-2 w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1.5 text-xs text-[var(--ui-text-primary)] rounded"
                  />
                )}
              </div>

              <label className="w-20 shrink-0">
                <span className="mb-0.5 block text-[9px] font-bold uppercase text-[var(--ui-text-muted)]">
                  {item.line_type === "service" ? "Volume" : "Qty"}
                </span>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) =>
                    onUpdateQuantity(item.id, Number(e.target.value))
                  }
                  className="w-full border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-xs text-[var(--ui-text-primary)] rounded outline-none focus:border-orange-400/60"
                />
              </label>

              <div className="w-32 shrink-0">
                <span className="text-[9px] font-bold uppercase text-[var(--ui-text-muted)] block mb-0.5 flex items-center justify-between">
                  <span>
                    {item.line_type === "service"
                      ? "Pagu Budget"
                      : "Est. Price"}
                  </span>
                  {item.line_type === "service" && (
                    <Coins size={10} className="text-orange-500" />
                  )}
                </span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--ui-text-muted)] pointer-events-none">
                    IDR
                  </span>
                  <input
                    type="number"
                    value={
                      item.estimated_price === 0 ? "" : item.estimated_price
                    }
                    placeholder="0"
                    onChange={(e) =>
                      onUpdateEstimatedPrice(
                        item.id,
                        Number(e.target.value),
                      )
                    }
                    className="w-full pl-7 pr-2 py-1 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-xs outline-none focus:border-orange-400/60"
                  />
                </div>
              </div>

              <div className="text-right min-w-[80px] shrink-0">
                <span className="text-[9px] block text-[var(--ui-text-muted)] uppercase font-semibold">
                  Subtotal
                </span>
                {item.estimated_price > 0 ? (
                  <span className="font-bold text-[var(--ui-text-primary)] tabular-nums">
                    IDR{" "}
                    {(
                      Number(item.estimated_price) * item.qty
                    ).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-[var(--ui-text-muted)]">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


