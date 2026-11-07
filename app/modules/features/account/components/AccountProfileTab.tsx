import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Alert,
} from "@mui/material";
import {
  Camera,
  User,
  CreditCard,
  Phone,
  CalendarDays,
  Globe,
  MapPin,
  Home,
  Hash,
  Save,
  Mail,
  ShieldCheck,
  MessageSquareCode,
  CheckCircle2,
} from "lucide-react";
import {
  sendOtp,
  verifyOtp,
  updateWhatsapp,
  loadOtpSession,
  clearOtpSession,
  getProfile,
  updateUserProfile,
} from "../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";
import { SessionManager } from "../../../lib/session";

interface AccountProfileTabProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export function AccountProfileTab({
  user,
  onUserUpdate,
  onError,
  onSuccess,
}: AccountProfileTabProps) {
  const { t } = useLanguage();

  // WhatsApp OTP states
  const [loading, setLoading] = useState(false);
  const [newWhatsapp, setNewWhatsapp] = useState(user?.whatsapp || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [canonicalWhatsapp, setCanonicalWhatsapp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile form states
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    nik: "",
    npwp: "",
    phone: "",
    birth_place: "",
    birth_date: "",
    country: "Indonesia",
    province: "",
    city: "",
    district: "",
    postal_code: "",
    full_address: "",
  });

  const [userRole, setUserRole] = useState<string>(user?.role || "");
  const [userRoles, setUserRoles] = useState<any[]>(user?.roles || []);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load full profile from API on mount
  useEffect(() => {
    getProfile()
      .then((res) => {
        const u = res.user;
        setForm({
          name: u.name || "",
          email: u.email || "",
          nik: u.nik || "",
          npwp: u.npwp || "",
          phone: u.phone || "",
          birth_place: u.birth_place || "",
          birth_date: u.birth_date || "",
          country: u.country || "Indonesia",
          province: u.province || "",
          city: u.city || "",
          district: u.district || "",
          postal_code: u.postal_code || "",
          full_address: u.full_address || "",
        });
        if (u.role) setUserRole(u.role);
        if (u.roles) setUserRoles(u.roles);
        if (u.profile_photo_url) setPhotoPreview(u.profile_photo_url);
        setNewWhatsapp(u.whatsapp || "");
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const setF = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onError("Ukuran foto maksimal 5 MB");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onError(null);
    onSuccess(null);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });
      if (photoFile) fd.append("profile_photo", photoFile);

      const res = await updateUserProfile(fd);
      const updatedUser = { ...user, ...res.user };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      SessionManager.setUser(updatedUser);
      onUserUpdate(updatedUser);
      if (res.user?.profile_photo_url) setPhotoPreview(res.user.profile_photo_url);
      if (res.user?.role) setUserRole(res.user.role);
      if (res.user?.roles) setUserRoles(res.user.roles);
      setPhotoFile(null);
      onSuccess("Profil berhasil disimpan ✓");
    } catch (err: any) {
      onError(err.message || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!newWhatsapp.trim()) {
      onError("Nomor WhatsApp wajib diisi");
      return;
    }
    setSendingOtp(true);
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      const res = await sendOtp({ whatsapp: newWhatsapp });
      setOtpSent(true);
      setCanonicalWhatsapp(res.whatsapp || newWhatsapp);
      setOtpToken(res.otp_token || "");
      setResendCooldown(60);
      onSuccess(t("settings.profile.otpSentSuccess"));
      if (res.otp) setDebugOtp(String(res.otp));
    } catch (err: any) {
      onError(err.message || "Gagal mengirim OTP");
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      onError(t("settings.profile.otpLengthError"));
      return;
    }
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      const session = loadOtpSession();
      const phone = session?.whatsapp || canonicalWhatsapp || newWhatsapp;
      await verifyOtp({
        whatsapp: phone,
        otp,
        otp_token: otpToken || session?.otp_token,
      });
      clearOtpSession();
      const res = await updateWhatsapp({ whatsapp: phone });
      const updatedUser = { ...user, whatsapp: res.user?.whatsapp || phone };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      SessionManager.setUser(updatedUser);
      onUserUpdate(updatedUser);
      setOtpSent(false);
      setOtp("");
      setCanonicalWhatsapp("");
      setOtpToken("");
      clearOtpSession();
      setDebugOtp(null);
      onSuccess(t("settings.profile.updateSuccess"));
    } catch (err: any) {
      onError(err.message || "Verifikasi OTP gagal");
    } finally {
      setLoading(false);
    }
  };

  const formatRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case "company_admin":
        return "Company Administrator";
      case "procurement_manager":
        return "Procurement Manager";
      case "finance_officer":
        return "Finance Officer";
      case "approver":
        return "Approver";
      case "super_admin":
        return "Super Admin";
      default:
        return role ? role.replace(/_/g, " ").toUpperCase() : "MEMBER";
    }
  };

  const initials = (form.name || user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5, maxWidth: 860 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("settings.profile.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("settings.profile.subtitle")}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSaveProfile} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* ── 1. Foto Profil & Akun Dasar ─────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3 }, bgcolor: "background.paper" }}>
          <Stack spacing={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em", color: "text.secondary" }}>
              Foto Profil & Role Akses
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: { sm: "center" } }}>
              <Box sx={{ position: "relative", width: 84, height: 84 }}>
                <Avatar
                  src={photoPreview || undefined}
                  sx={{
                    width: 84,
                    height: 84,
                    bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                    color: "primary.main",
                    fontWeight: 800,
                    fontSize: 24,
                    border: 2,
                    borderColor: "divider",
                  }}
                >
                  {!photoPreview && initials}
                </Avatar>
                <IconButton
                  onClick={() => photoInputRef.current?.click()}
                  size="small"
                  sx={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    bgcolor: "primary.main",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "primary.dark" },
                    boxShadow: 2,
                    width: 28,
                    height: 28,
                  }}
                  title="Ganti foto profil"
                >
                  <Camera size={14} />
                </IconButton>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Foto Profil Pengguna
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Format JPG, PNG, atau WebP (Maksimum 5 MB).
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => photoInputRef.current?.click()}
                    sx={{ textTransform: "none", fontSize: 12, borderRadius: 1.5 }}
                  >
                    Pilih Foto Baru
                  </Button>
                  {photoPreview && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFile(null);
                      }}
                      sx={{ textTransform: "none", fontSize: 12 }}
                    >
                      Reset
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>

            <Divider />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 700, textTransform: "uppercase", fontSize: 11 }}>
                Role Akses Anda
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  icon={<ShieldCheck size={14} />}
                  label={formatRoleLabel(userRole)}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: 11 }}
                />
                {userRoles.length > 1 &&
                  userRoles
                    .filter((r) => r.slug !== userRole)
                    .map((r) => (
                      <Chip
                        key={r.id || r.slug}
                        label={r.name || r.slug}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Role ditetapkan oleh administrator perusahaan sesuai kewenangan organisasi Anda.
              </Typography>
            </Box>

            <TextField
              fullWidth
              size="small"
              required
              label="Nama Lengkap"
              placeholder="contoh: Budi Santoso"
              value={form.name}
              onChange={(e) => setF("name", e.target.value)}
            />
          </Stack>
        </Paper>

        {/* ── 2. Identitas & Kontak ────────────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3 }, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em", color: "text.secondary" }}>
              Identitas Resmi & Kontak
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="Email Akun"
                  placeholder="nama@perusahaan.com"
                  value={form.email}
                  onChange={(e) => setF("email", e.target.value)}
                  helperText="Digunakan untuk notifikasi tender, PR, PO, dan pemulihan akun."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="tel"
                  label="Nomor Telepon Kantor / Pribadi"
                  placeholder="contoh: 081234567890"
                  value={form.phone}
                  onChange={(e) => setF("phone", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="NIK (Nomor Induk Kependudukan)"
                  placeholder="16 digit sesuai e-KTP"
                  value={form.nik}
                  onChange={(e) => setF("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                  helperText="16 digit angka resmi KTP."
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="NPWP Pribadi (Opsional)"
                  placeholder="contoh: 00.000.000.0-000.000"
                  value={form.npwp}
                  onChange={(e) => setF("npwp", e.target.value)}
                  helperText="Diperlukan jika Anda menandatangani faktur pajak."
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* ── 3. Data Pribadi & Tanggal Lahir ──────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3 }, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em", color: "text.secondary" }}>
              Data Pribadi
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tempat Lahir"
                  placeholder="contoh: Jakarta"
                  value={form.birth_place}
                  onChange={(e) => setF("birth_place", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Tanggal Lahir"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={form.birth_date}
                  onChange={(e) => setF("birth_date", e.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* ── 4. Domisili & Alamat ─────────────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3 }, bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em", color: "text.secondary" }}>
              Domisili & Alamat
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Negara"
                  value={form.country}
                  onChange={(e) => setF("country", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Provinsi"
                  placeholder="contoh: Jawa Barat"
                  value={form.province}
                  onChange={(e) => setF("province", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Kabupaten / Kota"
                  placeholder="contoh: Bandung"
                  value={form.city}
                  onChange={(e) => setF("city", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Kecamatan"
                  placeholder="contoh: Coblong"
                  value={form.district}
                  onChange={(e) => setF("district", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Kode Pos"
                  placeholder="contoh: 40132"
                  value={form.postal_code}
                  onChange={(e) => setF("postal_code", e.target.value.replace(/\D/g, "").slice(0, 5))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Alamat Lengkap"
                  placeholder="Jl. Nama Jalan No. XX, RT 01/RW 02..."
                  value={form.full_address}
                  onChange={(e) => setF("full_address", e.target.value)}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* ── Save Action ──────────────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
            sx={{
              borderRadius: 2.5,
              px: 4,
              py: 1.25,
              fontWeight: 700,
              textTransform: "none",
              fontSize: 14,
            }}
          >
            {saving ? "Menyimpan..." : "Simpan Profil"}
          </Button>
        </Box>
      </Box>

      {/* ── WhatsApp OTP Section ──────────────────────────────── */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
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
          {t("settings.profile.contactInfo")}
        </Typography>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3 }, bgcolor: "background.paper" }}>
          <Box component="form" onSubmit={handleUpdateWhatsapp}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t("settings.profile.whatsappNumber")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("settings.profile.whatsappNumberDesc")}
                </Typography>
              </Box>

              <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="tel"
                    required
                    disabled={otpSent}
                    placeholder={t("settings.profile.whatsappPlaceholder")}
                    value={newWhatsapp}
                    onChange={(e) => {
                      setNewWhatsapp(e.target.value);
                      if (otpSent) {
                        setOtpSent(false);
                        setCanonicalWhatsapp("");
                        setOtpToken("");
                        clearOtpSession();
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  {!otpSent && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleSendOtp}
                      disabled={loading || sendingOtp || newWhatsapp === user?.whatsapp}
                      startIcon={sendingOtp ? <CircularProgress size={16} color="inherit" /> : undefined}
                      sx={{ textTransform: "none", fontWeight: 700, height: 40 }}
                    >
                      {sendingOtp ? "Mengirim..." : t("settings.profile.verifyBtn")}
                    </Button>
                  )}
                </Grid>
              </Grid>

              {otpSent && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover" }}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", display: "flex", alignItems: "center", gap: 1 }}>
                      <MessageSquareCode size={18} /> {t("settings.profile.enterOtpLabel")}
                    </Typography>

                    <Box sx={{ maxWidth: 280 }}>
                      <TextField
                        fullWidth
                        size="small"
                        required
                        placeholder={t("settings.profile.otpPlaceholder")}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        slotProps={{ htmlInput: { maxLength: 6, inputMode: "numeric" } }}
                      />
                    </Box>

                    {debugOtp && (
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "success.main" }}>
                        Debug OTP: {debugOtp}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        {t("settings.profile.confirmUpdateBtn")}
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setOtpSent(false)}
                        sx={{ textTransform: "none" }}
                      >
                        {t("settings.profile.cancelBtn")}
                      </Button>
                      {resendCooldown > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Kirim ulang dalam {resendCooldown}s
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
