import { apiPost, apiPostForm, apiGet } from "../../../lib/client";
import type { CompanyFormData, NpwpVerifiedData, UploadedDoc } from "../types";

/**
 * OnboardingRepository
 * 
 * Tanggung jawab: Melakukan komunikasi data mentah dengan API.
 * Pola: Repository Pattern untuk abstraksi sumber data.
 */
export const OnboardingRepository = {
  /**
   * Memverifikasi nomor NPWP melalui API eksternal/internal
   */
  async verifyNpwp(npwp: string, country: string): Promise<{ status: number; message?: string; data?: NpwpVerifiedData }> {
    return apiPost("/api/companies/verify-npwp", { npwp, country });
  },

  /**
   * Mengunggah dokumen legalitas perusahaan
   */
  async uploadDocument(fd: FormData): Promise<any> {
    return apiPostForm("/api/companies/documents/upload", fd);
  },

  /**
   * Mendaftarkan profil perusahaan baru
   */
  async registerCompany(payload: any): Promise<any> {
    return apiPost("/api/companies", payload);
  },

  /**
   * Mengimpor data PO historis (khusus Buyer)
   */
  async importHistoricalPo(fd: FormData): Promise<any> {
    return apiPostForm("/api/orders/historical/import", fd);
  },

  /**
   * Mengimpor katalog produk (khusus Vendor)
   */
  async importCatalogue(fd: FormData): Promise<any> {
    return apiPostForm("/api/catalogues/import", fd);
  },

  /**
   * Mengambil daftar perusahaan milik user yang sedang login
   */
  async getMyCompanies(): Promise<{ companies: any[] }> {
    return apiGet(`/api/companies/my`);
  },

};

