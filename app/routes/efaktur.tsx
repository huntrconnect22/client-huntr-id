import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getFullApiUrl } from "../lib/client";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { Loader2, AlertCircle, FileText, ReceiptText, CheckCircle2, Download, RefreshCw, Trash2, Calendar, CircleDollarSign, Send } from "lucide-react";
import Swal from "sweetalert2";

interface EFaktur {
  id: string;
  bast_id: string;
  po_id: string;
  invoice_id?: string;
  nofa?: string;
  transaction_id?: string;
  status: string;
  no_invoice: string;
  masa_pajak: string;
  tahun_pajak: string;
  tanggal_faktur: string;
  dpp: number;
  ppn: number;
  created_at: string;
  purchase_order?: {
    po_number: string;
    total_amount: number;
  };
  bast?: {
    bast_number: string;
    bast_date: string;
  };
}

interface Bast {
  id: string;
  bast_number: string;
  bast_date: string;
  status: string;
  po_id: string;
  purchase_order?: {
    po_number: string;
  };
}

export default function EFakturPage() {
  const [company, setCompany] = useState<any>(null);
  const [efakturs, setEfakturs] = useState<EFaktur[]>([]);
  const [basts, setBasts] = useState<Bast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "ready">("list");
  
  // Signer loading/action states
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      setCompany(JSON.parse(activeComp));
    }
  }, []);

  useEffect(() => {
    if (company) {
      fetchData();
    }
  }, [company]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      // Fetch e-Fakturs
      const efResponse = await fetch(getFullApiUrl(`/api/efaktur?company_id=${company.id}`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Fetch BASTs to check completed ones (request large page to avoid pagination cutoff)
      const bastResponse = await fetch(getFullApiUrl(`/api/basts?company_id=${company.id}&per_page=100`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!efResponse.ok) throw new Error("Failed to load e-Faktur data");
      if (!bastResponse.ok) throw new Error("Failed to load BAST data");

      const efData = await efResponse.json();
      const bData = await bastResponse.json();

      setEfakturs(efData.data || efData || []);
      setBasts(bData.data || bData || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load page data");
    } finally {
      setLoading(false);
    }
  };

  // Filter completed BASTs that don't have e-Fakturs yet (case-insensitive status check)
  const readyBasts = basts.filter(bast => {
    const hasEFaktur = efakturs.some(ef => ef.bast_id === bast.id);
    return bast.status?.toLowerCase() === "completed" && !hasEFaktur;
  });

  const handleIssueEFaktur = async (bast: Bast) => {
    if (!company) return;
    
    // Prompt for signer info
    const { value: formValues } = await Swal.fire({
      title: "Terbitkan e-Faktur",
      html: `
        <div style="text-align: left; font-family: inherit;">
          <label style="display:block; margin-bottom: 6px; font-weight:600; font-size:12px; color:var(--ui-text-secondary);">Nama Penandatangan</label>
          <input id="swal-signer-name" class="swal2-input" style="margin-top:0; width:100%; box-sizing:border-box; border-radius:8px;" value="${company.owner_name || 'DIREKTUR'}">
          <label style="display:block; margin: 16px 0 6px; font-weight:600; font-size:12px; color:var(--ui-text-secondary);">Jabatan Penandatangan</label>
          <input id="swal-signer-jabatan" class="swal2-input" style="margin-top:0; width:100%; box-sizing:border-box; border-radius:8px;" value="DIREKTUR">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Terbitkan Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#f97316",
      preConfirm: () => {
        return {
          signer_name: (document.getElementById("swal-signer-name") as HTMLInputElement).value,
          signer_jabatan: (document.getElementById("swal-signer-jabatan") as HTMLInputElement).value,
        };
      }
    });

    if (!formValues) return;

    setIssuingId(bast.id);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) throw new Error("Auth token not found.");

      const response = await fetch(getFullApiUrl("/api/efaktur"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bast_id: bast.id,
          signer_name: formValues.signer_name,
          signer_jabatan: formValues.signer_jabatan,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to issue e-Faktur");
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `e-Faktur dengan nomor ${resData.efaktur?.nofa || "Simulasi"} berhasil diterbitkan via Pajak.io.`,
        confirmButtonColor: "#22c55e",
      });

      // Refresh data
      await fetchData();
      setActiveTab("list");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: err.message || "Gagal menerbitkan e-Faktur",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIssuingId(null);
    }
  };

  const handleRefreshStatus = async (efakturId: string) => {
    setRefreshingId(efakturId);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) throw new Error("Auth token not found.");

      const response = await fetch(getFullApiUrl(`/api/efaktur/${efakturId}`), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to refresh status");
      
      const resData = await response.json();
      
      // Update local state
      setEfakturs(prev => prev.map(ef => ef.id === efakturId ? { ...ef, ...resData.efaktur } : ef));
      
      Swal.fire({
        icon: "success",
        title: "Status Diperbarui",
        text: `Status Faktur Pajak: ${resData.efaktur?.status || "CREATED"}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: err.message || "Gagal memperbarui status",
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDownloadPdf = async (efaktur: EFaktur) => {
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) throw new Error("Auth token not found.");

      Swal.fire({
        title: "Mengunduh PDF...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(getFullApiUrl(`/api/efaktur/${efaktur.id}/pdf`), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      Swal.close();

      if (!response.ok || !resData.pdf) {
        throw new Error(resData.message || "Failed to generate PDF");
      }

      // If PDF has url or base64
      const pdfData = resData.pdf;
      if (pdfData.data?.pdfUrl || pdfData.pdfUrl) {
        window.open(pdfData.data?.pdfUrl || pdfData.pdfUrl, "_blank");
      } else if (pdfData.data?.base64 || pdfData.base64) {
        const base64Str = pdfData.data?.base64 || pdfData.base64;
        const cleanBase64 = base64Str.startsWith("data:application/pdf;base64,")
          ? base64Str
          : `data:application/pdf;base64,${base64Str}`;
        const win = window.open();
        if (win) {
          win.document.write(`<iframe src="${cleanBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          // Download fallback
          const link = document.createElement("a");
          link.href = cleanBase64;
          link.download = `e-Faktur-${efaktur.nofa || efaktur.id}.pdf`;
          link.click();
        }
      } else {
        throw new Error("No PDF link or base64 stream returned.");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: err.message || "Gagal mendapatkan PDF e-Faktur",
      });
    }
  };

  const handleCancelEFaktur = async (efakturId: string) => {
    const result = await Swal.fire({
      title: "Batalkan e-Faktur?",
      text: "Tindakan ini akan membatalkan Faktur Pajak ini di Pajak.io sandbox.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    setCancellingId(efakturId);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) throw new Error("Auth token not found.");

      const response = await fetch(getFullApiUrl(`/api/efaktur/${efakturId}/cancel`), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Failed to cancel e-Faktur");
      }

      Swal.fire({
        icon: "success",
        title: "Dibatalkan!",
        text: "e-Faktur berhasil dibatalkan.",
        confirmButtonColor: "#22c55e",
      });

      await fetchData();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: err.message || "Gagal membatalkan e-Faktur",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === "APPROVED" || normalized === "SUCCESS") {
      return { bg: "rgba(34,197,94,0.1)", text: "#22c55e" };
    }
    if (normalized === "CANCELLED" || normalized === "BATAL") {
      return { bg: "rgba(239,68,68,0.1)", text: "#ef4444" };
    }
    return { bg: "rgba(249,115,22,0.1)", text: "#f97316" };
  };

  // Stats computation
  const totalDpp = efakturs.reduce((acc, curr) => curr.status.toUpperCase() !== "CANCELLED" ? acc + Number(curr.dpp) : acc, 0);
  const totalPpn = efakturs.reduce((acc, curr) => curr.status.toUpperCase() !== "CANCELLED" ? acc + Number(curr.ppn) : acc, 0);

  if (isModuleDisabledInDemo("efaktur")) {
    return <DemoDisabledBanner module="efaktur" />;
  }

  return (
    <Layout title="e-Faktur Pajak.io" subtitle="Penerbitan & Pengelolaan Faktur Pajak Terintegrasi">
      <div style={{ width: "100%" }}>
        
        {error && (
          <div style={{
            padding: 16, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 10
          }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
          
          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border-input)", borderRadius: 24, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(249,115,22,0.1)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ReceiptText size={26} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total e-Faktur</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--ui-text-primary)" }}>{efakturs.length}</div>
            </div>
          </div>

          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border-input)", borderRadius: 24, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircleDollarSign size={26} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total DPP Pajak</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ui-text-primary)" }}>IDR {totalDpp.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border-input)", borderRadius: 24, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={26} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>BAST Siap Faktur</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--ui-text-primary)" }}>{readyBasts.length}</div>
            </div>
          </div>

        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--ui-border-subtle)", gap: 24, marginBottom: 28 }}>
          <button
            onClick={() => setActiveTab("list")}
            style={{
              padding: "12px 4px", fontSize: 15, fontWeight: 800, border: "none", background: "none",
              color: activeTab === "list" ? "var(--ui-text-logo)" : "var(--ui-text-muted)",
              borderBottom: activeTab === "list" ? "3px solid #f97316" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.15s"
            }}
          >
            Daftar e-Faktur ({efakturs.length})
          </button>
          <button
            onClick={() => setActiveTab("ready")}
            style={{
              padding: "12px 4px", fontSize: 15, fontWeight: 800, border: "none", background: "none",
              color: activeTab === "ready" ? "var(--ui-text-logo)" : "var(--ui-text-muted)",
              borderBottom: activeTab === "ready" ? "3px solid #f97316" : "3px solid transparent",
              cursor: "pointer", transition: "all 0.15s"
            }}
          >
            Siap Diterbitkan ({readyBasts.length})
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, color: "var(--ui-text-muted)" }}>
            <Loader2 size={36} className="animate-spin" style={{ marginBottom: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading data...</span>
          </div>
        ) : activeTab === "list" ? (
          
          /* TAB 1: E-FAKTUR LIST */
          efakturs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "var(--ui-bg-card)", borderRadius: 24, border: "1px dashed var(--ui-border-input)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ui-text-muted)" }}>
                <ReceiptText size={32} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 8px" }}>Belum Ada e-Faktur</h3>
              <p style={{ fontSize: 14, color: "var(--ui-text-muted)", margin: 0 }}>Silakan terbitkan e-Faktur dari tab "Siap Diterbitkan".</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {efakturs.map((ef) => {
                const statusColor = getStatusStyle(ef.status);
                return (
                  <div key={ef.id} style={{
                    background: "var(--ui-bg-card)", borderRadius: 24, border: "1px solid var(--ui-border-input)",
                    overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s"
                  }}>
                    <div style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 8, background: statusColor.bg, color: statusColor.text, fontSize: 10, fontWeight: 800 }}>
                            {ef.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                            NOFA: {ef.nofa || "PROSES DJP"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 6px" }}>
                          Invoice Ref: {ef.no_invoice}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ui-text-muted)", flexWrap: "wrap" }}>
                          <Calendar size={14} />
                          <span>Faktur: {ef.tanggal_faktur}</span>
                          <span>•</span>
                          <span>Masa/Tahun: {ef.masa_pajak}/{ef.tahun_pajak}</span>
                          {ef.bast && (
                            <>
                              <span>•</span>
                              <span>BAST: {ef.bast.bast_number}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Jumlah PPN</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ui-text-primary)", letterSpacing: "-0.5px" }}>
                          IDR {Number(ef.ppn).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ui-text-secondary)" }}>
                          DPP: IDR {Number(ef.dpp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "16px 24px", background: "var(--ui-bg-input)", borderTop: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>
                        TxID: {ef.transaction_id || "N/A"}
                      </div>
                      
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => handleRefreshStatus(ef.id)}
                          disabled={refreshingId === ef.id}
                          style={{
                            padding: "8px 14px", borderRadius: 10,
                            background: "var(--ui-bg-card)", color: "var(--ui-text-secondary)",
                            border: "1px solid var(--ui-border-input)", fontSize: 12, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                          }}
                        >
                          <RefreshCw size={14} className={refreshingId === ef.id ? "animate-spin" : ""} /> Perbarui Status
                        </button>
                        
                        <button
                          onClick={() => handleDownloadPdf(ef)}
                          style={{
                            padding: "8px 14px", borderRadius: 10,
                            background: "rgba(249,115,22,0.1)", color: "#f97316",
                            border: "none", fontSize: 12, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                          }}
                        >
                          <Download size={14} /> Unduh PDF
                        </button>

                        {ef.status.toUpperCase() !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancelEFaktur(ef.id)}
                            disabled={cancellingId === ef.id}
                            style={{
                              padding: "8px 14px", borderRadius: 10,
                              background: "rgba(239,68,68,0.1)", color: "#ef4444",
                              border: "none", fontSize: 12, fontWeight: 700,
                              cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                            }}
                          >
                            <Trash2 size={14} /> Batalkan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )

        ) : (
          
          /* TAB 2: READY TO ISSUE BASTS */
          readyBasts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "var(--ui-bg-card)", borderRadius: 24, border: "1px dashed var(--ui-border-input)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ui-text-muted)" }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 8px" }}>Semua BAST Sudah Diproses</h3>
              <p style={{ fontSize: 14, color: "var(--ui-text-muted)", margin: 0 }}>Tidak ada handover document pending yang belum dibuat e-Fakturnya.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {readyBasts.map((bast) => (
                <div key={bast.id} style={{
                  background: "var(--ui-bg-card)", borderRadius: 24, border: "1px solid var(--ui-border-input)",
                  padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        COMPLETED BAST
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                        {bast.bast_number}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 4px" }}>
                      PO Ref: {bast.purchase_order?.po_number || "N/A"}
                    </h3>
                    <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>
                      Tanggal Handover: {bast.bast_date}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleIssueEFaktur(bast)}
                      disabled={issuingId === bast.id}
                      style={{
                        padding: "12px 24px", borderRadius: 14,
                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        color: "#fff", border: "none", fontSize: 13, fontWeight: 800,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        boxShadow: "0 8px 24px rgba(249,115,22,0.2)", transition: "all 0.2s"
                      }}
                    >
                      {issuingId === bast.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Menghubungi Pajak.io...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Terbitkan e-Faktur
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )

        )}

      </div>
    </Layout>
  );
}
