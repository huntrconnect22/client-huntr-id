import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { apiGet } from "../lib/client";
import {
  issueEFaktur, getEFakturs, getEFaktur, uploadEFaktur,
  cancelEFaktur, deleteEFaktur, getVatInList, prepopulatedVatIn,
  uploadVatIn, verifyVatIn,
} from "../lib/api/efaktur";
import type { EFaktur, VatInItem, PrepopulatedItem, Bast } from "../lib/api/efaktur";
import {
  Loader2, AlertCircle, FileText, ReceiptText, CheckCircle2,
  RefreshCw, Trash2, Calendar, CircleDollarSign, Send,
  Upload, X, Search, ChevronDown, ArrowDownToLine,
} from "lucide-react";
import Swal from "sweetalert2";

/* ─── Status badge helper ────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() ?? "";
  let bg = "rgba(249,115,22,0.10)";
  let color = "var(--ui-primary)";
  let border = "var(--ui-primary-border)";
  if (s === "APPROVED") { bg = "rgba(34,197,94,0.10)"; color = "var(--ui-status-approved)"; border = "rgba(34,197,94,0.22)"; }
  if (s === "CANCELLED") { bg = "rgba(239,68,68,0.10)"; color = "var(--ui-status-rejected)"; border = "rgba(239,68,68,0.22)"; }
  if (s === "DRAFT") { bg = "rgba(148,163,184,0.12)"; color = "var(--ui-text-muted)"; border = "var(--ui-border)"; }
  return (
    <span style={{ padding: "3px 10px", borderRadius: 7, background: bg, color, border: `1px solid ${border}`, fontSize: 11, fontWeight: 700 }}>
      {s || "—"}
    </span>
  );
}

/* ─── Shared section header ──────────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)", marginBottom: 4 }}>
      {children}
    </div>
  );
}

/* ─── Tab button ─────────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "11px 4px", fontSize: 14, fontWeight: 800, border: "none", background: "none", cursor: "pointer",
      color: active ? "var(--ui-text-primary)" : "var(--ui-text-muted)",
      borderBottom: active ? "3px solid var(--ui-primary)" : "3px solid transparent",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

/* ─── Upload Modal (manual upload DRAFT → DJP) ───────────────────── */
function UploadModal({ efaktur, onClose, onDone }: {
  efaktur: EFaktur;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tempat, setTempat] = useState("Jakarta");
  const [npwkNik, setNpwkNik] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npwkNik.trim()) { setError("NPWP/NIK Penandatangan wajib diisi."); return; }
    setLoading(true); setError(null);
    try {
      await uploadEFaktur(efaktur.id, { tempat_penandatangan: tempat, npwp_nik_penandatangan: npwkNik });
      onDone();
    } catch (err: any) { setError(err.message || "Gagal upload ke DJP."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--ui-bg-overlay)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 16, width: "100%", maxWidth: 440, padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ui-text-primary)" }}>Upload ke DJP</div>
          <button onClick={onClose} style={{ background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)", borderRadius: 8, cursor: "pointer", color: "var(--ui-text-muted)", padding: "4px 6px", display: "flex" }}><X size={15} /></button>
        </div>
        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginBottom: 18, background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 8, padding: "8px 12px" }}>
          Faktur ID: <strong style={{ color: "var(--ui-text-primary)" }}>{efaktur.pajak_express_id}</strong>&nbsp;·&nbsp;Ref: <strong style={{ color: "var(--ui-text-primary)" }}>{efaktur.no_invoice}</strong>
        </div>
        {error && <div style={{ marginBottom: 14, padding: "9px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, color: "var(--ui-status-rejected)", display: "flex", gap: 7 }}><AlertCircle size={13} />{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Tempat Penandatangan</label>
            <input value={tempat} onChange={e => setTempat(e.target.value)} required style={{ width: "100%", padding: "10px 14px", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 9, fontSize: 13, color: "var(--ui-text-primary)", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>NPWP / NIK Penandatangan</label>
            <input value={npwkNik} onChange={e => setNpwkNik(e.target.value)} required placeholder="16 digit" style={{ width: "100%", padding: "10px 14px", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 9, fontSize: 13, color: "var(--ui-text-primary)", outline: "none", fontFamily: "monospace" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 9, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Batal</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: 9, background: "var(--ui-primary)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, minHeight: 44, opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {loading ? <><Loader2 size={14} className="animate-spin" />Mengupload…</> : <><Upload size={14} />Upload ke DJP</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── VAT OUT Tab ────────────────────────────────────────────────── */
function VatOutTab({ company }: { company: any }) {
  const [efakturs, setEfakturs] = useState<EFaktur[]>([]);
  const [basts, setBasts] = useState<Bast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "ready">("list");
  const [uploadTarget, setUploadTarget] = useState<EFaktur | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const [efRes, bastRes] = await Promise.all([
        getEFakturs(company.id, p, 15),
        apiGet<{ data: Bast[] }>(`/api/basts?company_id=${company.id}&per_page=100`),
      ]);
      setEfakturs(efRes.data || []);
      setLastPage(efRes.last_page || 1);
      setTotal(efRes.total || 0);
      setBasts(bastRes?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [company.id, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const readyBasts = basts.filter(b => b.status?.toLowerCase() === "completed" && !efakturs.some(ef => ef.bast_id === b.id));

  const handleIssue = async (bast: Bast) => {
    const { value } = await Swal.fire({
      title: "Terbitkan e-Faktur",
      html: `<div style="text-align:left">
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">Nama Penandatangan</label>
        <input id="s-name" class="swal2-input" style="margin:0 0 12px;box-sizing:border-box;width:100%" value="${company.owner_name || "DIREKTUR"}">
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">NPWP Penandatangan (16 digit)</label>
        <input id="s-npwp" class="swal2-input" style="margin:0 0 12px;box-sizing:border-box;width:100;font-family:monospace" placeholder="16 digit">
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">Kota Penandatangan</label>
        <input id="s-kota" class="swal2-input" style="margin:0;box-sizing:border-box;width:100%" value="Jakarta">
      </div>`,
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: "Terbitkan", cancelButtonText: "Batal", confirmButtonColor: "#f97316",
      preConfirm: () => ({
        signer_name: (document.getElementById("s-name") as HTMLInputElement).value,
        signer_npwp: (document.getElementById("s-npwp") as HTMLInputElement).value,
        signer_kota: (document.getElementById("s-kota") as HTMLInputElement).value,
      }),
    });
    if (!value) return;
    setIssuingId(bast.id);
    try {
      const res = await issueEFaktur({ bast_id: bast.id, ...value });
      Swal.fire({ icon: "success", title: "Berhasil!", text: `e-Faktur diterbitkan. NOFA: ${res.efaktur?.nofa || "Menunggu DJP"}`, confirmButtonColor: "#22c55e" });
      setActiveTab("list"); setPage(1); fetchData(1);
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setIssuingId(null); }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await getEFaktur(id);
      setEfakturs(prev => prev.map(ef => ef.id === id ? { ...ef, ...res.efaktur } : ef));
      Swal.fire({ icon: "success", title: "Status diperbarui", text: `Status: ${res.efaktur?.status}`, timer: 1500, showConfirmButton: false });
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setRefreshingId(null); }
  };

  const handleCancel = async (id: string) => {
    const ok = await Swal.fire({ title: "Batalkan e-Faktur?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Ya, Batalkan", cancelButtonText: "Batal" });
    if (!ok.isConfirmed) return;
    setCancellingId(id);
    try {
      await cancelEFaktur(id);
      Swal.fire({ icon: "success", title: "Dibatalkan!", timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setCancellingId(null); }
  };

  const handleDelete = async (id: string) => {
    const ok = await Swal.fire({ title: "Hapus draft ini?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal" });
    if (!ok.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteEFaktur(id);
      Swal.fire({ icon: "success", title: "Dihapus!", timer: 1200, showConfirmButton: false });
      fetchData();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setDeletingId(null); }
  };

  const totalDpp = efakturs.reduce((a, e) => !e.status?.toUpperCase().includes("CANCEL") ? a + Number(e.dpp) : a, 0);
  const totalPpn = efakturs.reduce((a, e) => !e.status?.toUpperCase().includes("CANCEL") ? a + Number(e.ppn) : a, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {[
          { label: "Total e-Faktur", value: total, icon: <ReceiptText size={22} />, color: "var(--ui-primary)", bg: "var(--ui-primary-muted)" },
          { label: "Total DPP", value: `IDR ${totalDpp.toLocaleString()}`, icon: <CircleDollarSign size={22} />, color: "var(--ui-status-approved)", bg: "rgba(34,197,94,0.1)" },
          { label: "Total PPN", value: `IDR ${totalPpn.toLocaleString()}`, icon: <FileText size={22} />, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
          { label: "BAST Siap Faktur", value: readyBasts.length, icon: <CheckCircle2 size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--ui-glass-shadow)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--ui-text-primary)", lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--ui-border)", gap: 24 }}>
        <TabBtn active={activeTab === "list"} onClick={() => setActiveTab("list")}>Daftar e-Faktur ({total})</TabBtn>
        <TabBtn active={activeTab === "ready"} onClick={() => setActiveTab("ready")}>Siap Diterbitkan ({readyBasts.length})</TabBtn>
      </div>

      {loading ? (
        <div style={{ padding: 48, display: "flex", justifyContent: "center" }}><Loader2 size={28} className="animate-spin" style={{ color: "var(--ui-primary)" }} /></div>
      ) : activeTab === "list" ? (
        efakturs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 14, color: "var(--ui-text-muted)" }}>
            <ReceiptText size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700 }}>Belum ada e-Faktur</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Terbitkan dari tab "Siap Diterbitkan".</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {efakturs.map(ef => (
              <div key={ef.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <StatusBadge status={ef.status} />
                      {ef.nofa && <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>NOFA: {ef.nofa}</span>}
                      {!ef.nofa && ef.pajak_express_id && <span style={{ fontSize: 11, color: "var(--ui-text-muted)", fontStyle: "italic" }}>Menunggu nomor dari DJP…</span>}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ui-text-primary)", marginBottom: 4 }}>{ef.no_invoice || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--ui-text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span><Calendar size={11} style={{ display: "inline", marginRight: 3 }} />{ef.tanggal_faktur || "—"}</span>
                      <span>Masa/Tahun: {ef.masa_pajak}/{ef.tahun_pajak}</span>
                      {ef.bast && <span>BAST: {ef.bast.bast_number}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, marginBottom: 3 }}>PPN</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "var(--ui-text-primary)" }}>IDR {Number(ef.ppn).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>DPP: IDR {Number(ef.dpp).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 18px", background: "var(--ui-bg-inset)", borderTop: "1px solid var(--ui-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>PE-ID: {ef.pajak_express_id || "—"}</span>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {ef.status?.toUpperCase() === "DRAFT" && (
                      <button onClick={() => setUploadTarget(ef)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(34,197,94,0.1)", color: "var(--ui-status-approved)", border: "1px solid rgba(34,197,94,0.22)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <Upload size={12} />Upload DJP
                      </button>
                    )}
                    <button onClick={() => handleRefresh(ef.id)} disabled={refreshingId === ef.id} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "var(--ui-bg-card)", color: "var(--ui-text-muted)", border: "1px solid var(--ui-border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <RefreshCw size={12} className={refreshingId === ef.id ? "animate-spin" : ""} />Refresh
                    </button>
                    {ef.status?.toUpperCase() !== "CANCELLED" && ef.nofa && (
                      <button onClick={() => handleCancel(ef.id)} disabled={cancellingId === ef.id} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "var(--ui-status-rejected)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <X size={12} />Cancel
                      </button>
                    )}
                    {ef.status?.toUpperCase() === "DRAFT" && (
                      <button onClick={() => handleDelete(ef.id)} disabled={deletingId === ef.id} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "var(--ui-status-rejected)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <Trash2 size={12} />Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {lastPage > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 4 }}>
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(page - 1); }} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === 1 ? "not-allowed" : "pointer", background: page === 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>← Prev</button>
                <span style={{ fontSize: 12, color: "var(--ui-text-muted)", lineHeight: "30px" }}>{page} / {lastPage}</span>
                <button onClick={() => { setPage(p => Math.min(lastPage, p + 1)); fetchData(page + 1); }} disabled={page === lastPage} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === lastPage ? "not-allowed" : "pointer", background: page === lastPage ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === lastPage ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>Next →</button>
              </div>
            )}
          </div>
        )
      ) : (
        readyBasts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 14, color: "var(--ui-text-muted)" }}>
            <CheckCircle2 size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700 }}>Semua BAST sudah diproses</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {readyBasts.map(bast => (
              <div key={bast.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(34,197,94,0.1)", color: "var(--ui-status-approved)", padding: "2px 9px", borderRadius: 6 }}>COMPLETED BAST</span>
                    <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>{bast.bast_number}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--ui-text-primary)" }}>PO: {bast.purchase_order?.po_number || "N/A"}</div>
                  <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 3 }}>Tanggal: {bast.bast_date}</div>
                </div>
                <button onClick={() => handleIssue(bast)} disabled={issuingId === bast.id} style={{ padding: "10px 20px", borderRadius: 9, background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 16px rgba(249,115,22,0.25)", minHeight: 44 }}>
                  {issuingId === bast.id ? <><Loader2 size={14} className="animate-spin" />Memproses…</> : <><Send size={14} />Terbitkan e-Faktur</>}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {uploadTarget && (
        <UploadModal efaktur={uploadTarget} onClose={() => setUploadTarget(null)} onDone={() => { setUploadTarget(null); fetchData(); Swal.fire({ icon: "success", title: "Berhasil diupload ke DJP!", timer: 1800, showConfirmButton: false }); }} />
      )}
    </div>
  );
}

/* ─── VAT IN Tab ─────────────────────────────────────────────────── */
function VatInTab() {
  const now = new Date();
  const [periode, setPeriode] = useState(`${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`);
  const [vatInList, setVatInList] = useState<VatInItem[]>([]);
  const [prepopList, setPrepopList] = useState<PrepopulatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [prepopLoading, setPrepopLoading] = useState(false);
  const [subTab, setSubTab] = useState<"list" | "prepopulated">("list");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Prepop filters
  const [ppTahun, setPpTahun] = useState(String(now.getFullYear()));
  const [ppMasa, setPpMasa] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [ppNpwp, setPpNpwp] = useState("");
  const [ppNofa, setPpNofa] = useState("");

  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getVatInList({ page: p, limit: 20, periode });
      setVatInList(res.data || []);
      setTotal(res.metaPage?.totalRow || 0);
      setLastPage(Math.ceil((res.metaPage?.totalRow || 0) / 20) || 1);
      setPage(p);
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setLoading(false); }
  }, [periode]);

  const fetchPrepop = async () => {
    setPrepopLoading(true);
    try {
      const res = await prepopulatedVatIn({ tahun_pajak: ppTahun, masa_pajak: ppMasa, npwp_penjual: ppNpwp, nomor_faktur: ppNofa });
      setPrepopList(res.data?.dataFaktur || []);
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setPrepopLoading(false); }
  };

  useEffect(() => { if (subTab === "list") fetchList(1); }, [subTab, fetchList]);

  const handleKredit = async (item: PrepopulatedItem) => {
    const masaPajak = item.TaxInvoiceDate ? String(new Date(item.TaxInvoiceDate).getMonth() + 1).padStart(2, "0") : ppMasa;
    const ok = await Swal.fire({ title: "Kreditkan Faktur Ini?", text: `No. Faktur: ${item.TaxInvoiceNumber}`, icon: "question", showCancelButton: true, confirmButtonText: "Ya, Kreditkan", cancelButtonText: "Batal", confirmButtonColor: "#f97316" });
    if (!ok.isConfirmed) return;
    try {
      await uploadVatIn({ nomor_faktur: item.TaxInvoiceNumber, masa_pajak: masaPajak, tahun_pajak: item.TaxInvoiceYear, konfirmasi_pengkreditan: 1 });
      Swal.fire({ icon: "success", title: "Berhasil dikreditkan!", timer: 1800, showConfirmButton: false });
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
  };

  const inputStyle: React.CSSProperties = { padding: "8px 12px", background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)", borderRadius: 8, fontSize: 12, color: "var(--ui-text-primary)", outline: "none", fontFamily: "monospace" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--ui-border)", gap: 20 }}>
        <TabBtn active={subTab === "list"} onClick={() => setSubTab("list")}>Daftar Faktur Masukan</TabBtn>
        <TabBtn active={subTab === "prepopulated"} onClick={() => setSubTab("prepopulated")}>Prepopulated DJP</TabBtn>
      </div>

      {subTab === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter periode */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 5, textTransform: "uppercase" }}>Periode (MM/YYYY)</div>
              <input value={periode} onChange={e => setPeriode(e.target.value)} placeholder="01/2025" style={{ ...inputStyle, width: 130 }} />
            </div>
            <button onClick={() => fetchList(1)} style={{ padding: "8px 18px", borderRadius: 8, background: "var(--ui-primary)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 36 }}>
              <Search size={13} />Tampilkan
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "var(--ui-primary)" }} /></div>
          ) : vatInList.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 12, color: "var(--ui-text-muted)" }}>
              <ArrowDownToLine size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
              <div style={{ fontWeight: 700 }}>Tidak ada faktur masukan</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Coba ubah filter periode.</div>
            </div>
          ) : (
            <>
              <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--ui-bg-inset)", borderBottom: "1px solid var(--ui-border)" }}>
                        {["No. Faktur", "Penjual", "Tgl Faktur", "DPP", "PPN", "Status", "Kredit"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vatInList.map(item => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--ui-border)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, color: "var(--ui-text-primary)", whiteSpace: "nowrap" }}>{item.nomorfaktur}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.namatokopenjual || item.npwppenjual}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>{item.tanggalfaktur ? new Date(item.tanggalfaktur).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-primary)", whiteSpace: "nowrap", fontWeight: 700 }}>Rp {Number(item.totaldpp).toLocaleString()}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-primary)", whiteSpace: "nowrap", fontWeight: 700 }}>Rp {Number(item.totalppn).toLocaleString()}</td>
                          <td style={{ padding: "11px 14px" }}><StatusBadge status={item.statusfaktur} /></td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: item.statuspembeli === "CREDITED" ? "rgba(34,197,94,0.1)" : "var(--ui-bg-input)", color: item.statuspembeli === "CREDITED" ? "var(--ui-status-approved)" : "var(--ui-text-muted)" }}>
                              {item.statuspembeli || item.buyerstatus || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {lastPage > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                  <button onClick={() => fetchList(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === 1 ? "not-allowed" : "pointer", background: page === 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>← Prev</button>
                  <span style={{ fontSize: 12, color: "var(--ui-text-muted)", lineHeight: "28px" }}>{page} / {lastPage} · {total.toLocaleString()} total</span>
                  <button onClick={() => fetchList(Math.min(lastPage, page + 1))} disabled={page === lastPage} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === lastPage ? "not-allowed" : "pointer", background: page === lastPage ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === lastPage ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Prepopulated DJP */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", padding: "14px 16px", background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 10 }}>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 5 }}>TAHUN PAJAK</div><input value={ppTahun} onChange={e => setPpTahun(e.target.value)} style={{ ...inputStyle, width: 90 }} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 5 }}>MASA PAJAK</div><input value={ppMasa} onChange={e => setPpMasa(e.target.value)} placeholder="09" style={{ ...inputStyle, width: 70 }} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 5 }}>NPWP PENJUAL (opt.)</div><input value={ppNpwp} onChange={e => setPpNpwp(e.target.value)} placeholder="0623907…" style={{ ...inputStyle, width: 160 }} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", marginBottom: 5 }}>NO. FAKTUR (opt.)</div><input value={ppNofa} onChange={e => setPpNofa(e.target.value)} style={{ ...inputStyle, width: 160 }} /></div>
            <button onClick={fetchPrepop} disabled={prepopLoading} style={{ padding: "8px 18px", borderRadius: 8, background: "var(--ui-primary)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 36 }}>
              {prepopLoading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}Inquiry DJP
            </button>
          </div>

          {prepopList.length > 0 && (
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--ui-bg-inset)", borderBottom: "1px solid var(--ui-border)" }}>
                      {["No. Faktur", "Penjual", "Tgl Faktur", "DPP", "PPN", "Status DJP", "Buyer Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prepopList.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--ui-border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>{item.TaxInvoiceNumber}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{item.SellerTaxpayerName}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>{new Date(item.TaxInvoiceDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700 }}>Rp {item.SellingPrice?.toLocaleString()}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-primary)", fontWeight: 700 }}>Rp {item.VAT?.toLocaleString()}</td>
                        <td style={{ padding: "11px 14px" }}><StatusBadge status={item.TaxInvoiceStatus} /></td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: item.BuyerStatus === "CREDITED" ? "rgba(34,197,94,0.1)" : "var(--ui-bg-input)", color: item.BuyerStatus === "CREDITED" ? "var(--ui-status-approved)" : "var(--ui-text-muted)" }}>
                            {item.BuyerStatus || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          {item.BuyerStatus !== "CREDITED" && (
                            <button onClick={() => handleKredit(item)} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "var(--ui-primary-muted)", color: "var(--ui-primary)", border: "1px solid var(--ui-primary-border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              <ArrowDownToLine size={11} />Kreditkan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function EFakturPage() {
  const [company, setCompany] = useState<any>(null);
  const [mainTab, setMainTab] = useState<"vat-out" | "vat-in">("vat-out");

  useEffect(() => {
    const stored = localStorage.getItem("active_company");
    if (stored) {
      try { setCompany(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  if (isModuleDisabledInDemo("efaktur")) {
    return <DemoDisabledBanner module="efaktur" />;
  }

  return (
    <Layout title="e-Faktur" subtitle="Faktur Pajak Keluaran & Masukan via PajakExpress">
      <div style={{ width: "100%" }}>
        {!company ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ui-text-muted)" }}>
            <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 700 }}>Pilih perusahaan terlebih dahulu</div>
          </div>
        ) : (
          <>
            {/* Main tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--ui-border)", gap: 28, marginBottom: 24 }}>
              <TabBtn active={mainTab === "vat-out"} onClick={() => setMainTab("vat-out")}>
                Pajak Keluaran (VAT Out)
              </TabBtn>
              <TabBtn active={mainTab === "vat-in"} onClick={() => setMainTab("vat-in")}>
                Pajak Masukan (VAT In)
              </TabBtn>
            </div>
            {mainTab === "vat-out" ? <VatOutTab company={company} /> : <VatInTab />}
          </>
        )}
      </div>
    </Layout>
  );
}
