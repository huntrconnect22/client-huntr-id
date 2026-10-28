export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "bidding"
  | "scheduled"
  | "active"
  | "suspended"
  | "successful"
  | "failed"
  | "processing"
  | "completed"
  | "cancelled";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "disputed";

export interface CrowdBuyPriceTier {
  id?: string;
  campaign_id?: string;
  min_quantity: number;
  max_quantity?: number | null;
  unit_price: number;
}

export interface CrowdBuyBid {
  id: string;
  campaign_id: string;
  supplier_company_id: string;
  supplier_user_id?: string;
  offered_unit_price: number;
  min_order_qty: number;
  lead_time_days?: number | null;
  notes?: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  supplier_company?: {
    id: string;
    name: string;
    logo_path?: string | null;
    logo_url?: string | null;
  };
  supplier_user?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CrowdBuyCampaign {
  id: string;
  code: string;
  creator_type?: "supplier" | "buyer" | "system";
  campaign_type?: "supplier_promo" | "buyer_catalog" | "collective_rfq" | "auto_demand_aggregation";
  is_monthly_recurring?: boolean;
  monthly_delivery_day?: number;
  is_auto_demand?: boolean;
  monthly_delivery_schedule?: string;
  historical_metrics?: {
    monthly_average_qty?: number;
    monthly_order_frequency?: number;
    lowest_historical_price?: number;
    avg_historical_price?: number;
    buyer_companies_count?: number;
    total_historical_orders?: number;
    best_vendor_name?: string;
  } | null;
  initiator_company_id?: string | null;
  invite_code?: string | null;
  supplier_company_id?: string | null;
  created_by: string;
  catalogue_id?: string | null;
  title: string;
  description?: string | null;
  category: string;
  unit: string;
  base_price: number;
  target_price?: number | null;
  target_quantity: number;
  max_quantity?: number | null;
  min_order_qty: number;
  max_order_qty?: number | null;
  current_quantity: number;
  status: CampaignStatus;
  starts_at: string;
  ends_at: string;
  lead_time_days?: number | null;
  delivery_terms?: string | null;
  return_policy?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  progress_percentage: number;
  is_target_reached: boolean;
  days_remaining: number;
  is_active: boolean;
  is_buyer_initiated?: boolean;
  review_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    logo_path?: string | null;
    logo_url?: string | null;
    country?: string;
    region?: string;
    city?: string;
    industry_type?: string;
    status?: string;
  };
  initiator_company?: {
    id: string;
    name: string;
    logo_path?: string | null;
    logo_url?: string | null;
    country?: string;
    region?: string;
    city?: string;
  };
  price_tiers?: CrowdBuyPriceTier[];
  orders_count?: number;
  bids?: CrowdBuyBid[];
  bids_count?: number;
}

export interface CrowdBuyShippingAddress {
  recipient_name: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postal_code?: string;
}

export interface CrowdBuyPayment {
  id: string;
  crowd_buy_order_id: string;
  external_id: string;
  transaction_id?: string | null;
  amount: number;
  payment_type?: string | null;
  payment_method?: string | null;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  payment_info?: {
    va_number?: string;
    bank?: string;
    payment_url?: string;
    simulation?: boolean;
  };
  paid_at?: string | null;
  created_at: string;
}

export interface CrowdBuyOrder {
  id: string;
  order_number: string;
  campaign_id: string;
  buyer_company_id: string;
  user_id: string;
  quantity: number;
  is_monthly_commitment?: boolean;
  monthly_commitment_qty?: number | null;
  delivery_point?: string | null;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: CrowdBuyShippingAddress;
  status: OrderStatus;
  payment_deadline?: string | null;
  paid_at?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  campaign?: CrowdBuyCampaign;
  buyer_company?: {
    id: string;
    name: string;
    logo_url?: string;
    phone?: string;
    email?: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string;
  };
  latest_payment?: CrowdBuyPayment | null;
}

export interface CrowdBuyAdminStats {
  total_campaigns: number;
  pending_review: number;
  active_campaigns: number;
  successful_campaigns: number;
  failed_campaigns: number;
  realized_gmv: number;
  valid_orders_count: number;
}


