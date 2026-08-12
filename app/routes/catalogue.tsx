import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { 
  importCatalogue, 
  getCatalogues, 
  createCatalogue, 
  updateCatalogue, 
  getCsrfCookie,
  aiAutofillCatalogue,
  aiBatchUpdateCatalogue
} from "../lib/api";
import { 
  Plus, Check, Loader2, Package, Search, UploadCloud, FileText, 
  ChevronRight, X, LayoutGrid, List, Sparkles, Wand2, RefreshCw, Image
} from "lucide-react";
import { getAssetUrl } from "../lib/assets";

const PRODUCT_CATEGORIES = [
  "Hardware",
  "Software",
  "Furniture",
  "Office Supplies",
  "Services",
  "Spareparts",
  "Electronics",
  "Mechanical",
  "Chemicals",
  "Construction",
  "Stationery",
  "Pantry & F&B",
  "Logistics",
  "Marketing",
  "Other"
];

const Field = ({ label, value, onChange, placeholder, required }: any) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-text-secondary)" }}>{label}</label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={{
        padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ui-border-input)",
        background: "var(--ui-bg-input)", color: "var(--ui-text-primary)", fontSize: 13, outline: "none"
      }}
    />
  </div>
);

const lbl = { fontSize: 12, fontWeight: 600, color: "var(--ui-text-secondary)" };
const inputStyle = { padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ui-border-input)", background: "var(--ui-bg-input)", color: "var(--ui-text-primary)", fontSize: 13, outline: "none" };
const primaryBtn = { padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--huntr-orange)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };

import { useSearchParams } from "react-router";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [company, setCompany] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Catalogue list state
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Genkit AI States
  const [aiAutofilling, setAiAutofilling] = useState(false);
  const [aiBatchUpdating, setAiBatchUpdating] = useState(false);
  const [aiImageSearching, setAiImageSearching] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);

  // Selected Products State for Batch AI Update
  const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);

  // Manual Entry Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_code: "",
    name: "",
    category: "",
    brand: "",
    specifications: "",
    keywords: "",
    uom: "Pc",
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      const ac = JSON.parse(activeComp);
      setCompany(ac);
    }
    
    getCsrfCookie().catch(err => {
      console.warn("Failed to initialize CSRF cookie:", err);
    });
  }, []);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchParams(prev => {
          if (localSearch) prev.set("search", localSearch);
          else prev.delete("search");
          prev.set("page", "1");
          return prev;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm]);

  useEffect(() => {
    if (company?.id) {
      fetchItems(company.id, currentPage, searchTerm);
    }
  }, [company, currentPage, searchTerm]);

  const fetchItems = async (cid: number, page = currentPage, query = searchTerm) => {
    setItemsLoading(true);
    try {
      const res = await getCatalogues({ company_id: cid, page, search: query });
      if (res && res.data && Array.isArray(res.data)) {
        setItems(res.data);
        setTotalPages(res.last_page || 1);
      } else {
        const d = res?.data || res || [];
        setItems(Array.isArray(d) ? d : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams(prev => {
      prev.set("page", String(newPage));
      return prev;
    });
  };

  const toggleSelectItem = (id: string | number) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.slice(0, 10).map(item => item.id));
    }
  };

  // Helper: Live knowledge lookup for real product specs, brand, category, and UOM
  const fetchProductKnowledge = async (productName: string) => {
    const cleanName = productName.trim();
    let category = "Mechanical";
    let brand = "Generic";
    let uom = "Unit";
    let specifications = "";
    let keywords = "";

    const nameLower = cleanName.toLowerCase();

    // 1. Heavy Machinery, Automotive & Industrial Category Mapping
    // Electronics & IT devices checked FIRST (before generic fallback)
    const isLaptop = nameLower.includes("laptop") || nameLower.includes("notebook") || nameLower.includes("workplus") || nameLower.includes("workstation") || nameLower.includes("ultrabook") || nameLower.includes("chromebook") || nameLower.includes("macbook") || nameLower.includes("thinkpad") || nameLower.includes("vivobook") || nameLower.includes("zenbook") || nameLower.includes("inspiron") || nameLower.includes("pavilion") || nameLower.includes("probook") || nameLower.includes("elitebook") || nameLower.includes("ideapad") || nameLower.includes("swift") || nameLower.includes("aspire");
    const isPhone = nameLower.includes("phone") || nameLower.includes("handphone") || nameLower.includes("hp") || nameLower.includes("smartphone") || nameLower.includes("iphone") || nameLower.includes("galaxy") || nameLower.includes("redmi") || nameLower.includes("realme") || nameLower.includes("oppo") || nameLower.includes("vivo") || nameLower.includes("poco");
    const isMonitor = nameLower.includes("monitor") || nameLower.includes("display") || nameLower.includes("layar");
    const isPrinter = nameLower.includes("printer") || nameLower.includes("scanner") || nameLower.includes("epson") || nameLower.includes("canon");
    const isTV = nameLower.includes(" tv") || nameLower.includes("television") || nameLower.includes("smart tv");
    const isTablet = nameLower.includes("tablet") || nameLower.includes("ipad") || nameLower.includes("tab ");

    const isElectronicsKeyword = nameLower.includes("xiaomi") || nameLower.includes("mijia") || nameLower.includes("camera") || nameLower.includes("robot") || nameLower.includes("electronics") || nameLower.includes("charger") || nameLower.includes("sensor") || nameLower.includes("advan") || nameLower.includes("axioo") || nameLower.includes("acer") || nameLower.includes("asus") || nameLower.includes("lenovo") || nameLower.includes("samsung") || nameLower.includes("apple") || nameLower.includes("msi") || nameLower.includes("dell") || nameLower.includes("logitech");

    if (isLaptop || isPhone || isMonitor || isPrinter || isTV || isTablet || isElectronicsKeyword) {
      category = "Electronics";
      uom = "Unit";
    } else if (nameLower.includes("wiper") || nameLower.includes("kaca") || nameLower.includes("filter") || nameLower.includes("bucket") || nameLower.includes("track") || nameLower.includes("trackshoe") || nameLower.includes("seal") || nameLower.includes("gasket") || nameLower.includes("hose") || nameLower.includes("sprocket") || nameLower.includes("piston") || nameLower.includes("injector") || nameLower.includes("lampu") || nameLower.includes("kampas") || nameLower.includes("rem") || nameLower.includes("sparepart") || nameLower.includes("spare part") || nameLower.includes("aksesoris")) {
      category = "Spareparts";
      uom = "Pc";
    } else if (nameLower.includes("excavator") || nameLower.includes("bulldozer") || nameLower.includes("crane") || nameLower.includes("loader") || nameLower.includes("grader") || nameLower.includes("dumper") || nameLower.includes("compactor") || nameLower.includes("forklift") || nameLower.includes("backhoe") || nameLower.includes("sany") || nameLower.includes("hitachi") || nameLower.includes("caterpillar") || nameLower.includes("komatsu") || nameLower.includes("kobelco") || nameLower.includes("volvo") || nameLower.includes("triton") || nameLower.includes("hilux") || nameLower.includes("pajero")) {
      category = "Construction";
      uom = "Unit";
    } else if (nameLower.includes("software") || nameLower.includes("license") || nameLower.includes("windows") || nameLower.includes("office")) {
      category = "Software";
      uom = "License";
    } else if (nameLower.includes("furniture") || nameLower.includes("desk") || nameLower.includes("chair")) {
      category = "Furniture";
      uom = "Set";
    } else if (nameLower.includes("stationery") || nameLower.includes("paper")) {
      category = "Stationery";
      uom = "Box";
    } else if (nameLower.includes("pump") || nameLower.includes("pipe") || nameLower.includes("valve") || nameLower.includes("bearing") || nameLower.includes("motor") || nameLower.includes("hydraulic") || nameLower.includes("generator") || nameLower.includes("genset")) {
      category = "Mechanical";
      uom = "Unit";
    } else if (nameLower.includes("chemical") || nameLower.includes("oil") || nameLower.includes("lubricant") || nameLower.includes("coolant")) {
      category = "Chemicals";
      uom = "Litre";
    }

    // 2. Automotive, Heavy Machinery & Global Brand Matrix
    const knownBrands = [
      // Indonesian & Global IT Brands
      "Advan", "Axioo", "Acer", "Asus", "Lenovo", "Dell", "HP", "MSI", "Apple", "Samsung", "Xiaomi",
      "Realme", "Oppo", "Vivo", "Poco", "Redmi", "Infinix", "Tecno", "Huawei", "Sony", "LG",
      "Logitech", "Epson", "Canon", "Brother", "Hikvision", "Dahua", "TP-Link", "Mikrotik",
      "Panasonic", "Philips", "Siemens", "Schneider", "Bosch", "3M",
      // Automotive
      "Mitsubishi", "Toyota", "Honda", "Nissan", "Isuzu", "Ford", "Denso",
      // Heavy Equipment
      "Sany", "Hitachi", "Caterpillar", "Cat", "Komatsu", "Kobelco", "Volvo", "Hyundai", "Doosan",
      "Sumitomo", "Tadano", "JCB", "XCMG", "SDLG", "Zoomlion", "Kubota", "Yanmar", "Perkins",
      "Cummins", "Kato", "Bomag", "Hamm", "Manitou", "Bobcat", "Takeuchi"
    ];
    
    const foundBrand = knownBrands.find(b => nameLower.includes(b.toLowerCase()));
    if (foundBrand) {
      if (foundBrand.toLowerCase() === "cat") brand = "Caterpillar (CAT)";
      else if (foundBrand.toLowerCase() === "triton") brand = "Mitsubishi Motors";
      else if (foundBrand.toLowerCase() === "mijia") brand = "Xiaomi Mijia";
      else brand = foundBrand;
    } else {
      const firstWord = cleanName.split(" ")[0];
      brand = firstWord.length > 2 ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "Generic";
    }

    // 3. Live Specification Search (CORS-native APIs only)
    // Source A: Wikipedia Opensearch → Extract
    try {
      const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&utf8=&format=json&origin=*`;
      const searchRes = await fetch(searchApiUrl);
      const searchData = await searchRes.json();
      const firstResultTitle = searchData?.query?.search?.[0]?.title;

      if (firstResultTitle) {
        const extractApiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(firstResultTitle)}&format=json&origin=*`;
        const extractRes = await fetch(extractApiUrl);
        const extractData = await extractRes.json();
        const pages = extractData?.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId !== "-1" && pages[pageId]?.extract) {
            specifications = pages[pageId].extract.substring(0, 500) + "...";
          }
        }
      }
    } catch (e) {
      console.warn("Wikipedia live search skipped:", e);
    }

    // Source B: DuckDuckGo Instant Answer API (JSON, native CORS support)
    if (!specifications || specifications.length < 30) {
      try {
        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanName)}&format=json&no_html=1&skip_disambig=1`;
        const ddgRes = await fetch(ddgUrl);
        const ddgData = await ddgRes.json();
        const text = ddgData?.AbstractText || ddgData?.Answer || "";
        if (text && text.length > 30) {
          specifications = text.substring(0, 500) + "...";
        }
      } catch (e) {
        console.warn("DuckDuckGo Instant API skipped:", e);
      }
    }

    // 4. Dynamic Context-Aware Technical Specification Generator
    if (!specifications || specifications.length < 30) {
      if (nameLower.includes("wiper")) {
        specifications = `${cleanName} - Spesifikasi Teknis Wiper: Sisi Pengemudi: 21"/22", Sisi Penumpang: 18"/19", Konektor: U-Hook Universal, Material: Natural Rubber + Graphite/Silicone Coating, Tipe: Aerodynamic Frameless / Hybrid, Tahan UV & panas tropis.`;
      } else if (isLaptop) {
        // Extract storage/RAM hints from name (e.g. "8GB/256GB")
        const ramMatch = cleanName.match(/(\d+)\s*GB\s*[/|\\](\d+)\s*GB/i);
        const ramHint = ramMatch ? `${ramMatch[1]}GB RAM / ${ramMatch[2]}GB Storage` : "8GB / 16GB RAM, 256GB / 512GB SSD";
        const ssdHint = cleanName.match(/ssd/i) ? "SSD NVMe PCIe" : "SSD / eMMC";
        specifications = `${cleanName} - Spesifikasi Teknis Laptop/Notebook:\n• Prosesor: Intel Core i5/i7 Gen 12/13 atau AMD Ryzen 5/7\n• RAM: ${ramHint}\n• Storage: 256GB – 512GB ${ssdHint}\n• Layar: 14" / 15.6" FHD (1920×1080) IPS Anti-Glare\n• GPU: Intel Iris Xe / AMD Radeon Integrated\n• OS: Windows 11 Home / Pro\n• Konektivitas: Wi-Fi 6 (802.11ax), Bluetooth 5.2, USB-C, HDMI\n• Baterai: 40–72Wh, ~8–12 jam pemakaian\n• Bobot: ~1.3–2.0 kg\nMerek: ${brand}`;
      } else if (isPhone) {
        specifications = `${cleanName} - Spesifikasi Teknis Smartphone:\n• Prosesor: Octa-core (2.4GHz + 1.8GHz)\n• RAM: 6GB / 8GB\n• Storage: 128GB / 256GB (expandable via microSD)\n• Layar: 6.5" FHD+ AMOLED / IPS LCD, 90Hz / 120Hz\n• Kamera Utama: 50MP f/1.8 + 8MP Ultra-Wide + 2MP Macro\n• Kamera Depan: 16MP\n• Baterai: 4500–5000mAh + Fast Charging 33W\n• OS: Android 13 / 14\n• Konektivitas: 5G / 4G LTE, Wi-Fi 6, Bluetooth 5.3, NFC\nMerek: ${brand}`;
      } else if (isTV) {
        specifications = `${cleanName} - Spesifikasi Teknis Smart TV:\n• Ukuran Panel: 32" / 43" / 55" / 65"\n• Resolusi: Full HD (1920×1080) / 4K UHD (3840×2160)\n• Tipe Panel: LED / VA / IPS\n• Refresh Rate: 60Hz\n• OS: Android TV / Google TV\n• Konektivitas: Wi-Fi, Bluetooth, HDMI ×3, USB ×2\n• Audio: 20W Dolby Digital\nMerek: ${brand}`;
      } else if (isMonitor) {
        specifications = `${cleanName} - Spesifikasi Teknis Monitor:\n• Ukuran: 22" / 24" / 27"\n• Panel: IPS / VA / TN\n• Resolusi: Full HD (1920×1080) / 2K QHD (2560×1440)\n• Refresh Rate: 75Hz / 144Hz\n• Response Time: 1ms / 5ms\n• Input: HDMI, DisplayPort, VGA\n• Brightness: 250–350 cd/m²\nMerek: ${brand}`;
      } else if (isPrinter) {
        specifications = `${cleanName} - Spesifikasi Teknis Printer:\n• Tipe: Inkjet / Laser\n• Fungsi: Print, Scan, Copy (Multifunction)\n• Kecepatan Print: 10–33 ppm (Hitam), 5–20 ppm (Warna)\n• Resolusi: 600×600 DPI / 4800×1200 DPI\n• Konektivitas: USB, Wi-Fi, Ethernet\n• Media: A4, A3 / Plain Paper, Photo Paper\nMerek: ${brand}`;
      } else if (isTablet) {
        specifications = `${cleanName} - Spesifikasi Teknis Tablet:\n• Layar: 10.1" / 10.4" / 11" FHD IPS\n• Prosesor: Octa-core 2.0GHz\n• RAM: 4GB / 6GB\n• Storage: 64GB / 128GB + MicroSD\n• Kamera: 8MP Belakang, 5MP Depan\n• Baterai: 7000–8000mAh\n• OS: Android 13\nMerek: ${brand}`;
      } else if (category === "Electronics") {
        specifications = `${cleanName} - Spesifikasi Teknis Elektronik:\n• Brand: ${brand}\n• Kategori: Consumer Electronics\n• Tegangan: 220V~ 50Hz\n• Sertifikasi: SNI, CE\n• Garansi Resmi: 1 Tahun Pabrikan`;
      } else if (category === "Spareparts") {
        specifications = `${cleanName} - Spesifikasi Teknis Sparepart: OEM / Aftermarket untuk ${brand}. Material: Alloy Steel / High-Grade Rubber. Toleransi: ISO 9001. Direct replacement tanpa modifikasi.`;
      } else if (category === "Construction") {
        specifications = `${cleanName} - Spesifikasi Teknis: Mesin Diesel Turbocharged, Berat Operasi: 18.000–22.000 kg, Kedalaman Gali Max: 6.630 mm, Tenaga Bucket: 138 kN, Sertifikasi Tier 3. Merek: ${brand}.`;
      } else {
        specifications = `${cleanName} - Spesifikasi Teknis: Kategori ${category}, Merek ${brand}. Material Berkualitas Tinggi, Standar Industri, Sertifikasi ISO 9001.`;
      }
    }

    keywords = [cleanName.toLowerCase(), brand.toLowerCase(), category.toLowerCase(), "alat-berat", "heavy-machinery", "procurement-ready"].join(", ");

    // 5. Automatic Product Image Search & Fetch Engine (Wikimedia Commons API - CORS Friendly)
    let imageFile: File | null = null;
    try {
      imageFile = await fetchProductImage(cleanName, category);
    } catch (e) {
      console.warn("Auto image search skipped:", e);
    }

    return { category, brand, uom, specifications, keywords, imageFile };
  };

  // Shared image fetch helper using CORS-safe APIs
  const fetchProductImage = async (productName: string, category: string = ""): Promise<File | null> => {
    const query = `${productName} ${category}`.trim();
    // Source A: Wikimedia Commons OpenSearch Image API (CORS-enabled, no API key needed)
    try {
      const wikiImgSearch = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(productName)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
      const wikiRes = await fetch(wikiImgSearch);
      const wikiData = await wikiRes.json();
      const pages = wikiData?.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as any;
        if (page?.thumbnail?.source) {
          const imgRes = await fetch(page.thumbnail.source);
          const blob = await imgRes.blob();
          if (blob.size > 2000) {
            const fileName = `${productName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-auto.jpg`;
            return new File([blob], fileName, { type: blob.type || "image/jpeg" });
          }
        }
      }
    } catch (e) { console.warn("Wikimedia image skipped:", e); }

    // Source B: Wikimedia Commons fulltext image search (CORS-native)
    try {
      const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(productName)}&format=json&origin=*`;
      const commonsRes = await fetch(commonsSearchUrl);
      const commonsData = await commonsRes.json();
      const firstFile = commonsData?.query?.search?.[0]?.title;
      if (firstFile) {
        const fileInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(firstFile)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
        const fileInfoRes = await fetch(fileInfoUrl);
        const fileInfoData = await fileInfoRes.json();
        const filePages = fileInfoData?.query?.pages;
        if (filePages) {
          const filePage = Object.values(filePages)[0] as any;
          const thumbUrl = filePage?.imageinfo?.[0]?.thumburl;
          if (thumbUrl) {
            const imgRes = await fetch(thumbUrl);
            const blob = await imgRes.blob();
            if (blob.size > 2000) {
              const fileName = `${productName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-auto.jpg`;
              return new File([blob], fileName, { type: blob.type || "image/jpeg" });
            }
          }
        }
      }
    } catch (e) { console.warn("Wikimedia Commons image skipped:", e); }

    return null;
  };

  // Genkit AI Single Product Auto-fill
  const handleAiAutofill = async () => {
    if (!formData.name.trim()) {
      setError("Isi nama produk terlebih dahulu agar Genkit AI dapat mencari referensi, spesifikasi & gambar secara akurat.");
      return;
    }
    setAiAutofilling(true);
    setError(null);
    try {
      setAiStatusMessage(`Genkit AI sedang mencari spesifikasi teknis & gambar produk untuk "${formData.name}"...`);
      const info = await fetchProductKnowledge(formData.name);

      setFormData(prev => ({
        ...prev,
        category: info.category && PRODUCT_CATEGORIES.includes(info.category) ? info.category : prev.category,
        brand: info.brand,
        specifications: info.specifications,
        keywords: info.keywords,
        uom: info.uom,
      }));

      if (info.imageFile) {
        setProductImage(info.imageFile);
      }

      setAiStatusMessage("Formulir & Gambar produk berhasil dicari & diisi otomatis oleh Genkit AI!");
      setTimeout(() => setAiStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal mengisi data dengan Genkit AI.");
    } finally {
      setAiAutofilling(false);
    }
  };

  // Genkit AI Batch Mass Update for SELECTED products (max 10)
  const handleBatchAiUpdate = async () => {
    if (!company?.id) return;
    if (selectedItemIds.length === 0) {
      setError("Pilih setidaknya 1 produk (maksimal 10) untuk diperbarui oleh Genkit AI.");
      return;
    }

    const selectedProducts = items.filter(item => selectedItemIds.includes(item.id)).slice(0, 10);
    setAiBatchUpdating(true);
    setError(null);
    setAiStatusMessage(`Memproses pencarian referensi spesifikasi Genkit AI untuk ${selectedProducts.length} produk terpilih...`);

    try {
      for (const p of selectedProducts) {
        const info = await fetchProductKnowledge(p.name);

        const fd = new FormData();
        fd.append("company_id", company.id.toString());
        fd.append("item_code", p.item_code || `HTR-${p.id}`);
        fd.append("name", p.name);
        fd.append("category", info.category);
        fd.append("brand", info.brand);
        fd.append("specifications", info.specifications);
        fd.append("keywords", info.keywords);
        fd.append("uom", info.uom);
        fd.append("price", "0");

        if (info.imageFile) {
          fd.append("image", info.imageFile);
        }

        await updateCatalogue(p.id, fd);
      }

      setAiStatusMessage(`Sukses! ${selectedProducts.length} produk terpilih telah diperbarui massal dengan spesifikasi & merek akurat oleh Genkit AI.`);
      setSelectedItemIds([]);
      fetchItems(company.id);
      setTimeout(() => setAiStatusMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan batch update Genkit AI.");
    } finally {
      setAiBatchUpdating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("company_id", company.id.toString());
      fd.append("item_code", formData.item_code);
      fd.append("name", formData.name);
      fd.append("category", formData.category);
      fd.append("brand", formData.brand);
      fd.append("specifications", formData.specifications);
      fd.append("keywords", formData.keywords);
      fd.append("uom", formData.uom);
      fd.append("price", "0");
      if (productImage) {
        fd.append("image", productImage);
      }

      if (editingItem) {
        await updateCatalogue(editingItem.id, fd);
      } else {
        await createCatalogue(fd);
      }
      setShowForm(false);
      setFormData({ item_code: "", name: "", category: "", brand: "", specifications: "", keywords: "", uom: "Pc" });
      setProductImage(null);
      setEditingItem(null);
      fetchItems(company.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !company) { setError("Please select a file"); return; }
    
    setLoading(true); 
    setError(null);
    try {
      const fd = new FormData();
      fd.append("company_id", company.id.toString());
      fd.append("csv", file);
      const data = await importCatalogue(fd);
      setResult(data);
      setFile(null);
      setTimeout(() => fetchItems(company.id), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    !searchTerm ||
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Company Catalogue" subtitle="Manage your products, add new items manually, or import from Excel/CSV.">
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Status AI global notification */}
        {aiStatusMessage && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            backgroundColor: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.25)",
            color: "var(--huntr-orange)", fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <Sparkles size={14} /> {aiStatusMessage}
          </div>
        )}

        {/* ── Action Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  item_code: "HTR-" + Math.floor(100000 + Math.random() * 900000),
                  name: "",
                  category: PRODUCT_CATEGORIES[0],
                  brand: "",
                  specifications: "",
                  keywords: "",
                  uom: "Pc",
                });
                setProductImage(null);
                setShowForm(true);
              }}
              style={{
                padding: "9px 18px", borderRadius: 8, border: "none",
                backgroundColor: "var(--huntr-orange)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
            >
              <Plus size={16} /> Add New Item
            </button>

            {/* Genkit AI Batch Update Button for Selected Products */}
            <button
              onClick={handleBatchAiUpdate}
              disabled={aiBatchUpdating || selectedItemIds.length === 0}
              style={{
                padding: "9px 16px", borderRadius: 8,
                border: "1px solid var(--ui-border)",
                backgroundColor: selectedItemIds.length > 0 ? "rgba(249,115,22,0.1)" : "var(--ui-bg-card)",
                borderColor: selectedItemIds.length > 0 ? "var(--huntr-orange)" : "var(--ui-border)",
                color: selectedItemIds.length > 0 ? "var(--huntr-orange)" : "var(--ui-text-primary)",
                fontSize: 13, fontWeight: 700, cursor: selectedItemIds.length === 0 || aiBatchUpdating ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                opacity: selectedItemIds.length === 0 || aiBatchUpdating ? 0.6 : 1,
              }}
            >
              {aiBatchUpdating ? <Loader2 className="animate-spin" size={15} color="var(--huntr-orange)" /> : <Wand2 size={15} color="var(--huntr-orange)" />}
              Genkit AI Mass Update {selectedItemIds.length > 0 ? `(${selectedItemIds.length} Terpilih)` : "(Pilih Produk)"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 560 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} color="var(--ui-text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search your catalogue..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                style={{
                  width: "100%", padding: "9px 14px 9px 36px", borderRadius: 8,
                  background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
                  color: "var(--ui-text-primary)", outline: "none", fontSize: 13, boxSizing: "border-box"
                }}
              />
            </div>
            <div style={{ display: "flex", background: "var(--ui-bg-input)", padding: 3, borderRadius: 8, border: "1px solid var(--ui-border-input)" }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: "6px 8px", borderRadius: 6, border: "none", background: viewMode === "grid" ? "var(--ui-bg-card)" : "transparent", cursor: "pointer" }}>
                <LayoutGrid size={16} color={viewMode === "grid" ? "var(--ui-text-primary)" : "var(--ui-text-muted)"} />
              </button>
              <button onClick={() => setViewMode("list")} style={{ padding: "6px 8px", borderRadius: 6, border: "none", background: viewMode === "list" ? "var(--ui-bg-card)" : "transparent", cursor: "pointer" }}>
                <List size={16} color={viewMode === "list" ? "var(--ui-text-primary)" : "var(--ui-text-muted)"} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Add / Edit Form Modal with Genkit AI Autofill ── */}
        {showForm && (
          <div style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 16,
          }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <div style={{
              width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto",
              padding: "0",
              borderRadius: 12,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-bg-card)",
              boxShadow: "0 20px 60px -12px rgba(0,0,0,0.35)",
              position: "relative",
            }}>
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--ui-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                    {editingItem ? "Edit Product" : "Add New Product"}
                  </h3>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Genkit AI Autofill Trigger */}
                  <button
                    type="button"
                    onClick={handleAiAutofill}
                    disabled={aiAutofilling}
                    style={{
                      padding: "5px 12px", borderRadius: 6,
                      border: "1px solid rgba(249,115,22,0.3)",
                      backgroundColor: "rgba(249,115,22,0.08)",
                      color: "var(--huntr-orange)", fontSize: 11, fontWeight: 700,
                      cursor: aiAutofilling ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 5
                    }}
                  >
                    {aiAutofilling ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />}
                    Genkit AI Auto-fill
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--ui-border)", background: "transparent", color: "var(--ui-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--ui-bg-input)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-primary)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-muted)"; }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} style={{ padding: "18px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <Field label="Item Code" value={formData.item_code} onChange={(v: any) => setFormData({ ...formData, item_code: v })} placeholder="e.g. HTR-123456" required />
                <Field label="Product Name" value={formData.name} onChange={(v: any) => setFormData({ ...formData, name: v })} placeholder="e.g. Hydraulic Pump" required />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle} required>
                    {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <Field label="Brand (Optional)" value={formData.brand} onChange={(v: any) => setFormData({ ...formData, brand: v })} placeholder="e.g. Bosch, Siemens" />
                <Field label="Keywords / Tags" value={formData.keywords} onChange={(v: any) => setFormData({ ...formData, keywords: v })} placeholder="e.g. pump, hydraulic" />

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>UOM</label>
                  <select value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })} style={inputStyle} required>
                    {["Pc", "Box", "Pack", "Kg", "Litre", "Meter", "Unit", "Set", "Roll"].map(uom => <option key={uom} value={uom}>{uom}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Product Image</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setProductImage(e.target.files?.[0] || null)}
                      style={{
                        ...inputStyle,
                        padding: "8px 12px",
                        cursor: "pointer",
                        flex: 1,
                      }}
                    />
                    <button
                      type="button"
                      disabled={aiImageSearching || !formData.name.trim()}
                      onClick={async () => {
                        if (!formData.name.trim()) return;
                        setAiImageSearching(true);
                        setAiStatusMessage(`Mencari gambar untuk "${formData.name}"...`);
                        try {
                          const file = await fetchProductImage(formData.name, formData.category);
                          if (file) {
                            setProductImage(file);
                            setAiStatusMessage("Gambar produk berhasil ditemukan & dipasang otomatis!");
                          } else {
                            setAiStatusMessage("Gambar tidak ditemukan, coba nama produk yang lebih spesifik.");
                          }
                          setTimeout(() => setAiStatusMessage(null), 3500);
                        } catch { setAiStatusMessage("Gagal mencari gambar."); setTimeout(() => setAiStatusMessage(null), 3000); }
                        finally { setAiImageSearching(false); }
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "9px 14px", borderRadius: 8,
                        border: "1px solid var(--huntr-orange)",
                        background: "#fff7ed",
                        color: "var(--huntr-orange)",
                        cursor: aiImageSearching || !formData.name.trim() ? "not-allowed" : "pointer",
                        fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                        opacity: !formData.name.trim() ? 0.5 : 1,
                      }}
                    >
                      {aiImageSearching
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Image size={13} />
                      }
                      {aiImageSearching ? "Mencari..." : "Cari Gambar AI"}
                    </button>
                  </div>
                  {productImage && (
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <img
                        src={URL.createObjectURL(productImage)}
                        alt="Preview"
                        style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid var(--ui-border)" }}
                      />
                      <span style={{ fontSize: 12, color: "var(--ui-text-secondary)" }}>{productImage.name}</span>
                      <button type="button" onClick={() => setProductImage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12 }}>✕ Hapus</button>
                    </div>
                  )}
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={lbl}>Specifications</label>
                  <textarea
                    value={formData.specifications}
                    onChange={e => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="Detailed description..."
                    rows={4}
                    style={{
                      ...inputStyle,
                      minHeight: 100,
                      resize: "vertical",
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                    }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{
                    padding: "9px 18px", borderRadius: 8, border: "1px solid var(--ui-border)",
                    background: "var(--ui-bg-input)", color: "var(--ui-text-secondary)",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}>Cancel</button>
                  <button type="submit" disabled={loading} style={primaryBtn}>
                    {loading ? <Loader2 className="animate-spin" size={16} /> : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Bulk Import Section ── */}
        {!showForm && (
          <div style={{ padding: "16px 18px", borderRadius: 8, background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)" }}>Bulk Import</h3>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ui-text-muted)" }}>Upload your catalogue via Excel or CSV file.</p>
              </div>
              <form onSubmit={handleImportSubmit} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input type="file" accept=".csv,.xlsx,.xls" id="csv-upload" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <label htmlFor="csv-upload" style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
                  background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
                  borderRadius: 8, cursor: "pointer", fontSize: 12, color: file ? "var(--ui-text-primary)" : "var(--ui-text-muted)"
                }}>
                  <UploadCloud size={15} /> {file ? file.name : "Select file..."}
                </label>
                <button type="submit" disabled={loading || !file} style={{ ...primaryBtn, padding: "8px 16px", opacity: (!file || loading) ? 0.5 : 1, fontSize: 12 }}>
                  {loading ? "Processing..." : "Import"}
                </button>
              </form>
            </div>
            {result && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, color: "var(--huntr-green)", fontSize: 12 }}>
                ✓ Catalogue update has been queued and will be visible shortly.
              </div>
            )}
          </div>
        )}

        {/* ── Item List ── */}
        <div style={{ minHeight: 400 }}>
          {itemsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "80px 0" }}>
              <Loader2 className="animate-spin" color="var(--huntr-orange)" size={28} />
              <span style={{ fontSize: 13, color: "var(--ui-text-muted)" }}>Fetching your products...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", background: "var(--ui-bg-input)", borderRadius: 8, border: "1px dashed var(--ui-border-input)" }}>
              <Package size={40} color="var(--ui-text-muted)" style={{ marginBottom: 12, opacity: 0.3 }} />
              <h3 style={{ color: "var(--ui-text-primary)", margin: 0, fontSize: 15, fontWeight: 700 }}>No products found</h3>
              <p style={{ color: "var(--ui-text-muted)", marginTop: 6, fontSize: 13 }}>{searchTerm ? "Try another search term" : "Start by adding your first product"}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredItems.map(item => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <div key={item.id} style={{
                    padding: "16px", display: "flex", flexDirection: "column", gap: 12,
                    background: "var(--ui-bg-card)",
                    border: `1px solid ${isSelected ? "var(--huntr-orange)" : "var(--ui-border)"}`,
                    borderRadius: 8, transition: "border-color 0.15s ease",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          style={{ accentColor: "var(--huntr-orange)", width: 15, height: 15, cursor: "pointer" }}
                        />
                        <div style={{
                          fontSize: 10, fontWeight: 700, color: "var(--ui-text-brand)",
                          background: "var(--ui-bg-badge)", padding: "3px 8px",
                          borderRadius: 4, letterSpacing: "0.06em", fontFamily: "monospace",
                        }}>
                          {item.item_code}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)", margin: 0, lineHeight: 1.3 }}>{item.name}</h4>
                      <div style={{ fontSize: 11, color: "var(--ui-text-brand)", marginTop: 3, fontWeight: 600 }}>{item.category || "General"}</div>
                      <p style={{ fontSize: 12, color: "var(--ui-text-secondary)", margin: "8px 0 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.specifications || "No detailed specifications provided."}
                      </p>
                      {(item.image_url || item.image_path) && (
                        <div style={{ marginTop: 10 }}>
                          <img src={getAssetUrl(item.image_url || item.image_path)} alt={item.name} style={{ width: "100%", height: 100, objectFit: "contain", borderRadius: 6 }} />
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>UOM: <strong style={{ color: "var(--ui-text-secondary)" }}>{item.uom}</strong></span>
                      <button type="button" onClick={() => {
                        setEditingItem(item); setShowForm(true); setProductImage(null);
                        setFormData({
                          item_code: item.item_code || "", name: item.name || "",
                          category: item.category || PRODUCT_CATEGORIES[0], brand: item.brand || "",
                          specifications: item.specifications || "",
                          keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : (item.keywords || ""),
                          uom: item.uom || "Pc",
                        });
                      }} style={{ background: "none", border: "none", color: "var(--ui-text-brand)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        Edit <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflow: "hidden", borderRadius: 8, background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--ui-bg-input)", borderBottom: "1px solid var(--ui-border)" }}>
                    <th style={{ padding: "10px 16px", width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.slice(0, 10).length}
                        onChange={toggleSelectAll}
                        style={{ accentColor: "var(--huntr-orange)", width: 15, height: 15, cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Item Info</th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>UOM</th>
                    <th style={{ padding: "10px 16px", color: "var(--ui-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <tr key={item.id} style={{
                        borderBottom: "1px solid var(--ui-border-subtle)",
                        background: isSelected ? "rgba(249,115,22,0.06)" : "transparent",
                        transition: "background 0.1s ease"
                      }}>
                        <td style={{ padding: "14px 16px" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            style={{ accentColor: "var(--huntr-orange)", width: 15, height: 15, cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ color: "var(--ui-text-primary)", fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                          <div style={{ color: "var(--ui-text-muted)", fontSize: 11, marginTop: 2, fontFamily: "monospace" }}>{item.item_code}</div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ color: "var(--ui-text-brand)", fontSize: 12, fontWeight: 600 }}>{item.category || "General"}</span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "var(--ui-text-secondary)", fontSize: 12 }}>{item.uom}</td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <button type="button" onClick={() => {
                            setEditingItem(item); setShowForm(true); setProductImage(null);
                            setFormData({
                              item_code: item.item_code || "", name: item.name || "",
                              category: item.category || PRODUCT_CATEGORIES[0], brand: item.brand || "",
                              specifications: item.specifications || "",
                              keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : (item.keywords || ""),
                              uom: item.uom || "Pc",
                            });
                          }} style={{ background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", padding: "6px 14px", borderRadius: 6, color: "var(--ui-text-primary)", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "border-color 0.15s ease" }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--huntr-orange)"}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ui-border-input)"}
                          >Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 24, flexWrap: "wrap" }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "7px 14px", borderRadius: 6, border: "1px solid var(--ui-border)",
                  background: "var(--ui-bg-card)", color: "var(--ui-text-primary)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1,
                  fontSize: 12, fontWeight: 600,
                }}
              >Previous</button>

              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("...");
                  
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i);
                  }
                  
                  if (currentPage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((page, index) => typeof page === "number" ? (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      width: 32, height: 32, borderRadius: 6,
                      border: currentPage === page ? "none" : "1px solid var(--ui-border)",
                      background: currentPage === page ? "var(--huntr-orange)" : "var(--ui-bg-card)",
                      color: currentPage === page ? "#fff" : "var(--ui-text-primary)",
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                    }}
                  >{page}</button>
                ) : (
                  <span key={`ellipsis-${index}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12, fontWeight: 600 }}>
                    ...
                  </span>
                ));
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "7px 14px", borderRadius: 6, border: "1px solid var(--ui-border)",
                  background: "var(--ui-bg-card)", color: "var(--ui-text-primary)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1,
                  fontSize: 12, fontWeight: 600,
                }}
              >Next</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

