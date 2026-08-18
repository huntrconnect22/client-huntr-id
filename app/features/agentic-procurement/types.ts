export interface StepStatus {
  step: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed";
  summary?: string;
  [key: string]: any;
}

export interface PresetPrompt {
  title: string;
  category: string;
  prompt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    title: "10 Laptop Dev & 5 Monitor 4K",
    category: "IT Hardware",
    prompt:
      "Pengadaan 10 unit laptop Core i7 / Ryzen 7, RAM 32GB, 1TB SSD untuk tim engineer, dan 5 unit monitor 27 inch 4K. Tolong cari barang yang cocok di katalog, bandingkan spesifikasinya, dan susun draft PR lengkap beserta justifikasi teknis dan estimasi harga.",
  },
  {
    title: "25 Kursi Ergonomis & 15 Meja",
    category: "General Affairs",
    prompt:
      "Pengadaan 25 unit kursi kerja ergonomis lumbar support breathable mesh dan 15 unit meja kerja adjustable height untuk ekspansi lantai 3 kantor. Buatkan PR lengkap dengan estimasi budget dan spesifikasi daya tahan.",
  },
  {
    title: "50 Set APD Proyek Lapangan",
    category: "HSE & Safety",
    prompt:
      "Pengadaan APD proyek: 50 helm safety ANSI Z89.1, 50 pasang safety shoes steel toe cap SNI/EN ISO, dan 50 rompi reflektif high-visibility. Target pengiriman 14 hari.",
  },
  {
    title: "Server Rack 42U & UPS 3000VA",
    category: "Infrastructure",
    prompt:
      "Pengadaan 1 unit Server Rack 42U 19-inch dengan sistem pendingin fan kit, PDU 16 port, dan 2 unit Online UPS 3000VA untuk upgrade ruang server IT.",
  },
];
