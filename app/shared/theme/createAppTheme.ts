import { createTheme, type PaletteMode } from "@mui/material/styles";

/** The only source of palette, typography and component defaults in the app. */
export function createAppTheme(mode: PaletteMode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: "#c54e08", light: "#fb923c", dark: "#9a3904", contrastText: "#fff" },
      secondary: { main: dark ? "#a5b4fc" : "#4f46e5" },
      background: { default: dark ? "#10141c" : "#f5f7fa", paper: dark ? "#191f2b" : "#fff" },
      text: { primary: dark ? "#f1f5f9" : "#172234", secondary: dark ? "#a7b3c5" : "#526176" },
      divider: dark ? "#303b4c" : "#dce2ea",
      success: { main: dark ? "#4ade80" : "#187b45" },
      warning: { main: dark ? "#fbbf24" : "#986600" },
      error: { main: dark ? "#f87171" : "#c62828" },
      info: { main: dark ? "#60a5fa" : "#1565c0" },
    },
    shape: { borderRadius: 6 },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontSize: 14,
      h1: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.25 },
      h2: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 },
      h3: { fontSize: "1.25rem", fontWeight: 600 },
      h4: { fontSize: "1.125rem", fontWeight: 600 },
      h5: { fontSize: "1rem", fontWeight: 600 },
      h6: { fontSize: "0.9375rem", fontWeight: 600 },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      button: { textTransform: "none", fontSize: "0.875rem", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true, variant: "outlined" },
        styleOverrides: { root: { minHeight: 40, gap: 8, borderRadius: 6, boxShadow: "none" } },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 6 } } },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: "none", minWidth: 0 }, outlined: { borderColor: dark ? "#303b4c" : "#dce2ea" } },
      },
      MuiCard: { defaultProps: { variant: "outlined" } },
      MuiTextField: { defaultProps: { variant: "outlined", size: "small", fullWidth: true } },
      MuiOutlinedInput: { styleOverrides: { root: { minHeight: 44 } } },
      MuiDialog: { defaultProps: { fullWidth: true }, styleOverrides: { paper: { borderRadius: 8 } } },
      MuiDialogTitle: { styleOverrides: { root: { padding: "20px 24px", fontSize: "1.125rem", fontWeight: 600 } } },
      MuiDialogContent: { styleOverrides: { root: { padding: 24 } } },
      MuiDialogActions: { styleOverrides: { root: { padding: "16px 24px", gap: 8 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: "14px 16px", fontSize: "0.875rem" },
          head: { fontWeight: 600, backgroundColor: dark ? "#222b39" : "#eef2f6", whiteSpace: "nowrap" },
        },
      },
      MuiTableRow: { styleOverrides: { root: { "&:last-child td": { borderBottom: 0 } } } },
      MuiTab: { styleOverrides: { root: { minHeight: 48, textTransform: "none", fontWeight: 600 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 4, fontWeight: 500 } } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 6 } } },
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundImage: "none" },
          "button, input, select, textarea": { fontFamily: "inherit" },
          "button:focus-visible, a:focus-visible": { outline: "2px solid #fb923c", outlineOffset: 3 },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": { scrollBehavior: "auto !important", animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" },
          },
        },
      },
    },
  });
}
