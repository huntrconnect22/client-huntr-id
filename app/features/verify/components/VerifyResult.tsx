import React from "react";
import {
  ShieldCheck, Building, Calendar, Hash, Truck, ScanLine, FileText,
} from "lucide-react";
import type { VerifyResult as VerifyResultType } from "../types";
import { DOC_CONFIG } from "../types";
import { SignatureCard } from "./SignatureCard";

interface Props {
  result: VerifyResultType;
  onScanAnother: () => void;
}

export function VerifyResult({ result, onScanAnother }: Props) {
  const cfg       = DOC_CONFIG[result.doc_type] ?? DOC_CONFIG.invoice;
  const DocIcon   = cfg.icon;
  const allSigned = result.signatures.every(s => s.is_signed);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Validity Banner */}
      <div style={{
        padding: "28px 32px", borderRadius: 24, textAlign: "center",
        background: allSigned
          ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.06))"
          : "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.04))",
        border: `1px solid ${allSigned ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
        boxShadow: allSigned ? "0 8px 32px rgba(34,197,94,0.1)" : "none",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
          background: allSigned ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.12)",
          border: `2px solid ${allSigned ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 32px ${allSigned ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.15)"}`,
        }}>
          <ShieldCheck size={34} color={allSigned ? "#22c55e" : "#f59e0b"} />
        </div>

        <div style={{ fontSize: 24, fontWeight: 900, color: allSigned ? "#22c55e" : "#f59e0b", marginBottom: 6 }}>
          {allSigned ? "Document Verified ✓" : "Document Authentic — Partial Signatures"}
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
          {allSigned
            ? "All signatures are valid and this document is fully executed."
            : "This document is authentic but not all signatures are complete yet."}
        </div>

        <button
          onClick={onScanAnother}
          style={{
            marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 18px", borderRadius: 10, cursor: "pointer",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700,
          }}
        >
          <ScanLine size={13} /> Scan Another Document
        </button>
      </div>

      {/* Document Info */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: cfg.bg, border: `1px solid ${cfg.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <DocIcon size={22} color={cfg.color} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
              {result.doc_label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: cfg.color, letterSpacing: "-0.5px" }}>
              {result.doc_number}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { icon: Building, label: "Vendor",    value: result.vendor_name, color: "#f97316" },
            { icon: Building, label: "Buyer",     value: result.buyer_name,  color: "#3b82f6" },
            {
              icon: Calendar, label: "Issued At",
              value: result.issued_at
                ? new Date(result.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                : "—",
              color: "#8b5cf6",
            },
            ...(result.status         ? [{ icon: Hash,  label: "Status",       value: result.status.toUpperCase(),  color: "#06b6d4" }] : []),
            ...(result.tracking_number ? [{ icon: Truck, label: "Tracking No.", value: result.tracking_number,       color: "#22c55e" }] : []),
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              padding: "12px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={12} color={color} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: 24,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={16} color="#22c55e" />
          Signature Verification
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20,
            background: allSigned ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
            color: allSigned ? "#22c55e" : "#f59e0b",
            border: `1px solid ${allSigned ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
          }}>
            {result.signatures.filter(s => s.is_signed).length}/{result.signatures.length} signed
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {result.signatures.map((sig, i) => (
            <SignatureCard key={i} sig={sig} />
          ))}
        </div>
      </div>

      {/* Attestation */}
      <div style={{
        padding: "14px 20px", borderRadius: 14,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <ShieldCheck size={16} color="rgba(255,255,255,0.2)" />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
          Verified by <strong style={{ color: "rgba(255,255,255,0.5)" }}>huntr.id</strong> Procurement Platform · This verification is generated in real-time from our database.
        </span>
      </div>
    </div>
  );
}
