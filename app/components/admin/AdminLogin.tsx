import React, { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { adminLogin } from "../../lib/api";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../ThemeToggle";
import { lbl, inp } from "./shared";
import type { AdminUser } from "./shared";

interface Props {
  onLogin: (a: AdminUser) => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ email, password });
      sessionStorage.setItem("admin_session_token", res.token);
      onLogin(res.admin);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
        position: "relative",
        overflow: "hidden",
        background: "var(--ui-bg-page-grad)",
        transition: "background 0.3s ease",
      }}
    >
      {/* Theme toggle — top right */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      {/* Decorative background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,146,60,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern — adapts opacity per theme */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: isDark
              ? "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)"
              : "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(24px, 5vw, 40px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <img
              src="/assets/img/logo/sidebar.png"
              alt="Huntr.id"
              style={{ height: "clamp(44px, 9vw, 60px)", objectFit: "contain" }}
            />
          </div>
          <h1
            style={{
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 900,
              color: "var(--ui-text-primary)",
              letterSpacing: "-0.5px",
              marginBottom: 6,
              transition: "color 0.3s ease",
            }}
          >
            Admin Portal
          </h1>
          <p
            style={{
              fontSize: "clamp(12px, 3vw, 13px)",
              color: "var(--ui-text-muted)",
              transition: "color 0.3s ease",
            }}
          >
            Huntr.id · Global Administration
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--ui-glass-bg)",
            backdropFilter: "blur(32px)",
            border: "1px solid var(--ui-glass-border)",
            borderRadius: 20,
            boxShadow: "var(--ui-glass-shadow)",
            padding: "clamp(24px, 5vw, 36px) clamp(20px, 4vw, 32px)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            transition: "all 0.3s ease",
            position: "relative",
          }}
        >
          {/* Accent top bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              borderRadius: "20px 20px 0 0",
              background: "linear-gradient(90deg,#f59e0b,#f97316,#ec4899)",
            }}
          />

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 13,
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={lbl}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@huntr.id"
              style={inp}
              autoComplete="email"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={lbl}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inp}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 4,
              padding: "13px 20px",
              borderRadius: 10,
              background: isLoading
                ? "rgba(249,115,22,0.5)"
                : "linear-gradient(135deg,#f59e0b,#f97316)",
              border: "none",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: isLoading ? "none" : "0 6px 24px rgba(249,115,22,0.35)",
              letterSpacing: "-0.2px",
              transition: "all 0.2s",
              minHeight: 48,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Authenticating…
              </>
            ) : (
              <>Sign In as Admin →</>
            )}
          </button>

          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "var(--ui-text-muted)",
              transition: "color 0.3s ease",
            }}
          >
            Restricted access · Huntr.id Global Operations
          </div>
        </form>
      </div>
    </div>
  );
}
