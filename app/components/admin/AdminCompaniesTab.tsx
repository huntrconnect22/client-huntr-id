import React, { useEffect, useState } from "react";
import {
  Building2, CheckCircle2, XCircle, Clock, FileText,
  Search, Loader2, X, Eye, AlertCircle, Table, Package, TrendingUp, FileSpreadsheet, ChevronLeft, ChevronRight
} from "lucide-react";
import { adminActivateCompanySubscription, adminGetCompanies, adminGetCompanyImports, adminGetCompanySubscription } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import AuditModal from "./AuditModal";
import { thStyle, tdStyle, buildPageList, getImageUrl, inp, lbl } from "./shared";
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

/* ─── Import Data Tab Component ───────────────────────────────────── */
function ImportDataTab({ companyId, companyType }: { companyId: string; companyType: string }) {
  const [importData, setImportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = async (p = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminGetCompanyImports(companyId, { page: p, per_page: perPage });
      setImportData(res);
      setPage(p);
    } catch (e: any) {
      setError(e.message || "Failed to load import data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(1); }, [companyId]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <div style={{ padding: 48, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Loader2 className="animate-spin" size={28} color="var(--ui-primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "12px 16px", background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, color: "var(--ui-status-rejected)",
      }}>
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (!importData) return null;

  const isBuyer = importData.type === "buyer";
  const summary = importData.summary ?? {};
  const rows: any[] = importData.data?.data ?? [];
  const totalPages: number = importData.data?.last_page ?? 1;
  const currentPage: number = importData.data?.current_page ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {isBuyer ? (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total PO</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>{summary.total_pos ?? 0}</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>Purchase Orders</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Line Items</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#3b82f6" }}>{(summary.total_items ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>Item baris</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Nominal</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#f59e0b", wordBreak: "break-all" }}>{fmt(summary.total_amount ?? 0)}</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>Estimasi nilai</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Produk</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>{(summary.total_items ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>Item katalog</div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Total Kategori</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#8b5cf6" }}>{summary.total_categories ?? 0}</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>Kategori unik</div>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div style={{
          padding: "32px 20px", textAlign: "center",
          border: "2px dashed var(--ui-border)", borderRadius: 10,
          color: "var(--ui-text-muted)", fontSize: 13,
        }}>
          <FileSpreadsheet size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.5 }} />
          Belum ada data yang diimport oleh perusahaan ini.
        </div>
      ) : (
        <>
          <div style={{ overflow: "hidden", border: "1px solid var(--ui-border)", borderRadius: 10 }}>
            <div style={{ overflowX: "auto", maxHeight: 360 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead style={{ background: "var(--ui-bg-inset)", position: "sticky", top: 0 }}>
                  <tr>
                    {isBuyer ? (
                      <>
                        <th style={{ ...thStyle, fontSize: 10 }}>PO Number</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Vendor</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Tanggal</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Department</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Currency</th>
                        <th style={{ ...thStyle, fontSize: 10, textAlign: "right" }}>Total</th>
                        <th style={{ ...thStyle, fontSize: 10, textAlign: "center" }}>Items</th>
                      </>
                    ) : (
                      <>
                        <th style={{ ...thStyle, fontSize: 10 }}>Item Code</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Nama Produk</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Kategori</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Brand</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>UOM</th>
                        <th style={{ ...thStyle, fontSize: 10 }}>Spesifikasi</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, idx: number) => (
                    <tr
                      key={row.id ?? idx}
                      style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {isBuyer ? (
                        <>
                          <td style={{ ...tdStyle, fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--ui-primary)" }}>{row.po_number || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.vendor_name || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12, whiteSpace: "nowrap", color: "var(--ui-text-muted)" }}>{row.order_date ? new Date(row.order_date).toLocaleDateString("id-ID") : "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)" }}>{row.department || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{row.currency || "IDR"}</td>
                          <td style={{ ...tdStyle, fontSize: 12, textAlign: "right", fontWeight: 700, color: "var(--ui-text-primary)", whiteSpace: "nowrap" }}>
                            {row.total_amount ? Number(row.total_amount).toLocaleString("id-ID") : "—"}
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12, textAlign: "center" }}>
                            <span style={{
                              background: "rgba(59,130,246,0.1)", color: "#3b82f6",
                              padding: "2px 8px", borderRadius: 6, fontWeight: 700,
                            }}>
                              {(row.historical_items ?? row.historical_items_count ?? row.items_count ?? 0)}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ ...tdStyle, fontSize: 12, fontFamily: "monospace", color: "var(--ui-primary)" }}>{row.item_code || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{row.name || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>
                            {row.category ? (
                              <span style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 8px", borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                                {row.category}
                              </span>
                            ) : "—"}
                          </td>
                          <td style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)" }}>{row.brand || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12 }}>{row.uom || "—"}</td>
                          <td style={{ ...tdStyle, fontSize: 12, color: "var(--ui-text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.specifications || "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: "10px 14px", borderTop: "1px solid var(--ui-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--ui-bg-inset)", fontSize: 12, color: "var(--ui-text-muted)",
              }}>
                <span>Halaman {currentPage} dari {totalPages}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => load(currentPage - 1)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "1px solid var(--ui-border)",
                      background: currentPage <= 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)",
                      color: currentPage <= 1 ? "var(--ui-text-muted)" : "var(--ui-primary)",
                      fontWeight: 700, cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 3,
                    }}
                  >
                    <ChevronLeft size={12} /> Prev
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => load(currentPage + 1)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, border: "1px solid var(--ui-border)",
                      background: currentPage >= totalPages ? "var(--ui-bg-input)" : "var(--ui-primary-muted)",
                      color: currentPage >= totalPages ? "var(--ui-text-muted)" : "var(--ui-primary)",
                      fontWeight: 700, cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 3,
                    }}
                  >
                    Next <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SubscriptionTab({ company }: { company: Company }) {
  const [subscription, setSubscription] = useState<any>(null);
  const [gmvLimit, setGmvLimit] = useState("");
  const [strategy, setStrategy] = useState<"transaction_fee" | "renewal_required">("transaction_fee");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminGetCompanySubscription(company.id);
      setSubscription(response?.subscription ?? null);
    } catch (error: any) {
      setMessage(error.message || "Gagal memuat subscription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [company.id]);

  const activate = async (event: React.FormEvent) => {
    event.preventDefault();
    const limit = Number(gmvLimit);
    if (!limit || !paymentVerified) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await adminActivateCompanySubscription(company.id, {
        gmv_limit: limit, overflow_strategy: strategy, payment_verified: true,
      });
      setSubscription(response.subscription);
      setGmvLimit("");
      setPaymentVerified(false);
      setMessage("Subscription aktif selama satu tahun.");
    } catch (error: any) {
      setMessage(error.message || "Aktivasi gagal.");
    } finally {
      setSaving(false);
    }
  };

  if (company.type !== "buyer") {
    return <div style={{ fontSize: 13, color: "var(--ui-text-muted)" }}>Subscription GMV hanya tersedia untuk perusahaan buyer.</div>;
  }
  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 28 }}><Loader2 className="animate-spin" size={22} /></div>;

  const format = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  return (
    <form onSubmit={activate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {subscription && (
        <div style={{ padding: 14, borderRadius: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 12 }}>
          <div style={{ fontWeight: 800, color: "#10b981", marginBottom: 7 }}>SUBSCRIPTION {subscription.status?.toUpperCase()}</div>
          <div>Realisasi: <b>{format(subscription.current_realized_gmv)}</b> dari {format(subscription.gmv_limit)}</div>
          <div style={{ marginTop: 3 }}>Sisa quota: <b>{format(subscription.available_gmv)}</b></div>
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--ui-text-muted)", lineHeight: 1.55 }}>Aktivasi baru menggantikan kontrak aktif sebelumnya. Biaya upfront otomatis dihitung 1,5% dari quota GMV dan berlaku selama 1 tahun.</div>
      <label style={lbl}>Quota GMV Tahunan (Rp)</label>
      <input value={gmvLimit} onChange={(event) => setGmvLimit(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Contoh: 1000000000" style={inp} required />
      {gmvLimit && <div style={{ fontSize: 12, color: "var(--ui-primary)", fontWeight: 700 }}>Upfront 1,5%: {format(Number(gmvLimit) * 0.015)}</div>}
      <label style={lbl}>Jika quota terlewati</label>
      <select value={strategy} onChange={(event) => setStrategy(event.target.value as typeof strategy)} style={inp}>
        <option value="transaction_fee">Kembali ke fee per transaksi (2–5%)</option>
        <option value="renewal_required">Tahan transaksi, wajib renewal</option>
      </select>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--ui-text-secondary)", cursor: "pointer" }}>
        <input type="checkbox" checked={paymentVerified} onChange={(event) => setPaymentVerified(event.target.checked)} />
        Saya telah memverifikasi pembayaran upfront dari perusahaan.
      </label>
      {message && <div style={{ fontSize: 12, color: message.includes("aktif") ? "#10b981" : "#ef4444" }}>{message}</div>}
      <button disabled={!paymentVerified || !gmvLimit || saving} style={{ padding: "10px 14px", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg,#f59e0b,#ea580c)", color: "#fff", opacity: !paymentVerified || !gmvLimit || saving ? 0.55 : 1 }}>
        {saving ? "Mengaktifkan…" : subscription ? "Renew / Ganti Subscription" : "Aktifkan Subscription"}
      </button>
    </form>
  );
}

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
    { key: "subscription" as const, label: "Subscription GMV", icon: <TrendingUp size={13} /> },
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
