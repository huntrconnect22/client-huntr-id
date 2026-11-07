import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Stack,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import { 
  Building2,
  MapPin,
  ScrollText,
  LogIn,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// --- MVVM: ViewModel ---
import { useOnboardingViewModel } from "~/features/onboarding/hooks/useOnboardingViewModel";
import { useOnboardingPricing } from "~/features/onboarding/hooks/useOnboardingPricing";

// --- UI: Components ---
import { StepTracker } from "~/features/onboarding/components/StepTracker";
import { SlideContent } from "~/features/onboarding/components/SlideContent";
import ThemeToggle from "~/components/ThemeToggle";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { useLanguage } from "~/context/LanguageContext";

// --- Config: Express Onboarding ---
const SUCCESS_SLIDE = 4;
const STEP_ICONS = [
  { id: 1, icon: Building2,  color: "#f97316", label: "Profil Perusahaan" },
  { id: 2, icon: MapPin,     color: "#3b82f6", label: "Lokasi & Kontak" },
  { id: 3, icon: ScrollText, color: "#8b5cf6", label: "Konfirmasi & Biaya" },
  { id: 4, icon: LogIn,      color: "#10b981", label: "Workspace Siap" },
];

/**
 * Onboarding Route Component (Express Onboarding)
 * 
 * Tanggung jawab: Entry point untuk fitur onboarding kilat (100% Pure MUI).
 */
export default function Onboarding() {
  const { t } = useLanguage();
  const theme = useTheme();
  const vm = useOnboardingViewModel();
  const isVendor = vm.formData.type === "vendor";
  const completionSlide = isVendor ? 2 : 3;
  const pricing = useOnboardingPricing(vm.slide === 3 && vm.formData.type === "buyer");
  const navigate = useNavigate();

  useEffect(() => { 
    vm.setTermsAccepted(false); 
  }, [vm.slide, vm.formData.type]);

  const stepMeta = isVendor
    ? STEP_ICONS.filter((step) => step.id !== 3)
    : STEP_ICONS;
  const activeStep = stepMeta.find((step) => step.id === vm.slide) ?? stepMeta.at(-1)!;
  const activeStepIndex = stepMeta.findIndex((step) => step.id === vm.slide);
  const progressPercent = ((activeStepIndex + 1) / stepMeta.length) * 100;

  /**
   * Local validation before moving to next slide.
   */
  const validateCurrentSlide = (): string | null => {
    if (vm.slide === 1) {
      if (!vm.formData.type) return "Silakan pilih peran bisnis (Buyer atau Vendor).";
      if (!vm.formData.company_name?.trim()) return "Nama resmi perusahaan wajib diisi.";
      if (!vm.formData.industry_type?.trim()) return "Silakan pilih jenis bidang industri.";
    }
    if (vm.slide === 2) {
      if (!vm.formData.city?.trim() && !vm.formData.address?.trim()) {
        return "Masukkan kota atau alamat operasional perusahaan Anda.";
      }
    }
    if (vm.slide === 3 && !isVendor && !vm.termsAccepted) {
      return "Anda harus menyetujui syarat & ketentuan layanan untuk mengaktifkan workspace.";
    }
    return null;
  };

  /**
   * Navigate to next slide or trigger final registration
   */
  const nextSlide = async () => {
    const err = validateCurrentSlide();
    if (err) {
      vm.setError(err);
      return;
    }
    
    vm.setError(null);
    if (vm.slide === completionSlide) {
      try {
        await vm.handleCompanySubmit();
      } catch (err: any) {
        console.error("Submission failed:", err);
      }
      return;
    }
    
    if (vm.slide < completionSlide) {
      vm.setSlide((p: number) => p + 1);
    }
  };

  /**
   * Handle action to enter workspace after successful onboarding
   */
  const handleLoginAsCompany = async () => {
    if (!vm.selectedCompany) return;
    localStorage.setItem("active_company", JSON.stringify(vm.selectedCompany));

    try {
      const { switchActiveCompany } = await import("~/lib/api/company");
      await switchActiveCompany(vm.selectedCompany.id);
    } catch (e) {
      console.warn("Failed to switch active company on server, continuing locally:", e);
    }

    vm.resetForm();
    navigate("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: { xs: "flex-start", md: "center" },
        bgcolor: "background.default",
        p: { xs: 2, sm: 3, md: 5 },
        position: "relative",
      }}
    >
      {/* Ambient background decoration */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            left: "-5%",
            width: 450,
            height: 450,
            borderRadius: "50%",
            bgcolor: (theme) => `${theme.palette.primary.main}12`,
            filter: "blur(120px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-10%",
            right: "-5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            bgcolor: "rgba(99, 102, 241, 0.08)",
            filter: "blur(100px)",
          }}
        />
      </Box>

      {/* Branding Header */}
      <Box
        component="header"
        sx={{
          width: "100%",
          maxWidth: 820,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
          mb: { xs: 2.5, md: 4 },
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            component="img"
            src="/assets/img/logo/sidebar.png"
            alt="Huntr Logo"
            sx={{
              height: { xs: 28, md: 34 },
              width: "auto",
              objectFit: "contain",
            }}
          />
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              pl: 1.5,
              borderLeft: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              Huntr.id
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "primary.main",
                textTransform: "uppercase",
                fontSize: 9,
              }}
            >
              Quick Onboarding
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </Stack>
      </Box>

      {/* Main Form Content */}
      <Container
        maxWidth="md"
        disableGutters
        sx={{
          maxWidth: 820,
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Step Tracker UI */}
        <StepTracker steps={stepMeta} currentSlide={vm.slide} />

        {/* Main Card Container */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 10px 40px rgba(0,0,0,0.4)"
                : "0 10px 35px rgba(0,0,0,0.06)",
            bgcolor: "background.paper",
          }}
        >
          {/* Top Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 5,
              bgcolor: (theme) => `${theme.palette.primary.main}1A`,
              "& .MuiLinearProgress-bar": {
                bgcolor: activeStep.color || "primary.main",
                transition: "transform 0.4s ease",
              },
            }}
          />

          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            {/* Global Error Alert */}
            {vm.error && (
              <Alert severity="error" sx={{ mb: 3.5, borderRadius: 2.5 }}>
                {vm.error}
              </Alert>
            )}

            {/* Render Slide Content */}
            <SlideContent
              vm={vm}
              pricing={pricing}
              handleLoginAsCompany={handleLoginAsCompany}
            />

            {/* Navigation Buttons (Only shown for steps 1 - 3) */}
            {vm.slide < SUCCESS_SLIDE && (
              <Box sx={{ mt: 5 }}>
                <Divider sx={{ mb: 3 }} />
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  {vm.slide > 1 ? (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={() => vm.setSlide((p: number) => p - 1)}
                      startIcon={<ChevronLeft size={18} />}
                      sx={{
                        borderRadius: 2.5,
                        px: 3,
                        py: 1.25,
                        fontWeight: 700,
                        textTransform: "none",
                      }}
                    >
                      Kembali
                    </Button>
                  ) : (
                    <Box />
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={nextSlide}
                    disabled={vm.isLoading}
                    endIcon={
                      !vm.isLoading && <ChevronRight size={18} />
                    }
                    startIcon={
                      vm.isLoading ? <CircularProgress size={18} color="inherit" /> : undefined
                    }
                    sx={{
                      borderRadius: 2.5,
                      px: { xs: 3, sm: 4 },
                      py: 1.25,
                      fontWeight: 800,
                      textTransform: "none",
                      fontSize: 14,
                      boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}40`,
                    }}
                  >
                    {vm.isLoading ? (
                      "Menyiapkan Workspace…"
                    ) : vm.slide === completionSlide ? (
                      "Buat Workspace & Masuk"
                    ) : (
                      "Lanjutkan"
                    )}
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
