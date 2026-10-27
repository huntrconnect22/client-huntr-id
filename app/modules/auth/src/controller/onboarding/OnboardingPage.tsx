import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Building2, MapPin, ScrollText, LogIn, 
  ChevronRight, ChevronLeft, Loader2, AlertCircle, Sparkles
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
 * Tanggung jawab: Entry point untuk fitur onboarding kilat.
 * 3 Langkah Cepat tanpa birokrasi dokumen di awal (Starter Tier Instant Access).
 */
export default function Onboarding() {
  const { t } = useLanguage();
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
    const slug = vm.selectedCompany.slug || vm.selectedCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-4 md:p-8 relative bg-[var(--ui-bg-page-grad)]">
      
      {/* Visual Decor: Background ambient blur matching AuthLayout */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* Branding Header */}
      <header className="sticky top-0 mb-6 w-full max-w-3xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/img/logo/sidebar.png" 
            alt="Huntr Logo" 
            className="w-32 h-8 md:w-36 md:h-9 object-contain"
          />
          <div className="hidden sm:block pl-2 border-l border-[var(--ui-border)]">
            <div className="font-extrabold text-sm text-[var(--ui-text-primary)] tracking-tight">Huntr.id</div>
            <div className="text-[9px] text-orange-400 tracking-widest font-bold uppercase">Quick Onboarding</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="w-full max-w-3xl relative z-10 my-auto">
        {/* Step Tracker UI */}
        <StepTracker steps={stepMeta} currentSlide={vm.slide} />

        {/* Main Card Container */}
        <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Top Progress Bar */}
          <div 
            className="h-1.5 transition-all duration-500" 
            style={{ 
              background: `linear-gradient(90deg, ${activeStep.color}, ${activeStep.color}80)`,
              width: `${progressPercent}%`
            }} 
          />
          
          <div className="p-6 md:p-8">
            {/* Global Error Display */}
            {vm.error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-red-400 text-sm mb-6 flex items-center gap-3 animate-shake">
                <AlertCircle size={18} className="shrink-0" /> <span>{vm.error}</span>
              </div>
            )}

            {/* Render Slide Content */}
            <SlideContent 
              vm={vm} 
              pricing={pricing}
              handleLoginAsCompany={handleLoginAsCompany}
            />

            {/* Navigation Buttons (Only shown for steps 1 - 3) */}
            {vm.slide < SUCCESS_SLIDE && (
              <footer className="mt-8 pt-6 border-t border-[var(--ui-border)] flex items-center justify-between gap-4">
                {vm.slide > 1 ? (
                  <button 
                    onClick={() => vm.setSlide((p: number) => p - 1)} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:border-orange-500/30 font-semibold text-sm transition-all"
                  >
                    <ChevronLeft size={16} /> Kembali
                  </button>
                ) : (
                  <div />
                )}

                <button 
                  onClick={nextSlide} 
                  disabled={vm.isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/25"
                >
                  {vm.isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Menyiapkan Workspace…
                    </>
                  ) : vm.slide === completionSlide ? (
                    <>
                      Buat Workspace & Masuk <ChevronRight size={16} />
                    </>
                  ) : (
                    <>
                      Lanjutkan <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </footer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
