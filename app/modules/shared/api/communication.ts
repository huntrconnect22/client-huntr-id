import { apiPost } from "~/shared/services/http/client";

/**
 * Communication API
 * 
 * Tanggung jawab: Mengelola integrasi pihak ketiga (WhatsApp, dll).
 */

export const refreshWhatsAppToken = () =>
  apiPost("/api/communication/whatsapp/refresh-token", {});
