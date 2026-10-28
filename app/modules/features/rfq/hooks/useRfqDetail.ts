/**
 * useRfqDetail Hook - Manage RFQ detail page state
 */

import { useState, useEffect, useCallback } from "react";
import { rfqService } from "../services/rfqService";

interface UseRfqDetailState {
  rfq: any | null;
  rankings: any[];
  loading: boolean;
  error: string | null;
  fetchRfqDetail: (rfqId: string | number) => Promise<void>;
  fetchRankings: (rfqId: string | number) => Promise<void>;
  resetError: () => void;
}

export const useRfqDetail = (): UseRfqDetailState => {
  const [rfq, setRfq] = useState<any | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRfqDetail = useCallback(async (rfqId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await rfqService.getRfqDetail(rfqId);
      setRfq(data);
    } catch (err: any) {
      setError(err.message || "Unable to load RFQ detail. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRankings = useCallback(async (rfqId: string | number) => {
    try {
      const data = await rfqService.getRfqRankings(rfqId);
      setRankings(data);
    } catch (err: any) {
      console.error("Failed to load RFQ rankings:", err);
      setRankings([]);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    rfq,
    rankings,
    loading,
    error,
    fetchRfqDetail,
    fetchRankings,
    resetError,
  };
};


