import React from "react";
import {
  Box,
  Grid,
  Stack,
  Typography,
  Paper,
  Card,
  CardActionArea,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  AlertTitle,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  Building2,
  MapPin,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Store,
  ChevronRight,
  ArrowRight,
  CreditCard,
  Receipt,
  Layers,
  Info,
} from "lucide-react";
import { SlideSection, Field, FormLabel } from "./OnboardingUI";

const rupiah = (value: number | null | undefined) =>
  value == null ? "—" : `Rp ${value.toLocaleString("id-ID")}`;
const numberFormat = (value: number | null | undefined) =>
  value == null ? "—" : value.toLocaleString("id-ID");

/**
 * SlideContent Component (Express Onboarding)
 * 
 * 100% Pure Material UI implementation.
 */
export const SlideContent = ({ vm, pricing, handleLoginAsCompany }: any) => {
  const theme = useTheme();
  const {
    slide,
    formData,
    updateField,
    companies,
    selectedCompany,
    setSelectedCompany,
    termsAccepted,
    setTermsAccepted,
    lockedType,
    isVerifyingNpwp,
    npwpVerifiedData,
    handleVerifyNpwp,
    npwpConflict,
  } = vm;

  switch (slide) {
    case 1:
      return (
        <SlideSection
          title="Profil & Peran Perusahaan"
          subtitle="Pilih peran bisnis Anda dan tentukan identitas workspace"
          icon={<Building2 size={24} />}
          accentColor={theme.palette.primary.main}
        >
          {/* Role Selection */}
          <Box>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <FormLabel>Peran Bisnis Utama *</FormLabel>
              <Typography variant="caption" color="text.secondary">
                Bisa disesuaikan nanti
              </Typography>
            </Stack>

            {lockedType ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: "primary.main",
                  bgcolor: (theme) => `${theme.palette.primary.main}0D`,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Avatar sx={{ bgcolor: "primary.main", color: "#ffffff", width: 42, height: 42 }}>
                  <CheckCircle2 size={20} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                    {lockedType}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Peran dikunci dari workspace Anda sebelumnya
                  </Typography>
                </Box>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {/* Buyer Card */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      borderWidth: 2,
                      borderColor: formData.type === "buyer" ? "primary.main" : "divider",
                      bgcolor:
                        formData.type === "buyer"
                          ? (theme) => `${theme.palette.primary.main}0A`
                          : "background.paper",
                      transition: "all 0.2s ease-in-out",
                      boxShadow:
                        formData.type === "buyer"
                          ? (theme) => `0 4px 16px ${theme.palette.primary.main}25`
                          : "none",
                    }}
                  >
                    <CardActionArea
                      onClick={() => updateField("type", "buyer")}
                      sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}
                    >
                      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", width: "100%", mb: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: formData.type === "buyer" ? "primary.main" : "action.hover",
                            color: formData.type === "buyer" ? "#ffffff" : "text.secondary",
                          }}
                        >
                          <Building2 size={22} />
                        </Avatar>
                        {formData.type === "buyer" && (
                          <Chip
                            size="small"
                            icon={<CheckCircle2 size={14} color="#ffffff" />}
                            label="Dipilih"
                            color="primary"
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.75 }}>
                        Perusahaan Pembeli (Buyer)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2 }}>
                        Buat pengadaan tender RFQ, cari vendor terpercaya, bandingkan proposal, dan kelola Purchase Order.
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: "auto", flexWrap: "wrap", gap: 0.75 }}>
                        <Chip size="small" label="Tender & RFQ" color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} />
                        <Chip size="small" label="Kelola Vendor" variant="outlined" sx={{ fontWeight: 500, fontSize: 11 }} />
                      </Stack>
                    </CardActionArea>
                  </Card>
                </Grid>

                {/* Vendor Card */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      borderWidth: 2,
                      borderColor: formData.type === "vendor" ? "#6366f1" : "divider",
                      bgcolor:
                        formData.type === "vendor"
                          ? "rgba(99, 102, 241, 0.05)"
                          : "background.paper",
                      transition: "all 0.2s ease-in-out",
                      boxShadow:
                        formData.type === "vendor"
                          ? "0 4px 16px rgba(99, 102, 241, 0.2)"
                          : "none",
                    }}
                  >
                    <CardActionArea
                      onClick={() => updateField("type", "vendor")}
                      sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }}
                    >
                      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", width: "100%", mb: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: formData.type === "vendor" ? "#6366f1" : "action.hover",
                            color: formData.type === "vendor" ? "#ffffff" : "text.secondary",
                          }}
                        >
                          <Store size={22} />
                        </Avatar>
                        {formData.type === "vendor" && (
                          <Chip
                            size="small"
                            icon={<CheckCircle2 size={14} color="#ffffff" />}
                            label="Dipilih"
                            sx={{ bgcolor: "#6366f1", color: "#ffffff", fontWeight: 700, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.75 }}>
                        Penyedia Barang / Jasa (Vendor)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2 }}>
                        Terbitkan katalog produk digital, terima undangan tender, ajukan penawaran harga, dan terima PO.
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: "auto", flexWrap: "wrap", gap: 0.75 }}>
                        <Chip
                          size="small"
                          label="Katalog Digital"
                          sx={{ borderColor: "rgba(99, 102, 241, 0.4)", color: "#6366f1", fontWeight: 600, fontSize: 11 }}
                          variant="outlined"
                        />
                        <Chip size="small" label="Ikut Tender" variant="outlined" sx={{ fontWeight: 500, fontSize: 11 }} />
                      </Stack>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>

          {/* NPWP Section */}
          <Box>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <FormLabel>Nomor NPWP Perusahaan</FormLabel>
              <Chip size="small" label="Opsional" variant="outlined" color="info" sx={{ height: 22, fontSize: 11 }} />
            </Stack>
            <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, sm: 8.5 }}>
                <TextField
                  fullWidth
                  placeholder="Contoh: 01.234.567.8-901.000 (Boleh dilewati)"
                  value={formData.tax_id ?? ""}
                  onChange={(e) => updateField("tax_id", e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3.5 }}>
                <Button
                  fullWidth
                  variant={npwpVerifiedData ? "contained" : "outlined"}
                  color={npwpVerifiedData ? "success" : "primary"}
                  onClick={handleVerifyNpwp}
                  disabled={isVerifyingNpwp || !formData.tax_id}
                  startIcon={
                    isVerifyingNpwp ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : npwpVerifiedData ? (
                      <CheckCircle2 size={16} />
                    ) : undefined
                  }
                  sx={{ height: 40, fontWeight: 700, textTransform: "none" }}
                >
                  {isVerifyingNpwp ? "Memverifikasi..." : npwpVerifiedData ? "Terverifikasi" : "Cek NPWP"}
                </Button>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              💡 <strong>Opsional:</strong> Masukkan NPWP jika ingin mengisi nama perusahaan secara otomatis. Boleh dilewati jika belum memegang nomor NPWP.
            </Typography>

            {/* NPWP Verified Success Card */}
            {npwpVerifiedData && (
              <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>
                  {npwpVerifiedData.nama}
                </AlertTitle>
                <Typography variant="caption">
                  Status WP: <strong>{npwpVerifiedData.statusWp || "VALID"}</strong>
                  {npwpVerifiedData.statusSpt && ` • SPT: ${npwpVerifiedData.statusSpt}`}
                </Typography>
              </Alert>
            )}

            {/* NPWP Conflict Alert */}
            {npwpConflict && formData.type && (() => {
              const duplicate = formData.type === "vendor" ? npwpConflict.vendor : npwpConflict.buyer;
              const crossType = formData.type === "vendor" ? npwpConflict.buyer : npwpConflict.vendor;
              if (duplicate) {
                return (
                  <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>
                      NPWP sudah terdaftar sebagai {formData.type === "vendor" ? "Vendor" : "Buyer"}
                    </AlertTitle>
                    <Typography variant="caption">
                      Anda tidak dapat mendaftar dua kali dengan tipe yang sama: <strong>{duplicate.name}</strong>
                    </Typography>
                  </Alert>
                );
              }
              if (crossType) {
                return (
                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>
                      NPWP ditemukan di sisi {crossType.type === "vendor" ? "Vendor" : "Buyer"}
                    </AlertTitle>
                    <Typography variant="caption">
                      NPWP ini sudah ada untuk <em>{crossType.name}</em>. Anda dapat mendaftarkan sisi {formData.type === "vendor" ? "Vendor" : "Buyer"}-nya.
                    </Typography>
                  </Alert>
                );
              }
              return null;
            })()}
          </Box>

          {/* Company Name */}
          <Field
            label="Nama Resmi Perusahaan *"
            value={formData.company_name}
            onChange={(v: any) => updateField("company_name", v)}
            placeholder="Contoh: PT Sinar Abadi Solusindo"
            required
          />

          {/* Industry Selection */}
          <FormControl fullWidth required>
            <InputLabel id="onboarding-industry-select-label">Jenis Industri *</InputLabel>
            <Select
              labelId="onboarding-industry-select-label"
              label="Jenis Industri *"
              value={formData.industry_type ?? ""}
              onChange={(e) => updateField("industry_type", e.target.value)}
            >
              <MenuItem value="" disabled>Pilih Bidang Industri...</MenuItem>
              <MenuItem value="Technology">Teknologi & IT</MenuItem>
              <MenuItem value="Manufacturing">Manufaktur & Pabrikasi</MenuItem>
              <MenuItem value="Construction">Konstruksi & Properti</MenuItem>
              <MenuItem value="Logistics">Logistik & Distribusi</MenuItem>
              <MenuItem value="Retail">Perdagangan / Retail / Grosir</MenuItem>
              <MenuItem value="Healthcare">Kesehatan & Farmasi</MenuItem>
              <MenuItem value="Finance">Finansial & Perbankan</MenuItem>
              <MenuItem value="Services">Jasa Profesional & Konsultan</MenuItem>
              <MenuItem value="Other">Lainnya</MenuItem>
            </Select>
          </FormControl>
        </SlideSection>
      );

    case 2:
      return (
        <SlideSection
          title="Lokasi & Kontak Operasional"
          subtitle="Informasi agar mitra bisnis dan sistem Huntr dapat mengenali domisili operasional Anda"
          icon={<MapPin size={24} />}
          accentColor="#3b82f6"
        >
          {/* Starter Guarantee Banner */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              borderColor: "rgba(99, 102, 241, 0.3)",
              bgcolor: "rgba(99, 102, 241, 0.05)",
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(99, 102, 241, 0.15)",
                  color: "#6366f1",
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Sparkles size={20} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#6366f1" }}>
                  Pendaftaran Instan — Bebas Berkas di Awal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  Anda tidak perlu mengunggah NPWP, NIB, SIUP, atau nomor rekening bank hari ini. Anda langsung mendapatkan akses workspace penuh. Dokumen verifikasi dapat dilengkapi kapan saja di menu Pengaturan saat Anda siap bertransaksi.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Form Fields Grid */}
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                label="Kota / Wilayah Operasional *"
                value={formData.city}
                onChange={(v: any) => updateField("city", v)}
                placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                label="Alamat Kantor Singkat"
                value={formData.address}
                onChange={(v: any) => updateField("address", v)}
                placeholder="Contoh: Jl. Jend. Sudirman Kav. 21"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                label="Email Resmi Perusahaan"
                value={formData.email}
                onChange={(v: any) => updateField("email", v)}
                type="email"
                placeholder="Contoh: info@perusahaan.com"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                label="Telepon / WhatsApp Perusahaan"
                value={formData.phone}
                onChange={(v: any) => updateField("phone", v)}
                placeholder="Contoh: 081234567890"
              />
            </Grid>
          </Grid>
        </SlideSection>
      );

    case 3:
      return (
        <SlideSection
          title="Konfirmasi & Buka Workspace"
          subtitle="Tinjau ringkasan data sebelum workspace perusahaan Anda diaktifkan"
          icon={<ShieldCheck size={24} />}
          accentColor="#8b5cf6"
        >
          {/* Summary Card */}
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                pb: 2,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}>
                  Ringkasan Workspace
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
                  {formData.company_name || "Nama Perusahaan"}
                </Typography>
              </Box>
              <Chip
                label={formData.type === "buyer" ? "Peran: Buyer" : "Peran: Vendor"}
                color={formData.type === "buyer" ? "primary" : "info"}
                sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 11 }}
              />
            </Stack>

            <Grid container spacing={2} sx={{ pt: 2.5, pb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Industri:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.industry_type || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Domisili / Kota:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.city || formData.address || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Email:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.email || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Kontak / Telepon:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.phone || "-"}</Typography>
              </Grid>
              {formData.tax_id && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>NPWP Perusahaan:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>{formData.tax_id}</Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pt: 1, color: "primary.main" }}>
              <Sparkles size={16} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Status awal: <strong>Akun Starter (Akses Eksplorasi Penuh Aktif)</strong>
              </Typography>
            </Stack>
          </Paper>

          {/* Pricing & Fee Info */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
              <CreditCard size={20} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Informasi Biaya Penggunaan Platform
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {formData.type === "buyer" ? (
                <>
                  <strong>Buyer</strong> dapat langsung menggunakan akun Starter untuk eksplorasi dan pembuatan tender. Tersedia pilihan paket Enterprise tahunan untuk kapasitas pengguna, e-Faktur, dan multi-warehouse yang lebih besar.
                  <Typography component="span" sx={{ display: "block", color: "primary.main", fontWeight: 600, mt: 0.75 }}>
                    💡 Menyetujui ketentuan ini tidak menimbulkan tagihan atau pemotongan pembayaran otomatis apapun saat registrasi.
                  </Typography>
                </>
              ) : (
                <>
                  <strong>Vendor / Pemasok</strong> tidak dikenakan biaya langganan bulanan (bebas biaya subscription / gratis). Anda dapat langsung menerima permintaan penawaran (RFQ) dan tender setelah workspace dibuat.
                </>
              )}
            </Typography>
          </Paper>

          {/* If Buyer: Enterprise Catalog & Add-ons */}
          {formData.type === "buyer" && (
            <Stack spacing={2.5}>
              {/* Enterprise Plans Grid */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Layers size={18} color="#3b82f6" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 12 }}>
                    Pilihan Paket Enterprise (Opsional)
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Harga tahunan dibayar penuh di awal. Paket dapat dipilih atau di-upgrade setelah onboarding selesai.
                </Typography>

                {pricing?.loading && (
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={20} color="primary" />
                    <Typography variant="caption" color="text.secondary">
                      Memuat katalog harga paket terbaru...
                    </Typography>
                  </Stack>
                )}

                {pricing?.error && (
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={pricing.retry}>
                        Coba lagi
                      </Button>
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    Harga paket belum dapat dimuat saat ini.
                  </Alert>
                )}

                {pricing?.catalog?.plans && (
                  <Grid container spacing={2}>
                    {pricing.catalog.plans.map((plan: any) => (
                      <Grid size={{ xs: 12, md: 4 }} key={plan.key}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {plan.name}
                              </Typography>
                              <Chip size="small" label="Enterprise" color="info" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                            </Stack>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                              {rupiah(plan.monthly_price)}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                {" "}/ bln
                              </Typography>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                              {rupiah(plan.annual_price)} / tahun di muka
                            </Typography>
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Stack spacing={0.75}>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">Pengguna:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{numberFormat(plan.users)}</Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">e-Faktur:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{numberFormat(plan.tax_documents_per_year)} / thn</Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">Gudang:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{numberFormat(plan.warehouses)}</Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">AI:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{numberFormat(plan.ai_requests_per_month)} req/bln</Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                              <Typography variant="caption" color="text.secondary">Dukungan:</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>{plan.support ?? "Standar"}</Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>

              {/* Addons */}
              {pricing?.catalog?.addons && (
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                    <Receipt size={18} color="#10b981" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Add-on Ekstra (Sesuai Kebutuhan)
                    </Typography>
                  </Stack>
                  <Grid container spacing={1.5} sx={{ my: 1 }}>
                    {pricing.catalog.addons.map((addon: any) => (
                      <Grid size={{ xs: 12, sm: 4 }} key={addon.key}>
                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                          <Typography variant="caption" noWrap sx={{ fontWeight: 700, display: "block" }}>
                            {addon.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "success.main" }}>
                            {rupiah(addon.price)}
                            <Typography component="span" variant="caption" color="text.secondary">
                              {" "}/ {numberFormat(addon.quantity)} {addon.unit}
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Top-up dokumen berlaku hingga akhir tahun paket untuk e-Faktur buyer pemilik PO. Add-on pengguna & gudang berlaku per bulan.
                  </Typography>
                </Paper>
              )}

              {/* Payment & Transaction Fee Info */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
                  <Info size={18} color="#6366f1" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Pembayaran & Skema Transaksi Platform
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.6, mb: 1 }}>
                  Pembayaran langganan diproses melalui Midtrans berizin resmi BI. Tagihan resmi dikirim ke email perusahaan yang terdaftar. Onboarding teknis paket Enterprise memerlukan waktu {pricing?.catalog ? `${pricing.catalog.onboarding_business_days.min}–${pricing.catalog.onboarding_business_days.max}` : "1–3"} hari kerja.
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.6 }}>
                  Di luar masa pembebasan biaya platform atau paket Enterprise aktif, platform Huntr.id mengenakan skema biaya platform berjenjang sesuai nilai transaksi: <strong>5%</strong> (hingga Rp100 juta), <strong>3%</strong> (Rp100 juta hingga Rp250 juta), dan <strong>2%</strong> (di atas Rp250 juta).
                </Typography>
              </Paper>
            </Stack>
          )}

          {/* Terms Agreement Checkbox */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 3,
              borderColor: termsAccepted ? "primary.main" : "divider",
              bgcolor: termsAccepted ? (theme) => `${theme.palette.primary.main}08` : "background.paper",
              transition: "all 0.2s ease",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  color="primary"
                  sx={{ mt: -0.5 }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Saya telah membaca, memahami, dan menyetujui{" "}
                  <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: "primary.main", textDecoration: "underline" }}>
                    Syarat & Ketentuan Layanan
                  </Typography>
                  ,{" "}
                  <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: "primary.main", textDecoration: "underline" }}>
                    Kebijakan Privasi
                  </Typography>
                  , serta{" "}
                  <Typography component="span" variant="body2" sx={{ fontWeight: 700, color: "primary.main", textDecoration: "underline" }}>
                    Informasi Biaya Platform Huntr.id
                  </Typography>{" "}
                  di atas, serta menyatakan bahwa data yang saya daftarkan adalah benar.
                </Typography>
              }
            />
          </Paper>
        </SlideSection>
      );

    case 4:
      return (
        <SlideSection
          title="Workspace Berhasil Dibuat!"
          subtitle="Selamat datang di platform pengadaan & tender modern Huntr.id"
          icon={<CheckCircle2 size={24} />}
          accentColor="#10b981"
        >
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center", py: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                borderRadius: 4,
                bgcolor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: 2,
                borderColor: "rgba(16, 185, 129, 0.3)",
              }}
            >
              <Sparkles size={36} />
            </Avatar>

            <Box sx={{ maxWidth: 520 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                {selectedCompany?.name || formData.company_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Akun Starter perusahaan Anda telah siap. Anda dapat langsung mengundang rekan kerja, melihat katalog produk, atau mempublikasikan tender pengadaan pertama Anda.
              </Typography>
            </Box>

            {/* Selected Company Card list if multiple */}
            {companies && companies.length > 0 && (
              <Stack spacing={1.5} sx={{ width: "100%", maxWidth: 520 }}>
                {companies.map((c: any) => {
                  const isSelected = selectedCompany?.id === c.id;
                  return (
                    <Paper
                      key={c.id}
                      variant="outlined"
                      onClick={() => setSelectedCompany(c)}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        cursor: "pointer",
                        borderColor: isSelected ? "primary.main" : "divider",
                        bgcolor: isSelected ? (theme) => `${theme.palette.primary.main}0A` : "background.paper",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Box sx={{ textAlign: "left" }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isSelected ? "primary.main" : "text.primary" }}>
                          {c.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tipe: {c.type || formData.type || "Perusahaan"} • Starter Tier
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Avatar sx={{ bgcolor: "primary.main", color: "#ffffff", width: 24, height: 24 }}>
                          <CheckCircle2 size={14} />
                        </Avatar>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            )}

            <Button
              fullWidth
              size="large"
              variant="contained"
              color="primary"
              onClick={handleLoginAsCompany}
              endIcon={<ArrowRight size={18} />}
              sx={{
                maxWidth: 520,
                py: 1.75,
                fontWeight: 800,
                fontSize: 15,
                borderRadius: 3,
                textTransform: "none",
                boxShadow: (theme) => `0 6px 20px ${theme.palette.primary.main}40`,
              }}
            >
              Masuk ke Workspace Sekarang
            </Button>
          </Stack>
        </SlideSection>
      );

    default:
      return null;
  }
};
