import { apiGet, apiPost, apiPut, apiPostForm } from "../client";

/**
 * Company API
 * 
 * Tanggung jawab: Mengelola profil perusahaan, NPWP, dan dokumen legalitas.
 */

export const registerCompany = (payload: Record<string, any>) =>
  apiPost("/api/companies", payload);

export const updateCompany = (id: string | number, payload: Record<string, any>) =>
  apiPut(`/api/companies/${id}`, payload);

export const verifyNpwp = (npwp: string) =>
  apiPost("/api/companies/verify-npwp", { npwp });

export const uploadCompanyDocument = (fd: FormData) =>
  apiPostForm("/api/companies/documents/upload", fd);

export const uploadCompanyLogo = (formData: FormData) =>
  apiPostForm("/api/companies/logo/upload", formData);

export const getMyCompanies = () => 
  apiGet(`/api/companies/my`);


export const getHistoricalPos = (companyId: string | number) =>
  apiGet(`/api/orders/historical?company_id=${companyId}`);

export const inviteUser = (payload: { company_id: string | number, whatsapp: string, email?: string, role: string }) =>
  apiPost("/api/companies/invite", payload);

export const acceptInvitation = (token: string) =>
  apiPost("/api/companies/accept-invitation", { token });

export const getTeamMembers = (companyId: string | number) =>
  apiGet(`/api/companies/${companyId}/members`);

export const diagnoseRoleInconsistencies = (companyId: string | number) =>
  apiGet(`/api/companies/${companyId}/diagnose-roles`);

export const updateUserRole = (companyId: string | number, userId: string, role: string) =>
  apiPut(`/api/companies/${companyId}/users/role`, { user_id: userId, role });

export const getInvitationInfo = (token: string) =>
  apiGet(`/api/invitations/info?token=${token}`);

/**
 * Switch the user's active workspace to the given company.
 * Backend updates user.company_id and ensures correct role assignment.
 */
export const switchActiveCompany = (companyId: string) =>
  apiPost(`/api/companies/${companyId}/switch-active`, {});

/**
 * Check if a given tax_id is already registered for a specific type.
 * Returns the matching company if found, null otherwise.
 * Useful for real-time feedback in the onboarding form.
 */
export const checkNpwpType = async (taxId: string): Promise<{
  vendor: any | null;
  buyer: any | null;
}> => {
  const data = await getMyCompanies();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  const normalizedInput = taxId.replace(/[^a-zA-Z0-9]/g, "");
  const match = (c: any) => {
    const normalized = (c.tax_id || "").replace(/[^a-zA-Z0-9]/g, "");
    return normalized === normalizedInput;
  };
  return {
    vendor: companies.find((c) => match(c) && c.type === "vendor") ?? null,
    buyer:  companies.find((c) => match(c) && c.type === "buyer") ?? null,
  };
};
