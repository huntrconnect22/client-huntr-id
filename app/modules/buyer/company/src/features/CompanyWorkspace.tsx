import React, { useRef, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Stack,
  Grid,
  Avatar,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper,
  Tooltip,
} from "@mui/material";
import Layout from "~/components/Layout";
import {
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Users,
  Plus,
  X,
  AlertCircle,
  Camera,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Hash,
  Trash2,
  Sparkles,
  Clock,
  Upload,
  Edit2,
  Save,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { useCompanyViewModel } from "~/features/company/hooks/useCompanyViewModel";
import { TeamManagement } from "~/features/company/components/TeamManagement";
import { AccessApprovalManagement } from "~/features/company/components/AccessApprovalManagement";
import { getAssetUrl } from "~/lib/assets";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactElement;
    chipSx: {
      bgcolor: string;
      color: string;
      borderColor: string;
      fontWeight: number;
      border: string;
      "& .MuiChip-icon": { color: string };
    };
  }
> = {
  starter: {
    label: "Akun Starter",
    icon: <Sparkles size={13} />,
    chipSx: {
      bgcolor: "rgba(59, 130, 246, 0.12)",
      color: "#1d4ed8",
      borderColor: "rgba(59, 130, 246, 0.3)",
      fontWeight: 700,
      border: "1px solid",
      "& .MuiChip-icon": { color: "#1d4ed8" },
    },
  },
  approved: {
    label: "Terverifikasi",
    icon: <CheckCircle2 size={13} />,
    chipSx: {
      bgcolor: "rgba(16, 185, 129, 0.15)",
      color: "#047857",
      borderColor: "rgba(16, 185, 129, 0.4)",
      fontWeight: 700,
      border: "1px solid",
      "& .MuiChip-icon": { color: "#047857" },
    },
  },
  pending: {
    label: "Menunggu Review",
    icon: <Clock size={13} />,
    chipSx: {
      bgcolor: "rgba(245, 158, 11, 0.15)",
      color: "#b45309",
      borderColor: "rgba(245, 158, 11, 0.4)",
      fontWeight: 700,
      border: "1px solid",
      "& .MuiChip-icon": { color: "#b45309" },
    },
  },
  rejected: {
    label: "Verifikasi Ditolak",
    icon: <AlertCircle size={13} />,
    chipSx: {
      bgcolor: "rgba(239, 68, 68, 0.15)",
      color: "#b91c1c",
      borderColor: "rgba(239, 68, 68, 0.4)",
      fontWeight: 700,
      border: "1px solid",
      "& .MuiChip-icon": { color: "#b91c1c" },
    },
  },
};

export default function CompanyDetails() {
  const vm = useCompanyViewModel();
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  const [docType, setDocType] = useState("NPWP");
  const [copiedBank, setCopiedBank] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: "profile", label: "Identitas Perusahaan", icon: <Building2 size={17} /> },
    { id: "location", label: "Lokasi & Cabang", icon: <MapPin size={17} /> },
    { id: "banking", label: "Informasi Bank", icon: <CreditCard size={17} /> },
    { id: "documents", label: "Dokumen Legalitas", icon: <ShieldCheck size={17} /> },
    { id: "performance", label: "Performa & Aktivitas", icon: <Activity size={17} /> },
    { id: "team", label: "Tim & Pengguna", icon: <Users size={17} /> },
    { id: "access", label: "Hak Akses & Approval", icon: <ShieldCheck size={17} /> },
  ];

  const missingFields = useMemo(() => {
    if (!vm.company) return [];
    const f: string[] = [];
    if (!vm.company.logo_url && !vm.company.logo_path) f.push("Logo Perusahaan");
    if (!vm.company.address) f.push("Alamat Utama");
    if (!vm.company.bank_name) f.push("Akun Bank");
    if (!vm.company.documents || vm.company.documents.length === 0) f.push("Dokumen Legal (NPWP/NIB)");
    if (!vm.company.about) f.push("Profil Singkat");
    return f;
  }, [vm.company]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  /* ── 1. Loading State ── */
  if (vm.loading) {
    return (
      <Layout title="Company" subtitle="Loading...">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            gap: 2,
          }}
        >
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            Memuat profil perusahaan...
          </Typography>
        </Box>
      </Layout>
    );
  }

  /* ── 2. Select Workspace Screen (Rombak List Company) ── */
  if (!vm.showCompanyWorkspace) {
    return (
      <Layout title="Company" subtitle="Pilih Perusahaan">
        <Box sx={{ width: "100%", py: 3, maxWidth: 1200, mx: "auto" }}>
          {/* Header Banner */}
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: 3,
              mb: 3.5,
              bgcolor: "background.paper",
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.03) 0%, rgba(30, 41, 59, 0.07) 100%)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between" }}
            >
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#0f172a",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Briefcase size={20} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Pilih Workspace Perusahaan
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Kelola profil legalitas, izin operasional, katalog, tim, dan pengadaan untuk setiap entitas bisnis Anda.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                {vm.companyCapacity && (
                  <Chip
                    label={`Paket ${vm.companyCapacity.plan_name}: ${vm.companyCapacity.used}/${vm.companyCapacity.limit}`}
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, bgcolor: "background.paper" }}
                  />
                )}
                <Button
                  variant="contained"
                  startIcon={<Plus size={16} />}
                  disabled={vm.companyCapacity?.remaining === 0}
                  onClick={() => vm.navigate("/onboarding")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "#0f172a",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "#1e293b" },
                  }}
                >
                  Tambah Perusahaan
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {vm.companyListLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : vm.companies.length === 0 ? (
            <Card variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center", maxWidth: 480, mx: "auto" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: "#f1f5f9",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <Building2 size={28} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Belum Ada Perusahaan Terdaftar
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Buat workspace bisnis pertama Anda untuk mulai bertransaksi dan mengelola tender di Huntr.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => vm.navigate("/onboarding")}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                Daftarkan Perusahaan
              </Button>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {/* Register New Card */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderStyle: "dashed",
                    height: "100%",
                    minHeight: 210,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "text.primary", bgcolor: "action.selected" },
                  }}
                >
                  <CardActionArea
                    onClick={() => vm.navigate("/onboarding")}
                    disabled={vm.companyCapacity?.remaining === 0}
                    sx={{
                      p: 3,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        bgcolor: "background.paper",
                        color: "text.primary",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                        boxShadow: 1,
                      }}
                    >
                      <Plus size={22} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: "center" }}>
                      {vm.companyCapacity?.remaining === 0 ? "Batas Paket Tercapai" : "Daftarkan Perusahaan Baru"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: "center" }}>
                      {vm.companyCapacity?.remaining === 0
                        ? "Upgrade paket untuk menambah kapasitas perusahaan."
                        : "Tambah badan usaha atau cabang baru ke akun Anda."}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>

              {/* Company Cards List */}
              {vm.companies.map((c: any) => {
                const active = vm.selectedWorkspace?.id === c.id;
                const statusInfo = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                const logoSrc = c.logo_url || c.logo_path ? getAssetUrl(c.logo_url || c.logo_path) : undefined;

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: active ? "#047857" : "divider",
                        borderWidth: active ? 2 : 1,
                        bgcolor: "background.paper",
                        boxShadow: active ? 2 : 0,
                        transition: "all 0.2s",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        "&:hover": { boxShadow: 4, transform: "translateY(-3px)", borderColor: "text.secondary" },
                      }}
                    >
                      <CardActionArea
                        onClick={() => vm.openCompanyWorkspace(c)}
                        sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "space-between" }}
                      >
                        <Box>
                          {/* Top Row: Avatar + Active badge */}
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                            {/* Neutral Company Avatar (NO ORANGE) */}
                            <Avatar
                              src={logoSrc}
                              variant="rounded"
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: 2.5,
                                bgcolor: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid",
                                borderColor: "#e2e8f0",
                              }}
                            >
                              <Building2 size={24} />
                            </Avatar>

                            {active ? (
                              <Chip
                                icon={<CheckCircle2 size={13} style={{ color: "#047857" }} />}
                                label="Sedang Aktif"
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: "rgba(16, 185, 129, 0.12)",
                                  color: "#047857",
                                  border: "1px solid rgba(16, 185, 129, 0.3)",
                                }}
                              />
                            ) : (
                              <Chip
                                label={c.type?.toUpperCase() || "ORGANISASI"}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  bgcolor: "action.hover",
                                  color: "text.primary",
                                }}
                              />
                            )}
                          </Stack>

                          {/* Company Name */}
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 1 }} noWrap>
                            {c.name}
                          </Typography>

                          {/* Status Badge (Clear, High Contrast) */}
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              size="small"
                              sx={statusInfo.chipSx}
                            />
                            {c.city && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                · {c.city}
                              </Typography>
                            )}
                          </Stack>
                        </Box>

                        <Box sx={{ mt: "auto" }}>
                          <Divider sx={{ mb: 1.5 }} />

                          {/* Meta Row: NPWP & Action button */}
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="caption" color="text.secondary">
                              NPWP: {c.formatted_tax_id || c.tax_id || "Belum diisi"}
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "primary.main" }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                Buka
                              </Typography>
                              <ArrowRight size={13} />
                            </Stack>
                          </Stack>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Layout>
    );
  }

  /* ── 3. Main Workspace Details View ── */
  const statusInfo = STATUS_CONFIG[vm.company.status] || STATUS_CONFIG.pending;
  const winRate =
    vm.company.stats?.total_proposals > 0
      ? Math.round((vm.company.stats.won_proposals / vm.company.stats.total_proposals) * 100)
      : 0;
  const logoSrc = vm.company.logo_url || vm.company.logo_path ? getAssetUrl(vm.company.logo_url || vm.company.logo_path) : undefined;

  return (
    <Layout title={vm.company.name} subtitle="Company Workspace">
      <Box sx={{ width: "100%", pb: 6 }}>
        {/* Missing fields banner */}
        {!profileBannerDismissed && missingFields.length > 0 && (
          <Alert
            severity="warning"
            action={
              <IconButton size="small" color="inherit" onClick={() => setProfileBannerDismissed(true)}>
                <X size={16} />
              </IconButton>
            }
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <AlertTitle sx={{ fontWeight: 700, fontSize: "0.875rem" }}>Lengkapi Profil Perusahaan</AlertTitle>
            Data yang belum lengkap: <strong>{missingFields.join(", ")}</strong>. Lengkapi profil Anda untuk mempercepat verifikasi akun.
          </Alert>
        )}

        {/* Update Error Banner */}
        {vm.updateError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => {}}>
            {vm.updateError}
          </Alert>
        )}

        {/* ── Corporate Hero Header (NEUTRAL, NO ORANGE) ── */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            mb: 3,
            bgcolor: "background.paper",
            borderColor: "divider",
          }}
        >
          {/* Top Decorative Banner: Sleek Neutral Slate */}
          <Box
            sx={{
              height: 76,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {/* CLEAR, HIGH-CONTRAST STATUS BADGE (LABEL ALWAYS VISIBLE) */}
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                size="small"
                sx={statusInfo.chipSx}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => vm.setShowCompanyWorkspace(false)}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "#ffffff",
                  },
                }}
              >
                Ganti Workspace
              </Button>
            </Stack>
          </Box>

          {/* Profile Identity Bar */}
          <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 3, pt: 0 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.5}
              sx={{
                alignItems: { xs: "flex-start", sm: "flex-end" },
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-end" }}>
                {/* Logo Avatar: Clean Neutral Slate (NO ORANGE) */}
                <Box sx={{ position: "relative", mt: -5 }}>
                  <Avatar
                    src={logoSrc}
                    variant="rounded"
                    sx={{
                      width: 82,
                      height: 82,
                      borderRadius: 3,
                      border: "3px solid",
                      borderColor: "background.paper",
                      bgcolor: "#f1f5f9",
                      color: "#334155",
                      boxShadow: 2,
                    }}
                  >
                    <Building2 size={36} />
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={() => logoInputRef.current?.click()}
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      bgcolor: "#0f172a",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "#1e293b" },
                      boxShadow: 2,
                      width: 28,
                      height: 28,
                    }}
                    title="Ganti Logo"
                  >
                    {vm.logoUploading ? <CircularProgress size={14} color="inherit" /> : <Camera size={14} />}
                  </IconButton>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) vm.handleLogoUpload(f);
                    }}
                  />
                </Box>

                {/* Name & Basic Info */}
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {vm.company.name}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 0.75, flexWrap: "wrap" }}>
                    <Chip
                      label={vm.company.type?.toUpperCase() || "ORGANIZATION"}
                      size="small"
                      sx={{
                        height: 22,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        bgcolor: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    {vm.company.city && (
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <MapPin size={13} color="gray" />
                        <Typography variant="caption" color="text.secondary">
                          {vm.company.city}
                          {vm.company.provincy_country ? `, ${vm.company.provincy_country}` : ""}
                        </Typography>
                      </Stack>
                    )}
                    {(vm.company.formatted_tax_id || vm.company.tax_id) && (
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Hash size={13} color="gray" />
                        <Typography variant="caption" color="text.secondary">
                          {vm.company.formatted_tax_id || vm.company.tax_id}
                        </Typography>
                        <Chip
                          icon={<CheckCircle2 size={11} style={{ color: "#0369a1" }} />}
                          label="NPWP Terverifikasi"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            bgcolor: "rgba(3, 105, 161, 0.1)",
                            color: "#0369a1",
                            border: "1px solid rgba(3, 105, 161, 0.25)",
                          }}
                        />
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Stack>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
                {!vm.isEditing ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit2 size={16} />}
                    onClick={() => vm.setIsEditing(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      bgcolor: "#0f172a",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    Edit Profil
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      startIcon={vm.updatingCompany ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                      disabled={vm.updatingCompany}
                      onClick={vm.handleSaveCompany}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 2.5,
                        bgcolor: "#047857",
                        color: "#ffffff",
                        "&:hover": { bgcolor: "#065f46" },
                      }}
                    >
                      Simpan Perubahan
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => vm.setIsEditing(false)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                      Batal
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            {/* Quick Metrics Bar */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {vm.company.type === "buyer" ? "TOTAL PERMINTAAN (PR)" : "TOTAL PENAWARAN (BIDS)"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {vm.company.type === "buyer" ? vm.company.stats?.total_pr || 0 : vm.company.stats?.total_proposals || 0}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {vm.company.type === "buyer" ? "PR DISETUJUI" : "KONTRAK DIMENANGKAN"}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#047857" }}>
                  {vm.company.type === "buyer" ? vm.company.stats?.approved_pr || 0 : vm.company.stats?.won_proposals || 0}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  WIN RATE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1d4ed8" }}>
                  {winRate}%
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  BERGABUNG SEJAK
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {vm.company.created_at
                    ? new Date(vm.company.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "short" })
                    : "—"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* ── Modern MUI Navigation Tabs ── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, bgcolor: "background.paper" }}>
          <Tabs
            value={vm.activeTab}
            onChange={(_, val) => vm.setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                minHeight: 48,
              },
            }}
          >
            {tabs.map((t) => (
              <Tab key={t.id} value={t.id} icon={t.icon} iconPosition="start" label={t.label} />
            ))}
          </Tabs>
        </Paper>

        {/* ── TAB 1: Identitas Perusahaan ── */}
        {vm.activeTab === "profile" && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Profil & Legalitas Entitas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Informasi resmi entitas bisnis yang akan tertera pada faktur, PO, dan dokumen pengadaan.
                </Typography>
              </Box>
              {!vm.isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit2 size={14} />}
                  onClick={() => vm.setIsEditing(true)}
                  sx={{ borderRadius: 2, textTransform: "none" }}
                >
                  Ubah
                </Button>
              )}
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {vm.isEditing ? (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nama Perusahaan *"
                    size="small"
                    value={vm.editForm.name || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="country-label">Negara</InputLabel>
                    <Select
                      labelId="country-label"
                      label="Negara"
                      value={vm.editForm.country || "ID"}
                      onChange={(e) => vm.setEditForm({ ...vm.editForm, country: e.target.value })}
                    >
                      <MenuItem value="ID">Indonesia</MenuItem>
                      <MenuItem value="MY">Malaysia</MenuItem>
                      <MenuItem value="SG">Singapore</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="industry-label">Sektor / Bidang Industri</InputLabel>
                    <Select
                      labelId="industry-label"
                      label="Sektor / Bidang Industri"
                      value={vm.editForm.industry_type || ""}
                      onChange={(e) => vm.setEditForm({ ...vm.editForm, industry_type: e.target.value })}
                    >
                      {[
                        "Technology",
                        "Manufacturing",
                        "Healthcare",
                        "Retail & Commerce",
                        "Finance & Banking",
                        "Construction",
                        "Logistics & Supply Chain",
                        "Agriculture",
                        "Education",
                        "Other",
                      ].map((ind) => (
                        <MenuItem key={ind} value={ind}>
                          {ind}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      label="Nomor NPWP (15/16 Digit)"
                      size="small"
                      value={vm.editForm.tax_id || ""}
                      onChange={(e) => {
                        vm.setEditForm({ ...vm.editForm, tax_id: e.target.value });
                        vm.clearNpwpVerification();
                      }}
                      placeholder="Contoh: 012345678901234"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={vm.handleVerifyNpwp}
                      disabled={vm.npwpVerification.state === "loading" || !vm.editForm.tax_id?.trim()}
                      sx={{ whiteSpace: "nowrap", px: 2, borderRadius: 2 }}
                    >
                      {vm.npwpVerification.state === "loading" ? <CircularProgress size={16} /> : "Validasi"}
                    </Button>
                  </Stack>
                  {vm.npwpVerification.message && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.5,
                        fontWeight: 600,
                        color: vm.npwpVerification.state === "valid" ? "#047857" : "#b91c1c",
                      }}
                    >
                      {vm.npwpVerification.message}
                      {vm.npwpVerification.taxpayerName ? ` · ${vm.npwpVerification.taxpayerName}` : ""}
                    </Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email Perusahaan"
                    size="small"
                    type="email"
                    value={vm.editForm.email || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, email: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Nomor Telepon / WhatsApp"
                    size="small"
                    value={vm.editForm.phone || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, phone: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Website Perusahaan"
                    size="small"
                    value={vm.editForm.website || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, website: e.target.value })}
                    placeholder="https://perusahaan.co.id"
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Tentang Perusahaan (Profil Singkat)"
                    value={vm.editForm.about || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, about: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Kata Kunci / Tag Pencarian"
                    size="small"
                    value={vm.editForm.keywords || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, keywords: e.target.value })}
                    helperText="Pisahkan dengan koma (misal: Supplier IT, Logistik Jakarta, B2B Procurement)"
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    NAMA RESMI PERUSAHAAN
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {vm.company.name || "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    BIDANG INDUSTRI
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {vm.company.industry_type || "Belum dipilih"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    NOMOR NPWP
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {vm.company.formatted_tax_id || vm.company.tax_id || "Belum diisi"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    WEBSITE RESMI
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {vm.company.website ? (
                      <Button
                        href={vm.company.website.startsWith("http") ? vm.company.website : `https://${vm.company.website}`}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        endIcon={<ExternalLink size={14} />}
                        sx={{ textTransform: "none", p: 0, fontWeight: 600 }}
                      >
                        {vm.company.website}
                      </Button>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    EMAIL RESMI
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {vm.company.email || "—"}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    NOMOR KONTAK
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {vm.company.phone || "—"}
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    PROFIL & DESKRIPSI USAHA
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.7 }}>
                    {vm.company.about || "Belum ada deskripsi profil perusahaan."}
                  </Typography>
                </Grid>
                {vm.company.keywords && (
                  <Grid size={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                      KATA KUNCI & SPESIALISASI
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                      {(Array.isArray(vm.company.keywords)
                        ? vm.company.keywords
                        : String(vm.company.keywords).split(",")
                      ).map((kw: string, i: number) => (
                        <Chip key={i} label={kw.trim()} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        )}

        {/* ── TAB 2: Lokasi & Cabang ── */}
        {vm.activeTab === "location" && (
          <Stack spacing={3}>
            {/* Primary Address */}
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Kantor Pusat (Alamat Utama)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Alamat domisili legal dan surat-menyurat perusahaan.
              </Typography>

              {vm.isEditing ? (
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Provinsi / Negara"
                      value={vm.editForm.provincy_country || ""}
                      onChange={(e) => vm.setEditForm({ ...vm.editForm, provincy_country: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Kota / Kabupaten"
                      value={vm.editForm.city || ""}
                      onChange={(e) => vm.setEditForm({ ...vm.editForm, city: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Kode Pos"
                      value={vm.editForm.zip_code || ""}
                      onChange={(e) => vm.setEditForm({ ...vm.editForm, zip_code: e.target.value })}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Alamat Lengkap Kantor Pusat"
                      value={vm.editForm.address || ""}
                      onChange={(e) => vm.setEditForm({ ...vm.editForm, address: e.target.value })}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      PROVINSI / NEGARA
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {vm.company.provincy_country || "—"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      KOTA / KABUPATEN
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {vm.company.city || "—"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      KODE POS
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {vm.company.zip_code || "—"}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      ALAMAT LENGKAP
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {vm.company.address || "Belum ada alamat kantor yang diisi."}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Operational & Branch Addresses */}
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Kantor Cabang & Lokasi Operasional
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gudang, site project, atau kantor perwakilan lainnya.
                  </Typography>
                </Box>
                {vm.isEditing && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Plus size={15} />}
                    onClick={vm.addHqAddress}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Tambah Lokasi
                  </Button>
                )}
              </Stack>

              {vm.isEditing ? (
                <Stack spacing={2}>
                  {(vm.editForm.hq_addresses || []).map((addr: string, idx: number) => (
                    <Stack direction="row" spacing={1.5} key={idx} sx={{ alignItems: "flex-start" }}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`Cabang / Lokasi #${idx + 1}`}
                        value={addr}
                        onChange={(e) => vm.updateHqAddress(idx, e.target.value)}
                        placeholder="Contoh: Gedung Bursa Efek Indonesia Tower 2 Lt. 17, Jakarta Selatan"
                      />
                      <IconButton
                        color="error"
                        onClick={() => vm.removeHqAddress(idx)}
                        disabled={(vm.editForm.hq_addresses || []).length <= 1}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  {!vm.company.hq_addresses ||
                  (Array.isArray(vm.company.hq_addresses) && vm.company.hq_addresses.length === 0) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Belum ada alamat kantor cabang tambahan.
                    </Typography>
                  ) : (
                    (Array.isArray(vm.company.hq_addresses)
                      ? vm.company.hq_addresses
                      : [vm.company.hq_addresses]
                    ).map((addr: string, idx: number) => (
                      <Paper
                        key={idx}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <MapPin size={16} color="gray" />
                        <Typography variant="body2">{addr}</Typography>
                      </Paper>
                    ))
                  )}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}

        {/* ── TAB 3: Informasi Bank ── */}
        {vm.activeTab === "banking" && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Rekening Bank Resmi
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Informasi rekening bank yang digunakan untuk penyelesaian pembayaran transaksi & penagihan.
            </Typography>

            {vm.isEditing ? (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nama Bank (misal: BCA, Mandiri, BRI)"
                    value={vm.editForm.bank_name || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, bank_name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nomor Rekening"
                    value={vm.editForm.bank_account || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, bank_account: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nama Pemilik Rekening"
                    value={vm.editForm.bank_account_name || ""}
                    onChange={(e) => vm.setEditForm({ ...vm.editForm, bank_account_name: e.target.value })}
                  />
                </Grid>
              </Grid>
            ) : (
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: 3,
                  maxWidth: 500,
                  bgcolor: "action.hover",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: "#0f172a",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CreditCard size={22} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {vm.company.bank_name || "Bank Belum Diatur"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rekening Utama Perusahaan
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      NOMOR REKENING
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                        {vm.company.bank_account || "—"}
                      </Typography>
                      {vm.company.bank_account && (
                        <Tooltip title={copiedBank ? "Tersalin!" : "Salin nomor rekening"}>
                          <IconButton size="small" onClick={() => copyToClipboard(vm.company.bank_account)}>
                            {copiedBank ? <Check size={14} color="green" /> : <Copy size={14} />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      ATAS NAMA
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {vm.company.bank_account_name || vm.company.name || "—"}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            )}
          </Paper>
        )}

        {/* ── TAB 4: Dokumen Legalitas ── */}
        {vm.activeTab === "documents" && (
          <Stack spacing={3}>
            {/* Status Guide Alert */}
            {vm.company.status === "starter" && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 700 }}>Akun Starter: Unggah Dokumen untuk Upgrade Full Access</AlertTitle>
                Perusahaan Anda saat ini berstatus <strong>Starter</strong>. Silakan unggah dokumen legalitas (NPWP, NIB, atau SIUP) di bawah ini. Akun akan otomatis diajukan ke admin untuk verifikasi agar dapat membuat tender dan bertransaksi.
              </Alert>
            )}
            {vm.company.status === "pending" && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 700 }}>Dokumen Sedang Ditinjau Admin</AlertTitle>
                Berkas legalitas Anda telah diterima dan sedang dalam antrean review oleh tim compliance Huntr.
              </Alert>
            )}
            {vm.company.status === "approved" && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <AlertTitle sx={{ fontWeight: 700 }}>Perusahaan Terverifikasi (Full Access)</AlertTitle>
                Semua dokumen legalitas telah disetujui. Anda dapat menambahkan berkas pembaruan kapan saja di bawah ini.
              </Alert>
            )}

            {/* Upload Notifications */}
            {vm.docSuccess && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {vm.docSuccess}
              </Alert>
            )}
            {vm.docError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {vm.docError}
              </Alert>
            )}

            {/* Upload Card */}
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Tambah Dokumen Legalitas Baru
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Format file yang didukung: PDF, JPG, PNG, DOCX (Maksimal 10MB per berkas).
              </Typography>

              <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="doc-type-label">Jenis Dokumen *</InputLabel>
                    <Select
                      labelId="doc-type-label"
                      label="Jenis Dokumen *"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      <MenuItem value="NPWP">NPWP (Nomor Pokok Wajib Pajak)</MenuItem>
                      <MenuItem value="NIB">NIB (Nomor Induk Berusaha)</MenuItem>
                      <MenuItem value="SIUP">SIUP (Surat Izin Usaha Perdagangan)</MenuItem>
                      <MenuItem value="Akta Perusahaan">Akta Pendirian Perusahaan</MenuItem>
                      <MenuItem value="KTP Direktur">KTP Direktur / PIC</MenuItem>
                      <MenuItem value="SK Kemenkumham">SK Kemenkumham</MenuItem>
                      <MenuItem value="Rekening Koran">Rekening Koran / Bukti Bank</MenuItem>
                      <MenuItem value="SPPKP">SPPKP (Pengusaha Kena Pajak)</MenuItem>
                      <MenuItem value="Other">Dokumen Lainnya</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        vm.handleUploadDocument(file, docType);
                        e.target.value = "";
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={vm.docUploading ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
                    disabled={vm.docUploading}
                    onClick={() => docFileInputRef.current?.click()}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: "#0f172a",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    {vm.docUploading ? "Mengunggah Dokumen..." : "Pilih File & Unggah Sekarang"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Document List */}
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2.5, sm: 3.5 }, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Daftar Dokumen Legalitas ({vm.company.documents?.length || 0})
              </Typography>

              {!vm.company.documents || vm.company.documents.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <FileText size={36} color="gray" style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Belum Ada Dokumen yang Diunggah
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unggah NPWP, NIB, atau SIUP di atas untuk melengkapi berkas legalitas bisnis Anda.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {vm.company.documents.map((doc: any) => {
                    const docUrl = doc.url || doc.file_path ? getAssetUrl(doc.url || doc.file_path) : "#";
                    const isDeleting = vm.docDeletingId === doc.id;

                    return (
                      <Paper
                        key={doc.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: "#f1f5f9",
                              color: "#334155",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={20} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                              {doc.name || doc.type}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                              <Chip label={doc.type || "Dokumen"} size="small" sx={{ height: 20, fontSize: "0.65rem" }} />
                              {doc.created_at && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(doc.created_at).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            startIcon={<ExternalLink size={14} />}
                            sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.75rem" }}
                          >
                            Buka
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isDeleting}
                            onClick={() => vm.handleDeleteDocument(doc.id)}
                          >
                            {isDeleting ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />}
                          </IconButton>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Stack>
        )}

        {/* ── TAB 5: Performa & Aktivitas ── */}
        {vm.activeTab === "performance" && (
          <Stack spacing={3}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: "center", bgcolor: "background.paper" }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "#f1f5f9", color: "#334155", mx: "auto", mb: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={22} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {vm.company.type === "buyer" ? vm.company.stats?.total_pr || 0 : vm.company.stats?.total_proposals || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {vm.company.type === "buyer" ? "TOTAL PERMINTAAN PENGADAAN" : "TOTAL PENAWARAN TENDER"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: "center", bgcolor: "background.paper" }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#047857", mx: "auto", mb: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={22} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#047857" }}>
                    {vm.company.type === "buyer" ? vm.company.stats?.approved_pr || 0 : vm.company.stats?.won_proposals || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {vm.company.type === "buyer" ? "PERMINTAAN DISETUJUI" : "KONTRAK DIMENANGKAN"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: "center", bgcolor: "background.paper" }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "rgba(59, 130, 246, 0.12)", color: "#1d4ed8", mx: "auto", mb: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={22} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1d4ed8" }}>
                    {winRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    TINGKAT KEBERHASILAN (WIN RATE)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
                Ringkasan Rekam Jejak
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Perusahaan terdaftar di platform Huntr sejak{" "}
                <strong>
                  {new Date(vm.company.created_at).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
                .{" "}
                {vm.company.type === "buyer"
                  ? `Hingga saat ini telah memproses ${vm.company.stats?.total_pr || 0} purchase request dengan ${vm.company.stats?.approved_pr || 0} di antaranya telah disetujui untuk pengadaan.`
                  : `Telah berpartisipasi dalam ${vm.company.stats?.total_proposals || 0} tender dan memenangkan ${vm.company.stats?.won_proposals || 0} pesanan kerja dengan tingkat keberhasilan sebesar ${winRate}%.`}
              </Typography>
            </Paper>
          </Stack>
        )}

        {/* ── TAB 6: Tim & Pengguna ── */}
        {vm.activeTab === "team" && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, bgcolor: "background.paper" }}>
            <TeamManagement
              company={vm.company}
              teamMembers={vm.teamMembers}
              teamLoading={vm.teamLoading}
              isInviting={vm.isInviting}
              inviteForm={vm.inviteForm}
              setInviteForm={vm.setInviteForm}
              handleInviteUser={vm.handleInviteUser}
              inviteError={vm.inviteError}
              inviteSuccess={vm.inviteSuccess}
              onRoleChanged={() => vm.fetchTeamMembers && vm.fetchTeamMembers(vm.company?.id)}
            />
          </Paper>
        )}

        {/* ── TAB 7: Hak Akses & Approval ── */}
        {vm.activeTab === "access" && (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, sm: 3 }, bgcolor: "background.paper" }}>
            <AccessApprovalManagement company={vm.company} />
          </Paper>
        )}
      </Box>
    </Layout>
  );
}
