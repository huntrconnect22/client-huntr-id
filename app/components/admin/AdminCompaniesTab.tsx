import React, { useEffect, useState } from "react";
import {
  Building2, CheckCircle2, XCircle, Clock, FileText,
  Search, Loader2, X, Eye, AlertCircle, Table, Package, TrendingUp, FileSpreadsheet, ChevronLeft, ChevronRight,
  Settings, Calculator, RefreshCw, Layers, ShieldCheck, DollarSign, Percent, Check, Sparkles, HelpCircle
} from "lucide-react";
import {
  adminActivateCompanySubscription, adminGetCompanies, adminGetCompanyImports,
  adminGetCompanySubscription, adminUpdateCompanySubscriptionScheme,
  adminGetSubscriptionSettings, adminUpdateSubscriptionSettings, adminBulkApplySubscription
} from "../../lib/api";
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

/* ─── Global Subscription Settings Modal ────────────────────────────── */
function GlobalSubscriptionSettingsModal({
  isOpen,
  onClose,
  onApplied,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [allowAllMigration, setAllowAllMigration] = useState(true);
  const [defaultPlan, setDefaultPlan] = useState<"annual_upfront_po" | "saas_subscription" | "per_po">("annual_upfront_po");
  const [ppnPercent, setPpnPercent] = useState("11");
  const [pph23Percent, setPph23Percent] = useState("2");
  const [feePercent, setFeePercent] = useState("1.5");
  const [saasFee, setSaasFee] = useState("2500000");
  const [saasCycle, setSaasCycle] = useState<"monthly" | "annual">("monthly");
  const [perPoRate, setPerPoRate] = useState("2.0");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminGetSubscriptionSettings();
      if (res) {
        setAllowAllMigration(res.allow_all_migration ?? true);
        setDefaultPlan(res.default_plan ?? "annual_upfront_po");
        setPpnPercent(String(res.ppn_percent ?? 11));
        setPph23Percent(String(res.pph23_percent ?? 2));
        setFeePercent(String(res.fee_percent ?? 1.5));
        setSaasFee(String(res.saas_fee ?? 2500000));
        setSaasCycle(res.saas_cycle ?? "monthly");
        setPerPoRate(String(res.per_po_rate ?? 2.0));
      }
    } catch (e: any) {
      console.error("Gagal memuat setting global subscription:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await adminUpdateSubscriptionSettings({
        allow_all_migration: allowAllMigration,
        default_plan: defaultPlan,
        ppn_percent: Number(ppnPercent) || 0,
        pph23_percent: Number(pph23Percent) || 0,
        fee_percent: Number(feePercent) || 0,
        saas_fee: Number(saasFee) || 0,
        saas_cycle: saasCycle,
        per_po_rate: Number(perPoRate) || 0,
      });
      setMessage("Pengaturan tarif dan hak langganan global berhasil disimpan.");
    } catch (err: any) {
      setMessage(err.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkApply = async () => {
    const confirmText = `Apakah Anda yakin ingin menerapkan skema "${
      defaultPlan === "annual_upfront_po"
        ? "Annual Pembayaran di Muka (1 Tahun Historical PO)"
        : defaultPlan === "saas_subscription"
        ? "SaaS Subscription Flat"
        : "Per PO (Transaction Fee)"
    }" ke seluruh perusahaan Buyer?`;

    if (!window.confirm(confirmText)) return;

    setBulkApplying(true);
    setMessage(null);
    try {
      const res = await adminBulkApplySubscription({
        plan: defaultPlan,
        fee_percent: Number(feePercent) || 1.5,
        ppn_percent: Number(ppnPercent) || 11,
        pph23_percent: Number(pph23Percent) || 2,
        saas_fee: Number(saasFee) || 2500000,
        overflow_strategy: "transaction_fee",
      });
      setMessage(res.message || "Skema berhasil diterapkan ke seluruh perusahaan.");
      if (onApplied) onApplied();
    } catch (err: any) {
      setMessage(err.message || "Gagal menerapkan skema massal.");
    } finally {
      setBulkApplying(false);
    }
  };

  const fmtRupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "var(--ui-bg-overlay)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
          borderRadius: 16, width: "100%", maxWidth: 640,
          maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--ui-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: "var(--ui-text-primary)" }}>
              <Settings size={18} color="#f59e0b" />
              Pengaturan Skema & Hak Langganan Seluruh Company
            </div>
            <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>
              Konfigurasi dinamis tarif pajak (PPN, PPh 23), biaya, dan hak migrasi skema platform
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 36 }}>
              <Loader2 className="animate-spin" size={26} color="var(--ui-primary)" />
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Hak Akses & Migrasi Section */}
              <div style={{ padding: 14, borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={14} /> Hak Migrasi Seluruh Company
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--ui-text-primary)", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={allowAllMigration}
                    onChange={(e) => setAllowAllMigration(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  Berikan hak pada seluruh company untuk memilih / berpindah skema langganan
                </label>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", lineHeight: 1.5 }}>
                  Ketika diaktifkan, perusahaan memiliki hak untuk berpindah skema langganan (SaaS Subscripting, Per PO, atau Annual Upfront) sesuai kebijakan yang ditentukan.
                </div>
              </div>

              {/* Default Skema Platform */}
              <div>
                <label style={lbl}>Default Skema Langganan Platform</label>
                <select
                  value={defaultPlan}
                  onChange={(e) => setDefaultPlan(e.target.value as any)}
                  style={{ ...inp, marginTop: 4, width: "100%" }}
                >
                  <option value="annual_upfront_po">Annual Pembayaran di Muka (1 Tahun Historical PO)</option>
                  <option value="saas_subscription">SaaS Subscription (Biaya Tetap / Flat)</option>
                  <option value="per_po">Per PO (Pay-As-You-Go per Transaksi)</option>
                </select>
              </div>

              {/* Dynamic Rates Grid */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ui-text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Percent size={14} color="#10b981" /> Parameter Pajak & Biaya Dinamis
                </div>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginBottom: 12 }}>
                  Nilai tarif berikut dapat disesuaikan sewaktu-waktu. Perhitungan invoice dan kontrak akan otomatis menggunakan tarif ini tanpa perlu mengubah kode sumber.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={lbl}>Tarif PPN Platform (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={ppnPercent}
                      onChange={(e) => setPpnPercent(e.target.value)}
                      placeholder="11"
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                      required
                    />
                    <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 2 }}>Standar saat ini: 11% (atau 12% sesuai regulasi)</div>
                  </div>

                  <div>
                    <label style={lbl}>Tarif PPh 23 Jasa (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={pph23Percent}
                      onChange={(e) => setPph23Percent(e.target.value)}
                      placeholder="2"
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                      required
                    />
                    <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 2 }}>Standar PPh 23: 2% (pengurang tagihan)</div>
                  </div>

                  <div>
                    <label style={lbl}>Fee Annual Upfront PO (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={feePercent}
                      onChange={(e) => setFeePercent(e.target.value)}
                      placeholder="1.5"
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                      required
                    />
                    <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 2 }}>Default: 1.5% dari Kuota Historical PO</div>
                  </div>

                  <div>
                    <label style={lbl}>Fee Per PO Transaksi (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={perPoRate}
                      onChange={(e) => setPerPoRate(e.target.value)}
                      placeholder="2.0"
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                      required
                    />
                    <div style={{ fontSize: 10, color: "var(--ui-text-muted)", marginTop: 2 }}>Potongan platform per transaksi PO</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 12 }}>
                  <div>
                    <label style={lbl}>Biaya Flat SaaS Pokok (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={saasFee}
                      onChange={(e) => setSaasFee(e.target.value)}
                      placeholder="2500000"
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={lbl}>Siklus SaaS</label>
                    <select
                      value={saasCycle}
                      onChange={(e) => setSaasCycle(e.target.value as any)}
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                    >
                      <option value="monthly">Bulanan</option>
                      <option value="annual">Tahunan</option>
                    </select>
                  </div>
                </div>
              </div>

              {message && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, fontSize: 12,
                  background: message.includes("berhasil") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: message.includes("berhasil") ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
                  color: message.includes("berhasil") ? "#10b981" : "#ef4444",
                }}>
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={saving || bulkApplying}
                  style={{
                    flex: 1, padding: "11px 16px", borderRadius: 8, fontWeight: 800, fontSize: 13,
                    background: "linear-gradient(135deg,#f59e0b,#ea580c)", color: "#fff", border: "none",
                    cursor: "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Simpan Konfigurasi Global
                </button>

                <button
                  type="button"
                  onClick={handleBulkApply}
                  disabled={saving || bulkApplying}
                  style={{
                    padding: "11px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6",
                    cursor: "pointer", opacity: bulkApplying ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {bulkApplying ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
                  Terapkan ke Semua Buyer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Subscription Tab Component ──────────────────────────────────── */
function SubscriptionTab({ company }: { company: Company }) {
  const [subscription, setSubscription] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [historicalSummary, setHistoricalSummary] = useState<{ total_amount: number; total_pos: number }>({ total_amount: 0, total_pos: 0 });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Active form model: annual_upfront_po | saas_subscription | per_po
  const [selectedPlan, setSelectedPlan] = useState<"annual_upfront_po" | "saas_subscription" | "per_po">("annual_upfront_po");

  // Dynamic input fields
  const [gmvLimit, setGmvLimit] = useState("");
  const [feePercent, setFeePercent] = useState("1.5");
  const [ppnPercent, setPpnPercent] = useState("11");
  const [pph23Percent, setPph23Percent] = useState("2");
  const [saasFee, setSaasFee] = useState("2500000");
  const [saasCycle, setSaasCycle] = useState<"monthly" | "annual">("monthly");
  const [strategy, setStrategy] = useState<"transaction_fee" | "renewal_required">("transaction_fee");
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Simulation input for per PO
  const [simulatedPo, setSimulatedPo] = useState("100000000");

  const fmt = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await adminGetCompanySubscription(company.id);
      setSubscription(response?.subscription ?? null);
      if (response?.plan_details) setPlanDetails(response.plan_details);
      if (response?.global_settings) {
        setGlobalSettings(response.global_settings);
        setPpnPercent(String(response.global_settings.ppn_percent ?? 11));
        setPph23Percent(String(response.global_settings.pph23_percent ?? 2));
        setFeePercent(String(response.global_settings.fee_percent ?? 1.5));
        setSaasFee(String(response.global_settings.saas_fee ?? 2500000));
        setSaasCycle(response.global_settings.saas_cycle ?? "monthly");
      }
      if (response?.historical_summary) {
        setHistoricalSummary(response.historical_summary);
        if (response.historical_summary.total_amount > 0 && !gmvLimit) {
          setGmvLimit(String(Math.round(response.historical_summary.total_amount)));
        }
      }

      // Detect current plan
      if (response?.subscription?.plan) {
        const p = response.subscription.plan;
        if (p === "saas_subscription") setSelectedPlan("saas_subscription");
        else if (p === "per_po") setSelectedPlan("per_po");
        else setSelectedPlan("annual_upfront_po");
      }
    } catch (error: any) {
      setMessage(error.message || "Gagal memuat data subscription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [company.id]);

  if (company.type !== "buyer") {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--ui-text-muted)", fontSize: 13 }}>
        <AlertCircle size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
        Skema biaya langganan saat ini dikhususkan untuk perusahaan buyer.
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 36 }}>
        <Loader2 className="animate-spin" size={26} color="var(--ui-primary)" />
      </div>
    );
  }

  // Live calculations based on current inputs
  const numFeePercent = Number(feePercent) || 0;
  const numPpnPercent = Number(ppnPercent) || 0;
  const numPph23Percent = Number(pph23Percent) || 0;

  // 1. Annual Upfront Calculation
  const numGmvLimit = Number(gmvLimit) || 0;
  const annualGrossUpfront = Math.round(numGmvLimit * (numFeePercent / 100));
  const annualPpnAmount = Math.round(annualGrossUpfront * (numPpnPercent / 100));
  const annualPph23Amount = Math.round(annualGrossUpfront * (numPph23Percent / 100));
  const annualNetTotal = Math.round(annualGrossUpfront + annualPpnAmount - annualPph23Amount);

  // 2. SaaS Calculation
  const numSaasFee = Number(saasFee) || 0;
  const saasPpnAmount = Math.round(numSaasFee * (numPpnPercent / 100));
  const saasPph23Amount = Math.round(numSaasFee * (numPph23Percent / 100));
  const saasNetTotal = Math.round(numSaasFee + saasPpnAmount - saasPph23Amount);

  // 3. Per PO Simulation
  const numSimPo = Number(simulatedPo) || 0;
  const simGrossFee = Math.round(numSimPo * (numFeePercent / 100));
  const simPpnAmount = Math.round(simGrossFee * (numPpnPercent / 100));
  const simPph23Amount = Math.round(simGrossFee * (numPph23Percent / 100));
  const simAdminBank = 4400;
  const simTotalServiceFee = Math.round((simGrossFee + simPpnAmount) + simAdminBank - simPph23Amount);

  const handleApplyScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan !== "per_po" && !paymentVerified) {
      setMessage("Harap centang verifikasi pembayaran sebelum mengaktifkan skema.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {
        plan: selectedPlan,
        fee_percent: numFeePercent,
        ppn_percent: numPpnPercent,
        pph23_percent: numPph23Percent,
        overflow_strategy: strategy,
        payment_verified: paymentVerified,
      };

      if (selectedPlan === "annual_upfront_po") {
        payload.gmv_limit = numGmvLimit;
      } else if (selectedPlan === "saas_subscription") {
        payload.saas_fee = numSaasFee;
        payload.saas_cycle = saasCycle;
      }

      const res = await adminUpdateCompanySubscriptionScheme(company.id, payload);
      setSubscription(res.subscription);
      if (res.plan_details) setPlanDetails(res.plan_details);
      setPaymentVerified(false);
      setMessage("Skema langganan berhasil diterapkan untuk perusahaan ini.");
    } catch (err: any) {
      setMessage(err.message || "Gagal menerapkan skema langganan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Active Subscription Status Banner */}
      {subscription ? (
        <div style={{
          padding: 16, borderRadius: 12,
          background: subscription.status === "active" ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)",
          border: `1px solid ${subscription.status === "active" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
              background: subscription.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
              color: subscription.status === "active" ? "#10b981" : "#f59e0b",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              SKEMA AKTIF: {
                subscription.plan === "saas_subscription" ? "SaaS Subscripting Flat" :
                subscription.plan === "per_po" ? "Per PO (Transaction Fee)" :
                "Annual Pembayaran di Muka"
              }
            </span>
            <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>
              Status: <b style={{ textTransform: "capitalize", color: subscription.status === "active" ? "#10b981" : "#f59e0b" }}>{subscription.status}</b>
            </span>
          </div>

          {subscription.plan === "saas_subscription" ? (
            <div style={{ fontSize: 12, color: "var(--ui-text-primary)", lineHeight: 1.6 }}>
              <div>Biaya Langganan: <b>{fmt(subscription.upfront_fee)}</b> ({planDetails?.calculation?.saas_cycle === "annual" ? "Tahunan" : "Bulanan"})</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                ✓ Transaksi PO dibebaskan dari biaya platform fee.
              </div>
            </div>
          ) : subscription.plan === "per_po" ? (
            <div style={{ fontSize: 12, color: "var(--ui-text-primary)", lineHeight: 1.6 }}>
              <div>Skema: <b>Pay-As-You-Go</b> per transaksi PO dibuat.</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                ✓ Tidak ada biaya kuota di muka. Biaya dihitung per invoice transaksi.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--ui-text-primary)", lineHeight: 1.6 }}>
              <div>Realisasi GMV: <b>{fmt(subscription.current_realized_gmv)}</b> dari {fmt(subscription.gmv_limit)}</div>
              <div>Sisa Kuota GMV: <b style={{ color: "#10b981" }}>{fmt(subscription.available_gmv)}</b></div>
              {subscription.upfront_fee > 0 && (
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                  Upfront Fee Tercatat: <b>{fmt(subscription.upfront_fee)}</b>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          padding: 12, borderRadius: 10, background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.2)", fontSize: 12, color: "var(--ui-text-secondary)",
        }}>
          Perusahaan ini belum memiliki skema langganan aktif. Silakan tentukan skema langganan di bawah ini.
        </div>
      )}

      {/* 3 Model Perpindahan Biaya Langganan Selector */}
      <div>
        <label style={lbl}>Pilih Skema Biaya Langganan Perusahaan</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 8 }}>
          {/* Option 1: Annual Upfront PO */}
          <div
            onClick={() => {
              setSelectedPlan("annual_upfront_po");
              if (globalSettings?.fee_percent) setFeePercent(String(globalSettings.fee_percent));
            }}
            style={{
              padding: "12px 14px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
              border: selectedPlan === "annual_upfront_po" ? "2px solid #f59e0b" : "1px solid var(--ui-border)",
              background: selectedPlan === "annual_upfront_po" ? "rgba(245,158,11,0.08)" : "var(--ui-bg-input)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, color: selectedPlan === "annual_upfront_po" ? "#f59e0b" : "var(--ui-text-primary)" }}>
              <TrendingUp size={15} />
              Annual Upfront
            </div>
            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 4, lineHeight: 1.4 }}>
              Bayar di muka sesuai total historical PO 1 tahun. Bebas fee platform per transaksi.
            </div>
          </div>

          {/* Option 2: SaaS Subscription */}
          <div
            onClick={() => {
              setSelectedPlan("saas_subscription");
            }}
            style={{
              padding: "12px 14px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
              border: selectedPlan === "saas_subscription" ? "2px solid #3b82f6" : "1px solid var(--ui-border)",
              background: selectedPlan === "saas_subscription" ? "rgba(59,130,246,0.08)" : "var(--ui-bg-input)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, color: selectedPlan === "saas_subscription" ? "#3b82f6" : "var(--ui-text-primary)" }}>
              <Sparkles size={15} />
              SaaS Flat Subscripting
            </div>
            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 4, lineHeight: 1.4 }}>
              Biaya tetap (flat fee) bulanan / tahunan. Transaksi PO tidak dipotong fee.
            </div>
          </div>

          {/* Option 3: Per PO */}
          <div
            onClick={() => {
              setSelectedPlan("per_po");
              if (globalSettings?.per_po_rate) setFeePercent(String(globalSettings.per_po_rate));
            }}
            style={{
              padding: "12px 14px", borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
              border: selectedPlan === "per_po" ? "2px solid #10b981" : "1px solid var(--ui-border)",
              background: selectedPlan === "per_po" ? "rgba(16,185,129,0.08)" : "var(--ui-bg-input)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 13, color: selectedPlan === "per_po" ? "#10b981" : "var(--ui-text-primary)" }}>
              <Calculator size={15} />
              Per PO (Pay-As-You-Go)
            </div>
            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 4, lineHeight: 1.4 }}>
              Tanpa biaya di muka. Dikenakan potongan biaya platform fee per transaksi PO.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleApplyScheme} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Dynamic Parameter Inputs for Model 1: Annual Upfront PO */}
        {selectedPlan === "annual_upfront_po" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Historical PO 1 Year Helper */}
            {historicalSummary.total_amount > 0 && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#10b981" }}>HISTORICAL PO 1 TAHUN TERDETEKSI</div>
                  <div style={{ fontSize: 12, color: "var(--ui-text-primary)", fontWeight: 600 }}>
                    {historicalSummary.total_pos} PO • Total Nominal: <b>{fmt(historicalSummary.total_amount)}</b>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGmvLimit(String(Math.round(historicalSummary.total_amount)))}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: "#10b981", color: "#fff", border: "none", cursor: "pointer",
                  }}
                >
                  Gunakan Total Historical Ini
                </button>
              </div>
            )}

            <div>
              <label style={lbl}>Kuota GMV Tahunan Dibayar di Muka (Rp)</label>
              <input
                value={gmvLimit}
                onChange={(e) => setGmvLimit(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="Contoh: 1000000000"
                style={{ ...inp, width: "100%", marginTop: 4 }}
                required
              />
            </div>

            {/* Tax and Fee Percentages */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Rate Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  placeholder="1.5"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>

              <div>
                <label style={lbl}>PPN (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={ppnPercent}
                  onChange={(e) => setPpnPercent(e.target.value)}
                  placeholder="11"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>

              <div>
                <label style={lbl}>PPh 23 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={pph23Percent}
                  onChange={(e) => setPph23Percent(e.target.value)}
                  placeholder="2"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={lbl}>Jika kuota GMV habis terlewati</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as typeof strategy)}
                style={{ ...inp, width: "100%", marginTop: 4 }}
              >
                <option value="transaction_fee">Kembali ke fee per transaksi PO</option>
                <option value="renewal_required">Tahan transaksi, wajib renewal kontrak</option>
              </select>
            </div>

            {/* Live Calculation Card */}
            {numGmvLimit > 0 && (
              <div style={{
                padding: 14, borderRadius: 10, background: "var(--ui-bg-input)",
                border: "1px solid var(--ui-border)", display: "flex", flexDirection: "column", gap: 6, fontSize: 12,
              }}>
                <div style={{ fontWeight: 800, color: "var(--ui-text-primary)", marginBottom: 4 }}>
                  RINCIAN PERHITUNGAN BIAYA DIMUKA:
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ui-text-muted)" }}>DPP Kuota GMV:</span>
                  <b>{fmt(numGmvLimit)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ui-text-muted)" }}>Upfront Fee ({numFeePercent}%):</span>
                  <b>{fmt(annualGrossUpfront)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#3b82f6" }}>
                  <span>PPN Platform (+{numPpnPercent}%):</span>
                  <b>+ {fmt(annualPpnAmount)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
                  <span>PPh 23 Potongan (-{numPph23Percent}%):</span>
                  <b>- {fmt(annualPph23Amount)}</b>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4,
                  borderTop: "1px solid var(--ui-border)", fontSize: 14, fontWeight: 900, color: "#f59e0b",
                }}>
                  <span>Total Tagihan Upfront Bersih:</span>
                  <span>{fmt(annualNetTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Parameter Inputs for Model 2: SaaS Subscription */}
        {selectedPlan === "saas_subscription" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Biaya Langganan Flat (Rp)</label>
                <input
                  value={saasFee}
                  onChange={(e) => setSaasFee(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="2500000"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>

              <div>
                <label style={lbl}>Siklus Tagihan</label>
                <select
                  value={saasCycle}
                  onChange={(e) => setSaasCycle(e.target.value as any)}
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                >
                  <option value="monthly">Bulanan</option>
                  <option value="annual">Tahunan</option>
                </select>
              </div>
            </div>

            {/* Taxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>PPN (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={ppnPercent}
                  onChange={(e) => setPpnPercent(e.target.value)}
                  placeholder="11"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>

              <div>
                <label style={lbl}>PPh 23 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={pph23Percent}
                  onChange={(e) => setPph23Percent(e.target.value)}
                  placeholder="2"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>
            </div>

            {/* Live Calculation Card */}
            {numSaasFee > 0 && (
              <div style={{
                padding: 14, borderRadius: 10, background: "var(--ui-bg-input)",
                border: "1px solid var(--ui-border)", display: "flex", flexDirection: "column", gap: 6, fontSize: 12,
              }}>
                <div style={{ fontWeight: 800, color: "var(--ui-text-primary)", marginBottom: 4 }}>
                  RINCIAN PERHITUNGAN SAAS SUBSCRIPTION ({saasCycle === "annual" ? "TAHUNAN" : "BULANAN"}):
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--ui-text-muted)" }}>Biaya Pokok SaaS:</span>
                  <b>{fmt(numSaasFee)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#3b82f6" }}>
                  <span>PPN Platform (+{numPpnPercent}%):</span>
                  <b>+ {fmt(saasPpnAmount)}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
                  <span>PPh 23 Potongan (-{numPph23Percent}%):</span>
                  <b>- {fmt(saasPph23Amount)}</b>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4,
                  borderTop: "1px solid var(--ui-border)", fontSize: 14, fontWeight: 900, color: "#3b82f6",
                }}>
                  <span>Total Tagihan SaaS Bersih:</span>
                  <span>{fmt(saasNetTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Parameter Inputs for Model 3: Per PO */}
        {selectedPlan === "per_po" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Platform Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  placeholder="2.0"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>

              <div>
                <label style={lbl}>PPN Platform (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={ppnPercent}
                  onChange={(e) => setPpnPercent(e.target.value)}
                  placeholder="11"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>

              <div>
                <label style={lbl}>PPh 23 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={pph23Percent}
                  onChange={(e) => setPph23Percent(e.target.value)}
                  placeholder="2"
                  style={{ ...inp, width: "100%", marginTop: 4 }}
                  required
                />
              </div>
            </div>

            {/* Simulation of PO calculation */}
            <div style={{
              padding: 14, borderRadius: 10, background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border)", display: "flex", flexDirection: "column", gap: 8, fontSize: 12,
            }}>
              <div style={{ fontWeight: 800, color: "var(--ui-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <Calculator size={14} color="#10b981" /> SIMULATOR BIAYA PER TRANSAKSI PO:
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--ui-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Contoh Nilai PO Transaksi (Rp)</label>
                <input
                  value={simulatedPo}
                  onChange={(e) => setSimulatedPo(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="100000000"
                  style={{ ...inp, width: "100%", marginTop: 2, padding: "6px 10px", fontSize: 12 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ui-text-muted)" }}>Platform Fee ({numFeePercent}%):</span>
                <b>{fmt(simGrossFee)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#3b82f6" }}>
                <span>PPN Platform (+{numPpnPercent}%):</span>
                <b>+ {fmt(simPpnAmount)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
                <span>PPh 23 Potongan (-{numPph23Percent}%):</span>
                <b>- {fmt(simPph23Amount)}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ui-text-muted)" }}>Admin Bank (Flat):</span>
                <b>+ {fmt(simAdminBank)}</b>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", paddingTop: 6, marginTop: 2,
                borderTop: "1px solid var(--ui-border)", fontSize: 13, fontWeight: 900, color: "#10b981",
              }}>
                <span>Total Biaya Layanan Invoice:</span>
                <span>{fmt(simTotalServiceFee)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Verification Checkbox */}
        {selectedPlan !== "per_po" && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--ui-text-secondary)", cursor: "pointer", marginTop: 4 }}>
            <input
              type="checkbox"
              checked={paymentVerified}
              onChange={(e) => setPaymentVerified(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            Saya telah memverifikasi pembayaran / kesepakatan kontrak dari perusahaan ini.
          </label>
        )}

        {message && (
          <div style={{
            fontSize: 12, padding: "10px 14px", borderRadius: 8,
            background: message.includes("berhasil") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: message.includes("berhasil") ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
            color: message.includes("berhasil") ? "#10b981" : "#ef4444",
          }}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || (selectedPlan !== "per_po" && !paymentVerified)}
          style={{
            padding: "12px 16px", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer",
            background: selectedPlan === "saas_subscription" ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" :
                        selectedPlan === "per_po" ? "linear-gradient(135deg,#10b981,#059669)" :
                        "linear-gradient(135deg,#f59e0b,#ea580c)",
            color: "#fff",
            opacity: saving || (selectedPlan !== "per_po" && !paymentVerified) ? 0.55 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? "Menyimpan Skema…" : "Terapkan & Simpan Skema Langganan"}
        </button>
      </form>
    </div>
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
    { key: "subscription" as const, label: "Skema Langganan", icon: <TrendingUp size={13} /> },
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
  const [showGlobalSubscriptionModal, setShowGlobalSubscriptionModal] = useState(false);

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

        <button
          onClick={() => setShowGlobalSubscriptionModal(true)}
          style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.15))",
            border: "1px solid rgba(245,158,11,0.35)",
            color: "#f59e0b",
            display: "flex", alignItems: "center", gap: 6,
          }}
          title="Pengaturan tarif pajak dan hak migrasi langganan untuk seluruh perusahaan"
        >
          <Settings size={13} />
          Hak & Skema Langganan Global
        </button>
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
