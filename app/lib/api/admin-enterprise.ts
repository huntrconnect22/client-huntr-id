import { apiGet, apiPost } from "../client";

export interface EnterprisePlanConfig {
  key: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  users: number;
  companies: number;
  tax_documents_per_year: number;
  support: string;
  warehouses: number;
  ai_requests_per_month: number;
}
export interface EnterpriseAddonConfig {
  key: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  billing_cycle: string;
}
export interface EnterprisePricing {
  version: string;
  plans: EnterprisePlanConfig[];
  addons: EnterpriseAddonConfig[];
  checkout_enabled: boolean;
  audit: {
    id: string;
    admin_name: string | null;
    created_at: string;
    before: string;
    after: string;
  }[];
}
export interface EnterpriseTransaction {
  id: string;
  order_id: string;
  company_name: string;
  purchase_type: string;
  enterprise_plan: string;
  addon_key: string | null;
  addons_snapshot: { key: string; name: string; quantity: number; price: number }[];
  quantity: number;
  billing_cycle: string;
  amount: number;
  payment_method: string;
  status: string;
  billing_email_sent_at: string | null;
  created_at: string;
}
export interface EnterpriseMonitoring {
  summary: {
    total: number;
    paid_count: number;
    paid_amount: number;
    pending_count: number;
    needs_attention: number;
    active_subscriptions: number;
  };
  transactions: {
    data: EnterpriseTransaction[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export function getEnterpriseMonitoring(
  params: Record<string, string | number>,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "") query.set(key, String(value));
  });
  return apiGet<EnterpriseMonitoring>(
    `/api/admin/enterprise/transactions?${query}`,
  );
}
export const getEnterprisePricing = () =>
  apiGet<EnterprisePricing>("/api/admin/enterprise/pricing");
export const saveEnterprisePricing = (payload: Record<string, unknown>) =>
  apiPost<EnterprisePricing>("/api/admin/enterprise/pricing", payload);
export const refreshEnterpriseTransaction = (id: string) =>
  apiPost<{ status: string }>(
    `/api/admin/enterprise/transactions/${encodeURIComponent(id)}/refresh`,
    {},
  );
