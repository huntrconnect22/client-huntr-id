import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getFullApiUrl } from "../lib/client";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { Loader2, AlertCircle, FileText, Package, CheckCircle2, XCircle, Download } from "lucide-react";
import Swal from "sweetalert2";

interface Return {
  id: string;
  return_number: string;
  po_number: string;
  return_date: string;
  status: string;
  return_reason: string;
  inspection_status: string;
  total_return_value: number;
  items: any[];
}

export default function ReturnsPage() {
  const [company, setCompany] = useState<any>(null);
  const [returns, setReturns] = useState<Return[]>([]);
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
      fetchReturns();
    }
  }, [company]);

  const fetchReturns = async () => {
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
      const response = await fetch(getFullApiUrl(`/api/returns?company_id=${company.id}${statusFilter}`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to load returns data");
      
      const data = await response.json();
      setReturns(data.data || data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load returns data");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (returnId: string) => {
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
      const response = await fetch(getFullApiUrl(`/api/returns/${returnId}/pdf`), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Return-${returnId}.pdf`;
      link.click();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.message || "Failed to download PDF"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "rgba(249,115,22,0.1)",
      in_transit: "rgba(59,130,246,0.1)",
      received: "rgba(34,197,94,0.1)",
      processed: "rgba(34,197,94,0.1)",
      cancelled: "rgba(239,68,68,0.1)",
    };
    return colors[status] || "rgba(156,163,175,0.1)";
  };

  const getStatusTextColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "#f97316",
      in_transit: "#3b82f6",
      received: "#22c55e",
      processed: "#22c55e",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const getInspectionIcon = (status: string) => {
    if (status === "approved") {
      return <CheckCircle2 size={16} style={{ color: "#22c55e" }} />;
    } else if (status === "rejected") {
      return <XCircle size={16} style={{ color: "#ef4444" }} />;
    }
    return null;
  };

  const filteredReturns = filterStatus === "all" 
    ? returns 
    : returns.filter(r => r.status === filterStatus);

  if (isModuleDisabledInDemo("returns")) {
    return <DemoDisabledBanner module="returns" />;
  }

  return (
    <Layout title="Returns Management" subtitle="Track returned and rejected goods">
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
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(245,59,94,0.1)", color: "#f53b5e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--ui-text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
                Returns ({filteredReturns.length})
              </h2>
              <p style={{ fontSize: 13, color: "var(--ui-text-muted)", margin: "4px 0 0" }}>
                Manage goods returned due to defects, damage, or quality issues
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {["all", "pending", "in_transit", "received", "processed", "cancelled"].map((status) => (
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
        ) : filteredReturns.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "var(--ui-bg-card)", borderRadius: 24, border: "1px dashed var(--ui-border-input)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ui-text-muted)" }}>
              <FileText size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 8px" }}>No Returns Found</h3>
            <p style={{ fontSize: 14, color: "var(--ui-text-muted)", margin: 0 }}>No returns match the current filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredReturns.map((ret: Return) => (
              <div key={ret.id} style={{
                background: "var(--ui-bg-card)", borderRadius: 20, border: "1px solid var(--ui-border-input)",
                overflow: "hidden", display: "flex", flexDirection: "column"
              }}>
                <div style={{ padding: 24, borderBottom: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 8, background: getStatusColor(ret.status), color: getStatusTextColor(ret.status), fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        {ret.status}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                        {ret.return_number}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 4px" }}>
                      PO: {ret.po_number}
                    </h3>
                    <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>
                      Reason: <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{ret.return_reason.replace("_", " ")}</span> • Date: {ret.return_date}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Value</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "var(--ui-text-primary)", letterSpacing: "-0.5px" }}>
                      IDR {Number(ret.total_return_value).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: "var(--ui-bg-input)", borderBottom: "1px solid var(--ui-border-subtle)", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "var(--ui-bg-card)" }}>
                    {getInspectionIcon(ret.inspection_status)}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ui-text-secondary)", textTransform: "capitalize" }}>
                      Inspection: {ret.inspection_status}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
                    Items: {ret.items?.length || 0}
                  </span>
                </div>
                
                <div style={{ padding: 20, background: "var(--ui-bg-input)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--ui-text-muted)" }}>
                    Document ID: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{ret.id.substring(0, 8)}...</span>
                  </div>
                  
                  <button
                    onClick={() => handleDownloadPdf(ret.id)}
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
