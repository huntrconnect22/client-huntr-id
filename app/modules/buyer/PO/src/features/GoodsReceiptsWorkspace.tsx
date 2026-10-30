import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React, { useState, useEffect } from "react";
import Layout from "~/components/Layout";
import { createReceipt, getOrders } from "~/lib/api";
import { useNavigate } from "react-router";
import { Package, Calendar, CheckCircle2, Loader2, FileCheck2, ChevronDown, ChevronRight, Truck, ArrowLeft, ShoppingBag } from "lucide-react";

export default function Receipts() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectionData, setInspectionData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedPo) {
      const initial: Record<string, any> = {};
      selectedPo.items?.forEach((item: any) => {
        initial[item.id] = {
          po_item_id: item.id,
          inventory_name: item.inventory_name,
          ordered_qty: Number(item.qty),
          received_qty: Number(item.qty),
          rejected_qty: 0,
          condition: "Good",
          rejection_reason: "",
        };
      });
      setInspectionData(initial);
    } else {
      setInspectionData({});
    }
  }, [selectedPo]);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) setCompany(JSON.parse(activeComp));
  }, []);

  useEffect(() => {
    if (company) fetchOrders();
  }, [company]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getOrders(company.id, 1, 100, "", "operational");
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const isBuyer = company?.type === "buyer";

  const pendingReceipts = isBuyer
    ? orders.filter(
        (po) =>
          po.status !== "completed" &&
          po.delivery_orders?.some(
            (d: any) => d.status === "shipped" || d.status === "delivered"
          )
      )
    : [];

  const isGrAllowed = (expectedDate: string | null) => {
    if (import.meta.env.VITE_DEBUG_GR_DATE === "true") return true;
    if (!expectedDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expectedDate);
    exp.setHours(0, 0, 0, 0);
    return today >= exp;
  };

  const handleConfirm = async () => {
    if (!selectedPo || !company) return;
    setError(null);

    // Validate: rejection reason required for any rejected items
    const itemsInspectionArray = Object.values(inspectionData);
    const missingReason = itemsInspectionArray.find(
      (item: any) => (item.rejected_qty ?? 0) > 0 && !(item.rejection_reason ?? "").trim()
    );
    if (missingReason) {
      setError(`Please provide a rejection reason for "${(missingReason as any).inventory_name}" before confirming.`);
      return;
    }

    setConfirming(true);
    try {
      const totalReceived = itemsInspectionArray.reduce((sum: number, item: any) => sum + item.received_qty, 0);

      const data = await createReceipt({
        po_id: selectedPo.id,
        company_id: company.id,
        received_qty: totalReceived > 0 ? totalReceived : 1,
        handover_document_path: "system/auto",
        items_inspection: itemsInspectionArray
      });
      setConfirmed(data.receipt);
      fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedPo) {
    const do_ = selectedPo.delivery_orders?.[0];
    const allowed = isGrAllowed(selectedPo.expected_receiving_date);

    return (
      <Layout title="Konfirmasi Penerimaan Barang" subtitle={`PO ${selectedPo.po_number} · ${selectedPo.vendor_name}`}>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Back */}
          <HuntrButton
            onClick={() => { setSelectedPo(null); setConfirmed(null); setError(null); }}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--ui-text-secondary)", cursor: "pointer", fontSize: 14, fontWeight: 600, padding: 0 }}
          >
            <ArrowLeft size={18} /> Back to list
          </HuntrButton>

          {/* Success state */}
          {confirmed ? (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 24, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(34,197,94,0.3)" }}>
                <CheckCircle2 size={36} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--ui-text-primary)" }}>Goods Received Successfully!</h2>
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ui-text-secondary)" }}>
                  Vendor has been notified. They will issue the final invoice shortly.
                </p>
              </div>
              <HuntrButton
                onClick={() => navigate("/orders")}
                style={{ padding: "12px 32px", borderRadius: 14, background: "linear-gradient(135deg,#f97316,#f59e0b)", color: "#fff", border: "none", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(249,115,22,0.25)" }}
              >
                View All Orders
              </HuntrButton>
            </div>
          ) : (
            <>
              {/* Delivery Info */}
              <HuntrSurface style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 20, padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Truck size={22} color="#3b82f6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Delivery Information</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text-primary)", marginTop: 4 }}>{selectedPo.vendor_name}</div>
                  {do_?.tracking_number && (
                    <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, marginTop: 2 }}>
                      Tracking: {do_.tracking_number}
                    </div>
                  )}
                </div>
                {selectedPo.expected_receiving_date && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Est. Arrival</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: allowed ? "var(--ui-text-primary)" : "#f87171", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                      <Calendar size={14} /> {selectedPo.expected_receiving_date}
                    </div>
                  </div>
                )}
              </HuntrSurface>

              {/* Date restriction warning */}
              {!allowed && (
                <div style={{ padding: "12px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, fontSize: 14, color: "#f87171", fontWeight: 600 }}>
                  ⏰ Goods cannot be received yet. Expected arrival date is <strong>{selectedPo.expected_receiving_date}</strong>.
                </div>
              )}

              {/* Items to receive */}
              <HuntrSurface style={{ background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ui-border-input)", display: "flex", alignItems: "center", gap: 10 }}>
                  <ShoppingBag size={18} color="#f59e0b" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ui-text-primary)" }}>Received Items</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 600 }}>{selectedPo.items?.length || 0} item</span>
                </div>
                <div>
                  {selectedPo.items?.map((item: any, idx: number) => {
                    const idata = inspectionData[item.id] || {};
                    return (
                      <div key={idx} style={{
                        padding: "16px 20px",
                        borderBottom: idx < (selectedPo.items.length - 1) ? "1px solid var(--ui-border-input)" : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={18} color="#f97316" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text-primary)" }}>{item.inventory_name}</div>
                            <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2, fontFamily: "monospace" }}>{item.inventory_code}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#fdba74" }}>{item.qty}</div>
                            <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>{item.uom}</div>
                          </div>
                        </div>
                        
                        {/* Inspection Form for this item */}
                        {allowed && (
                          <div style={{ marginTop: 16, background: "rgba(0,0,0,0.02)", padding: 16, borderRadius: 12, border: "1px dashed var(--ui-border-input)" }}>
                            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Accepted Qty</label>
                                <HuntrInput
                                  type="number"
                                  min="0"
                                  max={item.qty}
                                  value={idata.received_qty ?? item.qty}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setInspectionData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], received_qty: val, rejected_qty: Number(item.qty) - val }
                                    }));
                                  }}
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--ui-border-input)", background: "var(--ui-bg)", color: "var(--ui-text-primary)", fontSize: 14 }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Rejected Qty</label>
                                <HuntrInput
                                  type="number"
                                  min="0"
                                  max={item.qty}
                                  value={idata.rejected_qty ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setInspectionData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], rejected_qty: val, received_qty: Number(item.qty) - val }
                                    }));
                                  }}
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--ui-border-input)", background: "var(--ui-bg)", color: "var(--ui-text-primary)", fontSize: 14 }}
                                />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ui-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Condition / Notes</label>
                              <HuntrInput
                                type="text"
                                placeholder="E.g., Good, Box damaged, Missing parts"
                                value={idata.condition ?? "Good"}
                                onChange={(e) => {
                                  setInspectionData((prev) => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], condition: e.target.value }
                                  }));
                                }}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--ui-border-input)", background: "var(--ui-bg)", color: "var(--ui-text-primary)", fontSize: 14 }}
                              />
                            </div>

                            {/* Rejection reason — appears only when there are rejected items */}
                            {(idata.rejected_qty ?? 0) > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase", marginBottom: 6 }}>
                                  ⚠ Rejection Reason <span style={{ color: "#f87171" }}>*</span>
                                </label>
                                <HuntrTextarea
                                  rows={2}
                                  placeholder="Explain why these items are being rejected (e.g., wrong spec, damaged, expired)"
                                  value={idata.rejection_reason ?? ""}
                                  onChange={(e) => {
                                    setInspectionData((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], rejection_reason: e.target.value }
                                    }));
                                  }}
                                  style={{
                                    width: "100%", padding: "10px 12px", borderRadius: 8,
                                    border: "1px solid rgba(239,68,68,0.4)",
                                    background: "rgba(239,68,68,0.04)",
                                    color: "var(--ui-text-primary)", fontSize: 13,
                                    resize: "vertical", fontFamily: "inherit"
                                  }}
                                />
                                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f87171" }}>
                                  {idata.rejected_qty} unit will be sent to Return — reason required.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </HuntrSurface>

              {/* Error */}
              {error && (
                <div style={{ padding: "12px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, color: "#f87171", fontSize: 14, fontWeight: 600 }}>
                  ⚠ {error}
                </div>
              )}

              {/* Confirm button */}
              <HuntrButton
                onClick={handleConfirm}
                disabled={!allowed || confirming}
                style={{
                  padding: "18px", borderRadius: 16, width: "100%",
                  background: allowed ? "linear-gradient(135deg,#22c55e,#16a34a)" : "var(--ui-bg-input)",
                  color: allowed ? "#fff" : "var(--ui-text-muted)",
                  border: "none", fontWeight: 900, fontSize: 17,
                  cursor: allowed && !confirming ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  boxShadow: allowed ? "0 8px 24px rgba(34,197,94,0.25)" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {confirming
                  ? <><Loader2 size={20} className="animate-spin" /> Processing...</>
                  : <><CheckCircle2 size={20} /> Confirm Goods Received</>
                }
              </HuntrButton>
              <p style={{ textAlign: "center", margin: 0, fontSize: 12, color: "var(--ui-text-muted)" }}>
                By clicking the button above, you confirm that all goods above have been received in good condition.
              </p>
            </>
          )}
        </div>
      </Layout>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <Layout title="Goods Receipt" subtitle="Konfirmasi penerimaan barang dari vendor">
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={20} color="#22c55e" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)" }}>Awaiting Confirmation</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ui-text-muted)" }}>Select a delivery that has arrived to confirm receipt.</p>
          </div>
        </div>

        {loadingOrders ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Loader2 size={28} className="animate-spin" color="#f59e0b" style={{ display: "block", margin: "0 auto" }} />
          </div>
        ) : !isBuyer ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "var(--ui-bg-input)", borderRadius: 20, border: "1px dashed var(--ui-border-input)" }}>
            <Package size={40} style={{ opacity: 0.15, display: "block", margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "var(--ui-text-secondary)", fontSize: 14 }}>Halaman ini hanya tersedia untuk Buyer.</p>
          </div>
        ) : pendingReceipts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "var(--ui-bg-input)", borderRadius: 20, border: "1px dashed var(--ui-border-input)" }}>
            <FileCheck2 size={40} style={{ opacity: 0.15, display: "block", margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "var(--ui-text-secondary)", fontSize: 14 }}>No deliveries awaiting confirmation.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingReceipts.map((po) => {
              const allowed = isGrAllowed(po.expected_receiving_date);
              const do_ = po.delivery_orders?.[0];
              return (
                <HuntrSurface
                  key={po.id}
                  onClick={() => allowed && setSelectedPo(po)}
                  style={{
                    background: "var(--ui-bg-card)", border: `1px solid ${allowed ? "var(--ui-border)" : "rgba(239,68,68,0.2)"}`,
                    borderRadius: 20, padding: "20px 24px",
                    display: "flex", alignItems: "center", gap: 20,
                    cursor: allowed ? "pointer" : "default",
                    opacity: allowed ? 1 : 0.6,
                    transition: "all 0.25s ease",
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: allowed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Truck size={22} color={allowed ? "#22c55e" : "#f87171"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", background: "rgba(249,115,22,0.1)", padding: "2px 8px", borderRadius: 6 }}>{po.po_number}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: allowed ? "#22c55e" : "#f87171", background: allowed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 6 }}>
                        {allowed ? "Siap Diterima" : `Tiba ${po.expected_receiving_date}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)" }}>{po.vendor_name}</div>
                    <div style={{ fontSize: 13, color: "var(--ui-text-muted)", marginTop: 2 }}>
                      {po.items?.length || 0} jenis barang
                      {do_?.tracking_number && <span> · Resi: <strong style={{ color: "#3b82f6" }}>{do_.tracking_number}</strong></span>}
                    </div>
                  </div>
                  {allowed && <ChevronRight size={20} color="var(--ui-text-muted)" />}
                </HuntrSurface>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

