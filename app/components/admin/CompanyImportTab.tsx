import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2 } from "lucide-react";
import { adminGetCompanyImports } from "../../lib/api";
import { thStyle, tdStyle } from "./shared";

/* ─── Import Data Tab Component ───────────────────────────────────── */
export default function ImportDataTab({ companyId, companyType }: { companyId: string; companyType: string }) {
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

