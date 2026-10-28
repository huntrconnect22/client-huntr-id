import { OnboardingRepository } from "./onboardingService";
import type { CompanyFormData, UploadedDoc } from "../types";

/**
 * OnboardingController
 * 
 * Tanggung jawab: Mengelola logika bisnis onboarding (orchestration).
 * Menghubungkan ViewModel dengan Repository dan menangani transformasi data kompleks.
 */
export const OnboardingController = {
  /**
   * Menangani proses verifikasi NPWP dan memformat hasilnya
   */
  async verifyTaxId(taxId: string, country: string) {
    const rawNpwp = taxId.replace(/[^\d]/g, "");
    if (rawNpwp.length !== 15 && rawNpwp.length !== 16) {
      throw new Error("Nomor NPWP harus 15 atau 16 digit.");
    }

    const formattedNpwp = rawNpwp.length === 15 ? "0" + rawNpwp : rawNpwp;
    const res = await OnboardingRepository.verifyNpwp(formattedNpwp, country);
    
    if (res.status !== 1 || !res.data) {
      throw new Error(res.message || "Verifikasi NPWP gagal.");
    }
    
    return res.data;
  },

  /**
   * Menangani upload dokumen legalitas
   */
  async uploadLegalDoc(file: File, docType: string): Promise<UploadedDoc> {
    const fd = new FormData();
    fd.append("document", file);
    
    try {
      const res = await OnboardingRepository.uploadDocument(fd);
      
      // Debug log untuk melihat struktur response
      console.log('Document upload response:', res);
      
      // Type assertion untuk handle berbagai kemungkinan response
      const response = res as any;
      
      // Handle berbagai format response dari API
      const filePath = response.file_path || response.path || response.filePath || 
                       response.document_url || response.document_path || 
                       `/uploads/documents/${Date.now()}_${file.name}`;
      const url = response.url || response.file_url || response.document_url || 
                  response.path || filePath;
      
      if (!filePath) {
        console.error('API Response missing file_path:', response);
        throw new Error(`API tidak mengembalikan file_path untuk dokumen yang diupload. Response: ${JSON.stringify(response)}`);
      }
      
      return {
        name: file.name,
        type: docType,
        file_path: filePath,
        url: url,
        localName: file.name,
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw new Error(`Gagal mengupload dokumen: ${error.message || 'Unknown error'}`);
    }
  },

  /**
   * Menangani pendaftaran perusahaan dan impor data awal
   */
  async completeOnboarding(params: {
    formData: CompanyFormData;
    user: any;
    uploadedDocs: UploadedDoc[];
    selectedFile: File | null;
  }) {
    const { formData, user, uploadedDocs, selectedFile } = params;

    // 1. Persiapkan payload pendaftaran
    console.log('Uploaded docs before building payload:', uploadedDocs);
    
    // Filter dokumen yang valid (memiliki file_path)
    const validDocuments = uploadedDocs.filter(d => {
      const hasFilePath = !!d.file_path;
      if (!hasFilePath) {
        console.warn(`Document ${d.name} (${d.type}) skipped - no file_path`);
      }
      return hasFilePath;
    });
    // Documents are now optional — starter companies can register without them.
    
    const payload = {
      ...formData,
      name: formData.company_name,
      user_id: user?.id,
      // Only include documents if they exist (starter tier can skip this)
      ...(validDocuments.length > 0 ? {
        documents: validDocuments.map(d => ({
          name: d.type,
          type: d.type,
          file_path: d.file_path,
        }))
      } : {}),
    };
    
    console.log('Final payload for registration:', payload);

    // 2. Daftar Perusahaan
    const res = await OnboardingRepository.registerCompany(payload);
    const company = res.company || res;

    // 3. Impor data historis/katalog jika ada file
    if (selectedFile && company.id) {
      const fd = new FormData();
      fd.append("company_id", String(company.id));
      fd.append("csv", selectedFile);
      
      if (formData.type === "buyer") {
        await OnboardingRepository.importHistoricalPo(fd);
      } else {
        await OnboardingRepository.importCatalogue(fd);
      }
    }

    // 4. Ambil data terbaru untuk sinkronisasi state
    const data = await OnboardingRepository.getMyCompanies();

    return {
      company,
      allCompanies: data.companies || [company]
    };
  }
};

