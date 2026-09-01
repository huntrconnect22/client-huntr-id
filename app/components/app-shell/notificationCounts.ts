export function calculateNotificationCounts(
  notifications: any[],
  totalUnread = 0
): Record<string, number> {
  const counts: Record<string, number> = {
    totalUnread,
    pendingApprovals: 0,
    opportunities: 0,
    pendingProposals: 0,
    negotiations: 0,
    receiptsToInspect: 0,
    pendingReturns: 0,
    pendingDebitNotes: 0,
    financeApprovals: 0,
    pendingNewProposals: 0,
    pendingPurchaseOrders: 0,
    pendingBast: 0,
    catalogueAlerts: 0,
    rankAlerts: 0,
    buyerOrderAlerts: 0,
    companyAlerts: 0,
    accountAlerts: 0,
  };

  notifications.forEach((n: any) => {
    if (n.read_at) return;
    const type = n.data?.type || n.type;
    if (type === "rfq_created" || type === "rfq_published") {
      counts.opportunities++;
    } else if (type === "proposal_submitted") {
      counts.pendingProposals++;
      counts.pendingNewProposals++;
    } else if (type === "proposal_awarded" || type === "award_received") {
      counts.pendingProposals++;
      counts.rankAlerts++;
    } else if (
      type === "negotiation_started" ||
      type === "negotiation_response"
    ) {
      counts.negotiations++;
    } else if (type === "po_issued" || type === "po_received") {
      counts.pendingPurchaseOrders++;
      counts.buyerOrderAlerts++;
    } else if (type === "goods_received" || type === "bast_issued") {
      counts.pendingBast++;
    } else if (type === "catalogue_update" || type === "catalogue_expiry") {
      counts.catalogueAlerts++;
    } else if (type === "company_verified" || type === "company_rejected") {
      counts.companyAlerts++;
      counts.accountAlerts++;
    } else if (["ranking_update", "award_received"].includes(type)) {
      counts.rankAlerts++;
    }
  });

  return counts;
}
