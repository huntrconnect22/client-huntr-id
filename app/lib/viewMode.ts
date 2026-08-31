const VENDOR_BUYER_MODE_KEY = "huntr_vendor_buyer_mode";
export const VENDOR_BUYER_MODE_EVENT = "huntr-vendor-buyer-mode-changed";

export function isVendorBuyerMode(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  return localStorage.getItem(VENDOR_BUYER_MODE_KEY) === "true";
}

export function setVendorBuyerMode(enabled: boolean): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  localStorage.setItem(VENDOR_BUYER_MODE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(
    new CustomEvent(VENDOR_BUYER_MODE_EVENT, { detail: { enabled } })
  );
}

export function toggleVendorBuyerMode(): boolean {
  const next = !isVendorBuyerMode();
  setVendorBuyerMode(next);
  return next;
}
