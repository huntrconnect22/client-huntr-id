import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getFullApiUrl } from "../lib/client";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { Loader2, AlertCircle, FileText, Banknote, CheckCircle2, Download } from "lucide-react";
import Swal from "sweetalert2";

interface DebitNote {
  id: string;
  debit_note_number: string;
  po_number: string;
  debit_note_date: string;
  type: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  currency: string;
  line_items: any[];
}

export default function DebitNotesPage() {
  const [company, setCompany] = useState<any>(null);
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      setCompany(JSON.parse(activeComp));
    }
  }, []);

  useEffect(() => {
    if (company) {
      fetchDebitNotes();
    }
  }, [company]);

  const fetchDebitNotes = async () => {
    setLoading(true);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const statusFilter = filterStatus !== "all" ? `&status=${filterStatus}` : "";
      const response = await fetch(getFullApiUrl(`/api/debit-notes?company_id=${company.id}${statusFilter}`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to load debit notes data");
      
      const data = await response.json();
      setDebitNotes(data.data || data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load debit notes data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (debitNoteId: string) => {
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Authentication token not found. Please log in again.'
        });
        return;
      }
      const response = await fetch(getFullApiUrl(`/api/debit-notes/${debitNoteId}/pdf`), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DebitNote-${debitNoteId}.pdf`;
      link.click();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.message || "Failed to download PDF"
      });
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      return_refund: "rgba(34,197,94,0.1)",
      price_adjustment: "rgba(59,130,246,0.1)",
      credit_memo: "rgba(168,85,247,0.1)",
      charge_back: "rgba(239,68,68,0.1)",
    };
    return colors[type] || "rgba(156,163,175,0.1)";
  };

  const getTypeTextColor = (type: string) => {
    const colors: Record<string, string> = {
      return_refund: "#22c55e",
      price_adjustment: "#3b82f6",
      credit_memo: "#a855f7",
      charge_back: "#ef4444",
    };
    return colors[type] || "#6b7280";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "rgba(156,163,175,0.1)",
      issued: "rgba(249,115,22,0.1)",
      acknowledged: "rgba(59,130,246,0.1)",
      settled: "rgba(34,197,94,0.1)",
      disputed: "rgba(239,68,68,0.1)",
      cancelled: "rgba(239,68,68,0.1)",
    };
    return colors[status] || "rgba(156,163,175,0.1)";
  };

  const getStatusTextColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "#6b7280",
      issued: "#f97316",
      acknowledged: "#3b82f6",
      settled: "#22c55e",
      disputed: "#ef4444",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const filteredNotes = filterStatus === "all"
    ? debitNotes
    : debitNotes.filter(d => d.status === filterStatus);

  if (isModuleDisabledInDemo("debit-notes")) {
    return <DemoDisabledBanner module="debit-notes" />;
  }

  return (
    <Layout title="Debit Notes" subtitle="Manage debit notes for returns and adjustments">
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
          borderRadius: 24, border: "1px solid var(--ui-border-input)", padding: 32, marginBottom: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Banknote size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--ui-text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
                Debit Notes ({filteredNotes.length})
              </h2>
              <p style={{ fontSize: 13, color: "var(--ui-text-muted)", margin: "4px 0 0" }}>
                Financial adjustment documents for returns, price adjustments, and chargebacks
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {["all", "draft", "issued", "acknowledged", "settled", "disputed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1px solid var(--ui-border-input)",
                background: filterStatus === status ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "var(--ui-bg-card)",
                color: filterStatus === status ? "#fff" : "var(--ui-text-secondary)", fontSize: 13, fontWeight: 700,
                cursor: "pointer", transition: "all 0.2s", textTransform: "capitalize"
              }}
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--ui-text-muted)" }}>
            <Loader2 size={32} className="animate-spin" style={{ marginBottom: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading data...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "var(--ui-bg-card)", borderRadius: 24, border: "1px dashed var(--ui-border-input)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ui-text-muted)" }}>
              <FileText size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 8px" }}>No Debit Notes Found</h3>
            <p style={{ fontSize: 14, color: "var(--ui-text-muted)", margin: 0 }}>No debit notes match the current filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredNotes.map((note: DebitNote) => (
              <div key={note.id} style={{
                background: "var(--ui-bg-card)", borderRadius: 20, border: "1px solid var(--ui-border-input)",
                overflow: "hidden", display: "flex", flexDirection: "column"
              }}>
                <div style={{ padding: 24, borderBottom: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 8, background: getTypeColor(note.type), color: getTypeTextColor(note.type), fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        {note.type.replace("_", " ")}
                      </span>
                      <span style={{ padding: "4px 10px", borderRadius: 8, background: getStatusColor(note.status), color: getStatusTextColor(note.status), fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        {note.status}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                        {note.debit_note_number}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 4px" }}>
                      PO: {note.po_number}
                    </h3>
                    <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>
                      Date: {note.debit_note_date} • Items: {note.line_items?.length || 0}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Amount</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "var(--ui-text-primary)", letterSpacing: "-0.5px" }}>
                      {note.currency} {Number(note.total_amount).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: "var(--ui-bg-input)", borderBottom: "1px solid var(--ui-border-subtle)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Subtotal</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                      {note.currency} {Number(note.subtotal).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Tax (Included)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ui-text-primary)" }}>
                      {note.currency} {Number(note.tax_amount).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Document ID</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "var(--ui-text-primary)" }}>
                      {note.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: "var(--ui-bg-input)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    onClick={() => handleDownloadPdf(note.id)}
                    style={{
                      padding: "10px 16px", borderRadius: 10,
                      background: "rgba(249,115,22,0.1)", color: "#f97316", border: "none",
                      fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      transition: "all 0.2s"
                    }}
                  >
                    <Download size={14} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
