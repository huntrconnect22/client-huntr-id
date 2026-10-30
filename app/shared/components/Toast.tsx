import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  showCloseButton?: boolean;
  clickToClose?: boolean;
}

export default function Toast({ message, type = "info", isVisible, onClose, duration = 3500,
  position = "bottom-right", showCloseButton = true, clickToClose = true }: ToastProps) {
  const [vertical, horizontal] = position.split("-") as ["top" | "bottom", "left" | "right" | "center"];
  return (
    <Snackbar open={isVisible} autoHideDuration={duration > 0 ? duration : null}
      anchorOrigin={{ vertical, horizontal }}
      onClose={(_, reason) => { if (reason !== "clickaway") onClose(); }}
      sx={vertical === "bottom" ? { bottom: { xs: 96, sm: 100 } } : undefined}>
      <Alert severity={type} variant="filled" onClose={showCloseButton ? onClose : undefined}
        onClick={clickToClose ? onClose : undefined} sx={{ width: "100%", alignItems: "center" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
