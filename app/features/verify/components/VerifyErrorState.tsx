import React from "react";
import { ShieldX, AlertCircle, Camera } from "lucide-react";

interface Props {
  error: string;
  onScanAgain: () => void;
}

export function VerifyErrorState({ error, onScanAgain }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 40px rgba(239,68,68,0.15)",
      }}>
        <ShieldX size={44} color="#ef4444" />
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#f87171", marginBottom: 8 }}>
          Verification Failed
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0, maxWidth: 420, marginInline: "auto" }}>
          {error}
        </p>
      </div>

      <div style={{
        padding: "16px 24px", borderRadius: 16,
        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <AlertCircle size={18} color="#f87171" />
        <span style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>
          This document could not be found or the QR code is invalid.
        </span>
      </div>

      <button
        onClick={onScanAgain}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 12, cursor: "pointer",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e", fontSize: 13, fontWeight: 700,
        }}
      >
        <Camera size={15} /> Scan Again
      </button>
    </div>
  );
}
