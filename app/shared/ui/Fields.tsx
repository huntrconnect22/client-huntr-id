import { styled, alpha, type Theme } from "@mui/material/styles";

/** Native fields styled by MUI keep file uploads, refs, FormData and change events intact. */
const fieldStyles = ({ theme }: { theme: Theme }) => ({
  ...theme.typography.body2,
  boxSizing: "border-box" as const,
  minHeight: 44,
  maxWidth: "100%",
  padding: "10px 12px",
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(["border-color", "box-shadow", "background-color"], { duration: 150 }),
  "&:hover:not(:disabled)": { borderColor: theme.palette.text.secondary },
  "&:focus": { outline: 0, borderColor: theme.palette.primary.main, boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}` },
  "&:disabled": { color: theme.palette.text.disabled, backgroundColor: theme.palette.action.disabledBackground, cursor: "not-allowed" },
  "&::placeholder": { color: theme.palette.text.secondary, opacity: 0.8 },
  "&[aria-invalid='true']": { borderColor: theme.palette.error.main, boxShadow: `0 0 0 2px ${alpha(theme.palette.error.main, 0.2)}` },
  // Only icon/search wrappers opt out of the control's own chrome. Their
  // wrapper supplies the single visible border and focus treatment.
  "&[data-field-chrome='none']": {
    border: "0 !important",
    backgroundColor: "transparent",
    boxShadow: "none",
    "&:hover, &:focus": { borderColor: "transparent", backgroundColor: "transparent", boxShadow: "none" },
  },
});

export const Input = styled("input", { name: "HuntrInput" })(fieldStyles, ({ theme }) => ({
  "&[type='hidden']": { display: "none" },
  "&[type='checkbox'], &[type='radio']": {
    appearance: "auto", minHeight: 0, width: 18, height: 18, padding: 0,
    accentColor: theme.palette.primary.main, cursor: "pointer", flexShrink: 0,
  },
  "&[type='range']": { padding: 0, accentColor: theme.palette.primary.main },
  "&[type='color']": { padding: 4 },
  "&::file-selector-button": {
    border: 0, borderRadius: 4, padding: "6px 10px", marginRight: 12,
    backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText,
    fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
  },
}));

export const Select = styled("select", { name: "HuntrSelect" })(
  fieldStyles,
  ({ theme }) => {
    const chevronColor = encodeURIComponent(theme.palette.text.secondary);

    return {
      // Safari lays out the native select indicator differently from Chromium.
      // Remove the browser indicator and provide one predictable chevron for
      // every native select while preserving its native accessibility and menu.
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='m4 6 4 4 4-4' stroke='${chevronColor}' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      backgroundSize: "16px 16px",
      paddingRight: "42px !important",
      cursor: "pointer",
      "&::-ms-expand": { display: "none" },
    };
  },
);

export const Textarea = styled("textarea", { name: "HuntrTextarea" })(fieldStyles, {
  minHeight: 96, resize: "vertical",
});
