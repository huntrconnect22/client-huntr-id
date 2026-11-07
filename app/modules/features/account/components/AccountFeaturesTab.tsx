import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  Switch,
  Avatar,
  useTheme,
} from "@mui/material";
import { Sparkles } from "lucide-react";
import {
  isAgenticProcurementEnabled,
  setAgenticProcurementEnabled,
} from "../../../lib/features";
import { useLanguage } from "../../../context/LanguageContext";

interface AccountFeaturesTabProps {
  onSuccess: (msg: string | null) => void;
}

/**
 * AccountFeaturesTab Component
 * 
 * Pure Material UI implementation.
 */
export function AccountFeaturesTab({ onSuccess }: AccountFeaturesTabProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const [agenticEnabled, setAgenticEnabled] = useState(isAgenticProcurementEnabled());

  const handleToggleAgentic = (val: boolean) => {
    setAgenticProcurementEnabled(val);
    setAgenticEnabled(val);
    if (val) {
      onSuccess(t("settings.features.enabledSuccess"));
    } else {
      onSuccess(t("settings.features.disabledSuccess"));
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 840 }}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {t("settings.features.title")}
          </Typography>
          <Chip
            size="small"
            label={t("settings.features.beta")}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: 10, height: 22 }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("settings.features.subtitle")}
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
          {t("settings.features.aiSection")}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2.5}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Avatar
                sx={{
                  bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                  color: "primary.main",
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Sparkles size={22} />
              </Avatar>

              <Box sx={{ maxWidth: 560 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5, gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t("settings.features.agenticTitle")}
                  </Typography>
                  <Chip
                    size="small"
                    label={t("settings.features.agenticBadge")}
                    sx={{
                      height: 20,
                      fontSize: 9,
                      fontWeight: 800,
                      bgcolor: (theme) => `${theme.palette.primary.main}15`,
                      color: "primary.main",
                    }}
                  />
                  {agenticEnabled ? (
                    <Chip
                      size="small"
                      label={t("settings.features.statusActiveSidebar")}
                      color="success"
                      sx={{ height: 20, fontSize: 9, fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      label={t("settings.features.statusInactive")}
                      variant="outlined"
                      sx={{ height: 20, fontSize: 9, fontWeight: 600 }}
                    />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 1 }}>
                  {t("settings.features.agenticDesc")}
                </Typography>

                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  <Typography component="span" variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
                    {t("settings.features.statusLabel")}:{" "}
                  </Typography>
                  {agenticEnabled
                    ? t("settings.features.statusActiveText")
                    : t("settings.features.statusInactiveText")}
                </Typography>
              </Box>
            </Stack>

            <Switch
              checked={agenticEnabled}
              onChange={(e) => handleToggleAgentic(e.target.checked)}
              color="primary"
            />
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
