/**
 * RFQ Service - All API calls related to RFQ management
 */

import { apiGet, apiPost } from "../../../lib/api";

export interface RfqDetailResponse {
  rfq?: any;
  data?: any;
}

export interface RankingsResponse {
  rankings?: any[];
  data?: any[];
}

export interface AwardWinnerRequest {
  rfq_id: string | number;
  user_id?: string;
}

export const rfqService = {
  /**
   * Fetch RFQ detail by ID
   */
  async getRfqDetail(rfqId: string | number): Promise<any> {
    try {
      const response = await apiGet(`/api/rfqs/${rfqId}`);
      return response?.rfq ?? response?.data ?? response;
    } catch (error) {
      console.error("Failed to fetch RFQ detail:", error);
      throw error;
    }
  },

  /**
   * Fetch RFQ rankings
   */
  async getRfqRankings(rfqId: string | number): Promise<any[]> {
    try {
      const response = await apiGet(`/api/rfqs/${rfqId}/rankings`);
      return Array.isArray(response) ? response : response?.rankings || [];
    } catch (error) {
      console.error("Failed to fetch RFQ rankings:", error);
      throw error;
    }
  },

  /**
   * Award proposal as winner
   */
  async awardWinner(proposalId: string | number, request: AwardWinnerRequest): Promise<any> {
    try {
      return await apiPost(`/api/proposals/${proposalId}/award`, request);
    } catch (error) {
      console.error("Failed to award proposal:", error);
      throw error;
    }
  },

  /**
   * Send negotiation request
   */
  async sendNegotiation(proposalId: string | number, data: any): Promise<any> {
    try {
      return await apiPost(`/api/orders/negotiate`, {
        proposal_id: proposalId,
        ...data
      });
    } catch (error) {
      console.error("Failed to send negotiation:", error);
      throw error;
    }
  }
};


