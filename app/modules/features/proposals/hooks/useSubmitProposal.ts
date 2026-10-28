/**
 * useSubmitProposal Hook - Handle proposal submission with double-submit prevention
 */

import { useState, useRef, useCallback } from "react";
import { proposalService } from "../services/proposalService";

interface SubmitProposalRequest {
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

interface UseSubmitProposalState {
  loading: boolean;
  error: string | null;
  result: any | null;
  submitProposal: (data: SubmitProposalRequest) => Promise<void>;
  resetState: () => void;
}

export const useSubmitProposal = (): UseSubmitProposalState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Double submit prevention
  const isProcessing = useRef(false);

  const submitProposal = useCallback(async (data: SubmitProposalRequest) => {
    // Prevent double submit
    if (isProcessing.current) {
      console.warn("Proposal submission already in progress");
      return;
    }

    isProcessing.current = true;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("company_id", data.company_id.toString());
      formData.append("rfq_id", data.rfq_id.toString());
      formData.append("delivery_days", data.delivery_days);
      formData.append("warranty_months", data.warranty_months);
      formData.append("payment_term", data.payment_term);

      if (data.document) {
        formData.append("document", data.document);
      }

      data.items.forEach((item, idx) => {
        formData.append(`items[${idx}][rfq_item_id]`, item.rfq_item_id.toString());
        formData.append(`items[${idx}][price_offer]`, item.price_offer.toString());
      });

      const response = await proposalService.submitProposal(formData);
      setResult(response.proposal);

      // Auto-clear result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal");
    } finally {
      setLoading(false);
      setTimeout(() => {
        isProcessing.current = false;
      }, 500);
    }
  }, []);

  const resetState = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    isProcessing.current = false;
  }, []);

  return {
    loading,
    error,
    result,
    submitProposal,
    resetState,
  };
};


