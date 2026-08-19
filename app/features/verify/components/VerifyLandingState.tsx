import React from "react";
import { ShieldCheck, AlertCircle, Camera } from "lucide-react";

interface Props {
  scanError: string | null;
  onOpenScanner: () => void;
}

export function VerifyLandingState({ scanError, onOpenScanner }: Props) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
        boxShadow: "0 0 48px rgba(34,197,94,0.1)",
      }}>
        <ShieldCheck size={40} color="#22c55e" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: "#f1f5f9", margin: "0 0 12px" }}>
        Document Verification
      </h1>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, margin: "0 0 36px", maxWidth: 400, marginInline: "auto" }}>
        Verify the authenticity of Invoice, Delivery Order, or BAST from huntr.id. Scan a QR code printed on the document.
      </p>

      {/* Scan button */}
      <button
        id="btn-open-scanner"
        onClick={onOpenScanner}
        style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "14px 28px", borderRadius: 16, cursor: "pointer",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          border: "none", color: "#fff", fontSize: 15, fontWeight: 800,
          boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(34,197,94,0.45)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(34,197,94,0.35)";
        }}
      >
        <Camera size={20} />
        Scan QR Code
      </button>

      {/* Scan error */}
      {scanError && (
        <div style={{
          marginTop: 20, maxWidth: 420, marginInline: "auto",
          padding: "14px 18px", borderRadius: 14,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
        }}>
          <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: "#fca5a5", fontWeight: 500, lineHeight: 1.5 }}>{scanError}</span>
        </div>
      )}

      {/* Divider */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        maxWidth: 360, marginInline: "auto", marginTop: 32, marginBottom: 8,
      }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>or scan manually</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", margin: "8px 0 0" }}>
        QR codes on printed documents will open this page automatically.
      </p>
    </div>
  );
}
