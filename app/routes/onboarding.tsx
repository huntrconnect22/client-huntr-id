import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { 
  Building2, MapPin, CreditCard, FileText, UploadCloud, 
  LogIn, ChevronRight, ChevronLeft, Loader2, AlertCircle, ScrollText
} from "lucide-react";

// --- MVVM: ViewModel ---
import { useOnboardingViewModel } from "../features/onboarding/hooks/useOnboardingViewModel";

// --- UI: Components ---
import { StepTracker } from "../features/onboarding/components/StepTracker";
import { SlideContent } from "../features/onboarding/components/SlideContent";
import ThemeToggle from "../components/ThemeToggle";

// --- Config: Metadata ---
const TOTAL_SLIDES = 7;
const STEP_META = [
  { id: 1, icon: Building2,   label: "Profil",    color: "#f97316" },
  { id: 2, icon: MapPin,      label: "Lokasi",    color: "#f59e0b" },
  { id: 3, icon: CreditCard,  label: "Bank",      color: "#fbbf24" },
  { id: 4, icon: FileText,    label: "Documents", color: "#f59e0b" },
  { id: 5, icon: UploadCloud, label: "Data",      color: "#10b981" },
  { id: 6, icon: ScrollText,  label: "Ketentuan", color: "#8b5cf6" },
  { id: 7, icon: LogIn,       label: "Finish",    color: "#fb923c" },
];

/**
 * Onboarding Route Component
 * 
 * Tanggung jawab: Entry point untuk fitur onboarding.
 * Mengoordinasikan ViewModel, StepTracker, dan SlideContent.
 */
export default function Onboarding() {
  const vm = useOnboardingViewModel();
  const navigate = useNavigate();
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("NPWP");

  /**
   * Check if country is Indonesia
   */
  const isIndonesia = (): boolean => {
    const country = vm.formData.country?.toUpperCase();
    return country === "ID" || country === "INDONESIA";
  };

  /**
   * Local validation before moving to next slide
   */
  const validateCurrentSlide = (): string | null => {
    if (vm.slide === 1) {
      if (!vm.formData.company_name.trim()) return "Nama perusahaan wajib diisi.";
      if (!vm.formData.type) return "Pilih tipe bisnis (Buyer/Vendor).";
      if (!vm.formData.industry_type.trim()) return "Jenis industri wajib dipilih.";
      // NPWP verification only required for Indonesia
      if (isIndonesia() && !vm.npwpVerifiedData) {
        return "Harap verifikasi NPWP sebelum melanjutkan.";
      }
    }
    if (vm.slide === 4) {
      // Cek ada dokumen yang diupload
      if (vm.uploadedDocs.length === 0) {
        return "Harap upload minimal satu dokumen perusahaan (NPWP, KTP Direktur, Akta Perusahaan, dll).";
      }
      
      // Cek apakah semua dokumen memiliki file_path
      const docsWithoutFilePath = vm.uploadedDocs.filter((d: any) => !d.file_path);
      if (docsWithoutFilePath.length > 0) {
        return `Beberapa dokumen gagal diupload (${docsWithoutFilePath.length} dokumen). Silahkan hapus dan upload ulang dokumen tersebut.`;
      }
    }
    if (vm.slide === 5) {
      if (!vm.selectedFile) {
        return "Pilih file CSV atau Excel untuk diimport.";
      }
      if (vm.isParsingFile) {
        return "Tunggu proses parsing file selesai terlebih dahulu.";
      }
      if (!vm.parsedData || vm.parsedData.totalRows === 0) {
        return "File yang dipilih kosong atau tidak dapat diparsing. Harap pilih file dengan data yang valid.";
      }
      if (vm.parsedData.validRowsCount === 0) {
        return "Tidak ada baris data valid yang ditemukan dalam file ini.";
      }
    }
    if (vm.slide === 6 && !vm.termsAccepted) {
      return "Anda harus menyetujui Ketentuan Penggunaan Platform HUNTR untuk melanjutkan.";
    }
    return null;
  };

  /**
   * Navigate to next slide
   */
  const nextSlide = async () => {
    const err = validateCurrentSlide();
    if (err) {
      vm.setError(err);
      return;
    }
    
    vm.setError(null);
    if (vm.slide === 6) {
      try {
        await vm.handleCompanySubmit();
      } catch (err: any) {
        console.error("Submission failed:", err);
      }
      return;
    }
    
    if (vm.slide < TOTAL_SLIDES) {
      vm.setSlide(p => p + 1);
    }
  };

  /**
   * Handle action to enter workspace after successful onboarding
   */
  const handleLoginAsCompany = () => {
    if (!vm.selectedCompany) return;
    localStorage.setItem("active_company", JSON.stringify(vm.selectedCompany));
    vm.resetForm();
    const slug = vm.selectedCompany.slug || vm.selectedCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/${slug}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-4 md:p-8 relative bg-[var(--ui-bg-page-grad)]">
      
      {/* Visual Decor: Background ambient blur matching AuthLayout */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      {/* Branding Header */}
      <header className="sticky top-0 mb-6 w-full max-w-4xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/img/logo/sidebar.png" 
            alt="Huntr Logo" 
            className="w-32 h-8 md:w-36 md:h-9 object-contain"
          />
          <div className="hidden sm:block pl-2 border-l border-[var(--ui-border)]">
            <div className="font-extrabold text-sm text-[var(--ui-text-primary)] tracking-tight">Huntr.id</div>
            <div className="text-[9px] text-orange-400 tracking-widest font-bold uppercase">Company Onboarding</div>
          </div>
        </div>
        
        <ThemeToggle />
      </header>

      <main className="w-full max-w-4xl relative z-10 my-auto">
        {/* Step Tracker UI */}
        <StepTracker steps={STEP_META} currentSlide={vm.slide} />

        {/* Main Card Container */}
        <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Top Progress Bar */}
          <div 
            className="h-1 transition-all duration-500" 
            style={{ 
              background: `linear-gradient(90deg, ${STEP_META[Math.min(vm.slide - 1, 6)].color}, ${STEP_META[Math.min(vm.slide - 1, 6)].color}80)`,
              width: `${(vm.slide / TOTAL_SLIDES) * 100}%` 
            }} 
          />
          
          <div className="p-6 md:p-8">
            {/* Global Error Display */}
            {vm.error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 text-red-400 text-sm mb-6 flex items-center gap-2.5 animate-shake">
                <AlertCircle size={17} className="shrink-0" /> <span>{vm.error}</span>
              </div>
            )}

            {/* Render Slide Content */}
            <SlideContent 
              vm={vm} 
              docType={docType} 
              setDocType={setDocType} 
              docInputRef={docInputRef}
              handleLoginAsCompany={handleLoginAsCompany}
            />

            {/* Navigation Buttons */}
            <footer className="mt-8 md:mt-10 pt-6 border-t border-[var(--ui-border)] flex items-center justify-between gap-4">
              {vm.slide > 1 && vm.slide < 7 && (
                <button 
                  onClick={() => vm.setSlide((p: any) => p - 1)} 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:border-orange-500/30 font-semibold text-sm transition-all"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <div className="flex-1" />
              {vm.slide < 7 && (
                <button 
                  onClick={nextSlide} 
                  disabled={vm.isLoading} 
                  className="flex items-center gap-2 px-7 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-500/20"
                >
                  {vm.isLoading ? <Loader2 className="animate-spin" size={16} /> : vm.slide === 6 ? "Setuju & Lanjutkan" : "Next"} 
                  {!vm.isLoading && <ChevronRight size={16} />}
                </button>
              )}
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
