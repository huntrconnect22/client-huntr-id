export const FEATURE_AGENTIC_PROCUREMENT_KEY = "huntr_feature_agentic_procurement";

/**
 * Check if the Agentic Procurement feature flag is enabled for the current user session.
 * Defaults to false (not automatically active).
 */
export function isAgenticProcurementEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const val = localStorage.getItem(FEATURE_AGENTIC_PROCUREMENT_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

/**
 * Enable or disable the Agentic Procurement feature flag.
 * Triggers a custom window event to notify other mounted components in real-time.
 */
export function setAgenticProcurementEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FEATURE_AGENTIC_PROCUREMENT_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent("huntr-feature-flags-updated", {
        detail: { agenticProcurement: enabled },
      })
    );
  } catch (e) {
    console.error("Failed to update feature flag:", e);
  }
}
