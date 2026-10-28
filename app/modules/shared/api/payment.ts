import { apiGet, apiPost } from "~/shared/services/http/client";

export const getPayments = (companyId: string, page: number = 1) => {
  return apiGet(`/api/payments?company_id=${companyId}&page=${page}`);
};

export const initiatePayment = (invoiceId: string, method: string) => {
  return apiPost("/api/payments", { invoice_id: invoiceId, method });
};

export const getPaymentStatus = (paymentId: string) => {
  return apiGet(`/api/payments/${paymentId}`);
};
