import { apiGet } from "../client";

export interface GmvSubscriptionSummary {
  id: string;
  plan: string;
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
