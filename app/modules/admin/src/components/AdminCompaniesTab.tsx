import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Input as HuntrInput } from "~/shared/ui/Fields";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import React, { useEffect, useState } from "react";
import { AlertCircle, Building2, Eye, Loader2, Search, Settings, X } from "lucide-react";
import { adminGetCompanies } from "../../lib/api";
import AuditModal from "./AuditModal";
import { thStyle, tdStyle, buildPageList, getImageUrl } from "./shared";
import type { Company } from "./shared";
import { STATUS_META, STAT_CARDS } from "./CompanyStatus";
import CompanyViewModal from "./CompanyViewModal";
import GlobalSubscriptionSettingsModal from "./CompanyLegacySettings";

/* ─── Main Tab ────────────────────────────────────────────────────── */
export default function AdminCompaniesTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "starter" | "pending" | "approved" | "rejected">("all");
  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  const [auditModal, setAuditModal] = useState<{ company: Company; action: "approve" | "decline" | "request_docs" } | null>(null);
  const [showGlobalSubscriptionModal, setShowGlobalSubscriptionModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ starter: 0, pending: 0, approved: 0, rejected: 0, total: 0 });

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

  const openAuditFromView = (action: "approve" | "decline" | "request_docs") => {
    if (!viewCompany) return;
    setAuditModal({ company: viewCompany, action });
    setViewCompany(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {STAT_CARDS.map((card) => (
          <HuntrSurface
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
          </HuntrSurface>
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
          <HuntrInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau NPWP…"
            style={{ background: "none", border: "none", outline: "none", color: "var(--ui-text-primary)", width: "100%", fontSize: 13 }}
          />
          {search && (
            <HuntrButton onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)", padding: 0, display: "flex" }}>
              <X size={13} />
            </HuntrButton>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "starter", "pending", "approved", "rejected"] as const).map((s) => (
            <HuntrButton
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
            </HuntrButton>
          ))}
        </div>

        <HuntrButton
          onClick={() => setShowGlobalSubscriptionModal(true)}
          style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15))",
            border: "1px solid rgba(245,158,11,0.35)",
            color: "#f59e0b",
            display: "flex", alignItems: "center", gap: 6,
          }}
          title="Pengaturan tarif dan migrasi skema lama"
        >
          <Settings size={13} />
          Hak & Skema Langganan Global
        </HuntrButton>
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
      <HuntrSurface style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 56, display: "flex", justifyContent: "center" }}>
            <Loader2 className="animate-spin" size={28} style={{ color: "var(--ui-primary)" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <HuntrTable style={{ width: "100%", borderCollapse: "collapse" }}>
              <HuntrTableHead>
                <HuntrTableRow>
                  <HuntrTableHeaderCell style={{ ...thStyle, width: 44 }}></HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>COMPANY</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>TYPE</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>CONTACT</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>NPWP</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>LOCATION</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>STATUS</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={thStyle}>JOINED</HuntrTableHeaderCell>
                  <HuntrTableHeaderCell style={{ ...thStyle, textAlign: "center", width: 80 }}>ACTION</HuntrTableHeaderCell>
                </HuntrTableRow>
              </HuntrTableHead>
              <HuntrTableBody>
                {companies.length === 0 ? (
                  <HuntrTableRow>
                    <HuntrTableCell colSpan={9} style={{ ...tdStyle, textAlign: "center", padding: "48px 20px", color: "var(--ui-text-muted)" }}>
                      No companies found
                    </HuntrTableCell>
                  </HuntrTableRow>
                ) : companies.map((company) => {
                  const sm = STATUS_META[company.status] ?? STATUS_META.pending;
                  const logoDoc = company.documents?.find((d) => d.type === "logo");
                  return (
                    <HuntrTableRow
                      key={company.id}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Logo */}
                      <HuntrTableCell style={{ ...tdStyle, padding: "10px 12px" }}>
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
                      </HuntrTableCell>

                      {/* Company name */}
                      <HuntrTableCell style={{ ...tdStyle, maxWidth: 200 }}>
                        <div
                          style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }}
                          title={company.name}
                        >
                          {company.name}
                        </div>
                      </HuntrTableCell>

                      {/* Type */}
                      <HuntrTableCell style={tdStyle}>
                        <span
                          style={{
                            background: "var(--ui-primary-muted)", color: "var(--ui-primary)",
                            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                          }}
                        >
                          {company.type}
                        </span>
                      </HuntrTableCell>

                      {/* Contact */}
                      <HuntrTableCell style={{ ...tdStyle, color: "var(--ui-text-muted)", fontSize: 12 }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                          {company.email || "—"}
                        </div>
                        {company.phone && (
                          <div style={{ fontSize: 11, marginTop: 2, color: "var(--ui-text-muted)" }}>{company.phone}</div>
                        )}
                      </HuntrTableCell>

                      {/* NPWP */}
                      <HuntrTableCell style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>
                        {company.formatted_tax_id || company.tax_id || "—"}
                      </HuntrTableCell>

                      {/* Location */}
                      <HuntrTableCell style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>
                        {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                      </HuntrTableCell>

                      {/* Status */}
                      <HuntrTableCell style={tdStyle}>
                        <span
                          style={{
                            background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
                            padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                            display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
                          }}
                        >
                          {sm.icon} {sm.label}
                        </span>
                      </HuntrTableCell>

                      {/* Joined */}
                      <HuntrTableCell style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>
                        {company.created_at
                          ? new Date(company.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </HuntrTableCell>

                      {/* Action */}
                      <HuntrTableCell style={{ ...tdStyle, textAlign: "center" }}>
                        <HuntrButton
                          onClick={() => setViewCompany(company)}
                          style={{
                            padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            background: "var(--ui-primary-muted)", color: "var(--ui-primary)",
                            border: "1px solid var(--ui-primary-border)", transition: "all 0.15s",
                            display: "inline-flex", alignItems: "center", gap: 5,
                          }}
                        >
                          <Eye size={12} /> View
                        </HuntrButton>
                      </HuntrTableCell>
                    </HuntrTableRow>
                  );
                })}
              </HuntrTableBody>
            </HuntrTable>
          </div>
        )}
      </HuntrSurface>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
            Halaman {currentPage} dari {totalPages} · {total.toLocaleString()} perusahaan
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <HuntrButton
              onClick={() => fetchCompanies(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                background: currentPage === 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)",
                color: currentPage === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)",
              }}
            >← Prev</HuntrButton>

            {buildPageList(currentPage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`d-${i}`} style={{ padding: "0 4px", color: "var(--ui-text-muted)", fontSize: 12 }}>…</span>
              ) : (
                <HuntrButton
                  key={p}
                  onClick={() => fetchCompanies(p as number)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: currentPage === p ? "var(--ui-primary)" : "var(--ui-bg-card)",
                    color: currentPage === p ? "#fff" : "var(--ui-text-muted)",
                    border: currentPage === p ? "none" : "1px solid var(--ui-border)",
                  }}
                >{p}</HuntrButton>
              )
            )}

            <HuntrButton
              onClick={() => fetchCompanies(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                background: currentPage === totalPages ? "var(--ui-bg-input)" : "var(--ui-primary-muted)",
                color: currentPage === totalPages ? "var(--ui-text-muted)" : "var(--ui-primary)",
              }}
            >Next →</HuntrButton>
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
      {/* Global Subscription Settings Modal */}
      {showGlobalSubscriptionModal && (
        <GlobalSubscriptionSettingsModal
          isOpen={showGlobalSubscriptionModal}
          onClose={() => setShowGlobalSubscriptionModal(false)}
          onApplied={() => fetchCompanies(currentPage, search, filterStatus)}
        />
      )}
    </div>
  );
}
