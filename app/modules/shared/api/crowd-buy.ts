import { apiGet, apiPost, apiPut } from "~/shared/services/http/client";
import type {
  CrowdBuyCampaign,
  CrowdBuyOrder,
  CrowdBuyPayment,
  CrowdBuyAdminStats,
  CrowdBuyShippingAddress,
  CrowdBuyPriceTier,
} from "~/features/crowd-buy/types";

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const crowdBuyApi = {
  // ── Public / Catalog ────────────────────────────────────────────────────────
  async getPublicCampaigns(params?: {
    search?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    page?: number;
    per_page?: number;
    campaign_type?: string;
    creator_type?: string;
  }): Promise<PaginatedResponse<CrowdBuyCampaign>> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.min_price) query.set("min_price", String(params.min_price));
    if (params?.max_price) query.set("max_price", String(params.max_price));
    if (params?.sort) query.set("sort", params.sort);
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    if (params?.campaign_type) query.set("campaign_type", params.campaign_type);
    if (params?.creator_type) query.set("creator_type", params.creator_type);

    return apiGet<PaginatedResponse<CrowdBuyCampaign>>(
      `/api/crowd-buy/campaigns?${query.toString()}`
    );
  },

  async getCategories(): Promise<string[]> {
    return apiGet<string[]>("/api/crowd-buy/campaigns/categories");
  },

  async getCampaignDetail(idOrCode: string): Promise<{
    campaign: CrowdBuyCampaign;
    participants_count: number;
  }> {
    return apiGet<{
      campaign: CrowdBuyCampaign;
      participants_count: number;
    }>(`/api/crowd-buy/campaigns/${idOrCode}`);
  },

  // ── Buyer Orders ────────────────────────────────────────────────────────────
  async createOrder(
    campaignId: string,
    data: {
      quantity: number;
      shipping_address: CrowdBuyShippingAddress;
      is_monthly_commitment?: boolean;
      monthly_commitment_qty?: number;
      delivery_point?: string;
      notes?: string;
    }
  ): Promise<{ message: string; order: CrowdBuyOrder }> {
    return apiPost<{ message: string; order: CrowdBuyOrder }>(
      `/api/crowd-buy/campaigns/${campaignId}/orders`,
      data
    );
  },

  async getBuyerOrders(params?: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<CrowdBuyOrder>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));

    return apiGet<PaginatedResponse<CrowdBuyOrder>>(
      `/api/crowd-buy/orders?${query.toString()}`
    );
  },

  async getOrderDetail(orderId: string): Promise<{ order: CrowdBuyOrder }> {
    return apiGet<{ order: CrowdBuyOrder }>(
      `/api/crowd-buy/orders/${orderId}`
    );
  },

  async cancelOrder(
    orderId: string,
    reason?: string
  ): Promise<{ message: string; order: CrowdBuyOrder }> {
    return apiPost<{ message: string; order: CrowdBuyOrder }>(
      `/api/crowd-buy/orders/${orderId}/cancel`,
      { reason }
    );
  },

  async payOrder(
    orderId: string,
    paymentMethod: string = "bank_transfer"
  ): Promise<{ message: string; payment: CrowdBuyPayment }> {
    return apiPost<{ message: string; payment: CrowdBuyPayment }>(
      `/api/crowd-buy/orders/${orderId}/pay`,
      { payment_method: paymentMethod }
    );
  },

  async simulatePayOrder(
    orderId: string
  ): Promise<{ message: string; order: CrowdBuyOrder }> {
    return apiPost<{ message: string; order: CrowdBuyOrder }>(
      `/api/crowd-buy/orders/${orderId}/simulate-pay`,
      {}
    );
  },

  // ── Buyer Initiatives (Demand Pooling & Group Buying) ───────────────────────
  async getBuyerInitiatives(params?: {
    status?: string;
    campaign_type?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<CrowdBuyCampaign>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.campaign_type) query.set("campaign_type", params.campaign_type);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));

    return apiGet<PaginatedResponse<CrowdBuyCampaign>>(
      `/api/crowd-buy/initiatives?${query.toString()}`
    );
  },

  async getSuppliers(): Promise<
    Array<{ id: string; name: string; email?: string; industry_type?: string; logo_path?: string }>
  > {
    return apiGet<
      Array<{ id: string; name: string; email?: string; industry_type?: string; logo_path?: string }>
    >("/api/crowd-buy/suppliers");
  },

  async createBuyerInitiative(data: {
    campaign_type: "buyer_catalog" | "collective_rfq";
    title: string;
    description?: string;
    category: string;
    unit: string;
    target_quantity: number;
    ends_at: string;
    supplier_company_id?: string;
    catalogue_id?: string;
    base_price?: number;
    target_price?: number;
    min_order_qty?: number;
    max_order_qty?: number;
    max_quantity?: number | null;
    lead_time_days?: number | null;
    delivery_terms?: string;
    return_policy?: string;
    image_path?: string;
    price_tiers?: CrowdBuyPriceTier[];
    initial_quantity?: number;
    initial_shipping_address?: CrowdBuyShippingAddress;
  }): Promise<{ message: string; campaign: CrowdBuyCampaign; invite_code: string }> {
    return apiPost<{ message: string; campaign: CrowdBuyCampaign; invite_code: string }>(
      "/api/crowd-buy/initiatives",
      data
    );
  },

  async acceptSupplierBid(
    campaignId: string,
    bidId: string
  ): Promise<{ message: string; campaign: CrowdBuyCampaign }> {
    return apiPost<{ message: string; campaign: CrowdBuyCampaign }>(
      `/api/crowd-buy/initiatives/${campaignId}/accept-bid/${bidId}`,
      {}
    );
  },

  async resolveInviteCode(inviteCode: string): Promise<{
    campaign: CrowdBuyCampaign;
    is_valid: boolean;
  }> {
    return apiGet<{
      campaign: CrowdBuyCampaign;
      is_valid: boolean;
    }>(`/api/crowd-buy/invite/${inviteCode}`);
  },

  // ── Supplier Collective RFQ Bidding ─────────────────────────────────────────
  async getCollectiveRfqs(params?: {
    category?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<CrowdBuyCampaign>> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));

    return apiGet<PaginatedResponse<CrowdBuyCampaign>>(
      `/api/crowd-buy/supplier/collective-rfqs?${query.toString()}`
    );
  },

  async submitSupplierBid(
    campaignId: string,
    data: {
      offered_unit_price: number;
      min_order_qty?: number;
      lead_time_days?: number;
      notes?: string;
    }
  ): Promise<{ message: string; bid: any }> {
    return apiPost<{ message: string; bid: any }>(
      `/api/crowd-buy/supplier/collective-rfqs/${campaignId}/bids`,
      data
    );
  },

  // ── Supplier Management ─────────────────────────────────────────────────────
  async getSupplierCampaigns(params?: {
    status?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<CrowdBuyCampaign>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));

    return apiGet<PaginatedResponse<CrowdBuyCampaign>>(
      `/api/crowd-buy/supplier/campaigns?${query.toString()}`
    );
  },

  async createSupplierCampaign(data: {
    title: string;
    description?: string;
    category: string;
    unit: string;
    base_price: number;
    target_quantity: number;
    max_quantity?: number | null;
    min_order_qty: number;
    max_order_qty?: number | null;
    starts_at: string;
    ends_at: string;
    lead_time_days?: number | null;
    delivery_terms?: string | null;
    return_policy?: string | null;
    image_path?: string | null;
    price_tiers?: CrowdBuyPriceTier[];
  }): Promise<{ message: string; campaign: CrowdBuyCampaign }> {
    return apiPost<{ message: string; campaign: CrowdBuyCampaign }>(
      `/api/crowd-buy/supplier/campaigns`,
      data
    );
  },

  async updateSupplierCampaign(
    campaignId: string,
    data: Partial<CrowdBuyCampaign>
  ): Promise<{ message: string; campaign: CrowdBuyCampaign }> {
    return apiPut<{ message: string; campaign: CrowdBuyCampaign }>(
      `/api/crowd-buy/supplier/campaigns/${campaignId}`,
      data as Record<string, any>
    );
  },

  async submitSupplierCampaign(
    campaignId: string
  ): Promise<{ message: string; campaign: CrowdBuyCampaign }> {
    return apiPost<{ message: string; campaign: CrowdBuyCampaign }>(
      `/api/crowd-buy/supplier/campaigns/${campaignId}/submit`,
      {}
    );
  },

  async getSupplierOrders(params?: {
    campaign_id?: string;
    status?: string;
    page?: number;
  }): Promise<PaginatedResponse<CrowdBuyOrder>> {
    const query = new URLSearchParams();
    if (params?.campaign_id) query.set("campaign_id", params.campaign_id);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));

    return apiGet<PaginatedResponse<CrowdBuyOrder>>(
      `/api/crowd-buy/supplier/orders?${query.toString()}`
    );
  },

  async fulfillOrder(
    orderId: string,
    data: {
      status: "processing" | "shipped" | "delivered";
      carrier?: string;
      tracking_number?: string;
      notes?: string;
    }
  ): Promise<{ message: string; order: CrowdBuyOrder }> {
    return apiPost<{ message: string; order: CrowdBuyOrder }>(
      `/api/crowd-buy/supplier/orders/${orderId}/fulfill`,
      data
    );
  },

  // ── Admin Moderation ────────────────────────────────────────────────────────
  async getAdminCampaigns(params?: {
    status?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<CrowdBuyCampaign>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));

    return apiGet<PaginatedResponse<CrowdBuyCampaign>>(
      `/api/admin/crowd-buy/campaigns?${query.toString()}`
    );
  },

  async getAdminDashboard(): Promise<{
    stats: CrowdBuyAdminStats;
    recent_campaigns: CrowdBuyCampaign[];
  }> {
    return apiGet<{
      stats: CrowdBuyAdminStats;
      recent_campaigns: CrowdBuyCampaign[];
    }>("/api/admin/crowd-buy/dashboard");
  },

  async reviewAdminCampaign(
    campaignId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<{ message: string; campaign: CrowdBuyCampaign }> {
    return apiPost<{ message: string; campaign: CrowdBuyCampaign }>(
      `/api/admin/crowd-buy/campaigns/${campaignId}/review`,
      { action, notes }
    );
  },

  async suspendAdminCampaign(
    campaignId: string,
    reason?: string
  ): Promise<{ message: string; campaign: CrowdBuyCampaign }> {
    return apiPost<{ message: string; campaign: CrowdBuyCampaign }>(
      `/api/admin/crowd-buy/campaigns/${campaignId}/suspend`,
      { reason }
    );
  },

  async evaluateCampaigns(): Promise<{
    message: string;
    results: { successful: number; failed: number };
  }> {
    return apiPost<{
      message: string;
      results: { successful: number; failed: number };
    }>("/api/admin/crowd-buy/evaluate", {});
  },

  async getHistoricalDemands(params?: { min_freq?: number; limit?: number }): Promise<{
    total: number;
    demands: any[];
  }> {
    const query = new URLSearchParams();
    if (params?.min_freq) query.set("min_freq", String(params.min_freq));
    if (params?.limit) query.set("limit", String(params.limit));
    return apiGet<{ total: number; demands: any[] }>(`/api/admin/crowd-buy/historical-demands?${query.toString()}`);
  },

  async triggerAutoAggregate(params?: { min_freq?: number; limit?: number }): Promise<{
    message: string;
    data: any;
  }> {
    return apiPost<{ message: string; data: any }>("/api/admin/crowd-buy/auto-aggregate", params || {});
  },
};
