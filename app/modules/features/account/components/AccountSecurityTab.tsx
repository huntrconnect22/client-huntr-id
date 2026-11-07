import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import { Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  updatePassword,
  enable2FA,
  disable2FA,
  get2FAQRCode,
  confirm2FA,
  get2FARecoveryCodes,
} from "../../../lib/api";
import { getCsrfCookie } from "../../../lib/api/auth";
import { useLanguage } from "../../../context/LanguageContext";

interface AccountSecurityTabProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

/**
 * AccountSecurityTab Component
 * 
 * Pure Material UI implementation.
 */
export function AccountSecurityTab({
  user,
  onUserUpdate,
  onError,
  onSuccess,
}: AccountSecurityTabProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.two_factor_confirmed_at);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [confirming2FA, setConfirming2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      await getCsrfCookie();
      await updatePassword(passwordForm);
      onSuccess(t("settings.security.updatePasswordBtn") + " ✓");
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    onError(null);
    try {
      await enable2FA();
      const qrRes = await get2FAQRCode();
      setQrCode(qrRes.svg);
      setConfirming2FA(true);
      onSuccess(t("settings.security.scanQrTitle"));
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setLoading(true);
    onError(null);
    try {
      await confirm2FA(twoFactorCode);
      const codesRes = await get2FARecoveryCodes();
      setRecoveryCodes(codesRes);
      setTwoFactorEnabled(true);
      setConfirming2FA(false);
      setQrCode(null);
      setTwoFactorCode("");

      const updatedUser = { ...user, two_factor_confirmed_at: new Date().toISOString() };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      onSuccess(t("settings.security.twoFactorActive") + " ✓");
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm(t("settings.security.disable2FAConfirm"))) return;
    setLoading(true);
    onError(null);
    try {
      await disable2FA();
      setTwoFactorEnabled(false);
      setRecoveryCodes([]);

      const updatedUser = { ...user, two_factor_confirmed_at: null };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      onSuccess(t("settings.security.twoFactorDisabledMsg"));
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, maxWidth: 840 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("settings.security.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("settings.security.subtitle")}
        </Typography>
      </Box>

      {/* Change Password Group */}
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
          {t("settings.security.loginPassword")}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <Box component="form" onSubmit={handleUpdatePassword} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                size="small"
                type="password"
                required
                label={t("settings.security.currentPassword")}
                placeholder={t("settings.security.currentPasswordPlaceholder")}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              />

              <TextField
                fullWidth
                size="small"
                type={showPw ? "text" : "password"}
                required
                label={t("settings.security.newPassword")}
                placeholder={t("settings.security.newPasswordPlaceholder")}
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPw(!showPw)} edge="end">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                type={showConfirmPw ? "text" : "password"}
                required
                label={t("settings.security.confirmPassword")}
                placeholder={t("settings.security.confirmPasswordPlaceholder")}
                value={passwordForm.password_confirmation}
                onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowConfirmPw(!showConfirmPw)} edge="end">
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  {t("settings.security.updatePasswordBtn")}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* 2FA Group */}
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
          {t("settings.security.twoFactorAuth")}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: "background.paper",
          }}
        >
          {!twoFactorEnabled && !confirming2FA && (
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
                  {t("settings.security.twoFactorOffTitle")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("settings.security.twoFactorOffDesc")}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleEnable2FA}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t("settings.security.enable2FABtn")}
              </Button>
            </Stack>
          )}

          {confirming2FA && qrCode && (
            <Stack spacing={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("settings.security.scanQrTitle")}
              </Typography>

              <Box
                sx={{
                  bgcolor: "#ffffff",
                  p: 2,
                  borderRadius: 2,
                  width: "fit-content",
                  display: "inline-block",
                  "& svg": { display: "block" },
                }}
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />

              <Box sx={{ maxWidth: 320 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.security.enterCodeLabel")}
                  placeholder={t("settings.security.codePlaceholder")}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConfirm2FA}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  {t("settings.security.confirmBtn")}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setConfirming2FA(false);
                    setQrCode(null);
                  }}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  {t("settings.security.cancelBtn")}
                </Button>
              </Stack>
            </Stack>
          )}

          {twoFactorEnabled && (
            <Stack spacing={2.5}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "success.main" }}>
                    {t("settings.security.twoFactorActive")}
                  </Typography>
                </Stack>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisable2FA}
                  disabled={loading}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  {t("settings.security.disableBtn")}
                </Button>
              </Stack>

              {recoveryCodes.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                    {t("settings.security.recoveryCodesTitle")}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 1,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "primary.main",
                    }}
                  >
                    {recoveryCodes.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </Box>
                </Paper>
              )}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
