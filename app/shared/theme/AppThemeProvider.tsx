import { useMemo, type ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./createAppTheme";
import { legacyTokens } from "./legacyTokens";

const themes = { light: createAppTheme("light"), dark: createAppTheme("dark") };
const tokenStyles = {
  ":root, [data-theme='dark']": legacyTokens(themes.dark),
  "[data-theme='light']": legacyTokens(themes.light),
  ".swal2-popup": { background: "var(--ui-bg-elevated)", color: "var(--ui-text-primary)", borderRadius: 8, border: "1px solid var(--ui-border)", fontFamily: themes.light.typography.fontFamily },
  ".swal2-title, .swal2-html-container": { color: "var(--ui-text-primary)" },
  ".swal2-styled.swal2-confirm": { background: "var(--ui-primary)", color: "#fff", borderRadius: 6, boxShadow: "none" },
  ".swal2-styled.swal2-cancel": { background: "var(--ui-bg-inset)", color: "var(--ui-text-primary)", borderRadius: 6 },
  "@media (max-width: 768px)": { ":root": { "--ui-layout-padding": "16px" } },
};

export function AppThemeProvider({ mode, children }: { mode: "light" | "dark"; children: ReactNode }) {
  const theme = useMemo(() => themes[mode], [mode]);
  return (
    <>
    {/*
      Keep component defaults before the application stylesheet.  MUI's
      generated rules otherwise win over Tailwind utility classes in the
      production SSR bundle (for example `flex`, `block`, padding and width),
      leaving dialogs and public/auth pages visually collapsed.  Do not use
      `enableCssLayer` here: it makes Tailwind's base layer outrank MUI in the
      opposite direction.
    */}
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={tokenStyles} />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
    </>
  );
}
