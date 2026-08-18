import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  Shield,
  Smartphone,
  Monitor,
  Loader2,
  Eye,
  EyeOff,
  MessageSquareCode,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Palette,
  Sparkles,
  Zap,
  ShieldCheck,
  Calendar,
  PhoneCall,
  ArrowRight,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { isAgenticProcurementEnabled, setAgenticProcurementEnabled } from "../lib/features";
import { getTrialInfo } from "../lib/trial";
import {
  updatePassword,
  updateWhatsapp,
  getSessions,
  logoutSession,
  sendOtp,
  verifyOtp,
  loadOtpSession,
  clearOtpSession,
  enable2FA,
  disable2FA,
  get2FAQRCode,
  confirm2FA,
  get2FARecoveryCodes,
} from "../lib/api";
import { getCsrfCookie } from "../lib/api/auth";
import Swal from "sweetalert2";

export default function AccountSettings() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"security" | "profile" | "subscription" | "appearance" | "features" | "sessions">("security");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agenticEnabled, setAgenticEnabled] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [confirming2FA, setConfirming2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // WhatsApp state
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [canonicalWhatsapp, setCanonicalWhatsapp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (session) {
      const u = JSON.parse(session);
      setUser(u);
      setNewWhatsapp(u.whatsapp || "");
      setTwoFactorEnabled(!!u.two_factor_confirmed_at);
    }
    setAgenticEnabled(isAgenticProcurementEnabled());
    fetchSessions();
  }, []);

  const handleToggleAgentic = (val: boolean) => {
    setAgenticProcurementEnabled(val);
    setAgenticEnabled(val);
    if (val) {
      setSuccess("AI Agentic Procurement berhasil diaktifkan! Menu sekarang muncul di sidebar navigasi.");
    } else {
      setSuccess("AI Agentic Procurement dinonaktifkan. Menu telah disembunyikan dari sidebar navigasi.");
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      await enable2FA();
      const qrRes = await get2FAQRCode();
      setQrCode(qrRes.svg);
      setConfirming2FA(true);
      setSuccess("2FA is being activated. Please scan the QR code.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      await confirm2FA(twoFactorCode);
      const codesRes = await get2FARecoveryCodes();
      setRecoveryCodes(codesRes);
      setTwoFactorEnabled(true);
      setConfirming2FA(false);
      setQrCode(null);
      setTwoFactorCode("");

      // Update local storage user object
      const updatedUser = { ...user, two_factor_confirmed_at: new Date().toISOString() };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess("2FA successfully activated!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable 2FA?")) return;
    setLoading(true);
    setError(null);
    try {
      await disable2FA();
      setTwoFactorEnabled(false);
      setRecoveryCodes([]);

      // Update local storage
      const updatedUser = { ...user, two_factor_confirmed_at: null };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess("2FA dinonaktifkan.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await getCsrfCookie();
      await updatePassword(passwordForm);
      setSuccess("Password successfully updated!");
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (sendingOtp || (resendCooldown > 0 && otpSent)) return;
    if (!newWhatsapp) {
      setError("Please enter a new WhatsApp number.");
      return;
    }
    setSendingOtp(true);
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await sendOtp({ whatsapp: newWhatsapp });
      setOtpSent(true);
      setCanonicalWhatsapp(res.whatsapp || newWhatsapp);
      setOtpToken(res.otp_token || "");
      setResendCooldown(60);
      setSuccess("Kode OTP telah dikirim. Gunakan kode terbaru dari WhatsApp.");
      if (res.otp) setDebugOtp(String(res.otp));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Masukkan kode OTP 6 digit.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const session = loadOtpSession();
      const phone = session?.whatsapp || canonicalWhatsapp || newWhatsapp;
      await verifyOtp({ whatsapp: phone, otp, otp_token: otpToken || session?.otp_token });
      clearOtpSession();
      const data = await updateWhatsapp({ whatsapp: phone });

      const updatedUser = { ...user, whatsapp: data.user?.whatsapp || phone };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess("WhatsApp number successfully updated!");
      setOtpSent(false);
      setOtp("");
      setCanonicalWhatsapp("");
      setOtpToken("");
      clearOtpSession();
      setDebugOtp(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Terminate Session?",
      text: "Are you sure you want to terminate this session?",
      showCancelButton: true,
      confirmButtonText: "Yes, Terminate",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await logoutSession(sessionId);
      fetchSessions();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message,
      });
    }
  };

  return (
    <Layout title="Account Settings" subtitle="Manage your security, profile, appearance, and active sessions">
      <div className="w-full space-y-6">
        {/* Feedback messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-3">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {/* Seamless macOS Settings Layout (Standard Platform Sizing) */}
        <div className="flex flex-col md:flex-row gap-8 items-start min-h-[520px]">
          {/* Left Panel: macOS Sidebar Navigation List */}
          <div className="w-full md:w-64 space-y-1 flex-shrink-0 md:sticky md:top-6">
            {[
              { id: "security", icon: Shield, label: "Security & Password" },
              { id: "profile", icon: Smartphone, label: "WhatsApp Profile" },
              { id: "subscription", icon: Zap, label: "Subscription & Trial" },
              { id: "appearance", icon: Palette, label: "Appearance" },
              { id: "features", icon: Sparkles, label: "Feature Flags" },
              { id: "sessions", icon: Monitor, label: "Active Sessions" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={active ? { color: 'white' } : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
                    active
                      ? "bg-orange-500 font-semibold shadow-sm shadow-orange-500/20"
                      : "text-[var(--ui-text-nav-idle)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] font-medium"
                  }`}
                >
                  <tab.icon size={17} style={active ? { color: 'white' } : undefined} className={active ? "" : "text-[var(--ui-text-muted)]"} />
                  <span style={active ? { color: 'white' } : undefined} className={`truncate ${active ? "font-semibold" : ""}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Panel: macOS Content Area (Standard Sizing) */}
          <div className="flex-1 w-full space-y-6">
            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Security & Password</h2>
                  <p className="text-sm text-[var(--ui-text-muted)] mt-1">Manage authentication credentials and multi-factor protection.</p>
                </div>

                {/* Change Password Group */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Login Password</span>
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                    <form onSubmit={handleUpdatePassword}>
                      {/* Current Password Row */}
                      <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-sm font-semibold text-[var(--ui-text-primary)] sm:w-1/3">Current Password</label>
                        <div className="sm:w-2/3">
                          <input
                            type="password"
                            placeholder="Enter current password"
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50"
                          />
                        </div>
                      </div>

                      {/* New Password Row */}
                      <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--ui-border)]">
                        <label className="text-sm font-semibold text-[var(--ui-text-primary)] sm:w-1/3">New Password</label>
                        <div className="sm:w-2/3 relative">
                          <input
                            type={showPw ? "text" : "password"}
                            placeholder="Enter new password"
                            value={passwordForm.password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
                          >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password Row */}
                      <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--ui-border)]">
                        <label className="text-sm font-semibold text-[var(--ui-text-primary)] sm:w-1/3">Confirm Password</label>
                        <div className="sm:w-2/3 relative">
                          <input
                            type={showConfirmPw ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={passwordForm.password_confirmation}
                            onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Save Button Row */}
                      <div className="p-3.5 px-5 bg-[var(--ui-bg-card)] border-t border-[var(--ui-border)] flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          style={{ color: 'white' }}
                          className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* 2FA Inset Group */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Two-Factor Authentication</span>
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-5 space-y-4">
                    {!twoFactorEnabled && !confirming2FA && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-[var(--ui-text-primary)]">Two-Factor Auth is Off</div>
                          <p className="text-xs text-[var(--ui-text-muted)] mt-1">Use an authenticator app (Google Authenticator, Authy) for extra security.</p>
                        </div>
                        <button
                          onClick={handleEnable2FA}
                          disabled={loading}
                          style={{ color: 'white' }}
                          className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex-shrink-0"
                        >
                          Enable 2FA
                        </button>
                      </div>
                    )}

                    {confirming2FA && qrCode && (
                      <div className="space-y-4 pt-1">
                        <p className="text-sm font-medium text-[var(--ui-text-primary)]">Scan QR Code with your Authenticator App:</p>
                        <div dangerouslySetInnerHTML={{ __html: qrCode }} className="bg-white p-3 rounded-md w-fit" />
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">Enter Confirmation Code</label>
                          <input
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            placeholder="6-digit code"
                            className="w-full max-w-xs px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-sm outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleConfirm2FA} disabled={loading} style={{ color: 'white' }} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm"}
                          </button>
                          <button onClick={() => { setConfirming2FA(false); setQrCode(null); }} className="px-5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm font-semibold text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {twoFactorEnabled && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 size={18} />
                            <span className="font-semibold text-sm">2FA Active</span>
                          </div>
                          <button onClick={handleDisable2FA} disabled={loading} className="px-5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all">
                            Disable
                          </button>
                        </div>
                        {recoveryCodes.length > 0 && (
                          <div className="p-3.5 rounded-md bg-black/30">
                            <p className="text-xs font-semibold text-[var(--ui-text-primary)] mb-2">Recovery Codes:</p>
                            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-orange-300">
                              {recoveryCodes.map(c => <span key={c}>{c}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">WhatsApp Profile</h2>
                  <p className="text-sm text-[var(--ui-text-muted)] mt-1">Manage contact phone number used for notifications and verification.</p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Contact Information</span>
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                    <form onSubmit={handleUpdateWhatsapp}>
                      <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="sm:w-1/3">
                          <div className="text-sm font-semibold text-[var(--ui-text-primary)]">WhatsApp Number</div>
                          <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">Used for login OTP & notifications</div>
                        </div>
                        <div className="sm:w-2/3 flex gap-2">
                          <input
                            type="tel"
                            placeholder="e.g., +62812345678"
                            value={newWhatsapp}
                            onChange={(e) => {
                              setNewWhatsapp(e.target.value);
                              if (otpSent) { setOtpSent(false); setCanonicalWhatsapp(""); setOtpToken(""); clearOtpSession(); }
                            }}
                            required
                            disabled={otpSent}
                            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none disabled:opacity-50"
                          />
                          {!otpSent && (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={loading || newWhatsapp === user?.whatsapp}
                              style={{ color: 'white' }}
                              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm disabled:opacity-50 transition-all flex-shrink-0"
                            >
                              {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                            </button>
                          )}
                        </div>
                      </div>

                      {otpSent && (
                        <div className="p-5 bg-[var(--ui-bg-card)] space-y-4">
                          <label className="text-xs font-semibold text-orange-400 flex items-center gap-2">
                            <MessageSquareCode size={16} /> Enter OTP Code
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputMode="numeric"
                            placeholder="6-digit OTP"
                            required
                            maxLength={6}
                            className="w-full max-w-xs px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-sm outline-none"
                          />
                          {debugOtp && <div className="text-xs text-emerald-400 font-semibold">Debug OTP (local): {debugOtp}</div>}
                          <div className="flex items-center gap-3">
                            <button type="submit" disabled={loading} style={{ color: 'white' }} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm">
                              {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Update"}
                            </button>
                            <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:underline font-semibold transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription & Trial Tab */}
            {activeTab === "subscription" && (() => {
              const trial = getTrialInfo(user);
              const handleContactSales = () => {
                Swal.fire({
                  title: "Konsultasi Paket Langganan",
                  html: `
                    <div style="text-align: left; font-size: 13px; color: var(--ui-text-secondary, #4b5563); line-height: 1.6;">
                      <p style="margin-bottom: 12px;">Dapatkan akses enterprise khusus, integrasi ERP, dan kuota tanpa batas untuk seluruh organisasi Anda:</p>
                      <div style="background: rgba(249, 115, 22, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(249, 115, 22, 0.2); margin-bottom: 12px;">
                        <div style="font-weight: 700; color: #f97316; margin-bottom: 4px;">Huntr Enterprise Solutions</div>
                        <div>📧 Email: <b>support@huntr.id</b></div>
                        <div>📞 WhatsApp: <b>+62 812-3456-7890</b></div>
                        <div>🏢 Jakarta, Indonesia</div>
                      </div>
                    </div>
                  `,
                  icon: "info",
                  confirmButtonText: "Hubungi via WhatsApp",
                  showCancelButton: true,
                  cancelButtonText: "Tutup",
                  confirmButtonColor: "#f97316",
                }).then((res) => {
                  if (res.isConfirmed) {
                    window.open("https://wa.me/6281234567890?text=Halo%20Tim%20Huntr,%20saya%20tertarik%20dengan%20paket%20Enterprise%20Huntr.id", "_blank");
                  }
                });
              };

              return (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Subscription & Trial Plan</h2>
                    <p className="text-sm text-[var(--ui-text-muted)] mt-1">
                      Pantau masa aktif paket percobaan (trial) dan kelola lisensi akun enterprise Anda.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
                      Paket Aktif Saat Ini
                    </span>

                    <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-6 space-y-6">
                      {/* Plan Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                            <Zap size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-[var(--ui-text-primary)] m-0">
                                Enterprise Free Trial
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                30 DAYS
                              </span>
                            </div>
                            <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                              Akses fitur penuh tanpa batas untuk evaluasi alur e-procurement perusahaan.
                            </p>
                          </div>
                        </div>

                        <div>
                          {trial.isExpired ? (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              KEDALUWARSA
                            </span>
                          ) : trial.isUrgent ? (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              SEGERA BERAKHIR
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              AKTIF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Timeline */}
                      <div className="space-y-2 p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--ui-text-primary)] flex items-center gap-1.5">
                            <Clock size={14} className="text-orange-500" />
                            Sisa Waktu Masa Percobaan:
                          </span>
                          <span className="font-bold text-orange-500">
                            {trial.isExpired ? "0 Hari (Habis)" : `${trial.daysRemaining} Hari Tersisa`}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2.5 rounded-full bg-[var(--ui-bg-input)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              trial.isExpired
                                ? "bg-red-500"
                                : trial.isUrgent
                                ? "bg-gradient-to-r from-red-500 to-amber-500"
                                : "bg-gradient-to-r from-orange-500 to-amber-400"
                            }`}
                            style={{ width: `${trial.percentRemaining}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--ui-text-muted)] pt-1">
                          <span>Masa Berlaku Berakhir:</span>
                          <span className="font-medium text-[var(--ui-text-primary)]">{trial.formattedEndDate}</span>
                        </div>
                      </div>

                      {/* Features Matrix */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                          Fitur Enterprise yang Termasuk:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--ui-text-secondary)]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>Unlimited PR & RFQ Creation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>Multi-Tier Approval Management</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>AI Agentic Procurement Assistant</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>E-Faktur VAT Match & Verification</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>Real-time Live Bidding Websockets</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>Unlimited Team Member Invites</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Sales Action */}
                      <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-[var(--ui-text-muted)]">
                          Ingin upgrade ke langganan tahunan atau paket enterprise dedicated?
                        </div>
                        <button
                          type="button"
                          onClick={handleContactSales}
                          style={{ color: 'white' }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
                        >
                          <PhoneCall size={14} />
                          <span>Hubungi Sales / Upgrade</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Appearance & Theme</h2>
                  <p className="text-sm text-[var(--ui-text-muted)] mt-1">Configure interface mode and visual theme settings.</p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Display Mode</span>
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)]">
                    <div className="p-4 px-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-[var(--ui-text-primary)]">Interface Theme</div>
                        <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">Switch between Light, System Auto, or Dark mode.</div>
                      </div>
                      <div>
                        <ThemeToggle />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Flags & AI Tab */}
            {activeTab === "features" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Feature Flags & AI Tools</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      BETA
                    </span>
                  </div>
                  <p className="text-sm text-[var(--ui-text-muted)] mt-1">
                    Aktifkan fitur eksperimental dan modul AI secara manual sesuai kebutuhan alur kerja Anda.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
                    AI & Autonomous Procurement
                  </span>

                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                    {/* Agentic Procurement Toggle Card */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-orange-500/20">
                          <Sparkles size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[var(--ui-text-primary)]">
                              AI Agentic Procurement
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
                              AI Assistant
                            </span>
                            {agenticEnabled ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                AKTIF DI SIDEBAR
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-500/10 text-[var(--ui-text-muted)] border border-[var(--ui-border)]">
                                NONAKTIF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--ui-text-muted)] leading-relaxed max-w-xl">
                            Mengaktifkan agen cerdas untuk pengadaan otonom. AI akan meriset spesifikasi teknis, mencocokkan katalog vendor, membandingkan estimasi harga, dan menyusun draf Purchase Requisition (PR) secara otomatis.
                          </p>
                          <div className="text-[11px] text-[var(--ui-text-secondary)] pt-1 flex items-center gap-1.5">
                            <span className="font-semibold text-orange-400">Status:</span>
                            {agenticEnabled
                              ? "Menu 'AI Agentic Procurement' ditampilkan di sidebar pada bagian Procurement (Buyer)."
                              : "Menu disembunyikan dari sidebar navigasi."}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Switch Toggle */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={agenticEnabled}
                          onClick={() => handleToggleAgentic(!agenticEnabled)}
                          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                            agenticEnabled
                              ? "bg-gradient-to-r from-orange-500 to-amber-500"
                              : "bg-[var(--ui-border)]"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              agenticEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === "sessions" && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">Active Sessions</h2>
                    <p className="text-sm text-[var(--ui-text-muted)] mt-1">Devices currently authenticated with your Huntr account.</p>
                  </div>
                  <button onClick={fetchSessions} className="px-4 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-sm font-semibold text-orange-400 hover:border-orange-500/40 transition-all">
                    Refresh
                  </button>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">Connected Devices</span>
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                    {sessions.length === 0 ? (
                      <div className="text-center py-12 text-[var(--ui-text-muted)]">
                        <Monitor size={40} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No active session data found.</p>
                      </div>
                    ) : (
                      sessions.map((session) => {
                        const isMobile = session.name?.toLowerCase().includes("android") || session.name?.toLowerCase().includes("ios") || session.user_agent?.toLowerCase().includes("mobile");
                        const Icon = isMobile ? Smartphone : Monitor;
                        return (
                          <div key={session.id} className="p-4 px-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${session.is_current_device ? "bg-orange-500/15 text-orange-500" : "bg-[var(--ui-bg-card)] text-[var(--ui-text-secondary)]"}`}>
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[var(--ui-text-primary)] truncate">
                                    {session.type === "API Token" ? session.name || "Unknown Device" : session.ip_address}
                                  </span>
                                  {session.is_current_device && (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      THIS DEVICE
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[var(--ui-text-muted)] truncate mt-0.5 flex items-center gap-2">
                                  <span>{session.type === "API Token" ? "API Token" : session.user_agent}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Clock size={12} /> {session.last_active}</span>
                                </div>
                              </div>
                            </div>
                            {!session.is_current_device && (
                              <button
                                onClick={() => handleLogoutSession(session.id)}
                                className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex-shrink-0"
                                title="Terminate session"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
