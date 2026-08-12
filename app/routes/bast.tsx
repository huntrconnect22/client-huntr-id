import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getFullApiUrl } from "../lib/client";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { Loader2, CheckCircle2, AlertCircle, FileText, Signature } from "lucide-react";

interface Bast {
  id: string;
  bast_number: string;
  po_number: string;
  bast_date: string;
  status: string;
  handed_by_name?: string;
  handed_by_signature_url?: string;
  received_by_name?: string;
  received_by_signature_url?: string;
  witness_name?: string;
  witness_signature_url?: string;
  created_at: string;
}

export default function BastPage() {
  const [company, setCompany] = useState<any>(null);
  const [basts, setBasts] = useState<Bast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activeComp = localStorage.getItem("active_company");
    if (activeComp) {
      setCompany(JSON.parse(activeComp));
    }
  }, []);

  useEffect(() => {
    if (company) {
      fetchBasts();
    }
  }, [company]);

  const fetchBasts = async () => {
    setLoading(true);
    try {
      const userSession = localStorage.getItem("user_session");
      const token = userSession ? JSON.parse(userSession).token : null;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Get po_id from URL query params if present
      const urlParams = new URLSearchParams(window.location.search);
      const poId = urlParams.get('po_id');
      
      let url = `/api/basts?company_id=${company.id}`;
      if (poId) {
        url += `&po_id=${poId}`;
      }
      
      const response = await fetch(getFullApiUrl(url), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to load BAST data");
      
      const data = await response.json();
      setBasts(data.data || data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load BAST data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bastId: string) => {
    // Open PDF print view in new tab directly
    const url = getFullApiUrl(`/api/basts/${bastId}/pdf`);
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "rgba(156,163,175,0.1)",
      signed: "rgba(34,197,94,0.1)",
      completed: "rgba(34,197,94,0.1)",
      cancelled: "rgba(239,68,68,0.1)",
    };
    return colors[status] || "rgba(59,130,246,0.1)";
  };

  const getStatusTextColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "#6b7280",
      signed: "#22c55e",
      completed: "#22c55e",
      cancelled: "#ef4444",
    };
    return colors[status] || "#3b82f6";
  };

  if (isModuleDisabledInDemo("bast")) {
    return <DemoDisabledBanner module="bast" />;
  }

  return (
    <Layout title="BAST Document" subtitle="Manage Berita Acara Serah Terima (Handover Documents)">
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
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(249,115,22,0.1)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Signature size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--ui-text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
                BAST Documents ({basts.length})
              </h2>
              <p style={{ fontSize: 13, color: "var(--ui-text-muted)", margin: "4px 0 0" }}>
                Official handover documents with multi-party signatures
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--ui-text-muted)" }}>
            <Loader2 size={32} className="animate-spin" style={{ marginBottom: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading data...</span>
          </div>
        ) : basts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "var(--ui-bg-card)", borderRadius: 24, border: "1px dashed var(--ui-border-input)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ui-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ui-text-muted)" }}>
              <FileText size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 8px" }}>No BAST Documents</h3>
            <p style={{ fontSize: 14, color: "var(--ui-text-muted)", margin: 0 }}>No handover documents found yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {basts.map((bast: Bast) => (
              <div key={bast.id} style={{
                background: "var(--ui-bg-card)", borderRadius: 20, border: "1px solid var(--ui-border-input)",
                overflow: "hidden", display: "flex", flexDirection: "column"
              }}>
                <div style={{ padding: 24, borderBottom: "1px solid var(--ui-border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 8, background: getStatusColor(bast.status), color: getStatusTextColor(bast.status), fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        {bast.status}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
                        {bast.bast_number}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ui-text-primary)", margin: "0 0 4px" }}>
                      Purchase Order: {bast.po_number}
                    </h3>
                    <div style={{ fontSize: 13, color: "var(--ui-text-secondary)" }}>
                      Date: {bast.bast_date}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Document ID</div>
                    <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--ui-text-primary)" }}>
                      {bast.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: 20, background: "var(--ui-bg-input)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <button
                    onClick={() => handleViewDetails(bast.id)}
                    style={{
                      flex: 1, padding: "12px 20px", borderRadius: 12,
                      background: "var(--ui-bg-card)", color: "var(--ui-text-primary)", 
                      border: "1px solid var(--ui-border-input)",
                      fontSize: 14, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}
                  >
                    <FileText size={16} /> View Details
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
