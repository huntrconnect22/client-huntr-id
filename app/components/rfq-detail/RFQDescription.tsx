import React from "react";
import { User, Building2, ClipboardList, CheckCircle2, FileText } from "lucide-react";
import { useMediaQuery, MOBILE_BREAKPOINT } from "../../hooks/useMediaQuery";
import { getRfqDocumentUrl, getAssetUrl } from "../../lib/assets";

interface RFQDescriptionProps {
  rfq: any;
  successMessage: string | null;
}

export function RFQDescription({ rfq, successMessage }: RFQDescriptionProps) {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);
  const documentUrl = rfq?.document_url || (rfq?.document_path ? getAssetUrl(rfq.document_path) : null);

  return (
    <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "4px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 1 }}>Purchase Requisition</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-muted)" }}>#{rfq.id ? String(rfq.id).substring(0, 8).toUpperCase() : ""}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: "var(--ui-text-primary)", lineHeight: 1.2 }}>{rfq.title}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, padding: 12, background: "var(--ui-bg-input)", borderRadius: 12, border: "1px solid var(--ui-border-input)" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Requested By</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 15 }}>{rfq.user?.name || "Unknown User"}</div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>Procurement Officer</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Target Company</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 15 }}>{rfq.company?.name || "Unknown Company"}</div>
              <div style={{ fontSize: 11, color: "#34d399", fontWeight: 700 }}>VERIFIED ENTERPRISE</div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <ClipboardList size={18} color="#f59e0b" />
          <div style={{ fontWeight: 600, color: "var(--ui-text-primary)", fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>Project Requirements</div>
        </div>
        <div style={{ color: "var(--ui-text-secondary)", fontSize: 16, lineHeight: 1.8 }}>
          {rfq.description || "No detailed description provided for this request."}
        </div>

        {documentUrl && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "rgba(245, 158, 11, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f59e0b"
            }}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)" }}>Attached Document</div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>Supporting documentation for this request</div>
            </div>
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                background: "#f59e0b",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              View Document
            </a>
          </div>
        )}

        {successMessage && (
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: 8,
            padding: 12,
            color: "#10b981",
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 16,
            fontWeight: 700
          }}>
            <CheckCircle2 size={20} />
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
}