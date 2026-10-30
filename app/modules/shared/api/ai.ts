import { apiGet, apiPost } from "~/shared/services/http/client";

export type HuntrAssistResponse = {
  success: boolean;
  response_id?: string | null;
  answer?: string;
  sources?: { title: string; url: string }[];
  model?: string | null;
  provider?: "perplexity" | "openai" | "huntr_platform";
  fallback?: boolean;
  fallback_reason?: string;
  data?: Record<string, unknown>;
};

/** Web-grounded answer from Huntr Assist. The provider key stays on the API server. */
export const askHuntrAssist = (query: string, options?: {
  company_id?: string;
  previous_response_id?: string;
}) => apiPost<HuntrAssistResponse>("/api/ai/huntr-assist", { query, ...options });

/**
 * AI API
 *
 * Endpoint untuk semua fitur AI & Agentic Procurement di platform Huntr.
 */

/**
 * Full Autonomous Agentic Procurement Workflow.
 * AI mencari produk relevan, membandingkan spesifikasi, dan membuat draft PR lengkap.
 */
export const runAgenticProcurement = (
  query: string,
  options?: {
    company_id?: string;
    auto_create_pr?: boolean;
    catalogue_ids?: string[];
  }
) => apiPost("/api/ai/agentic-procurement/run", { query, ...options });

/**
 * Conversational multi-turn chat dengan Agentic Procurement AI.
 */
export const chatAgenticProcurement = (
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  options?: { company_id?: string }
) => apiPost("/api/ai/agentic-procurement/chat", { messages, ...options });

/**
 * 1-Click membuat PR ke sistem dari draft Agentic AI.
 */
export const createAgenticPr = (
  companyId: string,
  prDraft: any
) => apiPost("/api/ai/agentic-procurement/create-pr", { company_id: companyId, pr_draft: prDraft });

/**
 * Natural language search katalog.
 * Otomatis aktif ketika query > 20 karakter (atau mengandung kata deskriptif).
 */
export const aiSearch = (query: string, params?: { company_id?: string }) =>
  apiPost("/api/ai/search", { query, ...params });

/**
 * Generate teks perbandingan produk dari query natural language.
 * Menggunakan pengetahuan AI eksternal — tidak perlu produk ada di DB.
 */
export const aiCompareText = (query: string) =>
  apiPost("/api/ai/compare-text", { query });

/**
 * Bandingkan 2–5 produk katalog menggunakan AI (by product IDs dari DB).
 */
export const aiCompare = (catalogueIds: string[]) =>
  apiPost("/api/ai/compare", { catalogue_ids: catalogueIds });

/**
 * AI assessment dan ranking proposal tender.
 * Memerlukan auth.
 */
export const aiRankProposals = (rfqId: string) =>
  apiPost("/api/ai/rank-proposals", { rfq_id: rfqId });

/**
 * Auto-generate draft PR dari natural language prompt.
 * Memerlukan auth.
 */
export const aiGeneratePr = (query: string, catalogueIds?: string[]) =>
  apiPost("/api/ai/generate-pr", {
    query,
    catalogue_ids: catalogueIds ?? [],
  });

/**
 * Ambil ringkasan penggunaan AI bulan ini per company.
 * Memerlukan auth.
 */
export const getAiUsage = (companyId: string) =>
  apiGet(`/api/ai/usage?company_id=${encodeURIComponent(companyId)}`);

/**
 * Auto-fill metadata produk menggunakan OpenAI ChatGPT berdasarkan nama produk.
 */
export const aiAutofillCatalogue = (name: string, category?: string) =>
  apiPost("/api/ai/autofill-catalogue", { name, category });

/**
 * Generate gambar produk menggunakan OpenAI DALL-E.
 */
export const aiGenerateProductImage = (params: {
  name: string;
  category?: string;
  brand?: string;
  company_id?: string;
}) => apiPost("/api/ai/generate-image", params);


/**
 * Batch enrichment / update massal produk menggunakan Genkit/OpenAI AI (max 10 item).
 */
export const aiBatchUpdateCatalogue = (items: { id: string | number; name: string; category?: string }[]) =>
  apiPost("/api/ai/batch-update-catalogue", { items });

/**
 * Helper: deteksi apakah query cukup deskriptif untuk AI search.
 * Minimal 20 karakter ATAU mengandung kata sifat/deskriptif.
 */
export const isAiQuery = (query: string): boolean => {
  if (!query || query.trim().length < 15) return false;
  const descriptiveWords = [
    // Intentional AI queries
    "compare", "bandingkan", "perbandingan", "vs", "versus",
    "rekomendasi", "rekomendasikan", "sarankan", "pilihkan",
    // Need-based queries
    "yang bisa", "yang dapat", "untuk", "butuh", "perlu", "ingin",
    "mampu", "dengan fitur", "kapasitas", "kualitas", "spesifikasi",
    "cocok", "digunakan", "berfungsi", "support", "kompatibel",
    // Spec-based queries
    "ram", "ssd", "processor", "prosesor", "layar", "baterai",
    "minimum", "maksimum", "minimal", "terbaik", "murah", "mahal",
    "gb", "ghz", "inch", "watt",
  ];
  const lower = query.toLowerCase();
  return descriptiveWords.some((w) => lower.includes(w)) || query.trim().length > 25;
};
