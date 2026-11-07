import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

interface AgenticNoticeBannerProps {
  isFeatureEnabled: boolean;
  onActivateFeature: () => void;
  onOpenSettings: () => void;
}

export default function AgenticNoticeBanner({
  isFeatureEnabled,
  onActivateFeature,
  onOpenSettings,
}: AgenticNoticeBannerProps) {
  const { t } = useLanguage();

  return (
    <Stack spacing={1.5}>
      {/* Inactive Feature Notice Banner */}
      {!isFeatureEnabled && (
        <Alert
          severity="warning"
          icon={<Sparkles size={20} />}
          action={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                onClick={onActivateFeature}
                startIcon={<Zap size={14} />}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                {t("agentic.banner.activate")}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={onOpenSettings}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                {t("agentic.banner.settings")}
              </Button>
            </Stack>
          }
          sx={{
            borderRadius: 2.5,
            alignItems: { xs: "flex-start", sm: "center" },
            "& .MuiAlert-action": { pt: { xs: 1, sm: 0 }, alignSelf: { xs: "flex-start", sm: "center" } },
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
            <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
              {t("agentic.banner.inactiveTitle")}{" "}
            </Typography>
            {t("agentic.banner.inactiveDesc")}
          </Typography>
        </Alert>
      )}

      {/* Zero-Hallucination Guarantee & Policy Banner */}
      <Alert
        severity="success"
        icon={<ShieldCheck size={20} />}
        sx={{ borderRadius: 2.5 }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
          <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
            {t("agentic.banner.zeroHallucinationTitle")}{" "}
          </Typography>
          <span
            dangerouslySetInnerHTML={{
              __html: t("agentic.banner.zeroHallucinationDesc"),
            }}
          />
        </Typography>
      </Alert>
    </Stack>
  );
}
