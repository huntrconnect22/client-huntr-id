import React, { useState } from "react";
import { Loader2, MessageSquareCode } from "lucide-react";
import {
  sendOtp,
  verifyOtp,
  updateWhatsapp,
  loadOtpSession,
  clearOtpSession,
} from "../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";

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
  const { t } = useLanguage();
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
      onError(t("settings.profile.whatsappPlaceholder"));
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
      onSuccess(t("settings.profile.otpSentSuccess"));
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
      onError(t("settings.profile.otpLengthError"));
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

      onSuccess(t("settings.profile.updateSuccess"));
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
        <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">
          {t("settings.profile.title")}
        </h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          {t("settings.profile.subtitle")}
        </p>
      </div>

      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          {t("settings.profile.contactInfo")}
        </span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <form onSubmit={handleUpdateWhatsapp}>
            <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="sm:w-1/3">
                <div className="text-sm font-semibold text-[var(--ui-text-primary)]">
                  {t("settings.profile.whatsappNumber")}
                </div>
                <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                  {t("settings.profile.whatsappNumberDesc")}
                </div>
              </div>
              <div className="sm:w-2/3 flex gap-2">
                <input
                  type="tel"
                  placeholder={t("settings.profile.whatsappPlaceholder")}
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
                    {loading ? <Loader2 size={16} className="animate-spin" /> : t("settings.profile.verifyBtn")}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="p-5 bg-[var(--ui-bg-card)] space-y-4">
                <label className="text-xs font-semibold text-orange-400 flex items-center gap-2">
                  <MessageSquareCode size={16} /> {t("settings.profile.enterOtpLabel")}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder={t("settings.profile.otpPlaceholder")}
                  required
                  maxLength={6}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-sm outline-none"
                />
                {debugOtp && <div className="text-xs text-emerald-400 font-semibold">Debug OTP (local): {debugOtp}</div>}
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={loading} style={{ color: 'white' }} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : t("settings.profile.confirmUpdateBtn")}
                  </button>
                  <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:underline font-semibold transition-all">
                    {t("settings.profile.cancelBtn")}
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
