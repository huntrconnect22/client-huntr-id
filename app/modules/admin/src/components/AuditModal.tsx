import { Button as HuntrButton } from "~/shared/ui/Button";
import { Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React, { useState } from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Loader2, Send } from "lucide-react";
import { adminAuditCompany } from "../../lib/api";
import { lbl } from "./shared";
import type { Company } from "./shared";

interface Props {
  company: Company;
  action: "approve" | "decline" | "request_docs";
  onClose: () => void;
  onDone: () => void;
}

export default function AuditModal({ company, action, onClose, onDone }: Props) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = action === "approve";
  const isRequestDocs = action === "request_docs";
  const accentColor = isApprove
    ? "var(--ui-status-approved)"
    : isRequestDocs
    ? "var(--ui-status-starter, #818cf8)"
    : "var(--ui-status-rejected)";
  const accentColorRaw = isApprove ? "#34d399" : isRequestDocs ? "#818cf8" : "#f87171";
  const accentBg = isApprove
    ? "rgba(52,211,153,0.10)"
    : isRequestDocs
    ? "rgba(129,140,248,0.10)"
    : "rgba(248,113,113,0.10)";

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await adminAuditCompany(company.id, { action, notes: notes || undefined });
      onDone();
    } catch (err: any) {
      setError(err.message || "Action failed.");
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--ui-bg-overlay)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--ui-glass-bg)",
          border: "1px solid var(--ui-glass-border)",
          borderRadius: 20,
          padding: "clamp(24px, 5vw, 32px)",
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--ui-glass-shadow)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          position: "relative",
          transition: "all 0.3s ease",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: "20px 20px 0 0",
            background: `linear-gradient(90deg,${accentColorRaw},${accentColorRaw}80)`,
          }}
        />

        {/* Close button */}
        <HuntrButton
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            cursor: "pointer",
            background: "var(--ui-bg-input)",
            border: "1px solid var(--ui-border-input)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ui-text-muted)",
            transition: "all 0.2s ease",
          }}
        >
          <X size={15} />
        </HuntrButton>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              flexShrink: 0,
              background: accentBg,
              border: `1px solid ${accentColorRaw}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isApprove ? (
              <CheckCircle2 size={24} color={accentColorRaw} />
            ) : isRequestDocs ? (
              <Send size={22} color={accentColorRaw} />
            ) : (
              <XCircle size={24} color={accentColorRaw} />
            )}
          </div>
          <div>
            <h3
              style={{
                fontSize: "clamp(15px, 3vw, 17px)",
                fontWeight: 800,
                color: "var(--ui-text-primary)",
                margin: 0,
                transition: "color 0.3s ease",
              }}
            >
              {isApprove ? "Approve Company" : isRequestDocs ? "Minta Dokumen Verifikasi" : "Decline Company"}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--ui-text-muted)",
                margin: "3px 0 0",
                transition: "color 0.3s ease",
              }}
            >
              {company.name}
            </p>
          </div>
        </div>

        {/* Notes textarea */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={lbl}>
            {isApprove
              ? "Approval Notes (optional)"
              : isRequestDocs
              ? "Catatan Permintaan Dokumen (optional)"
              : "Reason for Decline *"}
          </label>
          <HuntrTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isApprove
                ? "e.g. All documents verified, company approved."
                : isRequestDocs
                ? "e.g. Mohon lengkapi NIB / NPWP untuk verifikasi akun Full Access."
                : "e.g. Incomplete documents, NPWP not valid."
            }
            rows={4}
            style={{
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border-input)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--ui-text-primary)",
              outline: "none",
              width: "100%",
              resize: "none",
              fontFamily: "inherit",
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {isRequestDocs && (
          <div
            style={{
              background: "rgba(129,140,248,0.08)",
              border: "1px solid rgba(129,140,248,0.22)",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 11,
              color: "#818cf8",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Send size={13} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              <strong>Notifikasi Otomatis Terkirim:</strong> User ({company.type === "buyer" ? "Buyer" : "Vendor"}) akan langsung menerima notifikasi di dalam aplikasi, WhatsApp, dan Email untuk segera mengunggah dokumen legalitas via tab Legal Docs.
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 12,
              color: "var(--ui-status-rejected)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 4,
            flexWrap: "wrap",
          }}
        >
          <HuntrButton
            onClick={onClose}
            style={{
              flex: 1,
              minWidth: 100,
              padding: "11px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border-input)",
              color: "var(--ui-text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
              minHeight: 44,
            }}
          >
            Cancel
          </HuntrButton>
          <HuntrButton
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              flex: 2,
              minWidth: 120,
              padding: "11px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              background: isApprove
                ? "linear-gradient(135deg,#10b981,#059669)"
                : isRequestDocs
                ? "linear-gradient(135deg,#818cf8,#6366f1)"
                : "linear-gradient(135deg,#ef4444,#dc2626)",
              border: "none",
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isLoading ? 0.75 : 1,
              boxShadow: isLoading ? "none" : `0 4px 16px ${accentColorRaw}30`,
              transition: "all 0.2s",
              minHeight: 44,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Processing…
              </>
            ) : (
              <>
                {isApprove ? (
                  <CheckCircle2 size={14} />
                ) : isRequestDocs ? (
                  <Send size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                {isApprove
                  ? "Approve Company"
                  : isRequestDocs
                  ? "Kirim Permintaan Dokumen"
                  : "Decline Registration"}
              </>
            )}
          </HuntrButton>
        </div>
      </div>
    </div>
  );
}
