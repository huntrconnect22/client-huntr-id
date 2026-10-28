export const CART_STORAGE_KEY = "huntr_cart";

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  estimated_price: number;
  item_code?: string;
  uom?: string;
  price?: number;
  image_url?: string;
  image_path?: string;
  category?: string;
  company_id?: string;
  [key: string]: unknown;
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("huntr-cart-updated", { detail: cart }));
}

export function addItemToCart(item: Record<string, unknown>, qty = 1): CartItem[] {
  const cart = loadCart();
  const existing = cart.find((i) => String(i.id) === String(item.id));
  const next = existing
    ? cart.map((i) =>
        String(i.id) === String(item.id) ? { ...i, qty: i.qty + qty } : i
      )
    : [...cart, { ...item, id: String(item.id), qty, estimated_price: 0 } as CartItem];
  saveCart(next);
  return next;
}

export function updateCartQty(id: string, delta: number): CartItem[] {
  const next = loadCart()
    .map((i) =>
      String(i.id) === String(id) ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    );
  saveCart(next);
  return next;
}

export function removeCartItem(id: string): CartItem[] {
  const next = loadCart().filter((i) => String(i.id) !== String(id));
  saveCart(next);
  return next;
}

export function clearCart() {
  saveCart([]);
}

export function getCartItemCount(cart: CartItem[] = loadCart()): number {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

export function getCartLineCount(cart: CartItem[] = loadCart()): number {
  return cart.length;
}

