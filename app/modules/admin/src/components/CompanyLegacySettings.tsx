import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Select as HuntrSelect } from "~/shared/ui/Fields";
import React, { useEffect, useState } from "react";
import { Check, Layers, Loader2, Percent, Settings, ShieldCheck, X } from "lucide-react";
import { adminBulkApplySubscription, adminGetSubscriptionSettings, adminUpdateSubscriptionSettings } from "../../lib/api";
import { inp, lbl } from "./shared";

/* ─── Global Subscription Settings Modal ────────────────────────────── */
export default function GlobalSubscriptionSettingsModal({
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
    }" ke perusahaan buyer tanpa paket Enterprise aktif atau terjadwal?`;

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
      setMessage(res.message || "Skema lama berhasil diterapkan.");
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
      <HuntrSurface
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
              Pengaturan skema lama
            </div>
            <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>
              Konfigurasi dinamis tarif pajak (PPN, PPh 23), biaya, dan hak migrasi skema platform
            </div>
          </div>
          <HuntrButton onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-text-muted)" }}>
            <X size={18} />
          </HuntrButton>
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
                  <HuntrInput
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
                <HuntrSelect
                  value={defaultPlan}
                  onChange={(e) => setDefaultPlan(e.target.value as any)}
                  style={{ ...inp, marginTop: 4, width: "100%" }}
                >
                  <option value="annual_upfront_po">Annual Pembayaran di Muka (1 Tahun Historical PO)</option>
                  <option value="saas_subscription">SaaS Subscription (Biaya Tetap / Flat)</option>
                  <option value="per_po">Per PO (Pay-As-You-Go per Transaksi)</option>
                </HuntrSelect>
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
                    <HuntrInput
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
                    <HuntrInput
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
                    <HuntrInput
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
                    <HuntrInput
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
                    <HuntrInput
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
                    <HuntrSelect
                      value={saasCycle}
                      onChange={(e) => setSaasCycle(e.target.value as any)}
                      style={{ ...inp, width: "100%", marginTop: 4 }}
                    >
                      <option value="monthly">Bulanan</option>
                      <option value="annual">Tahunan</option>
                    </HuntrSelect>
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
                <HuntrButton
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
                </HuntrButton>

                <HuntrButton
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
                  Terapkan ke Buyer yang Memenuhi Syarat
                </HuntrButton>
              </div>
            </form>
          )}
        </div>
      </HuntrSurface>
    </div>
  );
}

