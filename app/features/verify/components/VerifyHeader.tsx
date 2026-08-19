import React from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";

export function VerifyHeader() {
  return (
    <header style={{
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(15,23,42,0.85)",
      backdropFilter: "blur(20px)",
      position: "sticky", top: 0, zIndex: 100,
      padding: "16px 24px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
          }}>
            <ShieldCheck size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#f1f5f9" }}>huntr.id</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Document Verification
            </div>
          </div>
        </div>
        <a
          href="/login"
          style={{
            fontSize: 12, fontWeight: 700, color: "#fb923c",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            padding: "6px 14px", borderRadius: 10,
            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
          }}
        >
          Login <ExternalLink size={12} />
        </a>
      </div>
    </header>
  );
}
