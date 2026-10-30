import { useEffect, useState } from "react";
import Backdrop from "@mui/material/Backdrop";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { WifiOff, RefreshCw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useBackendStatus } from "../hooks/useBackendStatus";

export default function MaintenanceBanner() {
  const { isDown, isChecking, retry } = useBackendStatus();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!isDown) { setVisible(false); return; }
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, [isDown]);

  return (
    <Backdrop open={visible} sx={{ zIndex: 99999, p: 3 }}>
      <Paper variant="outlined" role="alert" aria-live="assertive" sx={{ width: "100%", maxWidth: 480, p: { xs: 3, sm: 5 }, textAlign: "center" }}>
        <Stack spacing={2.5} sx={{ alignItems: "center" }}>
          <WifiOff size={36} color="var(--ui-text-brand)" />
          <Typography variant="h3" component="h1">{t("maintenance.title")}</Typography>
          <Typography color="text.secondary">{t("maintenance.subtitle")}</Typography>
          <Typography variant="body2" color="error.main">{t("maintenance.statusLabel")}: {t("maintenance.statusOffline")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("maintenance.retrying")}</Typography>
          <Button variant="contained" onClick={() => void retry()} disabled={isChecking}
            startIcon={isChecking ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}>
            {t("maintenance.retryBtn")}
          </Button>
        </Stack>
      </Paper>
    </Backdrop>
  );
}
