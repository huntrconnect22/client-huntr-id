/**
 * useAwardProposal Hook - Handle award proposal logic with double-submit prevention
 */

import { useState, useRef, useCallback } from "react";
import { rfqService } from "../services/rfqService";

interface UseAwardProposalState {
  awardingProposal: string | number | null;
  successMessage: string | null;
  error: string | null;
  handleAwardWinner: (proposalId: string | number, rfqId: string | number) => Promise<void>;
  resetMessages: () => void;
}

export const useAwardProposal = (): UseAwardProposalState => {
  const [awardingProposal, setAwardingProposal] = useState<string | number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Double submit prevention
  const isProcessing = useRef(false);

  const handleAwardWinner = useCallback(async (
    proposalId: string | number,
    rfqId: string | number
  ) => {
    // Prevent double submit
    if (isProcessing.current) {
      console.warn("Request already in progress");
      return;
    }

    const userSession = localStorage.getItem("user_session");
    const user = userSession ? JSON.parse(userSession) : null;

    isProcessing.current = true;
    setAwardingProposal(proposalId);
    setError(null);

    try {
      await rfqService.awardWinner(proposalId, {
        rfq_id: rfqId,
        user_id: user?.id,
      });

      setSuccessMessage("✓ Proposal awarded! Sent to manager for approval.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to award proposal");
    } finally {
      // Keep awardingProposal set to keep button gray
      // Don't reset isProcessing if error, to prevent rapid retries
      setTimeout(() => {
        isProcessing.current = false;
      }, 500);
    }
  }, []);

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    awardingProposal,
    successMessage,
    error,
    handleAwardWinner,
    resetMessages,
  };
};


