import React from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import {
  ShoppingCart, Plus, Minus, Package,
  CheckCircle2, ArrowRight, Tag, Ruler, X, Sparkles, Trash2,
} from "lucide-react";
import { getAssetUrl } from "../lib/assets";
import {
  type CartItem,
  updateCartQty,
  removeCartItem,
  clearCart,
  getCartItemCount,
} from "../lib/cart";

interface CartSidebarProps {
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  companyPrefix: string;
  onClose?: () => void;
  /** Use relative layout inside mobile bottom sheet */
  embedded?: boolean;
}

export default function CartSidebar({
  cart,
  onCartChange,
  companyPrefix,
  onClose,
  embedded = false,
}: CartSidebarProps) {
  const navigate   = useNavigate();
  const totalItems = getCartItemCount(cart);
  const skuCount   = cart.length;

  const handleQty = (id: string, delta: number) => {
    onCartChange(updateCartQty(id, delta));
  };

  const handleRemove = async (item: CartItem) => {
    const result = await Swal.fire({
      title: "Remove item?",
      text: item.name,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "var(--ui-bg-input)",
    });
    if (result.isConfirmed) onCartChange(removeCartItem(item.id));
  };

  const handleClear = async () => {
    if (cart.length === 0) return;
    const result = await Swal.fire({
      title: "Clear cart?",
      text: `Remove all ${skuCount} item${skuCount !== 1 ? "s" : ""} from cart?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Clear all",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) { clearCart(); onCartChange([]); }
  };

  const handleCheckout = () => navigate(`${companyPrefix}/checkout`);

  const mobile = embedded;

  return (
    /* Fixed panel attached to right edge — no border-radius on right side, flush with viewport */
    <aside
      className={`flex flex-col bg-[var(--ui-bg-card)] border-[var(--ui-border)] huntr-cart-sidebar${mobile ? " huntr-cart-sidebar--mobile" : ""}`}
      style={{
        position: embedded ? "relative" : "fixed",
        top: embedded ? undefined : "var(--huntr-header-height, 64px)",
        right: embedded ? undefined : 0,
        width: embedded ? "100%" : 288,
        height: embedded ? "auto" : "calc(100dvh - var(--huntr-header-height, 64px))",
        maxHeight: embedded ? "calc(90dvh - 28px)" : undefined,
        borderRadius: embedded ? 0 : "8px 0 0 8px",
        borderLeftWidth: embedded ? 0 : 1,
        borderTopWidth: embedded ? 0 : 1,
        borderBottomWidth: embedded ? 0 : 1,
        zIndex: embedded ? undefined : 99,
        boxShadow: embedded ? "none" : "-4px 0 16px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-[var(--ui-border)] flex-shrink-0 ${mobile ? "px-4 py-4" : "px-4 py-3"}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <ShoppingCart size={mobile ? 18 : 14} className="text-orange-500 flex-shrink-0" />
          <span className={`font-bold text-[var(--ui-text-primary)] ${mobile ? "text-sm" : "text-xs"}`}>Cart</span>
          {totalItems > 0 && (
            <span className={`text-[var(--ui-text-muted)] truncate ${mobile ? "text-xs" : "text-[10px]"}`}>
              · {skuCount} SKU, {totalItems} unit
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear cart"
              className={`font-semibold text-red-400 hover:text-red-500 hover:bg-red-500/8 rounded-lg transition-all touch-manipulation ${
                mobile ? "min-h-11 px-4 text-sm" : "px-2 py-1 text-[10px]"
              }`}
            >
              Clear
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close cart"
              aria-label="Close cart"
              className={`flex items-center justify-center rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-all touch-manipulation ${
                mobile ? "w-11 h-11" : "w-6 h-6"
              }`}
            >
              <X size={mobile ? 20 : 13} />
            </button>
          )}
        </div>
      </div>

      {/* Empty */}
      {cart.length === 0 ? (
        <div className={`flex flex-col items-center justify-center gap-4 flex-1 text-center ${mobile ? "px-6 py-10" : "px-4"}`}>
          <Package size={mobile ? 40 : 28} className="text-[var(--ui-text-muted)] opacity-20" />
          <div>
            <p className={`font-semibold text-[var(--ui-text-secondary)] ${mobile ? "text-sm" : "text-xs"}`}>Cart is empty</p>
            <p className={`text-[var(--ui-text-muted)] mt-1 leading-relaxed ${mobile ? "text-sm" : "text-[11px]"}`}>
              Tap <strong>Add to Cart</strong> on any product.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Items */}
          <div className="overflow-y-auto flex-1 divide-y divide-[var(--ui-border)]">
            {cart.map((item) => (
              <div
                key={item.id}
                className={`group relative flex items-start transition-colors hover:bg-[var(--ui-bg-input)] ${
                  mobile ? "gap-3 px-4 py-4" : "gap-2.5 px-3 py-3"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  aria-label={`Remove ${item.name}`}
                  className={`absolute z-10 flex items-center justify-center rounded-xl text-[var(--ui-text-muted)] transition-all touch-manipulation active:scale-95 ${
                    mobile
                      ? "top-3 right-3 h-11 w-11 bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-red-400 active:bg-red-500/10"
                      : "top-2.5 right-2 h-6 w-6 rounded-md opacity-40 hover:bg-red-500/10 hover:text-red-500 hover:opacity-100 group-hover:opacity-70"
                  }`}
                >
                  <Trash2 size={mobile ? 18 : 12} strokeWidth={1.75} />
                </button>

                {/* Thumbnail */}
                <div className={`rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  mobile ? "w-14 h-14" : "w-10 h-10 rounded-lg"
                }`}>
                  {item.image_url || item.image_path ? (
                    <img
                      src={getAssetUrl((item.image_url || item.image_path) as string)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <Package size={mobile ? 20 : 14} className="text-[var(--ui-text-muted)] opacity-30" />
                  )}
                </div>

                {/* Info */}
                <div className={`flex-1 min-w-0 ${mobile ? "pr-12" : "pr-5"}`}>
                  <p className={`font-semibold text-[var(--ui-text-primary)] line-clamp-2 leading-snug ${
                    mobile ? "text-sm" : "text-[11px]"
                  }`}>{item.name}</p>
                  <div className={`flex items-center gap-2 mt-1 ${mobile ? "flex-wrap" : ""}`}>
                    {item.item_code && (
                      <span className={`inline-flex items-center gap-1 text-[var(--ui-text-muted)] ${mobile ? "text-xs" : "text-[9px]"}`}>
                        <Tag size={mobile ? 10 : 7} /> {item.item_code}
                      </span>
                    )}
                    {item.uom && (
                      <span className={`inline-flex items-center gap-1 text-[var(--ui-text-muted)] ${mobile ? "text-xs" : "text-[9px]"}`}>
                        <Ruler size={mobile ? 10 : 7} /> {item.uom}
                      </span>
                    )}
                  </div>

                  {/* Qty */}
                  <div className={`flex items-center ${mobile ? "mt-3" : "mt-2"}`}>
                    <div className={`flex items-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-page)] overflow-hidden ${
                      mobile ? "shadow-sm" : "rounded-md"
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleQty(item.id, -1)}
                        className={`flex items-center justify-center text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-inset)] hover:text-orange-500 active:bg-[var(--ui-bg-inset)] transition-all touch-manipulation ${
                          mobile ? "w-11 h-11" : "w-6 h-6"
                        }`}
                      >
                        <Minus size={mobile ? 18 : 10} />
                      </button>
                      <span className={`text-center font-bold text-[var(--ui-text-primary)] tabular-nums border-x border-[var(--ui-border)] ${
                        mobile ? "min-w-[44px] py-2 text-base" : "min-w-[24px] py-0.5 text-xs"
                      }`}>
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQty(item.id, 1)}
                        className={`flex items-center justify-center text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-inset)] hover:text-orange-500 active:bg-[var(--ui-bg-inset)] transition-all touch-manipulation ${
                          mobile ? "w-11 h-11" : "w-6 h-6"
                        }`}
                      >
                        <Plus size={mobile ? 18 : 10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className={`border-t border-[var(--ui-border)] flex-shrink-0 space-y-3 ${
            mobile ? "px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]" : "px-3.5 py-3 space-y-2"
          }`}>
            <div className={`flex items-center justify-between ${mobile ? "text-sm" : "text-[11px]"}`}>
              <span className="text-[var(--ui-text-muted)]">Total Units</span>
              <span className="font-bold text-[var(--ui-text-primary)] tabular-nums">{totalItems}</span>
            </div>
            <div className={`flex items-center justify-between ${mobile ? "text-sm" : "text-[11px]"}`}>
              <span className="text-[var(--ui-text-muted)]">SKUs</span>
              <span className="font-bold text-[var(--ui-text-primary)] tabular-nums">{skuCount}</span>
            </div>
            <p className={`text-[var(--ui-text-muted)] leading-relaxed bg-[var(--ui-bg-inset)] border border-[var(--ui-border)] rounded-lg ${
              mobile ? "text-xs px-3 py-2.5" : "text-[10px] px-2 py-1.5"
            }`}>
              Prices will be quoted by vendors at checkout.
            </p>
            <button
              type="button"
              onClick={handleCheckout}
              style={{ color: "white" }}
              className={`w-full rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 font-bold flex items-center justify-center gap-2 transition-all touch-manipulation ${
                mobile ? "min-h-12 py-3.5 text-sm" : "py-2 rounded-md text-xs gap-1.5"
              }`}
            >
              <CheckCircle2 size={mobile ? 18 : 13} />
              Create Purchase Request
              <ArrowRight size={mobile ? 16 : 11} />
            </button>
            {cart.length >= 3 && (
              <div className={`flex items-start gap-2 text-purple-500 ${mobile ? "text-xs" : "text-[10px]"}`}>
                <Sparkles size={mobile ? 12 : 9} className="flex-shrink-0 mt-0.5" />
                <span>AI can generate your PR at checkout.</span>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
