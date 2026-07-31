import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Layout from "../components/Layout";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Package,
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

  const refreshCart = () => setCart(loadCart());

  useEffect(() => {
    // Auto-add item from landing page deep-link: /cart?add=<id>&name=&uom=&brand=&image=&category=
    const addId = searchParams.get("add");
    if (addId) {
      addItemToCart({
        id: addId,
        name: searchParams.get("name") ?? "Product",
        uom: searchParams.get("uom") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        image_url: searchParams.get("image") ?? undefined,
        estimated_price: 0,
      }, 1);
      // Clean up query params so refreshing doesn't re-add
      setSearchParams({}, { replace: true });
    }

    refreshCart();
    const handler = () => refreshCart();
    window.addEventListener("huntr-cart-updated", handler);
    return () => window.removeEventListener("huntr-cart-updated", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <Layout
      title="Shopping Cart"
      subtitle="Review items before creating a Purchase Request."
    >
      <div style={{ width: "100%" }}>


        <div
          style={{
            background: "var(--ui-bg-card)",
            borderRadius: 24,
            border: "1px solid var(--ui-border)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg,#f97316,#f59e0b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--ui-text-primary)" }}>
                Your Cart
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ui-text-muted)" }}>
                {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
              </p>
            </div>
          </div>

          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--ui-text-muted)" }}>
              <Package size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
              <p style={{ margin: "0 0 16px", fontSize: 15 }}>Your cart is empty.</p>
              <Link
                to="/marketplace"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#f97316,#f59e0b)",
                  color: "#fff",
                  fontWeight: 700,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: 16,
                      borderRadius: 16,
                      background: "var(--ui-bg-input)",
                      border: "1px solid var(--ui-border-subtle)",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      background: "var(--ui-bg-card)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {(item.image_url || item.image_path) ? (
                        <img
                          src={getAssetUrl(item.image_url || item.image_path || '')}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                          }}
                        />
                      ) : (
                        <Package size={24} color="var(--ui-text-muted)" strokeWidth={1.5} style={{ opacity: 0.4 }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                        {item.name}
                      </div>
                      {item.item_code && (
                        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 4 }}>
                          SKU: {item.item_code}
                          {item.uom ? ` · ${item.uom}` : ""}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        style={qtyBtnStyle}
                      >
                        <Minus size={14} />
                      </button>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "var(--ui-text-primary)",
                          minWidth: 28,
                          textAlign: "center",
                        }}
                      >
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        style={qtyBtnStyle}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => handleRemove(item.id)}
                        style={{
                          marginLeft: 4,
                          color: "#f87171",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 6,
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 14,
                  background: "linear-gradient(135deg,#f97316,#f59e0b)",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 15,
                  boxShadow: "0 8px 20px rgba(249,115,22,0.3)",
                }}
              >
                Create Purchase Request <CheckCircle2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "var(--ui-bg-card)",
  border: "1px solid var(--ui-border)",
  color: "var(--ui-text-secondary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
