import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { apiGet, apiPost } from "../lib/api";
import { getAssetUrl } from "../lib/assets";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  DollarSign,
  Calendar,
  Package,
  Building2,
  FileText,
  X,
} from "lucide-react";

/**
 * Manager Approvals Page
 * Displays awarded proposals awaiting manager approval.
 * Only visible when user role is 'manager'.
 */
export default function ManagerApprovals() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);

  useEffect(() => {
    const activeUserStr = localStorage.getItem("active_user");
    if (activeUserStr) {
      const user = JSON.parse(activeUserStr);
      setActiveUser(user);

      // Only load if user is manager
      if (user.role === "manager") {
        fetchAwaitingApprovals();
      } else {
        setLoading(false);
        setError("Only managers can access this page");
      }
    } else {
      setLoading(false);
      setError("User not logged in");
    }
  }, []);

  const fetchAwaitingApprovals = async () => {
    setLoading(true);
    const activeCompStr = localStorage.getItem("active_company");
    if (!activeCompStr) {
      setError("No active company context found.");
      setLoading(false);
      return;
    }
    const comp = JSON.parse(activeCompStr);
    
    try {
      // Fetch all proposals with winner_status = 'awarded' passing company_id
      const response = await apiGet(`/api/proposals/manager/awaiting-approval?company_id=${comp.id}`);
      setApprovals(response.proposals || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    const userSession = localStorage.getItem("user_session");
    const user = userSession ? JSON.parse(userSession) : null;

    setApprovingId(proposalId);
    setError(null);
    try {
      const response = await apiPost(`/api/proposals/${proposalId}/approve`, {
        proposal_id: proposalId,
        user_id: user?.id,
      });
      setSuccessMessage("✓ Winner approved successfully!");

      // Remove from list and refresh
      setApprovals(approvals.filter((p) => p.id !== proposalId));
      setSelectedProposal(null);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to approve proposal");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <Layout title="Manager Approvals" subtitle="Review and approve awarded proposals...">
        <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
          <Loader2 className="animate-spin" color="var(--huntr-orange)" size={48} />
        </div>
      </Layout>
    );
  }

  if (activeUser?.role !== "manager") {
    return (
      <Layout title="Manager Approvals" subtitle="Restricted access">
        <div style={errorBoxStyle}>
          <AlertCircle size={16} /> This page is only accessible to managers.
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Manager Approvals"
      subtitle={`${approvals.length} award${approvals.length !== 1 ? "s" : ""} awaiting your approval`}
    >
      <div style={{ width: "100%", display: "flex", gap: 32, paddingBottom: 60 }}>
        {/* Left: List of pending approvals */}
        <div style={{ flex: 1 }}>
          {error && (
            <div style={errorBoxStyle}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                ...errorBoxStyle,
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                color: "#10b981",
                marginBottom: 24,
              }}
            >
              {successMessage}
            </div>
          )}

          {approvals.length === 0 ? (
            <div style={emptyStateStyle}>
              <CheckCircle2 size={48} color="var(--ui-text-muted)" style={{ marginBottom: 16, opacity: 0.2 }} />
              <div style={{ color: "var(--ui-text-primary)", fontSize: 15, fontWeight: 700 }}>
                No Pending Approvals
              </div>
              <div style={{ color: "var(--ui-text-muted)", fontSize: 13, marginTop: 4 }}>
                All proposals have been reviewed.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {approvals.map((proposal) => (
                <div
                  key={proposal.id}
                  onClick={() => setSelectedProposal(proposal)}
                  style={{
                    ...approvalCardStyle,
                    border:
                      selectedProposal?.id === proposal.id
                        ? "2px solid var(--huntr-orange)"
                        : "1px solid var(--ui-border)",
                    cursor: "pointer",
                    background:
                      selectedProposal?.id === proposal.id
                        ? "var(--ui-bg-input)"
                        : "var(--ui-bg-card)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <Clock size={24} color="var(--huntr-orange)" />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ui-text-brand)", textTransform: "uppercase" }}>
                        {proposal.buyer_name}
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--ui-text-primary)", margin: "2px 0" }}>
                        {proposal.rfq_title}
                      </h4>
                      <div style={{ fontSize: 12, color: "var(--ui-text-secondary)", marginTop: 4 }}>
                        {proposal.company_name} • Rp {Number(proposal.price_offer).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>
                    Awarded {new Date(proposal.awarded_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detailed view and approval button */}
        {selectedProposal && (
          <div style={{ flex: 1, position: "sticky", top: 20, height: "fit-content" }}>
            <div style={detailPanelStyle}>
              <button
                onClick={() => setSelectedProposal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "var(--ui-text-secondary)",
                }}
              >
                <X size={20} />
              </button>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ui-text-primary)", margin: "16px 0" }}>
                Complete Offer Details
              </h3>

              {/* RFQ Info */}
              <div style={detailSectionStyle}>
                <div style={sectionLabelStyle}>Request Details</div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Title:</span>
                  <span style={detailValueStyle}>{selectedProposal.rfq_title}</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Buyer:</span>
                  <span style={detailValueStyle}>{selectedProposal.buyer_name}</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>RFQ ID:</span>
                  <span style={detailValueStyle}>#{selectedProposal.rfq_id ? String(selectedProposal.rfq_id).substring(0, 8).toUpperCase() : ""}</span>
                </div>
              </div>

              {/* Vendor Info */}
              <div style={detailSectionStyle}>
                <div style={sectionLabelStyle}>Selected Vendor</div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Company:</span>
                  <span style={detailValueStyle}>{selectedProposal.company_name}</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Participants:</span>
                  <span style={detailValueStyle}>{selectedProposal.total_participants || "N/A"}</span>
                </div>
              </div>

              {/* Offer Details */}
              <div style={detailSectionStyle}>
                <div style={sectionLabelStyle}>Offer Details</div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Price:</span>
                  <span style={{ ...detailValueStyle, color: "#10b981", fontWeight: 800 }}>
                    Rp {Number(selectedProposal.price_offer).toLocaleString("id-ID")}
                  </span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Delivery:</span>
                  <span style={detailValueStyle}>{selectedProposal.delivery_days} days</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Warranty:</span>
                  <span style={detailValueStyle}>{selectedProposal.warranty_months} months</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Payment:</span>
                  <span style={detailValueStyle}>{selectedProposal.payment_term || "Not specified"}</span>
                </div>
                {(selectedProposal.document_url || selectedProposal.document_path) && (
                  <div style={detailRowStyle}>
                    <span style={detailKeyStyle}>Document:</span>
                    <a
                      href={selectedProposal.document_url || getAssetUrl(selectedProposal.document_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--huntr-orange)", textDecoration: "none", fontWeight: 700 }}
                    >
                      <FileText size={12} style={{ display: "inline", marginRight: 4 }} />
                      View Document
                    </a>
                  </div>
                )}
              </div>

              {/* Approval Info */}
              <div style={detailSectionStyle}>
                <div style={sectionLabelStyle}>Status</div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Awarded By:</span>
                  <span style={detailValueStyle}>{selectedProposal.awarded_by_user_name || "System"}</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailKeyStyle}>Awarded Date:</span>
                  <span style={detailValueStyle}>{new Date(selectedProposal.awarded_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleApprove(selectedProposal.id)}
                disabled={approvingId === selectedProposal.id}
                style={{
                  width: "100%",
                  background: approvingId === selectedProposal.id ? "var(--ui-bg-input)" : "var(--huntr-orange)",
                  border: "none",
                  borderRadius: 12,
                  padding: 12,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: approvingId === selectedProposal.id ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 20,
                  opacity: approvingId === selectedProposal.id ? 0.7 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {approvingId === selectedProposal.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Approve Winner
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const approvalCardStyle: React.CSSProperties = {
  background: "var(--ui-bg-card)",
  border: "1px solid var(--ui-border)",
  borderRadius: 12,
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "all 0.2s ease",
};

const detailPanelStyle: React.CSSProperties = {
  background: "var(--ui-bg-card)",
  border: "1px solid var(--ui-border)",
  borderRadius: 12,
  padding: 24,
  display: "flex",
  flexDirection: "column",
};

const detailSectionStyle: React.CSSProperties = {
  marginBottom: 20,
  paddingBottom: 16,
  borderBottom: "1px solid var(--ui-border)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "var(--ui-text-brand)",
  textTransform: "uppercase",
  marginBottom: 12,
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  marginBottom: 8,
};

const detailKeyStyle: React.CSSProperties = {
  color: "var(--ui-text-secondary)",
  fontWeight: 600,
};

const detailValueStyle: React.CSSProperties = {
  color: "var(--ui-text-primary)",
  fontWeight: 700,
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  padding: 80,
  background: "var(--ui-bg-card)",
  borderRadius: 12,
  border: "1px dashed var(--ui-border)",
};

const errorBoxStyle: React.CSSProperties = {
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.2)",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 12,
  color: "#f87171",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 600,
  marginBottom: 24,
};
