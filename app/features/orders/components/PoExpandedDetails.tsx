import React from "react";
import {
  FileText, CheckCircle2, ChevronLeft, Package, Clock,
  Signature, Loader2, Truck, ArrowRight, CreditCard, ReceiptText,
  User, Building, Calendar, MapPin
} from "lucide-react";
import { getFullApiUrl } from "../../../lib/api";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { SignatureButtons } from "./SignatureButtons";

// ─── Fee Calculator (mirrors CalculateInvoiceFeesAction.php) ──────────────────
const getPlatFeeRate = (base: number) => {
  if (base <= 100_000_000) return 0.05;
  if (base <= 250_000_000) return 0.03;
  return 0.02;
};

const calcFees = (base: number) => {
  const platFeeRate  = getPlatFeeRate(base);
  const platFee      = base * platFeeRate;
  const ppnPlatform  = platFee * 0.11;
  const adminBank    = 4400;
  const pph23        = platFee * 0.02;
  const biayaLayanan = (platFee + ppnPlatform) + adminBank - pph23;
  const ppn          = base * 0.11;
  const grandTotal   = base + biayaLayanan + ppn;
  return { platFeeRate, platFee, ppnPlatform, adminBank, pph23, biayaLayanan, ppn, grandTotal };
};

interface PoExpandedDetailsProps {
  po: any;
  company: any;
  user: any;
  processingId: string | null;
  issuingBastId: string | null;
  generateQRCode: (text: string) => Promise<string | null>;
  onSign: (type: 'bast' | 'do', id: string, role: 'handed-by' | 'received-by') => Promise<void>;
  onArrangeDelivery: (poId: string, buyerAddress?: string) => void;
  onUpdateTrackingStatus: (poId: string, status: 'packing' | 'in_transit' | 'delivered', currentPoStatus: string) => void;
  onIssueBast: (poId: string) => void;
  onPayInvoice: (invoice: any) => void;
  onPublishInvoice: (invoiceId: string) => void;
}

export const PoExpandedDetails = ({
  po,
  company,
  user,
  processingId,
  issuingBastId,
  generateQRCode,
  onSign,
  onArrangeDelivery,
  onUpdateTrackingStatus,
  onIssueBast,
  onPayInvoice,
  onPublishInvoice,
}: PoExpandedDetailsProps) => {
  const steps = [
    { key: 'issued',     label: 'PO Issued',           icon: FileText,      color: '#f59e0b' },
    { key: 'confirmed',  label: 'PO Confirmed',        icon: CheckCircle2,  color: '#f97316' },
    { key: 'paid',       label: 'Payment Received',    icon: CreditCard,    color: '#3b82f6' },
    { key: 'packing',    label: 'Goods Being Packed',  icon: Package,       color: '#8b5cf6' },
    { key: 'in_transit', label: 'In Transit',          icon: Truck,         color: '#06b6d4' },
    { key: 'delivered',  label: 'Goods Delivered',     icon: CheckCircle2,  color: '#22c55e' },
  ];

  const statusOrder = ['issued','published','confirmed','paid','packing','in_transit','delivery','delivered','completed','done'];
  const currentIdx = statusOrder.indexOf(po.status);
  const isReached = (stepKey: string) => {
    const stepIdx = statusOrder.indexOf(stepKey);
    return stepIdx !== -1 && currentIdx >= stepIdx;
  };
  const timelineMap: Record<string, any> = {};
  (po.tracking_timeline || []).forEach((entry: any) => {
    timelineMap[entry.status] = entry;
  });

  const nextActions: Record<string, { label: string; status: 'packing' | 'in_transit' | 'delivered'; color: string; description: string }> = {
    paid:       { label: 'Mark as Packing',    status: 'packing',    color: '#8b5cf6', description: 'Confirm that goods are being packed for shipment' },
    packing:    { label: 'Arrange Delivery',   status: 'in_transit', color: '#3b82f6', description: 'Enter tracking/resi number and dispatch goods' },
    in_transit: { label: 'Mark as Delivered',  status: 'delivered',  color: '#22c55e', description: 'Confirm that goods have been delivered to buyer' },
  };
  const nextAction = company.type === 'vendor' ? nextActions[po.status] : null;

  const handleNextAction = () => {
    if (!nextAction) return;
    if (nextAction.status === 'in_transit') {
      onArrangeDelivery(po.id, po.buyer_address);
    } else {
      onUpdateTrackingStatus(po.id, nextAction.status, po.status);
    }
  };

  const displayedInvoice = po.invoices?.find((i: any) => i.type === 'final') || po.invoices?.find((i: any) => i.type === 'proforma');

  return (
    <div style={{
      padding: "16px", borderRadius: 12, background: "var(--ui-bg-input)",
      border: "1px solid var(--ui-border-input)", marginTop: 8,
      display: "flex", flexDirection: "column", gap: 16,
      boxShadow: "inset 0 4px 24px rgba(0,0,0,0.2)", transition: "all 0.3s ease"
    }}>

      {/* ── Order Progress Timeline ───────────────────────────────────────── */}
      <div style={{ background: "rgba(249,115,22,0.05)", padding: 12, borderRadius: 8, border: "1px solid rgba(249,115,22,0.1)", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Order Progress</span>
          {company.type === 'vendor' && (
            <a href="/track" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={10} /> Public Tracking Page
            </a>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const done = isReached(step.key);
            const isCurrent = po.status === step.key || (step.key === 'issued' && ['published','issued'].includes(po.status));
            const entry = timelineMap[step.key];
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", minWidth: 80 }}>
                {!isLast && (
                  <div style={{
                    position: "absolute", top: 16, left: "50%", width: "100%", height: 2,
                    background: isReached(steps[idx + 1]?.key) ? step.color : "var(--ui-border-input)",
                    transition: "background 0.4s ease", zIndex: 0
                  }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: done ? step.color : "var(--ui-bg-input)",
                  border: `2px solid ${done ? step.color : 'var(--ui-border-input)'}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1, position: "relative",
                  boxShadow: isCurrent ? `0 0 0 4px ${step.color}30` : 'none',
                  transition: "all 0.4s ease"
                }}>
                  {done ? (
                    <StepIcon size={14} color="#fff" />
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 700 }}>{idx + 1}</span>
                  )}
                </div>
                <div style={{ marginTop: 8, textAlign: "center", padding: "0 4px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: done ? step.color : "var(--ui-text-muted)", transition: "color 0.4s ease", lineHeight: 1.3 }}>
                    {step.label}
                  </div>
                  {entry?.timestamp && (
                    <div style={{ fontSize: 9, color: "var(--ui-text-muted)", marginTop: 3, fontWeight: 600 }}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Action Prompt for Vendor */}
        {nextAction && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: `${nextAction.color}15`, border: `1px solid ${nextAction.color}30`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: nextAction.color }}>Next Action Required</div>
              <div style={{ fontSize: 11, color: "var(--ui-text-secondary)", marginTop: 2 }}>{nextAction.description}</div>
            </div>
            <button
              onClick={handleNextAction}
              disabled={processingId === po.id}
              style={{
                background: nextAction.color, border: "none", borderRadius: 10,
                padding: "6px 12px", color: "#fff", fontWeight: 700, fontSize: 11,
                cursor: processingId === po.id ? "wait" : "pointer",
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                boxShadow: `0 4px 12px ${nextAction.color}30`, transition: "all 0.2s ease",
                flexShrink: 0
              }}
            >
              {processingId === po.id ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
              {nextAction.label}
            </button>
          </div>
        )}
      </div>

      {/* ── Metadata + Classification + Financial ────────────────────────── */}
      <div className="huntr-grid-2col" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
        {/* Left: Metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, transition: "color 0.3s ease" }}>Metadata & Identity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={14} color="#fb923c" />
                </div>
                <span>Issued by: <strong style={{ color: "var(--ui-text-primary)" }}>{po.created_by || "System"}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={14} color="#fb923c" />
                </div>
                <a
                  href={getFullApiUrl(`/api/orders/${po.id}/print`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#fb923c", fontWeight: 700, textDecoration: "none" }}
                  className="hover:underline"
                >
                  Print PO Document
                </a>
              </div>

              {po.delivery_orders?.map((doItem: any) => (
                <div key={doItem.id} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Package size={14} color="#3b82f6" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <a
                      href={getFullApiUrl(`/api/do/${doItem.id}/print`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "none" }}
                      className="hover:underline"
                    >
                      Print DO: {doItem.do_number}
                    </a>
                    {doItem.tracking_number && (
                      <span style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                        Tracking / Resi: {doItem.tracking_number}
                      </span>
                    )}
                    {doItem.delivery_address && (
                      <span style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        Delivery Point: {doItem.delivery_address}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {po.approved_by && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={14} color="#4ade80" />
                  </div>
                  <span>Approved by: <strong>{po.approved_by}</strong></span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ui-text-primary)", transition: "color 0.3s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--ui-bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={14} color="var(--ui-text-secondary)" />
                </div>
                <span>Last Update: <strong>{new Date(po.updated_at).toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Classification + Financial */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Classification</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>Category: <strong style={{ color: "var(--ui-text-primary)" }}>{po.purchase_category || "N/A"}</strong></div>
            <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>Type: <strong style={{ color: "var(--ui-text-primary)" }}>{po.purchase_type || "N/A"}</strong></div>
          <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>Delivery Point: <strong style={{ color: "var(--ui-text-primary)" }}>{po.delivery_point || po.buyer_address || "N/A"}</strong></div>
            <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>Department: <strong style={{ color: "var(--ui-text-primary)" }}>{po.department || "N/A"}</strong></div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--ui-bg-card)", padding: 14, borderRadius: 10, border: "1px solid var(--ui-border)", transition: "all 0.3s ease" }}>
            <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total Financial Summary</div>
            {po.is_historical ? (
              <>
                <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ui-text-primary)", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                  <span style={{ fontSize: 13, color: "#fb923c", marginRight: 6, fontWeight: 600 }}>{po.currency || "IDR"}</span>
                  {Number(po.total_amount || 0).toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: 11, color: "var(--ui-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6b7280", flexShrink: 0 }} />
                  Data historis — rincian biaya tidak dikalkulasi
                </div>
              </>
            ) : (() => {
              const base = Number(po.total_amount || 0);
              const { platFeeRate, platFee, ppnPlatform, adminBank, pph23, biayaLayanan, ppn, grandTotal } = calcFees(base);
              return (
                <>
                  {/* Grand Total */}
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#b45309", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    <span style={{ fontSize: 13, color: "#92400e", marginRight: 6, fontWeight: 600 }}>{po.currency || "IDR"}</span>
                    {Math.round(grandTotal).toLocaleString('id-ID')}
                  </div>

                  {/* Breakdown rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, borderTop: "1px solid rgba(234,179,8,0.3)", paddingTop: 8, marginTop: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#78350f", fontWeight: 600 }}>
                      <span>Total Pembelian Barang (DPP)</span>
                      <span>{base.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309", fontWeight: 600 }}>
                      <span>↳ Platform Fee + PPN ({(platFeeRate*100).toFixed(0)}%+11%)</span>
                      <span>+{Math.round(platFee + ppnPlatform).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309", fontWeight: 600 }}>
                      <span>↳ Admin Bank</span>
                      <span>+{adminBank.toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309", fontWeight: 600 }}>
                      <span>↳ PPH 23 (2%)</span>
                      <span>-{Math.round(pph23).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#92400e", fontWeight: 700 }}>
                      <span>Biaya Layanan</span>
                      <span>+{Math.round(biayaLayanan).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#92400e", fontWeight: 700 }}>
                      <span>PPN 11% (dari DPP)</span>
                      <span>+{Math.round(ppn).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: "#b45309", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                    Sudah termasuk semua pajak & biaya layanan
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Item Breakdown Table ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Item Breakdown</h4>
          <span style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600 }}>{po.items?.length || 0} line items</span>
        </div>

        <div style={{ overflow: "hidden", borderRadius: 8, border: "1px solid var(--ui-border-input)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--ui-bg-card)", borderBottom: "1px solid var(--ui-border-input)" }}>
                <th style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontWeight: 700, fontSize: 11, width: 36, textAlign: "center" }}>NO</th>
                <th style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontWeight: 700, fontSize: 11 }}>ITEM NAME & CODE</th>
                <th style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontWeight: 700, fontSize: 11 }}>QTY</th>
                <th style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontWeight: 700, fontSize: 11 }}>UNIT PRICE</th>
                <th style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontWeight: 700, fontSize: 11 }}>TAX</th>
                <th style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontWeight: 700, fontSize: 11, textAlign: "right" }}>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: idx === (po.items?.length - 1) ? "none" : "1px solid var(--ui-border-input)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--ui-text-muted)", fontSize: 12, textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ color: "var(--ui-text-primary)", fontWeight: 700, marginBottom: 4 }}>{item.inventory_name}</div>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>{item.inventory_code || "NO-CODE"} • {item.pr_reference_number || "NO-PR"}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ui-text-primary)" }}>
                    <strong style={{ color: "#fdba74" }}>{item.qty}</strong> <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>{item.uom}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ui-text-primary)" }}>{Number(item.unit_price).toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: "#f87171", fontSize: 12 }}>{Number(item.tax_amount) > 0 ? `+${Number(item.tax_amount).toLocaleString()}` : "—"}</td>
                  <td style={{ padding: "10px 12px", color: "var(--ui-text-primary)", fontWeight: 600, textAlign: "right" }}>{Number(item.total_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Invoices Section ──────────────────────────────────────────── */}
        <div style={{ marginTop: 16, padding: 12, background: "var(--ui-bg-input)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <ReceiptText size={16} /> Related Invoices
          </div>
          {displayedInvoice ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[displayedInvoice].map((inv: any) => (
                <div key={inv.id} style={{
                  padding: "12px 16px", borderRadius: 12, background: "var(--ui-bg-card)",
                  border: `1px solid ${inv.type === 'final' ? "rgba(34,197,94,0.2)" : "var(--ui-border-input)"}`,
                  display: "flex", flexDirection: "column", gap: 8, minWidth: 220
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: inv.type === 'final' ? "#22c55e" : "#fb923c" }}>
                      {inv.type === 'final' ? '🧾 Invoice Akhir' : '📄 Proforma Invoice'}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                      background: inv.status === 'paid' ? "rgba(34,197,94,0.1)" : inv.status === 'pending_finance' ? "rgba(59,130,246,0.1)" : inv.status === 'unpaid' ? "rgba(249,115,22,0.1)" : "rgba(107,114,128,0.1)",
                      color: inv.status === 'paid' ? "#22c55e" : inv.status === 'pending_finance' ? "#3b82f6" : inv.status === 'unpaid' ? "#fb923c" : "#9ca3af",
                      textTransform: "uppercase"
                    }}>{inv.status.replace('_', ' ')}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px", background: "rgba(249,115,22,0.04)", borderRadius: 10, border: "1px solid rgba(249,115,22,0.1)" }}>
                    {/* Nilai Transaksi (DPP) */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ui-text-secondary)" }}>
                      <span>Total Pembelian sebelum PPN</span>
                      <span style={{ fontWeight: 700, color: "var(--ui-text-primary)" }}>IDR {Number(inv.base_amount || inv.amount).toLocaleString()}</span>
                    </div>

                    {/* Platform fee */}
                    {Number(inv.platform_fee) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ui-text-secondary)", paddingLeft: 12 }}>
                        <span style={{ color: "var(--ui-text-muted)" }}>↳ Platform Fee (3%)</span>
                        <span style={{ fontWeight: 600, color: "#fb923c" }}>+ IDR {Number(inv.platform_fee).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Admin Bank */}
                    {Number(inv.midtrans_fee) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ui-text-secondary)", paddingLeft: 12 }}>
                        <span style={{ color: "var(--ui-text-muted)" }}>↳ Admin Bank</span>
                        <span style={{ fontWeight: 600, color: "#60a5fa" }}>+ IDR {Number(inv.midtrans_fee).toLocaleString()}</span>
                      </div>
                    )}

                    {/* PPN eComm */}
                    {Number(inv.ppn_ecomm) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ui-text-secondary)", paddingLeft: 12 }}>
                        <span style={{ color: "var(--ui-text-muted)" }}>↳ PPN eComm (8%)</span>
                        <span style={{ fontWeight: 600, color: "#a78bfa" }}>+ IDR {Number(inv.ppn_ecomm).toLocaleString()}</span>
                      </div>
                    )}

                    {/* Biaya Layanan subtotal */}
                    {(Number(inv.platform_fee) + Number(inv.midtrans_fee)) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ui-text-secondary)", fontWeight: 600 }}>
                        <span>Biaya Layanan (Platform + Admin + PPN eComm)</span>
                        <span style={{ color: "#fb923c" }}>+ IDR {(Number(inv.platform_fee) + Number(inv.midtrans_fee) + Number(inv.ppn_ecomm)).toLocaleString()}</span>
                      </div>
                    )}

                    {/* PPN 11% dari DPP */}
                    {Number(inv.ppn_fee) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ui-text-secondary)", fontWeight: 600 }}>
                        <span>PPN (11% dari DPP)</span>
                        <span style={{ fontWeight: 700, color: "#c084fc" }}>+ IDR {Number(inv.ppn_fee).toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid rgba(249,115,22,0.15)", margin: "2px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ui-text-primary)" }}>Total</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text-primary)" }}>IDR {Number(inv.total_amount || inv.amount).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>Published: {inv.date}</div>

                  <a
                    href={getFullApiUrl(`/api/invoices/${inv.id}/print`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#f97316", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                  >
                    <FileText size={12} /> Print Invoice
                  </a>

                  {inv.status === 'unpaid' && company.type === 'buyer' && (
                    <button
                      onClick={() => onPayInvoice(inv)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 10,
                        background: "linear-gradient(135deg,#f97316,#f59e0b)",
                        color: "#fff", border: "none", fontSize: 11, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: "0 4px 12px rgba(249,115,22,0.2)"
                      }}
                    >
                      <CreditCard size={12} /> Bayar Sekarang
                    </button>
                  )}

                  {inv.type === 'final' && inv.status === 'draft' && company.type === 'vendor' && (
                    <button
                      onClick={() => onPublishInvoice(inv.id)}
                      disabled={processingId === inv.id}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 10,
                        background: "linear-gradient(135deg,#10b981,#059669)",
                        color: "#fff", border: "none", fontSize: 11, fontWeight: 600,
                        cursor: processingId === inv.id ? "wait" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
                      }}
                    >
                      {processingId === inv.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Terbitkan Invoice Akhir
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", border: "1px dashed var(--ui-border-input)", borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ui-text-muted)" }}>
                {po.status === 'confirmed'
                  ? "Generating invoice data..."
                  : "Proforma Invoice will be available once the Vendor confirms this PO."}
              </p>
            </div>
          )}
        </div>

        {/* ── Delivery Order Signatures ─────────────────────────────────── */}
        {po.delivery_orders && po.delivery_orders.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: "var(--ui-bg-input)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} color="#3b82f6" /> Delivery Order (DO) Signatures
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {po.delivery_orders.map((doItem: any) => (
                <div key={doItem.id} style={{
                  padding: "16px", borderRadius: 12, background: "var(--ui-bg-card)",
                  border: "1px solid var(--ui-border-input)", display: "flex", flexDirection: "column", gap: 12
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#3b82f6" }}>
                      {doItem.do_number}
                    </span>
                    <QRCodeDisplay text={getFullApiUrl(`/api/do/${doItem.id}/print`)} generateQR={generateQRCode} />
                  </div>
                  {doItem.delivery_address && (
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", lineHeight: 1.5 }}>
                      Delivery point: {doItem.delivery_address}
                    </div>
                  )}
                  <SignatureButtons
                    docType="do"
                    docId={doItem.id}
                    handedBySigned={!!doItem.handed_by_signed_at}
                    receivedBySigned={!!doItem.received_by_signed_at}
                    handedByMeta={{ name: doItem.handed_by_name, position: doItem.handed_by_position, signed_at: doItem.handed_by_signed_at }}
                    receivedByMeta={{ name: doItem.received_by_name, position: doItem.received_by_position, signed_at: doItem.received_by_signed_at }}
                    onSign={onSign}
                    processingId={processingId}
                    user={user}
                    company={company}
                    generateQR={generateQRCode}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BAST Issue Section ────────────────────────────────────────── */}
        {company.type === 'vendor' && ['delivered', 'completed', 'done', 'paid'].includes(po.status) && (
          <div style={{ marginTop: 16, padding: 12, background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Signature size={16} color="#f97316" /> Berita Acara Serah Terima (BAST)
            </div>
            {po.basts && po.basts.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12 }}>
                <CheckCircle2 size={16} color="#22c55e" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>BAST Already Issued</div>
                  <div style={{ fontSize: 11, color: "var(--ui-text-muted)", marginTop: 2 }}>
                    {po.basts[0].bast_number} · {po.basts[0].bast_date}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: "var(--ui-text-secondary)", margin: "0 0 16px 0" }}>
                  Issue a handover document to formally transfer goods to the buyer with multi-party signatures.
                </p>
                <button
                  onClick={() => onIssueBast(po.id)}
                  disabled={issuingBastId === po.id}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    background: "linear-gradient(135deg,#f97316,#f59e0b)",
                    color: "#fff", border: "none", fontSize: 12, fontWeight: 600,
                    cursor: issuingBastId === po.id ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 12px rgba(249,115,22,0.2)", transition: "all 0.2s ease"
                  }}
                >
                  {issuingBastId === po.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Issuing BAST...</>
                  ) : (
                    <><CheckCircle2 size={14} /> Issue BAST (Auto-Generated)</>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── BAST List ─────────────────────────────────────────────────── */}
        <div style={{ marginTop: 16, padding: 12, background: "var(--ui-bg-input)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Signature size={16} color="#f97316" /> BAST Documents for this PO
          </div>
          {po.basts && po.basts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {po.basts.map((bast: any) => (
                <div key={bast.id} style={{
                  padding: "16px", borderRadius: 12, background: "var(--ui-bg-card)",
                  border: "1px solid var(--ui-border-input)", display: "flex", flexDirection: "column", gap: 12
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#f97316" }}>
                      📋 {bast.bast_number}
                    </span>
                    <QRCodeDisplay text={getFullApiUrl(`/api/basts/${bast.id}/pdf`)} generateQR={generateQRCode} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ui-text-secondary)" }}>
                    Date: {bast.bast_date} • Issued by: {bast.handed_by_name || "N/A"}
                  </div>
                  <SignatureButtons
                    docType="bast"
                    docId={bast.id}
                    handedBySigned={!!bast.handed_by_signed_at}
                    receivedBySigned={!!bast.received_by_signed_at}
                    handedByMeta={{ name: bast.handed_by_name, position: bast.handed_by_position, signed_at: bast.handed_by_signed_at }}
                    receivedByMeta={{ name: bast.received_by_name, position: bast.received_by_position, signed_at: bast.received_by_signed_at }}
                    onSign={onSign}
                    processingId={processingId}
                    user={user}
                    company={company}
                    generateQR={generateQRCode}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => window.open(getFullApiUrl(`/api/basts/${bast.id}/pdf`), '_blank')}
                      style={{ fontSize: 11, color: "#f97316", fontWeight: 700, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
                    >
                      <FileText size={12} /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0", border: "1px dashed var(--ui-border-input)", borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ui-text-muted)" }}>
                No BAST documents issued for this PO yet.
              </p>
            </div>
          )}
        </div>

        {/* ── E-Faktur Section ─────────────────────────────────────────── */}
        <div style={{ marginTop: 16, padding: 12, background: "var(--ui-bg-input)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#3b82f6" /> E-Faktur Pajak for this PO
          </div>
          {po.efakturs && po.efakturs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {po.efakturs.map((ef: any) => (
                <div key={ef.id} style={{
                  padding: "12px 16px", borderRadius: 12, background: "var(--ui-bg-card)",
                  border: "1px solid var(--ui-border-input)", display: "flex", flexDirection: "column", gap: 8
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "#3b82f6" }}>
                      📄 {ef.nofa || "NOFA PENDING"}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      background: ef.status === "APPROVED" ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
                      color: ef.status === "APPROVED" ? "#22c55e" : "#f97316",
                      padding: "2px 8px", borderRadius: 8
                    }}>
                      {ef.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ui-text-secondary)" }}>
                    Tanggal: {ef.tanggal_faktur} • DPP: Rp {ef.dpp?.toLocaleString?.() || "N/A"} • PPN: Rp {ef.ppn?.toLocaleString?.() || "N/A"}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
                      E-Faktur will be available for download via Pajak.io dashboard.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0", border: "1px dashed var(--ui-border-input)", borderRadius: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ui-text-muted)" }}>
                No e-Faktur issued yet. E-Faktur will be generated automatically after BAST is fully signed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
