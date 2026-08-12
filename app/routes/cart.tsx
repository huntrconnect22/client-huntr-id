import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Layout from "../components/Layout";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Package,
  Tag,
  Ruler,
} from "lucide-react";
import {
  loadCart,
  removeCartItem,
  updateCartQty,
  clearCart,
  getCartItemCount,
  addItemToCart,
  type CartItem,
} from "../lib/cart";
import { getAssetUrl } from "../lib/assets";

export default function CartPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);

  const refreshCart = () => setCart(loadCart());

  const getCompanyPrefix = (comp?: any) => {
    const c = comp ?? activeCompany;
    if (!c) return "";
    const slug = c.slug || c.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return slug ? `/${slug}` : "";
  };

  useEffect(() => {
    // Resolve active company slug
    try {
      const stored = localStorage.getItem("active_company");
      if (stored) setActiveCompany(JSON.parse(stored));
    } catch {}

    // Auto-add item from landing page deep-link: /cart?add=<id>&name=&uom=&brand=&image=&category=
    const addId = searchParams.get("add");
    if (addId) {
      addItemToCart(
        {
          id: addId,
          name: searchParams.get("name") ?? "Product",
          uom: searchParams.get("uom") ?? undefined,
          category: searchParams.get("category") ?? undefined,
          image_url: searchParams.get("image") ?? undefined,
          estimated_price: 0,
        },
        1
      );
      setSearchParams({}, { replace: true });
    }

    refreshCart();
    const handler = () => refreshCart();
    window.addEventListener("huntr-cart-updated", handler);
    return () => window.removeEventListener("huntr-cart-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to slug URL if on legacy /cart path
  useEffect(() => {
    if (!activeCompany) return;
    const slug = getCompanyPrefix(activeCompany);
    if (slug && !window.location.pathname.startsWith(slug)) {
      navigate(`${slug}/cart`, { replace: true });
    }
  }, [activeCompany]);

  const handleUpdateQty = (id: string, delta: number) => {
    updateCartQty(id, delta);
    refreshCart();
  };

  const handleRemove = (id: string) => {
    removeCartItem(id);
    refreshCart();
  };

  const handleClear = () => {
    if (cart.length === 0) return;
    if (window.confirm("Remove all items from your cart?")) {
      clearCart();
      refreshCart();
    }
  };

  const totalItems = getCartItemCount(cart);
  const prefix = getCompanyPrefix();

  return (
    <Layout title="Cart" subtitle="Review items before submitting a Purchase Request.">
      <div className="w-full space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <ShoppingCart size={16} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ui-text-primary)] leading-none">Your Cart</h2>
              <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-all"
            >
              <Trash2 size={12} /> Clear All
            </button>
          )}
        </div>

        {/* Empty state */}
        {cart.length === 0 ? (
          <div className="border border-dashed border-[var(--ui-border)] rounded-xl p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Package size={40} className="text-[var(--ui-text-muted)] opacity-20" />
            <div>
              <p className="text-sm font-semibold text-[var(--ui-text-secondary)]">Your cart is empty</p>
              <p className="text-xs text-[var(--ui-text-muted)] mt-1">Browse the catalog and add items to get started.</p>
            </div>
            <Link
              to={`${prefix}/marketplace`}
              style={{ color: 'white' }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-semibold transition-all shadow-sm"
            >
              Browse Marketplace <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] overflow-hidden divide-y divide-[var(--ui-border)]">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {(item.image_url || item.image_path) ? (
                      <img
                        src={getAssetUrl(item.image_url || item.image_path || "")}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <Package size={20} className="text-[var(--ui-text-muted)] opacity-30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--ui-text-primary)] truncate">{item.name}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      {item.item_code && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ui-text-muted)]">
                          <Tag size={9} /> {item.item_code}
                        </span>
                      )}
                      {item.uom && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ui-text-muted)]">
                          <Ruler size={9} /> {item.uom}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Qty stepper */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="w-7 h-7 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-secondary)] hover:border-orange-400/50 transition-all"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold text-[var(--ui-text-primary)] min-w-[24px] text-center tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="w-7 h-7 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-secondary)] hover:border-orange-400/50 transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => handleRemove(item.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/8 flex-shrink-0 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary + CTA */}
            <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--ui-text-muted)] font-semibold">Total Items</span>
                <span className="font-bold text-[var(--ui-text-primary)]">{totalItems} unit{totalItems !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--ui-text-muted)] font-semibold">SKUs</span>
                <span className="font-bold text-[var(--ui-text-primary)]">{cart.length} product{cart.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="pt-1 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={() => navigate(`${prefix}/checkout`)}
                  style={{ color: 'white' }}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <CheckCircle2 size={15} /> Create Purchase Request
                </button>
                <Link
                  to={`${prefix}/marketplace`}
                  className="mt-2 w-full py-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] flex items-center justify-center gap-1.5 hover:border-orange-400/40 transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
