import { apiGet, apiPost, apiDelete } from "../client";

/**
 * e-Faktur API
 *
 * VAT Out (Faktur Pajak Keluaran) — via PajakExpress IF_TXR_001
 * VAT In  (Faktur Pajak Masukan)  — via PajakExpress IF_TXR_015
 */

/* ─── Types ──────────────────────────────────────────────────────── */

export interface EFaktur {
  id: string;
  bast_id?: string | null;
  po_id?: string | null;
  invoice_id?: string | null;
  pajak_express_id?: string | null;
  vat_type: "VAT_OUT" | "VAT_IN";
  nofa?: string | null;
  status: string;            // DRAFT | APPROVED | CANCELLED | CREATED
  no_invoice?: string | null;
  masa_pajak?: string | null;
  tahun_pajak?: string | null;
  tanggal_faktur?: string | null;
  dpp: number;
  ppn: number;
  kd_jenis_transaksi?: string | null;
  npwp_penjual?: string | null;
  created_at: string;
  purchase_order?: { po_number: string; total_amount: number } | null;
  bast?: { bast_number: string; bast_date: string } | null;
}

export interface VatInItem {
  id: string;
  nomorfaktur: string;
  namatokopenjual?: string;
  npwppenjual: string;
  namapembeli?: string;
  masapajak: string;
  tahunpajak: string;
  tanggalfaktur: string;
  totaldpp: string | number;
  totaldpplain?: string | number;
  totalppn: string | number;
  totalppnbm?: string | number;
  statusfaktur: string;
  statuspembeli?: string | null;
  buyerstatus?: string | null;
  tanggalapproval?: string | null;
  approvalsign?: string | null;
  referensi?: string | null;
}

export interface PrepopulatedItem {
  SellerTIN: string;
  SellerTaxpayerName: string;
  BuyerStatus: string | null;
  SellingPrice: number;
  VAT: number;
  STLG: number;
  ReportedBySeller: boolean;
  TaxInvoiceNumber: string;
  TaxInvoiceDate: string;
  TaxInvoicePeriod: string;
  TaxInvoiceYear: string;
  TaxInvoiceStatus: string;
  OtherTaxBase: number;
  Valid: boolean;
  Recorder: string;
}

export interface Bast {
  id: string;
  bast_number: string;
  bast_date: string;
  status: string;
  po_id?: string;
  purchase_order?: { po_number: string };
}

export interface BastItem {
  id: string;
  nama: string;
  qty: number;
  unit_price: number;
  uom: string;
  total: number;
}

export interface ItemOverride {
  id: string;
  nama: string;
  qty: number;
  unit_price: number;
  uom: string;
  kd_brg: string;   // kode barang DJP dipilih user
  satuan: string;   // kode satuan DJP dipilih user
}

/* ─── VAT OUT endpoints ──────────────────────────────────────────── */

/** Reference data: goods codes + satuan codes dari PajakExpress */
export const getEFakturReferences = () =>
  apiGet<{ goods: { code: string; bahasa: string; english: string }[]; satuan: { code: string; description: string }[] }>(
    "/api/efaktur/references"
  );

/** Ambil item-item PO dari BAST untuk preview sebelum terbitkan faktur */
export const getBastItems = (bastId: string) =>
  apiGet<{ po_number: string; items: BastItem[] }>(`/api/efaktur/bast/${bastId}/items`);

/** Terbitkan e-Faktur baru dari BAST yang sudah completed */
export const issueEFaktur = (payload: {
  bast_id: string;
  signer_name?: string;
  signer_jabatan?: string;
  signer_npwp?: string;
  signer_kota?: string;
  items_override?: ItemOverride[];
}) => apiPost<{ message: string; efaktur: EFaktur }>("/api/efaktur", payload);

/** List e-Faktur keluaran lokal milik company */
export const getEFakturs = (companyId: string, page = 1, perPage = 15) =>
  apiGet<{ data: EFaktur[]; current_page: number; last_page: number; total: number }>(
    `/api/efaktur?company_id=${companyId}&page=${page}&per_page=${perPage}`
  );

/** Detail satu e-Faktur + refresh status dari PajakExpress */
export const getEFaktur = (id: string) =>
  apiGet<{ efaktur: EFaktur }>(`/api/efaktur/${id}`);

/** Upload DRAFT ke DJP untuk mendapat nomor faktur resmi */
export const uploadEFaktur = (id: string, payload: {
  tempat_penandatangan: string;
  npwp_nik_penandatangan: string;
}) => apiPost<{ message: string; efaktur: EFaktur }>(`/api/efaktur/${id}/upload`, payload);

/** Cancel faktur yang sudah APPROVED */
export const cancelEFaktur = (id: string) =>
  apiPost<{ message: string }>(`/api/efaktur/${id}/cancel`, {});

/** Hapus DRAFT dari PajakExpress dan DB lokal */
export const deleteEFaktur = (id: string) =>
  apiDelete<{ message: string }>(`/api/efaktur/${id}`);

/** List langsung dari PajakExpress (tidak difilter lokal) */
export const getVatOutList = (page = 1, limit = 20) =>
  apiGet<{ data: any[]; metaPage: any }>(`/api/efaktur/vat-out/list?page=${page}&limit=${limit}`);

/* ─── VAT IN endpoints ───────────────────────────────────────────── */

/** List faktur masukan dari PajakExpress */
export const getVatInList = (params: {
  page?: number;
  limit?: number;
  periode?: string;  // format: MM/YYYY
}) => {
  const q = new URLSearchParams();
  if (params.page)    q.set("page",    String(params.page));
  if (params.limit)   q.set("limit",   String(params.limit));
  if (params.periode) q.set("periode", params.periode);
  return apiGet<{ data: VatInItem[]; metaPage: any }>(`/api/efaktur/vat-in?${q}`);
};

/** Inquiry prepopulated faktur masukan dari DJP */
export const prepopulatedVatIn = (payload: {
  tahun_pajak: string;
  masa_pajak: string;
  npwp_penjual?: string;
  nomor_faktur?: string;
}) => apiPost<{ data: { dataFaktur: PrepopulatedItem[] } }>("/api/efaktur/vat-in/prepopulated", payload);

/** Konfirmasi pengkreditan faktur masukan */
export const uploadVatIn = (payload: {
  nomor_faktur: string;
  masa_pajak: string;
  tahun_pajak: string;
  konfirmasi_pengkreditan?: 0 | 1;
}) => apiPost<{ message: string; result: any }>("/api/efaktur/vat-in/upload", payload);

/** Verifikasi faktur masukan */
export const verifyVatIn = (payload: {
  tahun_pajak: string;
  masa_pajak: string;
  npwp_penjual?: string;
  nomor_faktur?: string;
}) => apiPost<{ data: { dataFaktur: PrepopulatedItem[] } }>("/api/efaktur/vat-in/verify", payload);
