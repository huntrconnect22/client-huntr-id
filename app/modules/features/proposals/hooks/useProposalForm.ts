/**
 * useProposalForm Hook - Manage proposal form state
 */

import { useState, useCallback } from "react";

interface ProposalFormData {
  delivery_days: string;
  warranty_months: string;
  payment_term: string;
  document: File | null;
  items: Array<{
    rfq_item_id: string | number;
    price_offer: string | number;
    catalogue?: any;
  }>;
}

interface UseProposalFormState {
  form: ProposalFormData;
  updateField: (field: keyof ProposalFormData, value: any) => void;
  updateItem: (index: number, field: string, value: any) => void;
  resetForm: () => void;
  setItems: (items: any[]) => void;
  validatePrices: () => boolean;
}

const defaultForm: ProposalFormData = {
  delivery_days: "7",
  warranty_months: "12",
  payment_term: "30 days",
  document: null,
  items: [],
};

export const useProposalForm = (): UseProposalFormState => {
  const [form, setForm] = useState<ProposalFormData>(defaultForm);

  const updateField = useCallback((field: keyof ProposalFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateItem = useCallback((index: number, field: string, value: any) => {
    setForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  }, []);

  const setItems = useCallback((items: any[]) => {
    setForm((prev) => ({ ...prev, items }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(defaultForm);
  }, []);

  const validatePrices = useCallback((): boolean => {
    return !form.items.some(
      (it: any) => !it.price_offer || parseFloat(it.price_offer) <= 0
    );
  }, [form.items]);

  return {
    form,
    updateField,
    updateItem,
    resetForm,
    setItems,
    validatePrices,
  };
};


