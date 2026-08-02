import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, Eye, EyeOff, ShieldCheck, Key, ArrowLeft } from "lucide-react";
import { login, verify2FALogin, getCsrfCookie } from "../lib/api/auth";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (session) {
      const company = localStorage.getItem("active_company");
      navigate(company ? "/" : "/select-company", { replace: true });
    }
    
    // Initialize CSRF cookie on component mount
    getCsrfCookie().catch(err => {
      console.warn("Failed to initialize CSRF cookie:", err);
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userPayload = await login({ email: form.email, password: form.password, rememberMe });

      if (userPayload.two_factor) {
        setChallengeToken(userPayload.two_factor_challenge_token ?? null);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      const user = {
        id: userPayload.id,
        name: userPayload.name || "User",
        email: userPayload.email || "",
        whatsapp: userPayload.whatsapp || "",
        role: userPayload.role || null, // Don't default to 'buyer' - let backend handle proper role assignment
        company_id: userPayload.company_id || null,
        two_factor_confirmed_at: userPayload.two_factor_confirmed_at || null,
        token: userPayload.token || null, // IMPORTANT: Save token!
      };

      localStorage.setItem("user_session", JSON.stringify(user));
      
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate("/select-company");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!challengeToken) {
        setError("Session expired. Please log in again.");
        setShow2FA(false);
        return;
      }

      const userPayload = await verify2FALogin(
        useRecovery
          ? { two_factor_challenge_token: challengeToken, recovery_code: twoFactorCode }
          : { two_factor_challenge_token: challengeToken, code: twoFactorCode }
      );

      const user = {
        id: userPayload.id,
        name: userPayload.name || "User",
        email: userPayload.email || "",
        whatsapp: userPayload.whatsapp || "",
        role: userPayload.role || null,
        company_id: userPayload.company_id || null,
        two_factor_confirmed_at: userPayload.two_factor_confirmed_at || null,
        token: userPayload.token || null,
      };

      localStorage.setItem("user_session", JSON.stringify(user));

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate("/select-company");
      }
    } catch (err: any) {
      // If the challenge token expired, kick user back to login form
      const msg: string = err.message || "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        setChallengeToken(null);
        setShow2FA(false);
        setError("Session expired. Please log in again.");
      } else {
        setError(msg || "Invalid 2FA code.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="login"
      visualTitle="Enterprise Procurement"
      visualText="Streamline your business operations with our advanced B2B ecosystem."
      features={["✓ Verified Vendors", "✓ Automated RFQ", "✓ Secure PO"]}
      featureVariant="orange"
    >
      {!show2FA ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ui-text-muted)", marginBottom: 24, textDecoration: "none" }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="auth-form__header">
            <h1 className="auth-heading">Welcome back</h1>
            <p className="auth-subheading">Sign in to access your procurement dashboard</p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email or WhatsApp</label>
            <input
              id="login-email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="name@company.com"
              required
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="auth-input auth-input--with-icon"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="auth-eye-btn"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  cursor: "pointer",
                  accentColor: "#f97316",
                  position: "relative",
                  zIndex: 10
                }}
              />
              <label htmlFor="remember-me" style={{
                fontSize: 13,
                color: "var(--ui-text-secondary)",
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                zIndex: 10
              }}>
                Remember me for 30 days
              </label>
            </div>
            <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 700, color: "#f97316", textDecoration: "none", position: "relative", zIndex: 10, cursor: "pointer" }}>
              Forgot password?
            </Link>
          </div>

          {error && <div className="auth-alert auth-alert--error">⚠ {error}</div>}

          <button type="submit" disabled={loading} className="auth-btn auth-btn--primary">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="auth-link">Create an account</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handle2FASubmit} className="auth-form">
          <div className="auth-form__header auth-form__header--2fa">
            <div className="auth-2fa-icon">
              <ShieldCheck size={32} color="#fff" />
            </div>
            <h1 className="auth-heading">2FA Verification</h1>
            <p className="auth-subheading">
              {useRecovery ? "Enter recovery code" : "Enter authenticator code"}
            </p>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-2fa">
              {useRecovery ? "Recovery Code" : "Authentication Code"}
            </label>
            <input
              id="login-2fa"
              value={twoFactorCode}
              onChange={e => setTwoFactorCode(e.target.value)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={useRecovery ? "87654321" : "123456"}
              required
              className="auth-input auth-otp-input"
            />
          </div>

          {error && <div className="auth-alert auth-alert--error">⚠ {error}</div>}

          <button type="submit" disabled={loading} className="auth-btn auth-btn--primary">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Continue"}
          </button>

          <button
            type="button"
            onClick={() => { setUseRecovery(!useRecovery); setTwoFactorCode(""); }}
            className="auth-text-btn auth-text-btn--link"
          >
            <Key size={14} />
            {useRecovery ? "Use authenticator app" : "Use recovery code"}
          </button>

          <button
            type="button"
            onClick={() => { setShow2FA(false); setTwoFactorCode(""); }}
            className="auth-text-btn auth-text-btn--muted"
          >
            Back to Login
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
