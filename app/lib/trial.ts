/**
 * Trial utility and status calculator for Huntr enterprise accounts.
 */

export interface TrialInfo {
  hasTrial: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean; // <= 7 days
  isUrgent: boolean; // <= 3 days
  isExpired: boolean; // <= 0 days
  status: "active" | "expiring_soon" | "urgent" | "expired" | "none";
  formattedEndDate: string;
  percentRemaining: number; // 0 - 100%
}

export function getTrialInfo(user: any): TrialInfo {
  if (!user || !user.trial_ends_at) {
    return {
      hasTrial: false,
      trialEndsAt: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      isExpiringSoon: false,
      isUrgent: false,
      isExpired: false,
      status: "none",
      formattedEndDate: "-",
      percentRemaining: 0,
    };
  }

  const endDate = new Date(user.trial_ends_at);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const daysRemaining = diffDays;
  const hoursRemaining = Math.max(0, diffHours);
  const isExpired = diffMs <= 0;
  const isUrgent = !isExpired && daysRemaining <= 3;
  const isExpiringSoon = !isExpired && daysRemaining <= 7;

  let status: TrialInfo["status"] = "active";
  if (isExpired) status = "expired";
  else if (isUrgent) status = "urgent";
  else if (isExpiringSoon) status = "expiring_soon";

  // Format date in Indonesian locale
  let formattedEndDate = "-";
  try {
    formattedEndDate = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(endDate) + " WIB";
  } catch {
    formattedEndDate = endDate.toLocaleDateString();
  }

  // Calculate percentage remaining from standard 30-day trial
  const totalTrialDays = 30;
  const percentRemaining = Math.max(0, Math.min(100, Math.round((Math.max(0, diffMs) / (totalTrialDays * 24 * 60 * 60 * 1000)) * 100)));

  return {
    hasTrial: true,
    trialEndsAt: endDate,
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining,
    isExpiringSoon,
    isUrgent,
    isExpired,
    status,
    formattedEndDate,
    percentRemaining,
  };
}

const DISMISS_KEY = "huntr_trial_banner_dismissed_until";

export function isTrialBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const dismissedUntil = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissedUntil) return false;
    return Date.now() < parseInt(dismissedUntil, 10);
  } catch {
    return false;
  }
}

export function dismissTrialBanner(hours: number = 12): void {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + hours * 60 * 60 * 1000;
    sessionStorage.setItem(DISMISS_KEY, until.toString());
  } catch (e) {
    console.error("Failed to dismiss trial banner:", e);
  }
}
