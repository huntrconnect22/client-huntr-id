import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { OnboardingController } from "../services/onboardingController";
import type { CompanyFormData, UploadedDoc, NpwpVerifiedData } from "../types";

/**
 * useOnboardingViewModel
 * 
 * Tanggung jawab: Mengelola state UI (Presentation Logic).
 * Menghubungkan View dengan Controller sesuai pola MVVM.
 */
export const useOnboardingViewModel = () => {
  const navigate = useNavigate();

  // --- State: Navigasi & Identitas ---
  const [slide, setSlide] = useState(1);
  const [user, setUser] = useState<any>(null);

  // --- State: Status Proses ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State: Form Data ---
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: "", tax_id: "", country: "ID", email: "", phone: "",
    type: "buyer", industry_type: "", about: "", keywords: "", region: "",
    provincy_country: "", regency: "", city: "",
    zip_code: "", address: "", bank_name: "", bank_account: "",
    bank_account_name: "",
    hq_addresses: [""],
  });

  // --- State: Verifikasi & Dokumen ---
  const [isVerifyingNpwp, setIsVerifyingNpwp] = useState(false);
  const [npwpVerifiedData, setNpwpVerifiedData] = useState<NpwpVerifiedData | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- State: Terms & Conditions ---
  const [termsAccepted, setTermsAccepted] = useState(false);

  // --- State: Hasil Akhir ---
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // --- Reset Form State ---
  const resetForm = useCallback(() => {
    setSlide(1);
    setFormData({
      company_name: "", tax_id: "", email: user?.email || "", phone: user?.whatsapp || "",
      type: "buyer", industry_type: "", about: "", keywords: "", region: "",
      provincy_country: "", regency: "", city: "",
      zip_code: "", address: "", bank_name: "", bank_account: "",
      bank_account_name: "", country: "",
      hq_addresses: [""],
    });
    setNpwpVerifiedData(null);
    setUploadedDocs([]);
    setSelectedFile(null);
  }, [user]);

  // --- Inisialisasi Sesi User ---
  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (!session) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(session);
    setUser(u);
    setFormData(prev => ({
      ...prev,
      email: u.email || prev.email,
      phone: u.whatsapp || prev.phone
    }));
  }, [navigate]);

  /**
   * Mengupdate field form secara dinamis
   */
  const updateField = useCallback((k: keyof CompanyFormData, v: string) => {
    setFormData(prev => ({ ...prev, [k]: v }));
  }, []);

  /**
   * Mengupdate HQ Addresses array secara dinamis
   */
  const updateHqAddress = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newAddresses = [...prev.hq_addresses];
      newAddresses[index] = value;
      return { ...prev, hq_addresses: newAddresses };
    });
  }, []);

  /**
   * Menambah HQ Address baru
   */
  const addHqAddress = useCallback(() => {
    setFormData(prev => ({ ...prev, hq_addresses: [...prev.hq_addresses, ""] }));
  }, []);

  /**
   * Menghapus HQ Address
   */
  const removeHqAddress = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      hq_addresses: prev.hq_addresses.filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Melakukan verifikasi NPWP melalui Controller
   */
  const handleVerifyNpwp = async () => {
    setIsVerifyingNpwp(true);
    setError(null);
    try {
      const data = await OnboardingController.verifyTaxId(formData.tax_id, formData.country);
      setNpwpVerifiedData(data);
      
      // Auto-fill form berdasarkan data NPWP yang valid
      // Data NPWP sudah memiliki semua field yang dibutuhkan
      setFormData(prev => ({
        ...prev,
        company_name: prev.company_name || data.nama || "",
        email: prev.email || data.email || user?.email || "",
        phone: prev.phone || data.phone || user?.whatsapp || "",
        industry_type: prev.industry_type || data.industry_type || "",
        // Address fields
        address: prev.address || data.alamat || "",
        provincy_country: prev.provincy_country || data.provincy_country || "",
        city: prev.city || data.city || "",
        regency: prev.regency || data.regency || "",
        zip_code: prev.zip_code || data.zip_code || "",
        // Banking fields
        bank_name: prev.bank_name || data.bank_name || "",
        bank_account: prev.bank_account || data.bank_account || "",
        bank_account_name: prev.bank_account_name || data.bank_account_name || "",
        keywords: prev.keywords || (Array.isArray((data as any).keywords) ? (data as any).keywords.join(", ") : ((data as any).keywords || "")),
        // Country tetap sama (tidak diubah dari NPWP)
        country: prev.country || "ID", // Default ke Indonesia jika belum diisi
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifyingNpwp(false);
    }
  };

  /**
   * Menangani upload dokumen legal
   */
  const handleDocUpload = async (file: File, docType: string) => {
    setIsUploadingDoc(true);
    setError(null);
    try {
      const doc = await OnboardingController.uploadLegalDoc(file, docType);
      setUploadedDocs(prev => [...prev, doc]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  /**
   * Finalisasi proses onboarding
   */
  const handleCompanySubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { company, allCompanies } = await OnboardingController.completeOnboarding({
        formData, user, uploadedDocs, selectedFile
      });

      setCompanies(allCompanies);
      setSelectedCompany(allCompanies[0] || company);
      setSlide(7); // Pindah ke slide sukses
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API Public ViewModel ---
  return {
    // State
    slide, setSlide,
    formData,
    isLoading, error, setError,
    isVerifyingNpwp, npwpVerifiedData,
    uploadedDocs, setUploadedDocs,
    isUploadingDoc,
    selectedFile, setSelectedFile,
    companies, selectedCompany, setSelectedCompany,
    termsAccepted, setTermsAccepted,
    user,

    // Actions
    updateField,
    updateHqAddress,
    addHqAddress,
    removeHqAddress,
    handleVerifyNpwp,
    handleDocUpload,
    handleCompanySubmit,
    resetForm,
  };
};
