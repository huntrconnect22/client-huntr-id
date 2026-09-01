type User = {
  id: string | number;
  name: string;
  email: string;
  role: string;
  token: string;
};

type ActiveCompany = {
  id: string | number;
  name: string;
  type: string;
  status: string;
  owner_id: string | number;
  slug?: string;
  tax_id?: string;
  verification_notes?: string;
  [key: string]: any;
};

type OtpSession = {
  otp_token: string;
  whatsapp: string;
  expires_at: number;
};

export class SessionManager {
  private static USER_KEY = 'user_session';
  private static COMPANY_KEY = 'active_company';
  private static OTP_KEY = 'otp_session';
  private static subscribers: Set<() => void> = new Set();

  static subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public static notify() {
    this.subscribers.forEach(cb => cb());
  }

  static getUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  static setUser(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.notify();
  }

  static getToken(): string | null {
    const user = this.getUser();
    return user?.token || null;
  }

  static clearUser() {
    localStorage.removeItem(this.USER_KEY);
    this.notify();
  }

  static getCompany(): ActiveCompany | null {
    try {
      const companyStr = localStorage.getItem(this.COMPANY_KEY);
      return companyStr ? JSON.parse(companyStr) : null;
    } catch {
      return null;
    }
  }

  static setCompany(company: ActiveCompany) {
    localStorage.setItem(this.COMPANY_KEY, JSON.stringify(company));
    this.notify();
  }

  static clearCompany() {
    localStorage.removeItem(this.COMPANY_KEY);
    this.notify();
  }

  static clearAll() {
    this.clearUser();
    this.clearCompany();
  }

  // OTP Session functions
  static saveOtpSession(session: OtpSession) {
    localStorage.setItem(this.OTP_KEY, JSON.stringify(session));
  }

  static loadOtpSession(): OtpSession | null {
    try {
      const sessionStr = localStorage.getItem(this.OTP_KEY);
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (session && session.expires_at < Date.now()) {
        this.clearOtpSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static clearOtpSession() {
    localStorage.removeItem(this.OTP_KEY);
  }

  static getDeviceIdentity(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return navigator.userAgent.substring(0, 100);
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Hello, world.', 2, 15);
      const dataUrl = canvas.toDataURL();
      // Simple hash of the canvas fingerprint + user agent
      let hash = 0;
      const str = dataUrl + navigator.userAgent;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return `device-${Math.abs(hash).toString(36)}`;
    } catch {
      return navigator.userAgent.substring(0, 100);
    }
  }

  // For backwards compatibility
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token
      ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      : { Accept: 'application/json' };
  }

  static clearAuthSession() {
    this.clearAll();
  }
}

// For backwards compatibility with existing code
export const getAuthHeaders = SessionManager.getAuthHeaders.bind(SessionManager);
export const clearAuthSession = SessionManager.clearAuthSession.bind(SessionManager);
export const saveOtpSession = SessionManager.saveOtpSession.bind(SessionManager);
export const loadOtpSession = SessionManager.loadOtpSession.bind(SessionManager);
export const clearOtpSession = SessionManager.clearOtpSession.bind(SessionManager);
export const getDeviceIdentity = SessionManager.getDeviceIdentity.bind(SessionManager);
