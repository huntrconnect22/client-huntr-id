import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import * as XLSX from "xlsx";
import { OnboardingController } from "../services/onboardingController";
import { getMyCompanies } from "../../../lib/api/company";
import type { CompanyFormData, UploadedDoc, NpwpVerifiedData } from "../types";

export interface ParsedDataState {
  headers: string[];
  rows: any[];
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  summary: {
    totalPoCount?: number;
    totalItems?: number;
    totalAmount?: number;
    categoriesCount?: number;
  };
}

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
    type: "", industry_type: "", about: "", keywords: "", region: "",
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
  
  // --- State: Import Data & Parsing (Step 5) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedDataState | null>(null);

  // --- State: Import Status Progress Bar ---
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusText, setImportStatusText] = useState("");

  // --- State: Terms & Conditions ---
  const [termsAccepted, setTermsAccepted] = useState(false);

  // --- State: Hasil Akhir ---
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // --- State: NPWP Conflict Detection ---
  const [npwpConflict, setNpwpConflict] = useState<null | { vendor: any; buyer: any }>(null);

  // --- Reset Form State ---
  const resetForm = useCallback(() => {
    setSlide(1);
    setFormData({
      company_name: "", tax_id: "", email: user?.email || "", phone: user?.whatsapp || "",
      type: "", industry_type: "", about: "", keywords: "", region: "",
      provincy_country: "", regency: "", city: "",
      zip_code: "", address: "", bank_name: "", bank_account: "",
      bank_account_name: "", country: "",
      hq_addresses: [""],
    });
    setNpwpVerifiedData(null);
    setUploadedDocs([]);
    setSelectedFile(null);
    setParsedData(null);
    setIsParsingFile(false);
    setParseProgress(0);
    setIsImporting(false);
    setImportProgress(0);
    setImportStatusText("");
  }, [user]);

  const [searchParams] = useSearchParams();

  // --- Inisialisasi Sesi User ---
  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (!session) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(session);
    setUser(u);

    const paramType = searchParams.get("type");         // "buyer" | "vendor"
    const fromCompanyId = searchParams.get("from_company"); // existing company id

    // Apply URL-specified type lock
    const initialUpdates: Partial<CompanyFormData> = {
      email: u.email || "",
      phone: u.whatsapp || "",
    };
    if (paramType === "buyer" || paramType === "vendor") {
      initialUpdates.type = paramType;
    }

    if (fromCompanyId) {
      // Pre-fill from source company
      getMyCompanies()
        .then((data) => {
          const list: any[] = Array.isArray(data?.companies) ? data.companies : [];
          const src = list.find((c) => c.id === fromCompanyId);
          if (src) {
            setFormData(prev => ({
              ...prev,
              ...initialUpdates,
              company_name: src.name || "",
              tax_id: src.tax_id || "",
              country: src.country || "ID",
              email: src.email || u.email || "",
              phone: src.phone || u.whatsapp || "",
              industry_type: src.industry_type || "",
              address: src.address || "",
              provincy_country: src.provincy_country || "",
              city: src.city || "",
              regency: src.regency || "",
              zip_code: src.zip_code || "",
              bank_name: src.bank_name || "",
              bank_account: src.bank_account || "",
              bank_account_name: src.bank_account_name || "",
              region: src.region || "",
            }));

            // Only pre-populate NPWP verified data if source company is actually approved (not rejected/pending)
            if (src.tax_id && src.status === "approved") {
              setNpwpVerifiedData({
                npwp: src.tax_id,
                nama: src.name || "",
                alamat: src.address || "",
                statusWp: "VALID",
                statusSpt: "VALID",
                city: src.city,
                regency: src.regency,
                zip_code: src.zip_code,
                provincy_country: src.provincy_country,
                bank_name: src.bank_name,
                bank_account: src.bank_account,
                bank_account_name: src.bank_account_name,
                industry_type: src.industry_type,
              });
            }

            // If source company already has documents and is approved, copy them over
            if (src.status === "approved" && Array.isArray(src.documents) && src.documents.length > 0) {
              const copiedDocs = src.documents.map((d: any) => ({
                name: d.name || d.type || "Document",
                type: d.type || "Document",
                file_path: d.file_path,
              })).filter((d: any) => !!d.file_path);

              if (copiedDocs.length > 0) {
                setUploadedDocs(copiedDocs);
              }
            }
          } else {
            setFormData(prev => ({ ...prev, ...initialUpdates }));
          }
        })
        .catch(() => {
          setFormData(prev => ({ ...prev, ...initialUpdates }));
        });
    } else {
      setFormData(prev => ({ ...prev, ...initialUpdates }));
    }
  }, [navigate, searchParams]);

  /**
   * Mengupdate field form secara dinamis
   */
  const updateField = useCallback((k: keyof CompanyFormData, v: string) => {
    setFormData(prev => ({ ...prev, [k]: v }));

    // Realtime NPWP conflict check: fire when tax_id has enough digits
    if (k === "tax_id") {
      const normalized = v.replace(/[^a-zA-Z0-9]/g, "");
      if (normalized.length >= 15) {
        getMyCompanies()
          .then((data) => {
            const list: any[] = Array.isArray(data?.companies) ? data.companies : [];
            const match = (c: any) => {
              const norm = (c.tax_id || "").replace(/[^a-zA-Z0-9]/g, "");
              return norm === normalized;
            };
            const vendor = list.find((c) => match(c) && c.type === "vendor") ?? null;
            const buyer  = list.find((c) => match(c) && c.type === "buyer")  ?? null;
            setNpwpConflict((vendor || buyer) ? { vendor, buyer } : null);
          })
          .catch(() => {/* silent */});
      } else {
        setNpwpConflict(null);
      }
    }
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
      
      setFormData(prev => ({
        ...prev,
        company_name: prev.company_name || data.nama || "",
        email: prev.email || data.email || user?.email || "",
        phone: prev.phone || data.phone || user?.whatsapp || "",
        industry_type: prev.industry_type || data.industry_type || "",
        address: prev.address || data.alamat || "",
        provincy_country: prev.provincy_country || data.provincy_country || "",
        city: prev.city || data.city || "",
        regency: prev.regency || data.regency || "",
        zip_code: prev.zip_code || data.zip_code || "",
        bank_name: prev.bank_name || data.bank_name || "",
        bank_account: prev.bank_account || data.bank_account || "",
        bank_account_name: prev.bank_account_name || data.bank_account_name || "",
        keywords: prev.keywords || (Array.isArray((data as any).keywords) ? (data as any).keywords.join(", ") : ((data as any).keywords || "")),
        country: prev.country || "ID",
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
   * Menangani pemilihn & parsing file data (Excel/CSV) untuk Step 5
   */
  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    if (!file) {
      setParsedData(null);
      setParseProgress(0);
      setIsParsingFile(false);
      return;
    }

    setIsParsingFile(true);
    setParseProgress(15);
    setError(null);

    try {
      // Delay kecil agar animasi progress bar terlihat mulus
      await new Promise(r => setTimeout(r, 200));
      setParseProgress(40);

      const buffer = await file.arrayBuffer();
      setParseProgress(70);

      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
      setParseProgress(90);

      if (!rawJson || rawJson.length === 0) {
        throw new Error("File Excel/CSV kosong atau tidak dapat dibaca.");
      }

      // Ambil seluruh nama kolom unik
      const headers = Array.from(
        new Set(rawJson.flatMap(row => Object.keys(row)))
      );

      const rows: Array<{ _id: number; _isValid: boolean; [key: string]: any }> = rawJson.map((row, idx) => {
        const keys = Object.keys(row);
        const hasValue = keys.some(k => row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "");
        return {
          _id: idx + 1,
          _isValid: hasValue,
          ...row
        };
      });

      const totalRows = rows.length;
      const validRows = rows.filter(r => r._isValid);

      let summary: any = {};
      if (formData.type === "buyer") {
        const poNumbers = new Set(
          rows.map(r => {
            return r['Order No'] || r['Order no'] || r['PO Number'] || r['PO number'] || r['order_no'] || '';
          }).filter(Boolean)
        );

        let totalAmount = 0;
        rows.forEach(r => {
          const rawAmt = r['Amount in original currency'] || r['amount'] || r['Total Amount'] || r['total_amount'] || 0;
          const amt = parseFloat(String(rawAmt).replace(/[^\d.-]/g, ''));
          if (!isNaN(amt)) totalAmount += amt;
        });

        summary = {
          totalPoCount: poNumbers.size,
          totalItems: totalRows,
          totalAmount
        };
      } else {
        const itemCodes = new Set(
          rows.map(r => r['Inventory Code'] || r['inventory code'] || r['Item Code'] || r['item_code'] || '').filter(Boolean)
        );
        const categories = new Set(
          rows.map(r => r['Category'] || r['category'] || r['Purchase Category'] || '').filter(Boolean)
        );

        summary = {
          totalItems: itemCodes.size || totalRows,
          categoriesCount: categories.size
        };
      }

      await new Promise(r => setTimeout(r, 150));
      setParseProgress(100);
      setParsedData({
        headers,
        rows,
        totalRows,
        validRowsCount: validRows.length,
        invalidRowsCount: totalRows - validRows.length,
        summary
      });
    } catch (err: any) {
      console.error("Error parsing file:", err);
      setError(`Gagal membaca file: ${err.message || "Format file tidak dapat diparsing."}`);
      setParsedData(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  /**
   * Finalisasi proses onboarding & import data
   */
  const handleCompanySubmit = async () => {
    setIsLoading(true);
    setIsImporting(true);
    setImportProgress(20);
    setImportStatusText("Mendaftarkan akun perusahaan...");
    setError(null);
    try {
      setImportProgress(50);
      setImportStatusText("Mengunggah dokumen legalitas & file data...");

      const { company, allCompanies } = await OnboardingController.completeOnboarding({
        formData, user, uploadedDocs, selectedFile
      });

      setImportProgress(90);
      setImportStatusText("Menyiapkan workspace perusahaan...");

      setCompanies(allCompanies);
      // Prefer newly registered company, fallback to list match
      const currentRegistered = allCompanies.find((c: any) => c.id === company.id) || company;
      setSelectedCompany(currentRegistered);

      setImportProgress(100);
      setImportStatusText("Selesai!");
      setSlide(7); // Pindah ke slide sukses
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsImporting(false);
    }
  };

  // --- API Public ViewModel ---
  const lockedType = searchParams.get("type") as "buyer" | "vendor" | null;

  return {
    // State
    slide, setSlide,
    formData,
    isLoading, error, setError,
    isVerifyingNpwp, npwpVerifiedData,
    uploadedDocs, setUploadedDocs,
    isUploadingDoc,
    selectedFile, setSelectedFile,
    isParsingFile, parseProgress, parsedData,
    isImporting, importProgress, importStatusText,
    companies, selectedCompany, setSelectedCompany,
    termsAccepted, setTermsAccepted,
    user,
    npwpConflict, setNpwpConflict,
    lockedType,

    // Actions
    updateField,
    updateHqAddress,
    addHqAddress,
    removeHqAddress,
    handleVerifyNpwp,
    handleDocUpload,
    handleFileSelect,
    handleCompanySubmit,
    resetForm,
  };
};
