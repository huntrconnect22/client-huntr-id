import React, { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { apiGet } from "../lib/client";
import {
  issueEFaktur, getEFakturs, getEFaktur, uploadEFaktur,
  cancelEFaktur, deleteEFaktur, getVatInList, prepopulatedVatIn, uploadVatIn,
  getEFakturReferences, getBastItems,
} from "../lib/api/efaktur";
import type { EFaktur, VatInItem, PrepopulatedItem, Bast, BastItem, ItemOverride } from "../lib/api/efaktur";
import {
  Loader2, AlertCircle, ReceiptText, CheckCircle2, RefreshCw,
  Trash2, Send, Upload, X, Search, ArrowDownToLine,
  FileCheck2, FileX2, FileClock, Building2, Calendar,
  TrendingUp, ChevronRight, Info, ChevronDown,
} from "lucide-react";
import Swal from "sweetalert2";

/* ─── shared field style ────────────────────────────────────────── */
const field: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--ui-bg-input)", border: "1px solid var(--ui-border-input)",
  borderRadius: 9, fontSize: 14, color: "var(--ui-text-primary)",
  outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s",
};
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)",
  textTransform: "uppercase", letterSpacing: "0.07em",
  display: "block", marginBottom: 6,
};

/* ─── StatusBadge ─────────────────────────────────────────────────── */
function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "").toUpperCase();
  const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
    APPROVED: { bg: "rgba(34,197,94,0.10)", color: "var(--ui-status-approved)", border: "rgba(34,197,94,0.25)", label: "Approved" },
    CANCELLED: { bg: "rgba(239,68,68,0.10)", color: "var(--ui-status-rejected)", border: "rgba(239,68,68,0.25)", label: "Cancelled" },
    DRAFT: { bg: "var(--ui-bg-inset)", color: "var(--ui-text-muted)", border: "var(--ui-border)", label: "Draft" },
    CREDITED: { bg: "rgba(34,197,94,0.10)", color: "var(--ui-status-approved)", border: "rgba(34,197,94,0.25)", label: "Credited" },
  };
  const cfg = map[s] ?? { bg: "var(--ui-primary-muted)", color: "var(--ui-primary)", border: "var(--ui-primary-border)", label: s || "—" };
  return (
    <span style={{ padding: "3px 9px", borderRadius: 7, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

/* ─── Tab button ─────────────────────────────────────────────────── */
function Tab({ active, onClick, children }: { active: boolean; onClick(): void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 0", fontSize: 14, fontWeight: 700, border: "none", background: "none", cursor: "pointer",
      color: active ? "var(--ui-text-primary)" : "var(--ui-text-muted)",
      borderBottom: active ? "2px solid var(--ui-primary)" : "2px solid transparent",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

/* ─── Modal wrapper ──────────────────────────────────────────────── */
function Modal({ onClose, children, maxWidth = 480 }: { onClose(): void; children: React.ReactNode; maxWidth?: number }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--ui-bg-overlay)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 16, width: "100%", maxWidth, maxHeight: "92dvh", overflowY: "auto", boxShadow: "var(--ui-glass-shadow)" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── ModalHeader ────────────────────────────────────────────────── */
function ModalHeader({ icon, title, subtitle, onClose }: { icon: React.ReactNode; title: string; subtitle?: string; onClose(): void }) {
  return (
    <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--ui-border)", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--ui-primary-muted)", color: "var(--ui-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ui-text-primary)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)", cursor: "pointer", color: "var(--ui-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── IssueModal — 2-step: pilih kode barang → isi signer → submit ─ */
function IssueModal({ bast, company, onClose, onDone }: {
  bast: Bast; company: any; onClose(): void; onDone(): void;
}) {
  // Step 1: load + configure items | Step 2: signer info
  const [step, setStep] = useState<1 | 2>(1);

  // Reference data
  const [goodsRef, setGoodsRef] = useState<{ code: string; bahasa: string }[]>([]);
  const [satuanRef, setSatuanRef] = useState<{ code: string; description: string }[]>([]);
  const [refsLoading, setRefsLoading] = useState(true);

  // PO items
  const [poItems, setPoItems] = useState<BastItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Per-item overrides (kd_brg + satuan)
  const [overrides, setOverrides] = useState<Record<string, { kd_brg: string; satuan: string; search: string }>>({});
  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Step 2 state
  const [signerName, setSignerName] = useState(company?.owner_name || "DIREKTUR");
  const [signerNpwp, setSignerNpwp] = useState("");
  const [signerKota, setSignerKota] = useState("Jakarta");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load references + items in parallel
  useEffect(() => {
    Promise.all([
      getEFakturReferences().catch(() => ({ goods: [], satuan: [] })),
      getBastItems(bast.id).catch(() => ({ po_number: "", items: [] })),
    ]).then(([refs, itemsRes]) => {
      setGoodsRef(refs.goods || []);
      setSatuanRef(refs.satuan || []);
      setRefsLoading(false);

      const items = itemsRes.items || [];
      setPoItems(items);
      setItemsLoading(false);

      // Init overrides with smart defaults (UOM → satuan code)
      const uomMap: Record<string, string> = {
        pc: "UM.0021", pcs: "UM.0021", piece: "UM.0021", unit: "UM.0018",
        set: "UM.0019", kg: "UM.0003", kilogram: "UM.0003", ton: "UM.0001",
        l: "UM.0007", liter: "UM.0007", m: "UM.0013", meter: "UM.0013",
        box: "UM.0022", drum: "UM.0036", roll: "UM.0039", lembar: "UM.0020",
        sheet: "UM.0020", karton: "UM.0037",
      };
      const init: Record<string, { kd_brg: string; satuan: string; search: string }> = {};
      items.forEach(it => {
        const satuanCode = uomMap[it.uom?.toLowerCase() || ""] || "UM.0021";
        init[it.id] = { kd_brg: "000000", satuan: satuanCode, search: "" };
      });
      setOverrides(init);
    });
  }, [bast.id]);

  const updateOverride = (id: string, field: "kd_brg" | "satuan", val: string) => {
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const filteredGoods = (search: string) => {
    if (!search.trim()) return goodsRef.slice(0, 50);
    const q = search.toLowerCase();
    return goodsRef.filter(g =>
      g.code.includes(q) || g.bahasa.toLowerCase().includes(q)
    ).slice(0, 80);
  };

  const isStep1Valid = poItems.every(it => overrides[it.id]?.kd_brg && overrides[it.id]?.satuan);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerNpwp.trim()) { setError("NPWP penandatangan wajib diisi."); return; }
    setLoading(true); setError(null);
    try {
      const items_override: ItemOverride[] = poItems.map(it => ({
        id: it.id,
        nama: it.nama,
        qty: it.qty,
        unit_price: it.unit_price,
        uom: it.uom,
        kd_brg: overrides[it.id]?.kd_brg || "000000",
        satuan: overrides[it.id]?.satuan || "UM.0021",
      }));
      const res = await issueEFaktur({
        bast_id: bast.id, signer_name: signerName,
        signer_npwp: signerNpwp, signer_kota: signerKota,
        items_override,
      });
      onDone();
      Swal.fire({ icon: "success", title: "e-Faktur Diterbitkan", text: `NOFA: ${res.efaktur?.nofa || "Menunggu nomor dari DJP"}`, confirmButtonColor: "#22c55e" });
    } catch (err: any) { setError(err.message || "Gagal menerbitkan e-Faktur."); }
    finally { setLoading(false); }
  };

  const totalTagihan = poItems.reduce((s, it) => s + it.total, 0);
  const isLoading = refsLoading || itemsLoading;

  return (
    <Modal onClose={onClose} maxWidth={640}>
      <ModalHeader
        icon={<Send size={20} />}
        title={step === 1 ? "Pilih Kode Barang DJP" : "Data Penandatangan"}
        subtitle={step === 1
          ? `PO: ${bast.purchase_order?.po_number || bast.bast_number} · ${poItems.length} item`
          : "Lengkapi info penandatangan untuk upload ke DJP"}
        onClose={onClose}
      />

      {/* Step indicator */}
      <div style={{ display: "flex", padding: "12px 20px 0", gap: 8 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              background: step >= s ? "var(--ui-primary)" : "var(--ui-bg-inset)",
              color: step >= s ? "#fff" : "var(--ui-text-muted)",
              border: `1px solid ${step >= s ? "var(--ui-primary)" : "var(--ui-border)"}`,
            }}>{s}</div>
            <div style={{ fontSize: 11, color: step === s ? "var(--ui-text-primary)" : "var(--ui-text-muted)", fontWeight: step === s ? 700 : 400 }}>
              {s === 1 ? "Kode Barang" : "Penandatangan"}
            </div>
            {s < 2 && <div style={{ flex: 1, height: 1, background: step > s ? "var(--ui-primary)" : "var(--ui-border)", marginLeft: 4 }} />}
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        {/* ── STEP 1: item table ── */}
        {step === 1 && (
          isLoading ? (
            <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Loader2 size={26} className="animate-spin" style={{ color: "var(--ui-primary)" }} />
              <span style={{ fontSize: 13, color: "var(--ui-text-muted)" }}>Memuat data item & referensi DJP…</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--ui-text-muted)", display: "flex", alignItems: "center", gap: 7 }}>
                <Info size={13} style={{ flexShrink: 0, color: "var(--ui-primary)" }} />
                Pilih <strong style={{ color: "var(--ui-text-primary)" }}>Kode Barang DJP</strong> dan <strong style={{ color: "var(--ui-text-primary)" }}>Satuan</strong> untuk setiap item. Kode ini sesuai klasifikasi Bea Cukai DJP.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "45vh", overflowY: "auto", overflowX: "visible" }}>
                {poItems.map((it, idx) => {
                  const ov = overrides[it.id] || { kd_brg: "000000", satuan: "UM.0021", search: "" };
                  const selectedGoods = goodsRef.find(g => g.code === ov.kd_brg);
                  const selectedSatuan = satuanRef.find(s => s.code === ov.satuan);
                  const isOpen = openDropdown === it.id;

                  return (
                    <div key={it.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 10, padding: "12px 14px" }}>
                      {/* Item header */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>ITEM {idx + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)", wordBreak: "break-word", lineHeight: 1.4 }}>
                          {it.nama}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 4 }}>
                          {it.qty} {it.uom} × Rp {it.unit_price.toLocaleString("id")} = <strong style={{ color: "var(--ui-primary)" }}>Rp {it.total.toLocaleString("id")}</strong>
                        </div>
                      </div>

                      {/* Kode Barang — full width, dropdown di bawah */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                          Kode Barang DJP <span style={{ color: "var(--ui-status-rejected)" }}>*</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOpenDropdown(isOpen ? null : it.id); setDropdownSearch(""); }}
                          style={{
                            width: "100%", padding: "9px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                            background: "var(--ui-bg-input)", border: `1px solid ${ov.kd_brg !== "000000" ? "var(--ui-primary)" : "var(--ui-border-input)"}`,
                            fontSize: 12, color: "var(--ui-text-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--ui-primary)", flexShrink: 0, fontSize: 11 }}>{ov.kd_brg}</span>
                            <span style={{ color: "var(--ui-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>
                              {selectedGoods?.bahasa || "Pilih kode barang DJP…"}
                            </span>
                          </span>
                          <ChevronDown size={12} style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        </button>

                        {isOpen && (
                          <div style={{
                            marginTop: 4, borderRadius: 9, overflow: "hidden",
                            background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
                            boxShadow: "var(--ui-glass-shadow)",
                          }}>
                            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--ui-border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--ui-bg-input)", borderRadius: 7, padding: "6px 10px" }}>
                                <Search size={12} style={{ color: "var(--ui-text-muted)", flexShrink: 0 }} />
                                <input
                                  autoFocus
                                  value={dropdownSearch}
                                  onChange={e => setDropdownSearch(e.target.value)}
                                  placeholder="Cari kode atau nama barang…"
                                  style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--ui-text-primary)", width: "100%" }}
                                />
                              </div>
                            </div>
                            <div style={{ maxHeight: 180, overflowY: "auto" }}>
                              {filteredGoods(dropdownSearch).map(g => (
                                <button
                                  key={g.code}
                                  type="button"
                                  onClick={() => { updateOverride(it.id, "kd_brg", g.code); setOpenDropdown(null); }}
                                  style={{
                                    width: "100%", padding: "7px 12px", textAlign: "left", border: "none", cursor: "pointer",
                                    background: ov.kd_brg === g.code ? "var(--ui-primary-muted)" : "transparent",
                                    borderBottom: "1px solid var(--ui-border)", display: "flex", alignItems: "center", gap: 10,
                                  }}
                                  onMouseEnter={e => { if (ov.kd_brg !== g.code) (e.currentTarget as HTMLButtonElement).style.background = "var(--ui-bg-inset)"; }}
                                  onMouseLeave={e => { if (ov.kd_brg !== g.code) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                >
                                  <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "var(--ui-primary)", flexShrink: 0, width: 56 }}>{g.code}</span>
                                  <span style={{ fontSize: 11, color: "var(--ui-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.bahasa}</span>
                                </button>
                              ))}
                              {filteredGoods(dropdownSearch).length === 0 && (
                                <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "var(--ui-text-muted)" }}>Tidak ditemukan</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Satuan — full width di bawah */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                          Satuan <span style={{ color: "var(--ui-status-rejected)" }}>*</span>
                        </div>
                        <select
                          value={ov.satuan}
                          onChange={e => updateOverride(it.id, "satuan", e.target.value)}
                          style={{ ...field, padding: "8px 36px 8px 12px", fontSize: 12 }}
                        >
                          {satuanRef.map(s => (
                            <option key={s.code} value={s.code}>{s.code} — {s.description}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--ui-primary-muted)", border: "1px solid var(--ui-primary-border)", borderRadius: 9 }}>
                <span style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{poItems.length} item · Total sebelum PPN</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: "var(--ui-primary)" }}>Rp {totalTagihan.toLocaleString("id")}</span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 9, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, fontSize: 13, minHeight: 44 }}>
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                  style={{ flex: 2, padding: "11px", borderRadius: 9, background: isStep1Valid ? "var(--ui-primary)" : "var(--ui-bg-inset)", color: isStep1Valid ? "#fff" : "var(--ui-text-muted)", border: "none", cursor: isStep1Valid ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  Lanjut ke Penandatangan →
                </button>
              </div>
            </div>
          )
        )}

        {/* ── STEP 2: signer info ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Summary items */}
            <div style={{ background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 9, padding: "10px 14px", fontSize: 12, display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
              {poItems.map(it => {
                const g = goodsRef.find(g => g.code === overrides[it.id]?.kd_brg);
                return (
                  <div key={it.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "var(--ui-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{it.nama}</span>
                    <span style={{ fontFamily: "monospace", color: "var(--ui-primary)", flexShrink: 0, fontWeight: 700, fontSize: 11 }}>{overrides[it.id]?.kd_brg}</span>
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "var(--ui-status-rejected)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
              </div>
            )}

            <div>
              <label style={lbl}>Nama Penandatangan</label>
              <input value={signerName} onChange={e => setSignerName(e.target.value)} required style={field} placeholder="Nama lengkap penandatangan" />
            </div>
            <div>
              <label style={lbl}>NPWP Penandatangan <span style={{ color: "var(--ui-status-rejected)" }}>*</span></label>
              <input value={signerNpwp} onChange={e => setSignerNpwp(e.target.value.replace(/\D/g, "").slice(0, 16))} required maxLength={16} style={{ ...field, fontFamily: "monospace", letterSpacing: "0.05em" }} placeholder="16 digit NPWP/NIK" />
              <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 4 }}>{signerNpwp.length}/16 digit</div>
            </div>
            <div>
              <label style={lbl}>Kota Penandatangan</label>
              <input value={signerKota} onChange={e => setSignerKota(e.target.value)} required style={field} placeholder="Jakarta" />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: "11px", borderRadius: 9, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, fontSize: 13, minHeight: 44 }}>
                ← Kembali
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: 9, background: loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: loading ? "none" : "0 4px 14px rgba(249,115,22,0.3)" }}>
                {loading ? <><Loader2 size={14} className="animate-spin" />Memproses…</> : <><Send size={14} />Terbitkan Sekarang</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

/* ─── UploadDJPModal ─────────────────────────────────────────────── */
function UploadDJPModal({ efaktur, onClose, onDone }: { efaktur: EFaktur; onClose(): void; onDone(): void }) {
  const [tempat, setTempat] = useState("Jakarta");
  const [npwpNik, setNpwpNik] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npwpNik.trim()) { setError("NPWP/NIK wajib diisi."); return; }
    setLoading(true); setError(null);
    try {
      await uploadEFaktur(efaktur.id, { tempat_penandatangan: tempat, npwp_nik_penandatangan: npwpNik });
      onDone();
    } catch (err: any) { setError(err.message || "Gagal upload ke DJP."); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth={440}>
      <ModalHeader icon={<Upload size={20} />} title="Upload ke DJP" subtitle="Kirim faktur draft untuk mendapat nomor resmi" onClose={onClose} />
      <div style={{ padding: "20px" }}>
        <div style={{ background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12 }}>
          <span style={{ color: "var(--ui-text-muted)" }}>Ref: </span>
          <strong style={{ color: "var(--ui-text-primary)" }}>{efaktur.no_invoice}</strong>
          <span style={{ color: "var(--ui-text-muted)", margin: "0 6px" }}>·</span>
          <span style={{ color: "var(--ui-text-muted)" }}>PE-ID: </span>
          <strong style={{ color: "var(--ui-text-primary)", fontFamily: "monospace" }}>{efaktur.pajak_express_id}</strong>
        </div>
        {error && <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, color: "var(--ui-status-rejected)", display: "flex", gap: 7 }}><AlertCircle size={13} />{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Tempat Penandatangan</label>
            <input value={tempat} onChange={e => setTempat(e.target.value)} required style={field} />
          </div>
          <div>
            <label style={lbl}>NPWP / NIK Penandatangan <span style={{ color: "var(--ui-status-rejected)" }}>*</span></label>
            <input value={npwpNik} onChange={e => setNpwpNik(e.target.value.replace(/\D/g, "").slice(0, 16))} required maxLength={16} style={{ ...field, fontFamily: "monospace" }} placeholder="16 digit" />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 9, background: "transparent", border: "1px solid var(--ui-border)", color: "var(--ui-text-muted)", cursor: "pointer", fontWeight: 700, minHeight: 44 }}>Batal</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "11px", borderRadius: 9, background: loading ? "rgba(34,197,94,0.5)" : "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {loading ? <><Loader2 size={14} className="animate-spin" />Mengirim…</> : <><Upload size={14} />Upload ke DJP</>}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── VatOutTab ──────────────────────────────────────────────────── */
function VatOutTab({ company }: { company: any }) {
  const [efakturs, setEfakturs] = useState<EFaktur[]>([]);
  const [basts, setBasts] = useState<Bast[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"list" | "ready">("list");
  const [issueBast, setIssueBast] = useState<Bast | null>(null);
  const [uploadTarget, setUploadTarget] = useState<EFaktur | null>(null);
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
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [company.id, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const readyBasts = basts.filter(b =>
    b.status?.toLowerCase() === "completed" && !efakturs.some(ef => ef.bast_id === b.id)
  );

  const approvedCount = efakturs.filter(e => e.status?.toUpperCase() === "APPROVED").length;
  const draftCount = efakturs.filter(e => e.status?.toUpperCase() === "DRAFT").length;
  const totalPpn = efakturs.filter(e => e.status?.toUpperCase() !== "CANCELLED").reduce((a, e) => a + Number(e.ppn), 0);

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await getEFaktur(id);
      setEfakturs(prev => prev.map(ef => ef.id === id ? { ...ef, ...res.efaktur } : ef));
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setRefreshingId(null); }
  };

  const handleCancel = async (ef: EFaktur) => {
    const ok = await Swal.fire({
      title: "Batalkan e-Faktur?",
      html: `<p style="font-size:14px;color:var(--ui-text-secondary)">NOFA: <strong>${ef.nofa}</strong></p>`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", confirmButtonText: "Ya, Batalkan", cancelButtonText: "Kembali",
    });
    if (!ok.isConfirmed) return;
    setCancellingId(ef.id);
    try {
      await cancelEFaktur(ef.id);
      Swal.fire({ icon: "success", title: "Dibatalkan", timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setCancellingId(null); }
  };

  const handleDelete = async (id: string) => {
    const ok = await Swal.fire({ title: "Hapus Draft?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Hapus", cancelButtonText: "Batal" });
    if (!ok.isConfirmed) return;
    setDeletingId(id);
    try {
      await deleteEFaktur(id);
      Swal.fire({ icon: "success", title: "Dihapus", timer: 1200, showConfirmButton: false });
      fetchData();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setDeletingId(null); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Faktur", value: total, icon: <ReceiptText size={18} />, accent: "var(--ui-primary)", bg: "var(--ui-primary-muted)" },
          { label: "Approved", value: approvedCount, icon: <FileCheck2 size={18} />, accent: "var(--ui-status-approved)", bg: "rgba(34,197,94,0.10)" },
          { label: "Draft", value: draftCount, icon: <FileClock size={18} />, accent: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
          { label: "Siap Faktur", value: readyBasts.length, icon: <CheckCircle2 size={18} />, accent: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
          { label: "Total PPN", value: `Rp ${totalPpn.toLocaleString("id")}`, icon: <TrendingUp size={18} />, accent: "var(--ui-text-primary)", bg: "var(--ui-bg-inset)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, color: s.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ui-text-primary)", lineHeight: 1.2, marginTop: 2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--ui-border)" }}>
        <Tab active={subTab === "list"} onClick={() => setSubTab("list")}>
          Daftar Faktur Keluaran {total > 0 && <span style={{ fontSize: 11, background: "var(--ui-primary-muted)", color: "var(--ui-primary)", padding: "1px 7px", borderRadius: 20, marginLeft: 6 }}>{total}</span>}
        </Tab>
        <Tab active={subTab === "ready"} onClick={() => setSubTab("ready")}>
          BAST Siap Faktur {readyBasts.length > 0 && <span style={{ fontSize: 11, background: "rgba(245,158,11,0.12)", color: "#f59e0b", padding: "1px 7px", borderRadius: 20, marginLeft: 6 }}>{readyBasts.length}</span>}
        </Tab>
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--ui-text-muted)" }}>
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--ui-primary)" }} />
          <span style={{ fontSize: 13 }}>Memuat data…</span>
        </div>
      ) : subTab === "list" ? (
        efakturs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 14 }}>
            <ReceiptText size={40} style={{ color: "var(--ui-text-muted)", opacity: 0.35, marginBottom: 14 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ui-text-primary)" }}>Belum ada e-Faktur</div>
            <div style={{ fontSize: 13, color: "var(--ui-text-muted)", marginTop: 6 }}>Pindah ke tab "BAST Siap Faktur" untuk menerbitkan.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {efakturs.map(ef => {
                const isDraft = ef.status?.toUpperCase() === "DRAFT";
                const isApproved = ef.status?.toUpperCase() === "APPROVED";
                return (
                  <div key={ef.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
                    {/* Card header */}
                    <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                      {/* Left icon */}
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: isDraft ? "var(--ui-bg-inset)" : isApproved ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--ui-border)" }}>
                        {isDraft ? <FileClock size={18} style={{ color: "var(--ui-text-muted)" }} /> : isApproved ? <FileCheck2 size={18} style={{ color: "var(--ui-status-approved)" }} /> : <FileX2 size={18} style={{ color: "var(--ui-status-rejected)" }} />}
                      </div>
                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <StatusBadge status={ef.status} />
                          {ef.nofa
                            ? <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ui-text-muted)", background: "var(--ui-bg-inset)", padding: "2px 8px", borderRadius: 6 }}>NOFA: {ef.nofa}</span>
                            : <span style={{ fontSize: 11, color: "var(--ui-text-muted)", fontStyle: "italic" }}>Menunggu nomor dari DJP</span>
                          }
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ui-text-primary)", marginBottom: 4 }}>{ef.no_invoice || "—"}</div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--ui-text-muted)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} />{ef.tanggal_faktur || "—"}</span>
                          <span>Masa {ef.masa_pajak}/{ef.tahun_pajak}</span>
                          {ef.bast && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Building2 size={11} />{ef.bast.bast_number}</span>}
                        </div>
                      </div>
                      {/* Amount */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", marginBottom: 3 }}>PPN</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ui-primary)" }}>Rp {Number(ef.ppn).toLocaleString("id")}</div>
                        <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>DPP Rp {Number(ef.dpp).toLocaleString("id")}</div>
                      </div>
                    </div>
                    {/* Footer actions */}
                    <div style={{ padding: "10px 16px", background: "var(--ui-bg-inset)", borderTop: "1px solid var(--ui-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
                      {isDraft && (
                        <button onClick={() => setUploadTarget(ef)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(34,197,94,0.10)", color: "var(--ui-status-approved)", border: "1px solid rgba(34,197,94,0.22)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <Upload size={12} /> Upload ke DJP
                        </button>
                      )}
                      <button onClick={() => handleRefresh(ef.id)} disabled={refreshingId === ef.id} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "transparent", color: "var(--ui-text-muted)", border: "1px solid var(--ui-border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <RefreshCw size={12} className={refreshingId === ef.id ? "animate-spin" : ""} /> Refresh
                      </button>
                      {isApproved && ef.nofa && (
                        <button onClick={() => handleCancel(ef)} disabled={cancellingId === ef.id} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "var(--ui-status-rejected)", border: "1px solid rgba(239,68,68,0.20)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <X size={12} /> Batalkan
                        </button>
                      )}
                      {isDraft && (
                        <button onClick={() => handleDelete(ef.id)} disabled={deletingId === ef.id} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "var(--ui-status-rejected)", border: "1px solid rgba(239,68,68,0.20)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <Trash2 size={12} /> Hapus Draft
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Pagination */}
            {lastPage > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchData(p); }} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === 1 ? "not-allowed" : "pointer", background: page === 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>← Prev</button>
                <span style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{page} / {lastPage}</span>
                <button onClick={() => { const p = Math.min(lastPage, page + 1); setPage(p); fetchData(p); }} disabled={page === lastPage} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === lastPage ? "not-allowed" : "pointer", background: page === lastPage ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === lastPage ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>Next →</button>
              </div>
            )}
          </>
        )
      ) : (
        /* BAST Siap Faktur */
        readyBasts.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "60px 20px", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 14 }}>
            <CheckCircle2 size={40} style={{ color: "var(--ui-status-approved)", opacity: 0.4, marginBottom: 14 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ui-text-primary)" }}>Semua BAST sudah dibuatkan faktur</div>
            <div style={{ fontSize: 13, color: "var(--ui-text-muted)", marginTop: 6 }}>Tidak ada BAST yang menunggu penerbitan e-Faktur.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {readyBasts.map(bast => (
              <div key={bast.id} style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,197,94,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={20} style={{ color: "var(--ui-status-approved)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ui-status-approved)", background: "rgba(34,197,94,0.10)", padding: "2px 8px", borderRadius: 6 }}>BAST Selesai</span>
                    <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>{bast.bast_number}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--ui-text-primary)", fontSize: 14 }}>
                    PO: {bast.purchase_order?.po_number || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={11} /> {bast.bast_date}
                  </div>
                </div>
                <button onClick={() => setIssueBast(bast)} style={{ padding: "10px 18px", borderRadius: 9, background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 14px rgba(249,115,22,0.25)", flexShrink: 0, minHeight: 42 }}>
                  <Send size={14} /> Terbitkan e-Faktur
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modals */}
      {issueBast && (
        <IssueModal bast={issueBast} company={company} onClose={() => setIssueBast(null)} onDone={() => { setIssueBast(null); setSubTab("list"); fetchData(1); }} />
      )}
      {uploadTarget && (
        <UploadDJPModal efaktur={uploadTarget} onClose={() => setUploadTarget(null)} onDone={() => { setUploadTarget(null); fetchData(); Swal.fire({ icon: "success", title: "Berhasil!", text: "Faktur berhasil diupload ke DJP.", timer: 2000, showConfirmButton: false }); }} />
      )}
    </div>
  );
}

/* ─── VatInTab ───────────────────────────────────────────────────── */
function VatInTab() {
  const now = new Date();
  const [subTab, setSubTab] = useState<"list" | "prepop">("list");
  const [periode, setPeriode] = useState(`${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`);
  const [vatInList, setVatInList] = useState<VatInItem[]>([]);
  const [prepopList, setPrepopList] = useState<PrepopulatedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [prepopLoading, setPrepopLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

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
      const lp = Math.ceil((res.metaPage?.totalRow || 0) / 20) || 1;
      setLastPage(lp);
      setPage(p);
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setLoading(false); }
  }, [periode]);

  useEffect(() => { if (subTab === "list") fetchList(1); }, [subTab, fetchList]);

  const fetchPrepop = async () => {
    setPrepopLoading(true);
    try {
      const res = await prepopulatedVatIn({ tahun_pajak: ppTahun, masa_pajak: ppMasa, npwp_penjual: ppNpwp, nomor_faktur: ppNofa });
      setPrepopList(res.data?.dataFaktur || []);
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
    finally { setPrepopLoading(false); }
  };

  const handleKredit = async (item: PrepopulatedItem) => {
    const masaPajak = item.TaxInvoiceDate ? String(new Date(item.TaxInvoiceDate).getMonth() + 1).padStart(2, "0") : ppMasa;
    const ok = await Swal.fire({
      title: "Kreditkan Faktur Ini?",
      html: `<p style="font-size:13px;color:var(--ui-text-secondary)">No. Faktur: <strong>${item.TaxInvoiceNumber}</strong><br>Penjual: ${item.SellerTaxpayerName}</p>`,
      icon: "question", showCancelButton: true,
      confirmButtonText: "Ya, Kreditkan", cancelButtonText: "Batal", confirmButtonColor: "#f97316",
    });
    if (!ok.isConfirmed) return;
    try {
      await uploadVatIn({ nomor_faktur: item.TaxInvoiceNumber, masa_pajak: masaPajak, tahun_pajak: item.TaxInvoiceYear, konfirmasi_pengkreditan: 1 });
      Swal.fire({ icon: "success", title: "Berhasil dikreditkan!", timer: 1800, showConfirmButton: false });
      fetchPrepop();
    } catch (err: any) { Swal.fire({ icon: "error", title: "Gagal", text: err.message }); }
  };

  const inputSm: React.CSSProperties = { ...field, padding: "8px 11px", fontSize: 12, fontFamily: "monospace" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--ui-border)" }}>
        <Tab active={subTab === "list"} onClick={() => setSubTab("list")}>Daftar Faktur Masukan</Tab>
        <Tab active={subTab === "prepop"} onClick={() => setSubTab("prepop")}>Inquiry Prepopulated DJP</Tab>
      </div>

      {subTab === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: "14px 16px", background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 10 }}>
            <div>
              <div style={lbl}>Periode</div>
              <input value={periode} onChange={e => setPeriode(e.target.value)} placeholder="MM/YYYY" style={{ ...inputSm, width: 120 }} />
            </div>
            <button onClick={() => fetchList(1)} disabled={loading} style={{ padding: "8px 18px", borderRadius: 8, background: "var(--ui-primary)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 38 }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Tampilkan
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "var(--ui-primary)" }} /></div>
          ) : vatInList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 12 }}>
              <ArrowDownToLine size={36} style={{ color: "var(--ui-text-muted)", opacity: 0.35, marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>Tidak ada faktur masukan</div>
              <div style={{ fontSize: 13, color: "var(--ui-text-muted)", marginTop: 4 }}>Ubah filter periode lalu klik Tampilkan.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{total.toLocaleString("id")} faktur masukan ditemukan</div>
              <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--ui-bg-inset)", borderBottom: "1px solid var(--ui-border)" }}>
                        {["No. Faktur", "Penjual", "Tanggal", "DPP", "PPN", "Status", "Kredit"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vatInList.map(item => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--ui-border)", transition: "background 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, color: "var(--ui-text-primary)", whiteSpace: "nowrap" }}>{item.nomorfaktur}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.namatokopenjual || item.npwppenjual}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>{item.tanggalfaktur ? new Date(item.tanggalfaktur).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: "var(--ui-text-primary)", whiteSpace: "nowrap" }}>Rp {Number(item.totaldpp).toLocaleString("id")}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: "var(--ui-primary)", whiteSpace: "nowrap" }}>Rp {Number(item.totalppn).toLocaleString("id")}</td>
                          <td style={{ padding: "11px 14px" }}><StatusBadge status={item.statusfaktur} /></td>
                          <td style={{ padding: "11px 14px" }}>
                            <StatusBadge status={item.statuspembeli || item.buyerstatus || undefined} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {lastPage > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
                  <button onClick={() => fetchList(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === 1 ? "not-allowed" : "pointer", background: page === 1 ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === 1 ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>← Prev</button>
                  <span style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{page} / {lastPage} · {total.toLocaleString("id")} total</span>
                  <button onClick={() => fetchList(Math.min(lastPage, page + 1))} disabled={page === lastPage} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: page === lastPage ? "not-allowed" : "pointer", background: page === lastPage ? "var(--ui-bg-input)" : "var(--ui-primary-muted)", color: page === lastPage ? "var(--ui-text-muted)" : "var(--ui-primary)" }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Prepopulated DJP */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "16px", background: "var(--ui-bg-inset)", border: "1px solid var(--ui-border)", borderRadius: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div><div style={lbl}>Tahun Pajak</div><input value={ppTahun} onChange={e => setPpTahun(e.target.value)} style={{ ...inputSm, width: 90 }} /></div>
            <div><div style={lbl}>Masa Pajak</div><input value={ppMasa} onChange={e => setPpMasa(e.target.value)} placeholder="09" style={{ ...inputSm, width: 70 }} /></div>
            <div style={{ flex: 1, minWidth: 150 }}><div style={lbl}>NPWP Penjual (opsional)</div><input value={ppNpwp} onChange={e => setPpNpwp(e.target.value)} style={{ ...inputSm, width: "100%" }} /></div>
            <div style={{ flex: 1, minWidth: 150 }}><div style={lbl}>No. Faktur (opsional)</div><input value={ppNofa} onChange={e => setPpNofa(e.target.value)} style={{ ...inputSm, width: "100%" }} /></div>
            <button onClick={fetchPrepop} disabled={prepopLoading} style={{ padding: "8px 18px", borderRadius: 8, background: "var(--ui-primary)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, minHeight: 38 }}>
              {prepopLoading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Inquiry DJP
            </button>
          </div>

          {prepopList.length === 0 && !prepopLoading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ui-text-muted)", background: "var(--ui-bg-card)", border: "1px dashed var(--ui-border)", borderRadius: 12 }}>
              <Search size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <div style={{ fontWeight: 700 }}>Isi filter lalu klik Inquiry DJP</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Data prepopulated langsung dari sistem DJP.</div>
            </div>
          ) : prepopLoading ? (
            <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "var(--ui-primary)" }} /></div>
          ) : (
            <div style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--ui-bg-inset)", borderBottom: "1px solid var(--ui-border)" }}>
                      {["No. Faktur", "Penjual", "Tanggal", "DPP", "PPN", "Status DJP", "Buyer Status", "Aksi"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prepopList.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--ui-border)", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--ui-bg-card-hover)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>{item.TaxInvoiceNumber}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{item.SellerTaxpayerName}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ui-text-muted)", whiteSpace: "nowrap" }}>{new Date(item.TaxInvoiceDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Rp {item.SellingPrice?.toLocaleString("id")}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 700, color: "var(--ui-primary)", whiteSpace: "nowrap" }}>Rp {item.VAT?.toLocaleString("id")}</td>
                        <td style={{ padding: "11px 14px" }}><StatusBadge status={item.TaxInvoiceStatus} /></td>
                        <td style={{ padding: "11px 14px" }}><StatusBadge status={item.BuyerStatus ?? undefined} /></td>
                        <td style={{ padding: "11px 14px" }}>
                          {item.BuyerStatus !== "CREDITED" ? (
                            <button onClick={() => handleKredit(item)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "var(--ui-primary-muted)", color: "var(--ui-primary)", border: "1px solid var(--ui-primary-border)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                              <ArrowDownToLine size={11} /> Kreditkan
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--ui-status-approved)" }}>✓ Sudah kredit</span>
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
  const [mainTab, setMainTab] = useState<"out" | "in">("out");

  useEffect(() => {
    const stored = localStorage.getItem("active_company");
    if (stored) { try { setCompany(JSON.parse(stored)); } catch { /* ignore */ } }
  }, []);

  if (isModuleDisabledInDemo("efaktur")) return <DemoDisabledBanner module="efaktur" />;

  const isVendor = company?.type === "vendor";
  const isBuyer  = company?.type === "buyer";

  // Vendor: hanya Faktur Keluaran (VAT Out)
  // Buyer:  hanya Faktur Masukan (VAT In)
  // Kedua role: tampil sesuai konteks masing-masing
  const subtitle = isVendor
    ? "Sebagai penjual, Anda menerbitkan Faktur Pajak Keluaran (PPN) kepada pembeli."
    : isBuyer
    ? "Sebagai pembeli, Anda mencatat Faktur Pajak Masukan yang diterima dari penjual."
    : "Kelola Faktur Pajak via PajakExpress.";

  return (
    <Layout title="e-Faktur" subtitle={subtitle}>
      <div style={{ width: "100%" }}>
        {!company ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ui-text-muted)" }}>
            <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontWeight: 700 }}>Pilih perusahaan terlebih dahulu</div>
          </div>
        ) : isVendor ? (
          /* ── VENDOR: hanya lihat Faktur Keluaran ── */
          <VatOutTab company={company} />
        ) : isBuyer ? (
          /* ── BUYER: hanya lihat Faktur Masukan ── */
          <VatInTab />
        ) : (
          /* ── Fallback: keduanya (admin / mixed) ── */
          <>
            <div style={{ display: "flex", gap: 28, borderBottom: "1px solid var(--ui-border)", marginBottom: 24 }}>
              <Tab active={mainTab === "out"} onClick={() => setMainTab("out")}>
                Faktur Keluaran <span style={{ fontSize: 11, color: "var(--ui-text-muted)", marginLeft: 4 }}>VAT Out</span>
              </Tab>
              <Tab active={mainTab === "in"} onClick={() => setMainTab("in")}>
                Faktur Masukan <span style={{ fontSize: 11, color: "var(--ui-text-muted)", marginLeft: 4 }}>VAT In</span>
              </Tab>
            </div>
            {mainTab === "out" ? <VatOutTab company={company} /> : <VatInTab />}
          </>
        )}
      </div>
    </Layout>
  );
}
