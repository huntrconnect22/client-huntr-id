import { apiGet, apiPost } from "../client";

export interface GmvSubscriptionSummary {
  id: string;
  plan: string;
  enterprise_plan?: string | null;
  billing_cycle?: string | null;
  is_trial?: boolean;
  scheduled_change?: { enterprise_plan: string; starts_at: string | null } | null;
  tax_quota?: { limit: number; used: number; ends_at: string } | null;
  ai_quota?: { total_requests: number; total_tokens: number; total_cost_usd: number; month: string; limit: number; remaining: number; plan_name: string; period: string } | null;
  status: "active" | "renewal_required" | "expired" | string;
  overflow_strategy: "transaction_fee" | "renewal_required";
  upfront_fee: number;
  gmv_limit: number;
  current_realized_gmv: number;
  reserved_gmv: number;
  available_gmv: number;
  starts_at: string;
  ends_at: string;
}

export const getCompanySubscription = (companyId: string) =>
  apiGet(`/api/companies/${encodeURIComponent(companyId)}/subscription`);

export interface SubscriptionAccess {
  overdue: boolean;
  overdue_since: string | null;
  active_enterprise: boolean;
  enterprise_plan: string | null;
  is_trial: boolean;
  ends_at: string | null;
}

export const getSubscriptionAccess = (companyId: string) =>
  apiGet<{ access: SubscriptionAccess }>(`/api/companies/${encodeURIComponent(companyId)}/subscription/access`);

export interface EnterprisePlan {
  key: string;
  name: string;
  monthly_price: number | null;
  annual_price: number | null;
  users: number | null;
  companies: number | null;
  tax_documents_per_year: number | null;
  support: string | null;
  warehouses: number | null;
  ai_requests_per_month: number | null;
}

export interface EnterpriseAddon {
  key: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  billing_cycle: "monthly" | "one_time";
}

export interface EnterpriseCatalog {
  version: string;
  plans: EnterprisePlan[];
  addons: EnterpriseAddon[];
  vendor_free: boolean;
  checkout_enabled: boolean;
  onboarding_business_days: { min: number; max: number };
}

export const getEnterpriseCatalog = () =>
  apiGet<EnterpriseCatalog>("/api/subscription/plans");

export interface SubscriptionCheckout {
  id: string;
  order_id: string;
  enterprise_plan: string;
  billing_cycle: string;
  amount: number;
  payment_method: string;
  purchase_type: "plan" | "addon" | "addons";
  addon_key: string | null;
  addons_snapshot?: { key: string; name: string; quantity: number; price: number; billing_cycle: string }[] | null;
  quantity: number;
  status: string;
  payment_info: { va_number?: string; bill_key?: string; biller_code?: string; expiry_time?: string } | null;
}

export const createSubscriptionCheckout = (companyId: string, data: Record<string, unknown>) =>
  apiPost<{checkout: SubscriptionCheckout}>(`/api/companies/${encodeURIComponent(companyId)}/subscription/checkouts`, data);
export const getCurrentSubscriptionCheckout = (companyId: string) =>
  apiGet<{checkout: SubscriptionCheckout | null}>(`/api/companies/${encodeURIComponent(companyId)}/subscription/checkouts/current`);
export const refreshSubscriptionCheckout = (companyId: string, checkoutId: string) =>
  apiGet<{checkout: SubscriptionCheckout}>(`/api/companies/${encodeURIComponent(companyId)}/subscription/checkouts/${encodeURIComponent(checkoutId)}`);

export interface PricingAnnouncement {
  id: string;
  code: string;
  published_at: string;
}

export const getPricingAnnouncement = (companyId: string) =>
  apiGet<{ announcement: PricingAnnouncement | null }>(
    `/api/companies/${encodeURIComponent(companyId)}/subscription/pricing-announcement`,
  );

export const acknowledgePricingAnnouncement = (companyId: string, announcementId: string) =>
  apiPost<{ acknowledged: boolean }>(
    `/api/companies/${encodeURIComponent(companyId)}/subscription/pricing-announcement/${encodeURIComponent(announcementId)}/acknowledge`,
    {},
  );
