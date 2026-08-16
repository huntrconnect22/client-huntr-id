import React, { useEffect, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import CartSidebar from "./CartSidebar";
import {
  loadCart,
  saveCart,
  getCartItemCount,
  type CartItem,
} from "../lib/cart";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../hooks/useMediaQuery";

interface GlobalCartPanelProps {
  companyPrefix: string;
}

export default function GlobalCartPanel({ companyPrefix }: GlobalCartPanelProps) {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const prevCartLen = useRef(cart.length);
  const skipPersist = useRef(true);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setCart(Array.isArray(d) ? d : loadCart());
    };
    window.addEventListener("huntr-cart-updated", onUpdate);
    return () => window.removeEventListener("huntr-cart-updated", onUpdate);
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    saveCart(cart);
    if (cart.length > 0 && prevCartLen.current === 0) {
      setCartOpen(true);
    }
    prevCartLen.current = cart.length;
  }, [cart]);

  useEffect(() => {
    const onToggle = () => setCartOpen((p) => !p);
    const onOpen = () => setCartOpen(true);
    window.addEventListener("huntr-toggle-cart", onToggle);
    window.addEventListener("huntr-open-cart", onOpen);
    return () => {
      window.removeEventListener("huntr-toggle-cart", onToggle);
      window.removeEventListener("huntr-open-cart", onOpen);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("huntr-cart-panel-changed", { detail: { open: cartOpen } })
    );
  }, [cartOpen]);

  const cartCount = getCartItemCount(cart);

  return (
    <>
      {cartOpen && !isMobile && (
        <CartSidebar
          cart={cart}
          onCartChange={setCart}
          companyPrefix={companyPrefix}
          onClose={() => setCartOpen(false)}
        />
      )}

      {isMobile && (
        <div className="huntr-cart-fab md:hidden">
          <button
            type="button"
            onClick={() => setCartOpen((p) => !p)}
            aria-label={`View cart (${cartCount} items)`}
            className="huntr-cart-fab-btn relative flex items-center justify-center text-white touch-manipulation"
          >
            <ShoppingCart size={20} strokeWidth={2} />
            {cartCount > 0 && (
              <span className="huntr-cart-fab-badge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      )}

      {cartOpen && isMobile && (
        <div className="huntr-cart-mobile-sheet md:hidden">
          <div className="huntr-cart-mobile-panel">
            <div className="w-12 h-1.5 bg-[var(--ui-border)] rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
            <CartSidebar
              cart={cart}
              onCartChange={setCart}
              companyPrefix={companyPrefix}
              onClose={() => setCartOpen(false)}
              embedded
            />
          </div>
        </div>
      )}
    </>
  );
}
