export interface InvoicePaymentBreakdown {
  baseAmount: number;
  adminBank: number;
  pph23: number;
  ppn: number;
  total: number;
}

export const getInvoicePaymentBreakdown = (
  invoice: any,
  fallbackBaseAmount = 0,
): InvoicePaymentBreakdown => {
  const baseAmount = Number(invoice?.base_amount || fallbackBaseAmount || invoice?.amount || 0);
  const adminBank = Number(invoice?.midtrans_fee) > 0 ? Number(invoice.midtrans_fee) : 4_400;
  const pph23 = Number(invoice?.pph23) > 0 ? Number(invoice.pph23) : baseAmount * 0.02;
  const ppn = Number(invoice?.ppn_fee) > 0 ? Number(invoice.ppn_fee) : baseAmount * 0.11;

  return {
    baseAmount,
    adminBank,
    pph23,
    ppn,
    total: baseAmount + adminBank + ppn - pph23,
  };
};


