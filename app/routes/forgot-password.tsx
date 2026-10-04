import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, ArrowLeft, Key, MessageSquare, ShieldCheck, CheckCircle2 } from "lucide-react";
import { sendOtp, verifyOtp, resetPasswordWhatsapp } from "../lib/api/auth";
import AuthLayout from "../components/AuthLayout";
import { useLanguage } from "../context/LanguageContext";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<"whatsapp" | "otp" | "reset" | "success">("whatsapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [whatsapp, setWhatsapp] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendOtp({ whatsapp });
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP to this number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyOtp({ whatsapp, otp });
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordWhatsapp({ whatsapp, password, password_confirmation: passwordConfirmation });
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="login"
      visualTitle={t("forgotPassword.visualTitle")}
      visualText={t("forgotPassword.visualText")}
      features={t("forgotPassword.features").split("|")}
      featureVariant="orange"
    >
      {step === "whatsapp" && (
        <form onSubmit={handleSendOtp} className="auth-form">
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ui-text-muted)", marginBottom: 24, textDecoration: "none" }}>
            <ArrowLeft size={16} /> {t("forgotPassword.backToLogin")}
          </Link>
          <div className="auth-form__header">
            <h1 className="auth-heading">{t("forgotPassword.headingStep1")}</h1>
            <p className="auth-subheading">{t("forgotPassword.subheadingStep1")}</p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="whatsapp-input">{t("forgotPassword.whatsappLabel")}</label>
            <div className="auth-input-wrap">
              <input
                id="whatsapp-input"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                type="tel"
                placeholder="081234567890"
                required
                className="auth-input auth-input--with-icon"
              />
              <div className="auth-input-icon">
                <MessageSquare size={18} />
              </div>
            </div>
          </div>

          {error && <div className="auth-alert auth-alert--error">⚠ {error}</div>}

          <button type="submit" disabled={loading || !whatsapp} className="auth-btn auth-btn--primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : t("forgotPassword.sendOtp")}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <button type="button" onClick={() => setStep("whatsapp")} style={{ background: "none", border: "none", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ui-text-muted)", marginBottom: 24, cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={16} /> {t("forgotPassword.back")}
          </button>
          <div className="auth-form__header">
            <h1 className="auth-heading">{t("forgotPassword.headingStep2")}</h1>
            <p className="auth-subheading">{t("forgotPassword.subheadingStep2").replace("{number}", whatsapp)}</p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="otp-input">{t("forgotPassword.verificationCodeLabel")}</label>
            <div className="auth-input-wrap">
              <input
                id="otp-input"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                type="text"
                inputMode="numeric"
                placeholder="123456"
                required
                className="auth-input auth-otp-input"
              />
              <div className="auth-input-icon">
                <ShieldCheck size={18} />
              </div>
            </div>
          </div>

          {error && <div className="auth-alert auth-alert--error">⚠ {error}</div>}

          <button type="submit" disabled={loading || otp.length !== 6} className="auth-btn auth-btn--primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : t("forgotPassword.verifyCode")}
          </button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="auth-form__header">
            <h1 className="auth-heading">{t("forgotPassword.headingStep3")}</h1>
            <p className="auth-subheading">{t("forgotPassword.subheadingStep3")}</p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="new-password">{t("forgotPassword.newPasswordLabel")}</label>
            <div className="auth-input-wrap">
              <input
                id="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
                className="auth-input auth-input--with-icon"
                minLength={8}
              />
              <div className="auth-input-icon">
                <Key size={18} />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password">{t("forgotPassword.confirmPasswordLabel")}</label>
            <div className="auth-input-wrap">
              <input
                id="confirm-password"
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
                className="auth-input auth-input--with-icon"
                minLength={8}
              />
              <div className="auth-input-icon">
                <Key size={18} />
              </div>
            </div>
          </div>

          {error && <div className="auth-alert auth-alert--error">⚠ {error}</div>}

          <button type="submit" disabled={loading || !password || !passwordConfirmation} className="auth-btn auth-btn--primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : t("forgotPassword.resetPasswordBtn")}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="auth-form" style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={32} color="#22c55e" />
            </div>
          </div>
          <h1 className="auth-heading" style={{ marginBottom: 12 }}>{t("forgotPassword.successTitle")}</h1>
          <p className="auth-subheading" style={{ marginBottom: 32 }}>{t("forgotPassword.successSubtitle")}</p>
          <button onClick={() => navigate("/login")} className="auth-btn auth-btn--primary">
            {t("forgotPassword.goToLogin")}
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
