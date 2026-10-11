import { apiDelete, apiGet, apiPost, apiPut } from "../client";

function companyQuery(companyId: string) {
  return `company_id=${encodeURIComponent(companyId)}`;
}

export const getWmsApps = (companyId: string) =>
  apiGet<any>(`/api/wms/apps?${companyQuery(companyId)}`);
export const installWms = (companyId: string) =>
  apiPost<any>(`/api/wms/apps/install`, { company_id: companyId });
export const uninstallWms = (companyId: string) =>
  apiDelete<any>(`/api/wms/apps/install?${companyQuery(companyId)}`);
export const getWmsDashboard = (companyId: string, activityPage = 1) =>
  apiGet<any>(
    `/api/wms/dashboard?${companyQuery(companyId)}&activity_page=${activityPage}`,
  );
export const getWarehouses = (companyId: string) =>
  apiGet<any>(`/api/wms/warehouses?${companyQuery(companyId)}`);
export const createWarehouse = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/warehouses`, { ...data, company_id: companyId });
export const updateWarehouse = (
  companyId: string,
  warehouseId: string,
  data: any,
) =>
  apiPut<any>(`/api/wms/warehouses/${warehouseId}`, {
    ...data,
    company_id: companyId,
  });
export const createWarehouseBin = (
  companyId: string,
  warehouseId: string,
  data: any,
) =>
  apiPost<any>(`/api/wms/warehouses/${warehouseId}/bins`, {
    ...data,
    warehouse_id: warehouseId,
    company_id: companyId,
  });
export const updateWarehouseBin = (
  companyId: string,
  warehouseId: string,
  binId: string,
  data: any,
) =>
  apiPut<any>(`/api/wms/warehouses/${warehouseId}/bins/${binId}`, {
    ...data,
    company_id: companyId,
  });
export const deleteWarehouseBin = (
  companyId: string,
  warehouseId: string,
  binId: string,
) =>
  apiDelete<any>(
    `/api/wms/warehouses/${warehouseId}/bins/${binId}?${companyQuery(companyId)}`,
  );
export const getWarehouseBinStock = (
  companyId: string,
  warehouseId: string,
  binId: string,
) =>
  apiGet<any>(
    `/api/wms/warehouses/${warehouseId}/bins/${binId}/stock?${companyQuery(companyId)}`,
  );
export const getWarehouseBins = (companyId: string, warehouseId: string) =>
  apiGet<any>(
    `/api/wms/warehouses/${warehouseId}/bins?${companyQuery(companyId)}`,
  );
export const getWmsCatalogue = (companyId: string) =>
  apiGet<any>(`/api/wms/catalogue?${companyQuery(companyId)}`);
export const getInboundPurchaseOrders = (companyId: string) =>
  apiGet<any>(`/api/wms/inbound-orders?${companyQuery(companyId)}`);
export const getWmsStock = (
  companyId: string,
  filters?: {
    warehouse_id?: string;
    bin_id?: string;
    bin_location?: string;
    search?: string;
  },
) => {
  const query = new URLSearchParams({ company_id: companyId });
  if (filters?.warehouse_id) query.set("warehouse_id", filters.warehouse_id);
  if (filters?.bin_id) query.set("bin_id", filters.bin_id);
  if (filters?.bin_location) query.set("bin_location", filters.bin_location);
  if (filters?.search) query.set("search", filters.search);
  return apiGet<any>(`/api/wms/stock?${query.toString()}`);
};
export const setWmsReorderLevel = (
  companyId: string,
  stockId: number,
  reorder_level: number,
) =>
  apiPut<any>(`/api/wms/stock/${stockId}/reorder-level`, {
    company_id: companyId,
    reorder_level,
  });
export const receiveStock = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/receiving`, { ...data, company_id: companyId });
export const importExistingGoodsReceipts = (
  companyId: string,
  warehouseId: string,
) =>
  apiPost<any>(`/api/wms/goods-receipts/import`, {
    company_id: companyId,
    warehouse_id: warehouseId,
  });
export const repairWmsLegacyGoodsReceiptStock = (companyId: string) =>
  apiPost<{ repaired_receipt_count: number; repaired_stock_count: number }>(
    `/api/wms/goods-receipts/repair-legacy`,
    { company_id: companyId },
  );
export const getWmsReceipts = (companyId: string) =>
  apiGet<any>(`/api/wms/receipts?${companyQuery(companyId)}`);
export const putAwayStock = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/putaway`, { ...data, company_id: companyId });
export const adjustStock = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/adjustments`, { ...data, company_id: companyId });
export const transferStock = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/transfers`, { ...data, company_id: companyId });
export const allocateStock = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/allocations`, { ...data, company_id: companyId });
export const checkWmsStockAvailability = (companyId: string, data: any) =>
  apiPost<any>(`/api/wms/stock/availability`, {
    ...data,
    company_id: companyId,
  });
export const startWmsPicking = (companyId: string, orderId: number) =>
  apiPost<any>(`/api/wms/orders/${orderId}/start-picking`, {
    company_id: companyId,
  });
export const releaseWmsOrder = (companyId: string, orderId: number) =>
  apiPost<any>(`/api/wms/orders/${orderId}/release`, { company_id: companyId });
export const packWmsOrder = (
  companyId: string,
  orderId: number,
  packing_notes?: string,
) =>
  apiPost<any>(`/api/wms/orders/${orderId}/pack`, {
    company_id: companyId,
    packing_notes,
  });
export const shipWmsOrder = (companyId: string, orderId: number, data: any) =>
  apiPost<any>(`/api/wms/orders/${orderId}/ship`, {
    ...data,
    company_id: companyId,
  });
export const getWmsOrders = (companyId: string) =>
  apiGet<any>(`/api/wms/orders?${companyQuery(companyId)}`);
export const getWmsReport = (companyId: string) =>
  apiGet<any>(`/api/wms/reports?${companyQuery(companyId)}`);
