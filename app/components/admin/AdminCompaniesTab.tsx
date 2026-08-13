import React, { useEffect, useState } from "react";
import {
  Building2, CheckCircle2, XCircle, Clock, FileText,
  Search, Loader2, X, Eye, AlertCircle,
} from "lucide-react";
import { adminGetCompanies } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import AuditModal from "./AuditModal";
import { thStyle, tdStyle, buildPageList, getImageUrl } from "./shared";
import type { Company } from "./shared";

/* ─── Status meta ─────────────────────────────────────────────────── */
const STATUS_META = {
  pending: {
    color: "var(--ui-status-pending)",
    bg: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.22)",
    icon: <Clock size={11} />,
    label: "Pending",
  },
  approved: {
    color: "var(--ui-status-approved)",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.22)",
    icon: <CheckCircle2 size={11} />,
    label: "Approved",
  },
  rejected: {
    color: "var(--ui-status-rejected)",
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.22)",
    icon: <XCircle size={11} />,
    label: "Rejected",
  },
} as const;

const STAT_CARDS = [
  { key: "total" as const,    label: "Total",    gradient: "linear-gradient(135deg,#f59e0b,#ea580c)", icon: <Building2 size={18} /> },
  { key: "pending" as const,  label: "Pending",  gradient: "linear-gradient(135deg,#f59e0b,#d97706)", icon: <Clock size={18} /> },
  { key: "approved" as const, label: "Approved", gradient: "linear-gradient(135deg,#10b981,#059669)", icon: <CheckCircle2 size={18} /> },
  { key: "rejected" as const, label: "Rejected", gradient: "linear-gradient(135deg,#ef4444,#dc2626)", icon: <XCircle size={18} /> },
];

/* ─── Company View Modal ──────────────────────────────────────────── */
function CompanyViewModal({
  company,
  onClose,
  onAudit,
}: {
  company: Company;
  onClose: () => void;
  onAudit: (action: "approve" | "decline") => void;
}) {
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
          borderRadius: 16, width: "100%", maxWidth: 600,
          maxHeight: "90dvh", overflowY: "auto",
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

        {/* Modal body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>

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
        </div>

        {/* Modal footer — audit actions */}
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
      </div>
    </div>
  );
}

/* ─── Main Tab ────────────────────────────────────────────────────── */
export default function AdminCompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  const [auditModal, setAuditModal] = useState<{ company: Company; action: "approve" | "decline" } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const fetchCompanies = async (page = currentPage, s = search, status = filterStatus) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await adminGetCompanies({ page, per_page: perPage, search: s, status });
      setCompanies(res.data || []);
      setCurrentPage(res.current_page || 1);
      setTotalPages(res.last_page || 1);
      setTotal(res.total || 0);
      if (res.stats) setStats(res.stats);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load companies.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(1, search, filterStatus), 400);
    return () => clearTimeout(timer);
  }, [search, filterStatus]);

  const openAuditFromView = (action: "approve" | "decline") => {
    if (!viewCompany) return;
    setAuditModal({ company: viewCompany, action });
    setViewCompany(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            style={{
              background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
              borderRadius: 12, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "var(--ui-glass-shadow)",
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: card.gradient,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {React.cloneElement(card.icon as any, { color: "#fff" })}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, color: "var(--ui-text-primary)" }}>
                {card.key === "total" ? total : stats[card.key]}
              </div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: search + filter */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            flex: 1, minWidth: 220,
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
            borderRadius: 10, padding: "9px 14px",
          }}
        >
          <Search size={14} color="var(--ui-text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau NPWP…"
            style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 13 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 0, display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                background: filterStatus === s ? "var(--ui-primary-muted)" : "var(--ui-bg-input)",
                border: filterStatus === s ? "1px solid var(--ui-primary-border)" : "1px solid var(--ui-border-input)",
                color: filterStatus === s ? "var(--ui-primary)" : "var(--ui-text-muted)",
              }}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {fetchError && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "12px 16px", fontSize: 13,
            color: "var(--ui-status-rejected)", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <AlertCircle size={14} /> {fetchError}
        </div>
      )}

      {/* Table */}
      <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 56, display: "flex", justifyContent: "center" }}>
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--ui-primary)" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 44 }}></th>
                  <th style={thStyle}>COMPANY</th>
                  <th style={thStyle}>TYPE</th>
                  <th style={thStyle}>CONTACT</th>
                  <th style={thStyle}>NPWP</th>
                  <th style={thStyle}>LOCATION</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>JOINED</th>
                  <th style={{ ...thStyle, textAlign: "center", width: 80 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ ...tdStyle, textAlign: "center", padding: "48px 20px", color: "var(--ui-text-muted)" }}>
                      No companies found
                    </td>
                  </tr>
                ) : companies.map((company) => {
                  const sm = STATUS_META[company.status] ?? STATUS_META.pending;
                  const logoDoc = company.documents?.find((d) => d.type === "logo");
                  return (
                    <tr
                      key={company.id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Logo */}
                      <td style={{ ...tdStyle, padding: "10px 12px" }}>
                        {logoDoc ? (
                          <img
                            src={getImageUrl(logoDoc.url)}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", border: "1px solid var(--ui-border)", display: "block" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32, height: 32, borderRadius: 7,
                              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Building2 size={14} color="var(--ui-text-muted)" />
                          </div>
                        )}
                      </td>

                      {/* Company name */}
                      <td style={{ ...tdStyle, maxWidth: 200 }}>
                        <div
                          style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }}
                          title={company.name}
                        >
                          {company.name}
                        </div>
                      </td>

                      {/* Type */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: "var(--ui-primary-muted)", color: "var(--ui-primary)",
                            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                          }}
                        >
                          {company.type}
                        </span>
                      </td>

                      {/* Contact */}
                      <td style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                          {company.email || "—"}
                        </div>
                        {company.phone && (
                          <div style={{ fontSize: 11, marginTop: 2, color: "var(--ui-text-muted)" }}>{company.phone}</div>
                        )}
                      </td>

                      {/* NPWP */}
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>
                        {company.formatted_tax_id || company.tax_id || "—"}
                      </td>

                      {/* Location */}
                      <td style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>
                        {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                      </td>

                      {/* Status */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
                            padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                            display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                          }}
                        >
                          {sm.icon} {sm.label}
                        </span>
                      </td>

                      {/* Joined */}
                      <td style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>
                        {company.created_at
                          ? new Date(company.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>

                      {/* Action */}
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button
                          onClick={() => setViewCompany(company)}
                          style={{
                            padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            background: "var(--ui-primary-muted)", color: "var(--ui-primary)",
                            border: "1px solid var(--ui-primary-border)", transition: "all 0.15s",
                            display: "inline-flex", alignItems: "center", gap: 5,
                          }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
            Halaman {currentPage} dari {totalPages} · {total.toLocaleString()} perusahaan
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => fetchCompanies(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                background: currentPage === 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)",
                color: currentPage === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)",
              }}
            >← Prev</button>

            {buildPageList(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`d-${i}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12 }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => fetchCompanies(p as number)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: currentPage === p ? "var(--ui-primary)" : "var(--ui-bg-card)",
                    color: currentPage === p ? "#fff" : "var(--ui-text-muted)",
                    border: currentPage === p ? "none" : "1px solid var(--ui-border)",
                  }}
                >{p}</button>
              )
            )}

            <button
              onClick={() => fetchCompanies(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                background: currentPage === totalPages ? "var(--ui-bg-input)" : "var(--ui-primary-muted)",
                color: currentPage === totalPages ? "var(--ui-text-muted)" : "var(--ui-primary)",
              }}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Company view modal */}
      {viewCompany && (
        <CompanyViewModal
          company={viewCompany}
          onClose={() => setViewCompany(null)}
          onAudit={openAuditFromView}
        />
      )}

      {/* Audit modal (approve / decline) */}
      {auditModal && (
        <AuditModal
          company={auditModal.company}
          action={auditModal.action}
          onClose={() => setAuditModal(null)}
          onDone={() => { setAuditModal(null); fetchCompanies(); }}
        />
      )}
    </div>
  );
}
