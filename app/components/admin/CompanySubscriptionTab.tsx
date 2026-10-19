import React, { useEffect, useState } from "react";
import { AlertCircle, Calculator, Check, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { adminGetCompanySubscription, adminUpdateCompanySubscriptionScheme } from "../../lib/api";
import { inp, lbl } from "./shared";
import type { Company } from "./shared";

/* ─── Subscription Tab Component ──────────────────────────────────── */
export default function SubscriptionTab({ company }: { company: Company }) {
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

  if (!loading && subscription?.enterprise_plan) {
    return <div style={{ padding: 20, fontSize: 13, color: "var(--ui-text-primary)" }}>
      <strong>{subscription.enterprise_plan.replace("enterprise_", "Enterprise ").replaceAll("_", " ")}</strong>
      <p>Status: {subscription.status === "active" && new Date(subscription.ends_at).getTime() > Date.now() ? "Aktif" : "Tidak aktif"}</p>
      <p>Berlaku sampai: {new Date(subscription.ends_at).toLocaleDateString("id-ID")}</p>
      <p style={{ color: "var(--ui-text-muted)" }}>Konfigurasi paket Enterprise dan monitoring tagihan tersedia di menu Subscription.</p>
    </div>;
  }

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

