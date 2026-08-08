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
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
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
  const [activeTab, setActiveTab] = useState<"security" | "profile" | "appearance" | "sessions">("security");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    fetchSessions();
  }, []);

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
    <Layout title="Account Settings" subtitle="Manage your security and profile">
      <div className="w-full px-4 py-6">
        {/* Feedback messages */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} /> {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)]">
          {[
            { id: "security", icon: Shield, label: "Security" },
            { id: "profile", icon: Smartphone, label: "Profile" },
            { id: "appearance", icon: Palette, label: "Appearance" },
            { id: "sessions", icon: Monitor, label: "Sessions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)]"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <tab.icon size={16} /> {tab.label}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-3xl p-6 md:p-8">
          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-8">
              {/* Password Section */}
              <section>
                <h2 className="text-xl font-black text-[var(--ui-text-primary)] mb-6">Change Password</h2>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--ui-text-muted)]">Current Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Enter current password"
                        value={passwordForm.current_password}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, current_password: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--ui-text-muted)]">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwordForm.password}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, password: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--ui-text-muted)]">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={passwordForm.password_confirmation}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white font-black text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
                  </button>
                </form>
              </section>

              <div className="h-px bg-[var(--ui-border)]" />

              {/* 2FA Section */}
              <section>
                <h2 className="text-xl font-black text-[var(--ui-text-primary)] mb-6">Two-Factor Authentication</h2>

                {!twoFactorEnabled && !confirming2FA && (
                  <div className="p-6 rounded-2xl bg-[rgba(249,115,22,0.05)] border border-[rgba(249,115,22,0.1)]">
                    <p className="text-sm text-[var(--ui-text-secondary)] mb-4">
                      Enhance your account security by enabling two-factor authentication.
                    </p>
                    <button
                      onClick={handleEnable2FA}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all"
                    >
                      Enable 2FA
                    </button>
                  </div>
                )}

                {confirming2FA && qrCode && (
                  <div className="space-y-6 p-6 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-subtle)]">
                    <p className="text-sm text-[var(--ui-text-primary)]">
                      Scan the QR code using your authenticator app:
                    </p>
                    <div
                      dangerouslySetInnerHTML={{ __html: qrCode }}
                      className="bg-white p-4 rounded-xl w-fit"
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--ui-text-muted)]">
                        Enter Confirmation Code
                      </label>
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-sm outline-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirm2FA}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] text-white font-black text-sm"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm"}
                      </button>
                      <button
                        onClick={() => {
                          setConfirming2FA(false);
                          setQrCode(null);
                        }}
                        className="px-6 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] font-bold text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && (
                  <div className="p-6 rounded-2xl bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.1)]">
                    <div className="flex items-center gap-3 text-emerald-400 mb-4">
                      <CheckCircle2 size={18} />
                      <span className="font-bold text-sm">2FA Active</span>
                    </div>
                    <p className="text-sm text-[var(--ui-text-secondary)] mb-4">
                      Your account is now more secure. Use the code from your authenticator app when logging in.
                    </p>

                    {recoveryCodes.length > 0 && (
                      <div className="mb-6 p-4 rounded-xl bg-black/30">
                        <p className="text-xs font-bold text-[var(--ui-text-primary)] mb-3">
                          Save these recovery codes in a safe place:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {recoveryCodes.map((code) => (
                            <code key={code} className="text-xs text-orange-300">
                              {code}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleDisable2FA}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all"
                    >
                      Disable 2FA
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateWhatsapp} className="space-y-6">
              <h2 className="text-xl font-black text-[var(--ui-text-primary)]">WhatsApp Information</h2>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--ui-text-muted)]">WhatsApp Number</label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    placeholder="e.g., +62812345678"
                    value={newWhatsapp}
                    onChange={(e) => {
                      setNewWhatsapp(e.target.value);
                      if (otpSent) {
                        setOtpSent(false);
                        setCanonicalWhatsapp("");
                        setOtpToken("");
                        clearOtpSession();
                      }
                    }}
                    required
                    disabled={otpSent}
                    className="flex-1 px-4 py-3 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none disabled:opacity-50"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || newWhatsapp === user?.whatsapp}
                      className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm disabled:opacity-50 transition-all"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify Number"}
                    </button>
                  )}
                </div>
                {newWhatsapp === user?.whatsapp && (
                  <p className="text-xs text-[var(--ui-text-muted)] mt-2">
                    This is your current WhatsApp number.
                  </p>
                )}
              </div>

              {otpSent && (
                <div className="space-y-3 p-6 rounded-2xl bg-[rgba(249,115,22,0.03)] border border-[rgba(249,115,22,0.1)]">
                  <label className="text-sm font-bold text-orange-300 flex items-center gap-2">
                    <MessageSquareCode size={14} /> Enter OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    placeholder="Enter 6-digit OTP"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none"
                  />
                  {debugOtp && (
                    <div className="text-xs text-emerald-400 font-semibold">
                      Debug OTP (local): {debugOtp}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || sendingOtp || resendCooldown > 0}
                    className="text-xs text-orange-400 font-semibold hover:underline"
                  >
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : sendingOtp
                        ? "Sending..."
                        : "Resend OTP"}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-black text-sm mt-4"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm & Update"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-[var(--ui-text-muted)] hover:underline"
                  >
                    Cancel / Change Number
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-[var(--ui-text-primary)] mb-2">Theme & Appearance</h2>
                <p className="text-sm text-[var(--ui-text-muted)] leading-relaxed">
                  Choose your preferred theme mode for the Huntr platform interface.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[var(--ui-text-primary)]">Interface Theme</div>
                  <div className="text-xs text-[var(--ui-text-muted)] mt-1">
                    Select Light, Auto (matches system settings), or Dark mode.
                  </div>
                </div>
                <div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--ui-text-primary)]">Active Sessions</h2>
                <button
                  onClick={fetchSessions}
                  className="text-xs text-orange-400 font-semibold"
                >
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-[var(--ui-text-muted)]">
                    <Monitor size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <p className="text-sm">No active session data.</p>
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isMobile = session.name?.toLowerCase().includes("android") || session.name?.toLowerCase().includes("ios") || session.user_agent?.toLowerCase().includes("mobile");
                    const Icon = isMobile ? Smartphone : Monitor;
                    return (
                      <div
                        key={session.id}
                        className="p-4 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-subtle)] flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: session.is_current_device
                              ? "rgba(249,115,22,0.15)"
                              : "var(--ui-bg-card)",
                            color: session.is_current_device
                              ? "#fb923c"
                              : "var(--ui-text-secondary)",
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--ui-text-primary)]">
                              {session.type === "API Token"
                                ? session.name || "Unknown Device"
                                : session.ip_address}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                              style={{
                                background: session.type === "API Token"
                                  ? "rgba(59,130,246,0.1)"
                                  : "rgba(156,163,175,0.1)",
                                color: session.type === "API Token"
                                  ? "#3b82f6"
                                  : "#9ca3af",
                              }}
                            >
                              {session.type === "API Token" ? "API" : "WEB"}
                            </span>
                            {session.is_current_device && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                                THIS DEVICE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--ui-text-muted)] truncate">
                            {session.type === "API Token" ? "Authorized via Bearer Token" : session.user_agent}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-[var(--ui-text-secondary)] mt-1">
                            <Clock size={10} /> Active last: {session.last_active}
                          </div>
                        </div>
                        {!session.is_current_device && (
                          <button
                            onClick={() => handleLogoutSession(session.id)}
                            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                            title="Terminate session"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-[rgba(249,115,22,0.05)] border border-[rgba(249,115,22,0.1)]">
                <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                  <strong>Note:</strong> If you see any suspicious activity, change your password immediately and terminate all other active sessions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
