import { SessionManager } from "./session";

/**
 * Asset Utility
 * 
 * Tanggung jawab: Mengelola URL untuk asset (gambar, dokumen) secara konsisten
 * antara lingkungan lokal dan produksi dengan dukungan S3 signed URLs.
 */

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  
  // Jika path sudah merupakan URL lengkap (misal dari S3 atau external)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.replace(/^\//, "");

  // Coba VITE_BASE_URL_IMAGE dulu (S3 endpoint di production)
  const baseUrl = import.meta.env.VITE_BASE_URL_IMAGE;
  if (baseUrl) {
    const cleanBase = baseUrl.replace(/\/$/, "");
    return `${cleanBase}/${cleanPath}`;
  }

  // Fallback ke VITE_API_URL + /storage (cocok untuk lokal)
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const cleanApi = apiUrl.replace(/\/$/, "");
    return `${cleanApi}/storage/${cleanPath}`;
  }

  // Last resort: gunakan window.location.origin
  if (typeof window !== "undefined") {
    return `${window.location.origin}/storage/${cleanPath}`;
  }
  return `/storage/${cleanPath}`;
}

/**
 * Get secure document download URL untuk dokumen RFQ
 */
export function getRfqDocumentUrl(rfqId: string): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl 
    ? `${apiUrl.replace(/\/$/, "")}/api/documents/rfq/${rfqId}`
    : `/api/documents/rfq/${rfqId}`;
}

/**
 * Get secure company document download URL
 */
export function getCompanyDocumentUrl(documentId: string): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl 
    ? `${apiUrl.replace(/\/$/, "")}/api/documents/company/${documentId}`
    : `/api/documents/company/${documentId}`;
}

