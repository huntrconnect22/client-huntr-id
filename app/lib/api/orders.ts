import { apiGet, apiPost, apiPostForm } from "../client";

/**
 * Orders & RFQ API
 *
 * Tanggung jawab: Mengelola siklus pengadaan mulai dari RFQ hingga Receipt.
 */

// --- Orders ---
export const getOrders = (
  companyId: string | number,
  page: number = 1,
  perPage: number = 10,
  search: string = "",
  type: string = "all",
) => {
  let url = `/api/orders?company_id=${companyId}&page=${page}&per_page=${perPage}&type=${type}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return apiGet(url);
};

export const importHistoricalPo = (formData: FormData) =>
  apiPostForm("/api/orders/historical/import", formData);

// --- RFQ ---
export const createRfq = (payload: any) => {
  if (payload instanceof FormData) {
    return apiPostForm("/api/rfqs", payload);
  }
  return apiPost("/api/rfqs", payload);
};

export const getRfq = (id: string | number) => apiGet(`/api/rfqs/${id}`);

export const resubmitRfq = (rfqId: string | number, payload: FormData) =>
  apiPostForm(`/api/rfqs/${rfqId}/resubmit`, payload);

export const approveRfq = (
  rfqId: string | number,
  managerId: string | number,
) => apiPost(`/api/rfqs/${rfqId}/approve`, { manager_id: managerId });

export const createDirectPurchaseOrder = (payload: {
  company_id: string;
  rfq_id: string;
  vendor_name: string;
  vendor_address?: string;
  currency?: string;
  purchase_category?: string;
  purchase_type?: string;
  expected_receiving_date?: string;
}) => apiPost("/api/orders/direct", payload);

export const advanceDirectPurchaseOrder = (poId: string, companyId: string) =>
  apiPost(`/api/orders/${poId}/advance-direct`, { company_id: companyId });

// --- Proposals ---
export const submitProposal = (payload: any) => {
  if (payload instanceof FormData) {
    return apiPostForm("/api/proposals", payload);
  }
  return apiPost("/api/proposals", payload);
};

// --- Awarding ---
export const awardVendor = (payload: {
  rfq_id: string | number;
  proposal_id: string | number;
  manager_id: string | number;
}) => apiPost("/api/orders/award", payload);

// --- Receipts ---
export const createReceipt = (payload: {
  po_id: string | number;
  company_id: string | number;
  received_qty: number;
  handover_document_path: string;
  items_inspection?: any[];
}) => apiPost("/api/receipts", payload);

// --- Delivery & Invoice ---
export const arrangeDelivery = (
  poId: string | number,
  companyId: string | number,
  trackingNumber?: string,
) =>
  apiPost(`/api/orders/${poId}/arrange-delivery`, {
    company_id: companyId,
    tracking_number: trackingNumber,
  });

export const publishInvoice = (
  invoiceId: string | number,
  companyId: string | number,
) => apiPost(`/api/invoices/${invoiceId}/publish`, { company_id: companyId });

export const approveInvoice = (
  invoiceId: string | number,
  companyId: string | number,
) => apiPost(`/api/invoices/${invoiceId}/approve`, { company_id: companyId });

// --- Tracking ---
/** Vendor advances the PO tracking status (packing / in_transit / delivered) */
export const updatePoTrackingStatus = (
  poId: string | number,
  companyId: string | number,
  status: "packing" | "in_transit" | "delivered",
  note?: string,
) =>
  apiPost(`/api/orders/${poId}/update-tracking-status`, {
    company_id: companyId,
    status,
    note,
  });

/** Public tracking — no auth required */
export const publicTrackShipment = (params: {
  po_number?: string;
  tracking_number?: string;
}) => {
  const qs = new URLSearchParams();
  if (params.po_number) qs.set("po_number", params.po_number);
  if (params.tracking_number) qs.set("tracking_number", params.tracking_number);
  return apiGet(`/api/track?${qs.toString()}`);
};
