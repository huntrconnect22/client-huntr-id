import { useState, useEffect, useCallback } from "react";
import { getRfq, apiGet, apiPost } from "../../../lib/api";

export function useCompareReviewData(id?: string) {
  const [request, setRequest] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [overallAnalysis, setOverallAnalysis] = useState<string>("");
  const [recommendedWinnerId, setRecommendedWinnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAiRankings = useCallback(async (rfqId: string) => {
    try {
      const response = await apiPost("/api/ai/rank-proposals", { rfq_id: rfqId });
      if (response.success && response.data) {
        setRankings(response.data.rankings || []);
        setOverallAnalysis(response.data.overall_analysis || "");
        setRecommendedWinnerId(response.data.recommended_winner_id || null);
        return;
      }
    } catch (err) {
      console.warn("AI rankings failed, falling back to simple rankings", err);
    }

    // Fallback to simple rankings if AI fails
    try {
      const response = await apiGet(`/api/proposals/${rfqId}/rankings`);
      setRankings(response.rankings || []);
    } catch (err2) {
      console.error("Failed to fetch any rankings", err2);
    }
  }, []);

  const loadData = useCallback(() => {
    if (!id || id === "NaN" || id === "undefined") {
      setError("Invalid Purchase Requisition ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([getRfq(id), fetchAiRankings(id)])
      .then(([response]) => {
        const rfq = response?.rfq ?? response?.data ?? response;
        setRequest(rfq);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load PR detail. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, fetchAiRankings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Find the awarded proposal in the rankings
  const awardedProposal = rankings.find((r: any) => {
    const p = r.proposal;
    return (
      p?.winner_status === "awarded" ||
      p?.winner_status === "approved" ||
      r.proposal_id === recommendedWinnerId
    );
  });

  return {
    request,
    rankings,
    overallAnalysis,
    recommendedWinnerId,
    awardedProposal,
    loading,
    error,
    refresh: loadData,
  };
}
