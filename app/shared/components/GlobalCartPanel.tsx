import React, { useEffect, useRef, useState } from "react";
import Fab from "@mui/material/Fab";
import Badge from "@mui/material/Badge";
import { ShoppingCart } from "lucide-react";
import CartSidebar from "./CartSidebar";
import {
  loadCart,
  saveCart,
  getCartItemCount,
  type CartItem,
} from "../lib/cart";

interface GlobalCartPanelProps {
  companyPrefix: string;
}

export default function GlobalCartPanel({ companyPrefix }: GlobalCartPanelProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const isMounted = useRef(false);
  const prevCartLen = useRef(0);

  useEffect(() => {
    const initialCart = loadCart();
    setCart(initialCart);
    prevCartLen.current = initialCart.length;
    isMounted.current = true;
  }, []);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setCart(Array.isArray(d) ? d : loadCart());
    };
    window.addEventListener("huntr-cart-updated", onUpdate);
    return () => window.removeEventListener("huntr-cart-updated", onUpdate);
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;
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
      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onCartChange={setCart}
        companyPrefix={companyPrefix}
      />

      {/* Floating mobile button */}
      {cartCount > 0 && !cartOpen && (
        <Fab
          aria-label={`View cart (${cartCount} items)`}
          onClick={() => setCartOpen(true)}
          sx={{
            display: { xs: "flex", md: "none" },
            position: "fixed",
            bottom: "calc(78px + env(safe-area-inset-bottom, 0px))",
            right: 16,
            zIndex: 1100,
            bgcolor: "#ef7d00",
            color: "#fff",
            "&:hover": { bgcolor: "#d66f00" },
            boxShadow: "0 4px 16px rgba(239, 125, 0, 0.4)",
          }}
        >
          <Badge badgeContent={cartCount > 99 ? "99+" : cartCount} color="error">
            <ShoppingCart size={22} />
          </Badge>
        </Fab>
      )}
    </>
  );
}
