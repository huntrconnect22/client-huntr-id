import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, Eye, EyeOff, ShieldCheck, Key, ArrowLeft, Mail, Lock, LogIn } from "lucide-react";
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
      visualTitle="Enterprise B2B Procurement"
      visualText="Streamline operations, automate RFQ workflows, and connect with verified enterprise vendors."
      features={["✓ Verified Vendor Network", "✓ Automated RFQ Flow", "✓ Smart PO Matching"]}
    >
      {!show2FA ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Back link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ui-text-muted)] hover:text-orange-500 transition-colors w-fit"
          >
            <ArrowLeft size={14} /> Back to Marketplace
          </Link>

          {/* Heading */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--ui-text-primary)] tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ui-text-muted)] mt-1.5 leading-relaxed">
              Masuk ke akun Huntr.id Anda untuk mengelola pengadaan perusahaan
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="login-email">
                Email atau WhatsApp
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="Email atau nomor WhatsApp"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-[var(--ui-text-muted)]/50"
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="login-password">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-[var(--ui-text-muted)]/50"
                />
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] p-1 rounded-lg transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--ui-border-input)] text-orange-500 focus:ring-orange-500/20 accent-orange-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-[var(--ui-text-secondary)]">
                Ingat Saya
              </span>
            </label>
            <Link 
              to="/forgot-password" 
              className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
            >
              Lupa Kata Sandi?
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
              <span className="shrink-0 text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <LogIn size={18} /> Masuk Akun
              </>
            )}
          </button>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t border-[var(--ui-border-subtle)]">
            <p className="text-xs text-[var(--ui-text-muted)]">
              Belum memiliki akun perusahaan?{" "}
              <Link to="/register" className="font-bold text-orange-500 hover:underline ml-1">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handle2FASubmit} className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-2xl font-black text-[var(--ui-text-primary)]">
              Verifikasi 2FA
            </h1>
            <p className="text-xs text-[var(--ui-text-muted)] max-w-xs mx-auto">
              {useRecovery ? "Masukkan kode pemulihan (recovery code) Anda" : "Masukkan 6 digit kode dari aplikasi autentikator Anda"}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="login-2fa">
              {useRecovery ? "Kode Pemulihan" : "Kode Autentikasi"}
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
              className="w-full px-4 py-3 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-center text-xl font-bold tracking-[0.2em] outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-normal"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2.5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Verifikasi & Lanjutkan"}
          </button>

          <div className="space-y-2 pt-2 text-center">
            <button
              type="button"
              onClick={() => { setUseRecovery(!useRecovery); setTwoFactorCode(""); }}
              className="text-xs font-bold text-orange-500 hover:underline flex items-center justify-center gap-1.5 w-full"
            >
              <Key size={14} />
              {useRecovery ? "Gunakan Aplikasi Authenticator" : "Gunakan Kode Pemulihan"}
            </button>

            <button
              type="button"
              onClick={() => { setShow2FA(false); setTwoFactorCode(""); }}
              className="text-xs font-medium text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] transition-colors w-full"
            >
              Kembali ke Form Login
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

