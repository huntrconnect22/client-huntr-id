import React, { useState } from "react";
import { Loader2, MessageSquareCode } from "lucide-react";
import {
  sendOtp,
  verifyOtp,
  updateWhatsapp,
  loadOtpSession,
  clearOtpSession,
} from "../../../lib/api";

interface AccountProfileTabProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export function AccountProfileTab({
  user,
  onUserUpdate,
  onError,
  onSuccess,
}: AccountProfileTabProps) {
  const [loading, setLoading] = useState(false);
  const [newWhatsapp, setNewWhatsapp] = useState(user?.whatsapp || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [canonicalWhatsapp, setCanonicalWhatsapp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleSendOtp = async () => {
    if (sendingOtp || (resendCooldown > 0 && otpSent)) return;
    if (!newWhatsapp) {
      onError("Please enter a new WhatsApp number.");
      return;
    }
    setSendingOtp(true);
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      const res = await sendOtp({ whatsapp: newWhatsapp });
      setOtpSent(true);
      setCanonicalWhatsapp(res.whatsapp || newWhatsapp);
      setOtpToken(res.otp_token || "");
      setResendCooldown(60);
      onSuccess("Kode OTP telah dikirim. Gunakan kode terbaru dari WhatsApp.");
      if (res.otp) setDebugOtp(String(res.otp));
    } catch (err: any) {
      onError(err.message);
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      onError("Masukkan kode OTP 6 digit.");
      return;
    }
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      const session = loadOtpSession();
      const phone = session?.whatsapp || canonicalWhatsapp || newWhatsapp;
      await verifyOtp({ whatsapp: phone, otp, otp_token: otpToken || session?.otp_token });
      clearOtpSession();
      const data = await updateWhatsapp({ whatsapp: phone });

      const updatedUser = { ...user, whatsapp: data.user?.whatsapp || phone };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      onSuccess("WhatsApp number successfully updated!");
      setOtpSent(false);
      setOtp("");
      setCanonicalWhatsapp("");
      setOtpToken("");
      clearOtpSession();
      setDebugOtp(null);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
