import { apiGet, apiPost } from "~/shared/services/http/client";

/**
 * Notifications API
 */

export const getNotifications = (userId: number, page: number = 1) => {
  // Get active company from localStorage
  const activeCompanyStr = localStorage.getItem('active_company');
  const companyId = activeCompanyStr ? JSON.parse(activeCompanyStr).id : null;
  
  let url = `/api/notifications?user_id=${userId}&page=${page}`;
  if (companyId) {
    url += `&company_id=${companyId}`;
  }
  
  return apiGet(url);
};

export const markNotificationAsRead = (id: string, userId: number) => {
  // Get active company from localStorage
  const activeCompanyStr = localStorage.getItem('active_company');
  const companyId = activeCompanyStr ? JSON.parse(activeCompanyStr).id : null;
  
  const payload: any = { user_id: userId };
  if (companyId) {
    payload.company_id = companyId;
  }
  
  return apiPost(`/api/notifications/${id}/read`, payload);
};

export const markAllNotificationsAsRead = (userId: number) => {
  // Get active company from localStorage
  const activeCompanyStr = localStorage.getItem('active_company');
  const companyId = activeCompanyStr ? JSON.parse(activeCompanyStr).id : null;
  
  const payload: any = { user_id: userId };
  if (companyId) {
    payload.company_id = companyId;
  }
  
  return apiPost(`/api/notifications/read-all`, payload);
};

export const clearAllNotifications = (userId: number) => {
  const activeCompanyStr = localStorage.getItem('active_company');
  const companyId = activeCompanyStr ? JSON.parse(activeCompanyStr).id : null;

  const payload: any = { user_id: userId };
  if (companyId) {
    payload.company_id = companyId;
  }

  return apiPost(`/api/notifications/clear-all`, payload);
};
