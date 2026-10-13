/**
 * Proposal Service - All API calls related to proposals
 */

import { apiGet, apiPost } from "../../../lib/api";

export interface ProposalSubmitRequest {
  company_id: string | number;
  rfq_id: string | number;
  delivery_days: string;
  warranty_months: string;
  payment_term: string;
  items: Array<{
    rfq_item_id: string | number;
    price_offer: string | number;
  }>;
  document?: File;
}

export interface RfqItem {
  id: string | number;
  qty: number;
  catalogue?: any;
}

export interface OpenRfq {
  id: string | number;
  title: string;
  items?: RfqItem[];
  status: string;
  [key: string]: any;
}

export const proposalService = {
  /**
   * Fetch open tenders/RFQs
   */
  async getOpenTenders(): Promise<OpenRfq[]> {
    try {
      const data = await apiGet("/api/rfqs?status=active");
      return Array.isArray(data) ? data : data?.data || [];
    } catch (error) {
      console.error("Failed to fetch open tenders:", error);
      throw error;
    }
  },

  /**
   * Fetch vendor rankings
   */
  async getVendorRankings(companyId: string | number): Promise<any> {
    try {
      return await apiGet(`/api/proposals/my-rank?company_id=${companyId}`);
    } catch (error) {
      console.error("Failed to fetch vendor rankings:", error);
      throw error;
    }
  },

  /**
   * Fetch list of proposals for a company
   */
  async getProposals(companyId: string | number, search?: string): Promise<any[]> {
    try {
      let url = `/api/proposals?company_id=${companyId}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      return await apiGet(url);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
      throw error;
    }
  },

  /**
   * Fetch awaiting approvals
   */
  async getAwaitingApprovals(companyId: string | number): Promise<any[]> {
    try {
      const data = await apiGet(`/api/proposals/awaiting-approval?company_id=${companyId}`);
      return Array.isArray(data) ? data : data?.proposals || [];
    } catch (error) {
      console.error("Failed to fetch awaiting approvals:", error);
      throw error;
    }
  },

  /**
   * Submit proposal
   */
  async submitProposal(formData: FormData): Promise<any> {
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit proposal");
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to submit proposal:", error);
      throw error;
    }
  },

  /**
   * Award proposal
   */
  async awardProposal(proposalId: string | number, rfqId: string | number, userId?: string): Promise<any> {
    try {
      return await apiPost(`/api/proposals/${proposalId}/award`, {
        rfq_id: rfqId,
        user_id: userId,
      });
    } catch (error) {
      console.error("Failed to award proposal:", error);
      throw error;
    }
  },

  /**
   * Award multiple proposals as winners (Split Award: 2-5 vendors with item checklist)
   */
  async awardMultiWinners(
    rfqId: string | number,
    awards: Array<{ proposal_id: string | number; item_ids: Array<string | number> }>,
    awardMode: "multi_vendor" | "single" = "multi_vendor",
    userId?: string
  ): Promise<any> {
    try {
      return await apiPost(`/api/rfqs/${rfqId}/award-winners`, {
        awards,
        award_mode: awardMode,
        user_id: userId,
      });
    } catch (error) {
      console.error("Failed to award multiple winners:", error);
      throw error;
    }
  },

  /**
   * Send negotiation
   */
  async sendNegotiation(proposalId: string | number, data: any): Promise<any> {
    try {
      return await apiPost("/api/orders/negotiate", {
        proposal_id: proposalId,
        ...data,
      });
    } catch (error) {
      console.error("Failed to send negotiation:", error);
      throw error;
    }
  }
};
