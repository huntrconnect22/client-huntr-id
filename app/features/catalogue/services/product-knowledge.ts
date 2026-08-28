// Helper: Live knowledge lookup for real product specs, brand, category, UOM and image using OpenAI ChatGPT & DALL-E Image Generation
import { aiAutofillCatalogue, aiGenerateProductImage } from "../../../lib/api/ai";

export interface ProductKnowledgeResult {
  category: string;
  brand: string;
  uom: string;
  specifications: string;
  keywords: string;
  imageFile: File | null;
}

/**
 * Convert base64 data to File object
 */
function base64ToFile(base64Data: string, filename: string, mimeType: string = "image/png"): File {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Generate dan buat file gambar produk secara otomatis menggunakan OpenAI Generative Image (DALL-E),
 * dengan fallback ke image search jika image generation gagal.
 */
export const fetchProductImage = async (
  productName: string,
  category: string = "",
  brand: string = "",
  companyId?: string
): Promise<File | null> => {
  const cleanName = productName.trim();
  const safeFilename = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-ai.png`;

  // 1. Primary Method: OpenAI Generative Image (DALL-E)
  try {
    const res: any = await aiGenerateProductImage({
      name: cleanName,
      category,
      brand,
      company_id: companyId,
    });

    if (res?.b64_json) {
      return base64ToFile(res.b64_json, safeFilename, "image/png");
    }

    if (res?.url) {
      const imgRes = await fetch(res.url);
      const blob = await imgRes.blob();
      if (blob.size > 1000) {
        return new File([blob], safeFilename, { type: blob.type || "image/png" });
      }
    }
  } catch (err) {
    console.warn("AI Image Generation failed, fallback to Wikimedia search:", err);
  }

  // 2. Fallback Secondary Method: Wikimedia Commons / Wikipedia search
  const queryTerms = [
    cleanName,
    category ? `${cleanName} ${category}` : "",
  ].filter(Boolean) as string[];

  for (const query of queryTerms) {
    try {
      const wikiImgSearch = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        query
      )}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
      const wikiRes = await fetch(wikiImgSearch);
      const wikiData = await wikiRes.json();
      const pages = wikiData?.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as any;
        if (page?.thumbnail?.source) {
          const imgRes = await fetch(page.thumbnail.source);
          const blob = await imgRes.blob();
          if (blob.size > 2000) {
            return new File([blob], `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-auto.jpg`, {
              type: blob.type || "image/jpeg",
            });
          }
        }
      }
    } catch (e) {
      console.warn("Wikipedia fallback search skipped:", e);
    }
  }

  return null;
};

/**
 * Autofill spesifikasi, kategori, brand, uom, dan generate gambar produk menggunakan ChatGPT & DALL-E.
 */
export const fetchProductKnowledge = async (
  productName: string,
  categoryHint: string = "",
  companyId?: string
): Promise<ProductKnowledgeResult> => {
  const cleanName = productName.trim();
  let category = "Mechanical";
  let brand = "Generic";
  let uom = "Unit";
  let specifications = "";
  let keywords = "";

  // 1. Panggil backend OpenAI ChatGPT endpoint untuk text metadata
  try {
    const res: any = await aiAutofillCatalogue(cleanName, categoryHint);
    if (res && res.success && res.data) {
      const d = res.data;
      if (d.category) category = d.category;
      if (d.brand) brand = d.brand;
      if (d.uom) uom = d.uom;
      if (d.specifications) specifications = d.specifications;
      if (d.keywords) keywords = d.keywords;
    }
  } catch (err) {
    console.warn("ChatGPT autofill backend call failed, fallback to local heuristics", err);
  }

  // 2. Fallback Heuristics jika API belum terisi
  if (!specifications || specifications.length < 15) {
    specifications = `${cleanName} - Spesifikasi standar industri B2B, kualitas enterprise terverifikasi.`;
    keywords = [cleanName.toLowerCase(), brand.toLowerCase(), category.toLowerCase()].join(", ");
  }

  // 3. Generate gambar produk AI otomatis (DALL-E)
  let imageFile: File | null = null;
  try {
    imageFile = await fetchProductImage(cleanName, category, brand, companyId);
  } catch (e) {
    console.warn("Generative image search failed:", e);
  }

  return { category, brand, uom, specifications, keywords, imageFile };
};
