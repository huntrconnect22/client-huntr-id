import { apiDelete, apiGet, apiPost, apiPut } from "../client";

const companyQuery = (companyId: string) =>
  new URLSearchParams({ company_id: companyId }).toString();

export const getCrmApps = (companyId: string) =>
  apiGet<any>(`/api/crm/apps?${companyQuery(companyId)}`);
export const installCrm = (companyId: string) =>
  apiPost<any>("/api/crm/apps/install", { company_id: companyId });
export const uninstallCrm = (companyId: string) =>
  apiDelete<any>(`/api/crm/apps/install?${companyQuery(companyId)}`);
export const getCrmDashboard = (companyId: string) =>
  apiGet<any>(`/api/crm/dashboard?${companyQuery(companyId)}`);
export const getCrmForecast = (companyId: string) =>
  apiGet<any>(`/api/crm/forecast?${companyQuery(companyId)}`);

export const getCrmCustomers = (
  companyId: string,
  params: Record<string, string | number> = {},
) =>
  apiGet<any>(
    `/api/crm/customers?${new URLSearchParams({ company_id: companyId, ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])) })}`,
  );
export const createCrmCustomer = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/customers", { company_id: companyId, ...data });
export const updateCrmCustomer = (
  companyId: string,
  id: string,
  data: Record<string, unknown>,
) =>
  apiPut<any>(`/api/crm/customers/${id}`, { company_id: companyId, ...data });

export const getCrmLeads = (
  companyId: string,
  params: Record<string, string | number> = {},
) =>
  apiGet<any>(
    `/api/crm/leads?${new URLSearchParams({ company_id: companyId, ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])) })}`,
  );
export const createCrmLead = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/leads", { company_id: companyId, ...data });
export const updateCrmLead = (
  companyId: string,
  id: string,
  data: Record<string, unknown>,
) => apiPut<any>(`/api/crm/leads/${id}`, { company_id: companyId, ...data });
export const convertCrmLead = (companyId: string, id: string) =>
  apiPost<any>(`/api/crm/leads/${id}/convert`, { company_id: companyId });

export const getCrmDeals = (companyId: string) =>
  apiGet<any>(`/api/crm/deals?${companyQuery(companyId)}`);
export const createCrmDeal = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/deals", { company_id: companyId, ...data });
export const updateCrmDeal = (
  companyId: string,
  id: string,
  data: Record<string, unknown>,
) => apiPut<any>(`/api/crm/deals/${id}`, { company_id: companyId, ...data });

export const getCrmActivities = (companyId: string, status?: string) =>
  apiGet<any>(
    `/api/crm/activities?${companyQuery(companyId)}${status ? `&status=${encodeURIComponent(status)}` : ""}`,
  );
export const createCrmActivity = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/activities", { company_id: companyId, ...data });
export const updateCrmActivity = (
  companyId: string,
  id: string,
  data: Record<string, unknown>,
) =>
  apiPut<any>(`/api/crm/activities/${id}`, { company_id: companyId, ...data });

export const getCrmTickets = (companyId: string, status?: string) =>
  apiGet<any>(
    `/api/crm/tickets?${companyQuery(companyId)}${status ? `&status=${encodeURIComponent(status)}` : ""}`,
  );
export const createCrmTicket = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/tickets", { company_id: companyId, ...data });
export const updateCrmTicket = (
  companyId: string,
  id: string,
  data: Record<string, unknown>,
) => apiPut<any>(`/api/crm/tickets/${id}`, { company_id: companyId, ...data });
export const getCrmTicketMessages = (companyId: string, ticketId: string) =>
  apiGet<any>(
    `/api/crm/tickets/${ticketId}/messages?${companyQuery(companyId)}`,
  );
export const createCrmTicketMessage = (
  companyId: string,
  ticketId: string,
  data: Record<string, unknown>,
) =>
  apiPost<any>(`/api/crm/tickets/${ticketId}/messages`, {
    company_id: companyId,
    ...data,
  });
export const getCrmConversations = (companyId: string) =>
  apiGet<any>(`/api/crm/conversations?${companyQuery(companyId)}`);
export const createCrmConversation = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/conversations", { company_id: companyId, ...data });
export const getCrmConversationMessages = (
  companyId: string,
  conversationId: string,
) =>
  apiGet<any>(
    `/api/crm/conversations/${conversationId}/messages?${companyQuery(companyId)}`,
  );
export const createCrmConversationMessage = (
  companyId: string,
  conversationId: string,
  data: Record<string, unknown>,
) =>
  apiPost<any>(`/api/crm/conversations/${conversationId}/messages`, {
    company_id: companyId,
    ...data,
  });

export const getCrmQuotes = (companyId: string) =>
  apiGet<any>(`/api/crm/quotes?${companyQuery(companyId)}`);
export const createCrmQuote = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/quotes", { company_id: companyId, ...data });
export const requestCrmQuoteApproval = (
  companyId: string,
  quoteId: string,
  data: Record<string, unknown> = {},
) =>
  apiPost<any>(`/api/crm/quotes/${quoteId}/approval-requests`, {
    company_id: companyId,
    ...data,
  });
export const decideCrmQuoteApproval = (
  companyId: string,
  quoteId: string,
  approvalId: string,
  data: Record<string, unknown>,
) =>
  apiPost<any>(
    `/api/crm/quotes/${quoteId}/approval-requests/${approvalId}/decision`,
    { company_id: companyId, ...data },
  );
export const getCrmWorkflows = (companyId: string) =>
  apiGet<any>(`/api/crm/workflows?${companyQuery(companyId)}`);
export const createCrmWorkflow = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/workflows", { company_id: companyId, ...data });
export const getCrmEmailConnections = (companyId: string) =>
  apiGet<any>(`/api/crm/email-connections?${companyQuery(companyId)}`);
export const createCrmEmailConnection = (
  companyId: string,
  data: Record<string, unknown>,
) =>
  apiPost<any>("/api/crm/email-connections", {
    company_id: companyId,
    ...data,
  });
export const syncCrmEmailInbox = (companyId: string) =>
  apiPost<any>("/api/crm/email-connections/sync", { company_id: companyId });
export const authorizeCrmEmail = (
  companyId: string,
  provider: "gmail" | "microsoft",
) =>
  apiPost<{ authorization_url: string }>(
    `/api/crm/email-connections/${provider}/authorize`,
    { company_id: companyId },
  );
export const getCrmTerritories = (companyId: string) =>
  apiGet<any>(`/api/crm/territories?${companyQuery(companyId)}`);
export const createCrmTerritory = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/territories", { company_id: companyId, ...data });

export const getCrmContacts = (companyId: string) =>
  apiGet<any>(`/api/crm/contacts?${companyQuery(companyId)}`);
export const createCrmContact = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/contacts", { company_id: companyId, ...data });

export const getCrmCampaigns = (companyId: string) =>
  apiGet<any>(`/api/crm/campaigns?${companyQuery(companyId)}`);
export const createCrmCampaign = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/campaigns", { company_id: companyId, ...data });
export const getCrmKnowledge = (companyId: string) =>
  apiGet<any>(`/api/crm/knowledge?${companyQuery(companyId)}`);
export const createCrmKnowledge = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/knowledge", { company_id: companyId, ...data });
export const getCrmIntegrations = (companyId: string) =>
  apiGet<any>(`/api/crm/integrations?${companyQuery(companyId)}`);
export const connectCrmIntegration = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/integrations", { company_id: companyId, ...data });
export const startCrmWhatsAppSession = (companyId: string) =>
  apiPost<any>("/api/crm/integrations/whatsapp/session", {
    company_id: companyId,
  });
export const getCrmWhatsAppSession = (companyId: string) =>
  apiGet<any>(
    `/api/crm/integrations/whatsapp/session?${companyQuery(companyId)}`,
  );
export const disconnectCrmWhatsAppSession = (companyId: string) =>
  apiDelete<any>(
    `/api/crm/integrations/whatsapp/session?${companyQuery(companyId)}`,
  );
export const sendCrmWhatsAppMessage = (
  companyId: string,
  data: Record<string, unknown>,
) =>
  apiPost<any>("/api/crm/integrations/whatsapp/messages", {
    company_id: companyId,
    ...data,
  });
export const getCrmCurrencyRates = (companyId: string) =>
  apiGet<any>(`/api/crm/currency-rates?${companyQuery(companyId)}`);
export const createCrmCurrencyRate = (
  companyId: string,
  data: Record<string, unknown>,
) =>
  apiPost<any>("/api/crm/currency-rates", {
    company_id: companyId,
    ...data,
  });
export const getCrmSalesTargets = (companyId: string) =>
  apiGet<any>(`/api/crm/sales-targets?${companyQuery(companyId)}`);
export const createCrmSalesTarget = (
  companyId: string,
  data: Record<string, unknown>,
) => apiPost<any>("/api/crm/sales-targets", { company_id: companyId, ...data });
export const getCrmReports = (companyId: string, period?: string) =>
  apiGet<any>(
    `/api/crm/reports?${new URLSearchParams({ company_id: companyId, ...(period ? { period } : {}) })}`,
  );
