import React from "react";
import { CheckCircle2, Clock, User } from "lucide-react";
import type { SignatureEntry } from "../types";

export function SignatureCard({ sig }: { sig: SignatureEntry }) {
  return (
    <div style={{
      padding: "18px 20px", borderRadius: 16,
      background: sig.is_signed ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${sig.is_signed ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {sig.label}
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800,
          background: sig.is_signed ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
          color: sig.is_signed ? "#22c55e" : "rgba(255,255,255,0.3)",
          border: `1px solid ${sig.is_signed ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {sig.is_signed ? <CheckCircle2 size={10} /> : <Clock size={10} />}
          {sig.is_signed ? "SIGNED" : "PENDING"}
        </span>
      </div>

      {/* Signer info */}
      {sig.signer_name && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={15} color="rgba(255,255,255,0.4)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>{sig.signer_name}</div>
            {sig.signer_position && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                {sig.signer_position}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {sig.signed_at && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
          <Clock size={12} />
          {new Date(sig.signed_at).toLocaleString("en-US", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          })}
        </div>
      )}

      {!sig.is_signed && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
          Awaiting signature…
        </div>
      )}
    </div>
  );
}
