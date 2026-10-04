import React, { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import {
  updatePassword,
  enable2FA,
  disable2FA,
  get2FAQRCode,
  confirm2FA,
  get2FARecoveryCodes,
} from "../../../lib/api";
import { getCsrfCookie } from "../../../lib/api/auth";
import { useLanguage } from "../../../context/LanguageContext";

interface AccountSecurityTabProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

export function AccountSecurityTab({
  user,
  onUserUpdate,
  onError,
  onSuccess,
}: AccountSecurityTabProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(!!user?.two_factor_confirmed_at);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [confirming2FA, setConfirming2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      await getCsrfCookie();
      await updatePassword(passwordForm);
      onSuccess(t("settings.security.updatePasswordBtn") + " ✓");
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    onError(null);
    try {
      await enable2FA();
      const qrRes = await get2FAQRCode();
      setQrCode(qrRes.svg);
      setConfirming2FA(true);
      onSuccess(t("settings.security.scanQrTitle"));
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    setLoading(true);
    onError(null);
    try {
      await confirm2FA(twoFactorCode);
      const codesRes = await get2FARecoveryCodes();
      setRecoveryCodes(codesRes);
      setTwoFactorEnabled(true);
      setConfirming2FA(false);
      setQrCode(null);
      setTwoFactorCode("");

      const updatedUser = { ...user, two_factor_confirmed_at: new Date().toISOString() };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      onSuccess(t("settings.security.twoFactorActive") + " ✓");
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm(t("settings.security.disable2FAConfirm"))) return;
    setLoading(true);
    onError(null);
    try {
      await disable2FA();
      setTwoFactorEnabled(false);
      setRecoveryCodes([]);

      const updatedUser = { ...user, two_factor_confirmed_at: null };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);

      onSuccess(t("settings.security.twoFactorDisabledMsg"));
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
          {t("settings.security.title")}
        </h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          {t("settings.security.subtitle")}
        </p>
      </div>

      {/* Change Password Group */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          {t("settings.security.loginPassword")}
        </span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <form onSubmit={handleUpdatePassword}>
            {/* Current Password Row */}
            <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-sm font-semibold text-[var(--ui-text-primary)] sm:w-1/3">
                {t("settings.security.currentPassword")}
              </label>
              <div className="sm:w-2/3">
                <input
                  type="password"
                  placeholder={t("settings.security.currentPasswordPlaceholder")}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            {/* New Password Row */}
            <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--ui-border)]">
              <label className="text-sm font-semibold text-[var(--ui-text-primary)] sm:w-1/3">
                {t("settings.security.newPassword")}
              </label>
              <div className="sm:w-2/3 relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder={t("settings.security.newPasswordPlaceholder")}
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
              <label className="text-sm font-semibold text-[var(--ui-text-primary)] sm:w-1/3">
                {t("settings.security.confirmPassword")}
              </label>
              <div className="sm:w-2/3 relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  placeholder={t("settings.security.confirmPasswordPlaceholder")}
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : t("settings.security.updatePasswordBtn")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2FA Group */}
      <div className="space-y-2.5 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          {t("settings.security.twoFactorAuth")}
        </span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] p-5 space-y-4">
          {!twoFactorEnabled && !confirming2FA && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--ui-text-primary)]">
                  {t("settings.security.twoFactorOffTitle")}
                </div>
                <p className="text-xs text-[var(--ui-text-muted)] mt-1">
                  {t("settings.security.twoFactorOffDesc")}
                </p>
              </div>
              <button
                onClick={handleEnable2FA}
                disabled={loading}
                style={{ color: 'white' }}
                className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex-shrink-0"
              >
                {t("settings.security.enable2FABtn")}
              </button>
            </div>
          )}

          {confirming2FA && qrCode && (
            <div className="space-y-4 pt-1">
              <p className="text-sm font-medium text-[var(--ui-text-primary)]">
                {t("settings.security.scanQrTitle")}
              </p>
              <div dangerouslySetInnerHTML={{ __html: qrCode }} className="bg-white p-3 rounded-md w-fit" />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                  {t("settings.security.enterCodeLabel")}
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder={t("settings.security.codePlaceholder")}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] text-sm outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleConfirm2FA} disabled={loading} style={{ color: 'white' }} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : t("settings.security.confirmBtn")}
                </button>
                <button onClick={() => { setConfirming2FA(false); setQrCode(null); }} className="px-5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm font-semibold text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] transition-all">
                  {t("settings.security.cancelBtn")}
                </button>
              </div>
            </div>
          )}

          {twoFactorEnabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span className="font-semibold text-sm">{t("settings.security.twoFactorActive")}</span>
                </div>
                <button onClick={handleDisable2FA} disabled={loading} className="px-5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all">
                  {t("settings.security.disableBtn")}
                </button>
              </div>
              {recoveryCodes.length > 0 && (
                <div className="p-3.5 rounded-md bg-black/30">
                  <p className="text-xs font-semibold text-[var(--ui-text-primary)] mb-2">
                    {t("settings.security.recoveryCodesTitle")}
                  </p>
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
  );
}
