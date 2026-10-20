import { apiGet, apiPost, apiPostForm, apiDelete } from "../client";

/**
 * Admin API
 * 
 * Tanggung jawab: Endpoint khusus untuk administrator (audit, list perusahaan).
 */

export const adminLogin = (payload: Record<string, any>) =>
  apiPost("/api/admin/auth/login", payload);

export const adminGetAdmins = () => apiGet("/api/admin/admins");
export const adminCreateAdmin = (payload: Record<string, any>) => apiPost("/api/admin/admins", payload);

export const adminGetCompanies = (params?: { page?: number; per_page?: number; search?: string; status?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.per_page) query.append("per_page", params.per_page.toString());
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  
  const queryString = query.toString();
  return apiGet(`/api/admin/companies${queryString ? `?${queryString}` : ""}`);
};

export const adminAuditCompany = (id: string | number, payload: { action: "approve" | "decline" | "request_docs"; notes?: string }) =>
  apiPost(`/api/admin/companies/${id}/audit`, payload);

export const adminGetCompanySubscription = (companyId: string) =>
  apiGet(`/api/admin/companies/${companyId}/subscription`);

export const adminActivateCompanySubscription = (companyId: string, payload: {
  gmv_limit: number;
  overflow_strategy: "transaction_fee" | "renewal_required";
  payment_verified: true;
}) => apiPost(`/api/admin/companies/${companyId}/subscription`, payload);

export const adminUpdateCompanySubscriptionScheme = (companyId: string, payload: {
  plan: "annual_upfront_po" | "saas_subscription" | "per_po" | "gmv_subscription";
  fee_percent?: number;
  ppn_percent?: number;
  pph23_percent?: number;
  saas_fee?: number;
  saas_cycle?: "monthly" | "annual";
  gmv_limit?: number;
  overflow_strategy?: "transaction_fee" | "renewal_required";
  payment_verified?: boolean;
  use_historical_po?: boolean;
}) => apiPost(`/api/admin/companies/${companyId}/subscription-scheme`, payload);

export const adminGetSubscriptionSettings = () =>
  apiGet("/api/admin/subscription-settings");

export const adminUpdateSubscriptionSettings = (payload: {
  allow_all_migration?: boolean;
  default_plan?: string;
  fee_percent?: number;
  ppn_percent?: number;
  pph23_percent?: number;
  saas_fee?: number;
  saas_cycle?: "monthly" | "annual";
  per_po_rate?: number;
}) => apiPost("/api/admin/subscription-settings", payload);

export const adminBulkApplySubscription = (payload: {
  plan: "annual_upfront_po" | "saas_subscription" | "per_po";
  fee_percent?: number;
  ppn_percent?: number;
  pph23_percent?: number;
  saas_fee?: number;
  overflow_strategy?: "transaction_fee" | "renewal_required";
}) => apiPost("/api/admin/subscription-settings/bulk-apply", payload);

// Catalogue
export const adminGetCatalogue = (params?: { page?: number; per_page?: number; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.per_page) query.append("per_page", params.per_page.toString());
  if (params?.search) query.append("search", params.search);
  
  const queryString = query.toString();
  return apiGet(`/api/admin/catalogues${queryString ? `?${queryString}` : ""}`);
};

export const adminCreateCatalogueItem = (payload: FormData) =>
  apiPostForm("/api/admin/catalogues", payload);

export const adminUpdateCatalogueItem = (id: string, payload: FormData) =>
  apiPostForm(`/api/admin/catalogues/${id}`, payload);

export const adminDeleteCatalogueItem = (id: string) =>
  apiDelete(`/api/admin/catalogues/${id}`);

// Transactions
export const adminGetTransactions = (params?: { page?: number; per_page?: number; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.per_page) query.append("per_page", params.per_page.toString());
  if (params?.search) query.append("search", params.search);
  
  const queryString = query.toString();
  return apiGet(`/api/admin/transactions${queryString ? `?${queryString}` : ""}`);
};

export const adminGetEscrowSummary = () =>
  apiGet("/api/admin/transactions/escrow-summary");

// Users
export const adminGetUsers = (params?: { page?: number; per_page?: number; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.per_page) query.append("per_page", params.per_page.toString());
  if (params?.search) query.append("search", params.search);

  const queryString = query.toString();
  return apiGet(`/api/admin/users${queryString ? `?${queryString}` : ""}`);
};

export const adminDeleteUser = (userId: string) =>
  apiDelete(`/api/admin/users/${userId}`);

export const adminChangeUserPassword = (userId: string | number, payload: {
  password: string;
  password_confirmation: string;
}) => apiPost(`/api/admin/users/${userId}/change-password`, payload);


export const adminGetCompanyImports = (companyId: string, params?: { page?: number; per_page?: number }) => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.per_page) query.append("per_page", params.per_page.toString());
  const queryString = query.toString();
  return apiGet(`/api/admin/companies/${companyId}/imports${queryString ? `?${queryString}` : ""}`);
};
