import { alpha, type Theme } from "@mui/material/styles";

/** Existing module styles consume aliases, never a second independent palette. */
export function legacyTokens(theme: Theme) {
  const { palette: p } = theme;
  const dark = p.mode === "dark";
  const brand = dark ? p.primary.light : p.primary.main;
  const inset = dark ? "#222b39" : "#eef2f6";
  const muted = alpha(p.primary.main, dark ? 0.2 : 0.08);
  const border = alpha(brand, 0.3);
  return {
    colorScheme: p.mode,
    "--huntr-orange": p.primary.main, "--huntr-orange-light": p.primary.light,
    "--huntr-orange-dark": p.primary.dark, "--huntr-amber": p.warning.main,
    "--huntr-yellow": p.warning.main, "--huntr-yellow-light": p.warning.light,
    "--huntr-accent": brand, "--huntr-accent-muted": muted,
    "--huntr-green": p.success.main, "--huntr-green-dark": p.success.dark,
    "--huntr-gradient": p.primary.main, "--huntr-gradient-wide": p.primary.main,
    "--huntr-gradient-soft": p.primary.light, "--huntr-brand-rgb": "197, 78, 8", "--huntr-amber-rgb": "251, 191, 36",
    "--radius": "6px", "--radius-sm": "4px", "--radius-card": "8px",
    "--ui-primary": p.primary.main, "--ui-primary-hover": p.primary.dark,
    "--ui-primary-muted": muted, "--ui-primary-border": border, "--ui-primary-shadow": "transparent",
    "--ui-accent-indigo": p.secondary.main, "--ui-accent-indigo-text": p.secondary.main,
    "--ui-accent-indigo-muted": alpha(p.secondary.main, 0.1),
    "--ui-bg-page": p.background.default, "--ui-bg-page-grad": p.background.default,
    "--ui-bg-sidebar": p.background.paper, "--ui-bg-header": p.background.paper,
    "--ui-bg-card": p.background.paper, "--ui-bg-card-hover": inset, "--ui-bg-hover": inset,
    "--ui-bg-input": p.background.paper, "--ui-bg-input-focus": inset,
    "--ui-bg-badge": muted, "--ui-bg-notif": p.background.paper,
    "--ui-bg-overlay": alpha("#10141c", 0.6), "--ui-bg-switch-btn": inset,
    "--ui-bg-pending-card": inset, "--ui-bg-elevated": p.background.paper,
    "--ui-border": p.divider, "--ui-border-subtle": p.divider,
    "--ui-border-input": dark ? "#526176" : "#aeb9c7", "--ui-border-badge": border, "--ui-border-notif": p.divider,
    "--ui-text-primary": p.text.primary, "--ui-text-secondary": p.text.secondary, "--ui-text-muted": p.text.secondary,
    "--ui-text-brand": brand, "--ui-text-logo": p.text.primary,
    "--ui-text-nav-active": brand, "--ui-text-nav-idle": p.text.secondary,
    "--ui-scrollbar-track": p.background.default, "--ui-scrollbar-thumb": p.divider,
    "--ui-notif-badge-border": p.background.paper, "--ui-nav-active-bg": muted, "--ui-nav-active-border": border,
    "--ui-glass-bg": p.background.paper, "--ui-glass-bg-hover": inset,
    "--ui-glass-border": p.divider, "--ui-glass-border-hover": border,
    "--ui-glass-shadow": "none", "--ui-glass-shadow-hover": "none",
    "--ui-logout-bg": alpha(p.error.main, 0.08), "--ui-logout-border": alpha(p.error.main, 0.25), "--ui-logout-text": p.error.main,
    "--ui-switch-bg": muted, "--ui-switch-border": border, "--ui-switch-text": brand,
    "--ui-toggle-bg": p.background.paper, "--ui-toggle-border": p.divider, "--ui-toggle-text": p.text.secondary,
    "--ui-status-approved": p.success.main, "--ui-status-pending": p.warning.main,
    "--ui-status-rejected": p.error.main, "--ui-status-active": p.success.main, "--ui-status-selected": p.secondary.main,
    "--ui-skeleton-base": p.action.hover, "--ui-skeleton-highlight": p.action.selected,
    "--ui-gradient-active-card": muted, "--ui-shadow-orange": "none", "--ui-shadow-orange-hover": "none",
    "--ui-bg-error": alpha(p.error.main, 0.08), "--ui-border-error": alpha(p.error.main, 0.3), "--ui-text-error": p.error.main,
    "--ui-bg-success": alpha(p.success.main, 0.08), "--ui-border-success": alpha(p.success.main, 0.3), "--ui-text-success": p.success.main,
    "--ui-layout-padding": "24px", "--ui-gap-grid": "24px", "--ui-bg-inset": inset, "--ui-progress-track": p.divider,
    "--ui-chart-grid": p.divider, "--ui-chart-axis": p.text.secondary,
    "--ui-chart-tooltip-bg": p.background.paper, "--ui-chart-tooltip-border": p.divider,
    "--ui-chart-tooltip-text": p.text.primary, "--ui-chart-legend": p.text.secondary, "--ui-chart-pie-stroke": p.background.paper,
  };
}
