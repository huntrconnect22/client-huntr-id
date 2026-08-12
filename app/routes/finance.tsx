import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getOrders, approveInvoice, getFullApiUrl } from "../lib/api";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { Briefcase, Loader2, CheckCircle2, ChevronRight, AlertCircle, FileText, Clock, Calendar, Lock } from "lucide-react";
import Swal from "sweetalert2";

const parsePaymentSchemeDays = (schemeStr: string | null | undefined): number => {
  if (!schemeStr) return 0;
  const lower = schemeStr.toLowerCase().trim();
  if (
    lower.includes('cbd') ||
    lower.includes('cod') ||
    lower.includes('cash') ||
    lower.includes('immediate') ||
    lower.includes('kontan') ||
    lower.includes('tunai')
  ) {
    return 0;
  }
  const match = lower.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const getDueDateInfo = (invDateStr: string | null | undefined, schemeStr: string | null | undefined) => {
  const days = parsePaymentSchemeDays(schemeStr);
  const baseDate = invDateStr ? new Date(invDateStr) : new Date();
  const baseStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const dueDate = new Date(baseStart);
  dueDate.setDate(dueDate.getDate() + days);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = dueDate.getTime() - todayStart.getTime();
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isEligible = remainingDays <= 0;

  const formattedDueDate = dueDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const schemeName = schemeStr && schemeStr !== 'N/A' ? schemeStr : (days > 0 ? `Net ${days} Hari` : "Cash / Instant");

  return {
    days,
    dueDate,
    formattedDueDate,
    remainingDays: Math.max(0, remainingDays),
    isEligible,
    schemeName,
  };
};

export default function Finance() {
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      setCompany(JSON.parse(activeComp));
    }
  }, []);

  useEffect(() => {
    if (company) {
      fetchPendingInvoices();
    }
  }, [company]);

  const fetchPendingInvoices = async () => {
    setLoading(true);
    try {
      // Fetch orders and filter those that have invoices pending finance
      const res = await getOrders(company.id, 1, 100);
      const allOrders = res.data || [];
      
      const ordersWithPending = allOrders.filter((po: any) => 
        po.invoices?.some((inv: any) => inv.status === 'pending_finance')
      );
      
      setOrders(ordersWithPending);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load invoice data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    try {
      await approveInvoice(invoiceId, company.id);
      await fetchPendingInvoices();
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.message || "Failed to approve invoice"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isModuleDisabledInDemo("finance")) {
    return <DemoDisabledBanner module="finance" />;
  }

  return (
    <Layout title="Finance Approval" subtitle="Review and approve final invoices before payment">
      <div style={{ width: "100%" }}>
        {error && (
          <div style={{
            padding: 16, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", gap: 10
          }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <div style={{
          background: "linear-gradient(135deg, var(--ui-bg-card) 0%, var(--ui-bg-card-hover) 100%)",
          borderRadius: 12, border: "1px solid var(--ui-border)", padding: 24, marginBottom: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(16,185,129,0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ui-text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
                Pending Approval ({orders.length})
              </h2>
              <p style={{ fontSize: 13, color: "var(--ui-text-muted)", margin: "4px 0 0" }}>
                List of final invoices issued by vendors awaiting finance review.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--ui-text-muted)" }}>
            <Loader2 size={32} className="animate-spin" style={{ marginBottom: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading data...</span>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "var(--ui-bg-card)", borderRadius: 12, border: "1px dashed var(--ui-border-input)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ui-text-muted)" }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 8px" }}>No Pending Invoices</h3>
            <p style={{ fontSize: 14, color: "var(--ui-text-muted)", margin: 0 }}>All final invoices have been approved or paid.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((po: any) => {
              const pendingInvoices = po.invoices?.filter((inv: any) => inv.status === 'pending_finance') || [];
              const scheme = po.payment_scheme || po.purchase_type || po.payment_term;

              return pendingInvoices.map((inv: any) => {
                const invDate = inv.date || po.order_date || po.created_at;
                const dueInfo = getDueDateInfo(invDate, scheme);

                return (
                  <div key={inv.id} style={{
                    background: "var(--ui-bg-card)", borderRadius: 12, border: "1px solid var(--ui-border-input)",
                    overflow: "hidden", display: "flex", flexDirection: "column"
                  }}>
                    <div style={{ padding: 24, borderBottom: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(59,130,246,0.1)", color: "#3b82f6", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                            PENDING APPROVAL
                          </span>
                          <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                            PO: {po.po_number}
                          </span>
                          <span style={{
                            padding: "4px 10px", borderRadius: 8,
                            background: dueInfo.isEligible ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                            color: dueInfo.isEligible ? "#10b981" : "#f59e0b",
                            fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4
                          }}>
                            <Calendar size={12} /> Scheme: {dueInfo.schemeName}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 4px" }}>
                          Tagihan dari {po.vendor?.name || po.vendor_name || 'Vendor'}
                        </h3>
                        <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>
                          Diterbitkan: {inv.date}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Tagihan</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--ui-text-primary)", letterSpacing: "-0.5px" }}>
                          IDR {Number(inv.amount).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Payment Scheme Hint Banner */}
                    <div style={{
                      padding: "14px 24px",
                      background: dueInfo.isEligible ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.08)",
                      borderTop: "1px solid var(--ui-border-subtle)",
                      borderBottom: "1px solid var(--ui-border-subtle)",
                      display: "flex", alignItems: "center", gap: 12
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: dueInfo.isEligible ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                        color: dueInfo.isEligible ? "#10b981" : "#f59e0b",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        {dueInfo.isEligible ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: dueInfo.isEligible ? "#10b981" : "#f59e0b" }}>
                          {dueInfo.isEligible ? "Siap Di-Approve (Syarat Skema Terpenuhi)" : "Menunggu Tanggal Payment Scheme (Approval Disabled)"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2, lineHeight: 1.4 }}>
                          {dueInfo.isEligible
                            ? `Sesuai skema pembayaran (${dueInfo.schemeName}), invoice ini sudah memenuhi syarat approval per tanggal ${dueInfo.formattedDueDate}.`
                            : `Sesuai skema pembayaran (${dueInfo.schemeName}), invoice ini baru dapat di-approve pada tanggal ${dueInfo.formattedDueDate} (tersisa ${dueInfo.remainingDays} hari lagi).`}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 20, background: "var(--ui-bg-input)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <a 
                        href={getFullApiUrl(`/api/invoices/${inv.id}/print`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          fontSize: 13, color: "#f97316", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
                          padding: "8px 16px", borderRadius: 10, background: "rgba(249,115,22,0.1)", transition: "background 0.2s"
                        }}
                      >
                        <FileText size={16} /> View Invoice Document
                      </a>
                      
                      <button
                        onClick={() => handleApprove(inv.id)}
                        disabled={processingId === inv.id || !dueInfo.isEligible}
                        title={!dueInfo.isEligible ? `Approval di-disabled hingga tanggal ${dueInfo.formattedDueDate} sesuai Payment Scheme` : undefined}
                        style={{
                          padding: "12px 24px", borderRadius: 12,
                          background: dueInfo.isEligible
                            ? "linear-gradient(135deg,#10b981,#059669)"
                            : "var(--ui-bg-input)",
                          color: dueInfo.isEligible ? "#fff" : "var(--ui-text-muted)",
                          border: dueInfo.isEligible ? "none" : "1px solid var(--ui-border-input)",
                          fontSize: 13, fontWeight: 800,
                          cursor: processingId === inv.id ? "wait" : !dueInfo.isEligible ? "not-allowed" : "pointer",
                          opacity: !dueInfo.isEligible ? 0.7 : 1,
                          display: "flex", alignItems: "center", gap: 8,
                          boxShadow: dueInfo.isEligible ? "0 4px 12px rgba(16,185,129,0.25)" : "none",
                          transition: "all 0.2s"
                        }}
                      >
                        {processingId === inv.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : !dueInfo.isEligible ? (
                          <Clock size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        {!dueInfo.isEligible
                          ? `Di-disabled s.d ${dueInfo.formattedDueDate}`
                          : "Approve & Disburse Dana"}
                      </button>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
