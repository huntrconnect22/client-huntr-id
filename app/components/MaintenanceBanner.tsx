import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, ServerCrash } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useBackendStatus } from "../hooks/useBackendStatus";

/**
 * MaintenanceBanner
 *
 * Full-screen overlay that appears when the backend is unreachable.
 * Dismisses automatically when connectivity is restored.
 * Supports English and Indonesian via LanguageContext.
 */
export default function MaintenanceBanner() {
  const { isDown, isChecking, retry } = useBackendStatus();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dots, setDots] = useState("");

  // Animate entry/exit with a small delay so it doesn't flash on fast connections
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isDown) {
      timer = setTimeout(() => setVisible(true), 300);
    } else {
      setVisible(false);
    }
    return () => clearTimeout(timer);
  }, [isDown]);

  // Animated ellipsis for retrying text
  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 550);
    return () => clearInterval(iv);
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes htr-maint-fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes htr-maint-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          60%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes htr-maint-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .htr-maint-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 15, 0.92);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          animation: htr-maint-fade-in 0.35s ease both;
        }
        .htr-maint-card {
          position: relative;
          max-width: 480px;
          width: 90vw;
          border-radius: 20px;
          padding: 44px 40px 36px;
          text-align: center;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.02) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 0 0 1px rgba(249, 115, 22, 0.08),
            0 32px 80px rgba(0, 0, 0, 0.7),
            inset 0 1px 0 rgba(255, 255, 255, 0.07);
          overflow: hidden;
        }
        .htr-maint-card::before {
          content: "";
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .htr-maint-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.1));
          border: 1px solid rgba(249,115,22,0.3);
          margin-bottom: 22px;
        }
        .htr-maint-icon-wrap::after {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(249,115,22,0.25);
          animation: htr-maint-pulse-ring 2.2s ease-out infinite;
        }
        .htr-maint-title {
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 10px;
          line-height: 1.3;
          letter-spacing: -0.3px;
        }
        .htr-maint-subtitle {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.65;
          margin: 0 0 28px;
        }
        .htr-maint-status-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 22px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
        .htr-maint-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239,68,68,0.7);
        }
        .htr-maint-retrying {
          font-size: 12.5px;
          color: rgba(249,115,22,0.8);
          margin-bottom: 24px;
          font-weight: 600;
        }
        .htr-maint-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 24px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(249,115,22,0.35);
          transition: opacity 0.15s ease, transform 0.15s ease;
          letter-spacing: 0.1px;
        }
        .htr-maint-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .htr-maint-btn:active { opacity: 0.8; transform: translateY(0); }
        .htr-maint-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .htr-maint-spin { animation: htr-maint-spin 1s linear infinite; }
        .htr-maint-footer {
          margin-top: 20px;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="htr-maint-overlay" role="alert" aria-live="assertive">
        <div className="htr-maint-card">
          {/* Icon */}
          <div className="htr-maint-icon-wrap">
            <WifiOff size={28} color="#f97316" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h1 className="htr-maint-title">{t("maintenance.title")}</h1>

          {/* Subtitle */}
          <p className="htr-maint-subtitle">{t("maintenance.subtitle")}</p>

          {/* Status indicator */}
          <div className="htr-maint-status-row">
            <div className="htr-maint-status-dot" />
            <span>{t("maintenance.statusLabel")}: {t("maintenance.statusOffline")}</span>
          </div>

          {/* Retrying text */}
          <p className="htr-maint-retrying">
            <ServerCrash size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />
            {t("maintenance.retrying")}{dots}
          </p>

          {/* Manual retry button */}
          <button
            className="htr-maint-btn"
            onClick={() => retry()}
            disabled={isChecking}
          >
            <RefreshCw
              size={15}
              className={isChecking ? "htr-maint-spin" : ""}
            />
            {t("maintenance.retryBtn")}
          </button>

          {/* Footer */}
          <p className="htr-maint-footer">huntr.id &mdash; Procurement Intelligence</p>
        </div>
      </div>
    </>
  );
}
