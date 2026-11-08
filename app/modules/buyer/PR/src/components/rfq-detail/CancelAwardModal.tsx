import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";
import { apiPost } from "~/lib/api";

interface CancelAwardModalProps {
  rfqId: string;
  rfqTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  managerUserId: string;
}

export const CancelAwardModal: React.FC<CancelAwardModalProps> = ({
  rfqId,
  rfqTitle,
  isOpen,
  onClose,
  onSuccess,
  managerUserId,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCancelAward = async () => {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 5) {
      setErrorMsg("Alasan pembatalan penetapan pemenang wajib diisi minimal 5 karakter.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await apiPost(`/api/rfqs/${rfqId}/cancel-award`, {
        reason: trimmed,
        user_id: managerUserId,
      });

      onClose();
      setReason("");

      await Swal.fire({
        icon: "success",
        title: "Penetapan Pemenang Dibatalkan",
        text: "Status tender telah dikembalikan ke Aktif dan draft Purchase Order yang terkait telah dibatalkan.",
        confirmButtonColor: "#ef7d00",
      });

      onSuccess();
    } catch (err: any) {
      console.error("Failed to cancel award", err);
      setErrorMsg(err.message || "Gagal membatalkan penetapan pemenang tender.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => !isSubmitting && onClose()}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 1400 }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3.5,
            p: 1,
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <XCircle size={24} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary" }}>
              Batalkan Penetapan Pemenang
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tender: {rfqTitle || rfqId}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Alert
          severity="warning"
          icon={<AlertTriangle size={18} style={{ color: "#d97706" }} />}
          sx={{
            borderRadius: 2.5,
            mb: 2.5,
            fontSize: "0.82rem",
            bgcolor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            "& .MuiAlert-message": { color: "#92400e", lineHeight: 1.5 },
          }}
        >
          <strong>Perhatian:</strong> Tindakan ini hanya dapat dilakukan oleh Manager / Approver Terakhir jika tidak menyetujui hasil tender.
          Seluruh status pemenang akan dicabut, draft Purchase Order (PO) yang terkait akan dibatalkan, dan tender akan kembali dibuka (status Aktif).
        </Alert>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: "0.82rem" }}>
            {errorMsg}
          </Alert>
        )}

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
            Alasan Pembatalan <span style={{ color: "#ef4444" }}>*</span>
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Jelaskan alasan pembatalan penetapan pemenang, misal: 'Harga penawaran melebihi anggaran yang disetujui direksi', 'Perubahan spesifikasi teknis mendesak', dsb..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            disabled={isSubmitting}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontSize: "0.875rem",
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            Minimal 5 karakter. Alasan ini akan tercatat dalam audit log dan disampaikan ke pihak terkait.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          Tutup
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleCancelAward}
          disabled={isSubmitting || !reason.trim()}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RotateCcw size={16} />
            )
          }
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
            px: 2.5,
          }}
        >
          {isSubmitting ? "Membatalkan..." : "Konfirmasi Batalkan Award"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

