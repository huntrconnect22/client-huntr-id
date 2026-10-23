import { apiDelete, apiGet, apiPost, apiPut } from "../client";

const query = (companyId: string, params: Record<string, string | number | undefined> = {}) => {
  const values = new URLSearchParams({ company_id: companyId });
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") values.set(key, String(value)); });
  return values.toString();
};

export const getBudgetApps = (companyId: string) => apiGet<any>(`/api/budgeting/apps?${query(companyId)}`);
export const installBudgetApp = (companyId: string) => apiPost<any>("/api/budgeting/apps/install", { company_id: companyId });
export const uninstallBudgetApp = (companyId: string) => apiDelete<any>(`/api/budgeting/apps/install?${query(companyId)}`);
export const getBudgetDashboard = (companyId: string, cycleId?: string) => apiGet<any>(`/api/budgeting/dashboard?${query(companyId, { budget_cycle_id: cycleId })}`);
export const createBudgetCycle = (companyId: string, data: Record<string, unknown>) => apiPost<any>("/api/budgeting/cycles", { company_id: companyId, ...data });
export const updateBudgetCycle = (companyId: string, id: string, data: Record<string, unknown>) => apiPut<any>(`/api/budgeting/cycles/${id}`, { company_id: companyId, ...data });
export const activateBudgetCycle = (companyId: string, id: string) => apiPost<any>(`/api/budgeting/cycles/${id}/activate`, { company_id: companyId });
export const createBudgetLine = (companyId: string, data: Record<string, unknown>) => apiPost<any>("/api/budgeting/lines", { company_id: companyId, ...data });
export const updateBudgetLine = (companyId: string, id: string, data: Record<string, unknown>) => apiPut<any>(`/api/budgeting/lines/${id}`, { company_id: companyId, ...data });
export const getProcurementPlans = (companyId: string, filters: Record<string, string | number | undefined> = {}) => apiGet<any>(`/api/budgeting/plans?${query(companyId, filters)}`);
export const createProcurementPlan = (companyId: string, data: Record<string, unknown>) => apiPost<any>("/api/budgeting/plans", { company_id: companyId, ...data });
export const updateProcurementPlan = (companyId: string, id: string, data: Record<string, unknown>) => apiPut<any>(`/api/budgeting/plans/${id}`, { company_id: companyId, ...data });
export const submitProcurementPlan = (companyId: string, id: string) => apiPost<any>(`/api/budgeting/plans/${id}/submit`, { company_id: companyId });
export const approveProcurementPlan = (companyId: string, id: string, note = "") => apiPost<any>(`/api/budgeting/plans/${id}/approve`, { company_id: companyId, note });
export const rejectProcurementPlan = (companyId: string, id: string, note = "") => apiPost<any>(`/api/budgeting/plans/${id}/reject`, { company_id: companyId, note });
export const linkProcurementPlanRfq = (companyId: string, id: string, rfqId: string) => apiPost<any>(`/api/budgeting/plans/${id}/link-rfq`, { company_id: companyId, rfq_id: rfqId });
export const linkProcurementPlanPo = (companyId: string, id: string, purchaseOrderId: string, amount?: number) => apiPost<any>(`/api/budgeting/plans/${id}/link-purchase-order`, { company_id: companyId, purchase_order_id: purchaseOrderId, ...(amount ? { amount } : {}) });
export const recordProcurementPlanActual = (companyId: string, id: string, amount?: number) => apiPost<any>(`/api/budgeting/plans/${id}/actuals`, { company_id: companyId, ...(amount ? { amount } : {}) });
