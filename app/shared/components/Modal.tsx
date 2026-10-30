import { useId, type ReactNode } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: string | number;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  preventBackdropClose?: boolean;
}

export default function Modal({
  isOpen, onClose, children, title, subtitle, maxWidth = 600,
  showCloseButton = true, className = "", contentClassName = "", preventBackdropClose = false,
}: ModalProps) {
  const titleId = useId();
  const subtitleId = useId();
  return (
    <Dialog
      open={isOpen}
      onClose={(_, reason) => { if (reason !== "backdropClick" || !preventBackdropClose) onClose(); }}
      maxWidth={false}
      className={className}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? subtitleId : undefined}
      slotProps={{ paper: { className: `huntr-modal-content ${contentClassName}`, sx: { width: "100%", maxWidth, maxHeight: "90dvh", m: { xs: 2, sm: 4 } } } }}
    >
      {(title || showCloseButton) && (
        <DialogTitle component="div" sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <div>
            {title && <Typography id={titleId} variant="h4" component="h2">{title}</Typography>}
            {subtitle && <Typography id={subtitleId} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
          </div>
          {showCloseButton && <IconButton onClick={onClose} aria-label="Close modal"><X size={20} /></IconButton>}
        </DialogTitle>
      )}
      <DialogContent sx={{ p: (title || showCloseButton) ? 0 : 3 }}>{children}</DialogContent>
    </Dialog>
  );
}
