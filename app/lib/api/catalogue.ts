import { apiGet, apiPost, apiPut, apiPostForm } from "../client";

/**
 * Catalogue API
 * 
 * Tanggung jawab: Mengelola item katalog produk.
 */

export const createCatalogue = (formData: FormData) =>
  apiPostForm("/api/catalogues", formData);

export const updateCatalogue = (id: string | number, formData: FormData) => {
  formData.append("_method", "PUT");
  return apiPostForm(`/api/catalogues/${id}`, formData);
};

export const importCatalogue = (formData: FormData) =>
  apiPostForm("/api/catalogues/import", formData);

export const getCatalogues = (params?: { company_id?: string | number; search?: string; category?: string; page?: number; per_page?: number }) => {
  let url = `/api/catalogues?page=${params?.page || 1}`;
  if (params?.per_page) url += `&per_page=${params.per_page}`;
  if (params?.company_id) url += `&company_id=${params.company_id}`;
  if (params?.search) url += `&search=${encodeURIComponent(params.search)}`;
  if (params?.category) url += `&category=${encodeURIComponent(params.category)}`;
  return apiGet(url);
};

export const getCatalogue = (id: string | number) =>
  apiGet(`/api/catalogues/${id}`);

/**
 * Trending search keywords — dipakai di vendor dashboard.
 * @param limit jumlah keyword (default 10)
 * @param days  window waktu dalam hari (default 30)
 */
export const getTrendingSearches = (limit = 10, days = 30) =>
  apiGet(`/api/analytics/trending-searches?limit=${limit}&days=${days}`);
