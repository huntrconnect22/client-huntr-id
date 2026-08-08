import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Loader2, Eye, EyeOff, MessageSquareCode, ArrowLeft, User, Phone, Mail, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { register, sendOtp, verifyOtp, loadOtpSession, clearOtpSession, getCsrfCookie } from "../lib/api";
import { isValidWhatsapp } from "../lib/whatsapp";
import AuthLayout from "../components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const initialWhatsapp = searchParams.get("whatsapp") || "";

  const [form, setForm] = useState({ name: "", email: "", password: "", whatsapp: initialWhatsapp });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [canonicalWhatsapp, setCanonicalWhatsapp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (k === "whatsapp" && otpSent) {
      setOtpSent(false);
      setOtp("");
      setCanonicalWhatsapp("");
      setOtpToken("");
      clearOtpSession();
      setDebugOtp(null);
      setError(null);
      setSuccessMsg(null);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (session) {
      const company = localStorage.getItem("active_company");
      navigate(company ? "/" : "/select-company");
    }
    
    getCsrfCookie().catch(err => {
      console.warn("Failed to initialize CSRF cookie:", err);
    });
  }, [navigate]);

  const handleSendOtp = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (sendingOtp || (resendCooldown > 0 && otpSent)) return;
    if (!form.name || !form.whatsapp || !form.password) {
      setError("Isi Nama Lengkap, Nomor WhatsApp, dan Kata Sandi terlebih dahulu.");
      return;
    }
    if (!isValidWhatsapp(form.whatsapp)) {
      setError("Format WhatsApp tidak valid. Gunakan 08xxxxxxxxxx.");
      return;
    }
    setSendingOtp(true);
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await sendOtp({ whatsapp: form.whatsapp });
      setOtpSent(true);
      setCanonicalWhatsapp(res.whatsapp || form.whatsapp);
      setOtpToken(res.otp_token || "");
      setResendCooldown(60);
      const sentNote = res.whatsapp_sent === false
        ? " Pengiriman WhatsApp gagal — gunakan Debug OTP di bawah."
        : "";
      setSuccessMsg(`Kode OTP dikirim.${sentNote} Nomor: ${res.whatsapp || form.whatsapp}`);
      if (res.otp) setDebugOtp(String(res.otp));
    } catch (err: any) {
      setError(err.message || "Gagal mengirim kode OTP. Silakan coba lagi.");
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otpSent) return;
    if (!otp) {
      setError("Masukkan kode verifikasi OTP.");
      return;
    }
    if (otp.length !== 6) {
      setError("Masukkan 6 digit kode OTP secara lengkap.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const session = loadOtpSession();
      const phone = session?.whatsapp || canonicalWhatsapp || form.whatsapp;
      await verifyOtp({ whatsapp: phone, otp, otp_token: otpToken || session?.otp_token });

      clearOtpSession();

      const registerPayload = {
        name: form.name,
        whatsapp: phone,
        password: form.password,
        email: form.email || undefined,
      };

      const userPayload = await register(registerPayload);
      
      const user = {
        id: userPayload?.id,
        name: userPayload?.name || form.name,
        email: userPayload?.email || form.email,
        whatsapp: userPayload?.whatsapp || phone,
        role: userPayload?.role || null,
        token: userPayload?.token || null,
      };

      localStorage.setItem("user_session", JSON.stringify(user));
      localStorage.removeItem("active_company");
      
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Verifikasi atau pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="register"
      visualTitle="Bergabung dengan Ekosistem Pengadaan"
      visualText="Hubungkan perusahaan Anda dengan ratusan buyer & vendor terverifikasi di seluruh Indonesia."
      features={["✓ Onboarding Terpandu", "✓ Verifikasi WhatsApp", "✓ Keamanan Berstandar Enterprise"]}
    >
      <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-6">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ui-text-muted)] hover:text-orange-500 transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Kembali ke Marketplace
        </Link>

        {/* Heading */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ui-text-primary)] tracking-tight">
            Buat Akun Perusahaan
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ui-text-muted)] mt-1.5 leading-relaxed">
            Daftarkan identitas pengelola untuk mulai menggunakan platform
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)]">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
              !otpSent ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-emerald-500 text-white"
            }`}>
              {!otpSent ? "1" : <CheckCircle2 size={16} />}
            </div>
            <span className="text-xs font-semibold text-[var(--ui-text-primary)]">Data Pengguna</span>
          </div>

          <div className="w-8 h-[2px] bg-[var(--ui-border)]" />

          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
              otpSent ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]"
            }`}>
              2
            </div>
            <span className={`text-xs font-semibold ${otpSent ? "text-[var(--ui-text-primary)]" : "text-[var(--ui-text-muted)]"}`}>
              Verifikasi OTP
            </span>
          </div>
        </div>

        {/* Form Input Fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="register-name">
              Nama Lengkap
            </label>
            <div className="relative">
              <input
                id="register-name"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="e.g. Budi Santoso"
                required
                disabled={otpSent}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-[var(--ui-text-muted)]/50 disabled:opacity-75"
              />
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="register-whatsapp">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <input
                id="register-whatsapp"
                value={form.whatsapp}
                onChange={e => set("whatsapp", e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 085156334793"
                required
                disabled={otpSent}
                className="w-full pl-11 pr-20 py-3.5 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-[var(--ui-text-muted)]/50 disabled:opacity-75"
              />
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
              {otpSent && (
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500 hover:underline px-2 py-1"
                >
                  Ubah
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="register-email">
              Email Perusahaan (Opsional)
            </label>
            <div className="relative">
              <input
                id="register-email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="budi@perusahaan.com"
                disabled={otpSent}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-[var(--ui-text-muted)]/50 disabled:opacity-75"
              />
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]" htmlFor="register-password">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="register-password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="minimal 8 karakter"
                required
                disabled={otpSent}
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-500/60 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-[var(--ui-text-muted)]/50 disabled:opacity-75"
              />
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]" />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                disabled={otpSent}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] p-1 rounded-lg transition-colors disabled:opacity-50"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* OTP Verification Box when triggered */}
          {otpSent && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/25 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-500 flex items-center gap-1.5">
                  <MessageSquareCode size={16} /> Masukkan Kode OTP
                </label>
                {debugOtp && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Debug OTP: {debugOtp}
                  </span>
                )}
              </div>
              
              <input
                id="register-otp"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit OTP"
                required
                maxLength={6}
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-center text-xl font-bold tracking-[0.25em] outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[var(--ui-text-muted)]">
                  Cek pesan WhatsApp Anda
                </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || sendingOtp || resendCooldown > 0}
                  className="text-xs font-bold text-orange-500 hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `Kirim Ulang (${resendCooldown}s)`
                    : sendingOtp
                      ? "Mengirim..."
                      : "Kirim Ulang OTP"}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2.5">
            <span className="shrink-0 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2.5">
            <span className="shrink-0 text-base">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        {!otpSent ? (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || sendingOtp}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading || sendingOtp ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Mengirim Kode...
              </>
            ) : (
              "Minta Kode OTP WhatsApp"
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Memverifikasi...
              </>
            ) : (
              "Verifikasi & Buat Akun"
            )}
          </button>
        )}

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-[var(--ui-border-subtle)]">
          <p className="text-xs text-[var(--ui-text-muted)]">
            Sudah memiliki akun?{" "}
            <Link to="/login" className="font-bold text-orange-500 hover:underline ml-1">
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

