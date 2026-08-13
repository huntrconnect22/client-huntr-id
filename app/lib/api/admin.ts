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

export const adminAuditCompany = (id: string | number, payload: { action: "approve" | "decline"; notes?: string }) =>
  apiPost(`/api/admin/companies/${id}/audit`, payload);

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
