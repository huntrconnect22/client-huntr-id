import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import DemoDisabledBanner from "../components/DemoDisabledBanner";
import { getFullApiUrl } from "../lib/client";
import { isModuleDisabledInDemo } from "../lib/demo-mode";
import { Loader2, AlertCircle, FileText, Signature, Clock } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  draft:     { bg: "var(--ui-bg-input)",          color: "var(--ui-text-muted)",    label: "Draft" },
  signed:    { bg: "rgba(34,197,94,0.08)",         color: "#22c55e",                 label: "Signed" },
  completed: { bg: "rgba(34,197,94,0.08)",         color: "#22c55e",                 label: "Completed" },
  cancelled: { bg: "rgba(239,68,68,0.08)",         color: "#ef4444",                 label: "Cancelled" },
  pending:   { bg: "rgba(249,115,22,0.08)",        color: "#f97316",                 label: "Pending" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: "rgba(59,130,246,0.08)", color: "#3b82f6", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 6,
      background: cfg.bg, color: cfg.color,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

export default function BastPage() {
  const [company, setCompany] = useState<any>(null);
  const [basts, setBasts] = useState<Bast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

      const urlParams = new URLSearchParams(window.location.search);
      const poId = urlParams.get("po_id");

      let url = `/api/basts?company_id=${company.id}`;
      if (poId) url += `&po_id=${poId}`;

      const response = await fetch(getFullApiUrl(url), {
        headers: {
          Authorization: `Bearer ${token}`,
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
    const url = getFullApiUrl(`/api/basts/${bastId}/pdf`);
    window.open(url, "_blank");
  };

  if (isModuleDisabledInDemo("bast")) {
    return <DemoDisabledBanner module="bast" />;
  }

  return (
    <Layout
      title="BAST Document"
      subtitle="Manage Berita Acara Serah Terima (Handover Documents)"
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Error Banner */}
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Header Card */}
        <div style={{
          background: "var(--ui-bg-card)",
          borderRadius: 8,
          border: "1px solid var(--ui-border)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.15)",
            color: "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Signature size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text-primary)" }}>
              BAST Documents{basts.length > 0 ? ` (${basts.length})` : ""}
            </div>
            <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 2 }}>
              Official handover documents with multi-party signatures
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 0",
            background: "var(--ui-bg-card)", borderRadius: 8, border: "1px solid var(--ui-border)",
            color: "var(--ui-text-muted)", gap: 12,
          }}>
            <Loader2 size={24} className="animate-spin" color="var(--huntr-orange)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Loading data...</span>
          </div>
        ) : basts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            background: "var(--ui-bg-card)", borderRadius: 8,
            border: "1px dashed var(--ui-border)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--ui-text-muted)",
            }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--ui-text-primary)", margin: "0 0 6px" }}>
              No BAST Documents
            </h3>
            <p style={{ fontSize: 13, color: "var(--ui-text-muted)", margin: 0 }}>
              No handover documents found yet.
            </p>
          </div>
        ) : isMobile ? (
          /* ── Mobile: stacked cards ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {basts.map((bast) => (
              <div
                key={bast.id}
                style={{
                  background: "var(--ui-bg-card)",
                  border: "1px solid var(--ui-border)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {/* Card body */}
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {bast.po_number}
                    </div>
                    <StatusBadge status={bast.status} />
                  </div>

                  <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontFamily: "monospace" }}>
                    {bast.bast_number}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ui-text-secondary)" }}>
                    <Clock size={12} />
                    {bast.bast_date}
                  </div>
                </div>

                {/* Full-width action button */}
                <div style={{ borderTop: "1px solid var(--ui-border)", padding: "10px 14px" }}>
                  <button
                    onClick={() => handleViewDetails(bast.id)}
                    style={{
                      width: "100%",
                      padding: "9px 16px",
                      borderRadius: 6,
                      background: "var(--ui-bg-input)",
                      border: "1px solid var(--ui-border-input)",
                      color: "var(--ui-text-primary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <FileText size={14} />
                    View PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Desktop: table ── */
          <div style={{
            overflow: "hidden", borderRadius: 8,
            background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
          }}>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 150px 120px 110px 100px",
              padding: "10px 16px",
              background: "var(--ui-bg-input)",
              borderBottom: "1px solid var(--ui-border)",
            }}>
              {["BAST / PO Number", "Date", "Status", "Document ID", ""].map((h, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, color: "var(--ui-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  textAlign: i === 4 ? "right" : "left",
                }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {basts.map((bast, idx) => (
              <div
                key={bast.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 150px 120px 110px 100px",
                  padding: "13px 16px",
                  borderBottom: idx < basts.length - 1 ? "1px solid var(--ui-border-subtle)" : "none",
                  alignItems: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ui-bg-input)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ui-text-primary)" }}>
                    {bast.po_number}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontFamily: "monospace", marginTop: 2 }}>
                    {bast.bast_number}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ui-text-secondary)" }}>
                  <Clock size={12} style={{ flexShrink: 0 }} />
                  {bast.bast_date}
                </div>

                <div><StatusBadge status={bast.status} /></div>

                <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600 }}>
                  {bast.id.substring(0, 8)}...
                </div>

                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => handleViewDetails(bast.id)}
                    style={{
                      padding: "6px 12px", borderRadius: 6,
                      background: "var(--ui-bg-input)",
                      border: "1px solid var(--ui-border-input)",
                      color: "var(--ui-text-primary)",
                      fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "border-color 0.15s",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--huntr-orange)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ui-border-input)")}
                  >
                    <FileText size={13} />
                    View PDF
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
