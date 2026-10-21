import React, { useState } from "react";
import { Building2, CheckCircle2, FileText, Table, TrendingUp, X, XCircle, Sparkles, Send } from "lucide-react";
import { getAssetUrl } from "../../lib/assets";
import { getImageUrl } from "./shared";
import type { Company } from "./shared";
import { STATUS_META } from "./CompanyStatus";
import ImportDataTab from "./CompanyImportTab";
import SubscriptionTab from "./CompanySubscriptionTab";

/* ─── Company View Modal ──────────────────────────────────────────── */
export default function CompanyViewModal({
  company,
  onClose,
  onAudit,
}: {
  company: Company;
  onClose: () => void;
  onAudit: (action: "approve" | "decline" | "request_docs") => void;
}) {
  const [activeTab, setActiveTab] = useState<"details" | "imports" | "subscription">("details");
  const sm = STATUS_META[company.status] ?? STATUS_META.pending;
  const logoDoc = company.documents?.find((d) => d.type === "logo");
  const otherDocs = company.documents?.filter((d) => d.type !== "logo") ?? [];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <div
        style={{
          fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)",
          letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: 10, paddingBottom: 6,
          borderBottom: "1px solid var(--ui-border)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
      <span style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: value ? "var(--ui-text-primary)" : "var(--ui-text-muted)", fontWeight: value ? 500 : 400 }}>
        {value || "—"}
      </span>
    </div>
  );

  const TABS = [
    { key: "details" as const, label: "Detail Perusahaan", icon: <Building2 size={13} /> },
    { key: "imports" as const, label: "Data Import", icon: <Table size={13} /> },
    { key: "subscription" as const, label: "Paket Enterprise", icon: <TrendingUp size={13} /> },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "var(--ui-bg-overlay)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
          borderRadius: 16, width: "100%", maxWidth: 680,
          maxHeight: "92dvh", overflowY: "auto",
          boxShadow: "var(--ui-glass-shadow)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "18px 20px", borderBottom: "1px solid var(--ui-border)",
            position: "sticky", top: 0, background: "var(--ui-bg-card)", zIndex: 1,
            borderRadius: "16px 16px 0 0",
          }}
        >
          {/* Logo */}
          {logoDoc ? (
            <img
              src={getImageUrl(logoDoc.url)}
              alt="Logo"
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid var(--ui-border)" }}
            />
          ) : (
            <div
              style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Building2 size={20} color="var(--ui-text-muted)" />
            </div>
          )}

          {/* Name + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ui-text-primary)", marginBottom: 4 }}>
              {company.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "var(--ui-primary-muted)", color: "var(--ui-primary)",
                  padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                }}
              >
                {company.type}
              </span>
              <span
                style={{
                  background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
                  padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {sm.icon} {sm.label}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 8,
              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ui-text-muted)", cursor: "pointer",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: "flex", gap: 4, padding: "12px 20px 0",
          borderBottom: "1px solid var(--ui-border)",
          background: "var(--ui-bg-card)", position: "sticky", top: 81, zIndex: 1,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: 700,
                fontSize: 12, cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
                border: "1px solid transparent",
                borderBottom: "none",
                background: activeTab === tab.key ? "var(--ui-bg-page)" : "transparent",
                color: activeTab === tab.key ? "var(--ui-primary)" : "var(--ui-text-muted)",
                borderColor: activeTab === tab.key ? "var(--ui-border)" : "transparent",
                marginBottom: activeTab === tab.key ? -1 : 0,
              }}
            >
              {tab.icon} {tab.label}
              {tab.key === "imports" && (
                <span style={{
                  background: "rgba(16,185,129,0.15)", color: "#10b981",
                  padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 800,
                }}>NEW</span>
              )}
            </button>
          ))}
        </div>

        {/* Modal body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {activeTab === "details" && (
            <>
              {/* Company Details */}
              <Section title="Company Details">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 20px" }}>
                  <Field label="Tax ID (NPWP)" value={company.formatted_tax_id || company.tax_id} />
                  <Field label="Email" value={company.email} />
                  <Field label="Phone" value={company.phone} />
                  <Field label="Address" value={company.address} />
                  <Field label="City" value={company.city} />
                  <Field label="Region / Province" value={company.region} />
                  <Field label="Country" value={company.country} />
                  <Field
                    label="Joined"
                    value={company.created_at
                      ? new Date(company.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                      : undefined}
                  />
                </div>
              </Section>

              {/* Banking Info */}
              <Section title="Banking Information">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0 20px" }}>
                  <Field label="Bank Name" value={company.bank_name} />
                  <Field label="Account Number" value={company.bank_account} />
                  <Field label="Account Name" value={company.bank_account_name} />
                </div>
              </Section>

              {/* Documents */}
              <Section title="Documents">
                {otherDocs.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--ui-text-muted)" }}>No documents uploaded</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {otherDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={getAssetUrl(doc.url || doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                          background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
                          borderRadius: 8, textDecoration: "none", transition: "border-color 0.15s",
                        }}
                      >
                        <FileText size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", textTransform: "uppercase" }}>
                            {doc.type}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, flexShrink: 0 }}>
                          Open →
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </Section>

              {/* Verification notes */}
              {company.verification_notes && (
                <Section title="Verification Notes">
                  <div
                    style={{
                      fontSize: 13, color: "var(--ui-text-secondary)", lineHeight: 1.6,
                      padding: "10px 14px", background: "var(--ui-bg-inset)",
                      border: "1px solid var(--ui-border)", borderRadius: 8,
                    }}
                  >
                    {company.verification_notes}
                  </div>
                </Section>
              )}
            </>
          )}

          {activeTab === "imports" && (
            <ImportDataTab companyId={company.id} companyType={company.type} />
          )}

          {activeTab === "subscription" && <SubscriptionTab company={company} />}
        </div>

        {/* Modal footer — audit actions for PENDING companies */}
        {company.status === "pending" && (
          <div
            style={{
              padding: "14px 20px", borderTop: "1px solid var(--ui-border)",
              display: "flex", gap: 10, position: "sticky", bottom: 0,
              background: "var(--ui-bg-card)", borderRadius: "0 0 16px 16px",
            }}
          >
            <button
              onClick={() => onAudit("decline")}
              style={{
                flex: 1, padding: "11px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
                background: "rgba(239,68,68,0.08)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.22)", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <XCircle size={15} /> Decline
            </button>
            <button
              onClick={() => onAudit("approve")}
              style={{
                flex: 2, padding: "11px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
                background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff",
                border: "none", boxShadow: "0 4px 14px rgba(16,185,129,0.25)", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <CheckCircle2 size={15} /> Approve
            </button>
          </div>
        )}

        {/* Modal footer — for STARTER companies (no docs yet): request docs or approve directly */}
        {company.status === "starter" && (
          <div
            style={{
              padding: "14px 20px", borderTop: "1px solid var(--ui-border)",
              display: "flex", gap: 10, position: "sticky", bottom: 0,
              background: "var(--ui-bg-card)", borderRadius: "0 0 16px 16px",
            }}
          >
            <button
              onClick={() => onAudit("request_docs")}
              style={{
                flex: 1, padding: "11px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
                background: "rgba(129,140,248,0.10)", color: "#818cf8",
                border: "1px solid rgba(129,140,248,0.25)", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Send size={14} /> Minta Dokumen
            </button>
            <button
              onClick={() => onAudit("approve")}
              style={{
                flex: 2, padding: "11px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
                background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff",
                border: "none", boxShadow: "0 4px 14px rgba(16,185,129,0.25)", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <CheckCircle2 size={15} /> Approve Langsung
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

