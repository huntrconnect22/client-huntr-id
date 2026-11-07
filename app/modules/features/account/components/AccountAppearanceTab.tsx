import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import ThemeToggle from "../../../components/ThemeToggle";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * AccountAppearanceTab Component
 * 
 * Pure Material UI implementation.
 */
export function AccountAppearanceTab() {
  const { t } = useLanguage();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 800 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("settings.appearance.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("settings.appearance.subtitle")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "text.secondary",
            px: 0.5,
          }}
        >
          {t("settings.appearance.displayMode")}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("settings.appearance.interfaceTheme")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {t("settings.appearance.interfaceThemeDesc")}
              </Typography>
            </Box>
            <ThemeToggle />
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
